<!-- ExportButtons.vue -->
<template>
  <div class="export-panel">
    <div class="export-header">
      <h3>会议导出</h3>
      <div class="export-description">将会议内容导出为不同格式</div>
    </div>
  
    <div class="export-buttons">

      
      <button @click="exportToMarkdown" class="export-btn md-btn" :disabled="isExporting.markdown">
        <div class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path>
            <line x1="7" y1="7" x2="17" y2="7"></line>
            <line x1="7" y1="11" x2="12" y2="11"></line>
            <line x1="7" y1="15" x2="12" y2="15"></line>
            <path d="M16 16l3 6l3-6"></path>
          </svg>
        </div>
        <div class="btn-content">
          <span class="btn-title">导出为Markdown</span>
          <span class="btn-desc">适合编辑和分享</span>
        </div>
        <div v-if="isExporting.markdown" class="btn-spinner"></div>
      </button>
      
      <button @click="exportToWord" class="export-btn word-btn" :disabled="isExporting.word">
        <div class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 18h16"></path>
            <path d="M4 14h16"></path>
            <path d="M4 10h16"></path>
            <path d="M4 6h16"></path>
            <path d="M15 4l-2 16l-2-16"></path>
          </svg>
        </div>
        <div class="btn-content">
          <span class="btn-title">导出为Word</span>
          <span class="btn-desc">适合编辑和正式场合</span>
        </div>
        <div v-if="isExporting.word" class="btn-spinner"></div>
      </button>
      <button @click="exportToPDF" class="export-btn pdf-btn" :disabled="isExporting.pdf">
        <div class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M9 15h6"></path>
            <path d="M9 11h6"></path>
          </svg>
        </div>
        <div class="btn-content">
          <span class="btn-title">导出为PDF</span>
          <span class="btn-desc">适合打印和归档</span>
        </div>
        <div v-if="isExporting.pdf" class="btn-spinner"></div>
      </button>


      <button @click="exportToAnonymizedMarkdown" class="export-btn anon-md-btn" :disabled="isExporting.anonMarkdown">
  <div class="btn-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path>
      <line x1="7" y1="7" x2="17" y2="7"></line>
      <line x1="7" y1="11" x2="12" y2="11"></line>
      <line x1="7" y1="15" x2="12" y2="15"></line>
      <circle cx="17" cy="18" r="3"></circle>
      <path d="M17 16v4"></path>
    </svg>
  </div>
  <div class="btn-content">
    <span class="btn-title">导出脱敏后Markdown</span>
    <span class="btn-desc">适合分享时保护隐私</span>
  </div>
  <div v-if="isExporting.anonMarkdown" class="btn-spinner"></div>
</button>

<button @click="exportToAnonymizedWord" class="export-btn anon-word-btn" :disabled="isExporting.anonWord">
  <div class="btn-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 18h16"></path>
      <path d="M4 14h16"></path>
      <path d="M4 10h16"></path>
      <path d="M4 6h16"></path>
      <path d="M16 6l-4 12-4-12"></path>
      <circle cx="12" cy="14" r="2"></circle>
      <path d="M12 12V8"></path>
    </svg>
  </div>
  <div class="btn-content">
    <span class="btn-title">导出脱敏后Word</span>
    <span class="btn-desc">适合保护隐私信息</span>
  </div>
  <div v-if="isExporting.anonWord" class="btn-spinner"></div>
</button>


    </div>
    
    <!-- 导出成功提示 -->
    <div v-if="exportSuccess" class="export-success">
      <div class="success-icon">✓</div>
      <div class="success-message">{{ successMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ExportUtils from '../services/ExportUtils.js'; // 假设你有一个导出工具类
import { useRoute } from 'vue-router';

// 更改脱敏函数！
// 如果 anonymizeText 函数是在别处定义的，需要导入它
// 否则可以直接在这里添加函数定义
// function anonymizeText(text) {
//   if (!text || typeof text !== 'string') return text;
  
//   // 将字符串分割成字符数组
//   const chars = text.split('');
  
//   // 定义脱敏概率（这里设为30%，可以调整）
//   const anonymizeProbability = 0.3;
  
//   // 遍历字符，随机插入星号
//   for (let i = 0; i < chars.length; i++) {
//     // 如果不是空格，并且随机数小于脱敏概率，则插入星号
//     if (chars[i] !== ' ' && Math.random() < anonymizeProbability) {
//       // 在当前字符后插入星号
//       chars.splice(i + 1, 0, '%%%');
//       // 跳过刚插入的星号
//       i++;
//     }
//   }
  
//   // 将字符数组重新组合成字符串
//   return chars.join('');
// }


/**
 * 调用后端 PII 脱敏 API 处理文本
 * @param {string} text - 需要脱敏的原始文本
 * @returns {Promise<string>} - 返回脱敏后的文本（Promise）
 */
 async function anonymizeText(text) {
  if (!text || typeof text !== 'string') return text;

  try {
    // 调用后端 API（与 PiiTestTool.vue 相同的逻辑）
    const response = await fetch('http://localhost:5000/api/pii-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.desensitizedText || text; // 如果脱敏失败，返回原始文本

  } catch (error) {
    console.error('[anonymizeText] PII 脱敏失败:', error);
    return text; // 出错时返回原始文本
  }
};



// --------------------------------------





const props = defineProps({
  transcriptionData: {
    type: Array,
    default: () => []
  },
  processedData: {
    type: Array,
    default: () => []
  },
  optimizationData: {
    type: Object,
    default: () => ({})
  },
  summaries: {
    type: Object,
    default: () => ({})
  },
  keywords: {
    type: Object,
    default: () => ({})
  },
  overallSummary: {
    type: String,
    default: ''
  },
  todosAndExtensions: {
    type: String,
    default: ''
  },
  wordCloudData: {
    type: Array,
    default: () => []
  },
  meetingTitle: {
    type: String,
    default: '会议记录'
  }
});

// 路由信息
const route = useRoute();
const meetingId = computed(() => route.params.meetingId || '未命名会议');

// 导出状态 - 注意这里已修复重复声明问题
const isExporting = ref({ 
  pdf: false, 
  markdown: false, 
  word: false,
  anonWord: false,      // 新增
  anonMarkdown: false   // 新增
});

const exportSuccess = ref(false);
const successMessage = ref('');

// 准备完整的会议数据对象
const meetingData = computed(() => ({
  meetingId: meetingId.value,
  title: props.meetingTitle,
  transcriptionData: props.transcriptionData,
  processedData: props.processedData,
  optimizationData: props.optimizationData,
  summaries: props.summaries,
  keywords: props.keywords,
  overallSummary: props.overallSummary,
  todosAndExtensions: props.todosAndExtensions,
  wordCloudData: props.wordCloudData
}));




// 添加两个新的导出函数
// 导出为脱敏后Word
async function exportToAnonymizedWord() {
  if (isExporting.value.anonWord) return;
  
  isExporting.value.anonWord = true;
  try {
    // 创建脱敏后的数据副本
    const anonymizedData = {...meetingData.value};
    
    // 对数据进行脱敏处理
    anonymizedData.transcriptionData = anonymizeContent(anonymizedData.transcriptionData);
    anonymizedData.processedData = anonymizeContent(anonymizedData.processedData);
    anonymizedData.optimizationData = anonymizeContent(anonymizedData.optimizationData);
    anonymizedData.summaries = anonymizeContent(anonymizedData.summaries);
    anonymizedData.keywords = anonymizeContent(anonymizedData.keywords);
    anonymizedData.overallSummary = anonymizeContent(anonymizedData.overallSummary);
    anonymizedData.todosAndExtensions = anonymizeContent(anonymizedData.todosAndExtensions);
    
    // 调用导出Word的逻辑，但使用脱敏数据
    await ExportUtils.exportToWord(props.meetingTitle + '(脱敏版)', anonymizedData);
    showSuccessMessage('脱敏Word文档导出成功！');
  } catch (error) {
    console.error('脱敏Word导出错误:', error);
  } finally {
    isExporting.value.anonWord = false;
  }
}

// 导出为脱敏后Markdown
async function exportToAnonymizedMarkdown() {
  if (isExporting.value.anonMarkdown) return;
  
  isExporting.value.anonMarkdown = true;
  try {
    // 创建脱敏后的数据副本
    const anonymizedData = {...meetingData.value};
    
    // 对数据进行脱敏处理
    anonymizedData.transcriptionData = anonymizeContent(anonymizedData.transcriptionData);
    anonymizedData.processedData = anonymizeContent(anonymizedData.processedData);
    anonymizedData.optimizationData = anonymizeContent(anonymizedData.optimizationData);
    anonymizedData.summaries = anonymizeContent(anonymizedData.summaries);
    anonymizedData.keywords = anonymizeContent(anonymizedData.keywords);
    anonymizedData.overallSummary = anonymizeContent(anonymizedData.overallSummary);
    anonymizedData.todosAndExtensions = anonymizeContent(anonymizedData.todosAndExtensions);
    
    // 调用导出Markdown的逻辑，但使用脱敏数据
    await ExportUtils.exportToMarkdown(props.meetingTitle + '(脱敏版)', anonymizedData);
    showSuccessMessage('脱敏Markdown文档导出成功！');
  } catch (error) {
    console.error('脱敏Markdown导出错误:', error);
  } finally {
    isExporting.value.anonMarkdown = false;
  }
}

// 添加脱敏内容的递归处理函数
function anonymizeContent(content) {
  // 如果是字符串，直接脱敏
  if (typeof content === 'string') {
    return anonymizeText(content);
  }
  
  // 如果是对象或数组，递归处理
  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      return content.map(item => anonymizeContent(item));
    } else {
      const result = {};
      for (const key in content) {
        if (Object.prototype.hasOwnProperty.call(content, key)) {
          result[key] = anonymizeContent(content[key]);
        }
      }
      return result;
    }
  }
  
  // 其他类型直接返回
  return content;
}




// 导出为PDF
async function exportToPDF() {
  if (isExporting.value.pdf) return;
  
  isExporting.value.pdf = true;
  try {
    await ExportUtils.exportToPDF(props.meetingTitle);
    showSuccessMessage('PDF导出成功！');
  } catch (error) {
    console.error('PDF导出错误:', error);
  } finally {
    isExporting.value.pdf = false;
  }
}

// 导出为Markdown
async function exportToMarkdown() {
  if (isExporting.value.markdown) return;
  
  isExporting.value.markdown = true;
  try {
    await ExportUtils.exportToMarkdown(props.meetingTitle, meetingData.value);
    showSuccessMessage('Markdown导出成功！');
  } catch (error) {
    console.error('Markdown导出错误:', error);
  } finally { 
    isExporting.value.markdown = false;
  }
}

// 导出为Word
async function exportToWord() {
  if (isExporting.value.word) return;
  
  isExporting.value.word = true;
  try {
    await ExportUtils.exportToWord(props.meetingTitle, meetingData.value);
    showSuccessMessage('Word文档导出成功！');
  } catch (error) {
    console.error('Word导出错误:', error);
  } finally {
    isExporting.value.word = false;
  }
}

// 显示成功消息
function showSuccessMessage(message) {
  successMessage.value = message;
  exportSuccess.value = true;
  
  // 3秒后隐藏成功消息
  setTimeout(() => {
    exportSuccess.value = false;
  }, 3000);
}
</script>

<style scoped>
.export-panel {
  background-color: var(--card-background, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  transition: all 0.3s ease;
}

.export-panel:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.export-header {
  margin-bottom: 20px;
}

.export-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color, #4a6bff);
  margin: 0 0 8px 0;
}

.export-description {
  font-size: 14px;
  color: var(--text-light, #666);
}

.export-buttons {
  display: flex;
  gap: 120px;
  flex-wrap: wrap;
}

.export-btn {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid;
  background-color: transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 220px;
  position: relative;
  overflow: hidden;
}

.export-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.export-btn:active {
  transform: translateY(-1px);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.pdf-btn {
  border-color: #e53935;
  color: #e53935;
  background-color: rgba(229, 57, 53, 0.05);
}

.pdf-btn:hover {
  background-color: #e53935;
  color: white;
}

.md-btn {
  border-color: #2196f3;
  color: #2196f3;
  background-color: rgba(33, 150, 243, 0.05);
}

.md-btn:hover {
  background-color: #2196f3;
  color: white;
}

.word-btn {
  border-color: #2b579a;
  color: #2b579a;
  background-color: rgba(43, 87, 154, 0.05);
}

.word-btn:hover {
  background-color: #2b579a;
  color: white;
}

.btn-icon {
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-content {
  display: flex;
  flex-direction: column;
  text-align: left;
  flex: 1;
}

.btn-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}

.btn-desc {
  font-size: 12px;
  opacity: 0.7;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
  margin-left: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.export-success {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

@keyframes slideIn {
  0% { top: -80px; opacity: 0; }
  100% { top: -50px; opacity: 1; }
}

.success-icon {
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-buttons {
    flex-direction: column;
    gap: 15px;
  }
  
  .export-btn {
    width: 100%;
    min-width: auto;
  }
  
  .export-success {
    width: 90%;
    padding: 8px 15px;
    font-size: 14px;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .export-panel {
    background-color: var(--card-background, #2a2a2a);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .pdf-btn {
    background-color: rgba(229, 57, 53, 0.15);
  }
  
  .md-btn {
    background-color: rgba(33, 150, 243, 0.15);
  }
  
  .word-btn {
    background-color: rgba(43, 87, 154, 0.15);
  }
}


/* 脱敏Word按钮样式 */
.anon-word-btn {
  border-color: #2b579a;
  color: #2b579a;
  background-color: rgba(43, 87, 154, 0.05);
  position: relative;
}

.anon-word-btn:hover {
  background-color: #2b579a;
  color: white;
}

/* 脱敏Markdown按钮样式 */
.anon-md-btn {
  border-color: #2196f3;
  color: #2196f3;
  background-color: rgba(33, 150, 243, 0.05);
  position: relative;
}

.anon-md-btn:hover {
  background-color: #2196f3;
  color: white;
}

/* 添加一个小锁图标指示脱敏功能 */
.anon-word-btn::after, .anon-md-btn::after {
  content: '🔒';
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  opacity: 0.7;
}

/* 添加响应式支持 */
@media (max-width: 768px) {
  .anon-word-btn, .anon-md-btn {
    width: 100%;
  }
}
</style>