<template>
  <div class="guide-page elegant-theme"> <!-- 复用 guide-page 的基础样式 -->
    <div class="page-content-container"> <!-- 复用容器样式 -->

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>参会嘉宾</h1>
        <p>了解本次大会的重要嘉宾与演讲者</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-bar-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索嘉宾姓名或简介..."
          :prefix-icon="Search"
          clearable
          size="large"
        />
      </div>

      <!-- 加载和错误状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <span>加载嘉宾信息中...</span>
      </div>
      <el-alert v-else-if="error" :title="'加载嘉宾信息失败: ' + error" type="error" show-icon :closable="false" class="full-width-alert"/>
      <!-- 更新空状态逻辑：当非加载、无错误，且两个过滤后列表都为空时显示 -->
      <el-empty v-else-if="(!filteredExpertCommittee || !filteredExpertCommittee.length) && (!filteredSpeakers || !filteredSpeakers.length)"
                :description="searchQuery ? '没有找到匹配的嘉宾信息' : '嘉宾信息暂未公布'" />

      <!-- 主要内容区域 -->
      <div v-else class="sections-container">

        <!-- Section: 专家委员会 - 使用 filteredExpertCommittee -->
        <section v-if="filteredExpertCommittee && filteredExpertCommittee.length > 0" class="content-section">
          <div class="section-title">
            <el-icon><Reading /></el-icon>
            <h2>专家委员会</h2>
          </div>
          <!-- 嘉宾卡片网格 -->
          <el-row :gutter="20" class="guest-grid">
            <el-col
              :xs="12" :sm="8" :md="6" :lg="4"
              v-for="(expert) in filteredExpertCommittee" :key="`expert-${expert.name || expert.id || index}`" 
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

        <!-- 分隔线 - 当两个过滤后列表都有内容时显示 -->
        <el-divider v-if="filteredExpertCommittee?.length > 0 && filteredSpeakers?.length > 0" class="section-divider"/>

        <!-- Section: 演讲嘉宾 - 使用 filteredSpeakers -->
        <section v-if="filteredSpeakers && filteredSpeakers.length > 0" class="content-section">
          <div class="section-title">
            <el-icon><Microphone /></el-icon>
            <h2>演讲嘉宾</h2>
          </div>
           <!-- 嘉宾卡片网格 -->
          <el-row :gutter="20" class="guest-grid">
            <el-col
              :xs="12" :sm="8" :md="6" :lg="4"
              v-for="(speaker) in filteredSpeakers" :key="`speaker-${speaker.name || speaker.id || index}`"   
              class="guest-col"
            >
              <el-card shadow="hover" class="guest-card" body-style="padding:0;">
                <el-image :src="speaker.image || defaultAvatar" fit="cover" class="guest-avatar" lazy>
                   <template #placeholder><div class="avatar-slot loading"></div></template>
                   <template #error><div class="avatar-slot error"><el-icon><User /></el-icon></div></template>
                </el-image>
                <div class="guest-info">
                   <h3 class="guest-name">{{ speaker.name || '嘉宾姓名' }}</h3>
                   <p v-if="speaker.blurb || speaker.description" class="guest-description">
                       {{ speaker.blurb || speaker.description }}
                   </p>
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
// 引入 computed 和 Search 图标
import { ref, onMounted, computed } from 'vue';
// 引入 ElInput
import { ElCard, ElRow, ElCol, ElImage, ElIcon, ElAlert, ElEmpty, ElDivider, ElTag, ElPopover, ElInput } from 'element-plus';
// 引入 Search 图标
import { Loading, Reading, Microphone, User, Calendar, Search } from '@element-plus/icons-vue';

const guestData = ref({ expert_committee: [], speakers: [] }); // 初始化为空数组结构
const isLoading = ref(true);
const error = ref(null);

// --- 新增搜索状态 ---
const searchQuery = ref('');

// 默认头像，如果 JSON 中缺少图片
const defaultAvatar = ref('/path/to/your/default-avatar.png'); // <<<--- 务必替换为你的默认头像图片真实 URL 或 Base64

onMounted(async () => {
  isLoading.value = true; // 开始加载前设置为 true
  error.value = null;
  try {
    const response = await fetch('/data/guests.json'); // 确认 JSON 文件路径
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // 校验数据结构是包含 expert_committee 或 speakers 数组的对象
    if (typeof data === 'object' && data !== null ) {
       // 确保即使字段不存在，也是空数组，防止后续 computed 出错
       guestData.value = {
           expert_committee: Array.isArray(data.expert_committee) ? data.expert_committee : [],
           speakers: Array.isArray(data.speakers) ? data.speakers : []
       };
    } else {
      console.warn("Fetched guest data is not in expected format or is null:", data);
      guestData.value = { expert_committee: [], speakers: [] }; // 保持空数组结构
      // 可以选择是否抛出错误，取决于业务逻辑是否允许数据格式不完全符合预期
      // throw new Error("嘉宾数据格式不正确");
    }
  } catch (e) {
    console.error("无法加载嘉宾数据:", e);
    error.value = e.message;
    guestData.value = { expert_committee: [], speakers: [] }; // 出错时也保证空数组结构
  } finally {
    isLoading.value = false;
  }
});

// --- 计算属性过滤嘉宾列表 ---
const filteredExpertCommittee = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) {
    return guestData.value.expert_committee; // 无搜索词则返回原始列表
  }
  if (!guestData.value.expert_committee) return []; // 如果原始数据就没这个字段，返回空

  return guestData.value.expert_committee.filter(expert => {
    const nameMatch = expert.name?.toLowerCase().includes(query);
    const descMatch = expert.description?.toLowerCase().includes(query);
    return nameMatch || descMatch;
  });
});

const filteredSpeakers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) {
    return guestData.value.speakers; // 无搜索词则返回原始列表
  }
   if (!guestData.value.speakers) return []; // 如果原始数据就没这个字段，返回空

  return guestData.value.speakers.filter(speaker => {
    const nameMatch = speaker.name?.toLowerCase().includes(query);
    const descMatch = speaker.description?.toLowerCase().includes(query);
    const blurbMatch = speaker.blurb?.toLowerCase().includes(query); // 也检查 blurb
    // 可以根据需要添加更多搜索字段，例如参与的议程标题
    // const participationMatch = speaker.participation?.some(p => p.title?.toLowerCase().includes(query));
    return nameMatch || descMatch || blurbMatch /* || participationMatch */;
  });
});


</script>

<style scoped>
/* --- 复用和调整全局样式 --- */
.guide-page {
  padding: 20px;
  background-color: #f9fafb;
  min-height: 100vh;
}
.page-content-container {
  max-width: 1350px;
  margin: 0 auto;
  padding: 20px 30px; /* 增加底部 padding */
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
h1{
  background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;
}
.page-header { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f2f5; text-align: center; } /* 调整间距 */
.page-header h1 { font-size: 26px; font-weight: 600; color: #1f2d3d; margin: 0 0 8px 0; }
.page-header p { font-size: 15px; color: #8492a6; margin: 0; }

/* --- 搜索框样式 --- */
.search-bar-container {
  margin-bottom: 35px; /* 搜索框和下方内容的间距 */
}
:deep(.search-bar-container .el-input__prefix .el-icon) {
  color: #a8abb2;
}


.loading-state { display: flex; justify-content: center; align-items: center; padding: 60px 0; color: #909399; font-size: 16px; }
.loading-state .el-icon { margin-right: 8px; color: #669bff; }
.full-width-alert { margin-bottom: 20px; }

/* --- 嘉宾页面特定样式 --- */
.sections-container { display: flex; flex-direction: column; gap: 0; }
.content-section { padding-top: 10px; }
.section-title { display: flex; align-items: center; margin-bottom: 30px; color: #1f2d3d; }
.section-title .el-icon { font-size: 24px; margin-right: 12px; color: var(--el-color-primary); }
.section-title h2 { font-size: 20px; font-weight: 600; margin: 0; }
.section-divider { margin: 45px 0 40px 0 !important; border-top: 1px solid #ebeef5 !important; } /* 使用更标准的 border-top */
/* .section-divider:last-of-type { display: none; } */ /* 这句可能不需要，因为 v-if 会处理 */

.guest-grid { }
.guest-col { margin-bottom: 20px; }

.guest-card { border-radius: 8px; transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; height: 100%; display: flex; flex-direction: column; border: 1px solid #f0f2f5; overflow: hidden; }
.guest-card:hover { transform: translateY(-4px); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08); }

.guest-avatar { width: 100%; height: 200px; display: block; background-color: #f5f7fa; }
.avatar-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #c0c4cc; }
.avatar-slot.error .el-icon { font-size: 40px; }

.guest-info { padding: 15px; text-align: center; flex-grow: 1; display: flex; flex-direction: column; } /* 增加 padding */
.guest-name { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 8px 0; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.guest-description {
    font-size: 13px; /* 稍微缩小字体 */
    color: #8492a6;
    line-height: 1.5;
    margin: 0 ;
    flex-grow: 1;
    /* Webkit 兼容的多行省略 */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3; /* 调整为最多 3 行 */
    overflow: hidden;
    text-overflow: ellipsis;
    /* 保证至少一点高度，防止空描述时塌陷 */
    min-height: calc(1.5em * 1);
    /* 为了更好的跨浏览器兼容性（虽然不完美），可以添加 max-height */
    max-height: calc(1.5em * 3); /* 限制最大高度为3行 */
}

.guest-participation { margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f2f5; } /* 增加上下 padding */
.guest-participation .el-tag { cursor: pointer; }
.guest-participation .el-icon { vertical-align: middle; margin-right: 3px; }

.participation-list { list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto; }
.participation-list li { margin-bottom: 8px; line-height: 1.4; }
.participation-list li:last-child { margin-bottom: 0; }
.participation-list span { font-size: 12px; color: #909399; display: block; }
.participation-list p { font-size: 13px; color: #606266; margin: 2px 0 0 0; }


/* --- 响应式 --- */
@media (max-width: 992px) { .page-content-container { max-width: 960px; } }
@media (max-width: 768px) {
    .guide-page { padding: 20px 15px; }
    .page-content-container { padding: 20px 25px 30px 25px; }
    .page-header h1 { font-size: 22px; }
    .page-header p { font-size: 14px; }
    /* 调整搜索框下方间距 */
    .search-bar-container { margin-bottom: 30px; }
    .section-title h2 { font-size: 18px; }
    .guest-avatar { height: 160px; }
    .guest-info { padding: 12px; }
    .guest-name { font-size: 15px; }
    .guest-description { font-size: 12px; -webkit-line-clamp: 2; max-height: calc(1.5em * 2); min-height: calc(1.5em * 1);} /* 中屏幕减少行数 */
}
@media (max-width: 576px) {
     .guest-avatar { height: 140px; }
     /* 调整搜索框下方间距 */
    .search-bar-container { margin-bottom: 25px; }
}

</style>