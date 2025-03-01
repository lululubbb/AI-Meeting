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
model = AutoModel(model="paraformer-zh-streaming", device=device, model_revision="v2.0.4", disable_update=True)
for param in model.model.parameters():
    print(param.device)
    break

model2=AutoModel(model="ct-punc", device=device,disable_update=True)

# 配置 ASR 推理参数
chunk_size_config = [0, 20, 5]  # 根据模型配置
chunk_stride = chunk_size_config[1] * 960  # 每个chunk的帧数
cache = {}  # 缓存
buffer = np.array([], dtype=np.float32)  # 初始化音频缓冲区
def remove_non_chinese(text):
    """
    移除非中文字符，仅保留中文字符。
    """
    # 使用正则表达式匹配中文字符
    chinese_characters = re.findall(r'[\u4e00-\u9fff]', text)
    # 将匹配到的中文字符列表合并成一个字符串
    return ''.join(chinese_characters)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 接收音频数据并调用 ASR 模型实时识别。
    """
    # 打开音频输出流（用于实时播放）
    output_stream = audio.open(format=FORMAT,
                               channels=CHANNELS,
                               rate=RATE,
                               output=True,
                               frames_per_buffer=CHUNK)
    await websocket.accept()
    print("WebSocket 连接已建立")
    result = ""  # 实时识别结果
    global buffer  # 使用全局缓冲区
    try:
        while True:
            # 接收前端发送的音频数据
            data = await websocket.receive_bytes()
            # print(f"接收音频块大小: {len(data)} bytes")  # 调试信息

            # 播放实时音频
            output_stream.write(data)

            # 将字节数据转换为 numpy 数组
            audio_data = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0  # 归一化

            # 追加到缓冲区
            buffer = np.concatenate((buffer, audio_data))

            # 检查缓冲区是否有足够的数据进行推理
            while len(buffer) >= chunk_stride:
                # 取出一个 chunk
                speech_chunk = buffer[:chunk_stride]
                buffer = buffer[chunk_stride:]  # 移除已处理的部分

                # 进行推理
                res = model.generate(input=speech_chunk, cache=cache, is_final=False,
                                     chunk_size=chunk_size_config, encoder_chunk_look_back=4, decoder_chunk_look_back=1)

                # # 打印和累积识别结果
                # if res:
                #     result += res[0]['text']
                #     # print(f"实时识别结果: {res[0]['text']}")
                #     print(result)
                #     asd=model2.generate(input=str(result))
                #     print(asd)
                if res:
                    result += res[0]['text']
                    print("实时识别结果:", result)

                    # 清理结果文本，仅保留中文字符
                    clean_result = remove_non_chinese(result)

                    # 标点预测
                    try:
                        # 将清理后的文本直接作为字符串传入 ct-punc 模型
                        asd = model2.generate(input=clean_result)
                        print("标点预测结果:", asd)
                    except Exception as e:
                        print(f"标点预测发生错误: {e}")


    except WebSocketDisconnect:
        print("WebSocket 连接已断开")
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        # 关闭音频流
        output_stream.stop_stream()
        output_stream.close()
        print("音频流已关闭")
