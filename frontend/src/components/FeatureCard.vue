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
    width: 550px;
    height: auto;
    padding: 30px;
    background-color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    margin-bottom: 30px;
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
  </style>