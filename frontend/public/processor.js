// 创建 public/processor.js 文件
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input.length > 0) {
      const channelData = input[0]
      this.port.postMessage(channelData)
    }
    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)