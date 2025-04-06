<template>
  <div class="home-container">
    <!-- 主体布局 -->
    <main class="main-layout" v-if="!isMobile">
      <!-- 左侧区域 -->
      <div class="left-section">
        <!-- <Mood /> -->
        <div class="options">
          <MeetingOption 
            @new-meeting="navigateToCreateMeeting" 
            @join-meeting="navigateToJoinMeeting" 
            @schedule-meeting="navigateToScheduleMeeting"
            @history-meeting="navigateToHistoryMeeting" 
          />
          <MeetingRecommendation
            :history-meetings="historyMeetings"
            :upcoming-agenda="upcomingAgendaItems"
            :is-loading="isLoadingAgenda"
            :max-recommendations="3"
            style="margin-top: 15px;" 
            @view-detail="handleViewDetail"
         />
        </div>
        
      </div>

      <!-- 中间部分 -->
      <div class="middle-section">
        <!-- 中间区域的组件 -->
        <CalendarTodoList />
            <!-- PII 测试工具 -->
             <!-- <PiiTestTool style="margin-bottom: 20px;"/> -->

        <!-- 新增：内容安全检查工具 -->
        <!-- <ContentSafetyTestTool style="margin-bottom: 20px;"/> -->
      </div>

      <!-- 右侧部分 -->
      <div class="right-section">
        <DataSummary/> 
        <RecentActivity />
      </div>
    </main>

    <!-- 移动端布局 -->
    <div class="mobile-layout" v-else>
      <header class="mobile-header">
        <button class="icon-button" @click="showUserProfile">
          <i class="fa-solid fa-user"></i>
        </button>
        <!-- 显示用户信息卡片 -->
        <UserProfileCard v-if="isUserCardVisible" @close="toggleUserCardVisibility" />
      </header>

      <!-- 移动端主体 -->
        <main class="mobile-main-content">

          <div class="options">
          <MeetingOption 
            @new-meeting="navigateToCreateMeeting" 
            @join-meeting="navigateToJoinMeeting" 
            @schedule-meeting="navigateToScheduleMeeting"
            @history-meeting="navigateToHistoryMeeting" 
          />
        </div>
        <MeetingRecommendation
            :history-meetings="historyMeetings"
            :upcoming-agenda="upcomingAgendaItems"
            :is-loading="isLoadingAgenda"
            :max-recommendations="3"
            style="margin-top: 15px;" 
            @view-detail="handleViewDetail"
        />
        <el-alert v-if="agendaError" :title="'议程加载失败: ' + agendaError" type="warning" show-icon :closable="false" style="margin-top: 15px;"/>
      </main>

      <!-- <footer class="mobile-footer">
            <button @click="navigateToHome">
              <i class="fa-solid fa-house"></i>
                <span>主页</span>
            </button>
            <button @click="navigateToAIFloatingChat">
              <i class="fa-solid fa-robot"></i>
                <span>AI功能</span>
            </button>
            <button @click="navigateToDataSummary" >
              <i class="fa-solid fa-database"></i>
                <span>会议数据</span>
            </button>
            <button @click="navigateToTools">
              <i class="fa-solid fa-toolbox"></i>
                <span>工具栏</span>
            </button>
      </footer> -->
      
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedAgendaItemForDetail?.title || '日程详情'"
      :width="isMobile ? '90%' : '60%'"
      append-to-body
      custom-class="agenda-detail-dialog"
      draggable
    >
      <div v-if="selectedAgendaItemForDetail" class="detail-content">
          <div class="detail-section">
              <p v-if="selectedAgendaItemForDetail.fullDateTime">
                  <strong><el-icon><Calendar /></el-icon> 日期:</strong> {{ formatDetailDate(selectedAgendaItemForDetail.fullDateTime) }}
              </p>
              <p v-if="selectedAgendaItemForDetail.time">
                  <strong><el-icon><Clock /></el-icon> 时间:</strong> {{ formatDetailTime(selectedAgendaItemForDetail.time) }}
              </p>
              <p v-if="selectedAgendaItemForDetail.location">
                  <strong><el-icon><Location /></el-icon> 地点:</strong> {{ selectedAgendaItemForDetail.location }}
              </p>
               <p v-if="selectedAgendaItemForDetail.forum">
                  <strong><el-icon><CollectionTag /></el-icon> 所属论坛:</strong>
                  <el-tag type="info" size="small" effect="light" style="margin-left: 8px;">{{ selectedAgendaItemForDetail.forum }}</el-tag>
              </p>
          </div>

          <div v-if="selectedAgendaItemForDetail.names?.length > 0 || selectedAgendaItemForDetail.descriptions?.length > 0" class="detail-section detail-speakers">
              <h4>主讲人/内容详情:</h4>
               <div v-if="selectedAgendaItemForDetail.names && selectedAgendaItemForDetail.names.length > 0">
                  <div v-for="(name, index) in selectedAgendaItemForDetail.names" :key="`speaker-detail-${index}`" class="speaker-item">
                      <span class="speaker-name">
                        <el-icon><User /></el-icon> {{ name }}
                      </span>
                      <span v-if="selectedAgendaItemForDetail.descriptions && selectedAgendaItemForDetail.descriptions[index]" class="speaker-desc">
                        ({{ selectedAgendaItemForDetail.descriptions[index] }})
                      </span>
                  </div>
               </div>

               <p v-else-if="selectedAgendaItemForDetail.description || selectedAgendaItemForDetail.content" class="detail-description-text">
                    {{ selectedAgendaItemForDetail.description || selectedAgendaItemForDetail.content }}
                </p>

          </div>

          <div v-else-if="selectedAgendaItemForDetail.description || selectedAgendaItemForDetail.content" class="detail-section">
               <h4>详情:</h4>
               <p class="detail-description-text">{{ selectedAgendaItemForDetail.description || selectedAgendaItemForDetail.content }}</p>
           </div>

      </div>
       <div v-else>
           <p>无法加载详情。</p>
       </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false" type="primary">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <footer v-if="!isMobile">
      <p>&copy; 智汇西湖.</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';  // 如果你使用 vuex 来管理状态
import { ref, onMounted, computed } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { Calendar, Clock, Location, CollectionTag, User } from '@element-plus/icons-vue'
// 导入组件
import MeetingOption from '../components/MeetingOption.vue'; 
import CalendarTodoList from '../components/CalendarToDoList.vue'; 
import Mood from '../components/Mood.vue';
import RecentActivity from '../components/RecentActivityCard.vue';
import FileAttachmentContainer from '../components/FileAttachmentContainer.vue'; // 引入容器组件
import DataSummary from '../components/DataSummary.vue';
import UserProfileCard from '../components/UserProfileCard.vue';  // 引入用户信息卡片组件
import PiiTestTool from '../components/PiiTestTool.vue';
import Home from '../views/Home.vue';
import MeetingData from '../components/DataSummary.vue';
import Tools from '../components/Tools.vue';
import AIFloatingChat from '../components/AIFloatingChat.vue';
import MeetingRecommendation from '../components/MeetingRecommendation.vue';
import ContentSafetyTestTool from '../components/ContentSafetyTestTool.vue';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // Needed for "M月D日"
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // Also needed here if parseChineseDate uses dayjs()

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

const routes = [
  { path: '/', name: 'Home', component: Home },
  
  
  { path: '/tools', name: 'Tools', component: Tools },
];


// 获取路由实例
const router = useRouter();

// 获取 Vuex store 实例
const store = useStore();

const isMobile = ref(false);

const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768; 
  if (isMobile.value && router.currentRoute.value.name !== 'Home') {
    router.push({ name: 'Home' });
  }
};


// 控制用户信息卡片的显示与隐藏
const isUserCardVisible = ref(false);

// 显示用户信息卡片
const showUserProfile = () => {
  isUserCardVisible.value = true;
};
// 切换用户卡片的显示状态
const toggleUserCardVisibility = () => {
  isUserCardVisible.value = !isUserCardVisible.value;
  console.log('isUserCardVisible:', isUserCardVisible.value);
};

// 登出功能
const logout = async () => {
  await store.dispatch('signOutUser');
  router.push('/login');
};

// 导航到创建会议
const navigateToCreateMeeting = async() => {
  const meetingConfig = {
    mode: 'create', 
  };
      //  通过 Vuex 启动会议和设置会议配置信息
      store.commit('SET_MEETING_CONFIG', meetingConfig);
      store.commit('SET_VIDEOCALL_MAXIMIZED', true);
      store.commit('SET_VIDEOCALL_ACTIVE', true);

};

// 导航到加入会议
const navigateToJoinMeeting = () => {
   const meetingConfig = {
    mode: 'join',
  };
    //  通过 Vuex 启动会议和设置会议配置信息
   store.commit('SET_MEETING_CONFIG', meetingConfig);
   store.commit('SET_VIDEOCALL_MAXIMIZED', true);
  store.commit('SET_VIDEOCALL_ACTIVE', true);
};
//导航到安排会议
const navigateToScheduleMeeting = () => {
  router.push({ 
    name: 'ReserveMeeting'
  });
};
// 导航到历史会议
const navigateToHistoryMeeting = () => {
  router.push({ 
    name: 'HistoryMeeting'
  });
};

// 移动端导航
const navigateToHome = () => {
    router.push({ name: 'Home' }); 
};
const navigateToAIFloatingChat = () => {
     router.push({ name: 'AIFloatingChat' }); 
};
const navigateToDataSummary = () => {
    router.push({ name: 'DataSummary' });  
};
const navigateToTools = () => {
    router.push({ name: 'Tools' });      
};
const navigateToUserProfile = () => {
    router.push({name:'UserProfile'})
}

const rawAgendaData = ref(null); 
const upcomingAgendaItems = ref([]);
const isLoadingAgenda = ref(true); 
const agendaError = ref(null); 

const historyMeetings = computed(() => {
    const meetings = store.getters.getMeetings;
    console.log("Home.vue - Computed historyMeetings - Vuex getter returned:", meetings);
    if (Array.isArray(meetings) && meetings.length > 0) {
         console.log(`Home.vue - Computed historyMeetings - Length: ${meetings.length}`);
    } else {
         console.log("Home.vue - Computed historyMeetings - Returning empty or invalid data.");
    }
    return meetings || [];
});

const detailDialogVisible = ref(false);
const selectedAgendaItemForDetail = ref(null);

// --- Event Handler ---
const handleViewDetail = (agendaItem) => {
  selectedAgendaItemForDetail.value = agendaItem;
  detailDialogVisible.value = true;
};

// --- Formatting Helpers for Dialog ---
const formatDetailTime = (timeStr) => {
    if (!timeStr) return '时间待定';
    // Handle ranges like "08:30 - 09:00"
    const match = timeStr.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
    if (match) return `${match[1]} 至 ${match[2]}`;
    // Handle single time like "09:00"
    const singleTimeMatch = timeStr.match(/^(\d{2}:\d{2})$/);
    if (singleTimeMatch) return singleTimeMatch[1];
    // Fallback for potentially different formats or already formatted strings
    const time = dayjs(timeStr); // Try parsing directly
    return time.isValid() ? time.format('HH:mm') : timeStr; // Fallback to original if invalid
};

const formatDetailDate = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const time = dayjs(dateTimeStr); // Assumes fullDateTime is valid ISO
    return time.isValid() ? time.format('YYYY年MM月DD日') : '';
};




const parseChineseDate = (dateStr) => {
    const currentYear = dayjs().year();
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (match && match.length === 3) {
        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        return dayjs().year(currentYear).month(month - 1).date(day).startOf('day');
    }
    return null;
};

const flattenAgendaData = (rawData) => {
    const flattened = [];
    if (!Array.isArray(rawData)) return flattened;

    rawData.forEach(dateObj => {
        const baseDate = parseChineseDate(dateObj.date);
        if (!baseDate || !baseDate.isValid()) {
            console.warn(`Could not parse date: ${dateObj.date}`);
            return;
        }

        dateObj.sessions.forEach(session => {
            if (Array.isArray(session.content)) {
                 session.content.forEach((contentItem, index) => {
                     const timeMatch = contentItem.time?.match(/^(\d{2}:\d{2})/);
                     const startTimeStr = timeMatch ? timeMatch[1] : null;

                     let fullDateTime = null;
                     if (startTimeStr) {
                          const [hours, minutes] = startTimeStr.split(':').map(Number);
                          if (!isNaN(hours) && !isNaN(minutes)) {
                              fullDateTime = baseDate.hour(hours).minute(minutes).second(0);
                          }
                     }

                     if (!fullDateTime || !fullDateTime.isValid()) {
                         console.warn(`Could not parse time for item: ${contentItem.title} on ${dateObj.date}, using base date.`);
                         fullDateTime = baseDate;
                     }

                    const id = `${dateObj.date}-${session.title?.replace(/\s+/g, '-') || 'session'}-${index}`; // More robust ID

                    flattened.push({
                        id: id,
                        dateStr: dateObj.date,
                        sessionTitle: session.title,
                        forum: session.forum,
                        location: session.location,
                        title: contentItem.title,
                        time: contentItem.time, 
                        fullDateTime: fullDateTime ? fullDateTime.toISOString() : null, // Use ISO string
                        names: contentItem.names || [],
                        descriptions: contentItem.descriptions || [],
                        searchText: `${contentItem.title || ''} ${session.title || ''} ${contentItem.descriptions?.join(' ') || ''} ${contentItem.names?.join(' ') || ''} ${session.forum || ''} ${session.location || ''}` // Added more fields
                    });
                });
            }
        });
    });
    return flattened;
};


async function loadUpcomingAgenda() {
  console.log("Home.vue - Starting to load upcoming agenda...");
  isLoadingAgenda.value = true;
  agendaError.value = null;
  try {
    const response = await fetch('/data/agenda.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
    }
    const data = await response.json(); 

    rawAgendaData.value = data;

    console.log("Home.vue - BEFORE flattening. upcomingAgendaItems length:", upcomingAgendaItems.value.length);
    const processedItems = flattenAgendaData(data); 
    console.log(`Home.vue - Flattened data created. Length: ${processedItems.length}`);
    if (processedItems.length > 0) {
         console.log(`Home.vue - First flattened item PRE-ASSIGN:`, JSON.stringify(processedItems[0]));
    }

    upcomingAgendaItems.value = processedItems; 

    console.log("Home.vue - AFTER assigning to ref. upcomingAgendaItems.value length:", upcomingAgendaItems.value.length);
    if (upcomingAgendaItems.value.length > 0) {
        console.log(`Home.vue - First item IN REF:`, JSON.stringify(upcomingAgendaItems.value[0]));
    }
     console.log(`Home.vue - Successfully loaded raw data for ${rawAgendaData.value?.length || 0} days.`); // Use optional chaining
     console.log(`Home.vue - Processed into ${upcomingAgendaItems.value.length} upcoming agenda items.`);


  } catch (e) {
    console.error("Home.vue - 无法加载或处理议程数据:", e);
    agendaError.value = e.message || '未知错误';
    upcomingAgendaItems.value = [];
    rawAgendaData.value = null; // Reset raw data on error too
  } finally {
    isLoadingAgenda.value = false;
    console.log("Home.vue - Agenda loading finished. isLoading:", isLoadingAgenda.value);
  }
}

onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);

  loadUpcomingAgenda();

  if (!store.getters.getUser?.uid) {
      console.log("Home.vue mounted, user not logged in, watching for login...");
       const unwatch = store.watch(
        (state, getters) => getters.getUser,
        (newUser) => {
          if (newUser?.uid) {
            console.log("User logged in after Home mounted.");
            unwatch();
          }
        }
      );
  } else {
       console.log("Home.vue mounted, user logged in.");
  }

});




</script>

<style scoped>
/* 桌面端样式 */
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  overflow: hidden; 
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: nowrap;
  overflow: auto; 
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.options {
  margin: 100px auto;
  padding: 30px;
  width: 85%; 
  max-width: 400px; 
}

/* 左侧部分 */
.left-section {
  flex: 1 1 400px;
  /* background-color: #ffffff; */
  padding: 20px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  justify-content: center;
  align-items: center; 
  overflow: auto; 
}

/* 中间部分 */
.middle-section {
  flex:1 1 400px;
  /* background-color: #ffffff; */
  padding: 20px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  padding: 0;
  justify-content: center;
  overflow: auto; 
  scrollbar-width: thin;  /* 现代浏览器滚动条优化 */
  scrollbar-color: #eeeeef rgba(242, 242, 242, 0.1); /* 滚动条颜色 */

}

/* 右侧部分 */
.right-section {
  flex: 1 1 400px;
  display: flex;
  flex-direction: column;
  /* background-color: #ffffff; */
  padding:10px;
  overflow: auto; 
  scrollbar-width: thin;  /* 现代浏览器滚动条优化 */
  scrollbar-color: #eeeeef rgba(242, 242, 242, 0.1); /* 滚动条颜色 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}


footer {
  height: 30px;
  /* background-color: #f5f5f5; */
  background-color: var(--footer-background-color); /* 使用全局页脚背景颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.08);
}

/*----- 移动端样式 -----*/
.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
  font-size: 1.25rem; /* 20px */
  color: #000;
}

.icon-button:hover {
  background: linear-gradient(to right, #044DB4, #1492A0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transform: translateY(-5px);
}

.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background-color: var(--background-color);
  overflow: hidden;
  margin-bottom: 60px;
}

.mobile-header {
    display: flex;
    justify-content:flex-end; 
    align-items: center;
    background-color: var(--header-background-color);
    padding: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: relative;
}
.user-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
}

.mobile-buttons {
  display: flex;
  flex-wrap: wrap; /* 允许按钮换行 */
  justify-content: space-around;  /* 分散对齐 */
  width: 100%;
  margin-top: 10px;
  padding: 10px 0;
}

.mobile-buttons button {
  background-color: var(--button-background-color);
  color: var(--button-text-color);
  border: none;
  padding: 10px 15px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  flex: 1;   /* 使按钮平均分配空间 */
    max-width: 45%; /* 防止按钮过宽 */

}

.mobile-main-content{
  flex: 1;
  overflow: auto;
  padding:10px;
   display: flex;            /* 使用 Flexbox */
    flex-direction: column; /* 垂直排列子元素 */
}

.mobile-footer {
    display: flex;
    justify-content: space-around;
    background-color: var(--footer-background-color);
    padding: 10px 0;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}


.mobile-footer button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
}

.footer-icon {
     width: 24px;
     height: 24px;
     margin-bottom: 5px; /* 图标与文字之间的间距 */
}

.mobile-footer button span {
    font-size: 12px; 
}

.agenda-detail-dialog .detail-content {
    line-height: 1.7;
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 10px; 
}
.agenda-detail-dialog .detail-section {
    margin-bottom:10px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f0f0f0;
}
.agenda-detail-dialog .detail-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.agenda-detail-dialog h3 { /* Title inside dialog */
    font-size: 1.3rem;
    margin-bottom: 15px;
    color: #303133;
    font-weight: 600;
}
.agenda-detail-dialog h4 { /* Section titles */
    font-size: 1rem;
    margin-bottom: 10px;
    color: #555;
    font-weight: 500;
}
.agenda-detail-dialog p {
    margin-bottom: 8px;
    font-size: 1rem;
    color: #606266;
    display: flex; 
    align-items: center; 
}
.agenda-detail-dialog p .el-icon {
    margin-right: 15px;
    color: #909399;
    font-size: 1.1em; 
}
.agenda-detail-dialog strong {
    color: #303133;
}

.agenda-detail-dialog .detail-speakers .speaker-item {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
}
.agenda-detail-dialog .speaker-name {
    font-weight: 500;
    color: #404244;
    margin-right: 5px;
    display: inline-flex; 
    align-items: center;
}
.agenda-detail-dialog .speaker-name .el-icon {
    font-size: 1em; 
    margin-right: 15px;
}

.agenda-detail-dialog .speaker-desc {
    font-size: 0.85em;
    color: #888;
}
.agenda-detail-dialog .detail-description-text {
    font-size: 0.9rem;
    white-space: pre-line; 
    color: #555;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
:deep(.el-dialog) {
  margin: 0 !important;
  position: fixed !important; /* Position relative to the viewport */
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important; /* Center it */
}
/* 响应式调整 */
@media screen and (max-width: 768px) {
  .main-layout {
    display: none; /* 隐藏桌面端布局 */
  }
  /* 其他针对小屏幕的样式调整 */
    .desktop-header{
        display: none;
    }
  .options {
    margin: 20px auto;
    padding: 15px;
  }
  .agenda-detail-dialog .detail-content {
         max-height: 75vh; /* Slightly more height on mobile */
    }
     .agenda-detail-dialog h3 {
         font-size: 1.15rem;
     }
     .agenda-detail-dialog h4 {
         font-size: 1rem;
     }
      .agenda-detail-dialog p,
      .agenda-detail-dialog .detail-description-text {
         font-size: 0.85rem;
     }
       .agenda-detail-dialog .speaker-name {
         font-size: 0.9rem;
     }
     .agenda-detail-dialog .speaker-desc {
         font-size: 0.8rem;
     }
}

@media screen and (min-width: 769px) {
  .mobile-layout {
    display: none; /* 隐藏移动端布局 */
  }
}


@media screen and (max-width: 480px) {
    .mobile-buttons button{
        font-size: 14px;
        padding:8px 12px
    }
    .footer-icon{
        width: 20px;
        height: 20px;
    }
    .mobile-footer button span{
        font-size: 10px;
    }
    .options{
      padding:10px;
      margin: 10px auto;
      width: 90%;
    }
}


/* 防止移动端输入框缩放 */
@media screen and (max-width: 480px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}

/* 增加触控热区 */
@media (pointer: coarse) {
  .action {
    min-width: 44px;
    min-height: 44px;
  }
  .mobile-footer button,
  .mobile-buttons button
   {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
