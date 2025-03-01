from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import pyaudio

app = FastAPI()

# 音频配置
FORMAT = pyaudio.paInt16  # 16位采样
CHANNELS = 1  # 单声道
RATE = 16000  # 采样率
CHUNK = 960  # 确保为 960（20ms 音频块）

# 初始化 PyAudio
audio = pyaudio.PyAudio()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 处理函数，用于接收音频数据并实时播放。
    """
    # 打开音频输出流
    output_stream = audio.open(format=FORMAT,
                               channels=CHANNELS,
                               rate=RATE,
                               output=True,
                               frames_per_buffer=CHUNK)
    await websocket.accept()
    print("WebSocket 连接已建立")
    try:
        while True:
            # 接收前端发送的音频数据 (bytes)
            data = await websocket.receive_bytes()
            print(f"接收音频块大小: {len(data)} bytes")  # 调试信息

            # 将数据写入音频流，确保为 PCM 格式
            output_stream.write(data)
    except WebSocketDisconnect:
        print("WebSocket 连接已断开")
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        # 关闭音频流
        output_stream.stop_stream()
        output_stream.close()
        print("音频流已关闭")
