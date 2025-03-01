from funasr import AutoModel
import pyaudio
import numpy as np
import time
import threading
import tkinter as tk
from queue import Queue

# 音频参数
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 960  # 60ms

# 模型配置
class StreamingASRSystem:
    def __init__(self):
        # 初始化ASR模型
        self.asr_model = AutoModel(
            model="paraformer-zh-streaming",
            model_revision="v2.0.4",
            disable_update=True
        )
        
        # 初始化标点模型
        self.punc_model = AutoModel(
            model="ct-punc",
            disable_update=True
        )
        
        # 流式处理参数
        self.chunk_size = [0, 8, 4]  # 480ms窗口
        self.chunk_stride = 8 * CHUNK
        self.cache = {}
        
        # 音频缓冲区
        self.audio_buffer = np.array([], dtype=np.float32)
        self.text_buffer = ""
        
        # 线程通信队列
        self.asr_queue = Queue(maxsize=10)
        self.punc_queue = Queue(maxsize=10)
        
        # 状态标志
        self.is_running = False

    def asr_process(self):
        """实时语音识别线程"""
        while self.is_running:
            if len(self.audio_buffer) >= self.chunk_stride:
                chunk = self.audio_buffer[:self.chunk_stride]
                self.audio_buffer = self.audio_buffer[self.chunk_stride:]
                
                # ASR推理
                res = self.asr_model.generate(
                    input=chunk,
                    cache=self.cache,
                    is_final=False,
                    chunk_size=self.chunk_size
                )
                
                if res:
                    self.asr_queue.put(res[0]['text'])

    def punc_process(self):
        """标点恢复线程"""
        while self.is_running:
            if not self.asr_queue.empty():
                text = self.asr_queue.get()
                self.text_buffer += text
                
                # 标点恢复（每500ms处理一次）
                if len(self.text_buffer) > 8:  # 至少8个字符处理
                    punc_text = self.punc_model.generate(
                        input=self.text_buffer
                    )[0]['text']
                    
                    self.punc_queue.put(punc_text)
                    self.text_buffer = ""

# GUI界面
class Application(tk.Tk):
    def __init__(self, system):
        super().__init__()
        self.system = system
        
        # 窗口设置
        self.title("实时语音识别系统")
        self.geometry("800x400")
        
        # 文本显示区
        self.text_box = tk.Text(
            self,
            font=("Arial", 14),
            wrap=tk.WORD
        )
        self.text_box.pack(expand=True, fill=tk.BOTH)
        
        # 控制按钮
        self.btn_frame = tk.Frame(self)
        self.start_btn = tk.Button(
            self.btn_frame,
            text="开始",
            command=self.start
        )
        self.stop_btn = tk.Button(
            self.btn_frame,
            text="停止",
            command=self.stop
        )
        self.start_btn.pack(side=tk.LEFT, padx=5)
        self.stop_btn.pack(side=tk.LEFT)
        self.btn_frame.pack(pady=10)
        
        # 更新线程
        self.update_thread = threading.Thread(target=self.update_text)
        self.update_thread.daemon = True

    def start(self):
        """启动识别"""
        if not self.system.is_running:
            self.system.is_running = True
            
            # 启动音频采集
            self.audio_thread = threading.Thread(target=self.audio_capture)
            self.audio_thread.start()
            
            # 启动处理线程
            self.asr_thread = threading.Thread(target=self.system.asr_process)
            self.punc_thread = threading.Thread(target=self.system.punc_process)
            
            self.asr_thread.start()
            self.punc_thread.start()
            self.update_thread.start()

    def stop(self):
        """停止识别"""
        self.system.is_running = False
        self.audio_thread.join(timeout=1)
        self.asr_thread.join(timeout=1)
        self.punc_thread.join(timeout=1)

    def audio_capture(self):
        """音频采集"""
        pa = pyaudio.PyAudio()
        stream = pa.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
        
        while self.system.is_running:
            data = stream.read(CHUNK, exception_on_overflow=False)
            audio_data = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            self.system.audio_buffer = np.concatenate((self.system.audio_buffer, audio_data))
            
        stream.stop_stream()
        stream.close()
        pa.terminate()

    def update_text(self):
        """更新文本显示"""
        while self.system.is_running:
            if not self.system.punc_queue.empty():
                text = self.system.punc_queue.get()
                self.text_box.insert(tk.END, text + " ")
                self.text_box.see(tk.END)
            time.sleep(0.1)

if __name__ == "__main__":
    # 初始化系统
    asr_system = StreamingASRSystem()
    
    # 启动GUI
    app = Application(asr_system)
    app.mainloop()