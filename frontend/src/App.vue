<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view></router-view>
  <!-- 只有在非 Login 页面时才显示 AIFloatingChat -->
  <AIFloatingChat v-if="!isLoginPage" />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AIFloatingChat from './components/AIFloatingChat.vue';
export default {
  name: 'App',
  components: {
    AIFloatingChat
  },
  setup() {
    const route = useRoute();

    // 判断当前是否是登录页面，如果是则不显示 AIFloatingChat
    const isLoginPage = computed(() => route.name === 'Login');

    return {
      isLoginPage
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
  background-color: #ffffff;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
a {
  color: inherit;
  text-decoration: none;
}
</style>
