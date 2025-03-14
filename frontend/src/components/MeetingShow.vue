<template>
  <div class="transcription-page">
    <h1>会议转录记录</h1>

    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="transcriptionData && transcriptionData.length > 0">
      <!-- 时间轴 -->
      <div class="timeline-container">
        <div v-for="(segment, index) in timeSegments" :key="index" class="timeline-segment">
          <span class="emoji">{{ segment.emoji }}</span>
          <span class="time">{{ formatTime(segment.start) }} - {{ formatTime(segment.end) }}</span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-container">
        <div v-for="(segment, index) in processedData" :key="index" class="content-segment">
          <div v-for="(item, userId) in segment" :key="userId" class="user-transcription">
            <span class="user-name">{{ item.userName }}:</span>
            <span class="transcription-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else>没有转录数据。</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';

const transcriptionData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const timeSegments = ref([]);
const processedData = ref([]);
//const participants = ref([]); // 不再需要 participants

const store = useStore();
const route = useRoute();
const userId = computed(() => store.state.user.uid);

const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'HH:mm');
};

// 不需要 getUserName 函数

onMounted(async () => {
  const meetingId = route.params.meetingId;

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
      //participants.value = meetingData.participants || []; // 不需要

      // 1. 计算时间段
      const startTime = meetingData.startTime.toMillis(); // 转换为毫秒
      const endTime = meetingData.endTime.toMillis();
      const duration = endTime - startTime;
      const segmentDuration = duration / 5;

      const emojis = ['😀', '😊', '😎', '🤩', '🤔']; // Emoji 列表

      for (let i = 0; i < 5; i++) {
        const segmentStart = startTime + i * segmentDuration;
        const segmentEnd = startTime + (i + 1) * segmentDuration;
        timeSegments.value.push({
          start: segmentStart,
          end: segmentEnd,
          emoji: emojis[i], // 添加 emoji
        });
      }

      // 2. 数据分组
      const groupedData = [];
      for (let i = 0; i < 5; i++) {
          groupedData.push({});  // 初始化数据结构
      }

        transcriptionData.value.forEach(item => {
          const itemTime = new Date(`${item.date} ${item.time}`).getTime(); //为了方便 还是先这样
          for (let i = 0; i < 5; i++) {
             if (itemTime >= timeSegments.value[i].start && itemTime < timeSegments.value[i].end) {
                 if(!groupedData[i][item.userId]){
                        groupedData[i][item.userId] = {
                            userName: item.userName,
                            text: ''
                       };
                  }
                  groupedData[i][item.userId].text += item.text + " ";
                 break;

              }
          }
      });


      processedData.value = groupedData;
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
/* 样式部分保持不变 */
.transcription-page {
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

/* 时间轴样式 */
.timeline-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 8px;
}

.timeline-segment {
  flex: 1;
  text-align: center;
}

.timeline-segment .emoji {
  font-size: 20px;
  margin-bottom: 5px;
}

.timeline-segment .time {
  font-size: 14px;
  color: #666;
}

/* 内容区域样式 */
.content-container {
  display: flex;
  justify-content: space-between;
}

.content-segment {
  flex: 1;
  padding: 10px;
  border-right: 1px solid #ccc;
  /* background-color: #f9f9f9; */
}

.content-segment:last-child {
  border-right: none;
}

.user-transcription {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-name {
  font-weight: bold;
  color: #409eff;
  margin-right: 5px;
}

.transcription-text {
  white-space: pre-line;
  word-break: break-word;
}
</style>
