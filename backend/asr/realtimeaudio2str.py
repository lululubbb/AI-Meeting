from funasr import AutoModel
import pyaudio
import numpy as np
import time

# 音频参数配置
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 960  # 60ms的音频块

# 流式模型配置
model = AutoModel(
    model="paraformer-zh-streaming",
    model_revision="v2.0.4",
    disable_update=True
)

# 流式处理参数（关键改进）
chunk_size_config = [0, 8, 4]  # 480ms窗口，官方推荐配置
chunk_stride = 8 * CHUNK  # 480ms的音频数据（8*960=7680样本）

# 全局状态
cache = {}
audio_buffer = np.array([], dtype=np.float32)
last_text = ""  # 用于跟踪增量结果

def process_audio_chunk(chunk, is_final=False):
    """处理音频块并返回识别结果"""
    res = model.generate(
        input=chunk,
        cache=cache,
        is_final=is_final,
        chunk_size=chunk_size_config,
        encoder_chunk_look_back=4,
        decoder_chunk_look_back=1
    )
    return res[0]['text'] if res else ""

def handle_incremental_text(current_text):
    """处理增量识别结果（关键改进）"""
    global last_text
    
    # 基础情况：首次识别或完全更新
    if not last_text or not current_text.startswith(last_text):
        last_text = current_text
        return current_text
    
    # 提取新增部分
    new_part = current_text[len(last_text):]
    if new_part:
        last_text = current_text
        return new_part
    return ""

# 初始化音频设备
pa = pyaudio.PyAudio()

# 双工音频流配置（改进异常处理）
try:
    input_stream = pa.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
        start=False
    )
    
    output_stream = pa.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        output=True,
        frames_per_buffer=CHUNK,
        start=False
    )

    input_stream.start_stream()
    output_stream.start_stream()
    
    print("开始双工语音处理，CTRL+C停止...")

    try:
        while True:
            # 读取并播放音频
            raw_data = input_stream.read(CHUNK, exception_on_overflow=False)
            output_stream.write(raw_data)

            # 转换音频格式
            audio_data = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            audio_buffer = np.concatenate((audio_buffer, audio_data))

            # 流式处理循环
            while len(audio_buffer) >= chunk_stride:
                # 提取处理块
                chunk = audio_buffer[:chunk_stride]
                audio_buffer = audio_buffer[chunk_stride:]

                # 实时识别
                current_text = process_audio_chunk(chunk)
                
                # 处理增量结果
                if current_text:
                    incremental = handle_incremental_text(current_text)
                    if incremental:
                        print(f"实时识别: {current_text}")

            time.sleep(0.005)  # 优化CPU占用

    except KeyboardInterrupt:
        print("\n正在处理剩余音频...")
        
        # 处理剩余缓冲
        if len(audio_buffer) > 0:
            final_text = process_audio_chunk(audio_buffer, is_final=True)
            print(f"最终识别: {final_text}")

finally:
    # 确保资源释放
    input_stream.stop_stream()
    output_stream.stop_stream()
    input_stream.close()
    output_stream.close()
    pa.terminate()
    print("音频设备已释放")
