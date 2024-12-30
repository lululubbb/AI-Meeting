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
        <!-- 上半部分 -->
        <div class="top-right">
          <!-- 放置右上组件 -->
          <ActivityChart />
          <!-- 集成 FileAttachmentContainer，内部已包含 FileAttachment -->
          <!-- <FileAttachmentContainer /> -->
        </div>
        <!-- 下半部分 -->
        <div class="bottom-right">
          <!-- 放置右下组件 -->
          <RecentActivity />
        </div>
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
// import ActivityChart from '../components/ActivityChart.vue';
// import RecentActivity from '../components/RecentActivity.vue';
// import FileAttachmentContainer from '../components/FileAttachmentContainer.vue'; // 引入容器组件

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

// 用户登出
const logout = async () => {
  await store.dispatch('signOutUser');
  router.push('/');
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
  flex-wrap: wrap;
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
  background-color: #f3f3f3;
  padding: 0;
  overflow: auto; 
}

/* 右上部分：占右侧高度 50% */
.top-right {
  flex: 1;
  background-color: #ffffff;
  padding: 20px;
  box-shadow: inset 0 -1px 0 #ddd;
  overflow: auto; 
}

/* 右下部分：占右侧高度 50% */
.bottom-right {
  flex: 1;
  background-color: #ffffff;
  padding: 20px;
  box-shadow: inset 0 -1px 0 #ddd;
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
