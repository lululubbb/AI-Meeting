<template>
    <div class="introduction-page">
      <!-- 头部 -->
      <header class="header">
        <img src="@/assets/logo.png" alt="AI Meeting Logo" class="logo" />
        <h1 class="title">AI Meeting</h1>
        <p class="subtitle">智能驱动的会议解决方案</p>
      </header>
  
      <!-- 项目截图 -->
      <div class="screenshot-section">
        <img src="@/assets/ai-meeting-screenshot.png" alt="AI Meeting Screenshot" class="screenshot" />
      </div>
  
      <!-- 功能特点 -->
      <div class="features-section">
        <h2 class="section-title">主要功能</h2>
        <div class="features-container">
          <FeatureCard
            icon="@/assets/icon1.png"
            title="智能语音识别"
            description="实时将会议语音转换为文字，提高会议记录效率。"
          />
          <FeatureCard
            icon="@/assets/icon2.png"
            title="关键信息提取"
            description="自动提取会议中的关键信息，帮助您快速回顾会议重点。"
          />
          <FeatureCard
            icon="@/assets/icon3.png"
            title="情感分析"
            description="分析参会人员的情感状态，为会议决策提供参考。"
          />
        </div>
      </div>
  
      <!-- 产品说明 -->
      <div class="product-description-section">
        <h2 class="section-title">产品说明</h2>
        <p class="description">
          AI Meeting是一款基于人工智能技术的会议解决方案，旨在提高会议效率和质量。通过智能语音识别、关键信息提取、情感分析等功能，帮助您更好地管理和回顾会议内容。
        </p>
      </div>
  
      <!-- 底部 -->
      <footer class="footer">
        <p class="copyright">© 2025 AI Meeting. All rights reserved.</p>
      </footer>
    </div>
  </template>
  
  <script>
  import FeatureCard from '@/components/FeatureCard.vue';
  
  export default {
    components: {
      FeatureCard
    }
  };
  </script>
  
  <style scoped>
  .introduction-page {
    font-family: 'Arial', sans-serif;
    background-color: #f5f5f5;
    color: #333;
    padding: 20px;
  }
  
  .header {
    text-align: center;
    padding: 40px 0;
  }
  
  .logo {
    width: 100px;
    height: 100px;
    margin-bottom: 20px;
  }
  
  .title {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .subtitle {
    font-size: 20px;
    color: #666;
  }
  
  .screenshot-section {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .screenshot {
    max-width: 800px;
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .features-section {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .section-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  .features-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .product-description-section {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .description {
    font-size: 18px;
    line-height: 1.5;
  }
  
  .footer {
    text-align: center;
    padding: 20px 0;
    background-color: #fff;
    border-top: 1px solid #ddd;
  }
  
  .copyright {
    font-size: 14px;
    color: #666;
  }
  </style>