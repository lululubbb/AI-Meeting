<template>
  <footer class="mobile-footer">
    <button @click="navigateToHome">
      <i class="fa-solid fa-house"></i>
      <span>主页</span>
    </button>
    <button @click="navigateToAIBot">
      <i class="fa-solid fa-robot"></i>
      <span>AI功能</span>
    </button>
    <button @click="navigateToForum">
      <i class="fa-solid fa-database"></i>
      <span>会议论坛</span>
    </button>
    <button @click="navigateToTools">
      <i class="fa-solid fa-toolbox"></i>
      <span>工具栏</span>
    </button>
  </footer>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateToHome = () => router.push('/home');
const navigateToAIBot = () => router.push('/aibot'); // 已修改为指向AIBot页面
const navigateToForum = () => router.push('/Forum');
const navigateToTools = () => router.push('/tools');
</script>

<style scoped>
.mobile-footer {
  display: flex;
  justify-content: space-around;
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #fff;
  padding: 10px 0;
  border-top: 1px solid #ddd;
  z-index: 800;
}
button {
  background: none;
  border: none;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
i {
  font-size: 20px;
  margin-bottom: 5px;
}
.footer-button {
  background: none;
  border: none;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #333; /* 默认文字颜色 */
  text-decoration: none; /* 去掉 a 标签下划线 */
  padding: 5px 10px; /* 可选：给按钮一些内边距 */
  flex: 1; /* 让按钮均匀分布 */
  text-align: center; /* 确保文字居中 */
}

.footer-button i {
  font-size: 20px;
  margin-bottom: 5px;
}

/* 活动状态的样式 */
.footer-button.active-gradient {
  background: linear-gradient(to right, #044DB4, #1492A0); /* 从左到右的渐变 */
  color: white; /* 修改文字颜色以确保在渐变背景上可见 */
  border-radius: 5px; /* 可选：添加圆角 */
}

/* 可选：为活动状态的图标也设置颜色 */
.footer-button.active-gradient i {
  color: white;
}
</style>