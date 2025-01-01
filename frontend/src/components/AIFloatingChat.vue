<!-- src/components/AIFloatingChat.vue -->
<template>
  <div>
    <button class="ai-float-button" @click="toggleChat">
      <img src="@/assets/AI.png" alt="AI Chat" />
    </button>

    <div v-if="isChatOpen" class="chat-container">
      <div class="chat-header">
        <span>AI助手</span>
        <button @click="toggleChat">×</button>
      </div>
      <!-- 消息列表 -->
      <div class="chat-messages" ref="chatMessages">
        <!-- 使用统一的 .message-row 包裹单条消息，根据 msg.from 动态添加 ai-row / user-row 控制布局 -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-row"
          :class="[msg.from === 'ai' ? 'ai-row' : 'user-row']"
        >
          <!-- AI 消息：左侧头像 -->
          <div v-if="msg.from === 'ai'" class="avatar-container">
            <img src="@/assets/AI.png" alt="AI Avatar" class="avatar" />
          </div>

          <!-- 气泡 -->
          <div
            class="message-bubble"
            :class="[msg.from === 'user' ? 'user-message' : 'ai-message']"
          >
            <span v-html="msg.text"></span>
          </div>

          <!-- 用户消息：右侧头像 -->
          <div v-if="msg.from === 'user'" class="avatar-container">
            <img src="@/assets/user.png" alt="User Avatar" class="avatar" />
          </div>
        </div>

        <!-- AI 正在思考提示 -->
        <div v-if="isLoading" class="loading">
          <span>AI 正在思考...</span>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <input
          v-model="userInput"
          @keyup.enter="sendMessage"
          placeholder="输入您的问题..."
        />
        <button @click="sendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ZoomVideoService from '../services/ZoomVideoService.js'; // 引入 ZoomVideoService
import { showSnackBar } from '../utils/utils.js';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // 引入 useRouter

export default {
  name: 'AIFloatingChat',
  data() {
    return {
      isChatOpen: false,
      messages: [],
      userInput: '',
      isLoading: false,
      isCreatingMeeting: false, // 标记是否在创建会议
    };
  },
  methods: {
    // 切换AI聊天窗口显示
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
      if (this.isChatOpen) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    // 发送消息到AI
    async sendMessage() {
      const message = this.userInput.trim();
      if (message === '') return;

      // 添加用户消息
      this.messages.push({ from: 'user', text: message });
      this.userInput = '';
      this.scrollToBottom();

      try {
        this.isLoading = true;
        console.log('发送消息到AI:', message); // 调试信息

        // 调用后端代理API
        const response = await axios.post('/api/chat/completions', { // 使用相对路径，Vite代理会自动转发
          model: "lite",
          messages: [
            {
              role: "system",
              content: `你是知识渊博的助理。当用户请求创建会议时，请返回如下格式的信息（仅JSON）：
              {
                "action": "create_meeting",
                "meetingName": "会议名称",
                "password": "密码"
              }
              如果不是创建会议的请求，请正常回复。`
            },
            {
              role: "user",
              content: message
            }
          ],
          stream: false
        });

        console.log('AI响应:', response.data); // 调试信息

        if (response.data.code === 0 && response.data.choices.length > 0) {
          const aiReply = response.data.choices[0].message.content.trim();
          
          // 尝试解析AI回复为JSON
          let isCommand = false;
          let commandData = null;
          try {
            commandData = JSON.parse(aiReply);
            if (commandData.action === 'create_meeting') {
              isCommand = true;
            }
          } catch (jsonError) {
            // 不是JSON格式，正常回复
          }

          if (isCommand) {
            // 处理创建会议指令
            this.isCreatingMeeting = true;
            this.messages.push({ from: 'ai', text: '正在创建会议...' });
            this.scrollToBottom();

            await this.handleAIDirectives(commandData);

            this.isCreatingMeeting = false;
          } else {
            // 正常AI回复，添加到聊天
            this.messages.push({ from: 'ai', text: aiReply });
            this.scrollToBottom();
          }
        } else {
          this.messages.push({
            from: 'ai',
            text: '抱歉，我无法回答你的问题。'
          });
        }
      } catch (error) {
        console.error('AI聊天失败:', error.response ? error.response.data : error.message);
        this.messages.push({
          from: 'ai',
          text: '抱歉，我无法回答你的问题。'
        });
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },
    // 滚动到聊天底部
    scrollToBottom() {
      const container = this.$refs.chatMessages;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    // 处理AI指令
    async handleAIDirectives(commandData) {
      console.log('处理AI指令:', commandData); // 调试信息

      const meetingName = commandData.meetingName.trim();
      const meetingPassword = commandData.password ? commandData.password.trim() : '';

      console.log(`解析出的会议名称: ${meetingName}, 密码: ${meetingPassword}`); // 调试信息

      // 获取当前用户的邮箱和用户名
      const userEmail = this.getUserEmail();
      const userName = this.getUserName();

      try {
        // 调用后端API获取JWT
        console.log('请求后端API获取JWT...');
        const jwtResponse = await axios.post('/api/zoom-jwt', {
          sessionName: meetingName,
          role: 1, // 主持人角色
          userIdentity: userEmail, // 使用用户邮箱作为身份标识
          sessionPasscode: meetingPassword
        });

        console.log('后端JWT响应:', jwtResponse.data); // 调试信息

        const jwt = jwtResponse.data.signature;
        if (jwt) {
          // 导航到 VideoCall 页面并传递参数，包括 role
          await this.$router.push({
            name: 'VideoCall',
            query: {
              mode: 'create',
              sessionName: meetingName,
              userName: userName, // 现在是用户邮箱
              sessionPasscode: meetingPassword,
              videoSDKJWT: jwt,
              role: 1 // 添加 role 参数
            }
          });

          showSnackBar(`已创建会议 "${meetingName}" 并加入`);
          // 关闭聊天窗口
          this.isChatOpen = false;
        } else {
          showSnackBar('获取 JWT 失败');
        }
      } catch (error) {
        console.error('获取 JWT 失败:', error.response ? error.response.data : error.message);
        showSnackBar('获取 JWT 失败: ' + (error.response?.data?.error?.message || error.message));
        this.messages.push({ from: 'ai', text: '抱歉，创建会议失败。' });
        this.scrollToBottom();
      }
    },
    // 获取当前用户的邮箱
    getUserEmail() {
      const user = this.$store.getters.getUser;
      console.log('当前用户邮箱:', user.email); // 调试信息
      return user.email || 'unknown@domain.com';
    },
    // 获取当前用户的用户名（使用邮箱作为默认用户名）
    getUserName() {
      const user = this.$store.getters.getUser;
      console.log('当前用户名:', user.email); // 调试信息
      return user.email || `Host_${Date.now()}`;
    }
  }
};
</script>

<style scoped>
/* ======= 悬浮按钮 ======= */
.ai-float-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  width: 80px;
  height: 80px;
  z-index: 0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.ai-float-button img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

/* ======= 聊天窗口容器 ======= */
.chat-container {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 400px;
  max-height: 500px;
  background-color: #bcd9ffe0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ======= 头部 ======= */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #dfe3e8;
  color: #434040;
  padding: 12px;
  font-size: 22px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.chat-header button {
  background: none;
  border: none;
  color: #434040;
  font-size: 20px;
  cursor: pointer;
}

/* ======= 消息列表 ======= */
.chat-messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background-color: white;
  color: #434040;
}

/* ======= 输入框 ======= */
.chat-input {
  display: flex;
  border-top: 1px solid white;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-bottom-left-radius: 12px;
  outline: none;
  font-size: 16px;
  background-color: white;
  color: #434040;
}

.chat-input input::placeholder {
  color: #656565;
}

.chat-input button {
  padding: 12px 20px;
  background-color: #bcd9ffe0;
  color: #434040;
  border: none;
  cursor: pointer;
  border-bottom-right-radius: 12px;
  transition: background-color 0.3s;
  font-size: 16px;
}

.chat-input button:hover {
  background-color: #bababae0;
}

/* ======= AI 正在思考 ======= */
.loading {
  text-align: center;
  color: #000000;
  margin-bottom: 10px;
}

/* 
  ======= 消息 + 头像的布局 =======
  每条消息用 .message-row 包裹，通过 .ai-row / .user-row 决定左右对齐 
*/
.message-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: 10px;
}

.ai-row {
  justify-content: flex-start; /* AI放左侧 */
}

.user-row {
  justify-content: flex-end;   /* 用户放右侧 */
}

/* 头像容器 */
.avatar-container {
  width: 30px;
  height: 30px;
  margin: 0 8px;
}

/* 头像 */
.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* 消息气泡的基础样式 */
.message-bubble {
  max-width: 60%;
  padding: 10px 16px;
  border-radius: 20px;
  word-wrap: break-word;
}

/* AI 消息气泡 */
.ai-message {
  background-color: #bcd9ffe0;
  color: #434040;
  text-align: left;
  align-self: flex-start; /* 让气泡自己也贴左边 */
}

/* 用户消息气泡 */
.user-message {
  background-color: #feb2a5e0;
  color: #434040;
  text-align: right;
  align-self: flex-end;  /* 让气泡贴右边 */
}
</style>
