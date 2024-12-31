<!-- src/components/ReserveMeeting.vue -->
<!-- 仿照VideoCall的表单写的 -->
<template>
  <div id="reservation-form">
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
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElDatePicker } from 'element-plus';
import CustomButton from '../components/CustomButton.vue';
import { showSnackBar } from '../utils/utils.js';
import { ElMessage } from 'element-plus';

const config = reactive({
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  meetingDateRange: [], // 用于存储开始时间和结束时间
});

const role = ref(1); // 默认是主持人角色

// 配置禁止选择过去的时间
const pickerOptions = {
  disabledDate(time) {
    return time.getTime() < Date.now(); // 禁止选择当前时间之前的日期
  }
};

// 处理预约会议
const handleReservation = async () => {
  if (!config.sessionName || !config.userName ||!config.meetingDateRange || config.meetingDateRange.length !== 2) {
    showSnackBar('请填写完整的会议信息');
    return;
  }

  if (role.value !== 1) {
    showSnackBar('只有主持人才能预约会议');
    return;
  }

  try {
    // 此处加入预约会议的实现逻辑，例如向后端发送请求保存会议预约信息
    console.log('会议预约信息:', config);
    ElMessage.success('会议预约成功！'); // 显示错误信息
  } catch (error) {
    console.error('预约失败:', error);
    showSnackBar('会议预约失败: ' + error.message);
  }
};
</script>

<style scoped>
#reservation-form {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 100%;
  width:95%;
  overflow: auto;
  box-sizing: border-box;
}

h1 {
  margin-bottom: 20px;
  color: #000000;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #333333;
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
