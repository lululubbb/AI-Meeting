<!-- AIBotutils.vue -->
<template>
  <div class="knowledge-search-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 根据处理状态显示不同内容 -->
    <template v-if="isProcessing">
      <div class="processing-indicator">
        <div class="dot-pulse">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="processing-text">正在检索知识库...</div>
      </div>
    </template>
    <template v-else-if="content && !hasError">
      <!-- 回答区域 -->
      <div class="answer-container">
        <div class="answer-content" :class="{ 'streaming': isStreaming }">
          <div v-if="!isStreaming" v-html="formatContent(content)"></div>
          <div v-else>
            {{ streamedContent }}<span class="cursor"></span>
          </div>
        </div>
        
        <!-- 检索来源展示区域 - 只有当有检索结果时才显示 -->
        <div v-if="searchResults && searchResults.length > 0" class="search-results">
          <button 
            class="sources-toggle" 
            @click="toggleSources" 
            :class="{ 'expanded': showSources }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            {{ showSources ? '隐藏' : '查看' }}知识检索结果 ({{ searchResults.length }}个片段)
          </button>
          
          <div class="sources-container" :class="{ 'expanded': showSources }">
            <div 
              v-for="(result, index) in searchResults" 
              :key="index" 
              class="source-item"
            >
              <div class="source-header">
                <div class="source-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  片段 {{ index + 1 }}
                </div>
                <div class="relevance-tag">
                  相关度: {{ Math.round((1 - index / searchResults.length) * 100) }}%
                </div>
              </div>
              <div class="source-content" v-html="formatSourceContent(result)"></div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="hasError">
      <div class="error-message">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>知识检索过程中发生错误，请稍后再试</span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeSearchResults',
  
  props: {
    content: {
      type: String,
      default: ''
    },
    searchResults: {
      type: Array,
      default: () => []
    },
    isProcessing: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    },
    isDarkMode: {
      type: Boolean,
      default: false
    },
    useStream: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      showSources: false,
      isStreaming: false,
      streamedContent: '',
      streamingInterval: null,
      streamingIndex: 0
    }
  },
  
  watch: {
    content: {
      immediate: true,
      handler(newContent) {
        if (newContent && this.useStream) {
          this.startStreamingEffect();
        } else {
          this.stopStreamingEffect();
        }
      }
    }
  },
  
  beforeDestroy() {
    this.stopStreamingEffect();
  },
  
  methods: {
    toggleSources() {
      this.showSources = !this.showSources;
    },
    
    formatContent(text) {
      if (!text) return '';
      
      // 处理链接
      text = text.replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // 处理代码块
      text = text.replace(/```([\s\S]*?)```/g, (match, p1) => {
        return `<div class="code-block"><pre>${this.escapeHtml(p1)}</pre></div>`;
      });
      
      // 处理行内代码
      text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
      
      // 处理粗体
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 处理斜体
      text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
      
      // 处理引用
      text = text.replace(/>(.*?)(?:\n|$)/g, '<blockquote>$1</blockquote>');
      
      // 处理换行
      text = text.replace(/\n/g, '<br>');
      
      return text;
    },
    
    formatSourceContent(text) {
      if (!text) return '';
      
      // 处理高亮关键字 (简单例子，实际可能需要根据查询词高亮)
      const keywords = ['西湖论剑', '数字安全', '网络安全', '举办时间', '2023'];
      let formattedText = this.escapeHtml(text);
      
      keywords.forEach(keyword => {
        if (formattedText.includes(keyword)) {
          const regex = new RegExp(keyword, 'g');
          formattedText = formattedText.replace(regex, `<span class="highlight">${keyword}</span>`);
        }
      });
      
      // 处理换行
      formattedText = formattedText.replace(/\n/g, '<br>');
      
      return formattedText;
    },
    
    escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },
    
    // 模拟流式输出效果
    startStreamingEffect() {
      this.stopStreamingEffect(); // 先清除可能的现有效果
      
      if (!this.content) return;
      
      this.isStreaming = true;
      this.streamedContent = '';
      this.streamingIndex = 0;
      
      this.streamingInterval = setInterval(() => {
        if (this.streamingIndex < this.content.length) {
          this.streamedContent += this.content.charAt(this.streamingIndex);
          this.streamingIndex++;
        } else {
          this.stopStreamingEffect();
        }
      }, 20); // 可调整速度
    },
    
    stopStreamingEffect() {
      if (this.streamingInterval) {
        clearInterval(this.streamingInterval);
        this.streamingInterval = null;
        this.isStreaming = false;
        this.streamedContent = this.content || '';
      }
    }
  }
}
</script>

<style scoped>
.knowledge-search-container {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #333;
  border-radius: 8px;
  margin-top: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dark-mode {
  color: #e0e0e0;
}

/* 处理中的加载指示器 */
.processing-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dot-pulse {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.dot-pulse span {
  width: 8px;
  height: 8px;
  margin: 0 3px;
  border-radius: 50%;
  background-color: #3B82F6;
  display: inline-block;
  opacity: 0.6;
}

.dot-pulse span:nth-child(1) {
  animation: pulse 1.2s infinite 0s;
}

.dot-pulse span:nth-child(2) {
  animation: pulse 1.2s infinite 0.2s;
}

.dot-pulse span:nth-child(3) {
  animation: pulse 1.2s infinite 0.4s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.processing-text {
  font-size: 14px;
  color: #666;
}

.dark-mode .processing-text {
  color: #aaa;
}

/* 回答容器 */
.answer-container {
  width: 100%;
}

.answer-content {
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 流式效果 */
.answer-content.streaming .cursor {
  display: inline-block;
  width: 8px;
  height: 18px;
  background-color: #3B82F6;
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

.dark-mode .answer-content.streaming .cursor {
  background-color: #60a5fa;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 搜索结果区域 */
.search-results {
  margin-top: 15px;
}

.sources-toggle {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(59, 130, 246, 0.1);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: #3B82F6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  width: auto;
  text-align: left;
}

.sources-toggle:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

.sources-toggle svg {
  transition: transform 0.3s ease;
  margin-right: 8px;
}

.sources-toggle.expanded svg {
  transform: rotate(90deg);
}

.dark-mode .sources-toggle {
  background-color: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.dark-mode .sources-toggle:hover {
  background-color: rgba(96, 165, 250, 0.25);
}

.sources-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s ease;
}

.sources-container.expanded {
  max-height: 500px;
  overflow-y: auto;
  margin-top: 10px;
}

.source-item {
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border-left: 3px solid #3B82F6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dark-mode .source-item {
  background-color: #2a2a2a;
  border-left: 3px solid #60a5fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.source-title {
  font-weight: 600;
  font-size: 14px;
  color: #3B82F6;
  display: flex;
  align-items: center;
}

.source-title svg {
  margin-right: 6px;
}

.dark-mode .source-title {
  color: #60a5fa;
}

.relevance-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.dark-mode .relevance-tag {
  background-color: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.source-content {
  font-size: 14px;
  line-height: 1.5;
  color: #555;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 5px;
}

.dark-mode .source-content {
  color: #aaa;
}

.source-content::-webkit-scrollbar {
  width: 4px;
}

.source-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.dark-mode .source-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
}

/* 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  color: #ef4444;
}

.error-message svg {
  margin-right: 8px;
  flex-shrink: 0;
}

.dark-mode .error-message {
  background-color: rgba(239, 68, 68, 0.15);
}

/* 样式 */
:deep(.code-block) {
  background-color: #f2f2f2;
  border-radius: 6px;
  padding: 12px;
  margin: 10px 0;
  overflow-x: auto;
}

:deep(.dark-mode .code-block) {
  background-color: #222;
}

:deep(code) {
  background-color: #f2f2f2;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  color: #0369a1;
}

:deep(.dark-mode code) {
  background-color: #333;
  color: #38bdf8;
}

:deep(a) {
  color: #3B82F6;
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

:deep(.dark-mode a) {
  color: #60a5fa;
}

:deep(blockquote) {
  margin: 10px 0;
  padding-left: 15px;
  border-left: 4px solid #e0e0e0;
  color: #666;
}

:deep(.dark-mode blockquote) {
  border-left-color: #444;
  color: #aaa;
}

:deep(.highlight) {
  background-color: rgba(255, 246, 126, 0.3);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}

:deep(.dark-mode .highlight) {
  background-color: rgba(255, 246, 126, 0.2);
}
</style>