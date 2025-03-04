<!-- src/views/Meetings.vue -->
<!-- src/views/Chat.vue -->
<template>
  <div class="home-container">
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

    <footer>
        <p>&copy; 慧议先锋.</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';  // 如果你使用 vuex 来管理状态
import MeetingOption from '../components/MeetingOption.vue'; 
import CustomButton from '../components/CustomButton.vue';
import CalendarTodoList from '../components/CalendarToDoList.vue'; 
import Mood from '../components/Mood.vue';
import HistoryMeeting from '../views/HistoryMeeting.vue'
import RecentActivity from '../components/RecentActivityCard.vue';

// 获取路由实例
const router = useRouter();

// 获取 Vuex store 实例
const store = useStore();
  
  
</script>
  
<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width:100%;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  overflow: hidden; 
  margin:10px
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
  height: 30px;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
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
  