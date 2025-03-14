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

      <!-- 优化按钮 (全局) -->
      <button @click="startAllOptimization" :disabled="allOptimizationStarted">
        一键优化
      </button>

      <!-- 内容区域 -->
      <div class="content-container">
        <div v-for="(segment, segmentIndex) in processedData" :key="segmentIndex" class="content-segment">
          <div v-for="(item, userId) in segment" :key="userId" class="user-transcription">
            <span class="user-name">{{ item.userName }}:</span>
            <span class="transcription-text">{{ item.text }}</span>

            <!-- 优化结果显示区域 -->
            <div class="optimized-text-container" v-if="optimizationData[segmentIndex] && optimizationData[segmentIndex][userId]">
              <div>
                <span class="optimized-label">优化结果:</span>
                <span class="optimized-text">{{ optimizationData[segmentIndex][userId] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>没有转录数据。</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';

const transcriptionData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const timeSegments = ref([]);
const processedData = ref([]);
const optimizationData = reactive({});
const allOptimizationStarted = ref(false); // 全局优化是否开始

const store = useStore();
const route = useRoute();
const userId = computed(() => store.state.user.uid);

const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'HH:mm');
};

async function fetchData() {
  // ... (与之前相同，获取数据和分组，但不优化)
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

      const startTime = meetingData.startTime.toMillis();
      const endTime = meetingData.endTime.toMillis();
      const duration = endTime - startTime;
      const segmentDuration = duration / 5;
      const emojis = ['😀', '😊', '😎', '🤩', '🤔'];
      for (let i = 0; i < 5; i++) {
          timeSegments.value.push({
              start: startTime + i * segmentDuration,
              end: startTime + (i + 1) * segmentDuration,
              emoji: emojis[i],
          });
      }

      const groupedData = [];
      for (let i = 0; i < 5; i++) {
        groupedData.push({});
      }
      transcriptionData.value.forEach(item => {
        const itemTime = new Date(`${item.date} ${item.time}`).getTime();
        for (let i = 0; i < 5; i++) {
          if (itemTime >= timeSegments.value[i].start && itemTime < timeSegments.value[i].end) {
            if (!groupedData[i][item.userId]) {
              groupedData[i][item.userId] = { userName: item.userName, text: '' };
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
    console.error('获取数据失败:', err);
    error.value = '无法获取数据';
  } finally {
    isLoading.value = false;
  }
}

// 一键优化所有
async function startAllOptimization() {
  if (allOptimizationStarted.value) {
    return; // 如果已经开始优化，则直接返回
  }
  allOptimizationStarted.value = true;

  const optimizationPromises = [];
  for (let i = 0; i < processedData.value.length; i++) {
    for (const userId in processedData.value[i]) {
      if (!optimizationData[i]) {
         optimizationData[i] = {}; // 初始化外层对象
      }
       optimizationData[i][userId] = ''; // 初始化为字符串
      const text = processedData.value[i][userId].text;
      const promise = optimizeText(i, userId, text);
      optimizationPromises.push(promise);
    }
  }

  // 使用 Promise.all 并发优化
  try {
     await Promise.all(optimizationPromises);
  } catch(error){
    console.error("部分优化失败")
  }
    finally{
        allOptimizationStarted.value = false; // 优化结束
    }
}
// 优化文本 (和之前一样)
async function optimizeText(segmentIndex, userId, text) {
    try {
        const response = await fetch('http://localhost:8899/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const { value, done: readDone } = await reader.read();
            done = readDone;
            if (value) {
                const chunk = decoder.decode(value);
                // 确保 optimizationData[segmentIndex] 存在
                if (!optimizationData[segmentIndex]) {
                    optimizationData[segmentIndex] = {};
                }
                optimizationData[segmentIndex][userId] += chunk;
            }
        }
    } catch (err) {
        console.error('优化文本出错:', err);
          if (!optimizationData[segmentIndex]) {
              optimizationData[segmentIndex] = {};
            }
        optimizationData[segmentIndex][userId] = '优化失败';
    }
}
onMounted(fetchData);
</script>

<style scoped>
/* 样式部分 (与之前类似，添加 reasoning 相关的样式) */
.transcription-page {
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

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

.content-container {
  display: flex;
  justify-content: space-between;
}

.content-segment {
  flex: 1;
  padding: 10px;
  border-right: 1px solid #ccc;
}

.content-segment:last-child {
  border-right: none;
}

.user-transcription {
  margin-bottom: 15px;
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

.optimized-text-container {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.optimized-label {
  font-weight: bold;
  color: #409eff;
  margin-right: 5px;
}

.optimized-text {
    white-space: pre-line;
  word-break: break-word;
}

/* 新增的推理过程样式 */
.reasoning-label {
  font-weight: bold;
  color: #28a745; /* 绿色 */
  margin-right: 5px;
}

.reasoning-text{
    white-space: pre-line;
    word-break: break-word;
}
</style>
