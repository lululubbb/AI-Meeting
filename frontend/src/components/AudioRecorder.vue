<!-- src/components/AudioRecorder.vue -->
<template>
  <div class="audio-recorder">
    <h2>实时语音识别</h2>
    <button @click="startRecording" :disabled="isRecording">开始录音</button>
    <button @click="stopRecording" :disabled="!isRecording">停止录音</button>
    <p>{{ status }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <div class="transcription">
      <h3>实时转录结果:</h3>
      <p>{{ transcription }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "AudioRecorder",
  data() {
    return {
      isRecording: false,
      socket: null,
      status: "准备就绪",
      errorMessage: "",
      audioContext: null,
      audioWorkletNode: null,
      audioStream: null,
      transcription: "", // 用于存储实时的转录结果
    };
  },
  methods: {
    async startRecording() {
      try {
        // 清理可能存在的旧状态
        this.stopRecording();

        // 请求麦克风权限
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioStream = stream;

        // 创建 AudioContext
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

        // 添加 AudioWorklet 处理器
        await this.audioContext.audioWorklet.addModule("/processor.js");
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, "audio-processor");

        // 连接音频流
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.audioWorkletNode);

        // 建立 WebSocket 连接
        this.socket = new WebSocket("ws://192.168.79.63:8000/ws");
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
          console.log("WebSocket 连接已建立");
          this.status = "WebSocket 已连接，开始发送音频...";
          this.isRecording = true;
          this.errorMessage = "";
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket 连接错误:", error);
          this.errorMessage = "WebSocket 连接失败，请检查后端服务是否运行。";
          this.isRecording = false;
        };

        this.socket.onclose = () => {
          console.log("WebSocket 连接已关闭");
          if (this.isRecording) {
            this.status = "WebSocket 已断开，停止录音";
          }
          this.isRecording = false;
        };

        // 监听来自 AudioWorklet 的音频数据
        this.audioWorkletNode.port.onmessage = (event) => {
          const audioBuffer = event.data;
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(audioBuffer);
            console.log("发送音频块大小:", audioBuffer.byteLength);
          } else {
            console.warn("WebSocket 未连接，无法发送音频数据");
          }
        };

        // 接收服务端逐字符转录结果
        this.socket.onmessage = (event) => {
          const char = event.data; // 接收到逐字符结果
          console.log("接收到字符:", char); // 调试信息
          this.transcription += char; // 拼接字符到转录结果
        };
      } catch (error) {
        console.error("录音启动失败:", error);
        this.errorMessage = "无法启动录音，请检查麦克风权限或浏览器支持情况。";
      }
    },
    stopRecording() {
      if (this.audioWorkletNode) {
        this.audioWorkletNode.port.postMessage({ command: "stop" });
        this.audioWorkletNode.disconnect();
        this.audioWorkletNode = null;
      }
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      if (this.audioStream) {
        this.audioStream.getTracks().forEach((track) => track.stop());
        this.audioStream = null;
      }
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      this.isRecording = false;
      this.status = "已停止录音";
    },
  },
  beforeDestroy() {
    this.stopRecording(); // 清理资源
  },
};
</script>

<style scoped>
.audio-recorder {
  text-align: center;
  margin-top: 50px;
}
button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
}
.error {
  color: red;
  font-size: 14px;
}
.transcription {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}
</style>
