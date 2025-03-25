<template>
  <div class="materials-container">
    <el-card shadow="hover" class="materials-card">
      <template #header>
        <div class="card-header">
          <h2 class="card-title">会议资料下载</h2>
          <p class="card-description">请选择您需要的资料进行下载：</p>
          <el-breadcrumb separator="/" v-if="path.length > 0" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/materials' }" @click="resetPath">全部资料</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(item, index) in path" :key="index">
              <span @click="goToPath(index)" class="breadcrumb-item">{{ item }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>

      <div v-if="isLoading" class="loading-container">
        <el-icon style="width: 3em; height: 3em;"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

            <div v-else-if="currentFiles.length > 0" class="list-container">
         <div v-for="item in currentFiles" :key="item.id" :class="['list-item', item.type === 'directory' ? 'is-directory' : '']"
            @click="item.type === 'directory' ? openDirectory(item) : null">
           <div  class="item-content">
               <el-icon v-if="item.type === 'directory'" class="item-icon directory"><FolderOpened /></el-icon>
                 <el-icon v-else-if="item.name.endsWith('.pdf')" class="item-icon pdf"><Document /></el-icon>
                    <el-icon v-else-if="item.name.endsWith('.docx') || item.name.endsWith('.doc')" class="item-icon doc"><DocumentCopy/></el-icon>
             <span class="item-name" :title="item.name">{{ item.name }}</span>
           </div>
       
             <el-button v-if="item.type === 'file'" circle  size="small" plain class="download-button" @click.stop="downloadMaterial(item)">
                <el-icon  class="download-icon"><Download /></el-icon>
                   <span class="download-text">下载</span>

             </el-button>
       </div>
        <!-- 返回上一级 -->
        <div v-if="path.length > 0" class="back-button-container">
           <el-button @click="goBack" type="text" :icon="ArrowLeft" text bg>返回上一级</el-button>
        </div>
         </div>
      <el-empty v-else description="当前目录下暂无会议资料" />
    </el-card>
  </div>
</template>

<script setup>
// ... (script 部分和之前一样, 无需改动) ...
import { ref, onMounted, computed } from 'vue';
import {
  ElIcon,
  ElButton,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElCard,
  ElEmpty,
  ElBreadcrumb,
  ElBreadcrumbItem,
} from 'element-plus';
import { Loading, Folder, Document, DocumentCopy, Download, ArrowLeft, FolderOpened } from '@element-plus/icons-vue';
import axios from 'axios';

const materials = ref([]);
const isLoading = ref(false);
const path = ref([]); // ['folder1', 'subfolder2']

const currentFiles = computed(() => {
  if (path.value.length === 0) {
    return materials.value;
  }

  let currentDir = materials.value;
  for (const segment of path.value) {
    currentDir = currentDir.find((item) => item.type === 'directory' && item.name === segment)?.children || [];
  }
  return currentDir;
});

const fetchMaterials = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get('http://localhost:4000/api/materials');
    materials.value = response.data;
  } catch (error) {
    console.error('获取资料失败:', error);
    ElMessage.error('获取资料失败，请稍后重试。');
  } finally {
    isLoading.value = false;
  }
};
const handleRowClick = (row) => {
  if (row.type === 'directory') {
    openDirectory(row);
  }
};
const downloadMaterial = async (material) => {
  try {
    const fullPath = [...path.value, material.name].join('/');
    const response = await axios.get(`http://localhost:4000/api/downloadMaterial?path=${encodeURIComponent(fullPath)}`, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = material.name;
    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
        filename = decodeURIComponent(escape(filename));
      }
    }

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败');
  }
};

const tableRowClassName = ({ row }) => {
  if (row.type === 'directory') {
    return 'directory-row';
  }
  return '';
};

const openDirectory = (directory) => {
  path.value.push(directory.name);
};

const goBack = () => {
  path.value.pop();
};
const goToPath = (index) => {
  path.value = path.value.slice(0, index + 1);
};
// 重置路径到根目录
const resetPath = () => {
  path.value = [];
};
onMounted(() => {
  fetchMaterials();
});
</script>

<style scoped>
/* 整体容器 */
.materials-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 卡片样式 */
.materials-card {
  border-radius: 8px;
}

/* 卡片头部 */
.card-header {
  border-bottom: 1px solid #ebeef5;
  padding: 0px 20px;
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.card-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 8px;
}

.card-description {
  font-size: 14px;
  color: #777;
}

/* 加载 */
.loading-container {
  padding: 40px;
  text-align: center;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center; /* 垂直居中 */
}

/* 列表容器 */
.list-container {
    padding: 10px;
}

/* 列表项 */
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.3s; /* 平滑的背景色过渡 */
}

/*文件夹列表项*/
.list-item.is-directory {
  cursor: pointer;
      background-color: rgba(242, 242, 242, 0.5); /* 使用 rgba 设置半透明背景 */
    border-radius: 4px; /* 圆角 */
     position: relative; /* 给列表项添加相对定位 */

}

.list-item.is-directory::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 123, 255, 0.1); /* 鼠标悬停时的背景色 */
  border-radius: 4px;
  opacity: 0; /* 默认透明 */
  transition: opacity 0.3s ease; /* 添加过渡效果 */
  z-index: -1; /* 确保在内容下方 */
}
.list-item.is-directory:hover::before {
      opacity: 1; /* 鼠标悬停时显示背景 */
}
/* 文件内容 */
.item-content {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.item-icon {
  font-size: 24px; /* 更大的图标 */
  margin-right: 15px; /* 更大的间距 */
  flex-shrink: 0;
}

/* 图标颜色 */
.item-icon.directory {
  color: #e6a23c; /* 文件夹 */
}

.item-icon.pdf {
  color: #f56c6c; /* PDF */
}

.item-icon.doc {
  color: #409eff; /* DOC */
}

.item-name {
  flex: 1;
  overflow-wrap: break-word; /* 允许换行 */
  word-break: break-all; /* 强制换行 */
  max-width: calc(100% - 60px); /* 限制最大宽度，防止溢出 */
}

/* 下载按钮 */
.download-button {
  padding: 0; /* 移除内边距 */
  min-width: 40px;/*设置最小宽度*/
  display: flex; /* 使用 flex 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  border: none; /* 移除边框 */
}
.download-button:hover{
    border: 1px solid #409eff;
}
.download-icon {
   font-size: 18px;
    color: #409eff;
    transition: color 0.3s;
}
.download-text{
    margin-left: 4px;   
}
/* 鼠标悬停效果 */
.download-button:hover .download-icon {
    color: #fff;
}
.download-button:hover .download-text{
   color: #fff;
}
.download-button:hover{
     background-color: #409eff;
}
.back-button-container{
     padding: 10px;
}
/* 面包屑导航样式 */
.breadcrumb {
  margin-bottom: 15px;
}

.breadcrumb-item {
  cursor: pointer;
  color: #409eff; /* 设置颜色 */
  transition: color 0.2s ease; /* 添加过渡效果 */
}

.breadcrumb-item:hover {
  text-decoration: underline; /* 鼠标悬停时添加下划线 */
}
/* 响应式 (小屏幕) */
@media (max-width: 768px) {
  .card-header {
    padding: 10px;
  }
    .list-container{
        padding: 0px;
    }
  .list-item {
        padding: 12px 8px; /* 减小 padding */
  }

  .item-icon {
        font-size: 20px; /* 减小图标大小 */
    margin-right: 8px;
  }
  /* 文件名换行 */
     .item-name{
         max-width: calc(100% - 48px);
     }
  .download-button {
        padding: 0; /* 移除内边距 */
      min-width: 35px;/*设置最小宽度*/
    }
    .download-icon{
        font-size: 16px;
    }
    .download-text{
       display: none;
    }
    .download-button:hover .download-text{
      display: inline-block;
    }
}
</style>
