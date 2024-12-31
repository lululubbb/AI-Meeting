<template>
  <div class="home-container">
    <!-- 主体布局 -->
    <main class="main-layout">
      <!-- 左侧区域 -->
      <div class="left-section">
        <Mood />
        <div class="options">
          <MeetingOption 
            @new-meeting="navigateToCreateMeeting" 
            @join-meeting="navigateToJoinMeeting" 
            @history-meeting="navigateToHistoryMeeting" 
          />
        </div>
      </div>

      <!-- 中间部分 -->
      <div class="middle-section">
        <!-- 中间区域的组件 -->
        <CalendarTodoList />
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

// 导入组件
import MeetingOption from '../components/MeetingOption.vue'; 
import CalendarTodoList from '../components/CalendarTodoList.vue'; 
import Mood from '../components/Mood.vue';
import RecentActivity from '../components/RecentActivityCard.vue';
import FileAttachmentContainer from '../components/FileAttachmentContainer.vue'; // 引入容器组件

// 获取路由实例
const router = useRouter();

// 获取 Vuex store 实例
const store = useStore();

// 导航到创建会议
const navigateToCreateMeeting = () => {
  router.push({ 
    name: 'VideoCall', 
    query: { mode: 'create' }
  });
};

// 导航到加入会议
const navigateToJoinMeeting = () => {
  router.push({ 
    name: 'VideoCall', 
    query: { mode: 'join' }
  });
};

// 导航到历史会议
const navigateToHistoryMeeting = () => {
  router.push({ 
    name: 'HistoryMeeting'
  });
};

</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #ffffff;
  overflow: hidden; 
}
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-wrap: nowrap;
  overflow: auto; 
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
  background-color: #ffffff;
  padding: 20px;
  box-shadow: inset -1px 0 0 #ddd;
  justify-content: center;
  align-items: center; 
  overflow: auto; 
}

/* 中间部分 */
.middle-section {
  flex:1 1 400px;
  background-color: #ffffff;
  padding: 20px;
  box-shadow: inset -1px 0 0 #ddd;
  padding: 0;
  justify-content: center;
  overflow: auto; 
}

/* 右侧部分 */
.right-section {
  flex: 1 1 400px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 0;
  overflow: auto; 
}


footer {
  height: 30px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
}
</style>
