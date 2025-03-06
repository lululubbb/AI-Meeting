<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3 class="header-title">会议聊天室</h3>
      <div class="header-controls">
        <div class="select-wrapper">
          <label>发送至:</label>
          <select v-model="internalSelectedReceiverId" class="receiver-select">
            <option value="0">所有人</option>
            <option v-for="userItem in chatReceivers" :key="userItem.userId" :value="userItem.userId">
              {{ userItem.displayName }}
            </option>
          </select>
        </div>
        <button @click="triggerFileInput" class="icon-button">
          <img src="../assets/file-upload.svg" alt="发送文件" class="icon" />
          <span>文件</span>
        </button>
        <input ref="fileInput" style="display:none;" type="file" @change="onFileInputChange" />  <!-- 移到这里 -->
      </div>
    </div>

    <div class="chat-messages" ref="chatMessages">
      <div v-for="(msg,index) in chatMessagesList" :key="index" :class="['message-bubble', { 'is-me': msg.isMe, 'file-message': msg.file }]">
        <div class="message-meta">
          <div class="user-avatar">
            <img :src="msg.avatar || '../assets/default-avatar.png'" alt="用户头像" />
          </div>
          <div class="message-info">
            <span class="username">{{ msg.senderName }}</span>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <div v-if="msg.file" class="file-container">
          <div class="file-info">
            <img src="../assets/file-icon.svg" class="file-icon" alt="文件" />
            <div class="file-details">
              <span class="file-name">{{ msg.file.name }}</span>
              <span class="file-size">{{ formatFileSize(msg.file.size) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <button @click.stop="downloadFile(msg)" class="action-button download">
              <img src="../assets/download-cloud.svg" alt="下载" />
            </button>
            <button @click.stop="openAiAssistant(msg)" class="action-button analyze">
              <img src="../assets/sparkles.svg" alt="分析" />
            </button>
          </div>
          <div v-if="msg.fileDownloadProgress !== undefined" class="file-progress-indicator">
            下载进度: {{ msg.fileDownloadProgress }}%
            <span v-if="msg.fileDownloadStatus === 'Fail'">下载失败</span>
            <span v-if="msg.fileDownloadStatus === 'Cancel'">已取消</span>
          </div>
        </div>
        <div v-else class="message-content">
          {{ msg.message }}
        </div>
      </div>
    </div>

    <div class="chat-input">
      <input v-model="chatInput" type="text" placeholder="输入消息" @keyup.enter="sendChat" />
      <button @click="sendChat" class="send-button">发送</button>
    </div>

    <div v-if="uploadProgressInfo" class="upload-progress">
      <p>
        文件 "{{ uploadProgressInfo.fileName }}" 上传中:
        {{ uploadProgressInfo.progress }}%
        <button @click="cancelSendFile">取消</button>
      </p>
      <p v-if="uploadProgressInfo.status === 'Fail'">上传失败</p>
      <p v-if="uploadProgressInfo.status === 'Cancel'">上传已取消</p>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  nextTick,
  defineProps,
  defineEmits,
  defineExpose,
  watch
} from 'vue';
import {
  showSnackBar
} from '../utils/utils.js'; // 假设的路径
import ZoomVideoService from '../services/ZoomVideoService.js';

// 定义 props
const props = defineProps({
  chatMessagesList: {
    type: Array,
    required: true,
  },
  chatReceivers: {
    type: Array,
    required: true,
  },
  selectedReceiverId: {
    type: [Number, String],
    required: true,
  },
  uploadProgressInfo: {
    type: Object,
    default: null,
  },
});

const internalSelectedReceiverId = ref(props.selectedReceiverId);

// 使用 watch 来同步 selectedReceiverId 的变化
watch(() => props.selectedReceiverId, (newValue) => {
  internalSelectedReceiverId.value = newValue;
});

watch(internalSelectedReceiverId, (newValue) => {
  emit("update:selectedReceiverId", newValue);
});

// 定义 emits
const emit = defineEmits(['update:selectedReceiverId', 'send-chat', 'trigger-file-input', 'file-input-change', 'cancel-send-file', 'download-file', 'open-ai-assistant']);

// 定义 refs
const chatInput = ref('');
const chatMessages = ref(null);
const fileInput = ref(null);

// 方法
const sendChat = () => {
  emit('send-chat', chatInput.value.trim());
  chatInput.value = '';
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const onFileInputChange = (event) => {
  emit('file-input-change', event);
};

const cancelSendFile = () => {
  emit('cancel-send-file');
};

const downloadFile = (msg) => {
  emit('download-file', msg);
};

const openAiAssistant = (msg) => {
  emit('open-ai-assistant', msg);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};

// 暴露方法
defineExpose({
  scrollToBottom,
});

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('zh-CN', {  // 根据你的地区和需求调整
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 使用24小时制
});
return formatter.format(date);
};

// 格式化文件大小
const formatFileSize = (size) => {
 if (size === null || size === undefined) return '';
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
};

</script>
  
<style scoped>
/* 整体容器 */
.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    height: 100vh;
}

/* 头部样式 */
.chat-header {
    padding: 16px 20px;
    background: linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin: 0;
}

/* 接收者选择样式 */
.select-wrapper {
    position: relative;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 6px 12px;
}

.receiver-select {
    background: transparent;
    border: none;
    color: white;
    font-size: 14px;
    padding: 2px 8px;
    appearance: none;
}

/* 文件上传按钮 */
.icon-button {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 12px;
    padding: 8px 14px;
    color: white;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.icon-button:hover {
    background: rgba(255, 255, 255, 0.25);
}

/* 消息区域 */
.chat-messages {
    flex: 1;
    padding: 16px;
    background: #F8F9FF;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* 消息气泡 */
.message-bubble {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 18px;
    background: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.is-me {
    background: #1A73E8;
    color: white;
    align-self: flex-end;
    border-radius: 18px 18px 4px 18px;
}

/* 文件消息样式 */
.file-container {
    background: rgba(245, 245, 245, 0.9);
    border-radius: 12px;
    padding: 14px;
    backdrop-filter: blur(4px);
}

.file-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.file-icon {
    width: 32px;
    height: 32px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.file-details {
    flex: 1;
}

.file-name {
    font-weight: 500;
    font-size: 14px;
}

.file-size {
    color: #666;
    font-size: 12px;
}

/* 输入区域 */
.chat-input {
    position: relative;
    padding: 16px;
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.chat-input input {
    width: 100%;
    padding: 14px 20px;
    border: 1px solid #E0E0E0;
    border-radius: 28px;
    font-size: 15px;
    background: #F8F9FF;
    transition: all 0.2s ease;
}

.chat-input input:focus {
    border-color: #1A73E8;
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.chat-input button {
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    background: #1A73E8;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
}

/* 进度条样式 */
.upload-progress {
    padding: 12px 16px;
    background: #F8F9FF;
    border-radius: 12px;
    margin: 8px 16px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 移动端适配 */
@media (max-width: 768px) {
    .chat-container {
        border-radius: 0;
    }

    .chat-header {
        padding: 12px 16px;
    }

    .header-title {
        font-size: 16px;
    }

    .chat-input input {
        padding: 12px 16px;
    }

    .file-container {
        padding: 12px;
    }
}

/* 操作按钮动效 */
.action-button {
    transition: all 0.2s ease;
    transform: scale(1);
}

.action-button:hover {
    transform: scale(1.08);
}

.action-button:active {
    transform: scale(0.95);
}
</style>
