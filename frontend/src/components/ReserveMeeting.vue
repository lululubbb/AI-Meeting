<!-- src/components/ReserveMeeting.vue -->
<!-- 仿照VideoCall的表单写的 -->
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

    <!-- 提交按钮 -->
    <CustomButton :text="'预约会议'" :onPressed="handleReservation" />
  </div>
</div>
</template>

<script setup>
import { ref, reactive,inject } from 'vue';
import CustomButton from '../components/CustomButton.vue';
import { showSnackBar } from '../utils/utils.js';
import { ElMessage,ElDatePicker ,ElMessageBox} from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js'; // 引入 FirestoreService
import { useStore } from 'vuex'; 


// 获取 AIFloatingChat 组件的引用
const aiFloatingChat = inject('aiFloatingChat');

// 获取当前路由和路由实例
const route = useRoute();
const router = useRouter();
const store = useStore(); // 获取 Vuex store

const config = reactive({
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  meetingDateRange: [], // 用于存储开始时间和结束时间
});

const role = ref(1); // 默认是主持人角色
const timer = ref(null); // 使用 ref 声明 timer

// 配置禁止选择过去的时间
const pickerOptions = {
  disabledDate(time) {
    return time.getTime() < Date.now(); // 禁止选择当前时间之前的日期
  }
};

// 处理预约会议
const handleReservation = async () => {
  // 验证表单数据
  if (!config.sessionName || !config.userName || !config.meetingDateRange || config.meetingDateRange.length !== 2) {
    showSnackBar('请填写完整的会议信息');
    return;
  }

  if (role.value !== 1) {
    showSnackBar('只有主持人才能预约会议');
    return;
  }

  try {
    // 获取当前用户信息
    const user = store.getters.getUser;
    if (!user) {
      showSnackBar('用户未登录，请先登录');
      return;
    }

    // 提取会议开始时间和结束时间
    const [startTime, endTime] = config.meetingDateRange;

    // 构建会议数据
    const meetingData = {
      sessionName: config.sessionName,
      host: config.userName,
      sessionPasscode: config.sessionPasscode,
      role: role.value,
      startTime: startTime,
      endTime: endTime,
      createdAt: startTime, 
      status: 'scheduled', // 会议状态：未开始
    };

    // 调用 FirestoreService 保存会议记录
    const meetingId = await FirestoreService.addToMeetingHistory(user.uid, config.sessionName, meetingData);
    console.log('会议预约成功，ID:', meetingId);

    // 设置定时器，当会议开始时间到达时，自动创建会议
    const now = Date.now();
    const startTimeMillis = startTime.getTime();
    const delay = startTimeMillis - now;

    if (delay > 0) {
      timer.value = setTimeout(() => {
        showMeetingStartNotification(meetingData);
      }, delay);
    } else {
      showSnackBar('会议开始时间已过，请重新选择时间');
    }

    // 提示用户预约成功
    ElMessage.success('会议预约成功！');

    // 清空表单
    config.sessionName = '';
    config.userName = '';
    config.sessionPasscode = '';
    config.meetingDateRange = [];
  } catch (error) {
    console.error('预约失败:', error);
    showSnackBar('会议预约失败: ' + error.message);
  }
};

// 显示会议开始通知
const showMeetingStartNotification = (meetingData) => {
  ElMessageBox.confirm(
    `您预约的会议 "${meetingData.sessionName}" 时间已到，是否立即创建会议？`,
    '会议开始提醒',
    {
      confirmButtonText: '创建会议',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 用户点击“创建会议”
    createMeetingAutomatically(meetingData);
  }).catch(() => {
    // 用户点击“取消”
    showSnackBar('已取消创建会议');
  });
};

// 自动创建会议
const createMeetingAutomatically = async (meetingData) => {
  try {
    const user = store.getters.getUser;
    if (!user) {
      showSnackBar('用户未登录，无法自动创建会议');
      return;
    }

    // 构造指令
    const instruction = JSON.stringify({
      action: 'create_meeting',
      meetingName: meetingData.sessionName,
      password: meetingData.sessionPasscode,
    });

    // 调用 AI 助手的 sendMessage 方法
    if (aiFloatingChat && aiFloatingChat.value) {
      // 设置用户输入为指令
      aiFloatingChat.value.userInput = instruction;
      // 调用 sendMessage 方法
      await aiFloatingChat.value.sendMessage();
    } else {
      showSnackBar('无法找到 AI 助手，请手动创建会议');
    }
  } catch (error) {
    console.error('自动创建会议失败:', error);
    showSnackBar('自动创建会议失败: ' + error.message);
  }
};
  // 返回主页
  const goHome = () => {
  router.push('/home');
};


</script>

<style scoped>
.reserve-container {
  padding: 30px 20px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  margin: 20px auto;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  border-radius: 15px;
  /* box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); */
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
  /* border-radius: 12px;
  box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2); */
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
  outline: none;
}

input[type="datetime-local"] {
  padding: 10px 12px;
}

CustomButton {
  margin-top: 20px;
}
</style>
