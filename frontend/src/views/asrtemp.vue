<!-- SpeechTranscription.vue -->
<template>
    <div class="container">
      <button @click="toggleTranscription">
        {{ isRecording ? '停止转录' : '开始实时转录' }}
      </button>
      <div class="result-box">
        <p v-for="(msg, index) in messages" :key="index">{{ msg }}</p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const isRecording = ref(false)
  const messages = ref<string[]>([])
  let mediaRecorder: MediaRecorder | null = null
  let websocket: WebSocket | null = null
  
  const initWebSocket = () => {
    websocket = new WebSocket('ws://localhost:8000/ws/transcribe')
  
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'interim') {
        messages.value[messages.value.length - 1] = data.text
      } else if (data.type === 'final') {
        messages.value.push(data.text + '。')
      }
    }
  
    websocket.onclose = () => {
      console.log('WebSocket connection closed')
    }
  }
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      })
  
      mediaRecorder.ondataavailable = async (event) => {
        if (websocket?.readyState === WebSocket.OPEN) {
          const buffer = await event.data.arrayBuffer()
          websocket.send(buffer)
        }
      }
  
      mediaRecorder.start(500) // 每500ms发送一次数据
      initWebSocket()
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }
  
  const stopRecording = () => {
    mediaRecorder?.stop()
    mediaRecorder = null
    websocket?.close()
  }
  
  const toggleTranscription = () => {
    if (!isRecording.value) {
      messages.value = []
      startRecording()
    } else {
      stopRecording()
    }
    isRecording.value = !isRecording.value
  }
  </script>
  
  <style scoped>
  .container {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  button {
    padding: 12px 24px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .result-box {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    min-height: 200px;
  }
  </style>