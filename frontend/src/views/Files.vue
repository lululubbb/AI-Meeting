<template>
    <div class="file-manager-container">
      <aside class="sidebar">
        <CalendarTodoList />
      </aside>
  
      <main class="main-content">
        <h1 class="file-manager-title">
          <el-icon><Document /></el-icon>
          智能文件助手
        </h1>
        <p class="file-manager-description">
          轻松上传、管理 PDF 和 Word 文档，智能生成摘要，提升工作效率。
        </p>
  
        <div class="upload-section">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :action="uploadUrl"
            :auto-upload="true"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            :on-remove="handleRemove"
            :http-request="customUpload"
            :show-file-list="false"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">将文件拖拽到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="upload-tip">PDF, Word (.pdf, .doc, .docx), ≤ 50MB</div>
            </template>
          </el-upload>
  
          <el-progress
            v-if="isUploading"
            :percentage="uploadPercent"
            class="upload-progress"
            :color="customColors"
          ></el-progress>
        </div>
  
         <el-divider class="divider" />
  
        <div class="content-wrapper">
          <div class="file-list-section">
            <el-table
              :data="uploadedFiles"
              v-loading="isLoadingFiles"
              :row-class-name="tableRowClassName"
              class="file-table"
              stripe
              :header-cell-style="{ background: '#f5f7fa', color: '#333', fontWeight: '600' }"
            >
              <el-table-column prop="fileName" label="文件名" sortable :show-overflow-tooltip="true" width="380"></el-table-column>
              <el-table-column label="类型" align="center" width="120">
                <template #default="scope">
                  <div class="file-type-cell">
                    <el-icon v-if="scope.row.fileType === 'pdf'" class="pdf-icon"><Document /></el-icon>
                    <el-icon
                      v-else-if="scope.row.fileType === 'doc' || scope.row.fileType === 'docx'"
                      class="word-icon"
                    ><DocumentCopy /></el-icon>
                    <span v-else>{{ scope.row.fileType }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="fileSizeMB" label="大小 (MB)" sortable align="center" width="150"></el-table-column>
              <el-table-column prop="uploadDate" label="上传日期" sortable align="center" width="180">
                <template #default="scope">
                  <span>{{ formatDate(scope.row.uploadDate) }}</span>
                </template>
              </el-table-column>
             <el-table-column label="操作"  align="center">
              <template #default="scope">
                <div class="operations-cell">
                      <el-button
                      size="small"
                      @click="handleDownload(scope.row)"
                      class="download-button"
                      :icon="Download"
                      plain
                      >
                      下载
                      </el-button>
                      <el-button
                      size="small"
                      @click="generateSummaryForFile(scope.row)"
                      class="summary-button"
                      :icon="Memo"
                      :loading="summaryLoading || scope.row.isGeneratingSummary"
                      plain
                      >
                      生成摘要
                      </el-button>
                      <el-button
                      size="small"
                      @click="handleDelete(scope.row)"
                      class="delete-button"
                      :icon="Delete"
                      plain
                      >
                      删除
                      </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
  
          <div v-if="summary || summaryLoading" class="summary-section">
             <!-- 文件摘要标题 -->
            <h2 class="summary-title">文件摘要</h2>
            <el-card class="summary-card">
              <transition name="fade">
                <div v-if="summaryLoading" class="summary-loading">
                  <el-progress  :percentage="estimatedProgress"   :text-inside="true" :stroke-width="18"  :format="formatSummaryProgress"></el-progress>
                </div>
              </transition>
  
              <transition name="fade">
                <p v-if="summary" class="summary-text">{{ summary }}</p>
              </transition>
              <p v-if="!summaryLoading && !summary" class="no-summary-text">暂无摘要</p>
            </el-card>
          </div>
        </div>
      </main>
      <footer>
      <p>&copy; 2024 慧议先锋. </p>
      </footer>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useStore } from 'vuex';
  import CalendarTodoList from '../components/CalendarTodoList.vue';
  import { ElUpload, ElProgress, ElMessage, ElTable, ElTableColumn, ElIcon, ElDivider, ElCard, ElMessageBox } from 'element-plus';
  import { UploadFilled, Document, DocumentCopy, Download, Memo, Loading, Delete } from '@element-plus/icons-vue';
  import axios from 'axios';
  
  const store = useStore();
  const uploadRef = ref(null);
  const uploadUrl = 'http://localhost:4000/api/upload';
  const fileList = ref([]);
  const uploadedFiles = ref([]);
  const isUploading = ref(false);
  const uploadPercent = ref(0);
  const summary = ref('');
  const isLoadingFiles = ref(false);
  const summaryLoading = ref(false);
  const summaryProgress = ref(0);
  const receivedChars = ref(0);
  const estimatedMaxChars = ref(200); // 初始估算最大字符数
  
  // 进度条颜色
  const customColors = [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#1989fa', percentage: 60 },
    { color: '#5cb87a', percentage: 80 },
    { color: '#6f7ad3', percentage: 100 },
  ];
  
  // 计算属性：更可靠的进度估算
  const estimatedProgress = computed(() => {
     return Math.min(95, (receivedChars.value / estimatedMaxChars.value) * 100);
  });
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // ... (其他函数: beforeUpload, handleFileChange, handleRemove, customUpload,
  //      fetchUploadedFiles, handleDelete, handleDownload  保持不变) ...
  const beforeUpload = (file) => {
    const isPdfOrWord = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
    const isLt50M = file.size / 1024 / 1024 < 50;
  
    if (!isPdfOrWord) {
      ElMessage.error('只能上传 PDF 或 Word 文件');
      return false;
    }
    if (!isLt50M) {
      ElMessage.error('文件大小不能超过 50MB');
      return false;
    }
    return isPdfOrWord && isLt50M;
  };
  
  const handleFileChange = (newFile, newFileList) => {
    // fileList.value = newFileList; // 通常不需要
  };
  
  const handleRemove = (file, fileList) => {
   // fileList.value = fileList;
  };
  
  const customUpload = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      isUploading.value = true;
      uploadPercent.value = 0;
  
      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          uploadPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      });
  
      onSuccess(response.data);
      await fetchUploadedFiles();
  
    } catch (error) {
      console.error('文件上传失败:', error);
      const msg = error.response?.data?.error || error.message || '文件上传失败，请重试';
      ElMessage.error(msg);
      onError(error);
  
    } finally {
      isUploading.value = false;
      uploadPercent.value = 0;
    }
  };
  
  const fetchUploadedFiles = async () => {
    try {
      isLoadingFiles.value = true;
      const response = await axios.get('http://localhost:4000/api/files');
      uploadedFiles.value = response.data.map(file => ({
        ...file,
        isGeneratingSummary: false
      }));
    } catch (error) {
      console.error('获取文件列表失败:', error);
      ElMessage.error('获取文件列表失败');
    } finally {
      isLoadingFiles.value = false;
    }
  };
  
  const handleDelete = async (file) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除文件 "${file.fileName}" 吗？`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
      await axios.delete(`http://localhost:4000/api/delete/${file.id}`);
      uploadedFiles.value = uploadedFiles.value.filter(item => item.id !== file.id);
      ElMessage.success('文件删除成功');
  
    } catch (error) {
      if (error !== 'cancel') {
        console.error('文件删除失败:', error);
        ElMessage.error('文件删除失败');
      }
    }
  };
  
  const formatSummaryProgress = (percentage) => {
    return `生成中 ${percentage}%`;
  };
  const handleDownload = async file => {
    try {
      const response = await axios.get(`http://localhost:4000/api/download/${file.id}`, {
        responseType: 'blob'
      });
  
      const contentDisposition = response.headers['content-disposition'];
      let fileName = file.fileName;
       if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
         if (fileNameMatch && fileNameMatch[1]) {
            fileName = decodeURIComponent(escape(fileNameMatch[1].replace(/['"]/g, ''))); //关键修改
          }
      }
  
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载文件失败:', error);
      ElMessage.error('下载失败');
    }
  };
  
  const generateSummaryForFile = async (file) => {
    console.log('发起摘要生成请求:', file);
    summaryProgress.value = 0;
    receivedChars.value = 0;
    file.isGeneratingSummary = true;
    summary.value = '';
    summaryLoading.value = true;
  
    // 动态调整估算的最大字符数 (基于文件大小)
    estimatedMaxChars.value = 2000 + Math.round(file.fileSizeMB * 1000); // 基础值 + 文件大小相关的值
  
    const eventSource = new EventSource(`http://localhost:4000/api/generate-summary?fileId=${file.id}`);
  
    eventSource.onmessage = event => {
      const dataStr = event.data;
      if (dataStr === '[DONE]') {
        eventSource.close();
        summaryLoading.value = false;
        file.isGeneratingSummary = false;
        return;
      }
      try {
        const jsonData = JSON.parse(dataStr);
        if (jsonData?.content) {
          summary.value += jsonData.content;
          receivedChars.value += jsonData.content.length;
        }
      } catch (error) {
        console.error('解析流数据出错:', error, '原始数据:', dataStr);
      }
    };
  
    eventSource.onerror = error => {
      console.error('EventSource 错误:', error);
      ElMessage.error('生成摘要时发生错误');
      eventSource.close();
      summaryLoading.value = false;
      file.isGeneratingSummary = false;
    };
  };
  
  onMounted(() => {
    fetchUploadedFiles();
  });
  
  const tableRowClassName = ({ row, rowIndex }) => {
    return rowIndex % 2 === 1 ? 'odd-row' : 'even-row';
  };
  </script>
  
  
  <style scoped>
  /* 整体容器 */
  .file-manager-container {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background-color: #f8f9fa;
  }
  
  /* 侧边栏 */
  .sidebar {
    flex: 0 0 280px;
    padding: 20px;
    background-color: #fff;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
    border-right: 1px solid #e0e0e0;
    overflow-y: auto;
    z-index: 10;
  }
  
  /* 主内容区 */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 30px;
    overflow: hidden;
    background-color: #f8f9fa;
  }
  
  /* 标题 */
  .file-manager-title {
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 10px;
    text-align: center;
  }
  
  .file-manager-description {
    font-size: 15px;
    color: #7f8c8d;
    margin-bottom: 25px;
    text-align: center;
  }
  
  /* 上传区域 */
  .upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 25px;
  }
  
  .upload-area {
    border: 2px dashed #bdc3c7;
    border-radius: 15px;
    padding: 40px 50px;
    text-align: center;
    width: 500px;
    cursor: pointer;
    transition: border-color 0.3s, background-color 0.3s;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
  
  .upload-area:hover {
    border-color: #3498db;
    background-color: #f0f8ff;
  }
  
  .upload-icon {
    font-size: 45px;
    color: #3498db;
  }
  
  .upload-text {
    font-size: 17px;
    color: #2c3e50;
    margin-top: 18px;
  }
  
  .upload-text em {
    color: #3498db;
    font-style: normal;
  }
  
  .upload-tip {
    font-size: 13px;
    color: #95a5a6;
    margin-top: 10px;
  }
  
  .upload-progress {
    margin-top: 25px;
    width: 65%;
  }
  
  /* 内容区域 */
  .content-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    overflow: hidden;
  }
  
  /* 分割线 */
  .divider{
      margin-top: 1rem;
      margin-bottom: 2rem;
  }
  /* 文件列表 */
  .file-list-section {
    flex: 2;
    min-width: 600px;
    max-height: calc(100vh - 320px);
    overflow: auto;
    border-radius: 15px;
  }
  
  .file-table {
    width: 100%;
    border-radius: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .file-table :deep(.el-table__row) {
    height: 55px;
    background-color: #fff;
    border-bottom: 1px solid #eaeff1;
  }
  
  .file-type-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pdf-icon,
  .word-icon {
    font-size: 19px;
    margin-right: 5px;
  }
  
  .pdf-icon {
    color: #e74c3c;
  }
  
  .word-icon {
    color: #3498db;
  }
  
  /* 操作按钮容器 */
  .operations-cell {
    display: flex;
    flex-direction: column; /* 垂直排列 */
    align-items: center;     /* 水平居中 */
  }
  
  .download-button,
  .summary-button,
  .delete-button {
    display: block;      /* 块级元素 */
    width: 85%;          /* 占满父容器宽度 */
    margin-bottom: 6px; /* 按钮间距 */
    padding: 5px 10px;    /* 调整内边距 */
    border-radius: 4px;  /* 圆角 */
    color: #606266;     /* 文字颜色 */
  }
  
  .download-button:hover,
  .summary-button:hover,
  .delete-button:hover {
    background-color: #ecf5ff; /* 统一的浅蓝色悬停背景 */
    color: #409eff;          /* 悬停时文字颜色 */
    transform: translateY(-1px); /* 上移 */
  }
  .download-button:focus,
  .download-button:active,
  .summary-button:focus,
  .summary-button:active,
  .delete-button:focus,
  .delete-button:active{
     outline: none; /* 移除焦点框 */
  }
  
  /* 摘要区域 */
  .summary-section {
    flex: 1;
    min-width: 320px;
    background-color: #fff;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    padding: 25px;
      max-height: 450px;
    overflow-y: auto;
  }
  
  .summary-title {
    font-size: 22px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 15px;
    text-align: center; /* 标题居中 */
  }
  
  .summary-card {
    padding: 0;
    border: none;
    box-shadow: none;
    background-color: transparent;
  }
  
  .summary-loading {
    padding: 20px 0;
  }
  
  .summary-text {
    font-size: 15px;
    color: #444;
    line-height: 1.7;
    margin-bottom: 12px;
  }
  
  .no-summary-text {
    font-style: italic;
    color: #95a5a6;
  }
  
  /* 页脚 */
  footer {
    position: fixed;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 55px; /*统一页脚高度*/
      background-color: white;
      display: flex;
      justify-content: center;
      align-items: center;
       color: #888; /* 页脚字体颜色 */
      border-top: 1px solid #ddd;
      padding: 0 20px;
      box-shadow: 0 -2px 4px rgba(0,0,0,0.08);
       z-index: 10;
  }
  
  /* 过渡效果 */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  </style>
  