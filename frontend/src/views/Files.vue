<!-- src/views/Files.vue -->
<template>
    <div class="home-container">
   <!-- 主体布局 -->
   <main class="main-layout">
        <!-- 左侧区域 -->
        <div class="left-section">
        <Mood/>
        <CalendarTodoList />
        </div>
  
        <!-- 中间部分 -->
        <div class="middle-section">
          <h1>上传文件</h1>
          <!-- 分隔线 -->
        <div class="divider"></div>
          <!-- 后续需要把action换成后端 -->
        <!-- 文件上传组件 -->
        <el-upload 
          class="upload-demo" 
          drag 
          :action="null" 
          :file-list="fileList" 
          :auto-upload="false"
          :on-change="handleFileChange" 
          :on-preview="handlePreview" 
          :on-remove="handleRemove"
          :on-success="handleSuccess" 
          :before-remove="beforeRemove"
          :multiple="false" 
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件至此或点击上传</div>
        </el-upload>

          <!-- 分隔线 -->
        <div class="divider"></div>
        <FileAttachmentContainer :files="uploadedFiles" @cancel="handleCancel" @download="handleDownload" />
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
  import { useStore } from 'vuex';  // 如果你使用 vuex 来管理状态
  import FileAttachmentContainer from '../components/FileAttachmentContainer.vue'; // 引入容器组件
  import CalendarTodoList from '../components/CalendarTodoList.vue'; 
  import Mood from '../components/Mood.vue';
  import { ElUpload } from 'element-plus'
  import { UploadFilled } from '@element-plus/icons-vue';

  
// 获取当前用户的邮箱
  const getUserEmail = () => {
  const user = store.getters.getUser;
  console.log('当前用户邮箱:', user.email); // 调试信息
  return user.email || 'unknown@domain.com';
};
  // 获取路由实例
  const router = useRouter();
  
  // 获取 Vuex store 实例
  const store = useStore();
    
  
 // 用于存储上传的文件列表
const uploadedFiles = ref([
  {
    id: 1,
    fileName: "User-Journey.pdf",
    fileType: "PDF",
    fileSizeMB: 4.5,
    downloadUrl: "/files/User-Journey.pdf",
    uploader: "Angela Hope",
    isDownloading: true,
    progress: 45,
  },
  {
    id: 2,
    fileName: "Data-Structure.xls",
    fileType: "XLS",
    fileSizeMB: 12.4,
    downloadUrl: "/files/Data-Structure.xls",
    uploader: "Michael Lee",
    isDownloading: false,
    progress: 0,
  },
  {
    id: 3,
    fileName: "SCHVAV.doc",
    fileType: "DOC",
    fileSizeMB: 1.9,
    downloadUrl: "/files/SCHVAV.doc",
    uploader: "lchsc Lee",
    isDownloading: false,
    progress: 0,
  },
]);
// 处理文件更改事件
const handleFileChange = (file, fileList) => {
  console.log('文件上传发生变化:', file, fileList);
  
  // 提取文件扩展名作为文件类型（如果没有 MIME 类型）
  const getFileTypeFromName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase(); // 获取扩展名并转换为小写
    const mimeTypeMapping = {
      pdf: 'PDF',
      xls: 'XLS',
      doc: 'DOC',
      pptx: 'PPTX',
      txt: 'TXT',
      jpg: 'JPG',
      png: 'PNG',
      md:'MD'
      // 添加更多文件类型映射
    };
    return mimeTypeMapping[ext] || 'unknown'; // 如果没有匹配的类型，默认返回 'unknown'
  };

  // 获取上传文件的数据
  const newFiles = fileList.map(f => ({
    id: f.uid, // 使用 fileList 中的 uid 来作为文件的唯一标识符
    fileName: f.name,
    fileType: f.type ? f.type.split('/')[1] : getFileTypeFromName(f.name),
    fileSizeMB: (f.size / (1024 * 1024)).toFixed(2), // 转换为 MB
    uploader: getUserEmail(), 
    downloadUrl: URL.createObjectURL(f.raw), // 生成本地下载链接
    isDownloading: false,
    progress: 0,
  }));

  // 避免重复文件上传：检查文件是否已经存在
  const uniqueFiles = newFiles.filter(newFile => 
    !uploadedFiles.value.some(existingFile => existingFile.fileName === newFile.fileName)
  );

   // 将新文件添加到已上传的文件列表中
  uploadedFiles.value = [...uploadedFiles.value, ...uniqueFiles];
  console.log('当前文件列表:', uploadedFiles.value);
  console.log('文件类型:', f.type); 
};


// 文件上传预览事件
const handlePreview = (file) => {
  console.log('预览文件:', file);
};

// 文件移除事件
const handleRemove = (file, fileList) => {
  console.log('文件移除:', file, fileList);
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
  </script>
    
<style scoped >
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #ffffff;
  overflow: hidden; 
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: wrap;
  overflow: auto; 
}

.upload-demo{
margin-top: 10px;
}

/* 左侧部分 */
.left-section {
  flex:0.8;
  background-color: #ffffff;
  padding: 10px;
  box-shadow: inset -1px 0 0 #ddd;
  overflow: auto; 
}

/* 中间部分 */
.middle-section {
  flex: 1.3;
  background-color: #ffffff;
  padding: 0px;
  box-shadow: inset -1px 0 0 #ddd;
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
  background-color: #ffffff;
  padding: 10px;
  overflow: auto; 
}

footer {
  height: 30px;
  background-color: #f5f5f5;
  display: flex;
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

    </style>
    