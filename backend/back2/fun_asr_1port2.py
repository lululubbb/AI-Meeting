import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import pyaudio
import numpy as np
from funasr import AutoModel
import time
import torch
import re
import datetime

# 检查CUDA是否可用
if torch.cuda.is_available():
    device = "cuda"
    print("CUDA可用，使用GPU进行推理。")
else:
    device = "cpu"
    print("CUDA不可用，使用CPU进行推理。")

app = FastAPI()

# 音频配置
FORMAT = pyaudio.paInt16  # 16位采样
CHANNELS = 1  # 单声道
RATE = 16000  # 采样率
CHUNK = 960  # 确保为 960（20ms 音频块）

# 初始化 PyAudio
audio = pyaudio.PyAudio()

# 加载流式 ASR 模型
model = AutoModel(model="paraformer-zh-streaming", device=device, model_revision="v2.0.4", disable_update=True,show_progress_bar=False)

# 检查模型是否加载到正确设备
for param in model.model.parameters():
    print(param.device)
    break

# 配置 ASR 推理参数
chunk_size_config = [0, 20, 5]  # 根据模型配置
chunk_stride = chunk_size_config[1] * 960  # 每个chunk的帧数
cache = {}  # 缓存
buffer = np.array([], dtype=np.float32)  # 初始化音频缓冲区


def remove_non_chinese(text):
    """
    移除非中英文字符，仅保留中英文字符。
    """
    # 使用正则表达式匹配中文字符和英文字符
    chinese_english_characters = re.findall(r'[\u4e00-\u9fffA-Za-z]', text)
    # 将匹配到的字符列表合并成一个字符串
    return ''.join(chinese_english_characters)

buffer = np.array([], dtype=np.float32)  # 初始化缓冲区
cache = {}  # 初始化缓存

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    output_stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, output=True, frames_per_buffer=CHUNK)
    await websocket.accept()
    print("WebSocket 连接已建立")
    global buffer

    try:
        while True:
            data = await websocket.receive_bytes()
            output_stream.write(data)

            audio_data = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            buffer = np.concatenate((buffer, audio_data))

            while len(buffer) >= chunk_stride:
                speech_chunk = buffer[:chunk_stride]
                buffer = buffer[chunk_stride:]

                # 记录推理时间
                start_time = time.time()
                res = model.generate(input=speech_chunk, cache=cache, is_final=False,
                                     chunk_size=chunk_size_config, encoder_chunk_look_back=4, decoder_chunk_look_back=1)
                end_time = time.time()
                print(res)
                print(f"推理耗时: {end_time - start_time:.4f} 秒")

                if res:
                    for char in res[0]['text']:
                        clean_char = remove_non_chinese(char)
                        if clean_char:
                            await websocket.send_text(clean_char)

            # 限制缓冲区大小
            if len(buffer) > chunk_stride * 10:
                buffer = buffer[-chunk_stride:]

    except WebSocketDisconnect:
        print("WebSocket 连接已断开")
    finally:
        output_stream.stop_stream()
        output_stream.close()

        print("音频流已关闭")


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8100)
