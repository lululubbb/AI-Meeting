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
        <img src="../assets/chat1.png" />
      </div>

      <!-- 右侧部分 -->
      <div class="right-section">
        <!-- 通讯录组件 -->
        <img src="../assets/chat2.png" />
      </div>
    </main>

    <footer>
        <p>&copy; 智汇西湖.</p>
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
  padding: 0px;
  /* box-shadow: inset -1px 0 0 #ddd; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  overflow: auto; 
  align-items: center;
  display: flex; 
  flex-direction: column; 
  gap: 2px; 
  margin: 0px;
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
  background-color: var(--background-color); /* 使用全局背景颜色 */  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #ddd;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.08);
}
  </style>
  