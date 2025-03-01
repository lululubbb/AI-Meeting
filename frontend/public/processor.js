// processor.js - 音频处理器
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096; // 缓冲区大小
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.isRecording = true;

    // 监听来自主线程的消息
    this.port.onmessage = (event) => {
      if (event.data.command === 'stop') {
        this.isRecording = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    // 如果不在录音状态，直接返回
    if (!this.isRecording) return false;

    // 获取输入音频数据
    const input = inputs[0];
    if (!input || !input.length) return true;

    const channel = input[0];
    if (!channel) return true;

    // 将音频数据添加到缓冲区
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.bufferIndex++] = channel[i];

      // 当缓冲区满时，发送数据并重置缓冲区
      if (this.bufferIndex >= this.bufferSize) {
        // 转换为 Int16 格式 (16位PCM)
        const int16Buffer = new Int16Array(this.bufferSize);
        for (let j = 0; j < this.bufferSize; j++) {
          // 将 Float32 [-1, 1] 转换为 Int16 [-32768, 32767]
          int16Buffer[j] = Math.max(-32768, Math.min(32767, Math.floor(this.buffer[j] * 32768)));
        }

        // 发送数据到主线程
        this.port.postMessage(int16Buffer.buffer, [int16Buffer.buffer]);

        // 重置缓冲区
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
