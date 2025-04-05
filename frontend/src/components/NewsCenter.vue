<template>
  <div class="news-center-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-header">
          <h1>新闻中心</h1>
          <p>查看会议最新动态与报道</p>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="search-bar-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索新闻标题、描述或标签..."
          :prefix-icon="Search"
          clearable
          size="large"
        />
      </div>

      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="26"><Loading /></el-icon>
        <span>加载新闻中...</span>
      </div>

      <el-alert v-else-if="error" :title="'加载新闻失败: ' + error" type="error" show-icon :closable="false" />

      <!-- 更新空状态逻辑 -->
      <el-empty v-else-if="!filteredNewsList || filteredNewsList.length === 0"
                :description="searchQuery ? '没有找到相关新闻' : '暂无新闻发布'" />

      <!-- 使用 filteredNewsList 渲染新闻列表 -->
      <el-row v-else :gutter="20" class="news-list-grid">
        <el-col
          :xs="24"
          :sm="12"
          v-for="(news) in filteredNewsList"
          :key="news.url || news.title || index" 
          class="news-item-col"
        >
          <el-card shadow="hover" class="news-item-card" @click="showNewsDetail(news)">
            <el-row :gutter="15" align="top">
              <el-col :span="24" >
                <el-image :src="news.image" fit="cover" class="news-image" lazy>
                  <template #placeholder>
                    <div class="image-slot">加载中<span class="dot">...</span></div>
                  </template>
                  <template #error>
                    <div class="image-slot">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </el-col>
              <el-col :span="24" class="news-content">
                <h3 class="news-title" :title="news.title">{{ news.title }}</h3>
                <p v-if="news.description" class="news-description">{{ news.description }}</p>
                 <div class="news-meta">
                   <span v-if="news.sourceLogo" class="news-source">
                    <el-avatar :size="18" :src="news.sourceLogo" shape="circle" class="source-logo"/>
                  </span>
                  <span v-if="news.date" class="news-date">
                    <el-icon><Calendar /></el-icon> {{ news.date }}
                  </span>
                   <span v-if="news.tags && news.tags.length > 0" class="news-tags">
                    <el-icon><CollectionTag /></el-icon>
                    <el-tag v-for="tag in news.tags" :key="tag" type="info" size="small" effect="light" round class="tag-item">
                       {{ tag }}
                     </el-tag>
                   </span>
                 </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- News Detail Dialog (保持不变) -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedNews?.title"
      width="80%"
      top="5vh"
      :fullscreen="isMobile"
      custom-class="news-detail-dialog"
      append-to-body
      destroy-on-close
    >
      <div v-if="selectedNews" class="dialog-content-wrapper">
        <div class="dialog-meta">
           <span v-if="selectedNews.sourceLogo" class="news-source">
                <el-avatar :size="20" :src="selectedNews.sourceLogo" shape="circle"/> 
            </span>
            <span v-if="selectedNews.date"><el-icon><Calendar /></el-icon> {{ selectedNews.date }}</span>
             <span v-if="selectedNews.tags && selectedNews.tags.length > 0" class="dialog-tags">
                <el-icon><CollectionTag /></el-icon>
                 <el-tag v-for="tag in selectedNews.tags" :key="tag" type="info" size="small" effect="light" round class="tag-item">
                    {{ tag }}
                 </el-tag>
             </span>
        </div>
        <div class="dialog-main-content">
          <p class="news-full-content">{{ selectedNews.content }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button v-if="selectedNews?.url" type="primary" @click="goToExternalUrl(selectedNews.url)">
             查看原文
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
// 引入 computed, ElInput, Search 图标
import { ref, onMounted, computed } from 'vue';
import { ElCard, ElRow, ElCol, ElImage, ElIcon, ElAlert, ElEmpty, ElAvatar, ElTag, ElDialog, ElButton, ElInput } from 'element-plus';
// 引入 Search 图标
import { Loading, Picture, Calendar, CollectionTag, Search } from '@element-plus/icons-vue';

const newsList = ref([]);
const isLoading = ref(true);
const error = ref(null);
const selectedNews = ref(null);
const dialogVisible = ref(false);

// --- 新增搜索状态 ---
const searchQuery = ref('');

const isMobile = computed(() => {
    // 在 onMounted 后访问 window 对象更安全
    if (typeof window !== 'undefined') {
        return window.innerWidth < 768;
    }
    return false; // 默认值或服务器端渲染时的回退
});

const showNewsDetail = (newsItem) => {
  selectedNews.value = newsItem;
  dialogVisible.value = true;
};

const goToExternalUrl = (url) => {
  if (url) {
    window.open(url, '_blank', 'noopener noreferrer');
  }
}

onMounted(async () => {
  isLoading.value = true; // 确保开始时是加载状态
  error.value = null;
  try {
    const response = await fetch('/data/news.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      newsList.value = data;
    } else {
      console.warn("Fetched news data is not an array:", data);
      newsList.value = [];
      // 可以不抛错，让页面显示“暂无新闻”
      // throw new Error("新闻数据格式不正确");
    }
  } catch (e) {
    console.error("无法加载新闻数据:", e);
    error.value = e.message;
    newsList.value = []; // 保证出错时列表为空
  } finally {
    isLoading.value = false;
  }
});

// --- 计算属性过滤新闻列表 ---
const filteredNewsList = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) {
    return newsList.value; // 无搜索词返回全部
  }

  return newsList.value.filter(news => {
    const titleMatch = news.title?.toLowerCase().includes(query);
    const descriptionMatch = news.description?.toLowerCase().includes(query);
    // 检查标签数组中是否有任何一个标签包含搜索词
    const tagsMatch = Array.isArray(news.tags) && news.tags.some(tag => tag?.toLowerCase().includes(query));
    // 可选：搜索内容 (如果需要，请取消注释)
    // const contentMatch = news.content?.toLowerCase().includes(query);

    return titleMatch || descriptionMatch || tagsMatch /* || contentMatch */;
  });
});

</script>

<style scoped>
/* --- General Page Styles --- */
.news-center-page {
  padding: 20px;
  background-color: var(--background-color); /* 使用主题背景色 */
}

.page-card {
  max-width: 1200px;
  margin: 0 auto;
  border: none;
  background-color: #ffffff; /* 卡片背景设为白色 */
  border-radius: 8px;      /* 添加圆角 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04); /* 添加轻微阴影 */
  padding: 20px;
}
.page-card :deep(.el-card__header) {
    border-bottom: none;
     padding: 10px 0 0 0; /* 调整头部内边距 */
     margin-bottom: 0; /* 移除 header 默认的 margin-bottom */
}
.page-card :deep(.el-card__body) {
    padding: 0; /* 移除 body padding */
}

.card-header {
    margin-bottom: 25px; /* 调整标题和搜索框间距 */
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f2f5;
    text-align: center;
}
.card-header h1 { font-size: 26px; font-weight: 600; color: #1f2d3d; margin: 0 0 8px 0; }
.card-header p { font-size: 15px; color: #8492a6; margin: 0; }

/* --- 搜索框样式 --- */
.search-bar-container {
  margin-bottom: 30px; /* 搜索框和下方内容的间距 */
  padding: 0 5px; /* 微调左右内边距，使其看起来更居中 */
}
:deep(.search-bar-container .el-input__prefix .el-icon) {
  color: #a8abb2;
}

.loading-state { display: flex; justify-content:center; align-items:center; padding: 60px 0; color: #909399; font-size: 16px; }
.loading-state .el-icon { margin-right: 8px; color: #669bff; }

/* --- News List Grid Styles --- */
.news-list-grid { }
.news-item-col { margin-bottom: 20px; }

/* --- News Item Card Styles --- */
.news-item-card {
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5; /* 更清晰的边框 */
  background-color: #fff; /* 确保卡片背景是白色 */
}
.news-item-card :deep(.el-card__body) { padding: 0; flex-grow: 1; display: flex; }
 .news-item-card .el-row { width: 100%; }

.news-item-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.news-image {
  width: 100%; /* 图片宽度占满其列 */
  height: 180px;
  border-radius: 8px 8px 0 0; /* 图片顶部圆角 */
  display: block;
  background-color: #f5f7fa;
  object-fit: cover; /* 确保图片覆盖区域，不变形 */
}

.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #c0c4cc; font-size: 14px; }
.image-slot .el-icon { font-size: 30px; } /* 增大图标 */

.news-content { padding: 15px; display: flex; flex-direction: column; flex-grow: 1; }

.news-title {
  font-size: 17px; /* 稍大标题 */
  font-weight: 600; /* 加粗 */
  margin: 0 0 8px 0;
  color: #303133;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  overflow: hidden; text-overflow: ellipsis; line-height: 1.4;
  min-height: calc(1.4em * 2);
}

.news-description {
  font-size: 14px; /* 稍大描述 */
  color: #606266;
  line-height: 1.6; /* 增加行高 */
  margin-bottom: 15px; /* 描述和 meta 间距 */
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; /* 最多 3 行 */
  overflow: hidden; text-overflow: ellipsis;
  flex-grow: 1;
  min-height: calc(1.6em * 1); /* 至少保证一行高度 */
}


.news-meta {
  display: flex; align-items: center; font-size: 12px; color: #909399;
  gap: 12px; flex-wrap: wrap; margin-top: auto; padding-top: 10px; /* 调整间距 */
  border-top: 1px solid #f0f2f5; /* 更轻的分隔线 */
}

.news-meta .el-icon { vertical-align: middle; margin-right: 4px; font-size: 14px; } /* 统一图标大小 */
.news-source{ display: flex; align-items: center; }
.source-logo{ margin-right: 5px; /* Logo 和文字间距 */ }
.news-tags { display: flex; align-items: center; gap: 4px; /* 标签间距 */ }
.tag-item { height: 20px; padding: 0 8px; background-color: #f4f4f5; border: none; } /* 调整标签样式 */

/* --- Dialog Styles --- */
.news-detail-dialog .el-dialog__header { border-bottom: 1px solid #ebeef5; margin-right: 0; padding: 15px 20px; } /* 调整内边距 */
.news-detail-dialog .el-dialog__title { font-size: 18px; font-weight: 600; } /* 标题样式 */
.news-detail-dialog .el-dialog__body { padding: 25px; } /* 增加内容区内边距 */

.dialog-content-wrapper { max-height: calc(100vh - 210px); overflow-y: auto; padding-right: 10px; } /* 动态计算最大高度 */
@media (max-width: 768px) {
    .dialog-content-wrapper { max-height: calc(90vh - 150px); } /* 移动端调整 */
}

.dialog-meta {
    display: flex; align-items: center; gap: 15px; font-size: 13px; color: #909399;
    margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px dashed #e4e7ed;
    flex-wrap: wrap;
}
.dialog-meta .el-icon { vertical-align: middle; margin-right: 5px; } /* 图标右边距 */
.dialog-tags{ display: flex; align-items: center; gap: 5px; } /* 弹窗内标签间距 */

.dialog-main-content { line-height: 1.8; color: #303133; font-size: 15px; } /* 增大行高 */
.news-full-content { white-space: pre-wrap; word-wrap: break-word; margin: 0; }

.dialog-footer { display: flex; justify-content: flex-end; } /* 页脚按钮靠右 */
.dialog-footer .el-button { margin-left: 10px; }

/* 移除卡片内第一列的居中，让图片靠左 */
/* .news-item-card :deep(.el-col:first-child) { justify-content: flex-start; } */


/* --- Responsiveness --- */
@media (max-width: 768px) {
  .news-center-page { padding: 15px 10px; } /* 调整页面边距 */
  .page-card { padding: 15px; }
  .card-header { margin-bottom: 20px; padding-bottom: 15px; }
  .card-header h1 { font-size: 22px; }
  .search-bar-container { margin-bottom: 25px; padding: 0; }
   .news-image { height: 160px; border-radius: 6px 6px 0 0; } /* 调整图片高度和圆角 */
   .news-content { padding: 12px; }
   .news-title { font-size: 16px; min-height: calc(1.4em * 1); -webkit-line-clamp: 2; } /* 标题调整 */
   .news-description { font-size: 13px; -webkit-line-clamp: 2; margin-bottom: 10px; } /* 描述调整 */
   .news-meta { font-size: 11px; gap: 8px; padding-top: 8px; }
}
@media (max-width: 576px) {
    .news-title { font-size: 15px; }
    .news-description { font-size: 12px; }
}

</style>