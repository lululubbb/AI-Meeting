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
      <span>所有会议</span>
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
  transition: transform 0.2s ease, box-shadow 0.2s ease; /* 添加过渡效果 */
  position: relative; /* 确保可以使用 z-index */
  z-index: 1; /* 初始图层 */
  border-radius: 50%;
}

.icon-wrapper1,
.icon-wrapper {
  background: linear-gradient(to right, #bdf0e8,#a4d9fc, #5796edc7); /* 新会议图标背景色 */
  padding: 15px; /* 增大内边距 */
  border-radius: 50%;
  transition: background-color 0.2s ease; /* 背景色过渡效果 */
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1); /* 悬浮时的阴影效果 */
}

.icon-wrapper {
  border-radius: 50%;
  background: linear-gradient(to right, #bdf0e8,#B5E1FC, #9bd9fc); /* 新会议图标背景色 */

}

.icon-wrapper:hover {
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.2); /* 悬浮时的阴影效果 */
  z-index: 2; /* 提高层级 */
  border-radius: 50%;
}

.icon-wrapper:active {
  transform: translateY(-5px); /* 点击时上移 */
  border-radius: 50%;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
}


.option:hover .icon-wrapper1,
.option:hover .icon-wrapper {
  background-color: #9296ff; /* 新会议悬浮背景色 */
  
}

.option:hover .icon-wrapper {
  background-color: #65a9fd; /* 其他按钮悬浮背景色 */
}

.icon-wrapper1 img,
.icon-wrapper img {
  width: 80px;
  height: 80px;
  transition: transform 0.2s ease; /* 图标放大效果 */
}

.option:hover .icon-wrapper1 img,
.option:hover .icon-wrapper img {
  transform: scale(1.1); /* 悬浮时图标放大 */
}

span {
  margin-top: 10px;
  font-size: 24px;
  color: var(--text-color); 

  font-weight: bold;
  transition: color 0.2s ease; /* 文字颜色过渡效果 */
}

.option:hover span {
  color: #333; /* 悬浮时文字颜色加深 */
}

@media screen and (max-width: 768px) {
  .meeting-options {
    gap: 15px;
    padding: 20px;
  }

  .option {
    margin: 15px;
  }

  .icon-wrapper1,
  .icon-wrapper {
    padding: 12px;
    box-shadow: 0 4px 12px rgba(56,103,255,0.15); /* 增强科技感阴影 */
  }

  .icon-wrapper1 img,
  .icon-wrapper img {
    width: 70px;
    height: 70px;
  }
  .icon-wrapper:active {
  transform: translateY(-5px); /* 点击时上移 */
  border-radius: 50%;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
}
  span {
    font-size: 18px;
    margin-top: 8px;
    font-weight: 600;
  }
}

@media screen and (max-width: 480px) {
  .meeting-options {
    gap: 10px;
    padding: 10px;
  }

  .option {
    margin: 8px;
  }

  .icon-wrapper1,
  .icon-wrapper {
    padding: 8px;
    box-shadow: 0 3px 8px rgba(56,103,255,0.1);
  }

  .icon-wrapper1 img,
  .icon-wrapper img {
    width: 50px;
    height: 50px;
  }
  .icon-wrapper:active {
  transform: translateY(-5px); /* 点击时上移 */
  border-radius: 50%;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
}
  span {
    font-size: 14px;
    font-weight: 650;
  }

  /* 优化触控体验 */
  .option:active .icon-wrapper {
    transform: scale(0.95);
    box-shadow: 0 2px 6px rgba(56,103,255,0.2);
  }
}
@media screen and (max-width: 768px) {
  .meeting-options {
    gap: 15px;
    padding: 20px;
  }

  .option {
    margin: 15px;
  }

  .icon-wrapper1,
  .icon-wrapper {
    padding: 12px;
    box-shadow: 0 4px 12px rgba(56,103,255,0.15); /* 增强科技感阴影 */
  }

  .icon-wrapper1 img,
  .icon-wrapper img {
    width: 70px;
    height: 70px;
  }

  span {
    font-size: 18px;
    margin-top: 8px;
    font-weight: 650;
  }
}

@media screen and (max-width: 480px) {
  .meeting-options {
    gap: 10px;
    padding: 10px;
  }

  .option {
    margin: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  }

  .icon-wrapper1,
  .icon-wrapper {
    padding: 8px;
    box-shadow: 0 3px 8px rgba(56,103,255,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .icon-wrapper1 img,
  .icon-wrapper img {
    width: 50px;
    height: 50px;
  }

  span {
    font-size: 14px;
    font-weight: 650;
  }

  /* 优化触控体验 */
  .option:active .icon-wrapper {
    transform: scale(0.95);
    box-shadow: 0 2px 6px rgba(56,103,255,0.2);
  }
}
</style>
