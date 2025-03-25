<!-- Tools.vue -->
<template>
    <!-- 文件功能-->
    <button @click="navigateToFiles">
   <i class="fa-solid fa-file"></i>
   <span>文件管理</span>
    </button>

   <!-- 地图功能-->
   <button @click="navigateToMap">
    <i class="fa-solid fa-map-location-dot"></i>
   <span>地图导航</span>
    </button>

    <!-- 论坛功能-->
   <button @click="navigateToForum">
    <i class="fa-solid fa-users"></i>
   <span>会议论坛</span>

    </button>
    <button @click="navigateToMaterials" class="nav-button">
    <i class="fas fa-file-download"></i> 
     <span>会议资料</span>
  </button>

    <!-- 日历功能-->
   <button @click="navigateToCalendar">
    <i class="fa-solid fa-calendar-days"></i>
   <span>日历助手</span>
    </button>

    <!-- 活动功能-->
   <button @click="navigateToActivity">
    <i class="fa-solid fa-star"></i>
   <span>最近活动</span>
    </button>

    <!-- 帮助功能-->
   <button @click="navigateToHelp">
   <i class="fa-solid fa-file"></i>
   <span>帮助页面</span>
    </button>
    
  </template>
  
  <script setup>
  // 导入正确的路由API
  import { useRouter } from 'vue-router'
  
  // 获取路由实例
  const router = useRouter()
  
  // 跳转到文件页面
  const navigateToFiles = () => {
    // 使用命名路由更安全（需在router/index.js配置）
    router.push({ name: 'Files' })
  }

  const navigateToMap = () => {
    // 使用命名路由更安全（需在router/index.js配置）
    router.push({ name: 'Map' })
  }

  const navigateToForum = () => {
    // 使用命名路由更安全（需在router/index.js配置）
    router.push({ name: 'Forum' })
  }

  const navigateToHelp = () => {
    // 使用命名路由更安全（需在router/index.js配置）
    router.push({ name: 'Help' })
  }

  const navigateToCalendar = () => {
    // 使用命名路由更安全（需在router/index.js配置）
    router.push({ name: 'CalendarToDoList' })
  }

  const navigateToActivity = () => {
    // 使用命名路由更安全（需在router/index.js配置）
    router.push({ name: 'RecentActivityCard' })
  }
  const navigateToMaterials = () => {
  router.push({ name: 'Materials' });
};
  
  </script>
  
  <style scoped>
  button {
    background: none;
    border: none;
    font-size: 16px;
    display: box;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }
  i {
    font-size: 20px;
    margin-bottom: 5px;
  }
  /* 移动端适配 */
  @media (max-width: 768px) {
    .icon {
      width: 20px;
      height: 20px;
    }
    
    .text {
      display: none; /* 小屏隐藏文字 */
    }
  }
  </style>