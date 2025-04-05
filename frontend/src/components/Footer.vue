<template>
  <footer class="mobile-footer">
    <button @click="navigateToHome"
    :class="getActiveClass('/home')">
      <i class="fa-solid fa-house"></i>
      <span>主页</span>
    </button>
    <button @click="navigateToAIBot"
    :class="getActiveClass('/aibot')">
      <i class="fa-solid fa-robot"></i>
      <span>AI功能</span>
    </button>
    <button @click="navigateToForum"
    :class="getActiveClass('/forum')">
      <i class="fa-solid fa-database"></i>
      <span>会议论坛</span>
    </button>
    <button @click="navigateToTools"
    :class="getActiveClass('/tools')">
      <i class="fa-solid fa-toolbox"></i>
      <span>工具栏</span>
    </button>
  </footer>
</template>

<script setup>
import { useRoute, useRouter  } from 'vue-router';
import { ref, watch } from 'vue';
const router = useRouter();
const route = useRoute();
const currentTab = ref(route.path); 
// 监听路由变化更新选中状态
watch(() => route.path, (newPath) => {
  currentTab.value = newPath;
});

const getActiveClass = (path) => {
  return currentTab.value === path ? 'active' : '';
};

const navigateToHome = () => router.push('/home');
const navigateToAIBot = () => router.push('/aibot'); // 已修改为指向AIBot页面
const navigateToForum = () => router.push('/forum');
const navigateToTools = () => router.push('/tools');
</script>

<style scoped>
.mobile-footer {
  display: flex;
  justify-content: space-around;
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: #fff;
  padding: 10px 0;
  border-top: 1px solid #ddd;
  z-index: 800;
}
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
button.active {
  position: relative;
  background: linear-gradient(to right, #044DB4, #1492A0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

button.active::after {
  bottom: 5px;
}

/* 移除原有hover的伪元素样式 */
button:hover::after {
  display: none;
}

</style>