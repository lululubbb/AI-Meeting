<!-- MeetingShow.vue -->
<template>
    <div class="transcription-page">
      <h1>会议转录记录</h1>
  
      <div v-if="isLoading">加载中...</div>
      <div v-else-if="error">{{ error }}</div>
      <div v-else-if="transcriptionData">
        <div v-for="(transcriptionsByDate, date) in transcriptionData" :key="date" class="date-section">
          <h2>{{ date }}</h2>
          <div v-for="(transcriptions, timeslot) in transcriptionsByDate" :key="timeslot" class="timeslot-section">
            <h3>{{ timeslot }}</h3>
            <div v-for="(item, index) in transcriptions" :key="index" class="transcription-item">
              <span class="user-info">{{ item.userName }} ({{ item.time }}):</span>
              <span class="text">{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else>没有转录数据。</div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import FirestoreService from '../services/FirestoreService.js'; // 确保路径正确
  import { useStore } from 'vuex';
  import { useRoute } from 'vue-router';
  
  const transcriptionData = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  
  const store = useStore();
  const route = useRoute(); // 使用 useRoute
  const userId = computed(() => store.state.user.uid);
  
  onMounted(async () => {
  
      // const meetingId = 'your_meeting_id';  //直接赋值 
      const meetingId = route.params.meetingId; // 从路由参数获取!
  
      // 通过vuex获取
      //   const meetingConfig = store.getters.getMeetingConfig;
      //   const meetingId = meetingConfig.meetingId
    if (!userId.value || !meetingId) {
      error.value = '缺少用户 ID 或 会议 ID';
      return;
    }
  
    isLoading.value = true;
    error.value = null;
    try {
      const meetingData = await FirestoreService.getMeetingHistory(userId.value, meetingId);
      if (meetingData && meetingData.transcriptionHistory) {
        transcriptionData.value = meetingData.transcriptionHistory;
      } else {
        transcriptionData.value = null;
        error.value = '未找到转录数据';
      }
    } catch (err) {
      console.error('获取转录数据失败:', err);
      error.value = '无法获取转录数据';
    } finally {
      isLoading.value = false;
    }
  });
  </script>
  
  <style scoped>
  /* 与之前提供的样式相同 */
  .transcription-page {
    padding: 20px;
  }
  
  .date-section {
    margin-bottom: 20px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 10px;
  }
  
  .date-section h2 {
    color: #333;
  }
  
  .timeslot-section {
    margin-left: 20px;
    margin-bottom: 10px;
  }
  
  .timeslot-section h3 {
    color: #666;
  }
  
  .transcription-item {
    margin-bottom: 5px;
    padding: 8px;
    background-color: #f9f9f9;
    border-radius: 4px;
  }
  
  .user-info {
    font-weight: bold;
    margin-right: 5px;
    color: #409eff;
  }
  .text{
      white-space: pre-line;
      word-break: break-word;
  }
  </style>
  
  