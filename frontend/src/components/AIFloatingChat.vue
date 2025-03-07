`<!-- src/components/AIFloatingChat.vue -->
<template>
  <div>
    <button class="ai-float-button" @click="drawer = true">
      <img src="@/assets/AI.png" alt="AI Chat" />
    </button>

  <!-- 抽屉组件 -->
  <el-drawer v-model="drawer" title="AI 助手" :with-header="true" >
      <!-- 聊天内容 -->
      <div class="chat-container">
        <div v-if="fileToAnalyze && aiSummary" class="ai-summary">
          <h4>文档摘要：</h4>
            <p>{{ aiSummary }}</p>
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
              <span v-html="msg.renderedText"></span>
            </div>

            <!-- 用户消息：右侧头像 -->
            <div v-if="msg.from === 'user'" class="avatar-container">
              <img src="@/assets/user.png" alt="User Avatar" class="avatar" />
            </div>
          </div>
          <!-- 新增: AI 问答消息 -->
          <div v-for="(item, index) in aiConversation" :key="'qa-' + index"
          class="message-row" :class="item.role === 'user' ? 'user-row' : 'ai-row'">

              <div v-if="item.role === 'ai'" class="avatar-container">
                <img src="@/assets/AI.png" alt="AI Avatar" class="avatar" />
              </div>

              <div class="message-bubble"
                    :class="[item.role === 'user' ? 'user-message' : 'ai-message']">
                    <p><strong>{{ item.role === 'user' ? '您' : '' }}</strong> {{ item.content }}</p>
              </div>
          <div v-if="item.role === 'user'" class="avatar-container">
            <img src="@/assets/user.png" alt="User Avatar" class="avatar" />
          </div>
        </div>

          <!-- AI 正在思考提示 -->
          <div v-if="isLoading && !isCreatingMeeting" class="loading">
            <span>AI 正在思考...</span>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="chat-input">
          <input
            v-model="userInput"
            @keyup.enter="sendMessage"
            :placeholder="fileToAnalyze ? '请输入关于文档的问题...' : '输入您的问题...'"
          />
          <button @click="sendMessage">发送</button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {ref, watch, onMounted, nextTick} from 'vue';  // 导入 ref
import axios from 'axios';
import { showSnackBar } from '../utils/utils.js'; // 确保有一个显示消息的工具函数
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // 引入 useRouter
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import FirestoreService from '../services/FirestoreService.js';
import ZoomVideoService from '../services/ZoomVideoService.js';

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      // 从 data URL 中提取 Base64 部分
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(blob); // 使用 readAsDataURL 读取 Blob
  });
}

export default {
  name: 'AIFloatingChat',
  props:{
    fileToAnalyze:{
      type: Object,
      default: null
    },
    fileMsgId:{ // 新增 prop
      type: String,
      default: null
    }
  },
  watch: {
    fileToAnalyze(newFile) {
        if (newFile) {
            this.drawer = true;
            //  首次加载文件, 只需要获取摘要
            if (!this.fileAnalyzed) { // 新增标志
                this.fetchAiSummary();
                this.fileAnalyzed = true; // 设置标志, 避免重复分析
            }
        }
    },
},
data() {
    return {
        drawer: false,
        isChatOpen: false,
        messages: [],          // 普通聊天
        userInput: '',
        isLoading: false,
        isCreatingMeeting: false,
        aiSummary: '',   //  摘要
        aiConversation: [],  //  AI 问答记录
        fileBlobs: new Map(), // 用于存储 msgId 和 fileBlob 的映射, 现在不再需要
        downloadPromises: new Map(), // 用于存储 msgId 和 Promise 的映射
        fileAnalyzed: false,  // 新增标志, 记录文件是否已经被分析过 (下载并转换为 Base64)
        fileBase64: '',
    };
},
  mounted() {
  },
   beforeUnmount() {
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
      // 打开聊天窗口 (由 videocall.vue 调用)
      openChat(){
        this.drawer = true; // 打开抽屉
      },
      async fetchAiSummary() {
  if (!this.fileToAnalyze || !this.fileToAnalyze.fileUrl) return;
  if (this.fileAnalyzed) return; //已经分析过，则返回

  this.isLoading = true;
  this.aiSummary = '';
  this.aiConversation = []; // 清空问答历史
  this.messages = [];      //  清空普通消息

  try {
    const cancelDownload = await ZoomVideoService.downloadFile(
      this.fileMsgId,
      this.fileToAnalyze.fileUrl,
      true  // 下载为 blob
    );

    // 2. 等待 fileBlob
    const fileBlob = await new Promise((resolve) => {
       this.downloadPromises.set(this.fileMsgId, resolve);
    });
        //  3. 调用 sendFileDataToAnalyze 
        this.sendFileDataToAnalyze(fileBlob, 'summary');

  } catch (error) {
    console.error('获取摘要失败:', error);
    showSnackBar('获取摘要失败: ' + error.message);
    this.isLoading = false;
  }
},

    // 发送消息到AI 
    async sendMessage() {
      const message = this.userInput.trim();
      if (message === '') return;

      this.userInput = '';

      if (this.fileToAnalyze) {
        await this.askAiQuestion(message); // 直接调用, 不再经过普通消息逻辑
        return;
      }

  this.messages.push({
    from: 'user',
    text: message,
    renderedText: this.escapeHTML(message),
  });
  this.userInput = '';
  this.scrollToBottom();

  try {
    this.isLoading = true;
    console.log('发送消息到AI:', message);

    const requestData = {
      model: 'lite',
      user: this.getUserEmail(),
      messages: [
        {
          role: 'system',
          content: `你是知识渊博的助理。当用户请求创建会议时，请返回如下格式的信息（仅JSON）并确保指令与其他回复分开发送：
          {
            "action": "create_meeting",
            "meetingName": "会议名称",
            "password": "密码"
          }
          如果不是创建会议的请求，请正常回复。`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      stream: true,
    };

    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 123456',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let aiMessage = '';

    // 添加一个新的AI消息，用于动态更新 *普通* 文本
    this.messages.push({ from: 'ai', text: '', renderedText: '' });
    const aiMessageIndex = this.messages.length - 1;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.replace(/^data:/, '').trim();
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.code !== 0) {
                // 处理API错误 (同之前)
                this.messages[aiMessageIndex].text += '抱歉，我无法回答你的问题。';
                this.messages[aiMessageIndex].renderedText = this.escapeHTML(
                  this.messages[aiMessageIndex].text
                );
                this.scrollToBottom();
                continue;
              }

              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta;
                if (delta && delta.content) {
                  // *关键修改*:  只累加到 aiMessage，*不* 在这里解析 JSON
                  aiMessage += delta.content;

                  // 如果是 *普通* 文本，则逐字渲染
                  // (这里假设普通文本不会是有效的 JSON)
                  try {
                    JSON.parse(aiMessage); // 尝试解析
                    // 如果是 JSON，则 *不* 逐字渲染 (稍后统一处理)
                  } catch (e) {
                    // 如果不是 JSON, 则逐字渲染
                    for (const char of delta.content) {
                      this.messages[aiMessageIndex].text += char;
                      this.messages[aiMessageIndex].renderedText = this.renderMarkdown(
                        this.messages[aiMessageIndex].text
                      );
                      this.scrollToBottom();
                      await this.sleep(30);
                    }
                  }
                }
              }
            } catch (err) {
              console.error('解析数据失败:', err);
            }
          }
        }
      }
    } // end while

    // *关键修改*:  所有数据接收完毕后，再解析 JSON
    if (aiMessage.trim() !== '') {
      try {
        const commandData = JSON.parse(aiMessage);
        if (commandData.action === 'create_meeting') {
          // 处理创建会议指令
          this.isCreatingMeeting = true; // 设置标志
          this.messages[aiMessageIndex].text = '正在创建会议...'; // 显示提示
          this.messages[aiMessageIndex].renderedText = this.escapeHTML(this.messages[aiMessageIndex].text);
          this.scrollToBottom();

          await this.handleAIDirectives(commandData); // 调用

          this.isCreatingMeeting = false; // 清除标志
        } else {
          // 如果不是创建会议指令,直接显示
          this.messages[aiMessageIndex].text = aiMessage;
          this.messages[aiMessageIndex].renderedText = this.renderMarkdown(aiMessage);
          this.scrollToBottom();
        }
      } catch (jsonError) {
          // 如果 aiMessage *不是* JSON (例如是普通文本)
          //  那么直接渲染
        this.messages[aiMessageIndex].text = aiMessage;
        this.messages[aiMessageIndex].renderedText = this.renderMarkdown(aiMessage);
        this.scrollToBottom();

      }
    } // end if
  } catch (error) {
    console.error('AI聊天失败:', error.message);
    this.messages.push({
      from: 'ai',
      text: '抱歉，我无法回答你的问题。',
      renderedText: this.escapeHTML('抱歉，我无法回答你的问题。'),
    });
    this.scrollToBottom();
  } finally {
    this.isLoading = false;
  }
}, 


//  AI 问答
async askAiQuestion(question) {
   if (!this.fileToAnalyze || !this.fileToAnalyze.fileUrl || !question.trim()) return;

   this.aiConversation.push({ role: 'user', content: question }); // 添加用户问题
   this.isLoading = true;

   try {
       //  添加一个 AI 消息占位符, 用于后续更新
        this.aiConversation.push({ role: 'assistant', content: '' }); //  AI 消息占位
        const aiMessageIndex = this.aiConversation.length - 1; // 记录索引


     if (!this.fileAnalyzed) {
       const cancelDownload = await ZoomVideoService.downloadFile(this.fileMsgId, this.fileToAnalyze.fileUrl, true);
       const fileBlob = await new Promise((resolve) => {
         this.downloadPromises.set(this.fileMsgId, resolve);
       });
       this.sendFileDataToAnalyze(fileBlob, 'question', aiMessageIndex, question); // 传入 index
       this.fileAnalyzed = true;
     } else {
       this.sendFileDataToAnalyze(null, 'question', aiMessageIndex, question); // 传入 index
     }
   } catch (err) {
     console.error("AI 问答出错", err);
     showSnackBar("AI 问答出错:" + err.message);
     //  这里不再需要 push 一个错误消息了, 因为已经在 sendFileDataToAnalyze 中处理了
   } finally {
     this.isLoading = false;  //  这里不再调用 scrollToBottom, 因为在流式输出过程中会多次调用
   }
 },
       
 async sendFileDataToAnalyze(fileBlob, type, aiMessageIndex, question = '') {
  console.log("sendFileDataToAnalyze called with:", { fileBlob, type, question });

  try {
    let base64Data = this.fileBase64;
    if (!base64Data && fileBlob) {
      base64Data = await blobToBase64(fileBlob);
      this.fileBase64 = base64Data;
    }

    const requestData = {
      fileData: base64Data,
      fileType: this.fileToAnalyze.name.split(".").pop(),
      type: type,
      stream: true, // 开启流式
    };

    if (type === "question") {
      requestData.question = question;
      requestData.conversation = this.aiConversation;
    }

    const response = await fetch("http://localhost:4000/api/analyze-file", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data:')) {
             const dataStr = line.replace(/^data:/, '').trim();

             if (dataStr === '[DONE]') {
              done = true;
              break; // 结束循环
             }

             try {
                 const data = JSON.parse(dataStr);
                 //  *** 关键修改: 处理逐字/逐词数据 ***
                if (data.content) { //  注意: 现在 data  是 { content: '字' }
                    if (type === 'summary') {
                      this.aiSummary += data.content; // 直接累加 content
                     } else if (type === 'question') {
                      this.aiConversation[aiMessageIndex].content += data.content; // 增量更新
                      this.$nextTick(() => this.scrollToBottom());
                    }
                 }
              } catch (err) {
                console.error('解析流式数据失败:', err);
             }
          }
        }
      }
    }

  } catch (err) {
     console.error("分析失败:", err);
     showSnackBar("分析失败:" + err.message);
      //  添加错误处理
       if(type === 'question' && aiMessageIndex !== undefined){
           this.aiConversation[aiMessageIndex].content = '抱歉, AI 助手遇到问题, 无法回答.';
       }
   } finally {
     this.isLoading = false;
     this.$nextTick(() => this.scrollToBottom());// 确保最后滚动到底部
   }
 },


// 监听预约的会议
    listenToScheduledMeetings() {
      const user = this.$store.getters.getUser;
      if (!user) {
        console.error('用户未登录');
        return;
      }

      // 监听用户的会议记录
      FirestoreService.listenToMeetings(user.uid, (meetings) => {
        this.scheduledMeetings = meetings.filter((meeting) => meeting.status === 'scheduled');
        this.checkScheduledMeetings();
      });
    },
    // 检查预约的会议是否需要开始
    checkScheduledMeetings() {
      const now = Date.now();
      this.scheduledMeetings.forEach(async (meeting) => {
        if (meeting.startTime <= now && meeting.status === 'scheduled') {
          // 自动创建会议
          await this.createMeeting(meeting);
        }
      });
    },
    // 自动创建会议
    async createMeeting(meeting) {
      try {
        const user = this.$store.getters.getUser;
        if (!user) {
          console.error('用户未登录');
          return;
        }

        // 调用 ZoomVideoService 创建会议
        const videoSDKJWT = await ZoomVideoService.getVideoSDKJWT(
          meeting.sessionName,
          meeting.role,
          user.email
        );

        if (!videoSDKJWT) {
          throw new Error('获取 JWT 失败');
        }

        // 更新会议状态为“已开始”
        await FirestoreService.updateMeetingHistory(user.uid, meeting.meetingId, {
          status: 'started',
          videoSDKJWT: videoSDKJWT,
        });

        // 向用户发送一条消息，告知会议已创建
        this.messages.push({
          from: 'ai',
          text: `会议 "${meeting.sessionName}" 已自动创建。`,
          renderedText: this.escapeHTML(`会议 "${meeting.sessionName}" 已自动创建。`),
        });
        this.scrollToBottom();

        console.log('会议已自动创建:', meeting.meetingId);
      } catch (error) {
        console.error('自动创建会议失败:', error);
        this.messages.push({
          from: 'ai',
          text: `会议 "${meeting.sessionName}" 自动创建失败。`,
          renderedText: this.escapeHTML(`会议 "${meeting.sessionName}" 自动创建失败。`),
        });
        this.scrollToBottom();
      }
    },
    scrollToBottom() {
         nextTick(() => {
            if (this.$refs.chatMessages) {
              this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
           }
        });
      },
    // 处理AI指令
    async handleAIDirectives(commandData) {
  console.log('处理AI指令:', commandData);

  const meetingName = commandData.meetingName.trim();
  const meetingPassword = commandData.password
    ? commandData.password.trim()
    : '';

  console.log(`解析出的会议名称: ${meetingName}, 密码: ${meetingPassword}`);

  // 获取当前用户的邮箱和用户名
  const userEmail = this.getUserEmail();
  const userName = this.getUserName();


  try {
    // 1. *先* 创建 Firestore 会议文档
    const user = this.$store.getters.getUser; // 使用在 <script setup> 中定义的 store
    if (!user) {
      showSnackBar('用户未登录');
      return;
    }

    const meetingId = await FirestoreService.addToMeetingHistory(
      user.uid,
      meetingName,
      {
        status: 'ongoing',
        hostId: user.uid, // 创建者即主持人
        hostName: userName, // 使用邮箱或用户名
        sessionPasscode: meetingPassword,
        startTime: new Date(),
      }
    );

    // 2. 调用后端API获取JWT
    console.log('请求后端API获取JWT...');
    const jwtResponse = await axios.post('/api/zoom-jwt', {
      sessionName: meetingName,
      role: 1, // 主持人角色
      userIdentity: userEmail, // 使用用户邮箱作为身份标识
      sessionPasscode: meetingPassword,
    });

    console.log('后端JWT响应:', jwtResponse.data);

    const jwt = jwtResponse.data.signature;
    if (jwt) {
      // *修改部分*:  直接 commit 到 Vuex
      this.$store.commit('SET_MEETING_CONFIG', {  // 直接使用 store
        mode: 'create',
        sessionName: meetingName,
        userName: userName,
        sessionPasscode: meetingPassword,
        videoSDKJWT: jwt,
        role: 1,
        meetingId,
        hostId: user.uid,
      });

      this.$store.commit('SET_VIDEOCALL_MAXIMIZED', true);
      this.$store.commit('SET_VIDEOCALL_ACTIVE', true);
      showSnackBar(`已创建会议 "${meetingName}" 并加入`);
      this.drawer = false; // 关闭抽屉
      this.isChatOpen = false; // 关闭聊天
    } else {
      showSnackBar('获取 JWT 失败');
    }
  } catch (error) {
    console.error(
      '获取 JWT 失败:',
      error.response ? error.response.data : error.message
    );
    showSnackBar(
      '获取 JWT 失败: ' +
        (error.response?.data?.error?.message || error.message)
    );
    this.messages.push({
      from: 'ai',
      text: '抱歉，创建会议失败。',
      renderedText: this.escapeHTML('抱歉，创建会议失败。'),
    });
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
    },
    // Helper function to sleep
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    // Render markdown to HTML
    renderMarkdown(markdownText) {
      if (!markdownText) return '';
      const cleanedText = markdownText.replace(/[*_]/g, ''); //  移除 * 和 _
      const rawHtml = marked(cleanedText);  //  使用 cleanedText
      return DOMPurify.sanitize(rawHtml);
    },
    // Escape HTML to prevent XSS
    escapeHTML(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
  },
};
</script>

<style scoped>

/* 新增: AI 摘要样式 */
.ai-summary {
  margin-bottom: 15px;
   padding: 10px;
   background-color: #f0f8ff;
   border: 1px solid #add8e6;
   border-radius: 5px;
   max-height: 200px;  /*  添加最大高度,  可自行调整 */
   overflow-y: auto;  /*  如果内容超出, 允许滚动 */
}
.ai-summary h4 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #336699; /* 深蓝色标题 */
}
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
  z-index: 1000; /* 确保在最上层 */
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
}

.ai-float-button img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}


/* ======= 聊天窗口容器 ======= */
/* 整体容器布局 */
.chat-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0; 
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 12px;
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

.el-drawer {
  background-color: #bcd9ffe0;
  height: 90vh !important; /* 控制抽屉高度 */
  width:50vw !important; 

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

/* 输入框容器（固定底部） */
.chat-input {
  padding: 0 10px 10px; /* 调整底部留白 */
  background: #fff;
  border-top: 1px solid #ebeef5;
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  border: none;
}

.chat-input input {
  flex: 1;
  padding: 12px 12px;
  border: solid 2px #ecebeb;
  border-bottom-left-radius: 12px;
  width: calc(100% - 50px); /* 根据按钮宽度调整 */
  outline: none;
  font-size: 16px;
  background-color: white;
  color: #434040;
}


.chat-input input::placeholder {
  color: #656565;
}

.chat-input button {
  padding: 12px 10px;
  background-color: #bcd9ffe0;
  color: #434040;
  border: solid 1px #ecebeb;
  cursor: pointer;
  width: 20%;
  border-bottom-right-radius: 12px;
  transition: background-color 0.3s;
  font-size: 16px;
}

.chat-input button:hover {
  background-color: #7ab4ffe0;
}

/* ======= AI 正在思考 ======= */
.loading {
  text-align: center;
  color: #5c5c5c;
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
  justify-content: flex-end; /* 用户放右侧 */
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
  align-self: flex-end; /* 让气泡贴右边 */
}
::v-deep .el-drawer__title {
  font-size: 20px !important; /* 调整字体大小 */
  font-weight: 600; 
}
/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  /* 悬浮按钮 */
  .ai-float-button {
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
  }

  .ai-float-button img {
    width: 40px;
    height: 40px;
  }

  /* 抽屉组件 */
  el-drawer {
    width: 80vw !important;  /* 全屏宽度 */
    height: 85vh !important;
    max-width: 100vw !important; /* 防止溢出屏幕 */
  }

  /* 输入框定位优化 */
  .chat-input {
    position: sticky;
    bottom: 0;
    background: #fff;
    padding: 0 10px 10px;
    box-shadow: 0 -2px 8px rgba(56,103,255,0.05);
    display: flex;
    gap: 8px;
  }

  /* 消息区域高度优化 */
  .chat-messages {
    height: calc(100% - 68px); /* 减去输入框高度 */
  }

   /* 聊天容器布局 */
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 0; 
  }


  .chat-input input {
    flex: 1;
    width: calc(100% - 30px); /* 缩小按钮宽度 */
    padding: 10px 12px;
  }

  .chat-input button {
    width: 70px;
    padding: 10px 8px;
  }

.chat-input button:hover {
  background-color: #7ab4ffe0;
}
  /* 消息气泡 */
  .message-bubble {
    max-width: 70%;
    padding: 8px 12px;
    font-size: 14px;
  }

  /* 头像容器 */
  .avatar-container {
    width: 25px;
    height: 25px;
    margin: 0 6px;
  }
    /* 横屏适配 */
    @media (orientation: landscape) {
    ::v-deep .el-drawer {
      width: 70vw !important;
      height: 95vh !important;
    }
  }
}

/* 优化抽屉内容区布局 */
::v-deep .el-drawer__body {
  padding: 0 10px !important;  /* 移除默认padding */
}
/* 修复消息列表宽度 */
.chat-messages {
  width: 100% !important;  /* 强制消息列表宽度 */
  max-width: none !important;
}
/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  /* 悬浮按钮 */
  .ai-float-button {
    bottom: 15px;
    right: 15px;
    width: 50px;
    height: 50px;
  }

  .ai-float-button img {
    width: 40px;
    height: 40px;
  }

  /* 聊天消息区域 */
  .chat-messages {
    padding: 6px;
  }
  .chat-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0; 
}
  ::v-deep .el-drawer {
    width: 90% !important;  /* 移动端占屏幕90%宽度 */
    max-width: 100vw !important;  /* 防止溢出屏幕 */
    border-radius: 12px 12px 0 0 !important;
  }

  .chat-input {
    padding: 10px;
  }

  .chat-input input {
    width: calc(100% - 40px);
    padding: 8px 10px;
  }

  .chat-input button {
    padding: 8px 14px;
    font-size: 14px;
  }

  /* 消息气泡 */
  .message-bubble {
    max-width: 80%;
    padding: 6px 10px;
    font-size: 12px;
  }

  /* 头像容器 */
  .avatar-container {
    width: 20px;
    height: 20px;
    margin: 0 4px;
  }
}

</style>
`