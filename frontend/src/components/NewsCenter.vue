<template>
  <div class="news-center-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-header">
          <h1>新闻中心</h1>
          <p>查看会议最新动态与报道</p>
        </div>
      </template>

      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="26"><Loading /></el-icon>
        <span>加载新闻中...</span>
      </div>

      <el-alert v-else-if="error" :title="'加载新闻失败: ' + error" type="error" show-icon :closable="false" />

      <el-empty v-else-if="!newsList || newsList.length === 0" description="暂无新闻发布" />

      <!-- Use el-row/el-col for the two-column grid layout -->
      <el-row v-else :gutter="20" class="news-list-grid">
        <el-col
          :xs="24"
          :sm="12"
          v-for="(news, index) in newsList"
          :key="news.url || news.title || index"
          class="news-item-col"
        >
          <el-card shadow="hover" class="news-item-card" @click="showNewsDetail(news)">
            <!-- Removed the <a> tag wrapper -->
            <el-row :gutter="15" align="top">
              <el-col :span="24">
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
                    <!-- Maybe add source name if available -->
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

    <!-- News Detail Dialog -->
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
        <!-- Optional: Display image again in dialog -->
        <!-- <el-image :src="selectedNews.image" fit="contain" class="dialog-image" /> -->

        <div class="dialog-meta">
           <span v-if="selectedNews.sourceLogo" class="news-source">
                <el-avatar :size="20" :src="selectedNews.sourceLogo" shape="circle"/>&nbsp;
                <!-- Source Name -->
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
          <!-- Render the news content with preserved line breaks -->
          <p class="news-full-content">{{ selectedNews.content }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <!-- Optional: Original Link Button -->
          <el-button v-if="selectedNews?.url" type="primary" @click="goToExternalUrl(selectedNews.url)">
             查看原文
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElCard, ElRow, ElCol, ElImage, ElIcon, ElAlert, ElEmpty, ElAvatar, ElTag, ElDialog, ElButton } from 'element-plus';
import { Loading, Picture, Calendar, CollectionTag } from '@element-plus/icons-vue';

const newsList = ref([]);
const isLoading = ref(true);
const error = ref(null);
const selectedNews = ref(null);
const dialogVisible = ref(false);

// Simple check for mobile based on window width (adjust breakpoint if needed)
const isMobile = computed(() => window.innerWidth < 768);

// Function to open the dialog
const showNewsDetail = (newsItem) => {
  selectedNews.value = newsItem;
  dialogVisible.value = true;
};

// Function to navigate to external URL (optional)
const goToExternalUrl = (url) => {
  window.open(url, '_blank', 'noopener noreferrer');
}

onMounted(async () => {
  try {
    const response = await fetch('/data/news.json'); // Fetch from public/data/
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      newsList.value = data;
    } else {
      console.warn("Fetched news data is not an array:", data);
      newsList.value = [];
      throw new Error("新闻数据格式不正确");
    }
  } catch (e) {
    console.error("无法加载新闻数据:", e);
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- General Page Styles --- */
.news-center-page {
  padding: 20px;
  background-color: #f8f9fa;
}

.page-card {
  max-width: 1200px;
  margin: 0 auto;
  border: none;
  background-color: transparent; /* Make card background transparent */
  box-shadow: none; /* Remove default card shadow */
}
.page-card :deep(.el-card__header) {
    border-bottom: none; /* Remove header border */
     padding: 10px 0 20px 0; /* Adjust header padding */
}
.page-card :deep(.el-card__body) {
    padding: 0; /* Remove body padding if row handles spacing */
}


.card-header h1 {
  margin-bottom: 5px;
  font-size: 24px;
  font-weight: bold;
  color:#303133;
}
.card-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  color: #909399;
  font-size: 16px;
}
.loading-state .el-icon {
  margin-right: 8px;
}

/* --- News List Grid Styles --- */
.news-list-grid {
  /* el-row with gutter handles spacing */
}

.news-item-col {
  margin-bottom: 20px; /* Add space below each card column */
}

/* --- News Item Card Styles --- */
.news-item-card {
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%; /* Ensure cards in the same row have equal height */
  display: flex; /* Needed for height: 100% to work correctly with flex children */
  flex-direction: column;
}
.news-item-card :deep(.el-card__body) {
    padding: 0; /* Remove padding, let el-row handle it */
      flex-grow: 1; /* Allow body to grow */
    display: flex; /* Use flex for internal layout too */
}
 .news-item-card .el-row {
    width: 100%; /* Make inner row take full width */
 }

.news-item-card:hover {
   transform: translateY(-5px);
   box-shadow: var(--el-box-shadow-light);
}

.news-image {
  width: 100%;
  height: 180px; /* Adjust height as needed */
  border-radius: 8px 8px 0 0; /* Round top corners only */
  display: block;
  background-color: #f5f7fa;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.image-slot .el-icon {
  font-size: 24px;
}

.news-content {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Allow content to fill remaining space */
}

.news-title {
  font-size: 16px; /* Slightly smaller */
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #303133;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  min-height: calc(1.4em * 2); /* Ensure space for 2 lines */
}

.news-description {
  font-size: 13px; /* Slightly smaller */
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px; /* More space before meta */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
    flex-grow: 1; /* Allow description to take up available space */
}


.news-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: auto; /* Push meta to bottom */
  padding-top: 8px; /* Add some space above meta */
  border-top: 1px solid #e4e7ed; /* Subtle separator */
}

.news-meta .el-icon {
  vertical-align: middle;
  margin-right: 3px;
  font-size: 14px;
}
.news-source{
    display: flex;
    align-items: center;
}
.source-logo{
    margin-right: 4px;
}
.news-tags {
  display: flex;
  align-items: center;
}
.tag-item {
  margin-left: 4px;
  height: 20px; /* Smaller tags */
  padding: 0 6px;
}

/* --- Dialog Styles --- */
.news-detail-dialog .el-dialog__header {
    border-bottom: 1px solid var(--el-border-color-light);
    margin-right: 0; /* Override element plus default */
}
.news-detail-dialog .el-dialog__body {
     padding: 20px;
 }
.dialog-content-wrapper {
    max-height: 75vh; /* Limit height */
    overflow-y: auto; /* Enable scrolling */
    padding-right: 10px; /* Space for scrollbar */
}
/* Optional Dialog Image */
/*
.dialog-image {
    width: 100%;
    max-width: 500px;
    margin: 0 auto 20px auto;
    display: block;
    border-radius: 6px;
}
*/
.dialog-meta {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 13px;
    color: #909399;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
    flex-wrap: wrap;
}
.dialog-meta .el-icon {
     vertical-align: middle;
     margin-right: 4px;
}
.dialog-tags{
     display: flex;
    align-items: center;
}

.dialog-main-content {
  line-height: 1.7;
  color: #303133;
  font-size: 15px;
}

.news-full-content {
  white-space: pre-wrap; /* Preserve line breaks and spaces */
  word-wrap: break-word; /* Break long words */
  margin: 0;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

/* --- Responsiveness --- */
@media (max-width: 768px) {
  .news-center-page {
    padding: 15px;
  }
  .news-list-grid {
     /* Already handled by :xs="24" in el-col */
  }
   .news-item-card .el-row {
    /* Stack image and content vertically on small screens if needed */
   /* flex-direction: column; */
  }
   .news-image {
      height: 160px;
     border-radius: 8px; /* Apply border-radius to all corners */
   }
   .news-content {
     padding: 12px;
  }
    .news-title {
     font-size: 15px;
  }
   .news-description {
      font-size: 12px;
     -webkit-line-clamp: 2;
   }
  .news-meta {
      font-size: 11px;
     gap: 8px;
   }
}

</style>
