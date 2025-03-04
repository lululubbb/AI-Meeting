<template>
    <div class="feature-card">
      <img :src="icon" alt="功能图标" class="feature-icon" />
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
      <!-- 添加展示图片 -->
      <img :src="showImage" alt="展示图片" class="show-image" v-if="showImage" />
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue'
  
  const props = defineProps({
    icon: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    showImage: {
      type: String,
      default: ''
    }
  })
  </script>
  
  <style scoped>
  .feature-card {
    width: 450px;
    height: auto;
    padding: 25px;
    background-color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    margin-bottom: 20px;
    transition: transform 0.3s ease;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
  }
  
  .feature-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }
  
  .feature-title {
    font-size: 26px;
    margin-bottom: 15px;
  }
  
  .feature-description {
    font-size: 18px;
    color: #666;
    margin-bottom: 20px; 
  }
  .show-image {
    width: 100%; /* 让图片宽度适应卡片宽度 */
    height: auto; /* 保持图片比例 */
    border-radius: 10px; /* 与卡片保持一致的圆角 */
  }
  /* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .feature-card {
    width: 350px;
    padding: 20px;
  }

  .feature-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }

  .feature-title {
    font-size: 22px;
    margin-bottom: 12px;
  }

  .feature-description {
    font-size: 16px;
    margin-bottom: 15px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .feature-card {
    width: 280px;
    padding: 15px;
  }

  .feature-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 10px;
  }

  .feature-title {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .feature-description {
    font-size: 14px;
    margin-bottom: 12px;
  }
}
  </style>