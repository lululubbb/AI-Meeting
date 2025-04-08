<!-- ExportButtons.vue -->
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
import axios from 'axios';

// 基础脱敏函数 - 将调用后端API
async function anonymizeText(text) {
  if (!text || typeof text !== 'string') return text || '';
  
  try {
    // 调用后端API进行脱敏
    const apiUrl = 'http://localhost:5000/api/pii-filter';
    const response = await axios.post(apiUrl, {
      text: text
    });
    
    if (response.data && response.data.desensitizedText !== undefined) {
      return response.data.desensitizedText;
    } else {
      console.error('脱敏API返回无效数据:', response.data);
      return text; // 若API返回无效，保留原文本
    }
  } catch (error) {
    console.error('调用脱敏API错误:', error);
    return text; // 出错时返回原文本
  }
}

// 批量处理字符串的函数 - 使用API批量处理
async function anonymizeTextBatch(texts) {
  if (!texts || !texts.length) return [];
  
  // 确保数组中所有项都是字符串
  const validTexts = texts.map(text => typeof text === 'string' ? text : '');
  
  try {
    // 将多个字符串合并为一个较大的请求，减少API调用次数
    // 使用不太可能出现在正常文本中的分隔符
    const DELIMITER = "|||SPLIT_MARK|||";
    const combinedText = validTexts.join(DELIMITER);
    
    // 对合并后的文本进行一次性脱敏处理
    const anonymizedCombined = await anonymizeText(combinedText);
    
    // 如果脱敏后的结果不是字符串，返回原始数组
    if (typeof anonymizedCombined !== 'string') {
      return validTexts;
    }
    
    // 拆分回数组
    const result = anonymizedCombined.split(DELIMITER);
    
    // 确保返回的数组长度与输入数组一致
    if (result.length !== texts.length) {
      console.warn('脱敏后的文本段数与原始文本不匹配', 
                  { original: texts.length, anonymized: result.length });
      
      // 如果长度不匹配，使用原始长度并填充缺失部分
      const finalResult = [];
      for (let i = 0; i < texts.length; i++) {
        finalResult.push(i < result.length ? result[i] : validTexts[i]);
      }
      
      return finalResult;
    }
    
    return result;
  } catch (error) {
    console.error('批量脱敏处理错误:', error);
    return validTexts; // 出错时返回原始文本数组
  }
}

// 递归处理各种数据结构的脱敏函数 - 异步版本
async function anonymizeContent(content) {
  // 处理null或undefined
  if (content === null || content === undefined) {
    return content;
  }
  
  // 字符串数组的批量处理
  if (Array.isArray(content)) {
    // 创建一个新数组结果
    const result = [...content];
    
    // 收集所有字符串项
    const stringItems = [];
    const stringIndices = [];
    
    content.forEach((item, index) => {
      if (typeof item === 'string') {
        stringItems.push(item);
        stringIndices.push(index);
      }
    });
    
    // 如果有字符串项，批量处理
    if (stringItems.length > 0) {
      try {
        const anonymizedStrings = await anonymizeTextBatch(stringItems);
        
        // 将脱敏后的字符串放回结果数组
        stringIndices.forEach((index, i) => {
          if (i < anonymizedStrings.length) {
            result[index] = anonymizedStrings[i];
          }
        });
      } catch (error) {
        console.error('批量脱敏数组错误:', error);
        // 出错时保留原始字符串
      }
    }
    
    // 递归处理非字符串项
    const promises = [];
    for (let i = 0; i < content.length; i++) {
      if (typeof content[i] !== 'string' && 
          content[i] !== null && 
          content[i] !== undefined) {
        promises.push(
          (async (index) => {
            result[index] = await anonymizeContent(content[index]);
          })(i)
        );
      }
    }
    
    // 等待所有递归处理完成
    await Promise.all(promises);
    
    return result;
  }
  
  // 单个字符串直接处理
  if (typeof content === 'string') {
    return await anonymizeText(content);
  }
  
  // 对象处理
  if (typeof content === 'object') {
    const result = {...content};
    
    // 收集所有字符串属性
    const stringProps = {};
    
    for (const key in content) {
      if (Object.prototype.hasOwnProperty.call(content, key) && 
          typeof content[key] === 'string') {
        stringProps[key] = content[key];
      }
    }
    
    // 批量处理字符串属性
    if (Object.keys(stringProps).length > 0) {
      try {
        const propKeys = Object.keys(stringProps);
        const propValues = Object.values(stringProps);
        
        const anonymizedValues = await anonymizeTextBatch(propValues);
        
        // 将脱敏后的值放回结果对象
        propKeys.forEach((key, i) => {
          if (i < anonymizedValues.length) {
            result[key] = anonymizedValues[i];
          }
        });
      } catch (error) {
        console.error('批量脱敏对象错误:', error);
        // 出错时保留原始值
      }
    }
    
    // 递归处理非字符串属性
    const promises = [];
    for (const key in content) {
      if (Object.prototype.hasOwnProperty.call(content, key) && 
          typeof content[key] !== 'string' && 
          content[key] !== null && 
          content[key] !== undefined) {
        promises.push(
          (async (k) => {
            result[k] = await anonymizeContent(content[k]);
          })(key)
        );
      }
    }
    
    // 等待所有递归处理完成
    await Promise.all(promises);
    
    return result;
  }
  
  // 其他类型直接返回
  return content;
}

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

// 导出状态
const isExporting = ref({ 
  pdf: false, 
  markdown: false, 
  word: false,
  anonWord: false,
  anonMarkdown: false
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

// 导出为脱敏后Word
async function exportToAnonymizedWord() {
  if (isExporting.value.anonWord) return;
  
  isExporting.value.anonWord = true;
  try {
    // 创建数据副本
    const anonymizedData = {...meetingData.value};
    
    // 添加日志便于调试
    console.log('开始脱敏处理，原始数据结构:', 
                JSON.stringify(anonymizedData, null, 2).slice(0, 500) + '...');
    
    // 对数据进行脱敏处理
    try {
      // 并行处理各个部分以提高性能
      await Promise.all([
        (async () => {
          anonymizedData.transcriptionData = await anonymizeContent(anonymizedData.transcriptionData);
        })(),
        (async () => {
          anonymizedData.processedData = await anonymizeContent(anonymizedData.processedData);
        })(),
        (async () => {
          anonymizedData.optimizationData = await anonymizeContent(anonymizedData.optimizationData);
        })(),
        (async () => {
          anonymizedData.summaries = await anonymizeContent(anonymizedData.summaries);
        })(),
        (async () => {
          anonymizedData.keywords = await anonymizeContent(anonymizedData.keywords);
        })(),
        (async () => {
          anonymizedData.overallSummary = await anonymizeText(anonymizedData.overallSummary || '');
        })(),
        (async () => {
          anonymizedData.todosAndExtensions = await anonymizeText(anonymizedData.todosAndExtensions || '');
        })()
      ]);
      
      // 添加日志验证脱敏后的数据结构
      console.log('脱敏处理完成，脱敏后数据结构:', 
                  JSON.stringify(anonymizedData, null, 2).slice(0, 500) + '...');
    } catch (error) {
      console.error('脱敏处理过程中出错:', error);
      // 出错时仍然尝试导出原始数据
      showSuccessMessage('脱敏处理失败，将导出原始数据');
    }
    
    // 调用导出功能
    await ExportUtils.exportToWord(props.meetingTitle + '(脱敏版)', anonymizedData);
    showSuccessMessage('脱敏Word文档导出成功！');
  } catch (error) {
    console.error('脱敏Word导出错误:', error);
    showSuccessMessage('脱敏Word导出失败！');
  } finally {
    isExporting.value.anonWord = false;
  }
}

// 导出为脱敏后Markdown
async function exportToAnonymizedMarkdown() {
  if (isExporting.value.anonMarkdown) return;
  
  isExporting.value.anonMarkdown = true;
  try {
    // 创建数据副本
    const anonymizedData = {...meetingData.value};
    
    // 添加日志便于调试
    console.log('开始脱敏处理，原始数据结构:', 
                JSON.stringify(anonymizedData, null, 2).slice(0, 500) + '...');
    
    // 对数据进行脱敏处理
    try {
      // 并行处理各个部分以提高性能
      await Promise.all([
        (async () => {
          anonymizedData.transcriptionData = await anonymizeContent(anonymizedData.transcriptionData);
        })(),
        (async () => {
          anonymizedData.processedData = await anonymizeContent(anonymizedData.processedData);
        })(),
        (async () => {
          anonymizedData.optimizationData = await anonymizeContent(anonymizedData.optimizationData);
        })(),
        (async () => {
          anonymizedData.summaries = await anonymizeContent(anonymizedData.summaries);
        })(),
        (async () => {
          anonymizedData.keywords = await anonymizeContent(anonymizedData.keywords);
        })(),
        (async () => {
          anonymizedData.overallSummary = await anonymizeText(anonymizedData.overallSummary || '');
        })(),
        (async () => {
          anonymizedData.todosAndExtensions = await anonymizeText(anonymizedData.todosAndExtensions || '');
        })()
      ]);
      
      // 添加日志验证脱敏后的数据结构
      console.log('脱敏处理完成，脱敏后数据结构:', 
                  JSON.stringify(anonymizedData, null, 2).slice(0, 500) + '...');
    } catch (error) {
      console.error('脱敏处理过程中出错:', error);
      // 出错时仍然尝试导出原始数据
      showSuccessMessage('脱敏处理失败，将导出原始数据');
    }
    
    // 调用导出功能
    await ExportUtils.exportToMarkdown(props.meetingTitle + '(脱敏版)', anonymizedData);
    showSuccessMessage('脱敏Markdown文档导出成功！');
  } catch (error) {
    console.error('脱敏Markdown导出错误:', error);
    showSuccessMessage('脱敏Markdown导出失败！');
  } finally {
    isExporting.value.anonMarkdown = false;
  }
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