<!-- src/components/MeetingOption.vue-->
<template>
  <div class="meeting-options">
    <div class="option" @click="handleNewMeeting">
      <div class="icon-wrapper1">
        <img src="@/assets/newmeeting.png" alt="New Meeting" />
      </div>
      <span>新会议</span>
    </div>
    <div class="option" @click="handleJoinMeeting">
      <div class="icon-wrapper">
        <img src="@/assets/join.png" alt="Join Meeting" />
      </div>
      <span>加入会议</span>
    </div>
    <div class="option" @click="handleScheduleMeeting">
      <div class="icon-wrapper">
        <img src="@/assets/arrange.png" alt="Schedule Meeting" />
      </div>
      <span>安排会议</span>
    </div>
    <div class="option" @click="handleHistoryMeeting">
      <div class="icon-wrapper">
        <img src="@/assets/historymeeting.png" alt="History Meeting" />
      </div>
      <span>历史会议</span>
    </div>
  </div>
</template>

<script setup>
// 使用 defineEmits 来定义事件
const emit = defineEmits();

// 处理新会议按钮点击事件
const handleNewMeeting = () => {
  console.log('New Meeting clicked');
  emit('new-meeting'); // 触发父组件事件
};

// 处理加入会议按钮点击事件
const handleJoinMeeting = () => {
  console.log('Join Meeting clicked');
  emit('join-meeting'); // 触发父组件事件
};

// 处理安排会议按钮点击事件
const handleScheduleMeeting = () => {
  console.log('Schedule Meeting clicked');
  emit('schedule-meeting'); // 触发父组件事件
};

// 处理历史会议按钮点击事件
const handleHistoryMeeting = () => {
  console.log('History Meeting clicked');
  emit('history-meeting'); // 触发父组件事件
};
</script>

<style scoped>
.meeting-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 columns */
  gap: 10px;
  padding: 10px;
  background-color: transparent;
}

.option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-align: center;
  width: auto;
  margin: 20px;
}

.icon-wrapper1 {
  background-color: #fba1a3; 
  padding: 10px;
  border-radius: 50%;
}
.icon-wrapper {
  background-color: #c6e0ff; 
  padding: 10px;
  border-radius: 50%;
}
.icon-wrapper1 img {
  width: 80px;
  height: 80px;
}
.icon-wrapper img {
  width: 90px;
  height: 90px;
}

span {
  margin-top: 10px;
  font-size: 24px;
  color: var(--text-color);
  font-weight:bold;
}
</style>
