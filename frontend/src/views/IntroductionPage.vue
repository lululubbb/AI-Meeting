<template>
    <div class="introduction-page">
      <!-- 头部导航栏 -->
      <header class="header">
        <div class="logo-container">
          <img :src="logo" alt="AI 会议 logo" class="logo" />
          <img :src="teamlogo" alt="慧议先锋logo" class="logo" style="margin-left: 30px;"/>
        </div>
        <nav>
          <ul class="nav-links">
            <li><a href="#features">功能特点</a></li>
            <li><a href="#screenshots">产品截图</a></li>
            <li><a href="#about">关于我们</a></li>
          </ul>
        </nav>
        <button @click="goToLogin" class="login-button">登录</button>
      </header>
  
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">智能 AI 会议平台</h1>
          <p class="hero-subtitle">打造智能高效的沟通新生态</p>
          <button @click="goToLogin" class="cta-button">立即体验</button>
        </div>
        <img :src="heroImage" alt="AI 会议场景图" class="hero-image" />
      </section>
  
      <!-- 功能特点区域 -->
      <section id="features" class="features-section">
        <h2 class="section-title">功能特点</h2>
        <div class="feature-cards-container">
          <FeatureCard
            :icon="feature1.icon"
            :title="feature1.title"
            :description="feature1.description"
            :showImage="feature1.showImage"
          />
          <FeatureCard
            :icon="feature2.icon"
            :title="feature2.title"
            :description="feature2.description"
            :showImage="feature2.showImage"
          />
          <FeatureCard
            :icon="feature3.icon"
            :title="feature3.title"
            :description="feature3.description"
            :showImage="feature3.showImage"
          />
        </div>
      </section>
  
      <!-- 产品截图区域 -->
      <section id="screenshots" class="screenshots-section">
        <h2 class="section-title">产品展示</h2>
        <ScreenshotCarousel :screenshots="screenshots" />
      </section>
  
      <!-- 关于我们区域 -->
      <section id="about" class="about-section">
        <h2 class="section-title">关于我们</h2>
        <p class="about-description">
          我们致力于打造领先的 AI 会议解决方案，通过先进的人工智能技术，为用户提供便捷、高效、智能的会议体验。
          我们的团队由一群充满激情和创新精神的专业人士组成，不断追求卓越，为用户创造价值。
        </p>
      </section>
  
      <!-- 页脚 -->
      <footer class="footer">
        <p>&copy; 智会西湖.</p>
      </footer>
    </div>
  </template>
  
<script setup>
import FeatureCard from '../components/FeatureCard.vue'
import ScreenshotCarousel from '../components/ScreenshotCarousel.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logo from '../assets/logo.jpg';
import teamlogo from '../assets/team2.png';
import heroImage from '../assets/feature/usage_scene1.png';
 // 产品截图数据
import chat1 from '../assets/chart4.gif';
import chat2 from '../assets/chart4.gif';
import aiIcon from '@/assets/AI2.gif';
import summaryIcon from '@/assets/summary2.gif';
import startIcon from '@/assets/audio3.gif';
import feature1ShowImage1 from '../assets/chart1.gif';
import feature1ShowImage2 from '../assets/chart3.gif';
import feature1ShowImage3 from '../assets/chart2.gif';


const router = useRouter();  

// 功能特点数据
const feature1 = {
    icon: aiIcon,
    title: 'AI助手',
    description: '随时可与AI助手聊天咨询，AI辅助会议创建和文档润色等。',
    showImage: feature1ShowImage1
}
const feature2 = {
    icon: summaryIcon,
    title: '智能会议总结',
    description: '自动生成会议摘要，提炼关键信息，节省时间和精力。',
    showImage: feature1ShowImage2
}
const feature3 = {
    icon: startIcon,
    title: '实时转录与翻译',
    description: '支持实时语音转文字、多语言实时翻译，促进全球协作。',
    showImage: feature1ShowImage3
  }
  

  //轮播图显示的图片
const screenshots = [chat1, chat2];
  
  // 跳转到登录页面的方法
  const goToLogin = () => {
    router.push('/login')
  }


  </script>
  
<style scoped>
.introduction-page {
  font-family: Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1% 50px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.logo {
  height: 80px;
}

.nav-links {
  list-style: none;
  display: flex;
  height: 20px;
}

.nav-links li {
  margin-right: 100px;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  font-size: 25px;
  margin-right: 20px;
  transition: color 0.3s ease;
  padding: 20px;
  border-radius: 20px;
  font-weight: bold;
}

.nav-links a:hover {
  color: #409eff;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
}

.login-button {
  width: 70px;
  height: 50px;
  font-size: 20px;
  padding: 10px 10px;
  background-color: #409eff;
  color: white;
  border: solid #3484da;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-button:hover {
  background-color: #2d8cf0;
  border-radius: 5px;
  transform: translateY(-5px); /* 点击时上移 */
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
}

.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 180px;
  background-color: #f4f9ff;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 48px;
  margin-bottom: 10px;
}

.hero-subtitle {
  font-size: 24px;
  margin-bottom: 40px;
  color: #666;
}

.cta-button {
  padding: 15px 50px;
  background-color: #409eff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-size: 18px;
  transition: background-color 0.3s ease;
  border: solid #286bb3;
}

.cta-button:hover {
  transform: translateY(-5px); /* 点击时上移 */
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
  background-color: #2d8cf0;
}

.logo-container {
  display: flex;
  align-items: center;
}
.hero-image {
  flex: 1;
  max-width: 550px;
  height: auto;
  margin-left: 20px;
}

.features-section {
  padding: 90px 50px;
  text-align: center;
}

.section-title {
  font-size: 36px;
  margin-bottom: 50px;
}

.feature-cards-container {
  display: flex;
  justify-content: space-between; /* 均匀分布卡片 */
  align-items: stretch; /* 确保卡片高度一致 */
  gap: 20px; /* 卡片之间的间距 */
  flex-wrap: nowrap; /* 禁止换行 */
}

.feature-cards-container > * {
  flex: 1; /* 每个卡片占据相同的宽度 */
  max-width: 30%; /* 限制最大宽度 */
}

.screenshots-section {
  padding: 10px 50px;
  text-align: center;
}

.about-section {
  padding: 10px 50px;
  text-align: center;
  background-color: #f4f9ff;
}

.about-description {
  font-size: 20px;
  color: #666;
  line-height: 1.8;
}

.footer {
  text-align: center;
  padding: 3px;
  font-size: 18px;
  background-color: white;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.footer-text {
  font-size: 14px;
  color: #666;
}

/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .feature-cards-container {
    flex-wrap: wrap; /* 允许换行 */
    gap: 15px; /* 减小卡片之间的间距 */
  }

  .feature-cards-container > * {
    flex: 1 1 calc(50% - 15px); /* 每行显示两个卡片 */
    max-width: none; /* 取消最大宽度限制 */
  }

  .header {
    padding: 1% 20px;
    flex-direction: column;
    align-items: center;
  }
  .logo-container {
    justify-content: space-between;
    width: 100%;
    margin-bottom: 8px;
  }
  .logo {
    height: 60px;
  }
  nav {
    width: 100%;
    order: 2; /* 导航菜单下移 */
    margin-top: 12px;
  }
  .nav-links {
    margin-top: 10px;
    height: auto;
    justify-content: center;
  }

  .nav-links li {
    margin-right: 10px;
  }

  .nav-links a {
    font-size: 16px;
    padding: 12px 20px;
    margin: 0;
    width: 100%;
    display: block;
    color: #2c3e50;
    transition: all 0.2s ease;
    border-bottom: 1px solid #e9ecef;
  }

  .nav-links a:last-child {
    border-bottom: none;
  }

  .nav-links a:hover {
    color: #409eff;
    box-shadow: none;
    transform: none;
    font-size: 18px;
  }

  .login-button {
    width: 60px;
    height: 40px;
    font-size: 16px;
    margin-top: 10px;
  }

  .hero-section {
    flex-direction: column;
    padding: 10px 20px;
    text-align: center;
  }

  .hero-title {
    font-size: 32px;
  }
  .login-button {
    display: none !important;
  }

  .hero-subtitle {
    font-size: 18px;
    margin-bottom: 20px;
  }

  .cta-button {
    padding: 10px 30px;
    font-size: 16px;
  }

  .hero-image {
    max-width: 100%;
    margin-left: 0;
    margin-top: 20px;
  }

  .features-section {
    padding: 50px 20px;
  }

  .section-title {
    font-size: 28px;
    margin-bottom: 30px;
  }

  .screenshots-section {
    padding: 10px 20px;
  }

  .about-section {
    padding: 10px 20px;
  }

  .about-description {
    font-size: 16px;
  }

  .footer {
    font-size: 14px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .header {
    flex-wrap: wrap;
    padding: 8px 12px !important;
    justify-content: center !important;
  }

  /* 隐藏所有导航元素 */
  .nav-links,
  .login-button {
    display: none !important;
  }

  /* 品牌标识居中显示 */
  .logo-container {
    width: 100%;
    justify-content: center;
    margin: 0;
  }

  .logo {
    height: 40px !important;
    margin: 0 10px !important;
  }

  /* 主标题优化 */
  .hero-title {
    font-size: 24px;
    line-height: 1.3;
  }

  /* 功能卡片间距调整 */
  .feature-cards-container {
    flex: 1 1 100%; /* 每行显示一个卡片 */
  }

  /* 保持立即体验按钮可见 */
  .cta-button {
    display: block !important;
    margin: 0 auto;
  }

  .nav-links a {
    font-size: 14px;
    padding: 10px 16px;
  }

  .login-button {
    padding: 6px 12px;
    font-size: 13px;
    right: 12px;
    top: 10px;
  }

  .nav-links li {
    margin-right: 10px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .about-description {
    font-size: 14px;
  }

  .footer {
    font-size: 12px;
  }
}
</style>
