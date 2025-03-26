<template>
  <div class="guide-page elegant-theme"> <!-- 保持页面基础样式 -->
    <div class="page-content-container activity-page"> <!-- 使用 activity-page 类 -->

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>特色活动</h1> <!-- 修改标题 -->
        <p>精彩纷呈，不容错过</p> <!-- 修改副标题 -->
      </div>

      <!-- 加载和错误状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <span>加载活动信息中...</span> <!-- 修改加载文本 -->
      </div>
      <el-alert v-else-if="error" :title="'加载活动信息失败: ' + error" type="error" show-icon :closable="false" class="full-width-alert"/>
      <el-empty v-else-if="!displayActivities || displayActivities.length === 0" description="活动信息暂未公布" /> <!-- 修改空状态文本 -->

      <!-- Activity Flex Layout -->
      <div v-else class="activity-flex-container"> <!-- 使用 activity-flex-container 类 -->
        <div
          v-for="(activity, index) in displayActivities"
          :key="activity.title || `act-${index}`" 
          class="activity-item-wrapper"
          @click="showActivityDetails(activity)"
        >
          <!-- Image Container -->
          <div class="activity-image-container"> <!-- 使用 activity-image-container 类 -->
            <el-image
              :src="activity.image" 
              fit="cover"           
              class="activity-image"   
              lazy
            >
              <template #placeholder>
                  <div class="image-slot loading">
                    <el-icon><Loading /></el-icon>
                  </div>
              </template>
              <template #error>
                  <div class="image-slot error">
                      <el-icon><Picture /></el-icon>
                      <span>图片加载失败</span>
                  </div>
              </template>
            </el-image>
          </div>

          <!-- Text Content Area -->
          <div class="activity-text-content">
            <h3 class="activity-title" :title="activity.title">{{ activity.title }}</h3>
            <p class="activity-description" :title="activity.description">{{ activity.description }}</p>
            <p v-if="activity.date_time" class="activity-datetime">
                <el-icon><Clock /></el-icon>
                <span>{{ activity.date_time }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Activity Details Modal -->
      <el-dialog
        v-model="dialogVisible"
        :title="selectedActivity?.title || '活动详情'" 
        width="80%"
        top="5vh"
        custom-class="activity-dialog" 
        append-to-body
        destroy-on-close
      >
        <div v-if="selectedActivity" class="dialog-content">
           <!-- Dialog 内部可以简化，主要显示 detail_content -->
           <!-- 可以选择性地在顶部显示标题和日期 -->
            <h2 class="dialog-main-title">{{ selectedActivity.title }}</h2>
            <p v-if="selectedActivity.date_time" class="dialog-datetime">
                <el-icon><Clock /></el-icon> {{ selectedActivity.date_time }}
             </p>
             <el-divider />

            <!-- Render HTML Content -->
            <div v-if="selectedActivity.detail_content" class="dialog-html-content" v-html="sanitizeHtml(selectedActivity.detail_content)"></div>
            <el-empty v-else description="暂无活动详情" :image-size="80"></el-empty>

            <!-- 如果需要展示 detail_images 数组中的图片，可以在这里添加 -->
            <div v-if="selectedActivity.detail_images && selectedActivity.detail_images.length > 1" class="dialog-image-gallery">
                <h4>相关图片</h4>
                 <el-carousel indicator-position="outside" :autoplay="false" height="300px">
                    <el-carousel-item v-for="(imgUrl, imgIndex) in selectedActivity.detail_images" :key="`detail-img-${imgIndex}`">
                      <el-image :src="imgUrl" fit="contain" style="width: 100%; height: 100%;" />
                    </el-carousel-item>
                 </el-carousel>
            </div>

        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
            <!-- 活动详情页通常在网站内，可能不需要“访问官网”按钮 -->
            <!-- 如果 detail_url 指向外部链接，可以保留 -->
             <el-button v-if="selectedActivity?.detail_url && selectedActivity.detail_url.startsWith('http')" type="primary" @click="gotoDetailUrl(selectedActivity.detail_url)">
              查看原文
            </el-button>
          </span>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
// 确保引入所需组件和图标
import { ElDialog, ElButton, ElAlert, ElEmpty, ElIcon, ElImage, ElDivider, ElCarousel, ElCarouselItem } from 'element-plus';
import { Loading, Picture, Clock } from '@element-plus/icons-vue';

const activitiesData = ref([]); // 修改变量名
const isLoading = ref(true);
const error = ref(null);
const dialogVisible = ref(false);
const selectedActivity = ref(null); // 修改变量名

// Filter activities to display (must have image and title)
const displayActivities = computed(() => { // 修改计算属性名和过滤逻辑
  return activitiesData.value.filter(act => act.image && act.title);
});

const showActivityDetails = (activity) => { // 修改函数名和参数名
  selectedActivity.value = activity;
  dialogVisible.value = true;
};

const gotoDetailUrl = (url) => {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
};

// Basic HTML sanitation (same as before)
const sanitizeHtml = (htmlString) => {
  if(!htmlString) return '';
  return htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch('/data/activities.json'); // <<< 修改 JSON 文件路径
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
        activitiesData.value = data; // 修改赋值变量
    } else {
        console.warn("Fetched activity data is not an array:", data);
        activitiesData.value = [];
        throw new Error("活动数据格式不正确，应为数组"); // 修改错误信息
    }
  } catch (e) {
    console.error("无法加载活动数据:", e); // 修改错误信息
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- Base & Page Styles Refined --- */
.guide-page {
  padding: 30px 15px; /* Adjust padding */
  background-color: #f7f8fc; /* Lighter, slightly blue-ish background */
  min-height: 100vh;
}
.page-content-container {
  max-width: 1100px; /* Wider container for better flow */
  margin: 0 auto;
  padding: 35px 45px; /* More padding */
  background-color: #fff;
  border-radius: 12px; /* More rounded corners */
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.07); /* Softer, larger shadow */
}
.activity-page { padding-bottom: 60px; }

.page-header {
  margin-bottom: 45px; /* Increased spacing */
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
  text-align: center;
}
.page-header h1 {
  font-size: 28px; /* Larger title */
  font-weight: 600;
  color: #34495e; /* Darker blue-gray */
  margin: 0 0 10px 0;
}
.page-header p {
  font-size: 16px; /* Larger subtitle */
  color: #95a5a6; /* Lighter gray */
  margin: 0;
}

.loading-state, .el-empty { padding: 90px 0; }
.loading-state .el-icon { margin-bottom: 15px; color: var(--el-color-primary); }
.loading-state span { font-size: 15px; color: #555; }
.full-width-alert { margin-bottom: 25px; }
:deep(.el-empty__description p) { color: #999; }


/* --- Activity Card Layout - Enhanced Aesthetics --- */
.activity-flex-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* Center cards by default */
  gap: 35px; /* Increased gap for more breathing room */
  padding: 25px 0;
}

.activity-item-wrapper {
  cursor: pointer;
  border-radius: 10px; /* Slightly softer corners */
  background-color: #fff;
  border: 1px solid #e8edf3; /* Lighter border */
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  overflow: hidden;
  width: 300px; /* Slightly wider base width */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04); /* Softer initial shadow */
}

.activity-item-wrapper:hover {
  transform: translateY(-6px); /* More noticeable lift */
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.09); /* Enhanced hover shadow */
  border-color: #d8dee8; /* Slightly darker border on hover */
}

.activity-image-container {
  height: 175px; /* Increased image height */
  width: 100%;
  overflow: hidden;
  background-color: #f0f2f7; /* Neutral placeholder bg */
}

.activity-image { /* el-image */
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease; /* Smooth image zoom */
}
.activity-item-wrapper:hover .activity-image {
  transform: scale(1.04); /* Subtle zoom on card hover */
}

/* Placeholder/Error styles for the image - Refined */
.image-slot {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  width: 100%; height: 100%; background: #f4f6f9; /* Lighter placeholder */
  color: #c0c4cc; font-size: 13px; text-align: center; box-sizing: border-box;
}
.image-slot.loading .el-icon {
    font-size: 28px;
    color: #b0b3b8;
    animation: spin 1.5s linear infinite; /* Keep loading spin */
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.image-slot.error .el-icon { font-size: 32px; margin-bottom: 8px; color: #dcdfe6; }
.image-slot.error span { color: #b0b3b8; }


/* Text content styling - Enhanced */
.activity-text-content {
    padding: 18px 22px 20px 22px; /* More padding */
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    background-color: #fff; /* Ensure white background */
}

.activity-title {
    font-size: 17px; /* Clearer title */
    font-weight: 600;
    color: #34495e; /* Darker, more professional */
    margin: 0 0 10px 0;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: calc(1.45em * 2); /* Reserve space reliably */
}

.activity-description {
    font-size: 14px; /* Standard description size */
    color: #7f8c8d; /* Softer gray */
    line-height: 1.7; /* Improve readability */
    margin: 0 0 18px 0; /* More space before date */
    flex-grow: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3; /* Keep 3 lines */
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.activity-datetime {
    font-size: 13px; /* Slightly larger date */
    color: #adb5bd; /* Lighter, subtle date color */
    margin: 0;
    display: flex;
    align-items: center;
}
.activity-datetime .el-icon {
    color: #adb5bd; /* Match text color */
    margin-right: 7px; /* More space after icon */
    font-size: 15px;
}


/* --- Dialog Styles - Refined --- */
:deep(.el-dialog.activity-dialog) {
  max-width: 900px; /* Adjust if needed */
  border-radius: 12px; /* Consistent radius */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); /* Clearer dialog shadow */
}
:deep(.activity-dialog .el-dialog__header) {
  padding: 20px 30px;
  border-bottom: 1px solid #f0f2f5;
  border-top-left-radius: 12px; /* Match dialog radius */
  border-top-right-radius: 12px;
}
:deep(.activity-dialog .el-dialog__title) {
  font-size: 19px; /* Slightly larger */
  font-weight: 600;
  color: #34495e;
}
:deep(.activity-dialog .el-dialog__body) {
  padding: 30px 35px;
  max-height: 70vh; /* Adjust based on content */
  overflow-y: auto;
  color: #555;
}
:deep(.activity-dialog .el-dialog__footer) {
  padding: 18px 35px;
  border-top: 1px solid #f0f2f5;
  background-color: #f9fafc; /* Light background footer */
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
:deep(.activity-dialog .el-button) {
  /* Add transition to buttons */
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

/* Dialog internal content styles - Refined */
.dialog-main-title {
    font-size: 24px; font-weight: 600; color: #34495e; margin-bottom: 12px; text-align: center;
}
.dialog-datetime {
    font-size: 15px; color: #95a5a6; text-align: center; margin-bottom: 25px;
    display: flex; align-items: center; justify-content: center;
}
.dialog-datetime .el-icon { margin-right: 8px; }

.dialog-html-content {
    font-size: 15px; line-height: 1.9; color: #4a4a4a; /* Darker text */
}
.dialog-html-content :deep(p) { margin-bottom: 1.4em; }
.dialog-html-content :deep(img) {
    max-width: 100%; height: auto; border-radius: 8px; margin: 25px auto; display: block;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1); /* Refined image shadow */
    border: 1px solid #eee; /* Subtle border for images */
}
.dialog-html-content :deep(video) {
    max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 25px auto;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
.dialog-html-content :deep(b),
.dialog-html-content :deep(strong) { font-weight: 600; color: #2c3e50; } /* Darker strong text */
.dialog-html-content :deep(a) { color: var(--el-color-primary); text-decoration: underline; transition: color 0.2s; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.dialog-html-content :deep(a:hover) { color: var(--el-color-primary-light-3); }


.dialog-image-gallery { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f2f5; }
.dialog-image-gallery h4 { margin-bottom: 20px; font-size: 17px; color: #555; text-align: center; }
:deep(.el-carousel__container) { border-radius: 8px; overflow: hidden; }
:deep(.el-carousel__item) { background-color: #f8f9fa; }


/* --- Responsive Adjustments - Refined Two-Column Mobile --- */
@media (max-width: 768px) {
    .page-content-container { padding: 25px 20px; } /* Less padding */
    .guide-page { padding: 25px 10px; }
    .page-header h1 { font-size: 24px; }
    .page-header p { font-size: 15px; }

     /* Dialog mobile */
    :deep(.el-dialog.activity-dialog) { width: 94% !important; }
    :deep(.activity-dialog .el-dialog__body) { padding: 25px 20px; }
    .dialog-main-title { font-size: 20px; }
}

@media (max-width: 640px) { /* Breakpoint for 2 columns */
    .activity-flex-container {
        justify-content: space-between;
        gap: 20px; /* Mobile gap */
    }
    .activity-item-wrapper {
        width: calc(50% - 10px); /* 50% - (20px / 2) */
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04); /* Keep mobile shadow light */
    }
     .activity-image-container { height: 140px; /* Adjust mobile image height */ }
     .activity-title { font-size: 15px; min-height: calc(1.45em * 2); }
     .activity-description { font-size: 13px; line-height: 1.6; -webkit-line-clamp: 2; margin-bottom: 12px; }
     .activity-datetime { font-size: 12px; }
     .activity-text-content { padding: 15px; }
}

/* Optional: Very small screens (< 400px), switch to 1 column */
@media (max-width: 400px) {
   .activity-flex-container { justify-content: center; gap: 25px; }
   .activity-item-wrapper { width: 90%; /* Almost full width */ }
   /* Adjust image/text for single column if needed */
   .activity-image-container { height: 160px; }
 }

</style>

