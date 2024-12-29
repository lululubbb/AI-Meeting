<!-- src/components/Header.vue -->
<template>
  <header class="header">
    <div class="header-container">
      <!-- 左侧标题和搜索栏 -->
      <div class="left-section">
        <div class="title">
          AI zoom<br />
          workplace
        </div>
        <div class="search-bar">
          <i class="fas fa-search search-icon"></i>
          <input type="text" placeholder="搜索内容" />
          <div class="search-divider"></div>
        </div>
      </div>

      <!-- 中间导航按钮 -->
      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="nav-link"
          active-class="active"
        >
          <i :class="item.icon"></i>
          {{ item.label }}
        </router-link>
      </nav>

      <!-- 右侧按钮 -->
      <div class="flex space-x-4">
        <!-- 减号按钮 -->
        <button class="bg-transparent hover:text-blue-700 flex items-center justify-center transition-colors duration-300">
          <i class="fa-solid fa-minus text-black"></i>
        </button>

        <!-- 铃铛按钮 -->
        <button class="bg-transparent hover:text-green-700 flex items-center justify-center transition-colors duration-300">
          <i class="fa-solid fa-bell text-black"></i>
        </button>

        <!-- 用户按钮 -->
        <button class="bg-transparent hover:text-green-700 flex items-center justify-center transition-colors duration-300">
          <i class="fa-solid fa-user text-black"></i>
        </button>

        <!-- 问号按钮 -->
        <button class="bg-transparent hover:text-yellow-700 flex items-center justify-center transition-colors duration-300">
          <i class="fa-solid fa-question text-black"></i>
        </button>

        <!-- 扩展按钮 -->
        <button class="bg-transparent hover:text-yellow-700 flex items-center justify-center transition-colors duration-300">
          <i class="fa-solid fa-expand text-black"></i>
        </button>

        <!-- 关闭按钮 -->
        <button   @click="logout" class="bg-transparent hover:text-yellow-700 flex items-center justify-center transition-colors duration-300">
          <i class="fa-solid fa-xmark text-black"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

// 定义导航项
const navItems = ref([
  { name: 'Home', path: '/home', label: '主页', icon: 'fas fa-home' },
  { name: 'Meetings', path: '/meetings', label: '会议', icon: 'fas fa-users' },
  { name: 'Reservations', path: '/reservations', label: '预约', icon: 'fas fa-calendar-alt' },
  { name: 'Files', path: '/files', label: '文件', icon: 'fas fa-file-alt' },
  { name: 'Chat', path: '/chat', label: '聊天', icon: 'fas fa-comments' },
  { name: 'More', path: '/more', label: '更多', icon: 'fas fa-ellipsis-h' },
]);

// 获取 Vuex store 和 Vue Router 实例
const store = useStore();
const router = useRouter();

// 登出功能
const logout = async () => {
  await store.dispatch('signOutUser');
  router.push('/');
};
</script>


<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #dfe3e8; /* 与按钮底部边框颜色一致 */
  padding: 20px 36px 3px 36px;
  box-sizing: border-box;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 59px;
}

.title {
  color: #000;
  font-size: 24px;
  line-height: 1.2;
  font-weight: bold;
  white-space: pre-line;
}

.search-bar {
  position: relative;
  width: 271px;
  height: 29px;
  background-color: #f7f7f7;
  border-radius: 16px;
  display: flex;
  align-items: center;
  padding-left: 12px;
}

.search-icon {
  color: #f8f7f7;
  margin-right: 8px;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #bfbfbf;
  outline: none;
}

.search-divider {
  width: 1px;
  height: 18px;
  background-color: #dfe3e8;
  margin-left: 8px;
}

.nav {
  display: flex;
  gap: 59px;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #434040;
  font-size: 24px;
  position: relative;
  transition: color 0.3s, transform 0.3s;
}

.nav-link i {
  margin-bottom: 5px;
  font-size: 18px;
  color: inherit; /* 继承父元素的颜色 */
}

.nav-link.active::after,
.nav-link:hover::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #434040;
  border-radius: 2px;
}

.nav-link:hover {
  color: #000;
  transform: scale(1.05);
}

/* 移除默认的按钮边框和背景色 */
button {
  border: none;
  outline: none;
  cursor: pointer;
  background-color: transparent; /* 确保背景透明 */
}

/* 确保图标颜色与按钮背景透明 */
button i {
  color: #000; /* 图标初始颜色为黑色 */
  font-size: 1.25rem; /* 根据需要调整图标大小 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .left-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .nav {
    flex-wrap: wrap;
    gap: 20px;
  }

  .content {
    padding-top: 150px; /* 根据调整后的 Header 高度调整 */
  }
}

/* 过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
