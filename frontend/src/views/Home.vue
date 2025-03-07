<template>
  <div class="home-container">
    <!-- 主体布局 -->
    <main class="main-layout">
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
        <DataSummary/>  
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
import CalendarTodoList from '../components/CalendarToDoList.vue'; 
import Mood from '../components/Mood.vue';
import RecentActivity from '../components/RecentActivityCard.vue';
import FileAttachmentContainer from '../components/FileAttachmentContainer.vue'; // 引入容器组件
import DataSummary from '../components/DataSummary.vue';

// 获取路由实例
const router = useRouter();

// 获取 Vuex store 实例
const store = useStore();

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

</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  /* background-color: #ffffff; */
  background-color: var(--background-color); /* 使用全局背景颜色 */
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
}


footer {
  height: 30px;
  /* background-color: #f5f5f5; */
  background-color: var(--footer-background-color); /* 使用全局页脚背景颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
}

@media screen and (max-width: 768px) {
  .main-layout {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 15px;
    padding: 10px;
  }

  .left-section {
    flex: 1 1 45%;
    min-width: 300px;
    border-radius: 12px;
  }

  .middle-section {
    flex: 2 1 50%;
    order: 3;
  }

  .right-section {
    flex: 1 1 45%;
    border-radius: 12px;
  }

  .options {
    margin: 20px auto;
    padding: 15px;
    max-width: 320px;
  }
}

@media screen and (max-width: 480px) {
  .main-layout {
    flex-direction: column;
  }

  .left-section,
  .right-section {
    flex: none;
    width: 95%;
    margin: 10px auto;
  }

  .middle-section {
    width: 95%;
    margin: 0 auto 15px;
    border-radius: 12px;
  }

  .options {
    padding: 10px;
    max-width: 280px;
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
}
</style>
