import pyaudio
import nls
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
import uuid
import asyncio
from queue import Queue
import threading
import simpleaudio as sa

# 阿里云配置
URL = "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1"
TOKEN = "bf79ce161b5548ebbb1368cf43098032"
APPKEY = "wvpwo9lGGSkfMHfn"
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 512


class SpeechRecognizer:
    def __init__(self, session_id, user_id, user_name, loop):
        self.transcriber = nls.NlsSpeechTranscriber(
            url=URL,
            token=TOKEN,
            appkey=APPKEY,
            on_result_changed=self.on_result,
            on_completed=self.on_completed,
            on_error=self.on_error,
        )
        self.session_id = session_id
        self.user_id = user_id
        self.user_name = user_name
        self.loop = loop
        self.message_queue = Queue()
        self.websocket = None
        self.final_result = ""
        self.last_result = ""
        self.thread = threading.Thread(target=self._process_messages)
        self.thread.start()

    def _process_messages(self):
        while True:
            msg_type, data = self.message_queue.get()
            if msg_type == "SHUTDOWN":
                print(f"Session {self.session_id}: Shutting down message thread.")
                break
            asyncio.run_coroutine_threadsafe(
                self._async_send(msg_type, data),
                self.loop
            )

    async def _async_send(self, msg_type, data):
        if self.websocket:
            try:
                if msg_type == "INTERMEDIATE":
                    # 发送带有 user_id 和 userName 的消息
                    await self.websocket.send_text(json.dumps({
                        "type": "INTERMEDIATE",
                        "user_id": self.user_id,
                        'userName': self.user_name,
                        "text": data
                    }))
                elif msg_type == "FINAL":
                    await self.websocket.send_text(json.dumps({
                        "type": "FINAL",
                        "user_id": self.user_id,
                        'userName': self.user_name,
                        "text": data
                    }))
                elif msg_type == "ERROR":
                    await self.websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "user_id": self.user_id,
                        'userName': self.user_name,
                        "text": data
                    }))
            except Exception as e:
                print(f"Session {self.session_id} send error: {e}")

    def on_result(self, message, *args):
        try:
            print(f"Session {self.session_id} raw message (on_result): {message}")
            data = json.loads(message)
            current_result = data.get('payload', {}).get('result', '')
            # print(f"Session {self.session_id} intermediate result: {current_result}")

            if current_result and current_result != self.last_result:
                common_length = 0
                min_length = min(len(self.last_result), len(current_result))
                for i in range(1, min_length + 1):
                    if self.last_result[:i] == current_result[:i]:
                        common_length = i
                    else:
                        break
                new_text = current_result[common_length:]
                self.final_result += new_text
                self.last_result = current_result
                self.message_queue.put(("INTERMEDIATE", self.final_result))  # 只传递文本

        except Exception as e:
            print(f"Session {self.session_id} on_result error: {e}")
            self.message_queue.put(("ERROR", str(e)))

    def on_completed(self, message, *args):
        try:
            print(f"Session {self.session_id} raw message (on_completed): {message}")
            data = json.loads(message)
            final_result = data.get('payload', {}).get('result', '')
            self.final_result = final_result or self.final_result
            self.message_queue.put(("FINAL", self.final_result))  # 只传递文本
            print(f"Session {self.session_id} completed")
        except Exception as e:
            print(f"Session {self.session_id} on_completed error: {e}")
            self.message_queue.put(("ERROR", str(e)))
        finally:
            self.final_result = ""
            self.last_result = ""
            self.transcriber.stop()
            self.transcriber.shutdown()

    def on_error(self, message, *args):
        print(f"Session {self.session_id} raw message (on_error): {message}")
        try:
            error_data = json.loads(message)
            error_code = error_data.get("header", {}).get("status")
            error_message = error_data.get("header", {}).get("message")
            error_msg = (f"Session {self.session_id} error: Code={error_code}, "
                         f"Message={error_message}")
        except json.JSONDecodeError:
            error_msg = f"Session {self.session_id} error: {message}"

        print(error_msg)
        self.message_queue.put(("ERROR", error_msg))

    async def stop(self):
        self.message_queue.put(("SHUTDOWN", None))
        self.thread.join()
        self.transcriber.stop()
        self.transcriber.shutdown()


class SessionManager:
    def __init__(self, loop):
        self.active_sessions = {}
        self.loop = loop
        self.connections = {}  # 存储所有 websocket 连接

    async def create_session(self, websocket, user_id, user_name):
        session_id = str(uuid.uuid4())
        recognizer = SpeechRecognizer(session_id, user_id, user_name, self.loop)
        recognizer.websocket = websocket
        self.active_sessions[session_id] = recognizer
        self.connections[websocket] = session_id
        print(f"New session created: {session_id} for user: {user_id}")
        return recognizer

    async def remove_session(self, session_id):
        if session_id in self.active_sessions:
            await self.active_sessions[session_id].stop()
            del self.active_sessions[session_id]

            # 从 connections 中移除对应的 websocket
            for ws, sid in list(self.connections.items()):  # 使用 list 避免 RuntimeError
                if sid == session_id:
                    del self.connections[ws]
                    break
            print(f"Session removed: {session_id}")
        else:
            print(f"Session {session_id} not found for removal.")

    async def broadcast(self, message):
        for websocket in self.connections.keys():
            try:
                await websocket.send_text(message)
            except Exception as e:
                print(f"广播错误:{e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    app.state.session_manager = SessionManager(loop)
    print("Application startup.")
    yield
    print("Application shutdown.")
    for session_id in list(app.state.session_manager.active_sessions.keys()):
        await app.state.session_manager.remove_session(session_id)


app = FastAPI(lifespan=lifespan)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str = None):
    await websocket.accept()
    session_manager = app.state.session_manager

    # 获取用户名
    user_name = websocket.query_params.get('user_name')
    # 如果没有提供 user_id，则生成一个
    if user_id is None:
        user_id = str(uuid.uuid4())
        print(f"No user_id provided, generated: {user_id}")
    recognizer = await session_manager.create_session(websocket, user_id, user_name)

    try:
        recognizer.transcriber.start(
            aformat="pcm",
            sample_rate=RATE,
            enable_intermediate_result=True,
            enable_punctuation_prediction=True,
            # enable_voice_detection=False,
        )

        audio_buffer = bytearray()

        while True:
            data = await websocket.receive_bytes()
            print("接收数据", data)
            audio_buffer.extend(data)

            if len(audio_buffer) > 0:
                try:
                    #  播放
                    pass
                except Exception as e:
                    print(f"Audio Playback error: {e}")

                recognizer.transcriber.send_audio(audio_buffer)
                 #  发送音频给 NLS 后，立即广播
                if recognizer.final_result != '' : # 只有当识别出了内容才广播
                    msg = json.dumps({
                        "type": "INTERMEDIATE",
                        "user_id": recognizer.user_id,
                        "userName": recognizer.user_name,
                        "text": recognizer.final_result
                    })
                    await session_manager.broadcast(msg)
                audio_buffer = bytearray()

            if data == b"[DONE]":
                print("Received [DONE] message, stopping transcriber...")
                #  on_completed 里处理
                break

    except WebSocketDisconnect:
        print(f"Client disconnected.")
    except Exception as e:
        print(f"WebSocket error: {type(e).__name__}: {e}")
    finally:
        await session_manager.remove_session(recognizer.session_id)
    #  移除 finally 块中的错误广播逻辑


@app.get("/")
async def get():
    return HTMLResponse(content=open("index.html").read())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4321, ws_ping_timeout=300)
