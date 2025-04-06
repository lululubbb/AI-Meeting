<!-- ExportButtons.vue -->
<template>
  <div class="export-panel">
    <div class="export-header">
      <h3>会议导出</h3>
      <div class="export-description">将会议内容导出为不同格式</div>
    </div>
    
    <div class="export-buttons">
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
const isExporting = ref({ pdf: false, markdown: false, word: false });
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
  gap: 20px;
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
</style>