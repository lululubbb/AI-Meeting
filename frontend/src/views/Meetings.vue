<!-- src/views/Meetings.vue -->
<!-- src/views/Chat.vue -->
<template>
  <div class="home-container" v-if="!isMobile">
 <!-- 主体布局 -->
 <main class="main-layout">
      <!-- 左侧区域 -->
      <div class="left-section">
        <!-- <Mood/> -->
        <CalendarTodoList />
      </div>

      <!-- 中间部分 -->
      <div class="middle-section">
        <HistoryMeeting/>
    
      </div>

      <!-- 右侧部分 -->
      <div class="right-section">
        <RecentActivity />
      </div>
    </main>

    <footer v-if="!isMobile">
        <p>&copy; 智汇西湖.</p>
    </footer>
  </div>
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
            :max-recommendations="5"
            style="margin-top: 15px;" 
        />
        <el-alert v-if="agendaError" :title="'议程加载失败: ' + agendaError" type="warning" show-icon :closable="false" style="margin-top: 15px;"/>
      </main>
      </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';  // 如果你使用 vuex 来管理状态
import MeetingOption from '../components/MeetingOption.vue'; 
import CustomButton from '../components/CustomButton.vue';
import CalendarTodoList from '../components/CalendarToDoList.vue'; 
import Mood from '../components/Mood.vue';
import HistoryMeeting from '../views/HistoryMeeting.vue'
import RecentActivity from '../components/RecentActivityCard.vue';
import MeetingRecommendation from '../components/MeetingRecommendation.vue';
import UserProfileCard from '../components/UserProfileCard.vue';  // 引入用户信息卡片组件

// 获取路由实例
const router = useRouter();

// 获取 Vuex store 实例
const store = useStore();
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
const isMobile = ref(false);

const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768; 
  if (isMobile.value && router.currentRoute.value.name !== 'Home') {
    router.push({ name: 'Home' });
  }
};

onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
})
</script>
  
<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width:100%;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  overflow: hidden; 
  margin:10px;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: wrap;
  /* overflow: auto;  */
}

/* 左侧部分 */
.left-section {
  flex:0.8;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 10px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  overflow: auto; 
}

/* 中间部分 */
.middle-section {
  flex: 1.3;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 10px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  overflow: auto; 
}

/* 右侧部分 */
.right-section {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 10px;
  overflow: auto; 
}

footer {
  height: 25px;
  background-color: var(--background-color); /* 使用全局背景颜色 */
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
  color: #434040;
  transform: translateY(-5px); /* 点击时上移 */
}

.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-bottom: 60px;
  width: 100%;
  background-color: var(--background-color);
  overflow: hidden;
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
     width: 24px; /* 根据需要调整图标大小 */
     height: 24px;
     margin-bottom: 5px; /* 图标与文字之间的间距 */
}

.mobile-footer button span {
    font-size: 12px; /* 根据需要调整文字大小 */
}

/* 公共移动端样式 */
@media screen and (max-width: 768px) {
  .main-layout {
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 15px;
    padding: 10px 15px;
  }

  .left-section,
  .middle-section,
  .right-section {
    flex: 0 0 85vw !important;
    min-width: 85vw !important;
    height: calc(100vh - 150px);
    scroll-snap-align: start;
    border-radius: 12px;
    box-shadow: var(--global-box-shadow);
    padding: 15px;
  }

  .right-section img {
    width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: contain;
  }
}

@media screen and (max-width: 480px) {
  .main-layout {
    padding: 10px;
  }

  .left-section,
  .middle-section,
  .right-section {
    flex: 0 0 90vw !important;
    min-width: 90vw !important;
    height: calc(100vh - 130px);
    padding: 10px;
  }
}
@media screen and (min-width: 769px) {
  .main-layout {
    flex-wrap: wrap;
    overflow: hidden !important;
  }
  
  .left-section { flex: 0.8 }
  .middle-section { flex: 1.3 }
  .right-section { flex: 0.8 }
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
}
</style>
  