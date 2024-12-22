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
  background-color: #1a73e8;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}
.custom-button:hover {
  background-color: #1669c1;
  transform: translateY(-2px);
}
</style>
