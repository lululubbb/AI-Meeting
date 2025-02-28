<!-- src/components/Header.vue -->
<template>
  <header class="header">
    <div class="header-container">
      <!-- 左侧标题和搜索栏 -->
      <div class="left-section">
        <div class="logo">
          <img src="../assets/logo.jpg" alt="AI Meeting workplace Logo" />
        </div>
        <div class="title">
          AI Meeting<br />
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
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 右侧按钮 -->
      <div class="right-section">
        <!-- 减号按钮 -->
        <button class="icon-button">
          <i class="fa-solid fa-minus"></i>
        </button>

        <!-- 铃铛按钮 -->
        <button class="icon-button">
          <i class="fa-solid fa-bell"></i>
        </button>

          <!-- 用户按钮 -->

        <button class="icon-button" @click="showUserProfile">
          <i class="fa-solid fa-user"></i>
        </button>
        <!-- 显示用户信息卡片 -->
        <UserProfileCard v-if="isUserCardVisible" @close="toggleUserCardVisibility" />
        

        <!-- 用户信息卡片
        <div v-if="isUserCardVisible" class="user-card">
          <img :src="user.avatarUrl" alt="User Avatar" class="user-avatar" />
          <p class="user-name">{{ user.name }}</p>
          <p class="user-email">{{ user.email }}</p>
          <p>状态信息
            <el-select v-model="user.status" placeholder="选择状态">
              <el-option label="在线" value="在线"></el-option>
              <el-option label="离线" value="离线"></el-option>
              <el-option label="请勿打扰" value="请勿打扰"></el-option>
              <el-option label="离开" value="离开"></el-option>
            </el-select>
          </p>
          <p>工作位置：{{ user.workLocation }}</p>
          <el-button type="text" @click="goToHelpPage">帮助</el-button>
          <el-button type="text" @click="goToSettingsPage">设置</el-button>
          <el-button type="text" @click="logout">退出登录</el-button>
        </div> -->

        <!-- 问号按钮 -->
        <button class="icon-button"  @click="goToHelpPage">
          <i class="fa-solid fa-question"></i>
        </button>

        <!-- 扩展按钮 -->
        <button class="icon-button">
          <i class="fa-solid fa-expand"></i>
        </button>

        <!-- 关闭按钮 -->
        <button @click="logout" class="icon-button">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElButton, ElSelect, ElOption } from 'element-plus';
import UserProfileCard from './UserProfileCard.vue';  // 引入用户信息卡片组件

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


// 跳转到帮助页面
const goToHelpPage = () => {
  router.push('/help'); 
};

// 登出功能
const logout = async () => {
  await store.dispatch('signOutUser');
  router.push('/login');
};

</script>

<style scoped>
:root {
  font-size: 16px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #dfe3e8; /* 与按钮底部边框颜色一致 */
  padding: 1.25rem 2.25rem 0.1875rem 2.25rem; /* 20px 36px 3px 36px */
  box-sizing: border-box;
  z-index: 1000;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1); /* 0 2px 4px rgba(0, 0, 0, 0.1) */
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
}

/* ---------------------- */
/* 左侧标题和搜索栏区域   */
/* ---------------------- */
.left-section {
  display: flex;
  align-items: center;
  gap: 1rem; /* 59px */
  flex-shrink: 1;
}

.title {
  color: #000;
  font-size: 1.5rem; /* 24px */
  line-height: 1.2;
  font-weight: bold;
  white-space: pre-line;
}

.search-bar {
  position: relative;
  width: 16.9375rem; /* 271px */
  height: 1.8125rem; /* 29px */
  background-color: #f7f7f7;
  border-radius: 1rem; /* 16px */
  display: flex;
  align-items: center;
  padding-left: 0.5rem; /* 12px */
}

.search-icon {
  color: #bfbfbf;
  margin-right: 0.5rem; /* 8px */
  font-size: 1rem; /* 16px */
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem; /* 14px */
  color: #bfbfbf;
  outline: none;
}

.search-divider {
  width: 0.0625rem; /* 1px */
  height: 1.125rem; /* 18px */
  background-color: #dfe3e8;
  margin-left: 0.5rem; /* 8px */
}

/* ---------------------- */
/* 中间导航区域           */
/* ---------------------- */
.nav {
  /* 导航容器：水平排列每个按钮 */
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2rem; /* 59px */
  flex-shrink: 1;
}
.logo img {
  height: 60px;       /* 你也可以根据需要调整大小 */
  width: 60px;
  object-fit: contain; /* 保持图片宽高比 */
  margin :4px;
  /* 可根据需求加上 margin、padding 等 */
}

/* 每个链接：图标在上，文字在下 */
.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #434040;
  font-size: 1.5rem; /* 24px */
  position: relative;
  transition: color 0.3s, transform 0.3s;
  /* 关键：防止中文字符如“会议”断行成竖排 */
  white-space: nowrap;
}

.nav-link i {
  margin-bottom: 0.3125rem; /* 图标与文字间的距离 5px */
  font-size: 1.125rem;      /* 18px */
  color: inherit;           /* 继承父元素的颜色 */
}

/* 避免中文断行成竖排, 额外在文字上也可加 white-space */
.nav-label {
  font-size: inherit;
  white-space: nowrap; /* 防止中文换行 */
}

/* 悬停或选中时的下划线效果 */
.nav-link.active::after,
.nav-link:hover::after {
  content: '';
  position: absolute;
  bottom: -0.3125rem; /* -5px */
  left: 0;
  width: 100%;
  height: 0.125rem; /* 2px */
  background-color: #434040;
  border-radius: 0.125rem; /* 2px */
}

.nav-link:hover {
  color: #000;
  transform: scale(1.05);
}

/* ---------------------- */
/* 右侧按钮区域           */
/* ---------------------- */
.right-section {
  display: flex;
  align-items: center;
  gap: 1rem; /* 16px */
  flex-shrink: 1;
}

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
}

/* ---------------------- */
/* 以下为响应式设计，通过媒体查询缩小字号等，不改变「图标在上、文字在下」的结构 */
/* 并保留 white-space: nowrap; 以防止中文断行            */
/* ---------------------- */
@media (max-width: 1200px) {
  .header {
    padding: 1rem 1.5rem 0.125rem 1.5rem; /* 16px 24px 2px 24px */
  }

  .left-section {
    gap: 2.5rem; /* 40px */
  }

  .title {
    font-size: 1.375rem; /* 22px */
  }

  .search-bar {
  position: relative;
  width: 16.9375rem; /* 271px */
  height: 1.8125rem; /* 29px */
  background-color: #f7f7f7;
  border-radius: 1rem; /* 16px */
  display: flex;
  align-items: center;
  padding-left: 0.75rem; /* 12px */

  /* 新增：让搜索栏更靠近标题 */
  margin-left:0; /* 负值让它更往左移动，自己调合适的数值 */
}


  .search-icon {
    margin-right: 0.4rem; /* 6.4px */
    font-size: 0.875rem; /* 14px */
  }

  .search-bar input {
    font-size: 0.8125rem; /* 13px */
  }

  .search-divider {
    height: 1rem; /* 16px */
    margin-left: 0.4rem; /* 6.4px */
  }

  .nav {
    gap: 2.5rem; /* 40px */
  }

  .nav-link {
    font-size: 1.375rem; /* 22px */
  }

  .nav-link i {
    font-size: 1rem; /* 16px */
  }

  .nav-label {
    font-size: 0.8125rem; /* 13px */
  }

  .right-section {
    gap: 0.75rem; /* 12px */
  }

  .icon-button {
    font-size: 1.125rem; /* 18px */
  }
}

@media (max-width: 992px) {
  .header {
    padding: 0.875rem 1.25rem 0.1rem 1.25rem; /* 14px 20px 1.6px 20px */
  }

  .left-section {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* 原本是 3.6875rem，可根据需要自行设置 */
  flex-shrink: 1;
}


  .title {
    font-size: 1.25rem; /* 20px */
  }

  .search-bar {
    width: 14rem; /* 224px */
    height: 1.625rem; /* 26px */
    padding-left: 0.5rem; /* 8px */
  }

  .search-icon {
    margin-right: 0.3rem; /* 4.8px */
    font-size: 0.75rem; /* 12px */
  }

  .search-bar input {
    font-size: 0.75rem; /* 12px */
  }

  .search-divider {
    height: 0.9375rem; /* 15px */
    margin-left: 0.3rem; /* 4.8px */
  }

  .nav {
    gap: 2rem; /* 32px */
  }

  .nav-link {
    font-size: 1.25rem; /* 20px */
  }

  .nav-link i {
    font-size: 0.875rem; /* 14px */
  }

  .nav-label {
    font-size: 0.75rem; /* 12px */
  }

  .right-section {
    gap: 0.5rem; /* 8px */
  }

  .icon-button {
    font-size: 1rem; /* 16px */
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0.75rem 1rem 0.1rem 1rem; /* 12px 16px 1.6px 16px */
  }

  .left-section {
    gap: 1.5rem; /* 24px */
  }

  .title {
    font-size: 1.125rem; /* 18px */
  }

  .search-bar {
    width: 13rem; /* 208px */
    height: 1.5rem; /* 24px */
    padding-left: 0.4rem; /* 6.4px */
  }

  .search-icon {
    margin-right: 0.25rem; /* 4px */
    font-size: 0.7rem; /* 11.2px */
  }

  .search-bar input {
    font-size: 0.7rem; /* 11.2px */
  }

  .search-divider {
    height: 0.875rem; /* 14px */
    margin-left: 0.25rem; /* 4px */
  }

  .nav {
    gap: 1.75rem; /* 28px */
  }

  .nav-link {
    font-size: 1.125rem; /* 18px */
  }

  .nav-link i {
    font-size: 0.75rem; /* 12px */
  }

  .nav-label {
    font-size: 0.6875rem; /* 11px */
    white-space: nowrap;
  }

  .right-section {
    gap: 0.4rem; /* 6.4px */
  }

  .icon-button {
    font-size: 0.875rem; /* 14px */
  }
}

@media (max-width: 576px) {
  .header {
    padding: 0.625rem 0.75rem 0.1rem 0.75rem; /* 10px 12px 1.6px 12px */
  }

  .left-section {
    gap: 1rem; /* 16px */
  }

  .title {
    font-size: 1rem; /* 16px */
  }

  .search-bar {
    width: 12rem; /* 192px */
    height: 1.375rem; /* 22px */
    padding-left: 0.3rem; /* 4.8px */
  }

  .search-icon {
    margin-right: 0.2rem; /* 3.2px */
    font-size: 0.625rem; /* 10px */
  }

  .search-bar input {
    font-size: 0.625rem; /* 10px */
  }

  .search-divider {
    height: 0.8125rem; /* 13px */
    margin-left: 0.2rem; /* 3.2px */
  }

  .nav {
    gap: 1.5rem; /* 24px */
  }

  .nav-link {
    font-size: 1rem; /* 16px */
    white-space: nowrap;
  }

  .nav-link i {
    font-size: 0.625rem; /* 10px */
  }

  .nav-label {
    font-size: 0.625rem; /* 10px */
  }

  .right-section {
    gap: 0.3rem; /* 4.8px */
  }

  .icon-button {
    font-size: 0.75rem; /* 12px */
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0.5rem 0.5rem 0.1rem 0.5rem; /* 8px 8px 1.6px 8px */
  }

  .left-section {
    gap: 0.75rem; /* 12px */
  }

  .title {
    font-size: 0.875rem; /* 14px */
  }

  .search-bar {
    width: 11rem; /* 176px */
    height: 1.25rem; /* 20px */
    padding-left: 0.2rem; /* 3.2px */
  }

  .search-icon {
    margin-right: 0.15rem; /* 2.4px */
    font-size: 0.5rem; /* 8px */
  }

  .search-bar input {
    font-size: 0.5rem; /* 8px */
  }

  .search-divider {
    height: 0.75rem; /* 12px */
    margin-left: 0.15rem; /* 2.4px */
  }

  .nav {
    gap: 1.25rem; /* 20px */
  }

  .nav-link {
    font-size: 0.875rem; /* 14px */
    white-space: nowrap;
  }

  .nav-link i {
    font-size: 0.5rem; /* 8px */
  }

  .nav-label {
    font-size: 0.5rem; /* 8px */
  }

  .right-section {
    gap: 0.2rem; /* 3.2px */
  }

  .icon-button {
    font-size: 0.625rem; /* 10px */
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
