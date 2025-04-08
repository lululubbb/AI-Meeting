<template>
  <div class="chat-stream-inspector">
    <h2 class="title">恒脑Agent问答</h2>

    <!-- Chat Area -->
    <div class="chat-area-container">
      <div class="chat-area" ref="chatArea">
        <!-- Initial Message -->
        <div v-if="chatLog.length === 0 && !isLoading && !streamStarted" class="system-message">
          <div class="welcome-icon">💬</div>
          <div>输入消息开始与智能体交互...</div>
        </div>
        <div v-if="isLoading && chatLog.length === 0" class="system-message loading">
          <div class="loading-animation">
            <span></span><span></span><span></span>
          </div>
          <div>建立连接中，请稍候...</div>
        </div>

        <!-- Chat Log -->
        <div v-for="item in chatLog" :key="item.id" class="chat-item" :class="{'user-item': item.type === 'user', 'agent-item': item.type === 'final_result'}">
          <!-- User Message -->
          <div v-if="item.type === 'user'" class="message user-message">
            <div class="message-header">
              <div class="user-avatar">👤</div>
              <div class="message-sender">用户</div>
            </div>
            <div class="message-content">{{ item.fullContent }}</div>
          </div>

          <!-- Agent Final Result -->
          <div v-if="item.type === 'final_result'" class="message agent-message">
            <div class="message-header">
              <div class="agent-avatar">🤖</div>
              <div class="message-sender">Agent</div>
            </div>
            <div class="message-content" v-html="renderMarkdown((item.fullContent))"></div>
          </div>

          <!-- Internal Step (Collapsible) - 简化版本 -->
          <div v-if="item.type === 'internal_step' && shouldShowStep(item.category)" class="internal-step" :class="{ 'is-expanded': item.isExpanded }">
            <div class="internal-step-summary" @click="toggleExpand(item)">
              <span class="summary-icon">{{ item.isExpanded ? '▼' : '▶' }}</span>
              <span class="summary-text">{{ filterNonChineseText(item.summary) }}</span>
              <span v-if="item.processedData && item.processedData.count" class="summary-badge">{{ item.processedData.count }}</span>
              <span class="summary-category">({{ getCategoryLabel(item.category) }})</span>
            </div>
            <div v-if="item.isExpanded" class="internal-step-content">
              <!-- 动作调用渲染 - 简化版 -->
              <div v-if="item.category === 'react_action'" class="action-call">
                <div class="action-title">{{ item.processedData ? item.processedData.actionName : '知识检索工具' }}</div>
              </div>
              
              <!-- 检索详情渲染 - 简化版 -->
              <div v-else-if="item.category === 'retrieval_doc_action'" class="retrieval-details">
                <div class="retrieval-status">
                  {{ item.processedData ? `已找回 ${item.processedData.count} 个文档` : '检索文档中...' }}
                </div>
              </div>
              
              <!-- 检索上下文渲染 - 优化版 -->
              <div v-else-if="item.category === 'retrieval_doc_context'" class="context-content">
                <div v-if="item.processedData && item.processedData.fragments.length > 0">
                  <div v-for="(fragment, index) in item.processedData.fragments" :key="index" class="context-fragment">
                    <div class="fragment-header">片段 {{ index + 1 }}</div>
                    <div class="fragment-content">
                      <!-- 标题区域 -->
                      <div v-if="fragment.title" class="fragment-title">{{ filterNonChineseText(fragment.title) }}</div>
                      
                      <!-- 元数据区域 -->
                      <div class="fragment-metadata">
                        <div v-if="fragment.date" class="fragment-date">
                          <span class="date-icon">📅</span>{{ filterNonChineseText(fragment.date) }}
                        </div>
                        <div v-if="fragment.tags && fragment.tags.length > 0" class="fragment-tags">
                          <span v-for="(tag, tagIndex) in fragment.tags" :key="tagIndex" class="fragment-tag">{{ filterNonChineseText(tag) }}</span>
                        </div>
                      </div>
                      
                      <!-- 描述区域 -->
                      <div v-if="fragment.description" class="fragment-description">{{ filterNonChineseText(fragment.description) }}</div>
                      
                      <!-- 图片区域 - 添加红色背景底色 -->
                      <div v-if="fragment.imageUrl" class="fragment-image-container">
                        <div class="image-wrapper">
                          <img :src="safeImageUrl(fragment.imageUrl)" :alt="fragment.title || '图片'" class="fragment-image" @error="handleImageError">
                        </div>
                        <div v-if="fragment.sourceLogo" class="fragment-source">
                          <div class="logo-wrapper">
                            <img :src="safeImageUrl(fragment.sourceLogo)" alt="来源" class="source-logo" @error="handleImageError">
                          </div>
                        </div>
                      </div>
                      
                      <!-- 内容区域 -->
                      <div v-if="fragment.content" class="fragment-text">{{ filterNonChineseText(fragment.content) }}</div>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div class="empty-fragment">未找到有效片段数据</div>
                </div>
              </div>
              
              <!-- 检索问答渲染 -->
              <div v-else-if="item.category === 'retrieval_doc_answer'" class="retrieval-answer">
                <div class="answer-content" v-html="renderMarkdown((item.fullContent))"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Loading indicator during stream -->
        <div v-if="isLoading && streamStarted" class="agent-thinking">
          <div class="agent-avatar-small">🤖</div>
          <div class="thinking-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
      <div class="preset-questions-container">
       <button
         v-for="(question, index) in presetQuestions"
         :key="`preset-${index}`"
         class="preset-question-button"
         @click="sendPresetQuestion(question)"
         :disabled="isLoading"
       >
         {{ question }}
       </button>
    </div>

    </div>



    <!-- Input Section -->
    <div class="input-section">
      <textarea v-model="userInput" placeholder="输入要发送的消息..." @keydown.enter.prevent="handleEnterKey"></textarea>
      <button @click="inspectStream" :disabled="isLoading || !userInput.trim()">
        <span v-if="!isLoading">发送</span>
        <span v-else class="send-loading">
          <div class="loading-dots"><span></span><span></span><span></span></div>
        </span>
      </button>
    </div>

    <!-- Action Buttons Section -->
    <div class="action-buttons">
      <button @click="toggleRawData" :disabled="!streamStarted && rawStreamData.length === 0">
        {{ showRawData ? '隐藏' : '显示' }}原始数据
      </button>
      <button @click="copyAllRawData" :disabled="rawStreamData.length === 0">
        复制原始数据
      </button>
      <button @click="copyChatLog" :disabled="chatLog.length === 0">
        复制对话记录
      </button>
      <div v-if="copyStatus" class="copy-status">
        {{ copyStatus }}
      </div>
    </div>

    <!-- Raw Stream Data Section (Optional Debug) -->
    <div class="raw-data-section" v-if="showRawData">
      <h3>原始流数据块 (Debug):</h3>
      <div v-if="rawStreamData.length === 0 && !isLoading && !streamStarted" class="no-data">
        尚未收到数据块
      </div>
      <div v-if="isLoading && rawStreamData.length === 0 && streamStarted" class="loading">
        正在等待第一个数据块...
      </div>
      <div v-if="rawStreamData.length > 0" class="raw-data-display">
        <div v-for="(chunk, index) in rawStreamData" :key="'raw-'+index" class="data-chunk">
          <h5>原始数据块 #{{ index + 1 }} (来源: {{ chunk.data && chunk.data.from ? chunk.data.from : 'N/A' }})</h5>
          <pre>{{ formatJson(chunk) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'; // For rendering Markdown in final answer

export default {
  name: 'ChatStreamInspector',

  data() {
    return {
      agentId: "7b3ff8c4-a7d6-440c-bb4d-32cf3eed8bdc", // 固定的AgentId
      userInput: "", // Start empty
      isLoading: false,
      rawStreamData: [],
      currentSessionId: '',
      copyStatus: "",
      buffer: '',
      streamStarted: false,
      showRawData: false,
      imageErrorCount: {}, // 记录图片加载错误次数

      // The new structure for the chat log
      chatLog: [], // Array of { id, type: 'user'|'final_result'|'internal_step', category?, summary?, fullContent, isExpanded? }

      internalCategories: [
        'react_action',
        'retrieval_doc_action',
        'retrieval_doc_context',
        'retrieval_doc_answer',
        // 移除了 'react_observe'
      ],
      categoryLabels: {
        'user': '用户',
        'react_action': '动作调用',
        'retrieval_doc_action': '检索详情',
        'retrieval_doc_context': '检索上下文',
        'retrieval_doc_answer': '检索问答生成',
        'execute_result': 'Agent 回答'
      },
      preformattedCategories: [
        'retrieval_doc_context',
        'react_action',
        'retrieval_doc_action',
      ],
      presetQuestions: [
        '你好，介绍一下你自己。',
        '介绍一下 2024年大会的详细信息。',
        '介绍一下 2024年大会的参会人员。',
              '关于大会你还知道什么？'
      ]
    }
  
  },

  created() {
    this.generateSessionId();
    // Configure marked
    marked.setOptions({
      breaks: true, // Add <br> on single newlines
      gfm: true,    // Use GitHub Flavored Markdown
    });
  },

  methods: {

      // ***** 新增：处理预设问题点击的方法 *****
      sendPresetQuestion(question) {
      if (this.isLoading) return; // 如果正在加载，则不执行
      this.userInput = question;   // 将问题填充到输入框
      this.inspectStream();       // 触发发送
    },

    
    // 过滤非中文文本 - 新增方法，只保留中文和中文标点
    filterNonChineseText(text) {
  if (!text) return '';
  
  // 匹配中文字符、中文标点符号、表情符号和数字
  return text.replace(/[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\u2000-\u206f\u2600-\u27ff\d]/g, '');
},
    
    // 安全处理图片URL
    safeImageUrl(url) {
      if (!url) return '';
      
      // 处理特殊URL scheme
      if (url.startsWith('image:')) {
        // 将image:协议转换为正常的HTTP请求，例如可以重定向到占位图片
        return '/images/placeholder.png';
      }
      
      return url;
    },
    
    // 处理图片加载错误
    handleImageError(event) {
      const imgElement = event.target;
      const imgSrc = imgElement.src;
      
      // 记录特定图片URL的错误次数
      if (!this.imageErrorCount[imgSrc]) {
        this.imageErrorCount[imgSrc] = 0;
      }
      
      this.imageErrorCount[imgSrc]++;
      
      // 如果错误次数小于3，尝试使用占位图片替换
      if (this.imageErrorCount[imgSrc] < 3) {
        imgElement.src = '/images/placeholder.png';
      } else {
        // 超过尝试次数，隐藏图片
        imgElement.style.display = 'none';
      }
    },

    // 判断是否应该显示该步骤
    shouldShowStep(category) {
      // 不显示内部观察步骤
      return category !== 'react_observe';
    },

    generateSessionId() {
      this.currentSessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    // Reset state before a new stream interaction
    resetStreamState(keepUserInput = false) {
      this.rawStreamData = [];
      this.buffer = '';
      this.copyStatus = "";
      this.streamStarted = false;
      this.imageErrorCount = {}; // 重置图片错误计数
      if (!keepUserInput) {
        this.userInput = '';
      }
    },

    handleEnterKey(event) {
      if (event.shiftKey) {
        // Allow shift+enter for newlines
        return;
      }
      this.inspectStream();
    },

    async inspectStream() {
            // 在方法开始处添加检查 (如果还没有的话)
            if (this.isLoading) {
        console.warn("Already processing a request.");
        return;
      }

      if (!this.userInput.trim() || this.isLoading) {
        if (!this.userInput.trim()) {
          alert("请输入消息。");
        }
        return;
      }

      this.isLoading = true;
      this.resetStreamState(true); // Keep user input for display

      // 1. Add user message to chat log immediately
      this.chatLog.push({
        id: `user-${Date.now()}`,
        type: 'user',
        fullContent: this.userInput,
      });
      const userMessageSent = this.userInput; // Store it before clearing
      this.userInput = ''; // Clear input field
      this.scrollToBottom();

      try {
        const payload = {
          id: this.agentId,
          input: userMessageSent, // Use the stored message
          sid: this.currentSessionId,
          stream: true
        };

        const response = await fetch(`/api/proxy/agent/execute`, { // Ensure proxy path is correct
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          let errorBody = `HTTP错误! 状态: ${response.status}`;
          try { const errorData = await response.json(); errorBody += `\n错误信息: ${JSON.stringify(errorData)}`; } catch(e) { /* ignore parsing error */ }
          this.addErrorToChatLog(`请求失败: ${errorBody}`);
          throw new Error(errorBody);
        }
        if (!response.body) {
          this.addErrorToChatLog("请求成功，但响应体不存在");
          throw new Error("响应体不存在");
        }

        this.streamStarted = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // --- Stream Processing Logic ---
        const processChunk = (chunk) => {
          // Optionally keep raw data for debug view
          if (this.showRawData) {
            this.rawStreamData.push(chunk);
          }

          if (!chunk.data || chunk.data.content === undefined || !chunk.data.from) {
            console.warn("Received chunk without expected data structure:", chunk);
            return; // Skip malformed chunks
          }

          const category = chunk.data.from;
          const content = chunk.data.content;

          // Find the last item in the log
          const lastItem = this.chatLog.length > 0 ? this.chatLog[this.chatLog.length - 1] : null;

          if (category === 'execute_result') {
            // === Final Result Handling ===
            if (lastItem && lastItem.type === 'final_result') {
              // Append to existing final result message
              lastItem.fullContent += content;
            } else {
              // Start a new final result message
              this.chatLog.push({
                id: `agent-${Date.now()}`,
                type: 'final_result',
                category: category,
                fullContent: content, // Start with the first chunk
              });
            }
            this.scrollToBottom(); // Scroll as final answer streams
          } else if (this.internalCategories.includes(category)) {
            // === Internal Step Handling ===
            if (lastItem && lastItem.type === 'internal_step' && lastItem.category === category) {
              // Append to existing internal step's full content
              lastItem.fullContent += content;
              
              // Process special content based on category
              this.processStepContent(lastItem);
              
              // Update summary
              lastItem.summary = this.generateStepSummary(category, lastItem.fullContent, true);
            } else {
              // Start a new internal step log entry
              const newItem = {
                id: `internal-${category}-${Date.now()}`,
                type: 'internal_step',
                category: category,
                summary: this.generateStepSummary(category, content, true), // Initial summary
                fullContent: content, // Start with the first chunk
                isExpanded: false, // Start collapsed
                processedData: null // Will be populated by processStepContent
              };
              
              this.chatLog.push(newItem);
              this.processStepContent(newItem); // Process initial content
            }
          } else {
            console.warn("Uncategorized data 'from':", category, "Content:", content);
            // Optionally handle unknown categories
          }
        };

        // --- SSE Parsing Loop ---
        const processLine = (line) => {
          if (line.startsWith('data:')) {
            try {
              const jsonStr = line.slice(5).trim();
              if (jsonStr) {
                const parsedChunk = JSON.parse(jsonStr);
                processChunk(parsedChunk); // Process the valid chunk
              }
            } catch (e) {
              console.warn('Stream parsing warning:', e, 'Raw data:', line.slice(5));
              if (this.showRawData) {
                this.rawStreamData.push({ error: 'JSON Parse Error', raw: line.slice(5) });
              }
            }
          } else if (line.trim() && !line.startsWith('event:') && !line.startsWith('id:') && !line.startsWith('retry:')) {
            // Ignore standard SSE fields, log others
            console.log("Received non-'data:' line:", line);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          this.buffer += chunkText;

          const lines = this.buffer.split('\n');
          this.buffer = lines.pop() || ''; // Keep potentially incomplete last part

          lines.forEach(processLine);
        }

        // Process any complete line remaining in the buffer
        if (this.buffer.startsWith('data:')) { // Only process if it looks like a data line
          processLine(this.buffer);
        }

        // --- Stream End ---
        const lastItem = this.chatLog.length > 0 ? this.chatLog[this.chatLog.length - 1] : null;
        if(lastItem && lastItem.type === 'internal_step') {
          this.processStepContent(lastItem, true); // Final processing
          lastItem.summary = this.generateStepSummary(lastItem.category, lastItem.fullContent, false); // Mark as finished
        }
      } catch (error) {
        console.error('Request failed:', error);
      } finally {
        this.isLoading = false;
        this.streamStarted = true;
        this.scrollToBottom();
      }
    },

    // 处理特殊内容 - 增强版
    processStepContent(item, isFinal = false) {
      if (!item || !item.category || !item.fullContent) return;
      
      try {
        // 动作调用处理 - 简化版
        if (item.category === 'react_action') {
          const content = item.fullContent;
          const actionMatch = content.match(/(.+?)\s*-\s*(.+)/);
          if (actionMatch && actionMatch.length >= 3) {
            item.processedData = {
              actionName: "知识检索工具",
              params: actionMatch[2].trim()
            };
          } else {
            item.processedData = {
              actionName: "知识检索工具",
              params: ""
            };
          }
        }
        
        // 检索详情处理 - 简化版，只统计数量
        else if (item.category === 'retrieval_doc_action') {
          const content = item.fullContent;
          // 提取文档ID
          const idMatches = content.match(/"([^"]+)"/g);
          if (idMatches) {
            const uniqueDocIds = [...new Set(idMatches.map(id => id.replace(/"/g, '')))];
            item.processedData = {
              count: uniqueDocIds.length
            };
          } else {
            item.processedData = {
              count: 0
            };
          }
        }
        
        // 检索上下文处理 - 增强版
        else if (item.category === 'retrieval_doc_context') {
          const content = item.fullContent;
          // 分割片段
          const fragments = [];
          
          // 使用正则表达式匹配"片段X:"开头的行
          const fragmentRegex = /片段\d+:/g;
          let match;
          const startPositions = [];
          
          // 找出所有片段开始位置
          let fragmentsContent = content;
          while ((match = fragmentRegex.exec(fragmentsContent)) !== null) {
            startPositions.push(match.index);
          }
          
          // 如果没有找到片段标记，尝试将整个内容作为一个片段处理
          if (startPositions.length === 0) {
            fragments.push({
              content: content.replace(/\\n/g, ' ').trim()
            });
          } else {
            // 根据位置分割片段
            for (let i = 0; i < startPositions.length; i++) {
              const start = startPositions[i];
              const end = i < startPositions.length - 1 ? startPositions[i + 1] : fragmentsContent.length;
              let fragmentText = fragmentsContent.substring(start, end);
              
              // 清理片段文本，去掉片段标记
              fragmentText = fragmentText.replace(/^片段\d+:\s*/, '').trim();
              
              // 尝试解析格式化内容
              const parsedFragment = this.parseFragmentContent(fragmentText);
              fragments.push(parsedFragment);
            }
          }
          
          item.processedData = {
            fragments: fragments
          };
        }
      } catch (error) {
        console.error('处理步骤内容错误:', error);
      }
    },

    // 解析片段内容，提取结构化信息
    parseFragmentContent(text) {
      // 基础片段对象
      const fragment = {};
      
      // 提取标题 - 支持多种可能的格式
      const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
      if (titleMatch) {
        fragment.title = titleMatch[1].trim();
      }
      
      // 提取日期
      const dateMatch = text.match(/"date"\s*:\s*"([^"]+)"/);
      if (dateMatch) {
        fragment.date = dateMatch[1].trim();
      }
      
      // 提取描述
      const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/);
      if (descMatch) {
        fragment.description = descMatch[1].trim();
      }
      
      // 尝试直接提取content内容
      const contentStartMatch = text.match(/"content"\s*:\s*"/);
      if (contentStartMatch) {
        // 找到content字段开始位置
        const startIndex = contentStartMatch.index + contentStartMatch[0].length;
        
        // 尝试找到下一个非转义引号作为结束位置
        let endIndex = text.indexOf('",', startIndex);
        if (endIndex === -1) {
          endIndex = text.indexOf('"', startIndex);
        }
        
        // 提取内容字段
        if (endIndex > startIndex) {
          let content = text.substring(startIndex, endIndex);
          fragment.content = content
            .replace(/\\"/g, '"')  // 恢复转义的引号
            .replace(/\\n/g, ' ')  // 替换转义的换行符
            .replace(/\n/g, ' ')   // 替换实际的换行符
            .replace(/\s+/g, ' ')  // 合并空白
            .trim();
        } else {
          // 如果无法确定content结束位置，则作简单清理
          fragment.content = this.cleanFragmentContent(text);
        }
      } else {
        // 如果找不到明确的content字段, 尝试清理整个文本
        fragment.content = this.cleanFragmentContent(text);
      }
      
      // 提取图片URL - 优先检查image字段
      const imageMatch = text.match(/"image"\s*:\s*"(https:\/\/[^"]+)"/);
      if (imageMatch) {
        fragment.imageUrl = imageMatch[1];
      } else {
        // 尝试匹配url中的图片链接
        const urlImageMatch = text.match(/"url"\s*:\s*"[^"]*"\s*,\s*"image"\s*:\s*"(https:\/\/[^"]+)"/);
        if (urlImageMatch) {
          fragment.imageUrl = urlImageMatch[1];
        } else {
          // 尝试直接从文本中提取图片URL
          const imgMatch = text.match(/https:\/\/[^"\s]+\.(jpg|jpeg|png|gif)/i);
          if (imgMatch) {
            fragment.imageUrl = imgMatch[0];
          }
        }
      }
      
      // 提取源站logo
      const sourceLogoMatch = text.match(/"sourceLogo"\s*:\s*"(https:\/\/[^"]+)"/);
      if (sourceLogoMatch) {
        fragment.sourceLogo = sourceLogoMatch[1];
      }

      // 提取标签
      const tagsMatch = text.match(/"tags"\s*:\s*\[(.*?)\]/);
      if (tagsMatch && tagsMatch[1]) {
        const tagsText = tagsMatch[1];
        const tagsList = tagsText.match(/"([^"]+)"/g);
        if (tagsList) {
          fragment.tags = tagsList.map(tag => tag.replace(/"/g, ''));
        }
      }
      
      return fragment;
    },

    // 清理内容文本，移除格式性质信息
    cleanFragmentContent(content) {
      if (!content) return '';
      
      // 先进行基础清理
      let cleanedText = content
        .replace(/\\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 移除所有已知的元数据字段及其值
      const metadataPatterns = [
        /"(tags|url|image|sourceLogo|date|title|description)"\s*:\s*"[^"]*"/g,  // 键值对
        /"(tags)"\s*:\s*\[[^\]]*\]/g,                                       // 数组值
        /https?:\/\/[^\s"]+/g,                                             // URL
        /obs[^"]*\.(jpg|png|gif)/gi,                                       // 图片路径
        /\.(jpg|png|gif)["]/gi                                             // 文件扩展名
      ];
      
      metadataPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
      });
      
      // 移除JSON语法符号并清理
      cleanedText = cleanedText
        .replace(/[{}\[\],]/g, ' ')     // 移除括号和逗号
        .replace(/"\s*:\s*"/g, ' ')     // 移除键值分隔符
        .replace(/"/g, ' ')             // 移除引号
        .replace(/\\+/g, ' ')           // 移除反斜杠
        .replace(/content\s*:/gi, '')   // 移除content:标记
        .replace(/\s+/g, ' ')           // 合并空白
        .trim();
      
      return cleanedText;
    },

    addErrorToChatLog(errorMessage) {
      this.chatLog.push({
        id: `error-${Date.now()}`,
        type: 'system_error',
        fullContent: `⚠️ **错误:** ${errorMessage}`
      });
      this.scrollToBottom();
    },

    // 生成内部步骤摘要 - 简化版
    generateStepSummary(category, content, isInProgress) {
      if (category === 'react_action') {
        return `${isInProgress ? '⏳' : '✅'} 工具调用`;
      } 
      else if (category === 'retrieval_doc_action') {
        const idMatches = content.match(/"([^"]+)"/g);
        const count = idMatches ? idMatches.length : 0;
        return `${isInProgress ? '⏳' : '✅'} 找回文档中`;
      }
      else if (category === 'retrieval_doc_context') {
        // 计算片段数量
        const fragmentMatches = content.match(/片段\d+:/g);
        const count = fragmentMatches ? fragmentMatches.length : 0;
        return `${isInProgress ? '⏳' : '✅'} 分析检索上下文`;
      }
      else if (category === 'retrieval_doc_answer') {
        return `${isInProgress ? '⏳' : '✅'} 生成检索回答`;
      }
      
      // 默认摘要
      const label = this.getCategoryLabel(category) || category;
      return `${isInProgress ? '⏳' : '✅'} ${label}`;
    },

    toggleExpand(item) {
      if (item.type === 'internal_step') {
        item.isExpanded = !item.isExpanded;
      }
    },

    scrollToBottom(force = true) {
      this.$nextTick(() => {
        const chatArea = this.$refs.chatArea;
        if (chatArea) {
          const threshold = 100; // Pixels from bottom
          const shouldScroll = force || (chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < threshold);
          if(shouldScroll) {
            chatArea.scrollTop = chatArea.scrollHeight;
          }
        }
      });
    },

    formatJson(chunk) {
      try { return JSON.stringify(chunk, null, 2); }
      catch (e) { return `[Cannot format: ${e.message}] \n ${String(chunk)}`; }
    },

    renderMarkdown(text) {
      // Basic sanitization
      const sanitized = text.replace(/</g, "<").replace(/>/g, ">");
      return marked(sanitized || '');
    },

    // Copy Functions
    copyAllRawData() {
      if (this.rawStreamData.length === 0) return;
      const allDataString = this.rawStreamData.map(chunk => this.formatJson(chunk)).join('\n\n---\n\n');
      navigator.clipboard.writeText(allDataString)
        .then(() => { this.setCopyStatus("所有原始数据块已复制"); })
        .catch(err => { console.error('Copy raw failed:', err); this.setCopyStatus("复制原始数据失败"); });
    },

    copyChatLog() {
      if (this.chatLog.length === 0) return;
      let textToCopy = "";
      this.chatLog.forEach(item => {
        if (item.type === 'user') {
          textToCopy += `👤 用户:\n${item.fullContent}\n\n`;
        } else if (item.type === 'final_result') {
          textToCopy += `🤖 Agent:\n${this.filterNonChineseText(item.fullContent)}\n\n`;
        } else if (item.type === 'internal_step' && this.shouldShowStep(item.category)) {
          const label = this.getCategoryLabel(item.category);
          textToCopy += `⚙️ 内部步骤 (${label}):\n`;
          textToCopy += this.filterNonChineseText(item.fullContent) || "[无详细内容]";
          textToCopy += "\n\n";
        } else if (item.type === 'system_error') {
          textToCopy += `⚠️ 系统错误:\n${item.fullContent}\n\n`;
        }
      });

      navigator.clipboard.writeText(textToCopy.trim())
        .then(() => { this.setCopyStatus("对话记录已复制"); })
        .catch(err => { console.error('Copy chat log failed:', err); this.setCopyStatus("复制对话记录失败"); });
    },

    setCopyStatus(message) {
      this.copyStatus = message;
      setTimeout(() => { this.copyStatus = ""; }, 3000);
    },

    getCategoryLabel(category) {
      return this.categoryLabels[category] || category;
    },

    isPreformattedCategory(category) {
      return this.preformattedCategories.includes(category);
    },

    toggleRawData() {
      this.showRawData = !this.showRawData;
    }
  }
}
</script>

<style>
/* --- Base Styles --- */
.chat-stream-inspector {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  max-width: 900px;
  margin: 20px auto;
  background-color: #f7f7f7; /* Source: Page Background */
  border-radius: 12px; /* Softened radius */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); /* Source: Modal Shadow (adjusted alpha) */
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  border: 1px solid #ddd; /* Source: Borders/Separators */
}

.title {
  text-align: center;
  margin: 18px 0;
  color: #333; /* Source: Dark Text */
  font-size: 1.6em;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* --- Chat Area --- */
.chat-area-container {
  flex-grow: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: #f7f7f7; /* Source: Page Background */
  border-top: 1px solid #ddd; /* Source: Borders/Separators */
  border-bottom: 1px solid #ddd; /* Source: Borders/Separators */
}

.chat-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f7f7f7; /* Source: Scrollbar Colors */
}

.chat-area::-webkit-scrollbar { width: 5px; }
.chat-area::-webkit-scrollbar-track { background: #f7f7f7; border-radius: 3px; }
.chat-area::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
.chat-area::-webkit-scrollbar-thumb:hover { background-color: #aaa; } /* Slightly darker gray for hover */

/* --- Welcome Message --- */
.system-message {
  text-align: center;
  padding: 16px 20px;
  color: #666; /* Source: Medium Gray Text */
  font-size: 15px;
  width: fit-content;
  margin: 20px auto;
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* Source: Subtle Shadow */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.welcome-icon {
  font-size: 28px;
  margin-bottom: 5px;
  /* Keeping specific gradient for identity, but using source blue shades */
  background: linear-gradient(135deg, #409eff, #1a73e8); /* Source: Blue Accent Variants */
  color: white;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(26, 115, 232, 0.2); /* Source: Blue Shadow */
}

/* --- Messages & Headers --- */
.chat-item {
  max-width: 85%;
  transition: all 0.3s ease;
}

.user-item {
  align-self: flex-end;
}

.agent-item {
  align-self: flex-start;
}

.message {
  border-radius: 20px;
  padding: 0; /* Remove outer padding */
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03); /* Adjusted shadow alpha */
  transition: transform 0.15s ease;
  overflow: hidden; /* Ensure content stays within rounded corners */
}

.message:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04); /* Adjusted shadow alpha */
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px 8px;
  background-color: rgba(255, 255, 255, 0.9); /* Slightly more opaque white */
  border-bottom: 1px solid #eee; /* Source: Lighter Border */
}

/* Keep avatar gradients as they define identity, not present in source CSS */
.user-avatar, .agent-avatar {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  /* background-color: #f0f4ff; No direct equivalent in source, keep or use #f0f0f0? Use #f0f0f0 */
  background-color: #f0f0f0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Source: Subtle Shadow */
}

.user-avatar {
  background: linear-gradient(135deg, #409eff, #1a73e8); /* Source: Blue Accent Variants */
  color: white;
}

.agent-avatar {
  /* Keep purple gradient as it's specific to Agent identity */
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.agent-avatar-small {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Keep purple gradient */
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
  /* Shadow doesn't have direct equivalent, use standard shadow */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message-sender {
  font-weight: 600;
  color: #444; /* Source: Darker Gray Text */
  font-size: 14px;
  letter-spacing: -0.2px;
}

.message-content {
  padding: 14px 18px;
  line-height: 1.6;
  word-wrap: break-word;
  font-size: 15px;
  white-space: pre-wrap;
}

.user-message {
  /* Use solid blue from source */
  background-color: #1a73e8; /* Source: Primary Blue Accent Solid */
  color: #ffffff;
  border-bottom-right-radius: 6px; /* Keep specific radius */
  margin-left: auto;
}

.user-message .message-header {
  /* Use subtle contrast on blue */
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff; /* Ensure text is white */
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}
/* Ensure sender text color is white on user header */
.user-message .message-sender {
    color: #ffffff;
}


.agent-message {
  background-color: #ffffff; /* Source: White Content Panel */
  color: #333; /* Source: Dark Text */
  border-bottom-left-radius: 6px; /* Keep specific radius */
  /* box-shadow already defined in .message */
}
/* Style agent message header */
.agent-message .message-header {
    background-color: #f9f9f9; /* Source: Light Gray Panel */
    border-bottom: 1px solid #eee; /* Source: Lighter Border */
}
.agent-message .message-sender {
    color: #555; /* Source: Darker Medium Gray Text */
}


/* --- Internal Steps --- */
.internal-step {
  background-color: #f9f9f9; /* Source: Lighter Gray Panel */
  border: 1px solid #eee; /* Source: Lighter Border */
  border-radius: 12px;
  padding: 0;
  font-size: 13px;
  color: #555; /* Source: Darker Medium Gray Text */
  transition: all 0.25s ease;
  align-self: flex-start;
  width: 92%;
  margin-right: auto;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03); /* Adjusted alpha */
}

.internal-step.is-expanded {
  background-color: #ffffff; /* Source: White Panel */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.06); /* Adjusted alpha */
  border-color: #ddd; /* Source: Slightly Darker Border */
}

.internal-step-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: transparent; /* Inherit */
  border-bottom: 1px solid #eee; /* Source: Lighter Border */
  transition: background-color 0.2s ease;
}
/* Explicit background for expanded summary header */
.internal-step.is-expanded .internal-step-summary {
    background-color: #f5f5f5; /* Slightly darker light gray */
}

.internal-step-summary:hover {
  background-color: #f0f0f0; /* Source: Secondary Panel Hover */
}

.summary-icon {
  font-size: 10px;
  line-height: 1;
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  color: #666; /* Source: Medium Gray Text */
  background-color: #fff; /* Source: White Background */
  border-radius: 50%;
  border: 1px solid #ddd; /* Source: Border */
}

.is-expanded .summary-icon {
  background-color: #1a73e8; /* Source: Primary Blue Accent */
  color: white;
  border-color: #1a73e8;
}

.summary-text {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 10px;
  font-weight: 500;
  color: #444; /* Source: Darker Gray Text */
}

.summary-badge {
  background-color: #1a73e8; /* Source: Primary Blue Accent Solid */
  color: white;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: bold;
  margin-right: 8px;
  letter-spacing: 0.2px;
}

.summary-category {
  font-size: 0.85em;
  color: #888; /* Source: Lighter Medium Gray */
  white-space: nowrap;
  opacity: 0.8;
}

.internal-step-content {
  padding: 16px;
  color: #333; /* Source: Dark Text */
  max-height: 450px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc #fff; /* Source: Scrollbar Colors */
  background-color: #fff; /* Source: White Background */
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.internal-step-content::-webkit-scrollbar { width: 4px; }
.internal-step-content::-webkit-scrollbar-track { background: #fff; }
.internal-step-content::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 4px; }

/* Special Content Styling */
.action-call {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-title {
  font-weight: 600;
  color: #444; /* Source: Darker Gray Text */
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-title::before {
  content: "⚙️"; /* Gear icon */
  font-size: 18px;
}

.retrieval-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retrieval-status {
  font-weight: 500;
  color: #1a73e8; /* Source: Primary Blue */
  background-color: #e8f0fe; /* Light blue background (derived) */
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 3px solid #1a73e8; /* Source: Primary Blue */
  display: flex;
  align-items: center;
  gap: 10px;
}

.retrieval-status::before {
  content: "📊"; /* Bar chart icon */
  font-size: 18px;
}

/* Context fragments styling */
.context-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 5px 0;
}

.context-fragment {
  background-color: #ffffff; /* Source: White Panel */
  border: 1px solid #eee; /* Source: Lighter Border */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05); /* Adjusted alpha */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 16px;
}

.context-fragment:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Adjusted alpha */
}

.fragment-header {
  background: #f9f9f9; /* Source: Lighter Gray Panel */
  padding: 10px 14px;
  font-weight: 600;
  color: #555; /* Source: Darker Medium Gray Text */
  font-size: 13px;
  border-bottom: 1px solid #eee; /* Source: Lighter Border */
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
}

.fragment-header::before {
  content: "📄"; /* Document icon */
  margin-right: 8px;
  font-size: 14px;
}

.fragment-content {
  padding: 16px;
  color: #333; /* Source: Dark Text */
  font-size: 14px;
  word-break: break-word;
  line-height: 1.6;
}

.fragment-title {
  font-size: 16px;
  font-weight: 700;
  color: #333; /* Source: Dark Text */
  margin-bottom: 12px;
  line-height: 1.4;
  border-left: 3px solid #1a73e8; /* Source: Primary Blue Accent */
  padding-left: 10px;
}

.fragment-metadata {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.fragment-date {
  font-size: 13px;
  color: #666; /* Source: Medium Gray Text */
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.date-icon {
  font-size: 12px;
}

.fragment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fragment-tag {
  background-color: #e8f0fe; /* Light blue background (derived) */
  color: #1a73e8; /* Source: Primary Blue */
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.fragment-description {
  font-size: 14px;
  color: #555; /* Source: Darker Medium Gray Text */
  margin-bottom: 14px;
  line-height: 1.6;
  font-style: italic;
  background-color: #f9f9f9; /* Source: Lighter Gray Panel */
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 2px solid #ccc; /* Source: Gray Border */
}

/* Image container styling */
.fragment-image-container {
  position: relative;
  margin: 10px 0 16px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08); /* Adjusted alpha */
  max-height: 200px;
  text-align: center;
  background-color: #f0f0f0; /* Source: Placeholder Background */
}

.image-wrapper {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0; /* Source: Placeholder Background */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.logo-wrapper {
  background-color: #ffffff; /* Source: White */
  padding: 2px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}
.fragment-source {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background-color: rgba(255, 255, 255, 0.85); /* Slightly more opaque white */
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.source-logo {
    width: 16px;
    height: 16px;
    object-fit: contain;
    display: block;
}

.fragment-image {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 8px; /* Match container */
}

.fragment-text {
  color: #444; /* Source: Darker Gray Text */
  line-height: 1.7;
  margin-top: 10px;
  white-space: normal;
}

.empty-fragment {
  background-color: #f9f9f9; /* Source: Lighter Gray Panel */
  padding: 20px;
  text-align: center;
  color: #777; /* Source: Medium Gray Text */
  border-radius: 8px;
  border: 1px dashed #ccc; /* Source: Gray Border */
}

.retrieval-answer {
  background-color: #f9f9f9; /* Source: Lighter Gray Panel */
  border-radius: 10px;
  padding: 16px;
  border-left: 3px solid #1a73e8; /* Source: Primary Blue Accent */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); /* Adjusted alpha */
}

.answer-content {
  color: #333; /* Source: Dark Text */
  line-height: 1.7;
}

/* Image error placeholder */
.image-error-placeholder {
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  color: #777; /* Source: Medium Gray Text */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  border-radius: 8px;
  border: 1px dashed #ccc; /* Source: Gray Border */
  font-size: 14px;
}

.image-error-placeholder::before {
  content: "🖼️";
  font-size: 24px;
  margin-right: 8px;
}

/* Markdown styling for answer content */
.answer-content p { margin-bottom: 1em; }
.answer-content p:last-child { margin-bottom: 0; }

.answer-content ul, .answer-content ol {
  margin-left: 20px;
  padding-left: 10px;
  margin-bottom: 1em;
}
.answer-content li { margin-bottom: 0.5em; }

.answer-content code {
  background-color: #eef2f9; /* Use light gray from source code style */
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: #444; /* Source: Darker Gray Text */
  border: 1px solid #ddd; /* Source: Border */
}

.answer-content pre {
  background-color: #2d3748; /* Keep dark for contrast, as in source example */
  color: #e2e8f0; /* Light text on dark */
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  margin: 1em 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}
.answer-content pre code {
  background-color: transparent;
  padding: 0;
  font-size: inherit;
  color: inherit;
  border: none;
}

.answer-content a {
  color: #1a73e8; /* Source: Primary Blue */
  text-decoration: none;
  border-bottom: 1px solid rgba(26, 115, 232, 0.3); /* Lighter underline */
  transition: border-color 0.2s;
}
.answer-content a:hover { border-bottom-color: #1a73e8; }

.answer-content blockquote {
  border-left: 3px solid #ccc; /* Source: Gray Border */
  padding-left: 16px;
  margin-left: 0;
  color: #555; /* Source: Darker Medium Gray Text */
}

/* Loading animations - Use Source Spinner */
.loading-animation {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
  /* Spinner styles */
  width: 24px;
  height: 24px;
  border: 3px solid #ccc; /* Source: Spinner Gray */
  border-top: 3px solid #1a73e8; /* Source: Spinner Blue */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
/* Hide original spans */
.loading-animation span { display: none; }

@keyframes spin { /* Source: Spinner Animation */
  0% { transform: rotate(0); }
  100% { transform: rotate(360deg); }
}


.agent-thinking {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  border-radius: 20px;
  align-self: flex-start;
  margin-top: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); /* Adjusted alpha */
}

.thinking-dots { display: flex; align-items: center; }
.thinking-dots span {
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #1a73e8; /* Source: Primary Blue */
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out both;
}
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 100% { transform: scale(0.6); opacity: 0.6; }
  50% { transform: scale(1); opacity: 1; }
}

/* --- System & Error Messages --- */
.system-message.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.raw-data-section .no-data,
.raw-data-section .loading {
  text-align: center;
  padding: 14px 18px;
  color: #666; /* Source: Medium Gray Text */
  font-size: 14px;
  width: fit-content;
  margin: 10px auto;
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Source: Subtle Shadow */
}

/* --- Preset Questions --- */
.preset-questions-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 20px 10px; /* Adjusted padding */
    background-color: #f7f7f7; /* Source: Page Background */
    border-bottom: 1px solid #eee; /* Source: Lighter Border */
}

.preset-question-button {
    padding: 6px 12px;
    background-color: #fff; /* Source: White Background */
    color: #1a73e8; /* Source: Primary Blue Text */
    border: 1px solid #ccc; /* Source: Border */
    border-radius: 15px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.preset-question-button:hover:not(:disabled) {
    background-color: #e8f0fe; /* Light blue hover */
    border-color: #a0cfff; /* Lighter blue border */
    color: #105fbb; /* Darker blue text */
}

.preset-question-button:active:not(:disabled) {
    transform: scale(0.98);
}


/* --- Input Section --- */
.input-section {
  display: flex;
  padding: 20px 24px;
  background-color: #ffffff; /* Source: White Panel */
  gap: 14px;
  align-items: flex-end;
  border-top: 1px solid #ddd; /* Source: Border */
  /* Removed bottom radius */
  margin-bottom: 15px; 
}

textarea {
  flex-grow: 1;
  padding: 16px 18px;
  border: 1px solid #ccc; /* Source: Border */
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  min-height: 24px;
  max-height: 200px;
  overflow-y: auto;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) inset; /* Adjusted alpha */
  color: #333; /* Source: Dark Text */
}

textarea:focus {
  outline: none;
  border-color: #1a73e8; /* Source: Focus Blue */
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15); /* Adjusted alpha */
}

textarea::placeholder {
  color: #aaa; /* Lighter placeholder */
}

.input-section button {
  padding: 12px 24px;
  background-color: #1a73e8; /* Source: Primary Blue Solid */
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: fit-content;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  box-shadow: 0 3px 10px rgba(26, 115, 232, 0.2); /* Source: Blue Shadow */
  letter-spacing: 0.3px;
}

.input-section button:hover:not(:disabled) {
  background-color: #1558b0; /* Darker blue hover */
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25); /* Adjusted alpha */
  transform: translateY(-1px);
}

.input-section button:active:not(:disabled) {
  transform: translateY(0px); /* Remove active shift */
  background-color: #124a9c; /* Even darker blue */
  box-shadow: 0 2px 5px rgba(26, 115, 232, 0.2); /* Adjusted alpha */
}

.input-section button:disabled {
  background-color: #a0cfff; /* Lighter blue disabled */
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.send-loading { display: flex; align-items: center; justify-content: center; }
.loading-dots { display: flex; align-items: center; justify-content: center; }
.loading-dots span {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin: 0 2px;
  background-color: white;
  border-radius: 50%;
  animation: pulse 1.2s infinite ease-in-out both;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

/* --- Action Buttons --- */
.action-buttons {
  display: flex;
  gap: 10px;
  padding: 14px 24px;
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  flex-wrap: wrap;
  align-items: center;
  border-top: 1px solid #ddd; /* Source: Border */
}

.action-buttons button {
  padding: 8px 16px;
  background-color: #fff; /* Source: White Button */
  color: #555; /* Source: Darker Medium Gray Text */
  border: 1px solid #ccc; /* Source: Border */
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-buttons button:hover:not(:disabled) {
  background-color: #eee; /* Source: Lighter Gray Hover */
  color: #333; /* Source: Dark Text */
  border-color: #bbb; /* Slightly darker border */
}

.action-buttons button:active:not(:disabled) {
  transform: translateY(1px);
}

.action-buttons button:disabled {
  opacity: 0.6; /* Adjusted opacity */
  cursor: not-allowed;
}

.copy-status {
  font-size: 13px;
  color: #16a34a; /* Source: Green Success */
  margin-left: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.copy-status::before { content: "✓"; font-weight: bold; }

/* --- Raw Data Section --- */
.raw-data-section {
  padding: 16px 24px;
  background-color: #f0f0f0; /* Source: Secondary Panel Background */
  border-top: 1px solid #ddd; /* Source: Border */
  max-height: 400px;
  overflow-y: auto;
  font-size: 13px;
}

.raw-data-section h3 {
  margin: 0 0 16px 0;
  font-size: 1.1em;
  color: #555; /* Source: Darker Medium Gray Text */
  display: flex;
  align-items: center;
  gap: 6px;
}
.raw-data-section h3::before { content: "🔍"; font-size: 16px; }

.raw-data-display {
  max-height: 350px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid #ddd; /* Source: Border */
  background-color: #ffffff; /* Source: White Panel */
}

.data-chunk {
  background-color: #fff; /* Source: White */
  border-bottom: 1px solid #eee; /* Source: Lighter Border */
  padding: 14px;
}
.data-chunk:last-child { border-bottom: none; }

.data-chunk h5 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 0.9em;
  color: #777; /* Source: Medium Gray Text */
  border-bottom: 1px solid #eee; /* Source: Lighter Border */
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.data-chunk h5::before { content: "📄"; font-size: 14px; }

.data-chunk pre {
  margin: 0;
  padding: 14px;
  background-color: #f9f9f9; /* Source: Lighter Gray Panel */
  border-radius: 8px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #444; /* Source: Darker Gray Text */
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee; /* Source: Lighter Border */
}

/* --- Responsive Adjustments --- */
@media (max-width: 768px) {
  .chat-stream-inspector {
    margin: 10px;
    height: calc(100vh - 20px);
    max-width: none;
    border-radius: 10px; /* Adjusted */
  }
  .title { font-size: 1.4em; margin: 15px 0; }
  .chat-area { padding: 16px; gap: 20px; }
  .message-content { padding: 12px 16px; font-size: 14px; }
  .internal-step { width: 95%; }
  .preset-questions-container { padding: 10px 15px 10px; }
  .preset-question-button { padding: 5px 10px; font-size: 11px; }
  .input-section { padding: 16px; }
  .input-section button { padding: 10px 20px; font-size: 14px; }
  .action-buttons { padding: 12px 16px; }
  .action-buttons button { padding: 6px 12px; font-size: 11px; }
}

@media (max-width: 480px) {
  .chat-stream-inspector {
    margin: 0;
    height: 100vh;
    border-radius: 0;
    border: none;
  }
  .chat-item { max-width: 95%; }
  .title { font-size: 1.3em; margin: 12px 0; }
  .message-header { padding: 10px 14px 6px; }
  .message-content { padding: 10px 14px; font-size: 14px; }
  .preset-questions-container { padding: 8px 10px 8px; gap: 6px; }
  .preset-question-button { padding: 4px 8px; font-size: 10px; }
  .input-section { padding: 12px; }
  .input-section button { padding: 10px 16px; min-width: 80px; font-size: 14px; }
  .internal-step-summary { padding: 10px 14px; }
  .internal-step-content { padding: 12px; }
  .action-buttons button { padding: 6px 10px; font-size: 10px; }
  .copy-status { font-size: 12px; }
}
</style>