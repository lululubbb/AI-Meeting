import pyaudio
import numpy as np
from funasr import AutoModel
import time
import torch
import re
import signal
import sys
from collections import deque
from threading import Lock, Thread


def get_portaudio_version():
    """解析PortAudio版本号"""
    version = pyaudio.get_portaudio_version()
    return (
        (version >> 16) & 0xff,  # 主版本
        (version >> 8) & 0xff,  # 次版本
        version & 0xff  # 修订号
    )


# 检查PortAudio版本 >= 2.4
pa_version = get_portaudio_version()
if pa_version < (2, 4, 0):
    print(f"需要PortAudio v2.4+ (当前版本 {'.'.join(map(str, pa_version))})")
    sys.exit(1)

# 设备配置
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"使用设备: {device}\n")

# 音频参数
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK_MS = 30  # 每次读取的音频块时长（毫秒）
CHUNK = int(RATE * CHUNK_MS / 1000)  # 480 samples

# 模型参数
CHUNK_SIZE_MS = 200  # 模型处理的块大小（毫秒）
CHUNK_STEP_MS = 60  # 模型处理步长（毫秒）
CONTEXT_LEFT = 4  # 左侧上下文块数
CONTEXT_RIGHT = 2  # 右侧上下文块数

# 计算模型相关参数
chunk_size_samples = int(CHUNK_SIZE_MS * RATE / 1000)
chunk_stride_samples = int(CHUNK_STEP_MS * RATE / 1000)
chunk_size_config = [CONTEXT_LEFT, CHUNK_SIZE_MS // CHUNK_MS, CONTEXT_RIGHT]

# 初始化音频系统
audio = pyaudio.PyAudio()
stream = audio.open(
    format=FORMAT,
    channels=CHANNELS,
    rate=RATE,
    input=True,
    frames_per_buffer=CHUNK,
    start=False
)

# 加载模型
model = AutoModel(
    model="paraformer-zh-streaming",
    device=device,
    model_revision="v2.0.4",
    disable_update=True,
    show_progress_bar=False
)

# 共享资源
buffer_lock = Lock()
audio_buffer = np.array([], dtype=np.float32)
result_queue = deque(maxlen=5)  # 保存最近5个结果


# 信号处理
def signal_handler(sig, frame):
    print("\n\033[33m正在关闭...\033[0m")
    stream.stop_stream()
    stream.close()
    audio.terminate()
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)


def normalize_audio(data):
    """音频归一化处理"""
    return np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0


def process_buffer():
    """处理音频缓冲区"""
    global audio_buffer
    with buffer_lock:
        while len(audio_buffer) >= chunk_stride_samples:
            # 计算上下文窗口
            start = max(0, len(audio_buffer) - chunk_size_samples - CONTEXT_RIGHT * chunk_stride_samples)
            chunk = audio_buffer[start:]

            # 执行ASR推理
            res = model.generate(
                input=chunk,
                cache={},
                is_final=False,
                chunk_size=chunk_size_config,
                encoder_chunk_look_back=CONTEXT_LEFT,
                decoder_chunk_look_back=1
            )

            # 处理识别结果
            if res and res[0]['text']:
                text = re.sub(r'[^\u4e00-\u9fffA-Za-z]', '', res[0]['text'])
                if text:
                    result_queue.append(text)

            # 维护缓冲区（保留最后2个步长的数据）
            retain_samples = CONTEXT_RIGHT * chunk_stride_samples
            audio_buffer = audio_buffer[-retain_samples:] if len(audio_buffer) > retain_samples else audio_buffer


def display_loop():
    """独立显示线程"""
    last_text = ""
    while True:
        if result_queue:
            new_text = " ".join(result_queue)
            if new_text != last_text:
                # 使用ANSI转义码优化显示
                sys.stdout.write("\033[K")  # 清除行
                sys.stdout.write(f"\r\033[34m实时识别：\033[0m \033[1m{new_text}\033[0m")
                sys.stdout.flush()
                last_text = new_text
        time.sleep(0.1)


if __name__ == "__main__":
    # 启动显示线程
    display_thread = Thread(target=display_loop, daemon=True)
    display_thread.start()

    print("\033[32m开始实时语音识别（按Ctrl+C停止）\033[0m")
    stream.start_stream()

    try:
        while True:
            # 读取音频数据
            data = stream.read(CHUNK, exception_on_overflow=False)
            chunk_audio = normalize_audio(data)

            # 更新缓冲区
            with buffer_lock:
                audio_buffer = np.concatenate([audio_buffer, chunk_audio])

            # 处理缓冲区
            process_buffer()

    except Exception as e:
        print(f"\n发生错误：{str(e)}")
        signal_handler(None, None)