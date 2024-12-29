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

<script>
import { ref } from 'vue';

export default {
  setup() {
    const handleNewMeeting = () => {
      console.log('New Meeting clicked');
    };

    const handleJoinMeeting = () => {
      console.log('Join Meeting clicked');
    };

    const handleScheduleMeeting = () => {
      console.log('Schedule Meeting clicked');
    };

    const handleHistoryMeeting = () => {
      console.log('History Meeting clicked');
    };

    return {
      handleNewMeeting,
      handleJoinMeeting,
      handleScheduleMeeting,
      handleHistoryMeeting
    };
  }
};
</script>

<style scoped>
.meeting-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 columns */
  gap: 20px;
  padding: 20px;
  background-color: transparent;
}

.option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-align: center;
}

.icon-wrapper1 {
  background-color: #fba1a3; 
  padding: 20px;
  border-radius: 10px;
}
.icon-wrapper {
  background-color: #c6e0ff; 
  padding: 20px;
  border-radius: 10px;
}
.icon-wrapper1 img {
  width: 60px;
  height: 60px;
}
.icon-wrapper img {
  width: 60px;
  height: 60px;
}

span {
  margin-top: 10px;
  font-size: 16px;
  color: #333;
  font-weight:bold;
}
</style>
