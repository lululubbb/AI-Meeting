<template>
  <div class="reserve-container">
    <div id="reservation-form" v-if="!isJoining">
      <div v-if="route.name === 'ReserveMeeting'" class="close-btn-wrapper">
        <button @click="goHome" class="close-btn" aria-label="关闭">
          <img src="@/assets/exit.png" alt="退出" />
        </button>
      </div>
      <h1>预约会议</h1>
      <div class="input-group">
        <label for="sessionName">会议名称:</label>
        <input id="sessionName" v-model="config.sessionName" placeholder="请输入会议名称" />
      </div>
      <div class="input-group">
        <label for="userName">用户名:</label>
        <input id="userName" v-model="config.userName" placeholder="请输入用户名" />
      </div>
      <div class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input id="sessionPasscode" v-model="config.sessionPasscode" placeholder="请输入会议密码" />
      </div>
      <div class="input-group">
        <label for="meetingDateRange">选择会议时间:</label>
        <el-date-picker
          v-model="config.meetingDateRange"
          type="datetimerange"
          :picker-options="pickerOptions"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          align="right"
        ></el-date-picker>
      </div>
      <CustomButton :text="'预约会议'" :onPressed="handleReservation" />
    </div>
    <div v-else class="meeting-loading">
      <div class="spinner"></div>
      <p>正在预约并设置会议，请稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue';
import CustomButton from '../components/CustomButton.vue';
import { showSnackBar } from '../utils/utils.js';
import { ElMessage, ElDatePicker } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';

const route = useRoute();
const router = useRouter();
const store = useStore();

const config = reactive({
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  meetingDateRange: [],
});

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

const handleReservation = async () => {
  if (
    !config.sessionName ||
    !config.userName ||
    !config.meetingDateRange ||
    config.meetingDateRange.length !== 2
  ) {
    showSnackBar('请填写完整的会议信息');
    return;
  }

  try {
    if (!userId.value) {
      showSnackBar('用户未登录!');
      return;
    }
    isJoining.value = true; // 显示加载动画

    const [startTime, endTime] = config.meetingDateRange;
    const meetingData = {
      sessionName: config.sessionName,
      hostName: config.userName,
      sessionPasscode: config.sessionPasscode,
      startTime,
      endTime,
      createdAt: new Date(),
      status: 'scheduled',
    };
    const meetingId = await FirestoreService.addToMeetingHistory(
      userId.value,
      config.sessionName,
      meetingData
    );

    // 调用 inject 的方法
    emitMeetingScheduled({
      ...meetingData,
      meetingId,
    });

    ElMessage.success('预约成功!');
  } catch (error) {
    console.error('预约失败', error);
    showSnackBar('预约失败:' + error.message);
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

/* 加载动画样式 */
.meeting-loading {
    display: flex;
    flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
  border-radius: 12px;
  box-shadow: var(--global-box-shadow);
}


 .spinner {
  width: 50px;
  height: 50px;
  border: 6px solid #ccc;
  border-top: 6px solid #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
   margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
