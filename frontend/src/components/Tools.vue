<template>
    <!-- 添加图标和辅助文本 -->
    <button @click="navigateToFiles">
   <i class="fa-solid fa-file"></i>
   <span>文件管理</span>
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
  </script>
  
  <style scoped>
  /* 基础按钮样式
  .icon-button {
    padding: 8px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.2s;
  }
  
  悬停效果
  .icon-button:hover {
    opacity: 0.8;
  }
  
  图标尺寸
  .icon {
    width: 24px;
    height: 24px;
  }
  
  文字样式 
  .text {
    font-size: 14px;
    color: #333;
  } */

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