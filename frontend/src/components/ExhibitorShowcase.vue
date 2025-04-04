<template>
    <div class="guide-page elegant-theme">
      <div class="page-content-container exhibitors-page">
  
        <!-- Page Header (不变) -->
        <div class="page-header">
          <h1>展商风采</h1>
          <p>探索领先技术与创新解决方案</p>
        </div>
  
        <!-- Loading / Error / Empty States (不变) -->
        <div v-if="isLoading" class="loading-state">
          <el-icon class="is-loading" :size="30"><Loading /></el-icon>
          <span>加载展商信息中...</span>
        </div>
        <el-alert v-else-if="error" :title="'加载展商信息失败: ' + error" type="error" show-icon :closable="false" class="full-width-alert"/>
        <el-empty v-else-if="!displayExhibitors || displayExhibitors.length === 0" description="展商信息暂未公布" />
  
        <!-- Exhibitors Flex Layout -->
        <div v-else class="exhibitor-flex-container">
          <div
            v-for="(exhibitor, index) in displayExhibitors"
            :key="exhibitor.name || `ex-${index}`"
            class="exhibitor-item-wrapper"
            @click="showExhibitorDetails(exhibitor)"
          >
            <div class="exhibitor-logo-container">
              <el-image
                :src="exhibitor.logo"
                fit="contain"
                class="exhibitor-logo"
                lazy
              >
                <template #placeholder>
                    <div class="logo-slot loading">加载中...</div>
                </template>
                <template #error>
                    <div class="logo-slot error">
                        <el-icon><Picture /></el-icon>
                        <!-- Show name if logo fails and name exists -->
                        <span v-if="exhibitor.name" class="error-name">{{ exhibitor.name }}</span>
                        <span v-else>图片加载失败</span>
                    </div>
                </template>
              </el-image>
            </div>
             <!-- Optional: Show name below logo if design allows -->
             <!-- <div class="exhibitor-name-label" v-if="exhibitor.name">{{ exhibitor.name }}</div> -->
          </div>
        </div>
  
        <!-- Exhibitor Details Modal -->
        <el-dialog
          v-model="dialogVisible"
          :title="selectedExhibitor?.name || '展商详情'"
          width="80%"
          top="5vh"
          custom-class="exhibitor-dialog"
          append-to-body
          destroy-on-close
        >
          <div v-if="selectedExhibitor" class="dialog-content">
            <el-row :gutter="30">
              <!-- Left Column: Logo, Name, Description -->
              <el-col :xs="24" :sm="8" :md="7" class="dialog-left-col">
                <el-image
                  v-if="selectedExhibitor.detail_logo"
                  :src="selectedExhibitor.detail_logo"
                  fit="contain"
                  class="dialog-detail-logo"
                >
                  <template #error>
                      <div class="logo-slot error small">详情Logo加载失败</div>
                  </template>
                </el-image>
                 <h3 class="dialog-title">{{ selectedExhibitor.name }}</h3>
                 <p v-if="selectedExhibitor.description" class="dialog-description">
                   {{ selectedExhibitor.description }}
                 </p>
              </el-col>
  
              <!-- Right Column: Video, HTML Content -->
              <el-col :xs="24" :sm="16" :md="17" class="dialog-right-col">
                 <div v-if="selectedExhibitor.video" class="dialog-video-wrapper">
                   <video controls :src="selectedExhibitor.video" :poster="selectedExhibitor.poster || ''" preload="metadata">
                        您的浏览器不支持视频播放。
                   </video>
                 </div>
                 <!-- Render HTML Content -->
                 <h4>公司介绍</h4>
                 <div v-if="selectedExhibitor.content" class="dialog-html-content" v-html="sanitizeHtml(selectedExhibitor.content)"></div>
                 <el-empty v-else description="暂无详细介绍" :image-size="80"></el-empty>
              </el-col>
            </el-row>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">关闭</el-button>
              <el-button v-if="selectedExhibitor?.detail_url" type="primary" @click="gotoDetailUrl(selectedExhibitor.detail_url)">
                访问官网
              </el-button>
            </span>
          </template>
        </el-dialog>
  
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { ElDialog, ElButton, ElRow, ElCol, ElAlert, ElEmpty, ElIcon, ElImage } from 'element-plus';
  import { Loading, Picture } from '@element-plus/icons-vue';
  // Optional: Import a sanitizer if needed, though v-html is used assuming trusted source here
  // Example: import DOMPurify from 'dompurify';
  
  const exhibitorsData = ref([]);
  const isLoading = ref(true);
  const error = ref(null);
  const dialogVisible = ref(false);
  const selectedExhibitor = ref(null);
  
  // Filter exhibitors who have at least a logo to display in the list
  const displayExhibitors = computed(() => {
    // Filter out entries where name is empty string if that's how 'empty' entries appear
    return exhibitorsData.value.filter(ex => ex.logo && ex.name !== "");
  });
  
  const showExhibitorDetails = (exhibitor) => {
    selectedExhibitor.value = exhibitor;
    dialogVisible.value = true;
  };
  
  const gotoDetailUrl = (url) => {
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
  };
  
  // Basic sanitation example (replace with a robust library like DOMPurify if needed)
  const sanitizeHtml = (htmlString) => {
    if(!htmlString) return '';
    // WARNING: This is NOT a secure sanitizer. Use a library for user-generated content.
    // It mainly removes script tags for this basic case.
    // Consider using DOMPurify: DOMPurify.sanitize(htmlString);
    // For this specific trusted content, we'll just remove script tags as a minimal precaution.
    return htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };
  
  
  onMounted(async () => {
    isLoading.value = true; // Ensure loading state is true at the start
    error.value = null; // Reset error
    try {
      const response = await fetch('/data/exhibitors.json'); // Adjust path if needed
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
          exhibitorsData.value = data;
      } else {
          console.warn("Fetched exhibitor data is not an array:", data);
          exhibitorsData.value = [];
          throw new Error("展商数据格式不正确，应为数组");
      }
    } catch (e) {
      console.error("无法加载展商数据:", e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  });
  </script>
  
  <style scoped>
  /* --- Base & Page Styles (mostly unchanged) --- */
  .guide-page { padding: 30px; background-color: #f9fafb; min-height: 100vh; }
  .page-content-container { max-width: 1200px; margin: 0 auto; padding: 30px 40px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); }
  .exhibitors-page { padding-bottom: 50px; }
  .page-header { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #f0f2f5; text-align: center; } /* Centered Header */
  .page-header h1 { font-size: 26px; font-weight: 600; color: #1f2d3d; margin: 0 0 8px 0; }
  .page-header p { font-size: 15px; color: #8492a6; margin: 0; }
  
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
  color: #669bff;
}
  .full-width-alert { margin-bottom: 20px; }
  
  /* --- Exhibitor Flex Layout --- */
  .exhibitor-flex-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center; /* Center items horizontally */
    gap: 30px; /* Gap between items */
    padding: 20px 0;
  }
  
  .exhibitor-item-wrapper {
    cursor: pointer;
    border-radius: 12px; /* Softer corners */
    background-color: #fff;
    border: 1px solid #eef0f3; /* Lighter border */
    transition: transform 0.25s ease-out, box-shadow 0.25s ease-out;
    overflow: hidden;
    width: 180px; /* Base width */
    display: flex; /* To potentially stack logo and name */
    flex-direction: column;
    align-items: center;
  }
  
  .exhibitor-item-wrapper:hover {
    transform: translateY(-6px) scale(1.02); /* Slightly more pronounced hover */
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.09);
    box-shadow: var(--global-box-shadow);
    border-color: #dce0e6;
  }
  
  .exhibitor-logo-container {
    padding: 15px; /* Padding around the logo */
    height: 150px; /* Fixed height for logo area */
    padding-top: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }
  
  .exhibitor-logo {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
  
  /* Placeholder/Error styles for the logo */
  .logo-slot {
    display: flex;
    flex-direction: column; /* Stack icon and text */
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f8f9fa;
    color: #b0b3b8;
    font-size: 12px;
    border-radius: inherit;
    text-align: center;
    padding: 5px;
    box-sizing: border-box;
  }
  .logo-slot.loading { color: #909399; }
  .logo-slot.error .el-icon {
    font-size: 28px;
    margin-bottom: 5px;
  }
  .logo-slot .error-name {
      font-weight: 500;
      font-size: 13px;
      color: #a0a3a7;
      margin-top: 4px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
  }
  .logo-slot.error.small { /* Smaller version for dialog */
      font-size: 11px;
      height: 60px; /* Adjust as needed */
  }
  .logo-slot.error.small .el-icon {
      font-size: 20px;
  }
  
  
  /* Optional: Name label below logo */
  /*
  .exhibitor-name-label {
      padding: 8px 10px;
      font-size: 13px;
      color: #606266;
      text-align: center;
      width: 100%;
      border-top: 1px solid #f0f2f5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }
  */
  
  /* --- Dialog Styles --- */
  :deep(.el-dialog.exhibitor-dialog) {
    /* Styles for the dialog itself */
    max-width: 950px; /* Limit max width */
    border-radius: 10px;
  }
  
  :deep(.exhibitor-dialog .el-dialog__header) {
    padding: 18px 25px;
    margin-right: 0; /* Reset default margin if needed */
    border-bottom: 1px solid #eef0f3;
  }
  :deep(.exhibitor-dialog .el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
  :deep(.exhibitor-dialog .el-dialog__body) {
    padding: 25px 30px;
    max-height: 75vh; /* Limit body height and enable scroll */
    overflow-y: auto;
    color: #606266;
  }
  :deep(.exhibitor-dialog .el-dialog__footer) {
      padding: 15px 30px;
      border-top: 1px solid #eef0f3;
  }
  
  .dialog-left-col {
      text-align: center;
      border-right: 1px solid #f0f2f5; /* Separator line on larger screens */
      padding-right: 25px !important; /* Ensure padding */
      margin-bottom: 20px; /* Spacing on mobile */
  }
  .dialog-detail-logo {
      max-width: 200px; /* Limit logo size */
      margin-bottom: 20px;
      display: inline-block; /* Center it */
      border: 1px solid #f5f7fa;
      border-radius: 6px;
      padding: 5px;
  }
  .dialog-title {
      font-size: 1.3em;
      font-weight: 600;
      color: #303133;
      margin-bottom: 10px;
  }
  .dialog-description {
      font-size: 0.95em;
      color: #8492a6;
      line-height: 1.6;
      margin-bottom: 20px;
  }
  
  .dialog-right-col {
      padding-left: 25px !important;
  }
  .dialog-video-wrapper {
      margin-bottom: 25px;
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
      overflow: hidden;
      background-color: #eee;
      border-radius: 6px;
  }
  .dialog-video-wrapper video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 6px;
  }
  .dialog-right-col h4 {
      font-size: 1.1em;
      font-weight: 600;
      color: #303133;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
  }
  .dialog-html-content {
    font-size: 14px;
    line-height: 1.8;
    color: #555;
  }
  /* Target elements within v-html safely (use :deep if needed) */
  .dialog-html-content :deep(p) { margin-bottom: 1em; }
  .dialog-html-content :deep(img) { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
  .dialog-html-content :deep(b),
  .dialog-html-content :deep(strong) { font-weight: 600; color: #444; }
  /* Add more specific styles for elements inside v-html as needed */
  
  
  /* Responsive Dialog Adjustments */
  @media (max-width: 768px) {
      :deep(.el-dialog.exhibitor-dialog) {
          width: 90% !important; /* Wider on mobile */
          top: 3vh;
      }
      :deep(.exhibitor-dialog .el-dialog__body) {
        padding: 20px;
        max-height: 80vh;
      }
      .dialog-left-col {
          border-right: none; /* Remove separator */
          padding-right: 0 !important;
          margin-bottom: 30px;
          border-bottom: 1px solid #f0f2f5; /* Add bottom separator */
          padding-bottom: 25px;
      }
       .dialog-right-col {
          padding-left: 0 !important;
       }
      .exhibitor-item-wrapper {
          width: 140px; /* Smaller items on mobile */
      }
      .exhibitor-logo-container {
          height: 90px;
          padding: 15px;
      }
  }
  @media (max-width: 480px) {
       .exhibitor-item-wrapper {
          width: calc(50% - 15px); /* Two columns on very small screens */
          gap: 15px;
      }
        .exhibitor-logo-container {
          height: 80px;
          padding: 10px;
      }
  }
  </style>
  