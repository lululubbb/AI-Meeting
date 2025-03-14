<template>
  <div class="transcription-page">
    <h1>会议转录记录</h1>
    <div class="timeline-container">
      <div v-for="(segment, index) in timeSegments" :key="index" class="timeline-segment">
        <span class="emoji">{{ segment.emoji }}</span>
        <span class="time">{{ formatTime(segment.start) }} - {{ formatTime(segment.end) }}</span>
      </div>
    </div>
    <!-- ECharts 图表 -->
    <EChartsBar :chartData="chartData" v-if="chartData" />
    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="transcriptionData && transcriptionData.length > 0">

      <!-- 优化按钮 (全局) -->
      <button @click="startAllOptimization" :disabled="allOptimizationStarted" class="optimize-all-btn">
        一键优化
      </button>

      <!-- 内容区域 -->
      <div class="content-container">
        <div v-for="(segment, segmentIndex) in processedData" :key="segmentIndex" class="content-segment">
          <div v-for="(item, userId) in segment" :key="userId" class="user-transcription">
            <!-- 使用函数生成唯一的 ref -->
            <div :ref="el => setNoteRef(el, segmentIndex, userId)" class="note"
              @click="toggleExpanded(segmentIndex, userId)">
              <div class="note-header">
                <span class="user-name">{{ item.userName }}</span>
                <span class="expand-icon">{{ expandedStates[segmentIndex]?.[userId] ? '−' : '+' }}</span>
              </div>

              <p class="transcription-text" :class="{ 'truncated': !expandedStates[segmentIndex]?.[userId] }">
                {{ item.text }}
              </p>

              <!-- 优化结果 -->
              <div class="optimized-text-container" v-if="optimizationData[segmentIndex] && optimizationData[segmentIndex][userId]">
                <p class="optimized-label">优化结果:</p>
                <div class="optimized-text-scroll-wrapper" :class="{ 'expanded-scroll': expandedStates[segmentIndex]?.[userId] }"
                  ref="scrollWrapper">
                  <p class="optimized-text" :id="`optimized-text-${segmentIndex}-${userId}`">{{
                    getLatestThreeLines(optimizationData[segmentIndex][userId]) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>没有转录数据。</div>
  </div>
  <div class="overlay" v-if="overlayVisible" @click="closeOverlay">
    <div class="expanded-note" :style="expandedNoteStyle">
    <div class="note-header">
       <span class="user-name">{{ expandedNoteData.userName}}</span>
         <span class="expand-icon" @click.stop="closeOverlay">−</span>
     </div>
          <p class="transcription-text"  style="max-height:none;">
            {{ expandedNoteData.text }}
           </p>

      <!-- 优化结果 -->
        <div class="optimized-text-container">
           <p class="optimized-label">优化结果:</p>
              <p class="optimized-text">{{ expandedNoteData.optimizedText}}</p>
         </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick } from 'vue';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import EChartsBar from './EChartsBar.vue';



const transcriptionData = ref(null);
const isLoading = ref(false);
const error = ref(null);
const timeSegments = ref([]);
const processedData = ref([]);
const optimizationData = reactive({});
const allOptimizationStarted = ref(false);
const expandedStates = reactive({});
const scrollWrapper = ref([]);
const chartData = ref(null);
const store = useStore();
const route = useRoute();
const userId = computed(() => store.state.user.uid);
const noteRefs = ref({});
//添加overlay
const overlayVisible = ref(false);
const expandedNoteStyle = ref({});
const expandedNoteData = reactive({
   userName: '',
   text: '',
   optimizedText: ''
});

function setNoteRef(el, segmentIndex, userId) {
  if (el) {
    if (!noteRefs.value[segmentIndex]) {
      noteRefs.value[segmentIndex] = {};
    }
    noteRefs.value[segmentIndex][userId] = el;  //el是dom对象
  }
}

const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'HH:mm');
};

async function fetchData() {
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
      generateChartData();
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

function generateChartData() {
  const seriesData = [];
  const userNames = {};

  const generatePastelColor = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 25 + Math.floor(Math.random() * 50);
    const l = 70 + Math.floor(Math.random() * 20);
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  for (let i = 0; i < processedData.value.length; i++) {
    const segment = processedData.value[i];
    for (const userId in segment) {
      if (!userNames[userId]) {
        userNames[userId] = {
          name: segment[userId].userName,
          color: generatePastelColor(),
        };
      }
    }
  }

  for (const userId in userNames) {
    const userData = {
      name: userNames[userId].name,
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: {
        color: userNames[userId].color
      }
    };

    for (let i = 0; i < processedData.value.length; i++) {
      const segment = processedData.value[i];
      if (segment[userId]) {
        userData.data.push(segment[userId].text.length);
      } else {
        userData.data.push(0);
      }
    }
    seriesData.push(userData);
  }

  const legendData = Object.values(userNames).map(user => user.name);
  const xAxisData = timeSegments.value.map(segment => formatTime(segment.start));

  chartData.value = {
    legendData,
    xAxisData,
    seriesData,
  };
}

async function startAllOptimization() {
  if (allOptimizationStarted.value) {
    return;
  }
  allOptimizationStarted.value = true;

  const optimizationTasks = [];
  for (let i = 0; i < processedData.value.length; i++) {
    const segment = processedData.value[i];
    const userIds = Object.keys(segment);

    userIds.sort((a, b) => {
      const indexA = Object.keys(segment).indexOf(a);
      const indexB = Object.keys(segment).indexOf(b);
      return indexA - indexB;
    });

    for (const userId of userIds) {
      if (!optimizationData[i]) {
        optimizationData[i] = {};
      }
      optimizationData[i][userId] = '';
      const text = segment[userId].text;
      optimizationTasks.push({ segmentIndex: i, userId, text });
    }
  }

  try {
    for (const task of optimizationTasks) {
      await optimizeText(task.segmentIndex, task.userId, task.text);
    }
  } catch (error) {
    console.error("部分优化失败");
  } finally {
    allOptimizationStarted.value = false;
  }
}

async function optimizeText(segmentIndex, userId, text) {
  try {
    const response = await fetch('http://localhost:8899/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
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
        if (!optimizationData[segmentIndex]) {
          optimizationData[segmentIndex] = {};
        }
        optimizationData[segmentIndex][userId] += chunk;
          nextTick(() => {
            scrollToBottom(segmentIndex, userId);
          });
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

function getLatestThreeLines(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const latestThree = lines.slice(-3);
  return latestThree.join('\n');
}

function scrollToBottom(segmentIndex, userId) {
    const index = getScrollWrapperIndex(segmentIndex, userId);
    if(scrollWrapper.value[index]){
        nextTick(()=>{
            scrollWrapper.value[index].scrollTop = scrollWrapper.value[index].scrollHeight;
        })
    }
}

function getScrollWrapperIndex(segmentIndex, userId) {
  let index = 0;
  for (let i = 0; i < segmentIndex; i++) {
    for (let u in processedData.value[i]) {
      index++;
    }
  }
  for (let u in processedData.value[segmentIndex]) {
    if (u === userId) {
      break;
    }
    index++;
  }
  return index;
}

// 添加展开卡片逻辑 (修改)
function toggleExpanded(segmentIndex, userId) {
    // 获取点击的便签元素
    const noteElement = noteRefs.value[segmentIndex]?.[userId];
    if (!noteElement) return;


    // 记录原始尺寸和位置
    const rect = noteElement.getBoundingClientRect();
    expandedNoteStyle.value = {
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      top: `${rect.top}px`,
      left: `${rect.left}px`,
    };

     expandedNoteData.userName = processedData.value[segmentIndex][userId].userName;
     expandedNoteData.text = processedData.value[segmentIndex][userId].text;
     expandedNoteData.optimizedText = optimizationData[segmentIndex]?.[userId] || '';


    // 显示遮罩层
     overlayVisible.value = true;

      nextTick(() => {
        // 设置动画的最终状态
        expandedNoteStyle.value = {
          width: '80%',
          height: '80%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)', // 居中
       };
    })
    expandedStates[segmentIndex] = expandedStates[segmentIndex] || {};
    expandedStates[segmentIndex][userId] = !expandedStates[segmentIndex][userId]

}


// 关闭遮罩层
function closeOverlay() {

   overlayVisible.value = false;

    for (let segmentIndex in expandedStates) {
        for (let userId in expandedStates[segmentIndex]) {
            expandedStates[segmentIndex][userId] = false;
        }
    }
      nextTick(() => {
       expandedNoteStyle.value = {};  //重置为空
   });
}

onMounted(fetchData);
</script>

<style scoped>
.transcription-page {
  padding: 30px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
  color: #343a40;
}

h1 {
  color: #343a40;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 600;
}

.timeline-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 12px;
}

.timeline-segment {
  flex: 1;
  text-align: center;
}

.timeline-segment .emoji {
  font-size: 24px;
  margin-bottom: 8px;
}

.timeline-segment .time {
  font-size: 14px;
  color: #6c757d;
}

.content-container {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.content-segment {
  flex: 1;
  padding: 0 10px;
  border-right: 1px solid #dee2e6;
}

.content-segment:last-child {
  border-right: none;
}

.user-transcription {
  margin-bottom: 20px;
}

/* 便签样式 */
.note {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid #ced4da;
   transition:  box-shadow 0.3s ease;  /* 平滑过渡效果 */
}


.note:hover {
  /* transform: translateY(-5px); */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expand-icon {
  font-size: 1.2em;
  color: #007bff;
}

.user-name {
  font-weight: 600;
  color: #007bff;
  margin-right: auto;
}

.transcription-text {
  margin: 10px 0;
  line-height: 1.6;
  color: #495057;
  max-height: 4.8em;
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
}

.truncated {
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-header::after {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 10px;
  background-color: #28a745;
  border-radius: 50%;
  opacity: 0.8;
}

.optimized-text-container {
  margin-top: 15px;
  border-top: 1px solid #dee2e6;
  padding-top: 15px;
}

.optimized-label {
  font-weight: 600;
  color: #28a745;
  margin-bottom: 8px;
  display: block;
}

.optimized-text {
  color: #495057;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.optimize-all-btn {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-bottom: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.optimize-all-btn:hover {
  background-color: #218838;
}

.optimize-all-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.optimized-text-scroll-wrapper {
  max-height: 4.8em;
  overflow-y: auto;
  transition: max-height 0.3s ease;
  position: relative;
}

.optimized-text-scroll-wrapper.expanded-scroll {
  max-height: none;
  overflow-y: visible;
}
/*遮罩层以及放大内容*/
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center; /* 水平居中 */
    align-items: center;     /* 垂直居中 */
    z-index: 2000; /* 确保在最上层 */
    transition: opacity 0.4s ease;

}

.expanded-note {
   position: absolute;
   /* top: 50%;
  left: 50%; */
  /* transform: translate(-50%, -50%); */
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
   z-index: 2001;/*比overlay高*/
  transition: all 0.4s ease; /* 添加过渡效果 */

}
</style>
