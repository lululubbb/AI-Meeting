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
import simpleaudio as sa  # 导入 simpleaudio

# 阿里云配置
URL = "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1"
TOKEN = "0195232cb99749e68961fefd7717b514"
APPKEY = "wvpwo9lGGSkfMHfn"
# 音频参数配置
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 512  # 这个现在只用于 simpleaudio 播放


class SpeechRecognizer:
    def __init__(self, session_id, loop):
        self.transcriber = nls.NlsSpeechTranscriber(
            url=URL,
            token=TOKEN,
            appkey=APPKEY,
            on_result_changed=self.on_result,
            on_completed=self.on_completed,
            on_error=self.on_error,
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
                print(f"Session {self.session_id}: Shutting down message thread.")
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
            print(f"Session {self.session_id} raw message (on_result): {message}")
            data = json.loads(message)
            current_result = data.get('payload', {}).get('result', '')
            print(f"Session {self.session_id} intermediate result: {current_result}")

            if current_result and current_result != self.last_result:
                # 计算新增部分
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
            print(f"Session {self.session_id} on_result error: {e}")
            self.message_queue.put(("ERROR", str(e)))

    def on_completed(self, message, *args):
        try:
            print(f"Session {self.session_id} raw message (on_completed): {message}")
            data = json.loads(message)
            final_result = data.get('payload', {}).get('result', '')
            self.final_result = final_result or self.final_result
            self.message_queue.put(("FINAL", self.final_result))
            print(f"Session {self.session_id} completed")
        except Exception as e:
            print(f"Session {self.session_id} on_completed error: {e}")
            self.message_queue.put(("ERROR", str(e)))
        finally:
            self.final_result = ""
            self.last_result = ""
             # 在 on_completed 事件中停止并关闭 transcriber
            self.transcriber.stop()
            self.transcriber.shutdown()

    def on_error(self, message, *args):
        print(f"Session {self.session_id} raw message (on_error): {message}")
        try:
            # 尝试解析错误信息，如果能解析则提取错误代码和消息
            error_data = json.loads(message)
            error_code = error_data.get("header", {}).get("status")
            error_message = error_data.get("header", {}).get("message")
            error_msg = (f"Session {self.session_id} error: Code={error_code}, "
                         f"Message={error_message}")
        except json.JSONDecodeError:
            # 如果无法解析 JSON，则直接使用原始消息
            error_msg = f"Session {self.session_id} error: {message}"

        print(error_msg)
        self.message_queue.put(("ERROR", error_msg))


    async def stop(self):
        # 将 SHUTDOWN 消息放入队列，以通知消息处理线程停止
        self.message_queue.put(("SHUTDOWN", None))
        self.thread.join()  # 等待线程完全退出
        self.transcriber.stop()
        self.transcriber.shutdown()



# 会话管理
class SessionManager:
    def __init__(self, loop):
        self.active_sessions = {}  # 存储活动会话
        self.loop = loop

    async def create_session(self, websocket):
        session_id = str(uuid.uuid4())  # 生成唯一的会话 ID
        recognizer = SpeechRecognizer(session_id, self.loop)
        recognizer.websocket = websocket  # 将 websocket 对象与识别器关联
        self.active_sessions[session_id] = recognizer  # 将识别器添加到活动会话字典中
        print(f"New session created: {session_id}")  # 打印新会话创建的消息
        return recognizer

    async def remove_session(self, session_id):
        if session_id in self.active_sessions:
            await self.active_sessions[session_id].stop()  # 停止识别器
            del self.active_sessions[session_id]  # 从活动会话中移除识别器
            print(f"Session removed: {session_id}")  # 打印会话移除的消息
        else:
            print(f"Session {session_id} not found for removal.")


# FastAPI生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    app.state.session_manager = SessionManager(loop)  # 初始化 SessionManager
    print("Application startup.")  # 打印应用启动消息
    yield
    # 清理所有会话
    print("Application shutdown.")  # 打印应用关闭消息
    for session_id in list(app.state.session_manager.active_sessions.keys()):
        await app.state.session_manager.remove_session(session_id)  # 移除所有会话


app = FastAPI(lifespan=lifespan)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_manager = app.state.session_manager
    recognizer = await session_manager.create_session(websocket)

    try:
        recognizer.transcriber.start(
            aformat="pcm",
            sample_rate=RATE,  # 确保采样率正确！
            enable_intermediate_result=True,
            enable_punctuation_prediction=True,
            # enable_voice_detection=False,  # 如果不需要语音活动检测，可以关闭
        )

        audio_buffer = bytearray()  # 用于累积音频数据的缓冲区

        while True:
            data = await websocket.receive_bytes()
            # print(f"Received data type: {type(data)}, size: {len(data)}")

            audio_buffer.extend(data)  # 将接收到的数据添加到缓冲区

            #  处理缓冲区 (这里我们只处理了播放，发送给 NLS 的部分也应该处理)
            # while len(audio_buffer) >= 1024:  # 假设每次处理 1024 字节
                # chunk = audio_buffer[:1024]
                # audio_buffer = audio_buffer[1024:]
            if len(audio_buffer)>0:
                # 播放音频 (同步，阻塞)
                try:
                    print("播放")
                    wave_obj = sa.WaveObject(audio_buffer, CHANNELS, 2, RATE)  # 1 声道, 2 字节/样本, 16000 Hz
                    play_obj = wave_obj.play()
                    play_obj.wait_done()
                except Exception as e:
                    print(f"Audio playback error: {e}")
                recognizer.transcriber.send_audio(audio_buffer)
                audio_buffer = bytearray()  #清空

            if data == b"[DONE]":
                print("Received [DONE] message, stopping transcriber...")
                # await recognizer.transcriber.stop()  #  在 on_completed 里已经 stop 了
                break


    except Exception as e:
        print(f"WebSocket error: {type(e).__name__}: {e}")  # 打印更详细的错误信息
    finally:
        await session_manager.remove_session(recognizer.session_id)



@app.get("/")
async def get():
    return HTMLResponse(content=open("index.html").read())  # 确保你有 index.html


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4321, ws_ping_timeout=300) # 增加超时时间
