import pyaudio
import nls
import json
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
import uuid
import asyncio
from queue import Queue
import threading

# 阿里云配置
URL = "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1"
TOKEN = "279cf2233bcd4d2489300f0a5a87d6ab"
APPKEY = "wvpwo9lGGSkfMHfn"

# 音频参数配置
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 512


class SpeechRecognizer:
    def __init__(self, session_id, loop):
        self.transcriber = nls.NlsSpeechTranscriber(
            url=URL,
            token=TOKEN,
            appkey=APPKEY,
            on_result_changed=self.on_result,
            on_completed=self.on_completed,
            on_error=self.on_error
        )
        self.session_id = session_id
        self.loop = loop
        self.message_queue = Queue()
        self.websocket = None
        self.final_result = ""
        self.last_result = ""

        # 启动消息处理线程
        self.thread = threading.Thread(target=self._process_messages)
        self.thread.start()

    def _process_messages(self):
        while True:
            msg_type, data = self.message_queue.get()
            if msg_type == "SHUTDOWN":
                break

            # 在事件循环中异步处理
            asyncio.run_coroutine_threadsafe(
                self._async_send(msg_type, data),
                self.loop
            )

    async def _async_send(self, msg_type, data):
        if self.websocket:
            try:
                if msg_type == "INTERMEDIATE":
                    await self.websocket.send_text(f"[INTERMEDIATE]{data}")
                elif msg_type == "FINAL":
                    await self.websocket.send_text(f"[FINAL]{data}")
                elif msg_type == "ERROR":
                    await self.websocket.send_text(f"[ERROR]{data}")
            except Exception as e:
                print(f"Session {self.session_id} send error: {e}")

    def on_result(self, message, *args):
        try:
            data = json.loads(message)
            current_result = data.get('payload', {}).get('result', '')

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
                self.message_queue.put(("INTERMEDIATE", self.final_result))

        except Exception as e:
            self.message_queue.put(("ERROR", str(e)))

    def on_completed(self, message, *args):
        try:
            data = json.loads(message)
            final_result = data.get('payload', {}).get('result', '')
            self.final_result = final_result or self.final_result
            self.message_queue.put(("FINAL", self.final_result))
            print(f"Session {self.session_id} completed")
        except Exception as e:
            self.message_queue.put(("ERROR", str(e)))
        finally:
            self.final_result = ""
            self.last_result = ""

    def on_error(self, message, *args):
        error_msg = f"Session {self.session_id} error: {message}"
        print(error_msg)
        self.message_queue.put(("ERROR", error_msg))

    async def stop(self):
        self.message_queue.put(("SHUTDOWN", None))
        self.thread.join()
        self.transcriber.stop()
        self.transcriber.shutdown()


# 会话管理
class SessionManager:
    def __init__(self, loop):
        self.active_sessions = {}
        self.loop = loop

    async def create_session(self, websocket):
        session_id = str(uuid.uuid4())
        recognizer = SpeechRecognizer(session_id, self.loop)
        recognizer.websocket = websocket
        self.active_sessions[session_id] = recognizer
        return recognizer

    async def remove_session(self, session_id):
        if session_id in self.active_sessions:
            await self.active_sessions[session_id].stop()
            del self.active_sessions[session_id]


# FastAPI生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    app.state.session_manager = SessionManager(loop)
    yield
    # 清理所有会话
    for session_id in list(app.state.session_manager.active_sessions.keys()):
        await app.state.session_manager.remove_session(session_id)


app = FastAPI(lifespan=lifespan)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_manager = app.state.session_manager
    recognizer = await session_manager.create_session(websocket)

    try:
        recognizer.transcriber.start(
            aformat="pcm",
            sample_rate=RATE,
            enable_intermediate_result=True,
            enable_punctuation_prediction=True
        )
        while True:
            data = await websocket.receive_bytes()
            recognizer.transcriber.send_audio(data)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await session_manager.remove_session(recognizer.session_id)


@app.get("/")
async def get():
    return HTMLResponse(content=open("index.html").read())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4321, ws_ping_timeout=300)