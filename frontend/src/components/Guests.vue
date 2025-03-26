<!-- src/components/Guests.vue -->
<template>
    <div class="placeholder-page guests-page">
      <h1>参会嘉宾</h1>
      <p>重要演讲嘉宾、特邀专家等信息将在此展示。</p>
      <!-- 后续将在这里添加从 guests.json 加载和显示数据的逻辑 -->
      <el-empty description="嘉宾信息正在整理中..." />
    </div>
  </template>
  
  <script setup>
  import { ElEmpty } from 'element-plus';
  </script>
  
  <style scoped>
  .placeholder-page { padding: 30px; text-align: center; }
  h1 { margin-bottom: 15px; }
  </style>
  