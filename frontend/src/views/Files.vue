<template>
    <div class="file-manager-container">

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
            <div class="table-wrapper">
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
                  <div class="button-group">
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
                </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          </div>
  
          <div v-if="summary || summaryLoading" class="summary-section">
          <!-- 文件摘要标题 -->
            <div class="summary-header">
            <h2 class="summary-title">文件摘要</h2>
                <el-button
                        size="small"
                        @click="closeSummary"
                        class="close-button"
                        :icon="Close"
                        plain
                    >
                </el-button>
            </div>
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
  import { ref, onMounted, nextTick, computed } from 'vue';
  import { useStore } from 'vuex';
  import { ElUpload, ElProgress, ElMessage, ElTable, ElTableColumn, ElIcon, ElDivider, ElCard, ElMessageBox } from 'element-plus';
  import { UploadFilled, Document, DocumentCopy, Download, Close, Memo, Loading, Delete } from '@element-plus/icons-vue';
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
  
  //原版
  const customUpload = async (options) => {
  const { file, onProgress, onSuccess, onError } = options;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress({ percent: percentCompleted });
      }
    });

    onSuccess(response.data);
    fetchUploadedFiles(); // 刷新文件列表
  } catch (error) {
    onError(error);
    ElMessage.error('文件上传失败');
  }
};

  // const customUpload = async (options) => {
  //   const { file, onSuccess, onError, onProgress } = options;
  //   const formData = new FormData();
  //   formData.append('file', file);
  
  //   try {
  //     isUploading.value = true;
  //     uploadPercent.value = 0;
  
  //     const response = await axios.post(uploadUrl, formData, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //       onUploadProgress: progressEvent => {
  //         uploadPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
  //       }
  //     });
  
  //     onSuccess(response.data);
  //     await fetchUploadedFiles();
  
  //   } catch (error) {
  //     console.error('文件上传失败:', error);
  //     const msg = error.response?.data?.error || error.message || '文件上传失败，请重试';
  //     ElMessage.error(msg);
  //     onError(error);
  
  //   } finally {
  //     isUploading.value = false;
  //     uploadPercent.value = 0;
  //   }
  // };
  
//修改版
const fetchUploadedFiles = async () => {
  try {
    isLoadingFiles.value = true;
    const response = await axios.get('http://localhost:4000/api/files', {
      responseType: 'json' // 关键修改：让 Axios 自动处理 JSON 解析
    });

    if (Array.isArray(response.data)) {
      uploadedFiles.value = response.data.map(file => ({
        ...file,
        isGeneratingSummary: false
      }));
    } else {
      console.error('响应数据不是数组:', response.data);
    }
  } catch (error) {
    console.error('获取文件列表失败:', error);
    ElMessage.error('获取文件列表失败');
  } finally {
    isLoadingFiles.value = false;
  }
};
// const fetchUploadedFiles = async () => {
//     try {
//         isLoadingFiles.value = true;
//         const response = await axios.get('http://localhost:4000/api/files', {
//             responseType: 'text',
//             headers: {
//                 'Accept-Charset': 'utf-8'
//             }
//         });

//         // 将字符串解析为 JSON 数组
//         const data = JSON.parse(response.data);

//         if (Array.isArray(data)) {
//             uploadedFiles.value = data.map(file => {
//                 console.log('接收到的文件名:', file.fileName);
//                 return {
//                     ...file,
//                     isGeneratingSummary: false
//                 };
//             });
//         } else {
//             console.error('响应数据不是数组:', data);
//         }
//     } catch (error) {
//         console.error('获取文件列表失败:', error);
//         ElMessage.error('获取文件列表失败');
//     } finally {
//         isLoadingFiles.value = false;
//     }
// };

//   const fetchUploadedFiles = async () => {
//   try {
//     isLoadingFiles.value = true;
//     const response = await axios.get('http://localhost:4000/api/files');
//     uploadedFiles.value = response.data.map(file => {
//       console.log('接收到的文件名:', file.fileName); // 新增日志，确认接收到的文件名
//       return {
//         ...file,
//         isGeneratingSummary: false
//       };
//     });
//   } catch (error) {
//     console.error('获取文件列表失败:', error);
//     ElMessage.error('获取文件列表失败');
//   } finally {
//     isLoadingFiles.value = false;
//   }
// };
  
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
// 处理文件下载
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
    let displayIndex = 0;
    eventSource.onmessage = event => {
      const dataStr = event.data;
      console.log('接收到的数据:', dataStr);
      if (dataStr === '[DONE]') {        
        eventSource.close();
        summaryLoading.value = false;
        file.isGeneratingSummary = false;
        return;
      }
      try {
        const jsonData = JSON.parse(dataStr);
        if (jsonData?.content) {
          const char = jsonData.content;
          console.log('接收到的字符:', char); 
                // 直接将接收到的字符添加到摘要内容中
                // 逐字符添加到 summary
        setTimeout(() => {
        // summary.value += char;
        summary.value += char.replace(/\\n/g, '\n');
      }, displayIndex * 20); // 每个字符间隔 50ms
      displayIndex++;
    }
      } catch (error) {
        console.error('解析流数据出错:', error, '原始数据:', dataStr);
      }
    };
  
    eventSource.onerror = error => {
      console.error('EventSource 错误:', error);
      ElMessage.warning('无法处理扫描件或图片型 PDF，生成摘要失败');
      eventSource.close();
      summaryLoading.value = false;
      file.isGeneratingSummary = false;
    };
  };
  
const closeSummary = () => {
    summary.value = '';
    summaryLoading.value = false;
};


// 在script setup中修改onMounted部分
onMounted(() => {
  fetchUploadedFiles();
})
  
  const tableRowClassName = ({ row, rowIndex }) => {
    return rowIndex % 2 === 1 ? 'odd-row' : 'even-row';
  };
  </script>
  
  
  <style scoped>

.file-manager-container {
  position: relative;
  overflow: hidden;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    /* background-color: #f8f9fa; */
    background-color: var(--background-color);
    display: flex;
    height: 100vh;
}
  
  /* 主内容区 */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 30px;
    overflow: auto;
    position: relative;
    /* background-color: #f8f9fa; */
    background-color: var(--background-color);
    min-height: 80vh; /* 增加最小高度 */
  }
  
  /* 标题 */
  .file-manager-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-color);
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
    background-color: var(--background-color);
    box-shadow: var(--global-box-shadow);
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
    color: #000;;
    margin-top: 18px;
  }
  
  .upload-text em {
    color: #3498db;
    font-style: normal;
  }
  
  .upload-tip {
    font-size: 13px;
    color: var(--text-color);
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
    overflow: visible;;
  }
  
  /* 分割线 */
  .divider{
      margin-top: 1rem;
      margin-bottom: 2rem;
  }

  /* 文件列表 */
  .file-list-section {
  flex: 2;
  min-width: 400px;
  max-height: calc(100vh - 320px);
  height: 600px; /* 固定高度 */
  overflow-x: auto; 
  overflow-y: auto;
  border-radius: 15px;
  position: relative;  
  }

  .table-wrapper {
  overflow-x: auto;
  overflow-y: auto; 
  border-radius: 15px;
  margin-top: 15px;
  }
  .el-table-column {
  min-width: 120px;
}
.file-table {
  width: 100%;
  min-width: 500px;       /* 根据列宽总和调整 */
  border-radius: 15px;
  box-shadow: var(--global-box-shadow);
}
  
  .file-table :deep(.el-table__row) {
    height: 55px;
    background-color: var(--background-color);
    border-bottom: 1px solid #eaeff1;
    color: #47666e;
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
    justify-content: center; 
  }

  .button-group {
  display: flex;
  gap: 2px;
  flex-wrap: wrap; /* 允许换行 */
  justify-content: center;
}
  .download-button,
  .summary-button,
  .delete-button {
    padding: 5px 10px;    /* 调整内边距 */
    border-radius: 8px;  /* 圆角 */
    border: none;
    transition: all 0.2s ease;
    width: auto;
  }
  .download-button {
  background-color: transparent;
  color:#67b9ef;
  font-weight: bold;

}

.download-button:hover {
  color:#2f93d6;
}

.summary-button {
  background-color: transparent;
  color: #38d714;
  font-weight: bold;
}

.summary-button:hover {
  color: rgb(30, 218, 74);
}

.delete-button {
  background-color: transparent;
  color: #ff7070;  
  font-weight: bold;
}

.delete-button:hover {
  color: #ff4c4c;
}
.download-button,
.summary-button,
.delete-button {
  min-width: 120px; /* 最小宽度 */
  flex-shrink: 0; /* 禁止缩小 */
  white-space: normal; /* 允许文字换行 */
  padding: 6px 12px;
}
  .download-button:hover,
  .summary-button:hover,
  .delete-button:hover {
    background-color: #ecf5ff; /* 统一的浅蓝色悬停背景 */
    transform: translateY(-1px); /* 上移 */
  }
  .download-button:focus,
  .download-button:active,
  .summary-button:focus,
  .summary-button:active,
  .delete-button:focus,
  .delete-button:active{
    outline: none; /* 移除焦点框 */
    transform: translateY(0);
    box-shadow: none;
  }
  
  /* 摘要区域 */
  .summary-section {
    flex: 1;
    min-width: 320px;
    background-color: var(--background-color);
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    padding: 25px;
    max-height: calc(100vh - 320px);;
    overflow-y: auto;
    position: relative;
  }
  
  .summary-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
}

  .summary-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-color);
    text-align: center; /* 标题居中 */
    margin: 0;
    margin-bottom: 15px;
  }

  .close-button {
  background-color: transparent;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 24px;
  position: absolute; /* 使用绝对定位 */
  top: 25px; /* 距离顶部的距离，与摘要区域的内边距一致 */
  right: 25px; /* 距离右侧的距离，与摘要区域的内边距一致 */
}

.close-button:hover {
  font-weight: bold;
  transform: translateY(-1px);
}

.close-button:focus,
.close-button:active {
  outline: none;
  transform: translateY(0);
  box-shadow: none;
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
    color: var(--text-color);
    line-height: 1.7;
    margin-bottom: 12px;
  }
  
  .no-summary-text {
    font-style: italic;
    color: #95a5a6;
  }
  

  footer {
  height: 25px;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
  z-index: 10;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.08);
  bottom: 0;
  width: 100%;
  position: fixed;
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

  @media (max-width: 768px) {
  .file-manager-container {
    flex-direction: column;
    height: auto;
    padding: 15px;
  }

  .main-content {
    padding: 20px;
    min-height: auto;
  }

  .file-manager-title {
    font-size: 22px;
    margin-bottom: 8px;
  }

  .file-manager-description {
    font-size: 14px;
    margin-bottom: 20px;
  }

  .upload-area {
    width: 100%;
    padding: 30px;
  }

  .upload-text {
    font-size: 15px;
  }

  .content-wrapper {
    flex-direction: column;
    gap: 20px;
  }

  .file-list-section {
    height: 400px;
    max-height: 60vh;
  }

  .file-table :deep(.el-table__row) {
    height: 48px;
  }

  .button-group {
    flex-direction: column;
    gap: 6px;
  }

  .download-button,
  .summary-button,
  .delete-button {
    width: 100%;
    padding: 8px;
    font-size: 13px;
  }

  .summary-section {
    max-height: 50vh;
  }
}

@media (max-width: 480px) {
  .file-manager-title {
    font-size: 20px;
  }

  .file-manager-description {
    font-size: 13px;
  }

  .upload-area {
    padding: 20px;
  }

  .upload-text {
    font-size: 14px;
  }

  .upload-tip {
    font-size: 12px;
  }

  .el-table-column {
    min-width: 80px;
  }

  .file-table {
    min-width: 320px;
  }

  .file-type-cell .el-icon {
    font-size: 16px;
  }

  .summary-title {
    font-size: 18px;
  }

  .summary-text {
    font-size: 14px;
    line-height: 1.6;
  }

  footer {
    height: 40px;
    font-size: 12px;
  }

  .close-button {
    padding: 4px;
    font-size: 18px;
    top: 20px;
    right: 20px;
  }
}
  </style>
  