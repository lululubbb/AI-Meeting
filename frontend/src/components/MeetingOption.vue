<!-- src/components/MeetingOption.vue -->
<template>
  <div class="meeting-option">
    <span>{{ text }}</span>
    <input type="checkbox" :checked="isMuted" @change="toggleMute" />
  </div>
</template>

<script>
export default {
  name: 'MeetingOption',
  props: {
    text: {
      type: String,
      required: true
    },
    isMuted: {
      type: Boolean,
      required: true
    },
    onChange: {
      type: Function,
      required: true
    }
  },
  methods: {
    toggleMute(event) {
      this.onChange(event.target.checked)
    }
  }
}
</script>

<style scoped>
.meeting-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #4a4a4a;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: background-color 0.3s;
}
.meeting-option:hover {
  background-color: #5a5a5a;
}
.meeting-option span {
  color: #f0f0f0;
  font-size: 16px;
}
.meeting-option input {
  transform: scale(1.3);
  cursor: pointer;
}
</style>
