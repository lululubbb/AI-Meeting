<!-- src/components/CustomButton.vue -->
<template>
  <button @click="handleClick" class="custom-button">
    {{ text }}
  </button>
</template>

<script>
export default {
  name: 'CustomButton',
  props: {
    text: {
      type: String,
      required: true
    },
    onPressed: {
      type: Function,
      default: () => {}
    }
  },
  methods: {
    handleClick() {
      this.onPressed()
    }
  }
}
</script>

<style scoped>
.custom-button {
  padding: 12px 24px;
  background-color: #559cf7;
  color: rgb(0, 0, 0);
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s; /* 过渡效果 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
}
.custom-button:hover {
  background-color: #74b1f1;
  transform: translateY(-2px);
}
/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .custom-button {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 6px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .custom-button {
    padding: 8px 16px;
    font-size: 12px;
    border-radius: 4px;
  }
}
</style>
