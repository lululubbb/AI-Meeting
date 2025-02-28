<!-- src/App.vue -->
<template>
  <div id="app">
    
  
  <!-- 只有在非 Login 页面时才显示 AIFloatingChat -->
  <AIFloatingChat v-if="!isLoginOrIntroductionPage" />
  <!-- <AudioRecorder v-if="!isLoginPage" /> -->
  <Header v-if="!isLoginOrIntroductionPage" />
  <div :class="['content', { 'no-header': isLoginOrIntroductionPage  }]">
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </div>

  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AIFloatingChat from './components/AIFloatingChat.vue';
import Header from './components/Header.vue';
// import AudioRecorder from './components/AudioRecorder.vue';
import IntroductionPage from '@/views/IntroductionPage.vue';
export default {
  name: 'App',
  components: {
    AIFloatingChat,
    Header,
    IntroductionPage
    // AudioRecorder
  },
  setup() {
    const route = useRoute();

    // 判断当前是否是登录页面，如果是则不显示 AIFloatingChat
    const isLoginOrIntroductionPage = computed(() => route.name === 'Login' || route.name === 'Introduction');

    return {
      isLoginOrIntroductionPage
    };
  }
}
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
#app {
  display: flex;
  flex-direction: column;
}
body {
  background-color:transparent;
  color: rgb(0, 0, 0);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
a {
  color: inherit;
  text-decoration: none;
}
.content {
  padding-top: 90px; /* 根据 Header 的高度调整 */
  min-height: calc(100vh - 90px);
  box-sizing: border-box;
}
/* 只有在登录页面时，不应用 padding-top 和 min-height */
.content.no-header {
  padding-top: 0;
  min-height: 100vh; /* 让登录页面充满整个视口 */
}

/* 过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
