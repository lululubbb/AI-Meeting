<template>
    <div class="agent-chat">
      <h1>智能体交互界面</h1>
      
      <div class="settings">
        <label>
          <input type="checkbox" v-model="useStream" />
          使用流式输出
        </label>
      </div>
      
      <div class="chat-container">
        <div class="messages" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
            <div class="message-header">{{ message.role === 'user' ? '用户' : '智能体' }}</div>
            <div class="message-content" v-html="formatMessage(message.content)"></div>
          </div>
        </div>
        
        <div class="input-area">
          <textarea 
            v-model="userInput" 
            @keydown.enter.ctrl="sendMessage" 
            placeholder="输入消息，按Ctrl+Enter发送"
          ></textarea>
          <button @click="sendMessage" :disabled="isLoading">
            {{ isLoading ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AgentChat',
    
    data() {
      return {
        // 配置信息
        appKey: "hengnaoyam8i78QnY8j0HkOyT0f",
        appSecret: "uu3rcxiwlkupwo493b4g5exdwvwsvya5",
        baseUrl: "https://www.das-ai.com",
        agentId: "7b3ff8c4-a7d6-440c-bb4d-32cf3eed8bdc",
        
        // 用户界面状态
        userInput: '',
        messages: [],
        currentSessionId: '',
        isLoading: false,
        useStream: true,
        currentStreamMessage: ''
      }
    },
    
    created() {
      // 创建新会话ID
      this.generateSessionId();
    },
    
    methods: {
      // 生成签名
      getSign() {
        const timestamp = Date.now();
        const data = `${timestamp}\n${this.appSecret}\n${this.appKey}`;
        
        return this.hmacSha256(data, this.appSecret).then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashBase64 = btoa(String.fromCharCode(...hashArray));
          return `${timestamp}${hashBase64}`;
        });
      },
      
      // 使用Web Crypto API计算HMAC-SHA256
      async hmacSha256(message, key) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const messageData = encoder.encode(message);
        
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        return window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      },
      
      // 生成UUID作为会话ID
      generateSessionId() {
        this.currentSessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      
      // 发送消息给智能体
      async sendMessage() {
        if (!this.userInput.trim() || this.isLoading) return;
        
        // 添加用户消息到聊天界面
        const userMessage = {
          role: 'user',
          content: this.userInput
        };
        this.messages.push(userMessage);
        
        const userInputCopy = this.userInput;
        this.userInput = '';
        this.isLoading = true;
        
        // 如果是流式输出，先添加一个空的代理消息
        if (this.useStream) {
          this.currentStreamMessage = '';
          this.messages.push({
            role: 'assistant',
            content: ''
          });
        }
        
        try {
          const sign = await this.getSign();
          
          // 准备请求头和请求体
          const headers = {
            'appKey': this.appKey,
            'sign': sign,
            'Content-Type': 'application/json'
          };
          
          const payload = {
            id: this.agentId,
            input: userInputCopy,
            sid: this.currentSessionId,
            stream: this.useStream
          };
          
          if (this.useStream) {
            headers['Accept'] = 'text/event-stream';
            
            // 流式响应处理
            // const response = await fetch(`${this.baseUrl}/open/api/v2/agent/execute`, {
            //   method: 'POST',
            //   headers: headers,
            //   body: JSON.stringify(payload)
            // });
            const response = await fetch(`/api/proxy/agent/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  try {
                    const data = JSON.parse(line.slice(5));
                    if (data.data && data.data.content) {
                      // 更新当前流式消息
                      this.currentStreamMessage += data.data.content;
                      this.messages[this.messages.length - 1].content = this.currentStreamMessage;
                      this.scrollToBottom();
                    }
                  } catch (e) {
                    console.error('Error parsing stream data:', e);
                  }
                }
              }
            }
          } else {
            // 非流式响应处理
            // const response = await fetch(`${this.baseUrl}/open/api/v2/agent/execute`, {
            //   method: 'POST',
            //   headers: headers,
            //   body: JSON.stringify(payload)
            // });
            // 修改后的代码
const response = await fetch(`/api/proxy/agent/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});


            
            const result = await response.json();
            
            if (result.code === 0 && result.data) {
              const assistantMessage = {
                role: 'assistant',
                content: ''
              };
              
              if (result.data.session && result.data.session.messages) {
                const messages = result.data.session.messages;
                if (messages.length >= 2 && messages[1].content) {
                  assistantMessage.content = messages[1].content;
                }
              }
              
              this.messages.push(assistantMessage);
            } else {
              // 显示错误信息
              this.messages.push({
                role: 'assistant',
                content: `错误: ${result.msg || '未知错误'} (代码: ${result.code})`
              });
            }
          }
        } catch (error) {
          console.error('请求出错:', error);
          this.messages.push({
            role: 'assistant',
            content: `发生错误: ${error.message}`
          });
        } finally {
          this.isLoading = false;
          this.scrollToBottom();
        }
      },
      
      // 格式化消息内容（支持换行）
      formatMessage(content) {
        if (!content) return '';
        return content.replace(/\n/g, '<br>');
      },
      
      // 滚动到聊天窗口底部
      scrollToBottom() {
        this.$nextTick(() => {
          if (this.$refs.messagesContainer) {
            this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
          }
        });
      }
    }
  }
  </script>
  
  <style scoped>
  .agent-chat {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  
  h1 {
    text-align: center;
    color: #333;
  }
  
  .settings {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 5px;
  }
  
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 600px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background-color: #f9f9f9;
  }
  
  .message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 8px;
    max-width: 80%;
  }
  
  .message.user {
    align-self: flex-end;
    background-color: #dcf8c6;
    margin-left: auto;
  }
  
  .message.assistant {
    align-self: flex-start;
    background-color: #fff;
    border: 1px solid #e0e0e0;
  }
  
  .message-header {
    font-weight: bold;
    margin-bottom: 5px;
    font-size: 0.9em;
    color: #555;
  }
  
  .message-content {
    word-break: break-word;
  }
  
  .input-area {
    display: flex;
    padding: 10px;
    background-color: #f0f0f0;
    border-top: 1px solid #ddd;
  }
  
  textarea {
    flex: 1;
    height: 60px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: none;
    font-family: inherit;
  }
  
  button {
    width: 80px;
    margin-left: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  </style>