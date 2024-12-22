<!-- src/App.vue -->
<template>
  <div id="app">
    <router-view></router-view>
    <AIFloatingChat />
  </div>
</template>

<script>
import AIFloatingChat from './components/AIFloatingChat.vue';
export default {
  name: 'App',
  components: {
    AIFloatingChat
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
  background-color: #1a1a1a;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
a {
  color: inherit;
  text-decoration: none;
}
</style>
