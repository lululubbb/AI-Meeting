<template>
  <div class="reserve-container">
    <div id="reservation-form">
      <div v-if="route.name === 'ReserveMeeting'" class="close-btn-wrapper">      
        <button @click="goHome" class="close-btn" aria-label="关闭">
          <img src="@/assets/exit.png" alt="退出" />
        </button>
      </div>
      <h1>预约会议</h1>
      
      <!-- 会议名称 -->
      <div class="input-group">
        <label for="sessionName">会议名称:</label>
        <input id="sessionName" v-model="config.sessionName" placeholder="请输入会议名称" />
      </div>

      <!-- 用户名 -->
      <div class="input-group">
        <label for="userName">用户名:</label>
        <input id="userName" v-model="config.userName" placeholder="请输入用户名" />
      </div>

      <!-- 会议密码 (可选) -->
      <div class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input id="sessionPasscode" v-model="config.sessionPasscode" placeholder="请输入会议密码" />
      </div>

      <!-- 角色选择 -->
      <div class="input-group">
        <label for="role">角色:</label>
        <select id="role" v-model="role">
          <option :value="1">主持人</option>
          <option :value="0">参与者</option>
        </select>
      </div>

      <!-- 选择会议开始时间和结束时间 -->
      <div class="input-group">
        <label for="meetingDateRange">选择会议时间:</label>
        <el-date-picker
          v-model="config.meetingDateRange"
          type="datetimerange"
          :picker-options="pickerOptions"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          align="right"></el-date-picker>
      </div>

      <div class="button-container">
        <CustomButton text="复制会议邀请" @click="copyInvitationToClipboard" /> 
        <!-- 提交按钮 -->
        <CustomButton :text="'预约会议'" @click="handleReservation" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue';
import CustomButton from '../components/CustomButton.vue';
import { ElMessage, ElDatePicker } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';

//复制预约会议信息
const generateInvitationContent = () => {
  const meetingInfo = `用户${config.userName}向您发来一个会议邀请~\n会议名称: ${config.sessionName}\n会议时间: ${config.meetingDateRange}\n会议密码:${config.sessionPasscode}\n复制该文本打开“慧议”系统点击“加入会议”按钮可直接入会！`;
  return meetingInfo;
  };

  const copyInvitationToClipboard = async () => {
  // 检查用户输入是否完整
  if (!config.userName || !config.sessionName || !config.sessionPasscode) {
    ElMessage.warning('请填写完整的会议信息后再复制');
    return;
  }
  const invitationContent = generateInvitationContent();
  try {
    await navigator.clipboard.writeText(invitationContent);
    ElMessage.success('会议邀请已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败，请手动复制');
  }
  };


// 获取当前路由和路由实例
const route = useRoute();
const router = useRouter();
const store = useStore();

const config = reactive({
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  meetingDateRange: [],
});
const role = ref(1); // 默认是主持人角色
const timer = ref(null); // 使用 ref 声明 timer
const scheduledMeeting = ref(null); // 保留, 但不再是关键
const isJoining = ref(false);

const pickerOptions = {
  disabledDate(time) {
    return time.getTime() < Date.now() - 86400000;
  },
};

const userId = computed(() => {
  const user = store.getters.getUser;
  return user ? user.uid : null;
});
const userEmail = computed(() => {
  const user = store.getters.getUser;
  return user ? user.email : null;
});

// 注入 emitMeetingScheduled
const emitMeetingScheduled = inject('emitMeetingScheduled');

const saveTodo = async (selectedDate, newTodoText) => {
  console.log('当前 sessionName:', config.sessionName);
  if (!user.value || !user.value.uid) {
    ElMessage.warning('用户未登录，无法保存待办事项');
    return;
  }

  if (!selectedDate) {
    ElMessage.warning('请先选择一个日期！');
    return;
  }

  if (!newTodoText.trim()) {
    ElMessage.warning('请输入待办事项内容！');
    return;
  }

  const newTodo = {
    id: Date.now(),
    text: config.sessionName, // 确保不是空字符串
    data:new Date(selectedDate.value).toISOString().split('T')[0],
    //date: selectedDate.value, // 确保有日期
    isCompleted: false, 
  };

  console.log("准备添加待办事项:", newTodo); // 调试输出

  try {
    await store.dispatch('addTodo', newTodo);
    ElMessage.success('待办事项已添加');
    // 触发日历事件刷新
    refreshCalendarEvents();
  } catch (error) {
    console.error("添加失败：", error);
    ElMessage.error('添加失败');
  }



  closeDialog();
};

const handleDateClick = (info) => {
  selectedDate.value = info.dateStr;
  openAddTodoDialog();
};


const handleReservation = async () => {
  if (
    !config.sessionName ||
    !config.userName ||
    !config.meetingDateRange ||
    config.meetingDateRange.length !== 2
  ) {
    ElMessage.warning('请填写完整的会议信息');
    return;
  }

  try {
    if (!userId.value) {
      ElMessage.warning('用户未登录!');
      return;
    }
    isJoining.value = true; // 显示加载动画

    // 确保 startTime 和 endTime 是有效的 Date 对象
    let [startTime, endTime] = config.meetingDateRange;
    startTime = new Date(startTime);  // 强制转换为 Date 对象
    endTime = new Date(endTime);      // 强制转换为 Date 对象

    console.log('StartTime:', startTime.toString(), 'EndTime:', endTime.toString()); // 调试输出

    // 检查是否是有效的日期
    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      ElMessage.warning('会议时间格式不正确，请检查会议日期');
      return;
    }

    const meetingData = {
      sessionName: config.sessionName,
      hostName: config.userName,
      sessionPasscode: config.sessionPasscode,
      startTime: startTime.toISOString(),  // 使用 ISO 格式
      endTime: endTime.toISOString(),      // 使用 ISO 格式
      createdAt: new Date().toISOString(), // 使用 ISO 格式
      status: 'scheduled',
    };

    console.log('Meeting Data:', meetingData); // 调试输出

    // 将会议数据添加到 Firestore
    const meetingId = await FirestoreService.addToMeetingHistory(
      userId.value,
      config.sessionName,
      meetingData
    );

    // 这里是将会议添加到待办事项
    const todo = {
      text: `预约会议 ${config.sessionName}`, // 会议名称作为待办事项标题
      date: startTime.toISOString().split('T')[0], // 使用会议开始时间作为待办事项的日期
      isCompleted: false, // 默认未完成
    };

    // 将待办事项添加到用户的 todolist 中
    await FirestoreService.addTodoItem(userId.value, todo);
    ElMessage.success('已将会议添加至待办事项');

     // 调用 inject 的方法
     emitMeetingScheduled({
      ...meetingData,
      meetingId,
    });

    ElMessage.success('预约成功!');
  } catch (error) {
    ElMessage.error('预约失败');
  } finally {
    isJoining.value = false; // 隐藏加载动画
  }
    
};




const goHome = () => {
  router.push('/home');
};
</script>

<style scoped>
/* 合并后的样式 */
.reserve-container {
  padding: 30px 20px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  margin: 20px auto;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  border-radius: 15px;
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  position: relative;
  overflow-y: auto;
}

/* 关闭按钮样式 */
.close-btn-wrapper {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1;
  border: none;
  cursor: pointer;
  transition: transform 0.3s;
}

.close-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.3s;
}

.close-btn img {
  width: 30px;
  height: 30px;
}

.close-btn:hover {
  transform: rotate(90deg);
}

#reservation-form {
  background-color: var(--background-color); /* 使用全局背景颜色 */
  padding: 30px;
  text-align: center;
  max-width: 100%;
  width:95%;
  overflow: auto;
  box-sizing: border-box;
}

h1 {
  margin-bottom: 20px;
  color: var(--text-color); /* 使用全局文字颜色 */
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
  font-weight: bold;
}

.input-group input,
.input-group select {
  width: 95%;
  padding: 10px 12px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: #1a73e8;
  aoutline: none;
}

input[type="datetime-local"] {
  padding: 10px 12px;
}

CustomButton {
  margin-top: 20px;
}

.button-container {
  display: flex;
  justify-content: center; /* 按钮居中 */
  gap: 10px; /* 按钮之间的间距 */
  margin-top: 20px; /* 调整与上方内容的间距 */
}

.button-container > * {
  flex: 1; /* 让按钮宽度均等 */
  max-width: 200px; /* 限制按钮最大宽度 */
  text-align: center;
}
/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .reserve-container {
    padding: 20px 15px;
    width: 90%;
    margin: 15px auto;
  }

  #reservation-form {
    padding: 20px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 15px;
  }

  .input-group {
    margin-bottom: 15px;
  }

  .input-group label {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .input-group input,
  .input-group select {
    font-size: 14px;
    padding: 8px 10px;
  }

  .close-btn img {
    width: 25px;
    height: 25px;
  }

  .button-container {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .button-container > * {
    max-width: 100%;
    width: 100%;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .reserve-container {
    padding: 15px 10px;
    width: 95%;
    margin: 10px auto;
  }

  #reservation-form {
    padding: 15px;
  }

  h1 {
    font-size: 20px;
    margin-bottom: 12px;
  }

  .input-group {
    margin-bottom: 12px;
  }

  .input-group label {
    font-size: 12px;
    margin-bottom: 4px;
  }

  .input-group input,
  .input-group select {
    font-size: 12px;
    padding: 6px 8px;
  }

  .close-btn img {
    width: 20px;
    height: 20px;
  }

  .button-container {
    gap: 12px;
  }
}
</style>
