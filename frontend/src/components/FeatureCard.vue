<template>
    <div class="feature-card">
      <img :src="icon" alt="功能图标" class="feature-icon" />
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
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
    }
  })
  </script>
  
  <style scoped>
  .feature-card {
    width: 350px;
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
    font-size: 24px;
    margin-bottom: 15px;
  }
  
  .feature-description {
    font-size: 16px;
    color: #666;
  }
  </style>