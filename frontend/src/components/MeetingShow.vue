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
      <button @click="startAllOptimization" :disabled="allOptimizationStarted" class="optimize-all-btn">
        一键优化
      </button>

      <!-- 内容区域 -->
      <div class="content-container">
        <div v-for="(segment, segmentIndex) in processedData" :key="segmentIndex" class="content-segment">
          <div v-for="(item, userId) in segment" :key="userId" class="user-transcription">
            <div class="note" @click="toggleExpanded(segmentIndex, userId)" :class="{ expanded: expandedStates[segmentIndex]?.[userId] }">
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
                <div class="optimized-text-scroll-wrapper" :class="{ 'expanded-scroll': expandedStates[segmentIndex]?.[userId] }" ref="scrollWrapper">
                    <p class="optimized-text">{{ optimizationData[segmentIndex][userId] }}</p>
                </div>
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
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue';
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
const allOptimizationStarted = ref(false);
const expandedStates = reactive({}); // 用于跟踪每个便签的展开状态
const scrollWrapper = ref([]); // 用于获取滚动容器的引用

const store = useStore();
const route = useRoute();
const userId = computed(() => store.state.user.uid);

const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'HH:mm');
};

// 数据获取 (与之前相同)
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

// 一键优化所有 (与之前相同)
async function startAllOptimization() {
  if (allOptimizationStarted.value) {
    return;
  }
  allOptimizationStarted.value = true;

  // 1. 构建优化任务队列 (按时间段和用户排序)
  const optimizationTasks = [];
  for (let i = 0; i < processedData.value.length; i++) { // 遍历时间段
    const segment = processedData.value[i];
    const userIds = Object.keys(segment); // 获取当前时间段的所有 userId

    // 按照 userId 在 processedData 中的顺序排序 (即垂直顺序)
    userIds.sort((a, b) => {
      // 找到 user a 在 processedData 对应 segment 中的索引位置.
      const indexA = Object.keys(segment).indexOf(a);
      const indexB = Object.keys(segment).indexOf(b);
      return indexA - indexB;
    });

    for (const userId of userIds) { // 遍历排序后的用户
      if (!optimizationData[i]) {
        optimizationData[i] = {};
      }
      optimizationData[i][userId] = ''; // 初始化
      const text = segment[userId].text;
      optimizationTasks.push({ segmentIndex: i, userId, text }); // 添加任务
    }
  }

  // 2. 顺序执行优化任务
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

// 切换展开/收起状态
function toggleExpanded(segmentIndex, userId) {
  if (!expandedStates[segmentIndex]) {
    expandedStates[segmentIndex] = {};
  }
   if (expandedStates[segmentIndex][userId] === undefined) {
      expandedStates[segmentIndex][userId] = false; // 默认状态
  }
  expandedStates[segmentIndex][userId] = !expandedStates[segmentIndex][userId];

  // 展开或收起后，确保滚动条位置正确
  if (expandedStates[segmentIndex][userId]) {
    // 展开时，不需要额外操作，因为 maximized-scroll 会让滚动条消失
  } else {
      // 延迟滚动，确保DOM更新
      nextTick(() => {
          scrollToBottom(segmentIndex, userId);
      });
  }
}


// 滚动到容器底部 (优化)
function scrollToBottom(segmentIndex, userId) {
    const index = getScrollWrapperIndex(segmentIndex, userId);
    if (index !== -1 && scrollWrapper.value[index]) {
        scrollWrapper.value[index].scrollTop = scrollWrapper.value[index].scrollHeight;
    }
}


// 获取 scrollWrapper 的索引
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


// 监听 optimizationData 变化，自动滚动
watch(optimizationData, (newVal, oldVal) => {
  nextTick(() => { // 使用 nextTick
    for (let segmentIndex in newVal) {
      for (let userId in newVal[segmentIndex]) {
        if (newVal[segmentIndex][userId] !== oldVal?.[segmentIndex]?.[userId]) {
          if (!expandedStates[segmentIndex]?.[userId]) {
              scrollToBottom(parseInt(segmentIndex), userId);
          }
        }
      }
    }
  });
}, { deep: true });


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
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden; /* 确保内容在折叠时被裁剪 */
   border: 1px solid #ced4da;
}

.note:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);

}

.note-header{
    display: flex;
    justify-content: space-between;
    align-items: center; /* 垂直居中 */

}
.expand-icon{
 font-size: 1.2em;
  color: #007bff;
}

.user-name {
  font-weight: 600;
  color: #007bff;
    margin-right: auto; /* 将用户名推到最左边 */
}

.transcription-text {
   margin: 10px 0;
  line-height: 1.6;
  color: #495057;
  max-height: 4.8em; /* 3行 x 1.6em 行高 */
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
}

.truncated{
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 设置最大行数 */
  -webkit-box-orient: vertical;  /* 垂直排列 */
  overflow: hidden;    /* 隐藏溢出的文本 */
}

.note.expanded {
    height: auto;
    .transcription-text{
         max-height: none;
    }
}

.note-header::after {
  content: '';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 10px;
  background-color: #28a745; /* 或您喜欢的指示颜色 */
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

 /* 优化全部按钮样式 */
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
    display: block; /* 设置为块级元素 */
    margin-left: auto; /* 自动左边距 */
    margin-right: auto; /* 自动右边距 */
}

.optimize-all-btn:hover {
    background-color: #218838;
}
.optimize-all-btn:disabled {
    background-color: #6c757d;  /* 禁用时为灰色 */
    cursor: not-allowed;      /* 禁用时鼠标样式为禁止 */
}

/* 滚动容器样式 */
.optimized-text-scroll-wrapper {
  max-height: 4.8em;  /* 3 行的高度 */
  overflow-y: auto; /* 垂直滚动 */
  transition: max-height 0.3s ease; /* 平滑过渡 */
    position: relative;
}
.optimized-text-scroll-wrapper.expanded-scroll {
    max-height: none; /* 展开时无最大高度限制 */
     overflow-y: visible;
}
</style>
