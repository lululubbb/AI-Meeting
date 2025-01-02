// processor.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data.command === 'stop') {
        this.disconnect();
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      const int16Array = new Int16Array(channelData.length);

      // 将 Float32 转为 Int16
      for (let i = 0; i < channelData.length; i++) {
        let s = Math.max(-1, Math.min(1, channelData[i])); // 限制值在 -1 到 1 之间
        int16Array[i] = Math.round(s * (s < 0 ? 0x8000 : 0x7FFF)); // 确保精度
      }

      // 如果块太大，则按 CHUNK 大小拆分发送
      const CHUNK_SIZE = 960; // 确保与后端一致
      for (let i = 0; i < int16Array.length; i += CHUNK_SIZE) {
        const chunk = int16Array.slice(i, i + CHUNK_SIZE);
        this.port.postMessage(chunk.buffer, [chunk.buffer]);
      }
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
