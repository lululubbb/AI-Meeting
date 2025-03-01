<!-- src/components/AudioRecorder.vue -->
<template>
  <div class="audio-recorder">
    <div class="recorder-header">
      <h2>实时语音识别</h2>
      <div class="status-indicator" :class="{ active: isRecording }">
        <span class="status-dot"></span>
        <span class="status-text">{{ isRecording ? '录音中...' : '准备就绪' }}</span>
      </div>
    </div>
    
    <div class="control-buttons">
      <button 
        @click="startRecording" 
        :disabled="isRecording" 
        class="start-button"
        :class="{ disabled: isRecording }">
        <i class="icon-mic"></i>
        开始录音
      </button>
      <button 
        @click="stopRecording" 
        :disabled="!isRecording" 
        class="stop-button"
        :class="{ disabled: !isRecording }">
        <i class="icon-stop"></i>
        停止录音
      </button>
    </div>
    
    <p v-if="status && status !== '准备就绪'" class="status-message">{{ status }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    
    <div class="transcription-container">
      <h3>实时转录结果</h3>
      
      <!-- 分段显示转录结果 -->
      <div class="transcription-box" ref="transcriptionBox">
        <!-- 已完成的段落 -->
        <div v-for="segment in segments" :key="segment.id" class="segment">
          <div class="segment-header">
            <span class="timestamp">{{ segment.timestamp }}</span>
          </div>
          <div class="segment-content">{{ segment.text }}</div>
        </div>
        
        <!-- 当前正在转录的段落 -->
        <div v-if="currentSegment" class="segment current">
          <div class="segment-header">
            <span class="timestamp">{{ currentTimestamp }}</span>
            <span class="recording-indicator">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </span>
          </div>
          <div class="segment-content">
            {{ currentSegment }}
            <span class="cursor"></span>
          </div>
        </div>
      </div>
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
      transcription: "", // 完整转录结果
      segments: [], // 已完成的段落
      currentSegment: "", // 当前正在转录的段落
      currentTimestamp: "", // 当前段落的时间戳
    };
  },
  watch: {
    // 监听转录内容变化，自动滚动到底部
    segments() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    currentSegment() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  methods: {
    scrollToBottom() {
      const container = this.$refs.transcriptionBox;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    async startRecording() {
      try {
        // 清理可能存在的旧状态
        this.stopRecording();
        
        // 重置转录状态
        this.transcription = "";
        this.segments = [];
        this.currentSegment = "";
        this.updateCurrentTimestamp();

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
        this.socket = new WebSocket("ws://localhost:8000/ws");
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
          } else {
            console.warn("WebSocket 未连接，无法发送音频数据");
          }
        };

        // 接收服务端消息
        this.socket.onmessage = (event) => {
          try {
            // 尝试解析为JSON
            const data = JSON.parse(event.data);
            this.handleJsonMessage(data);
          } catch (e) {
            // 如果不是JSON，则视为旧版本的字符流
            const char = event.data;
            this.currentSegment += char;
            this.transcription += char;
          }
        };
      } catch (error) {
        console.error("录音启动失败:", error);
        this.errorMessage = "无法启动录音，请检查麦克风权限或浏览器支持情况。";
      }
    },
    
    handleJsonMessage(data) {
      const type = data.type;
      
      switch (type) {
        case "connection_status":
          this.status = `连接状态: ${data.status}`;
          break;
          
        case "incremental_text":
          // 增量更新当前段落
          this.currentSegment = data.full_current_segment;
          this.updateCurrentTimestamp();
          break;
          
        case "segment_complete":
          // 添加已完成的段落
          this.segments.push(data.segment);
          this.currentSegment = "";
          break;
          
        case "full_transcription":
          // 更新完整转录
          this.transcription = data.text;
          break;
          
        case "all_segments":
          // 更新所有段落
          this.segments = data.segments;
          break;
      }
    },
    
    updateCurrentTimestamp() {
      const now = new Date();
      this.currentTimestamp = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    stopRecording() {
      // 如果正在录音，发送停止命令
      if (this.isRecording && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ command: "stop" }));
      }
      
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
      
      // 如果有当前段落，将其添加到已完成段落
      if (this.currentSegment && this.currentSegment.trim()) {
        this.segments.push({
          id: this.segments.length + 1,
          text: this.currentSegment,
          timestamp: this.currentTimestamp
        });
        this.currentSegment = "";
      }
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
  margin: 30px auto;
  max-width: 900px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 25px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.recorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.recorder-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.8em;
  font-weight: 600;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background-color: #e8f5e9;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #bdbdbd;
  margin-right: 8px;
  transition: all 0.3s ease;
}

.status-indicator.active .status-dot {
  background-color: #4caf50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

.status-text {
  font-size: 0.9em;
  color: #666;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.start-button {
  background-color: #2196f3;
  color: white;
}

.start-button:hover:not(.disabled) {
  background-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stop-button {
  background-color: #f44336;
  color: white;
}

.stop-button:hover:not(.disabled) {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
}

.icon-mic, .icon-stop {
  margin-right: 8px;
  font-size: 1.1em;
}

.icon-mic::before {
  content: "🎤";
}

.icon-stop::before {
  content: "⏹️";
}

.status-message {
  color: #666;
  font-size: 0.9em;
  margin: 10px 0;
}

.error-message {
  color: #d32f2f;
  font-size: 0.9em;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 6px;
  margin: 15px 0;
}

.transcription-container {
  margin-top: 30px;
}

.transcription-container h3 {
  margin-bottom: 15px;
  font-size: 1.3em;
  color: #333;
  text-align: left;
  font-weight: 600;
}

.transcription-box {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: #fafafa;
  padding: 20px;
  height: 400px;
  overflow-y: auto;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: left;
}

.segment {
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.segment.current {
  border-left: 3px solid #2196f3;
  background-color: #e3f2fd;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85em;
}

.timestamp {
  color: #757575;
  font-weight: 500;
  background-color: #f5f5f5;
  padding: 3px 8px;
  border-radius: 4px;
}

.recording-indicator {
  display: flex;
  align-items: center;
}

.recording-indicator .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #2196f3;
  margin: 0 2px;
  opacity: 0.6;
}

.recording-indicator .dot:nth-child(1) {
  animation: blink 1.4s infinite 0.2s;
}

.recording-indicator .dot:nth-child(2) {
  animation: blink 1.4s infinite 0.4s;
}

.recording-indicator .dot:nth-child(3) {
  animation: blink 1.4s infinite 0.6s;
}

@keyframes blink {
  0% {
    opacity: 0.2;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}

.segment-content {
  font-size: 1.05em;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #2196f3;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink-cursor 1s step-end infinite;
}

@keyframes blink-cursor {
  from, to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.transcription-box::-webkit-scrollbar {
  width: 8px;
}

.transcription-box::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.transcription-box::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 4px;
}

.transcription-box::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}

@media (max-width: 768px) {
  .audio-recorder {
    margin: 20px 10px;
    padding: 15px;
  }
  
  .recorder-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .status-indicator {
    margin-top: 10px;
  }
  
  .control-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  button {
    width: 100%;
  }
  
  .transcription-box {
    height: 300px;
  }
}
</style>
