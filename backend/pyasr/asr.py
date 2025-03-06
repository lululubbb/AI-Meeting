from fastapi import FastAPI, WebSocket
import nls
import asyncio
import threading

app = FastAPI()

# 阿里云配置（需替换为实际值）
ALIYUN_CONFIG = {
    "url": "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1",
    "token": "yourToken",
    "appkey": "yourAppkey"
}

class TranscriptionHandler:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.transcriber = None
        self.lock = threading.Lock()

    def on_result_chg(self, message, *args):
        asyncio.run(self.websocket.send_json({
            "type": "interim",
            "text": message.get("result", "")
        }))

    def on_sentence_end(self, message, *args):
        asyncio.run(self.websocket.send_json({
            "type": "final",
            "text": message.get("result", "")
        }))

    async def process_audio(self):
        with self.lock:
            self.transcriber = nls.NlsSpeechTranscriber(
                url=ALIYUN_CONFIG["url"],
                token=ALIYUN_CONFIG["token"],
                appkey=ALIYUN_CONFIG["appkey"],
                on_result_changed=self.on_result_chg,
                on_sentence_end=self.on_sentence_end,
                on_error=self.on_error
            )
            
            self.transcriber.start(
                aformat="pcm",
                sample_rate=16000,
                enable_intermediate_result=True,
                enable_punctuation_prediction=True,
                enable_inverse_text_normalization=True
            )

    def on_error(self, message, *args):
        print(f"Error: {message}")

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    handler = TranscriptionHandler(websocket)
    
    # 启动阿里云SDK处理线程
    threading.Thread(target=handler.process_audio).start()
    
    try:
        while True:
            # 接收前端音频数据
            data = await websocket.receive_bytes()
            if handler.transcriber:
                handler.transcriber.send_audio(data)
    except Exception as e:
        print(f"WebSocket closed: {e}")
    finally:
        handler.transcriber.shutdown()