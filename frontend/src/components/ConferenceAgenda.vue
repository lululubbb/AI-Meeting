<template>
  <div class="guide-page elegant-theme agenda-background"> <!-- พื้นหลังสีอ่อน -->
    <div class="page-content-container agenda-page">

      <!-- Page Header -->
      <div class="page-header">
        <h1>大会议程</h1>
        <p>把握大会脉搏，不错过任何精彩瞬间</p>
      </div>

      <!-- Loading / Error / Empty States -->
      <div v-if="isLoading" class="loading-state">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <span>加载议程信息中...</span>
      </div>
      <el-alert v-else-if="error" :title="'加载议程信息失败: ' + error" type="error" show-icon :closable="false" class="full-width-alert"/>
      <el-empty v-else-if="!agendaData || agendaData.length === 0" description="大会议程暂未公布" />

      <!-- Agenda Tabs -->
      <div v-else class="agenda-container">
        <el-tabs v-model="activeDate" class="agenda-tabs">
          <el-tab-pane
            v-for="(day, dayIndex) in agendaData"
            :key="`day-${dayIndex}`"
            :label="day.date"
            :name="day.date"
          >
            <!-- Sessions for the selected day -->
            <div v-if="day.sessions && day.sessions.length > 0" class="sessions-list">
              <el-collapse v-model="activeSessionNames" class="session-collapse">
                <el-collapse-item
                  v-for="(session, sessionIndex) in day.sessions"
                  :key="`session-${dayIndex}-${sessionIndex}`"
                  :name="`session-${dayIndex}-${sessionIndex}`"
                  class="agenda-session"
                >
                  <!-- Custom Title Slot for Session Header -->
                  <template #title>
                    <div class="session-header">
                      <div class="session-time-forum">
                        <span class="session-time">
                          <el-icon><Clock /></el-icon> {{ session.time_or_status }}
                        </span>
                        <el-tag v-if="session.forum" type="primary" size="small" effect="light" class="session-tag">
                          {{ session.forum }}
                        </el-tag>
                      </div>
                      <h3 class="session-title">{{ session.title }}</h3>
                      <div v-if="session.location" class="session-location">
                        <el-icon><Location /></el-icon> {{ session.location }}
                      </div>
                    </div>
                  </template>

                  <!-- Session Content (Details) -->
                  <div v-if="session.content && session.content.length > 0" class="agenda-detail-list">
                    <div
                      v-for="(item, itemIndex) in session.content"
                      :key="`item-${dayIndex}-${sessionIndex}-${itemIndex}`"
                      class="agenda-detail-item"
                    >
                      <div class="detail-time">{{ item.time }}</div>
                      <div class="detail-main">
                        <p class="detail-title">{{ item.title }}</p>
                        <div v-if="item.names && item.names.length > 0" class="speaker-info">
                          <div v-for="(name, nameIndex) in item.names" :key="`speaker-${nameIndex}`" class="speaker-pair">
                            <span class="speaker-name">
                              <el-icon><User /></el-icon> {{ name }}
                            </span>
                            <span v-if="item.descriptions && item.descriptions[nameIndex]" class="speaker-desc">
                              ({{ item.descriptions[nameIndex] }})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <el-empty v-else description="暂无详细议程安排" :image-size="60" style="padding: 20px 0;" />
                </el-collapse-item>
              </el-collapse>
            </div>
            <el-empty v-else description="今日暂无议程安排" />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Note: No Dialog needed here as details are shown via collapse -->

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElTabs, ElTabPane, ElCollapse, ElCollapseItem, ElTag, ElIcon, ElAlert, ElEmpty } from 'element-plus';
import { Loading, Clock, Location, User } from '@element-plus/icons-vue'; // Removed Picture, added Location, User

const agendaData = ref([]);
const isLoading = ref(true);
const error = ref(null);
const activeDate = ref(''); // To store the currently selected date tab
const activeSessionNames = ref([]); // To store the names of expanded collapse items

// No need for display computed property if we show all data

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch('/data/agenda.json'); // <<<---- IMPORTANT: Update this path
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
        agendaData.value = data;
        activeDate.value = data[0].date; // Default active tab to the first day
        // Optionally auto-expand the first session of the first day
        // if (data[0].sessions?.length > 0) {
        //   activeSessionNames.value = ['session-0-0'];
        // }
    } else {
        console.warn("Fetched agenda data is not a valid non-empty array:", data);
        agendaData.value = [];
        // Handle case where data might be empty array correctly
        if (Array.isArray(data) && data.length === 0) {
          // It's valid but empty, no error needed, UI will show empty state
        } else {
          throw new Error("议程数据格式不正确");
        }
    }
  } catch (e) {
    console.error("无法加载议程数据:", e);
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* --- Base & Page Styles --- */
.agenda-background { background-color: #f8f9fc; }
.guide-page { padding: 25px 15px; min-height: 100vh; }
.page-content-container {
  max-width: 980px; /* Adjusted width for agenda clarity */
  margin: 0 auto;
  padding: 30px 35px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
}
.agenda-page { padding-bottom: 50px; }

.page-header {
  margin-bottom: 35px; /* Reduced margin */
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f2f5;
  text-align: center;
}
.page-header h1 { font-size: 26px; font-weight: 600; color: #2c3e50; margin: 0 0 8px 0; }
.page-header p { font-size: 15px; color: #7f8c8d; margin: 0; }

.loading-state, .el-empty { padding: 70px 0; }
.loading-state .el-icon { margin-bottom: 12px; color: var(--el-color-primary); }
.loading-state span { font-size: 14px; color: #666; }
.full-width-alert { margin-bottom: 25px; }
:deep(.el-empty__description p) { color: #999; }

/* --- Agenda Tabs & Container --- */
.agenda-container { margin-top: 20px; }

.agenda-tabs {
  /* Add specific styling for tabs if needed */
}

/* Style the tab headers */
:deep(.el-tabs__header) {
  margin-bottom: 25px; /* Space below tabs */
}
:deep(.el-tabs__nav-wrap::after) {
  background-color: #e4e7ed; /* Lighter bottom line for tabs */
}
:deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: #606266;
  padding: 0 25px; /* More spacing */
  height: 45px; /* Taller tabs */
}
:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}
:deep(.el-tabs__active-bar) {
  background-color: var(--el-color-primary);
  height: 3px; /* Thicker active bar */
}

/* --- Sessions List & Collapse --- */
.sessions-list {
  /* Container for the collapse items */
}

.session-collapse {
  border-top: none; /* Remove default top border */
  border-bottom: none; /* Remove default bottom border */
}

/* Styling for each session (collapse item) */
.agenda-session {
  margin-bottom: 18px; /* Space between sessions */
  border-radius: 8px;
  overflow: hidden; /* Ensure content stays within rounded corners */
  border: 1px solid #eef1f6; /* Softer border */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: #fff; /* Ensure white background */
}

/* Remove default borders from collapse item headers and content */
:deep(.el-collapse-item__header) {
  border-bottom: none; /* Remove line below header when collapsed */
  background-color: #fcfdfe; /* Very light header background */
  padding: 15px 20px; /* Adjust padding */
  height: auto; /* Allow height to adjust to content */
  line-height: normal; /* Reset line-height */
  border-radius: 8px 8px 0 0; /* Round top corners */
  transition: background-color 0.2s;
}
:deep(.el-collapse-item__header.is-active) {
  border-bottom: 1px solid #eef1f6; /* Add line when active */
  border-radius: 8px 8px 0 0; /* Ensure top corners are rounded when active */
}

:deep(.el-collapse-item__wrap) {
  border-bottom: none; /* Remove default border below content */
  background-color: #fff; /* Ensure content area is white */
   border-radius: 0 0 8px 8px; /* Round bottom corners */
}
:deep(.el-collapse-item__content) {
  padding: 0; /* Remove default padding, handled by inner list */
}

/* Custom Session Header Content */
.session-header {
  display: flex;
  align-items: flex-start; /* Align items to the top */
  gap: 15px;
  width: 100%;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
}

.session-time-forum {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0; /* Prevent shrinking */
  margin-bottom: 5px; /* Space below if title wraps */
}
.session-time {
  font-size: 14px;
  color: #555;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}
.session-time .el-icon {
  margin-right: 6px;
  color: #888;
}
.session-tag {
  font-weight: 500;
  border-radius: 4px;
}

.session-title {
  font-size: 17px; /* Prominent title */
  font-weight: 600;
  color: #333;
  margin: 0; /* Reset default margin */
  line-height: 1.4;
  flex-grow: 1; /* Take remaining space */
  /* margin-right: 15px; Give space before location */
}

.session-location {
  font-size: 13px;
  color: #777;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0; /* Prevent shrinking */
  margin-left: auto; /* Push to the right if space allows */
  padding-left: 15px; /* Ensure space from title */
}
.session-location .el-icon {
  margin-right: 5px;
  color: #aaa;
}

/* --- Agenda Detail List (Inside Collapse) --- */
.agenda-detail-list {
  padding: 15px 20px 10px 20px; /* Inner padding */
}

.agenda-detail-item {
  display: flex;
  gap: 20px; /* Space between time and main content */
  padding: 15px 0; /* Vertical spacing */
  border-bottom: 1px dashed #f0f2f5; /* Subtle separator */
}
.agenda-detail-item:last-child {
  border-bottom: none; /* No line for the last item */
  padding-bottom: 5px; /* Reduce bottom padding for last item */
}

.detail-time {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-color-primary);
  flex-shrink: 0;
  width: 100px; /* Fixed width for time alignment */
  text-align: right;
  padding-top: 2px; /* Align slightly better with title */
}

.detail-main {
  flex-grow: 1;
}

.detail-title {
  font-size: 15px;
  color: #444;
  font-weight: 500;
  margin: 0 0 8px 0; /* Space below title */
  line-height: 1.5;
}

.speaker-info {
  margin-top: 5px;
}

.speaker-pair {
  display: flex; /* Keep name and desc on one line if possible */
  align-items: center;
  flex-wrap: wrap; /* Allow wrapping if needed */
  margin-bottom: 5px;
}
.speaker-pair:last-child {
  margin-bottom: 0;
}

.speaker-name {
  font-size: 14px;
  color: #555;
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
}
.speaker-name .el-icon {
  margin-right: 5px;
  color: #aaa;
}

.speaker-desc {
  font-size: 13px;
  color: #888;
}

/* --- Responsive Adjustments --- */
@media (max-width: 768px) {
  .page-content-container { padding: 25px 20px; }
  .guide-page { padding: 20px 10px; }
  :deep(.el-tabs__item) { font-size: 14px; padding: 0 18px; height: 42px; }
  :deep(.el-collapse-item__header) { padding: 12px 15px; }
  .session-header { gap: 10px; }
  .session-title { font-size: 16px; }
  .session-time, .session-location { font-size: 13px; }
  .agenda-detail-list { padding: 10px 15px 5px 15px; }
  .agenda-detail-item { gap: 15px; padding: 12px 0; }
  .detail-time { width: 90px; font-size: 13px; }
  .detail-title { font-size: 14px; }
  .speaker-name { font-size: 13px; }
  .speaker-desc { font-size: 12px; }
}

@media (max-width: 480px) {
  .page-header h1 { font-size: 22px; }
  .page-header p { font-size: 14px; }
  :deep(.el-tabs__item) { padding: 0 12px; font-size: 13px; } /* Smaller tabs */
  .session-header { flex-direction: column; align-items: flex-start; } /* Stack header items */
  .session-time-forum { margin-bottom: 8px; }
  .session-location { margin-left: 0; padding-left: 0; margin-top: 5px; }
  .agenda-detail-item { flex-direction: column; gap: 8px; align-items: flex-start; } /* Stack time and main */
  .detail-time { width: auto; text-align: left; color: #888; }
}

</style>
