<template>
  <div class="transcription-container">
    <button 
      @click="toggleTranscription" 
      :disabled="isTranscribing"
      class="transcribe-btn"
    >
      {{ isTranscribing ? '停止实时转录' : '开始实时转录' }}
    </button>
    
    <div v-if="isTranscribing" class="subtitle-display">
      {{ currentSubtitle }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isTranscribing: false,
      currentSubtitle: '',
      audioContext: null,
      processor: null,
      websocket: null
    }
  },
  methods: {
    async toggleTranscription() {
      if (this.isTranscribing) {
        await this.stopTranscription()
      } else {
        await this.startTranscription()
      }
    },

    async startTranscription() {
      try {
        // 1. 获取用户媒体流
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 2. 创建音频处理管道
        this.audioContext = new AudioContext();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        
        // 3. 建立WebSocket连接
        this.websocket = new WebSocket('ws://localhost:8000/ws/transcribe');
        this.websocket.binaryType = 'arraybuffer';
        
        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.currentSubtitle = data.text;
        };
        
        // 4. 开始处理音频
        this.processor.onaudioprocess = (e) => {
          if (!this.isTranscribing) return;
          
          // 转换Float32到Int16
          const pcmData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            int16[i] = Math.min(1, pcmData[i]) * 0x7FFF;
          }
          
          // 发送二进制数据
          this.websocket.send(int16.buffer);
        };
        
        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
        
        this.isTranscribing = true;
      } catch (error) {
        console.error('启动失败:', error);
      }
    },

    async stopTranscription() {
      // 停止处理
      this.isTranscribing = false;
      this.processor.disconnect();
      this.audioContext.close();
      this.websocket.close();
      this.currentSubtitle = '';
    }
  },
  beforeDestroy() {
    this.stopTranscription();
  }
}
</script>

<style scoped>
.transcribe-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.subtitle-display {
  margin-top: 10px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 4px;
}
</style>