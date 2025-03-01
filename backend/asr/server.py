from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from funasr import AutoModel
import numpy as np
import pyaudio
app = FastAPI()

# 加载流式模型
model = AutoModel(model="paraformer-zh-streaming", model_revision="v2.0.4", disable_update=True)

# 音频配置
RATE = 16000  # 采样率
FORMAT = pyaudio.paInt16  # 16位采样
CHUNK = 960  # 每帧960个采样点 (20ms 音频块)
chunk_size_config = [0, 40, 5]  # 推理配置
chunk_stride = chunk_size_config[1] * CHUNK  # 每个 chunk 的帧数

# WebSocket 处理函数
async def handle_websocket(websocket: WebSocket):
    await websocket.accept()  # 接受连接
    cache = {}  # 模型的上下文缓存
    buffer = np.array([], dtype=np.float32)  # 初始化缓冲区
    result = ""  # 累计结果字符串

    try:
        while True:
            # 接收前端音频数据 (bytes)
            data = await websocket.receive_bytes()

            # 将字节数据转换为 NumPy 数组并归一化到 [-1, 1]
            audio_data = np.frombuffer(data, dtype=FORMAT).astype(np.float32) / 32768.0

            # 将音频追加到缓冲区
            buffer = np.concatenate((buffer, audio_data))

            # 检查缓冲区是否有足够的数据进行推理
            while len(buffer) >= chunk_stride:
                # 取出一个 chunk 进行处理
                speech_chunk = buffer[:chunk_stride]
                buffer = buffer[chunk_stride:]  # 移除已处理部分

                # 调用模型进行推理
                res = model.generate(input=speech_chunk, cache=cache, is_final=False,
                                     chunk_size=chunk_size_config, encoder_chunk_look_back=4, decoder_chunk_look_back=1)

                # 如果模型返回有效结果，发送到前端
                if res and res[0]["text"]:
                    # 追加到累计结果字符串
                    result += res[0]["text"]
                    print(f"当前识别结果: {result}")

                    # 只发送本次推理结果而非累计结果，减少前端处理负担
                    await websocket.send_text(res[0]["text"])

    except WebSocketDisconnect:
        print("客户端断开连接")
    except Exception as e:
        print(f"发生错误: {e}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 入口，用于处理音频流
    """
    await handle_websocket(websocket)
