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
          <img src="../assets/上传.png" alt="发送文件" class="icon"  width="24" height="24" />
          <span>发送文件</span>
        </button>
        <input ref="fileInput" style="display:none;" type="file" @change="onFileInputChange" />  <!-- 移到这里 -->
      </div>
    </div>

    <div class="chat-messages" ref="chatMessages">
      <div v-for="(msg,index) in chatMessagesList" :key="index" :class="['message-bubble', { 'is-me': msg.isMe, 'file-message': msg.file }]">
        <div class="message-meta">
          <div class="user-avatar">
            <img :src="msg.avatar || defaultAvatar" alt="用户头像"  @error="onAvatarError(msg)" />          </div>
          <div class="message-info">
            <span class="username">{{ msg.senderName }}</span>
            <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <div v-if="msg.file" class="file-container">
          <div class="file-info">
            <img src="../assets/文件.png" class="file-icon" alt="文件" />
            <div class="file-details">
              <span class="file-name">{{ msg.file.name }}</span>
              <span class="file-size">{{ formatFileSize(msg.file.size) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <button @click.stop="downloadFile(msg)" class="action-button download">
              <img src="../assets/下载.png" alt="下载" />
            </button>
            <button @click.stop="openAiAssistant(msg)" class="action-button analyze">
              <img src="../assets/分析.png" alt="分析" />
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
import defaultAvatar from '../assets/柴犬.png';
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

const onAvatarError = (msg) => {
  msg.avatar = defaultAvatar; // 回退到默认头像
};

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
watch(
  () => props.chatMessagesList,
  () => {
    nextTick(() => scrollToBottom());
  },
  { deep: true }
);
</script>
  
<style scoped>
  /* 整体容器 */
  .chat-container {
    
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #f7f7f7; /* 浅灰色背景，更柔和 */
    border-radius: 0;  /* 移动端通常无圆角 */
    box-shadow: none; /*移除框阴影*/
    overflow: hidden;
    height: 90vh;
    
  }

  /* 头部样式 */
  .chat-header {
    padding: 12px 18px; /* 减小内边距 */
    background: #fff; /* 头部白色背景 */
    color: #333;    /* 深色文字 */
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #eaeaea;  /* 浅灰色底部边框 */
    box-shadow: none;
  }

  .header-title {
    font-size: 17px; /* 调整字体大小 */
    font-weight: 600;
    letter-spacing: 0.3px;
    margin: 0;
  }

  /* 接收者选择样式 */
  .select-wrapper {
    position: relative;
    background: rgba(0, 0, 0, 0.05); /* 轻微的背景 */
    border-radius: 18px; /* 圆角 */
    padding: 4px 10px; /* 紧凑的内边距 */
  }

  .receiver-select {
    background: transparent;
    border: none;
    color: #444; /* 深灰 */
    font-size: 14px;
    padding: 2px 6px; /* 微调内边距 */
     appearance: none;
  }
   label {
      font-size: 14px;
      color:#888;
      margin-right:2px;
  }
  /* 文件上传按钮 */
.icon-button {
    background: transparent; /*移除文件上传按钮背景色*/
    border: none;
    border-radius: 12px;
    padding: 8px 14px;
    color: #1071e7; /*蓝色*/
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.icon-button:hover {
    background: rgba(26, 115, 232, 0.1); /* 鼠标悬停时加上淡淡的蓝色背景 */
}

  /* 消息区域 */
  .chat-messages {
    flex: 1;
    padding: 14px; /* 减少边距 */
    background: transparent;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 7px; /* 减少间距 */
  }

  /* 消息气泡 */
/* 原有 .message-bubble 样式 */
.message-bubble {
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 15px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease;
  word-wrap: break-word;  /* 新增：兼容旧浏览器 */
  word-break: break-all;  /* 新增：强制中文/长单词换行 */
}

/* 新增 .message-content 样式 */
.message-content {
  white-space: pre-line;   /* 自动换行并保留手动换行 */
  word-break: break-word;  /* 长单词或URL自动换行 */
  padding: 8px 0;          /* 可选：内外边距 */
}

/* 媒体查询中的额外调整 */
@media (max-width: 480px) {
  .message-content {
    word-break: break-all; /* 小屏幕强制严格换行 */
  }
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
        background: #e2f7cb; /* 浅绿色背景 */
        color: #3c921f;     /* 深绿色文字 */
        align-self: flex-end;
        border-radius: 15px 15px 3px 15px; /* 调整圆角 */
    }

    /* 消息元信息 */
.message-meta {
    display: flex;
    align-items: center;
    gap: 8px;   /* 缩小头像和昵称之间的距离 */
    margin-bottom: 4px;  /* 头像和消息内容之间的距离 */
}
     .user-avatar {
    width: 32px;  /* 缩小头像大小 */
    height: 32px;
    border-radius: 50%; /* 头像圆形 */
    overflow: hidden;  /* 确保图片不溢出 */
  }
 .user-avatar img{
      width: 100%;
    height: 100%;
    object-fit: cover;/*头像图片裁剪*/
 }
  .message-info {
    display: flex;
    flex-direction: column;   /* 垂直排列用户名和时间 */
  }
  .username {
    font-size: 14px; /* 用户名 */
    color: #555;
    font-weight:500;
  }
  .timestamp {
    font-size: 11px; /* 时间戳 */
    color: #999;
  }

/* 文件消息样式 */
.file-container {
  background: rgba(240, 240, 240, 0.9); /* 更轻的背景 */
  border-radius: 10px;  /* 微调圆角 */
  padding: 12px; /* 减小内边距 */
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

}

.file-details {
    flex: 1;
}

.file-name {
    font-weight: 500;
      font-size: 13px; /* 调整字体大小 */
    color: #444;
}

.file-size {
     color: #777;  /* 微调颜色 */
    font-size: 11px;  /* 减小字体大小 */
}

  /* 输入区域 */
  .chat-input {
    padding: 10px 15px; /* 调整内边距 */
    background: white;
    border-top: 1px solid #eaeaea;
  }
  .chat-input input {
    width: 70%;
    padding: 10px 15px; /* 调整内边距 */
    border: none !important;
    border-radius: 22px;  /* 更大的圆角 */
    font-size: 15px;
    background: #f7f7f7;  /* 输入框背景 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
    transition: all 0.2s ease;
  }

  .chat-input input:focus {
    box-shadow: 0 0 0 2px rgba(42, 122, 226, 0.2); /* 聚焦时阴影 */
    outline: none; 
  }

  .chat-input button {
    position: absolute;
    right: 20px; /* 微调位置 */
    top: 97%;
    transform: translateY(-50%);
    background: #398af5;/*发送按钮背景色*/
    color: white;
    border: none;
    padding: 7px 14px; /* 微调内边距 */
    border-radius: 18px; /* 圆角 */
    box-shadow: 0 2px 6px rgba(26, 115, 232, 0.3); /* 阴影 */
  }
  .chat-input button:hover {
    background: #1A73E8;/*发送按钮背景色*/
  }

/* 文件操作按钮 */
.file-actions {
    display: flex;
    gap: 8px;   /* 调整按钮间距 */
    margin-top: 8px; /* 调整按钮与文件信息的间距 */
}

.action-button {
    padding: 5px 10px; /* 调整按钮大小 */
    border-radius: 15px;  /* 调整圆角 */
    display: flex;        /* 使用flex布局 */
    align-items: center;  /* 垂直居中 */
    justify-content: center; /* 水平居中 */
    background-color: rgba(0, 0, 0, 0.08);
    border: none;
}

.action-button img {
    width: 18px;  /* 调整图标大小 */
    height: 18px;
}
.action-button.download {
     color: #28a745; /* 下载按钮绿色 */
  }

.action-button.analyze {
    color: #17a2b8; /* 分析按钮蓝色 */
}

 .file-progress-indicator{
    color:#777;
    margin-top:5px;
    font-size: 12px;
 }

  /* 进度条样式 */
.upload-progress {
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    margin: 8px;
    font-size: 13px;
    color: #666;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}
.upload-progress button{
     margin-left: 10px;
    padding: 2px 5px;
    border-radius: 5px;
    font-size: 12px;
      background-color: rgba(0,0,0,0.03);
}
/*取消按钮*/
.upload-progress button:hover{
   background-color: rgba(0,0,0,0.1); /* 鼠标悬停时加深背景 */
}
  /* 响应式调整 - 更窄的屏幕 */
  @media (max-width: 480px) {
    .chat-messages {
      padding: 8px;  /* 更小的内边距 */
    }
    .message-bubble {
        max-width: 85%;
        font-size:14px;
    }
    .chat-input {
      padding: 8px 12px; /* 更小的内边距 */
    }
    .chat-input input {
      font-size: 14px; /* 字体 */
    }
      .header-title {
    font-size: 16px; /*更小屏幕下 字体调小*/
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
