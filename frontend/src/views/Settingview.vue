<template>
  <div>
    <h2>Settings Page</h2>
    <p>在这里可以调整你的应用设置。</p>
    <label for="theme">选择主题：</label>
    <select id="theme">
      <option value="light">浅色主题</option>
      <option value="dark">深色主题</option>
    </select>
  </div>
</template>

<script setup>
// 这里不需要额外的JavaScript代码
</script>

<style scoped>
div {
  padding: 20px;
}
</style>