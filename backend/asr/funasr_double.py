import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import pyaudio
import numpy as np
from funasr import AutoModel
import time
import torch
import re

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
model = AutoModel(model="paraformer-zh-streaming", device=device, model_revision="v2.0.4", disable_update=True, show_progress_bar=False)

# 检查模型是否加载到正确设备
for param in model.model.parameters():
    print(param.device)
    break

# 配置 ASR 推理参数
chunk_size_config = [0, 20, 5]  # 根据模型配置
chunk_stride = chunk_size_config[1] * 960  # 每个chunk的帧数

# 使用字典存储每个用户的 buffer 和 cache
user_data = {}

def remove_non_chinese(text):
    """
    移除非中英文字符，仅保留中英文字符。
    """
    chinese_english_characters = re.findall(r'[\u4e00-\u9fffA-Za-z]', text)
    return ''.join(chinese_english_characters)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # 为每个用户分配独立的音频流
    output_stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, output=True, frames_per_buffer=CHUNK)
    await websocket.accept()
    print("WebSocket 连接已建立")

    # 初始化用户数据
    user_id = id(websocket)  # 使用 WebSocket 对象的 ID 作为用户唯一标识
    user_data[user_id] = {
        "buffer": np.array([], dtype=np.float32),
        "cache": {}
    }

    try:
        while True:
            # 接收音频数据
            data = await websocket.receive_bytes()
            output_stream.write(data)

            # 获取该用户的 buffer 和 cache
            buffer = user_data[user_id]["buffer"]
            cache = user_data[user_id]["cache"]

            # 处理音频数据
            audio_data = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            buffer = np.concatenate((buffer, audio_data))

            while len(buffer) >= chunk_stride:
                speech_chunk = buffer[:chunk_stride]
                buffer = buffer[chunk_stride:]

                # 推理
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

            # 更新用户的 buffer
            user_data[user_id]["buffer"] = buffer

    except WebSocketDisconnect:
        print(f"WebSocket 连接已断开: 用户 {user_id}")
    finally:
        # 清理资源
        output_stream.stop_stream()
        output_stream.close()
        if user_id in user_data:
            del user_data[user_id]  # 移除用户数据
        print("音频流已关闭")


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
