<template>
    <div class="feature-card">
      <img :src="icon" alt="Feature Icon" class="feature-icon" />
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
    </div>
  </template>
  
  <script>
  export default {
    props: {
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
    }
  };
  </script>
  
  <style scoped>
  .feature-card {
    background-color: #fff;
    border-radius: 12px;
    /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
    box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
    padding: 20px;
    text-align: center;
    transition: transform 0.3s ease;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
  }
  
  .feature-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 10px;
  }
  
  .feature-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .feature-description {
    font-size: 16px;
    color: #666;
  }
  </style>