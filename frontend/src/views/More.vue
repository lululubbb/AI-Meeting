<!-- src/views/More.vue -->
<!-- src/views/Chat.vue -->
<template>
  <div class="home-container">
 <!-- 主体布局 -->
 <main class="main-layout">
      <!-- 左侧区域 -->
      <div class="left-section">
        <Mood/>
        <CalendarTodoList />
      </div>

      <!-- 中间部分 -->
      <div class="middle-section">
        <!-- 中间区域的组件 -->
      </div>

      <!-- 右侧部分 -->
      <div class="right-section">
        <!-- 上半部分 -->
        <div class="top-right">
          <!-- 放置右上组件 -->
          <ActivityChart />
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
import MeetingOption from '../components/MeetingOption.vue'; 
import CustomButton from '../components/CustomButton.vue';
import CalendarTodoList from '../components/CalendarTodoList.vue'; 
import Mood from '../components/Mood.vue';

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

/* 左侧部分 */
.left-section {
  flex:0.8;
  background-color: #ffffff;
  padding: 10px;
  box-shadow: inset -1px 0 0 #ddd;
  overflow: auto; 
}

/* 中间部分 */
.middle-section {
  flex: 1.3;
  background-color: #ffffff;
  padding: 10px;
  box-shadow: inset -1px 0 0 #ddd;
  overflow: auto; 
}

/* 右侧部分 */
.right-section {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  padding: 10px;
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
  