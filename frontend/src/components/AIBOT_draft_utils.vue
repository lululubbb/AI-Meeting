<template>
    <div class="stream-tester">
      <h2>智能体输出与知识检索分离器</h2>
      
      <!-- 配置区域 -->
      <div class="config-section">
        <div class="form-group">
          <label>AgentId:</label>
          <input v-model="agentId" type="text" placeholder="输入AgentId">
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-section">
        <textarea v-model="userInput" placeholder="输入要发送的消息..."></textarea>
        <button @click="testStream" :disabled="isLoading">
          {{ isLoading ? '请求中...' : '测试流式输出' }}
        </button>
      </div>
      
      <!-- 结果显示区域 -->
      <div class="results-section">
        <h3>分离结果：</h3>
        
        <div v-if="streamChunks.length === 0 && !isLoading" class="no-data">
          尚未收到数据
        </div>
        
        <div v-if="isLoading" class="loading">
          正在获取流式数据...
        </div>
        
        <div v-else class="separated-content">
          <!-- 知识检索部分 -->
          <div class="retrieval-content">
            <h4>知识检索内容:</h4>
            <div class="data-block">
              <pre>{{ parsedOutput.retrievalContent }}</pre>
            </div>
          </div>
          
          <!-- 智能体回答部分 -->
          <div class="agent-answer">
            <h4>智能体回答:</h4>
            <div class="data-block">
              <pre>{{ parsedOutput.answer }}</pre>
            </div>
          </div>
          
          <!-- 分界点详情 -->
          <div class="separation-info" v-if="parsedOutput.separationMethod">
            <h4>分离详情:</h4>
            <div class="info-block">
              <div><span class="label">分离方法:</span> {{ parsedOutput.separationMethod }}</div>
              <div v-if="parsedOutput.separationPosition !== undefined">
                <span class="label">分离位置:</span> 第 {{ parsedOutput.separationPosition }} 个字符
              </div>
              <div v-if="parsedOutput.contentMarkerIndex !== undefined">
                <span class="label">最后content位置:</span> 第 {{ parsedOutput.contentMarkerIndex }} 个字符
              </div>
              <div v-if="parsedOutput.linebreakIndex !== undefined">
                <span class="label">换行符位置:</span> 第 {{ parsedOutput.linebreakIndex }} 个字符
              </div>
            </div>
          </div>
          
          <!-- 原始内容 -->
          <div class="raw-toggle">
            <button @click="showRawContent = !showRawContent" class="toggle-btn">
              {{ showRawContent ? '隐藏' : '显示' }}原始内容
            </button>
            <div v-if="showRawContent" class="raw-content data-block">
              <pre>{{ accumulatedContent }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 复制按钮 -->
      <div class="copy-section">
        <button @click="copyRetrieval" :disabled="!parsedOutput.retrievalContent">
          复制检索内容
        </button>
        <button @click="copyAnswer" :disabled="!parsedOutput.answer">
          复制智能体回答
        </button>
        <button @click="copyRawData" :disabled="!accumulatedContent">
          复制原始内容
        </button>
        <div v-if="copyStatus" class="copy-status">
          {{ copyStatus }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'StreamTester',
    
    data() {
      return {
        // 配置
        appKey: "hengnaoyam8i78QnY8j0HkOyT0f",
        appSecret: "uu3rcxiwlkupwo493b4g5exdwvwsvya5",
        agentId: "7b3ff8c4-a7d6-440c-bb4d-32cf3eed8bdc",
        
        // 用户输入
        userInput: "",
        
        // 状态和结果
        isLoading: false,
        streamChunks: [],
        accumulatedContent: "",
        currentSessionId: '',
        showRawContent: false,
        copyStatus: "",
        
        // 缓冲区，用于处理不完整的响应
        buffer: '',
        
        // 解析结果
        parsedOutput: {
          retrievalContent: "",
          answer: "",
          separationMethod: "",
          separationPosition: undefined,
          contentMarkerIndex: undefined,
          linebreakIndex: undefined
        }
      }
    },
    
    created() {
      // 创建新会话ID
      this.generateSessionId();
    },
    
    methods: {
      // 生成UUID作为会话ID
      generateSessionId() {
        this.currentSessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      
      // 测试流式输出
      async testStream() {
        if (!this.userInput.trim() || this.isLoading) return;
        
        this.isLoading = true;
        this.streamChunks = [];
        this.accumulatedContent = "";
        this.copyStatus = "";
        this.buffer = '';
        
        // 重置解析结果
        this.parsedOutput = {
          retrievalContent: "",
          answer: "",
          separationMethod: "",
          separationPosition: undefined,
          contentMarkerIndex: undefined,
          linebreakIndex: undefined
        };
        
        try {
          // 准备请求体数据
          const payload = {
            id: this.agentId,
            input: this.userInput,
            sid: this.currentSessionId,
            stream: true
          };
          
          // 使用相对路径，依赖于代理设置
          const response = await fetch(`/api/proxy/agent/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
          }
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            this.buffer += chunk;
            
            const lines = this.buffer.split('\n');
            // 保留最后一行，它可能是不完整的
            this.buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const jsonStr = line.slice(5).trim();
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    
                    // 记录原始数据块
                    this.streamChunks.push({
                      timestamp: Date.now(),
                      data: data
                    });
                    
                    // 提取并累加内容
                    if (data.data && data.data.content) {
                      this.accumulatedContent += data.data.content;
                    }
                  }
                } catch (e) {
                  console.warn('流式数据处理警告:', e, '原始数据:', line.slice(5));
                }
              }
            }
          }
          
          // 处理缓冲区中可能剩余的完整数据
          if (this.buffer.startsWith('data:')) {
            try {
              const jsonStr = this.buffer.slice(5).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                
                this.streamChunks.push({
                  timestamp: Date.now(),
                  data: data
                });
                
                if (data.data && data.data.content) {
                  this.accumulatedContent += data.data.content;
                }
              }
            } catch (e) {
              console.warn('处理缓冲区剩余数据警告:', e);
            }
          }
          
          // 解析和分离内容
          this.separateContent();
          
        } catch (error) {
          console.error('请求失败:', error);
          alert(`测试失败: ${error.message}`);
        } finally {
          this.isLoading = false;
        }
      },
      
      // 分离知识检索与智能体回答 - 使用最后一个content后的换行符作为分界点
      separateContent() {
        if (!this.accumulatedContent) return;
        
        try {
          // 1. 检查是否包含知识检索标记
          if (!this.accumulatedContent.includes('知识检索工具')) {
            // 不包含知识检索，全部内容视为智能体回答
            this.parsedOutput.answer = this.accumulatedContent;
            this.parsedOutput.separationMethod = "无知识检索内容";
            return;
          }
  
          // 2. 查找最后一个 "content"
          const lastContentIndex = this.accumulatedContent.lastIndexOf('"content"');
          if (lastContentIndex === -1) {
            // 找不到content标记，使用fallback方法
            this.fallbackSeparation();
            return;
          }
          
          this.parsedOutput.contentMarkerIndex = lastContentIndex;
          
          // 3. 从最后一个content开始，寻找第一个真实换行符（非\n字符串）
          // 首先获取最后content之后的所有内容
          const contentAfterLastContent = this.accumulatedContent.substring(lastContentIndex);
          
          // 首先尝试查找带引号的content之后第一个真实换行
          // 查找第一个":"，然后找到第一个不在引号内的换行
          const colonIndex = contentAfterLastContent.indexOf(':');
          if (colonIndex === -1) {
            this.fallbackSeparation();
            return;
          }
          
          let inQuote = false;
          let inEscape = false;
          let linebreakIndex = -1;
          
          for (let i = colonIndex; i < contentAfterLastContent.length; i++) {
            const char = contentAfterLastContent.charAt(i);
            
            if (inEscape) {
              inEscape = false;
              continue;
            }
            
            if (char === '\\') {
              inEscape = true;
              continue;
            }
            
            if (char === '"' && !inEscape) {
              inQuote = !inQuote;
              continue;
            }
            
            // 找到第一个不在引号内的换行
            if (char === '\n' && !inQuote) {
              linebreakIndex = i;
              break;
            }
          }
          
          if (linebreakIndex !== -1) {
            // 计算真实的分隔位置（全局位置）
            const separationPosition = lastContentIndex + linebreakIndex;
            this.parsedOutput.linebreakIndex = separationPosition;
            
            // 分离内容和回答
            this.parsedOutput.retrievalContent = this.accumulatedContent.substring(0, separationPosition).trim();
            this.parsedOutput.answer = this.accumulatedContent.substring(separationPosition).trim();
            this.parsedOutput.separationMethod = "最后content后第一个换行";
            this.parsedOutput.separationPosition = separationPosition;
            
            return;
          }
          
          // 如果没有找到合适的换行，尝试查找任何换行
          const anyLineBreak = contentAfterLastContent.indexOf('\n');
          if (anyLineBreak !== -1) {
            const separationPosition = lastContentIndex + anyLineBreak;
            this.parsedOutput.linebreakIndex = separationPosition;
            
            this.parsedOutput.retrievalContent = this.accumulatedContent.substring(0, separationPosition).trim();
            this.parsedOutput.answer = this.accumulatedContent.substring(separationPosition).trim();
            this.parsedOutput.separationMethod = "最后content后任意换行";
            this.parsedOutput.separationPosition = separationPosition;
            
            return;
          }
          
          // 如果完全找不到换行，使用fallback方法
          this.fallbackSeparation();
          
        } catch (error) {
          console.error('分离内容失败:', error);
          this.fallbackSeparation();
        }
      },
      
      // 备用分离方法，使用多种启发式策略
      fallbackSeparation() {
        // 1. 尝试使用Markdown图片分隔
        const markdownImgRegex = /!\[.*?\]\(.*?\)\s*(\n|\r\n|\r)/;
        const imgMatch = this.accumulatedContent.match(markdownImgRegex);
        
        if (imgMatch) {
          const separationPosition = imgMatch.index + imgMatch[0].length;
          this.parsedOutput.retrievalContent = this.accumulatedContent.substring(0, separationPosition).trim();
          this.parsedOutput.answer = this.accumulatedContent.substring(separationPosition).trim();
          this.parsedOutput.separationMethod = "Markdown图片后的换行";
          this.parsedOutput.separationPosition = separationPosition;
          return;
        }
        
        // 2. 尝试使用多个连续换行作为分隔符
        const multipleLinebreaksRegex = /\n\s*\n\s*\n/;
        const linebreaksMatch = this.accumulatedContent.match(multipleLinebreaksRegex);
        
        if (linebreaksMatch) {
          const separationPosition = linebreaksMatch.index + linebreaksMatch[0].length;
          this.parsedOutput.retrievalContent = this.accumulatedContent.substring(0, separationPosition).trim();
          this.parsedOutput.answer = this.accumulatedContent.substring(separationPosition).trim();
          this.parsedOutput.separationMethod = "多个连续换行";
          this.parsedOutput.separationPosition = separationPosition;
          return;
        }
        
        // 3. 尝试使用年份开头的句子作为分界点
        const yearRegex = /\n(\d{4}年[^，。；]+[，。；])/;
        const yearMatch = this.accumulatedContent.match(yearRegex);
        
        if (yearMatch) {
          const separationPosition = yearMatch.index;
          this.parsedOutput.retrievalContent = this.accumulatedContent.substring(0, separationPosition).trim();
          this.parsedOutput.answer = this.accumulatedContent.substring(separationPosition).trim();
          this.parsedOutput.separationMethod = "年份开头句子";
          this.parsedOutput.separationPosition = separationPosition;
          return;
        }
        
        // 4. 如果前面都失败了，尝试使用最后一个片段标记后的内容
        const lastFragmentRegex = /片段\d+:/g;
        let lastFragmentMatch;
        let lastIndex = -1;
        
        while ((fragmentMatch = lastFragmentRegex.exec(this.accumulatedContent)) !== null) {
          lastIndex = fragmentMatch.index;
        }
        
        if (lastIndex !== -1) {
          // 找到最后一个片段后的第一个明显的结束标志
          const afterLastFragment = this.accumulatedContent.substring(lastIndex);
          const possibleEndMarkers = [
            '\n\n', // 两个换行可能表示结束
            '如果您', // 常见的结束语开头
            '欢迎继续', // 常见的结束语开头
          ];
          
          let endMarkerIndex = -1;
          let endMarker = '';
          
          for (const marker of possibleEndMarkers) {
            const idx = afterLastFragment.indexOf(marker);
            if (idx !== -1 && (endMarkerIndex === -1 || idx < endMarkerIndex)) {
              endMarkerIndex = idx;
              endMarker = marker;
            }
          }
          
          if (endMarkerIndex !== -1) {
            const separationPosition = lastIndex + endMarkerIndex;
            this.parsedOutput.retrievalContent = this.accumulatedContent.substring(0, separationPosition).trim();
            this.parsedOutput.answer = this.accumulatedContent.substring(separationPosition).trim();
            this.parsedOutput.separationMethod = `最后片段后找到"${endMarker}"`;
            this.parsedOutput.separationPosition = separationPosition;
            return;
          }
        }
        
        // 5. 最后的备用方案：假设整个内容都是知识检索
        this.parsedOutput.retrievalContent = this.accumulatedContent;
        this.parsedOutput.answer = "";
        this.parsedOutput.separationMethod = "无法分离，全部视为检索内容";
      },
      
      // 复制检索内容
      copyRetrieval() {
        if (!this.parsedOutput.retrievalContent) return;
        
        navigator.clipboard.writeText(this.parsedOutput.retrievalContent)
          .then(() => {
            this.copyStatus = "检索内容已复制到剪贴板";
            setTimeout(() => {
              this.copyStatus = "";
            }, 3000);
          })
          .catch(err => {
            console.error('复制失败:', err);
            this.copyStatus = "复制失败，请手动复制";
          });
      },
      
      // 复制智能体回答
      copyAnswer() {
        if (!this.parsedOutput.answer) return;
        
        navigator.clipboard.writeText(this.parsedOutput.answer)
          .then(() => {
            this.copyStatus = "智能体回答已复制到剪贴板";
            setTimeout(() => {
              this.copyStatus = "";
            }, 3000);
          })
          .catch(err => {
            console.error('复制失败:', err);
            this.copyStatus = "复制失败，请手动复制";
          });
      },
      
      // 复制原始内容
      copyRawData() {
        if (!this.accumulatedContent) return;
        
        navigator.clipboard.writeText(this.accumulatedContent)
          .then(() => {
            this.copyStatus = "原始内容已复制到剪贴板";
            setTimeout(() => {
              this.copyStatus = "";
            }, 3000);
          })
          .catch(err => {
            console.error('复制失败:', err);
            this.copyStatus = "复制失败，请手动复制";
          });
      }
    }
  }
  </script>
  
  <style scoped>
  .stream-tester {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #3B82F6;
  }
  
  .config-section {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }
  
  label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
  }
  
  input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .input-section {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  textarea {
    height: 100px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
  }
  
  button {
    padding: 12px 16px;
    background-color: #3B82F6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background-color: #2563eb;
  }
  
  button:disabled {
    background-color: #bbb;
    cursor: not-allowed;
  }
  
  .results-section {
    margin-bottom: 20px;
  }
  
  h3, h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
  }
  
  .separated-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .retrieval-content, .agent-answer, .separation-info {
    padding: 15px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .retrieval-content {
    border-left: 4px solid #3B82F6;
  }
  
  .agent-answer {
    border-left: 4px solid #10B981;
  }
  
  .separation-info {
    border-left: 4px solid #F59E0B;
  }
  
  .data-block, .info-block {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 6px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .info-block {
    font-size: 14px;
    color: #555;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .label {
    font-weight: 600;
    color: #555;
    margin-right: 5px;
  }
  
  pre {
    margin: 0;
    padding: 10px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    color: #333;
  }
  
  .raw-toggle {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .toggle-btn {
    align-self: flex-end;
    padding: 8px 12px;
    background-color: #f0f0f0;
    color: #555;
    font-size: 14px;
  }
  
  .toggle-btn:hover {
    background-color: #e5e5e5;
  }
  
  .raw-content {
    background-color: #fff;
    border: 1px solid #eee;
  }
  
  .no-data, .loading {
    text-align: center;
    padding: 30px;
    color: #666;
    font-style: italic;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .copy-section {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .copy-status {
    margin-left: 10px;
    color: #3B82F6;
    font-size: 14px;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    .copy-section {
      flex-direction: column;
      align-items: stretch;
    }
    
    .copy-status {
      margin-left: 0;
      margin-top: 10px;
      text-align: center;
    }
  }
  </style>



