<template>
    <footer class="mobile-footer">
      <button @click="navigateToHome">
        <i class="fa-solid fa-house"></i>
        <span>主页</span>
      </button>
      <button @click="navigateToAIFloatingChat">
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
  const navigateToAIFloatingChat = () => router.push('/aiFloatingChat');
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
  </style>
  