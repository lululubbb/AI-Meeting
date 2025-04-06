<!-- src/components/AIFloatingChat.vue -->
<template>
  <div>
    <button class="ai-float-button"
      @mousedown="startDragging"
      @touchstart="startDragging"
      :style="{ left: buttonLeft + 'px', top: buttonTop + 'px' }"
      @click="drawer = true">
      <img src="@/assets/AI.png" alt="AI Chat" />
    </button>

  <!-- 抽屉组件 -->
  <el-drawer v-model="drawer" title="AI 助手" :with-header="true" >
      <!-- 聊天内容 -->
      <div class="chat-container">
          <!-- 新增欢迎界面 -->
          <div v-if="showWelcome" class="welcome-message">
            <h3>欢迎使用 AI 助手🎉</h3>
            <p>我是您的智能助理，随时为您解答问题！</p>
          </div>
        <div v-if="fileToAnalyze && aiSummary" class="ai-summary">
          <h4>文档摘要：</h4>
            <p>{{ aiSummary }}</p>
          </div>
        <!-- 消息列表 -->
        <div class="chat-messages" ref="chatMessages">
          <!-- 新增快捷问题区域 -->
          <div v-if="showQuickQuestions" class="quick-questions">
            <h4>常见问题：</h4>
            <div class="question-buttons">
              <button 
                v-for="(question, index) in quickQuestions" 
                :key="index"
                @click="fillInput(question)"
              >
                {{ question }}
              </button>
            </div>
          </div>
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
        <!-- 输入框 -->
<!-- 输入框 -->
<div class="chat-input">
  <input
    v-model="userInput"
    @keyup.enter="sendMessage"
    :placeholder="fileToAnalyze ? '请输入关于文档的问题...' : (isRecording ? '正在录音...' : '输入您的问题...')"
  />
  <button @click="sendMessage">发送</button>
  <!-- 新增语音输入按钮 -->
  <button 
    @click="toggleVoiceInput" 
    class="voice-button" 
    :class="{ recording: isRecording }"
  >
    <img v-if="isRecording" src="@/assets/audio_off.png" alt="停止录音" />
    <img v-else src="@/assets/audio_on.png" alt="语音输入" />
  </button>
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
import { ElMessage } from 'element-plus';
import ANSWER_TEMPLATES from './answerTemplates.js';

// 导入知识库
import productFeatures from './productFeatures.json';

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
          this.showWelcome = false;
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
      isRecording: false,        // 是否正在录音
        audioContext: null,        // 音频上下文
        mediaStream: null,         // 媒体流
        webSocket: null,           // WebSocket 连接
        recordingTimerId: null, // 新增：用于存储录音超时定时器 ID
        
         // 新增数据项
      showWelcome: true,
      quickQuestions: [
        '如何创建会议？',
        '如何获得会议摘要等信息？',
        '如何邀请参与者？',
        '该会议系统有哪些功能？'
      ],
        answerTemplates: ANSWER_TEMPLATES,
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
        knowledgeBase: productFeatures, 
    };
},
computed: {
    showQuickQuestions() {
      return this.showWelcome && !this.fileToAnalyze;
    }
  },
  mounted() {
  },
  beforeUnmount() {
        // 确保停止录音
        if (this.isRecording) {
        this.stopRecording();
    }
  },
  methods: {

 // 切换语音输入
 async toggleVoiceInput() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    },
    
    // 开始录音
    async startRecording() {
        try {
            // 请求麦克风权限
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 初始化 WebSocket 连接
            const user = this.$store.getters.getUser;
            const userId = user.uid;
            const userName = this.getUserName();
            
            // 连接到 WebSocket 服务器
            this.webSocket = new WebSocket(`ws://localhost:4399?userId=${userId}&userName=${userName}`);
            
            this.webSocket.onopen = () => {
                console.log('WebSocket 连接已建立');
                this.isRecording = true;
                this.setupAudioProcessing();

                
                // --- 新增：启动 10 秒自动停止定时器 ---
                if (this.recordingTimerId) { // 如果已有定时器，先清除
                    clearTimeout(this.recordingTimerId);
                }
                this.recordingTimerId = setTimeout(() => {
                    // console.log('录音达到10秒，自动停止。');
                    // showSnackBar('录音已达10秒上限，自动停止'); // 提示用户
                    this.stopRecording(); // 调用停止录音方法
                }, 10000); // 10000 毫秒 = 10 秒
                // --- 结束新增部分 ---

                


                
                // 显示录音状态提示
                showSnackBar('开始语音输入');
            };
            
            this.webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('收到识别结果:', data);
                    
                    if (data.userId === userId) {
                        if (data.type === 'interim' || data.type === 'final') {
                            // 更新输入框
                            this.userInput = data.text;
                        }
                    }
                } catch (error) {
                    console.error('解析 WebSocket 消息失败:', error);
                }
            };
            
            this.webSocket.onerror = (error) => {
                console.error('WebSocket 错误:', error);
                showSnackBar('语音识别服务连接错误');
                this.stopRecording(); // 出错时也要停止
            };
            
            this.webSocket.onclose = () => {
                console.log('WebSocket 连接已关闭');
                // --- 修改：确保关闭时清除定时器 ---
                if (this.recordingTimerId) {
                   clearTimeout(this.recordingTimerId);
                   this.recordingTimerId = null;
                }
                this.isRecording = false; // 确保状态更新
            };
            
          } catch (error) {
            console.error('启动语音输入失败:', error);
            showSnackBar('无法访问麦克风');
             // --- 新增：启动失败也要确保定时器状态正确 ---
             if (this.recordingTimerId) {
                clearTimeout(this.recordingTimerId);
                this.recordingTimerId = null;
             }
        }
    },
    
    // 设置音频处理
    setupAudioProcessing() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000 // 使用 16kHz 采样率，与服务端匹配
            });
            
            // 创建音频源
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // 创建脚本处理器
            const processor = this.audioContext.createScriptProcessor(1024, 1, 1);
            
            // 处理音频数据
            processor.onaudioprocess = (e) => {
                if (this.isRecording && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
                    // 获取音频数据
                    const inputData = e.inputBuffer.getChannelData(0);
                    
                    // 转换为16bit PCM数据
                    const buffer = new Int16Array(inputData.length);
                    
                    // 转换浮点数据为16位整数
                    for (let i = 0; i < inputData.length; i++) {
                        buffer[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    
                    // 发送到 WebSocket
                    this.webSocket.send(buffer.buffer);
                }
            };
            
            // 连接节点
            source.connect(processor);
            processor.connect(this.audioContext.destination);
            
            // 保存处理器引用
            this.audioProcessor = processor;
        } catch (error) {
            console.error('设置音频处理失败:', error);
        }
    },
    
    // 停止录音
    async stopRecording() {
        // --- 新增：在停止操作开始时就清除定时器 ---
        if (this.recordingTimerId) {
            clearTimeout(this.recordingTimerId);
            this.recordingTimerId = null;
            console.log('手动停止或出错，清除录音定时器。');
        }
        // --- 结束新增部分 ---

        // 关闭麦克风
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // 关闭音频上下文
        if (this.audioContext) {
            if (this.audioProcessor) {
                this.audioProcessor.disconnect();
                this.audioProcessor = null;
            }
            // 确保 audioContext 存在且状态不是 'closed'
            if (this.audioContext.state !== 'closed') {
              try {
                await this.audioContext.close();
              } catch(e) {
                 console.warn("Error closing AudioContext: ", e);
              }
            }
            this.audioContext = null;
        }

        // 关闭 WebSocket
        // 检查 WebSocket 状态，避免重复关闭或在错误状态下关闭
        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
           try {
              this.webSocket.close();
           } catch (e) {
               console.warn("Error closing WebSocket: ", e);
           }
        }
        this.webSocket = null; // 确保引用被清除

        // 放在最后更新状态
        if (this.isRecording) { // 只有在确实是录音状态时才显示停止提示
            showSnackBar('语音输入已停止');
        }
        this.isRecording = false;
    },
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
    showSnackBar('获取摘要失败');
    this.isLoading = false;
  }
},

fillInput(question) {
      this.userInput = question;
      this.$nextTick(() => {
        const input = this.$el.querySelector('.chat-input input');
        input.focus();
      });
    },

  // 新增预设回答处理方法
  async handlePredefinedQuestion(question) {
    // 添加用户问题
    this.messages.push({
      from: 'user',
      text: question,
      renderedText: this.escapeHTML(question)
    });

    // 添加AI消息占位
    this.messages.push({ from: 'ai', text: '', renderedText: '' });
    const aiMessageIndex = this.messages.length - 1;

    const answer = this.answerTemplates[question];
    let currentText = '';
    for (const char of answer) {
      currentText += char;
      this.messages[aiMessageIndex].text = currentText;
      this.messages[aiMessageIndex].renderedText = this.renderMarkdown(currentText);
      this.scrollToBottom();
      await this.sleep(20); // 控制流式速度
    }

    this.userInput = '';
    this.scrollToBottom();
  },
  // 已有sleep方法保留，用于延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },


  // 嵌入文本向量
  async embedText(text) {
       try {
           const response = await axios.post('/api/embed', { text });
           return response.data.embedding;
       } catch (error) {
           console.error('无法生成文本嵌入:', error);
           return null;
       }
   },
    //  RAG：检索相关知识
    async retrieveRelevantKnowledge(query) {
        try {
           //1. 将用户的问题向量化
            const queryEmbedding = await this.embedText(query);
            if (!queryEmbedding) {
              console.warn("无法为查询生成嵌入.");
              return null;
            }
            const response = await axios.post('/api/search', {
                 queryEmbedding: queryEmbedding,
            });
            console.log("响应数据:", response.data);
            return response.data.results;

        } catch (error) {
             console.error("检索相关知识出错:", error);
            return [];
        }
    },

// 发送消息到AI 
async sendMessage() {
      if (this.showWelcome) {
        this.showWelcome = false;
      }
      const message = this.userInput.trim();
      if (message === '') return;

      this.userInput = '';
      this.showWelcome = false;
    
      // 新增预设问题处理
      if (this.quickQuestions.includes(message)) {
        this.handlePredefinedQuestion(message);
        return;
      }

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

    const relevantKnowledge = await this.retrieveRelevantKnowledge(message);
        console.log("检索到的相关知识:", relevantKnowledge);

// 构建Prompt
let ragContent = "";
if (relevantKnowledge && relevantKnowledge.length > 0) {
  ragContent = `\n相关知识：\n${relevantKnowledge
    .map((item, index) => `[${index + 1}] ${item.title}: ${item.content}`)
    .join("\n")}\n`;
}

const systemPrompt = `您是一个专业的智能会议助理，负责帮助用户解答关于慧议先锋平台的问题。请根据以下检索到的相关知识，结合您的知识和理解，来生成答案。如果检索到的知识与用户问题不相关，请直接使用你的知识和理解回答。${ragContent}请严格遵循以下规则处理用户请求：
  1. 当用户表达创建会议意图时（例如："创建会议"、"新建一个会"、"请帮我建立XXX会议"等类似表述），立即触发会议创建流程
  2. 会议名称提取规则：
  - 若用户明确说明名称（如"创建『项目讨论会』"），直接使用说明的名称
  - 若名称包含在自然语句中（如"帮我和产品组开个需求评审会"），提取"需求评审会"作为名称
  - 若未明确说明，使用"智能会议-[日期]"格式（例如：智能会议-20240315）
  3. 密码处理规则：
  - 仅当用户明确说明"密码"或"口令"时才需要提取（如"会议密码为123456"）
  - 未提及密码时，password字段留空字符串  
  4. 响应要求：
  - 必须返回严格JSON格式，仅包含以下字段：
    {
      "action": "create_meeting",
      "meetingName": "提取/生成的会议名称",
      "password": "密码或空字符串"
    }
  - 不要添加任何额外说明或文本
  示例：
  用户说："下午三点帮我和技术部开个进度同步会，密码用888888"
  应返回：
  {
    "action": "create_meeting",
    "meetingName": "进度同步会",
    "password": "888888"
  }  
  5. 非会议创建请求时：
  - 使用自然语言友好回复
  - 不要使用JSON格式  
  请严格遵循以下规则回答用户问题：
  # 通用规则
  1. 当用户问题完全匹配上述问题时，必须使用对应模板
  2. 回答时保留模板中的符号体系（编号/箭头/图标）
  3. 非预设问题时正常进行AI对话
  4. 功能类问题最后必须引导查看帮助中心`;

    const requestData = {
      model: 'lite',
      user: this.getUserEmail(),
      messages: [
        {
          role: 'system',
  content: systemPrompt.trim()
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
     showSnackBar("AI 问答出错");
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
        ElMessage.warning('用户未登录');
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
    const container = this.$refs.chatMessages;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
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
      ElMessage.success(`已创建会议 "${meetingName}" 并加入`);
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
.welcome-message {
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
  background:transparent;
  border-radius: 8px;
}

.welcome-message h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.welcome-message p {
  color: #7f8c8d;
  font-size: 0.95em;
}

/* 快捷问题样式 */
.quick-questions {
  margin-bottom: 20px;
  padding: 15px;
  background: #fdfdfd;
  border-radius: 10px;
}

.quick-questions h4 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 0.9em;
  margin-bottom: 10px;
}

.question-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.question-buttons button {
  padding: 8px 12px;
  background: #f7f7f7;
  border: 1px solid #ececec;
  border-radius: 20px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-buttons button:hover {
  background: #eaebec;
  transform: translateY(-1px);
}

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
/* 语音输入按钮 */
.voice-button {
  background-color: #f3f3f3;
  color: #434040;
  border: solid 1px #ecebeb;
  border-radius: 12px;
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 5px;
}

.voice-button:hover {
  background-color: #e6e6e6;
}

.voice-button.recording {
  background-color: #ff6b6b;
  color: white;
  animation: pulse 1.5s infinite;
}

.voice-button img {
  width: 18px;
  height: 18px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

</style>
