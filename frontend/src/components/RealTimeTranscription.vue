<template>
  <div 
    class="realtime-transcription-container"
    :style="{ transform: `translate(${position.x}px, ${position.y}px)` }"
    :class="{ dragging: isDragging }"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="stopDrag"
    @mouseleave="stopDrag"
  >
    <div 
      class="realtime-transcription-icon"
      :class="{ expanded: isExpanded }"
      @click="toggleExpand"
    >
      <span class="icon">🎤</span>
      <span 
        class="close-btn"
        v-if="isExpanded"
        @click.stop="toggleExpand"
      >×</span>
    </div>

    <transition name="slide-fade">
      <div 
        v-if="isExpanded"
        class="realtime-transcription"
      >
        <button @click="toggleRecording" :disabled="isConnecting">
          {{ isRecording ? '停止转录' : '开始转录' }}
        </button>
        <div class="transcription-output">
          <p v-for="(line, index) in transcriptionLines" :key="index">{{ line }}</p>
          <p v-if="isRecording && transcriptionLines.length === 0" class="transcription-placeholder">
            转录中 (麦克风)...
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';

const isExpanded = ref(false);
const isDragging = ref(false);
const position = ref({ x: 20, y: 20 });
const dragStartPos = ref({ x: 0, y: 0 });

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
onMounted(() => {
  window.addEventListener('beforeunload', disconnectWebsocket);
});

onUnmounted(() => {
  disconnectWebsocket();
  window.removeEventListener('beforeunload', disconnectWebsocket);
});


const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

const connectWebsocket = () => { /* ... connectWebsocket函数保持不变 ...*/
    return new Promise((resolve, reject) => {
        isConnecting.value = true; //  开始连接时设置为 true

        const ws = new WebSocket('ws://localhost:4321/ws');

        ws.onopen = () => {
            console.log('WebSocket connected');
            isConnecting.value = false; // 连接成功后设置为 false
            resolve(ws); // 解析 Promise
        };

        ws.onmessage = (event) => {
            handleWebsocketMessage(event.data);
        };

        ws.onclose = (event) => {
            isRecording.value = false;
            transcription.value = '';
            console.log('WebSocket closed:', event.code, event.reason);
          websocket.value = null;
          if (event.code === 1000) {
            ElMessage.success("转录正常结束")
                // 正常关闭, 什么都不做
            }
            else {
                // 意外断开
                showError("转录服务连接已断开，正尝试重连...");

                //  5 秒后重连 (可选)
                setTimeout(() => {
                    connectWebsocket().then(newWs => {
                      websocket.value = newWs;
                      // startSendingAudio();  //  如果之前在录制, 重新开始发送
                    }).catch(err => {
                        console.error('重连失败', err);
                    });
                  }, 5000);
                }
            };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          isConnecting.value = false; // 连接出错时也设置为 false
          reject(error); // 拒绝 Promise
          showError("转录服务连接出错，请检查后端服务是否正常启动");
        };
    });
};

async function startRecording() {
  try {
    if (!websocket.value) {
      websocket.value = await connectWebsocket();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
     // 设置 audio context  的采样率
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000,});
    const source = audioContext.value.createMediaStreamSource(stream);
    // 不再需要指定大的缓冲区大小，让它自动处理
     // 采样率要和后端一致, 16000
    scriptProcessor.value = audioContext.value.createScriptProcessor(0, 1, 1); // bufferSize, inChannels, outChannels

    scriptProcessor.value.onaudioprocess = (event) => {
      // 获取左声道（单声道）的 PCM 数据
      const inputData = event.inputBuffer.getChannelData(0);
      // 将 Float32Array 转换为 Int16Array (后端需要)
      const int16Data = float32ToInt16(inputData);
        //  ArrayBuffer
      sendAudioChunk(int16Data.buffer);
    };

    // 连接节点
    source.connect(scriptProcessor.value);
    scriptProcessor.value.connect(audioContext.value.destination);
    isRecording.value = true;
    transcription.value = ''; // 清空

  } catch (error) {
    console.error('Error starting recording:', error);
     ElMessage.error('无法获取麦克风权限或启动录音:' + error.message);
      if(websocket.value){
         websocket.value.close(1000, "停止转录");
         websocket.value = null;
      }
      isRecording.value = false;
  }
}

function stopRecording() {
    // 断开连接, 停止处理
    if (scriptProcessor.value) {
        scriptProcessor.value.disconnect();
        scriptProcessor.value = null;
    }
    if (audioContext.value) {
        audioContext.value.close();
        audioContext.value = null;
    }
      if(websocket.value){
         websocket.value.send("[DONE]"); //  发送[DONE]
         websocket.value = null;
      }
    isRecording.value = false;
}
// 发送音频
function sendAudioChunk(chunk) {
  if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
    websocket.value.send(chunk);
  }
}
// Float32Array 转 Int16Array
function float32ToInt16(buffer) {
  let l = buffer.length;
  const buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
  }
  return buf;
}
const handleWebsocketMessage = (message) => { 
      // 检查是否是 [FINAL] 或 [INTERMEDIATE] 消息
    if (message.startsWith("[INTERMEDIATE]")) {
        transcription.value =  message.substring(14) ; // 去掉前缀并更新
    } 
      else if (message.startsWith("[FINAL]")) {
        transcription.value = message.substring(7) + "\n";
    }else if (message.startsWith("[ERROR]")) {
      console.error("Transcription error:", message.substring(7));
        showError("转录出错：" + message.substring(7));
    }
      else {
           transcription.value += message + "\n"; // 直接追加
      }

  };
const disconnectWebsocket = () => { /*disconnectWebsocket代码部分保持不变*/
  if (websocket.value) {
    websocket.value.close(1000, "用户主动关闭"); // 正常关闭，code=1000
  }
};
function showError(str){ /*showError代码部分保持不变*/
    ElMessage.error(str)
}
</script>



<style scoped>
.realtime-transcription-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.realtime-transcription-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a73e8, #3d85c6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.realtime-transcription-icon:hover {
  transform: scale(1.1);
}

.realtime-transcription-icon.expanded {
  width: 40px;
  height: 40px;
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
}

.close-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.realtime-transcription {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 300px;
  margin-top: 10px;
  transition: all 0.3s ease;
}

/* 展开动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.realtime-transcription:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.realtime-transcription button {
  background: linear-gradient(135deg, #1a73e8, #3d85c6);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.realtime-transcription button::before {
  content: "🎤";
  font-size: 18px;
}

.realtime-transcription button:hover:not(:disabled) {  /* 鼠标悬停且不禁用 */
  background-color: #3d85c6;
}

.realtime-transcription button:disabled { /* 禁用样式 */
  background-color: #cccccc;
  cursor: not-allowed;
}

.transcription-output {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: #1a73e8 #f0f0f0;
}

.transcription-output::-webkit-scrollbar {
  width: 6px;
}

.transcription-output::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.transcription-output::-webkit-scrollbar-thumb {
  background: #1a73e8;
  border-radius: 4px;
}

.transcription-output p {
  margin: 0 0 8px 0;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.transcription-placeholder {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
</style>
