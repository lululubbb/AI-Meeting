<!-- src/views/Files.vue -->
<template>
  <div class="home-container">
    <!-- 主体布局 -->
    <main class="main-layout">
      <!-- 左侧区域 -->
      <div class="left-section">
        <Mood />
        <CalendarTodoList />
      </div>

      <!-- 中间部分 -->
      <div class="middle-section">
        <h1>上传文件</h1>
        <!-- 分隔线 -->
        <div class="divider"></div>
        <!-- 文件上传组件 -->
        <el-upload
        ref="uploadRef"
          class="upload-demo"
          drag
          :action="uploadUrl"
          :file-list="fileList"
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :on-success="handleSuccess"
          :before-remove="beforeRemove"
          :http-request="customUpload"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件至此或点击上传</div>
        </el-upload>

        <!-- 上传按钮 -->
        <el-button
          type="primary"
          :disabled="fileList.length === 0 || isUploading"
          @click="submitUpload"
          style="margin-top: 10px;"
        >
          上传并生成摘要
        </el-button>

        <!-- 上传进度 -->
        <div v-if="isUploading" style="margin-top: 10px;">
          <el-progress :percentage="uploadPercent" ></el-progress>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 文件上传结果 -->
        <FileAttachmentContainer :files="uploadedFiles" @cancel="handleCancel" @download="handleDownload" />

        <!-- 摘要显示区域 -->
        <div v-if="summary" class="summary-section">
          <h2>生成的摘要</h2>
          <el-card>
            <p>{{ summary }}</p>
          </el-card>
        </div>
      </div>

      <!-- 右侧部分 -->
      <div class="right-section">
        <!-- 通讯录组件 -->
      </div>
    </main>

    <footer>
      <p>&copy; 慧议先锋.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import FileAttachmentContainer from '../components/FileAttachmentContainer.vue';
import CalendarTodoList from '../components/CalendarTodoList.vue';
import Mood from '../components/Mood.vue';
import { ElUpload, ElButton, ElProgress, ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import axios from 'axios';

// 获取路由实例
const router = useRouter();

// 获取 Vuex store 实例
const store = useStore();

const uploadRef = ref(null);

// 文件上传相关
const uploadUrl = 'http://localhost:4000/api/upload'; // 后端上传接口
const fileList = ref([]);
const uploadedFiles = ref([]);
const isUploading = ref(false);
const uploadPercent = ref(0);
const summary = ref('');

// 获取当前用户的邮箱
const getUserEmail = () => {
  const user = store.getters.getUser;
  console.log('当前用户邮箱:', user.email); // 调试信息
  return user.email || 'unknown@domain.com';
};

// 处理文件更改事件
const handleFileChange = (newFile, newFileList) => {
  console.log('文件上传发生变化:', newFile, newFileList);
  
  // 更新文件列表
  fileList.value = newFileList;
};

// 文件上传预览事件
const handlePreview = (file) => {
  console.log('预览文件:', file);
};

// 文件移除事件
const handleRemove = (file, fileList) => {
  console.log('文件移除:', file, fileList);
  fileList.value = fileList;
};

// 文件上传成功事件
const handleSuccess = (response, file, fileList) => {
  console.log('文件上传成功:', response, file, fileList);
};

// 文件移除前的检查
const beforeRemove = (file, fileList) => {
  console.log('文件移除前:', file, fileList);
  return true;
};

// 文件上传前的检查
const beforeUpload = (file) => {
  const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
  if (!isValidType) {
    ElMessage.error('只能上传 PDF 或 Word 文件');
  }
  return isValidType;
};

// 自定义上传请求
const customUpload = async (options) => {
  const { file, onSuccess, onError, onProgress } = options;
  const formData = new FormData();
  formData.append('file', file);

  try {
    isUploading.value = true;
    uploadPercent.value = 0;
    summary.value = '';

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        uploadPercent.value = percentCompleted;
      }
    });

    onSuccess(response.data, file);
    ElMessage.success('文件上传并生成摘要成功');

    // 更新已上传文件列表
    uploadedFiles.value = [
      ...uploadedFiles.value,
      {
        id: Date.now(),
        fileName: file.name,
        fileType: file.type.split('/')[1],
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
        downloadUrl: response.data.downloadUrl || '#', // 根据需要调整
        uploader: getUserEmail(),
        isDownloading: false,
        progress: 0,
      }
    ];

    // 显示摘要
    summary.value = response.data.summary;

    isUploading.value = false;
    uploadPercent.value = 0;
  } catch (error) {
    console.error('上传出错:', error);
    const serverError = error.response?.data?.error;
    const errorMessage = serverError?.message || 
                      serverError?.details || 
                      error.message || 
                      '文件上传或摘要生成失败';
  
  ElMessage.error(`操作失败: ${errorMessage}`);
    onError(error);
    ElMessage.error('文件上传或摘要生成失败');
    isUploading.value = false;
    uploadPercent.value = 0;
  }
};

// 提交上传
const submitUpload = () => {
  if (uploadRef.value) {
    uploadRef.value.submit(); // 直接调用组件的 submit 方法
  }
};

// 取消上传
const handleCancel = (file) => {
  console.log('取消上传:', file);
};

// 下载文件
const handleDownload = (file) => {
  window.open(file.downloadUrl, '_blank');
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  overflow: hidden;
  margin: 10px;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: wrap;
}

.upload-demo {
  margin-top: 10px;
}

/* 左侧部分 */
.left-section {
  flex: 0.8;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 10px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  overflow: auto;
}

/* 中间部分 */
.middle-section {
  flex: 1.3;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 0px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  overflow: auto;
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0px;
}

/* 右侧部分 */
.right-section {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 10px;
  overflow: auto;
}

footer {
  height: 30px;
  background-color: var(--background-color); /* 使用全局背景颜色 */  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
}

.divider {
  width: 100%;
  height: 1px; /* 分界线的高度 */
  background-color: #cccccc; /* 分界线颜色 */
  margin: 15px 0; /* 增加上下间距 */
}

.summary-section {
  width: 100%;
  margin-top: 20px;
}
</style>
