import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import pyaudio
import numpy as np
from funasr import AutoModel
import torch
import time
import re

# 检查CUDA是否可用
if torch.cuda.is_available():
    device = "cuda"
    print("CUDA可用，使用GPU进行推理。")
else:
    device = "cpu" 
    print("CUDA不可用，使用CPU进行推理。")

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 音频配置
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 960

# 初始化PyAudio
audio = pyaudio.PyAudio()

# 加载模型
asr_model = AutoModel(model="paraformer-zh-streaming", device=device, model_revision="v2.0.4", disable_update=True)
punc_model = AutoModel(model="ct-punc", device=device, disable_update=True)

# ASR配置
chunk_size_config = [0, 20, 5]
chunk_stride = chunk_size_config[1] * 960
asr_cache = {}
buffer = np.array([], dtype=np.float32)

def remove_non_chinese(text):
    """移除非中英文字符"""
    return ''.join(re.findall(r'[\u4e00-\u9fffA-Za-z]', text))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket连接已建立")
    
    output_stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, output=True, frames_per_buffer=CHUNK)
    global buffer
    
    try:
        while True:
            data = await websocket.receive_bytes()
            print(f"Received audio data: {len(data)} bytes")
            output_stream.write(data)
            
            # 处理音频数据
            audio_data = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            print(f"Audio data shape: {audio_data.shape}, min: {np.min(audio_data)}, max: {np.max(audio_data)}")
            buffer = np.concatenate((buffer, audio_data))
            print(f"Buffer size: {len(buffer)}")
            
            while len(buffer) >= chunk_stride:
                speech_chunk = buffer[:chunk_stride]
                buffer = buffer[chunk_stride:]
                
                # ASR推理
                start_time = time.time()
                asr_result = asr_model.generate(
                    input=speech_chunk, 
                    cache=asr_cache,
                    is_final=False,
                    chunk_size=chunk_size_config,
                    encoder_chunk_look_back=4,
                    decoder_chunk_look_back=1
                )
                
                if asr_result:
                    # 标点推断
                    clean_text = remove_non_chinese(asr_result[0]['text'])
                    print(f"识别结果: {clean_text}")
                    if clean_text:
                        punc_result = punc_model.generate(input=clean_text)
                        await websocket.send_text(punc_result[0]['text'])
                        
                print(f"推理耗时: {time.time() - start_time:.4f}秒")
                
            # 限制缓冲区大小
            if len(buffer) > chunk_stride * 10:
                buffer = buffer[-chunk_stride:]
                
    except WebSocketDisconnect:
        print("WebSocket连接已断开")
    finally:
        output_stream.stop_stream()
        output_stream.close()
        print("音频流已关闭")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
