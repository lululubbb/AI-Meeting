<template>
  <div class="guide-page elegant-theme"> <!-- 复用 guide-page 的基础样式 -->
    <div class="page-content-container"> <!-- 复用容器样式 -->

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>参会嘉宾</h1>
        <p>了解本次大会的重要嘉宾与演讲者</p>
      </div>

      <!-- 加载和错误状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <span>加载嘉宾信息中...</span>
      </div>
      <el-alert v-else-if="error" :title="'加载嘉宾信息失败: ' + error" type="error" show-icon :closable="false" class="full-width-alert"/>
      <el-empty v-else-if="!guestData || (!guestData.expert_committee?.length && !guestData.speakers?.length)" description="嘉宾信息暂未公布" />

      <!-- 主要内容区域 -->
      <div v-else class="sections-container">

        <!-- Section: 专家委员会 -->
        <section v-if="guestData.expert_committee && guestData.expert_committee.length > 0" class="content-section">
          <div class="section-title">
            <el-icon><Reading /></el-icon> <!-- 使用合适的图标 -->
            <h2>专家委员会</h2> <!-- 固定标题或从JSON读取（如果未来有） -->
          </div>
          <!-- 嘉宾卡片网格 -->
          <el-row :gutter="20" class="guest-grid">
            <el-col
              :xs="12" :sm="8" :md="6" :lg="4"
              v-for="(expert, index) in guestData.expert_committee" :key="expert.name || index"
              class="guest-col"
            >
              <el-card shadow="hover" class="guest-card" body-style="padding:0;">
                <el-image :src="expert.image || defaultAvatar" fit="cover" class="guest-avatar" lazy>
                   <template #placeholder><div class="avatar-slot loading"></div></template>
                   <template #error><div class="avatar-slot error"><el-icon><User /></el-icon></div></template>
                </el-image>
                <div class="guest-info">
                   <h3 class="guest-name">{{ expert.name || '嘉宾姓名' }}</h3>
                   <p v-if="expert.description" class="guest-description">{{ expert.description }}</p>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </section>
        <el-divider v-if="guestData.expert_committee?.length && guestData.speakers?.length" class="section-divider"/>

        <!-- Section: 演讲嘉宾 -->
        <section v-if="guestData.speakers && guestData.speakers.length > 0" class="content-section">
          <div class="section-title">
            <el-icon><Microphone /></el-icon> <!-- 使用合适的图标 -->
            <h2>演讲嘉宾</h2> <!-- 固定标题或从JSON读取（如果未来有） -->
          </div>
           <!-- 嘉宾卡片网格 -->
          <el-row :gutter="20" class="guest-grid">
            <el-col
              :xs="12" :sm="8" :md="6" :lg="4"
              v-for="(speaker, index) in guestData.speakers" :key="speaker.name || index"
              class="guest-col"
            >
              <el-card shadow="hover" class="guest-card" body-style="padding:0;">
                <el-image :src="speaker.image || defaultAvatar" fit="cover" class="guest-avatar" lazy>
                   <template #placeholder><div class="avatar-slot loading"></div></template>
                   <template #error><div class="avatar-slot error"><el-icon><User /></el-icon></div></template>
                </el-image>
                <div class="guest-info">
                   <h3 class="guest-name">{{ speaker.name || '嘉宾姓名' }}</h3>
                   <!-- 使用 blurb 或 description -->
                   <p v-if="speaker.blurb || speaker.description" class="guest-description">
                       {{ speaker.blurb || speaker.description }}
                   </p>
                   <!-- 可选：显示参与的议程 -->
                   <div v-if="speaker.participation && speaker.participation.length > 0" class="guest-participation">
                       <el-popover placement="top-start" :width="300" trigger="hover">
                           <template #reference>
                               <el-tag type="success" size="small" effect="light" round>
                                    <el-icon><Calendar /></el-icon> 查看议程
                               </el-tag>
                           </template>
                           <ul class="participation-list">
                               <li v-for="(item, pIndex) in speaker.participation" :key="pIndex">
                                   <span>{{ item.date }} {{ item.time }}</span>
                                   <p>{{ item.title }}</p>
                               </li>
                           </ul>
                       </el-popover>
                   </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElCard, ElRow, ElCol, ElImage, ElIcon, ElAlert, ElEmpty, ElDivider, ElTag, ElPopover } from 'element-plus';
import { Loading, Reading, Microphone, User, Calendar } from '@element-plus/icons-vue'; // 引入新图标

const guestData = ref(null);
const isLoading = ref(true);
const error = ref(null);

// 默认头像，如果 JSON 中缺少图片
const defaultAvatar = ref('url-to-your-default-avatar.png'); // 替换为你的默认头像图片 URL 或 Base64

onMounted(async () => {
  try {
    const response = await fetch('/data/guests.json'); // 确认 JSON 文件路径
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // 校验数据结构是包含 expert_committee 或 speakers 数组的对象
    if (typeof data === 'object' && data !== null && (Array.isArray(data.expert_committee) || Array.isArray(data.speakers))) {
       guestData.value = data;
    } else {
      console.warn("Fetched guest data is not in expected format:", data);
      guestData.value = { expert_committee: [], speakers: [] }; // 赋空数组以避免渲染错误
      throw new Error("嘉宾数据格式不正确");
    }
  } catch (e) {
    console.error("无法加载嘉宾数据:", e);
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- 复用和调整全局样式 --- */
.guide-page {
  padding: 30px;
  background-color: #f9fafb;
}
.page-content-container {
  max-width: 1200px; /* 嘉宾页可以宽一点 */
  margin: 0 auto;
  padding: 30px 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.page-header {
    margin-bottom: 35px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f2f5;
}
.page-header h1 { font-size: 26px; font-weight: 600; color: #1f2d3d; margin: 0 0 8px 0; }
.page-header p { font-size: 15px; color: #8492a6; margin: 0; }
.loading-state { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 80px 0; color: #909399; font-size: 16px; }
.loading-state .el-icon { margin-bottom: 10px; }
.full-width-alert { margin-bottom: 20px; }

/* --- 嘉宾页面特定样式 --- */
.sections-container { display: flex; flex-direction: column; gap: 0; }
.content-section { padding-top: 10px; }
.section-title {
    display: flex;
    align-items: center;
    margin-bottom: 30px; /* 标题和网格间距加大 */
    color: #1f2d3d;
}
.section-title .el-icon {
    font-size: 24px;
    margin-right: 12px;
    color: var(--el-color-primary);
}
.section-title h2 { font-size: 20px; font-weight: 600; margin: 0; }
.section-divider {
    margin: 45px 0 40px 0 !important; /* 分隔线上下间距调整 */
    border-color: #f0f2f5 !important;
}
.section-divider:last-of-type { display: none; }

/* 嘉宾网格 */
.guest-grid {
    /* el-row 和 gutter 负责间距 */
}
.guest-col {
    margin-bottom: 20px; /* 卡片垂直间距 */
}

/* 嘉宾卡片 */
.guest-card {
    border-radius: 8px;
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
    height: 100%; /* 使卡片高度一致 */
    display: flex;
    flex-direction: column;
    border: 1px solid #f0f2f5; /* 更轻的边框 */
    overflow: hidden; /* 确保图片圆角生效 */
}
.guest-card:hover {
   transform: translateY(-4px);
   box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

/* 嘉宾头像 */
.guest-avatar {
    width: 100%;
    /* aspect-ratio: 1 / 1; */ /* 强制1:1比例, 如果需要的话 */
    height: 180px; /* 固定高度，或者使用 aspect-ratio */
    display: block;
    background-color: #f5f7fa; /* 头像加载时背景 */
}
.avatar-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #c0c4cc; /* 占位符颜色 */
}
.avatar-slot.loading::after{ content: ''; /* 可以是加载动画或文字 */ }
.avatar-slot.error .el-icon {
  font-size: 40px; /* 错误图标大小 */
}

/* 嘉宾信息 */
.guest-info {
    padding: 15px;
    text-align: center;
    flex-grow: 1; /* 使信息区域填满剩余空间 */
    display: flex;
    flex-direction: column;
}
.guest-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 6px 0;
    line-height: 1.3;
      /* 限制名字显示一行 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.guest-description {
    font-size: 13px;
    color: #8492a6; /* 描述文字颜色 */
    line-height: 1.5;
    margin: 0 0 10px 0;
    flex-grow: 1; /* 使描述优先填充空间 */
    /* 限制描述行数 */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3; /* 最多显示 2 行 */
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: calc(1.5em * 2); /* 保证至少两行的高度 */

}

/* 参与议程样式 */
.guest-participation {
    margin-top: auto; /* 将标签推到底部 */
    padding-top: 10px;
    border-top: 1px solid #f0f2f5; /* 信息和标签之间的细线 */
}
.guest-participation .el-tag {
    cursor: pointer;
}
.guest-participation .el-icon {
    vertical-align: middle;
    margin-right: 3px;
}

/* Popover 内部列表样式 */
.participation-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
}
.participation-list li {
    margin-bottom: 8px;
    line-height: 1.4;
}
.participation-list li:last-child {
    margin-bottom: 0;
}
.participation-list span {
    font-size: 12px;
    color: #909399;
    display: block;
}
.participation-list p {
    font-size: 13px;
    color: #606266;
    margin: 2px 0 0 0;
}


/* --- 响应式 --- */
@media (max-width: 992px) { /* lg 断点 */
    .page-content-container { max-width: 960px; }
}
@media (max-width: 768px) { /* md 断点 */
    .guide-page { padding: 20px 15px; }
    .page-content-container { padding: 20px 25px; }
    .page-header h1 { font-size: 22px; }
    .page-header p { font-size: 14px; }
    .section-title h2 { font-size: 18px; }
    .guest-avatar { height: 160px; } /* 调整头像高度 */
    .guest-info { padding: 12px; }
    .guest-name { font-size: 15px; }
    .guest-description { font-size: 12px; }
}
@media (max-width: 576px) { /* sm 断点 */
     .guest-avatar { height: 140px; }
}
</style>
