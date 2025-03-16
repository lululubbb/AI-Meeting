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

      <!-- 一键生成按钮 -->
      <div class="global-buttons">
        <button @click="getAllSummaries" :disabled="summaryLoading" class="summary-all-btn">
          {{ summaryLoading ? '生成中...' : '一键生成摘要' }}
        </button>
        <button @click="getAllKeywords" :disabled="keywordLoading" class="keyword-all-btn">
          {{ keywordLoading ? '生成中...' : '一键生成关键词' }}
        </button>
        <button @click="getOverallSummary" :disabled="overallSummaryLoading" class="overall-summary-btn">
          {{ overallSummaryLoading ? '生成中...' : '生成会议整体摘要' }}
        </button>
        <button @click="getTodosAndExtensions" :disabled="todosLoading" class="todos-btn">
                      {{ todosLoading ? '生成中...' : '生成会议待办与拓展' }}
                  </button>
          <button @click="generateWordCloud" :disabled="wordCloudLoading" class="wordcloud-btn">
            {{ wordCloudLoading ? '生成中...' : '生成词云' }}
          </button>
      </div>
      <!-- 内容区域 -->
      <div class="content-container">
          <!-- ... 其他内容 ... -->
          <div v-for="(segment, segmentIndex) in processedData" :key="segmentIndex" class="content-segment">
            <div v-for="(item, userId) in segment" :key="userId" class="user-transcription">
              <!-- 使用函数生成唯一的 ref -->
              <div :ref="el => setNoteRef(el, segmentIndex, userId)" class="note" @click="toggleExpanded(segmentIndex, userId)">
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
                    <p class="optimized-text" :id="`optimized-text-${segmentIndex}-${userId}`" v-html="processedOptimizationData[segmentIndex]?.[userId]"></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 摘要卡片 -->
            <div v-if="summaries[segmentIndex]" class="summary-card">
              <p class="card-label">摘要:</p>
              <p class="summary-text" v-html="processedSummaries[segmentIndex]"></p>
            </div>

            <!-- 关键词卡片 -->
            <div v-if="keywords[segmentIndex]" class="keyword-card">
              <p class="card-label">关键词:</p>
              <p class="keyword-text">{{ keywords[segmentIndex] }}</p>
            </div>
          </div>
        </div>
       <!-- 会议整体摘要卡片 -->
      <div v-if="overallSummary" class="overall-summary-card">
          <p class="card-label">会议整体摘要:</p>
          <p class="summary-text" v-html="processedOverallSummary"></p>
      </div>
     <!-- 待办事项和词云的容器 -->
      <div class="todos-wordcloud-container">
        <!-- 会议待办与拓展卡片 -->
        <div v-if="todosAndExtensions" class="todos-card">
            <p class="card-label">会议待办与拓展:</p>
            <p class="summary-text" v-html="processedTodosAndExtensions"></p>
        </div>

        <!-- 新增：词云显示区域 -->
        <div v-if="wordCloudData && wordCloudData.length > 0" class="wordcloud-card">
            <p class="card-label">词云:</p>
            <WordCloud :wordData="wordCloudData" />
        </div>
      </div>
    </div>
    <div v-else>没有转录数据。</div>
  </div>
  <div class="overlay" v-if="overlayVisible" @click="closeOverlay">
    <div class="expanded-note" :style="expandedNoteStyle" ref="expandedNote">
      <!-- Add ref here -->
      <div class="note-header">
        <span class="user-name">{{ expandedNoteData.userName }}</span>
        <span class="expand-icon" @click.stop="closeOverlay">−</span>
      </div>
      <p class="transcription-text" style="max-height:none;">
        {{ expandedNoteData.text }}
      </p>

      <!-- 优化结果 -->
      <div class="optimized-text-container">
        <p class="optimized-label">优化结果:</p>
        <!-- 使用 v-html 渲染 Markdown -->
        <div class="expanded-optimized-text" v-html="marked(expandedNoteData.optimizedText)"></div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { ref, onMounted, computed, reactive, nextTick, watch } from 'vue';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import EChartsBar from './EChartsBar.vue';
import { marked } from 'marked'; // 导入 marked
import WordCloud from './WordCloud.vue'; // 导入词云组件

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

// 摘要和关键词
const summaries = reactive({});
const keywords = reactive({});

// 按钮的加载状态
const summaryLoading = ref(false);
const keywordLoading = ref(false);

// Overlay and Expanded Note
const overlayVisible = ref(false);
const expandedNoteStyle = ref({});
const expandedNoteData = reactive({
  userName: '',
  text: '',
  optimizedText: ''
});
const expandedNote = ref(null);

// 会议整体摘要
const overallSummary = ref('');
const overallSummaryLoading = ref(false);

// 会议待办与拓展
const todosAndExtensions = ref('');
const todosLoading = ref(false);

// 新增：词云数据和加载状态
const wordCloudData = ref([]);
const wordCloudLoading = ref(false);


// 创建一个计算属性来处理 Markdown 转换
const processedSummaries = computed(() => {
  const result = {};
  for (const key in summaries) {
    if (summaries[key]) {
      result[key] = marked(summaries[key]);
    }
  }
  return result;
});

const processedOptimizationData = computed(() => {
  const result = {};
  for (const segmentIndex in optimizationData) {
    result[segmentIndex] = {};
    for (const userId in optimizationData[segmentIndex]) {
      if (optimizationData[segmentIndex][userId]) {
        result[segmentIndex][userId] = marked(optimizationData[segmentIndex][userId]);
      }
    }
  }
  return result;
});

// 处理会议整体摘要的 Markdown 转换
const processedOverallSummary = computed(() => {
  return overallSummary.value ? marked(overallSummary.value) : '';
});


// 处理会议待办与拓展的 Markdown 转换
const processedTodosAndExtensions = computed(() => {
  return todosAndExtensions.value ? marked(todosAndExtensions.value) : '';
});

watch(overlayVisible, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      expandedNoteStyle.value = {};
    }, 400);
  }
});

function setNoteRef(el, segmentIndex, userId) {
  if (el) {
    if (!noteRefs.value[segmentIndex]) {
      noteRefs.value[segmentIndex] = {};
    }
    noteRefs.value[segmentIndex][userId] = el;
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
          color: generatePastelColor()
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

  if (index !== -1 && scrollWrapper.value[index]) {
    nextTick(() => {
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

function toggleExpanded(segmentIndex, userId) {
  const noteElement = noteRefs.value[segmentIndex]?.[userId];
  if (!noteElement) return;

  const rect = noteElement.getBoundingClientRect();

  expandedNoteStyle.value = {
    // width: `${rect.width}px`,  // 移除
    // height: `${rect.height}px`, // 移除
    // top: `${rect.top}px`,    // 移除
    // left: `${rect.left}px`,   // 移除
    // transform: 'scale(1)',  // 移除
    // transition: 'none',     // 移除
    opacity: 0              // 保留
  };

  expandedNoteData.userName = processedData.value[segmentIndex][userId].userName;
  expandedNoteData.text = processedData.value[segmentIndex][userId].text;
  expandedNoteData.optimizedText = optimizationData[segmentIndex]?.[userId] || '';
  overlayVisible.value = true;

  nextTick(() => {
    if (expandedNote.value) {
      expandedNoteStyle.value = {
        // ...expandedNoteStyle.value, // 移除
        // top: '50%',              // 移除
        // left: '50%',             // 移除
        // width: '80%',            // 移除
        // height: '80%',           // 移除
        // transform: 'translate(-50%, -50%) scale(1)', // 移除
        // transition: 'all 0.4s ease',   // 移除

        opacity: 1                      // 保留
      };
      expandedStates[segmentIndex] = expandedStates[segmentIndex] || {};
      expandedStates[segmentIndex][userId] = !expandedStates[segmentIndex][userId];
    }
  });
}

function closeOverlay() {
  //   if (!expandedNote.value) return;  //注释

  //   const originalNote = noteRefs.value[getSegmentAndUserIdFromExpanded().segmentIndex]?.[getSegmentAndUserIdFromExpanded().userId];
  //   if (!originalNote) return;       //注释

  //   const rect = originalNote.getBoundingClientRect(); //注释

  //   expandedNoteStyle.value = {       //注释
  //     ...expandedNoteStyle.value,     //注释
  //     width: `${rect.width}px`,      //注释
  //     height: `${rect.height}px`,     //注释
  //     top: `${rect.top}px`,          //注释
  //     left: `${rect.left}px`,         //注释
  //     transform: 'scale(1)',          //注释
  //     opacity: 0,                    //注释
  //     transition: 'all 0.4s ease',    //注释
  //   };                                 //注释

  for (let segmentIndex in expandedStates) {
    for (let userId in expandedStates[segmentIndex]) {
      expandedStates[segmentIndex][userId] = false;
    }
  }
  overlayVisible.value = false;
}

function getSegmentAndUserIdFromExpanded() {
  for (let segmentIndex in expandedStates) {
    for (let userId in expandedStates[segmentIndex]) {
      if (expandedStates[segmentIndex][userId] === true) {
        return { segmentIndex: segmentIndex, userId: userId };
      }
    }
  }
  return { segmentIndex: null, userId: null };
}

async function getAllSummaries() {
  summaryLoading.value = true;
  const texts = processedData.value.map(segment =>
    Object.values(segment).map(user => user.text).join(" ")
  );

  for (let i = 0; i < 5; i++) {
    summaries[i] = '';
  }

  try {
    const response = await fetch('http://localhost:8899/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let currentSegment = -1;

    while (!done) {
      const { value, done: readDone } = await reader.read();
      done = readDone;
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          let parsedLine;
          try {
            parsedLine = JSON.parse(line);
          } catch (e) {
            if (currentSegment >= 0) {
              summaries[currentSegment] += line;
            }
            continue;
          }

          if (parsedLine.segment !== undefined) {
            currentSegment = parsedLine.segment;
          } else if (parsedLine.segment_end !== undefined) {
            // 可以做些动画
          } else if (parsedLine.error) {
            summaries[currentSegment] = parsedLine.error;
          }
        }
      }
    }
  } catch (err) {
    console.error('获取摘要出错:', err);
    for (let i = 0; i < 5; i++) {
      if (!summaries[i]) {
        summaries[i] = '获取摘要失败';
      }
    }
  } finally {
    summaryLoading.value = false;
  }
}

async function getAllKeywords() {
  keywordLoading.value = true;
  const texts = processedData.value.map(segment =>
    Object.values(segment).map(user => user.text).join(" ")
  );

  for (let i = 0; i < 5; i++) {
    keywords[i] = '';
  }

  try {
    const response = await fetch('http://localhost:8899/api/extract_keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let currentSegment = -1;

    while (!done) {
      const { value, done: readDone } = await reader.read();
      done = readDone;
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          let parsedLine;
          try {
            parsedLine = JSON.parse(line);
          } catch (e) {
            if (currentSegment >= 0) {
              keywords[currentSegment] += line;
            }
            continue;
          }

          if (parsedLine.segment !== undefined) {
            currentSegment = parsedLine.segment;
          } else if (parsedLine.segment_end !== undefined) {
            // 可以做些动画
          } else if (parsedLine.error) {
            keywords[currentSegment] = parsedLine.error;
          }
        }
      }
    }
  } catch (err) {
    console.error('获取关键词出错:', err);
    for (let i = 0; i < 5; i++) {
      if (!keywords[i]) {
        keywords[i] = '获取失败';
      }
    }
  } finally {
    keywordLoading.value = false;
  }
}
// 获取会议整体摘要函数
async function getOverallSummary() {
    overallSummaryLoading.value = true;
    overallSummary.value = ''; // 清空旧的摘要

    // 将所有分段的文本合并为一个整体
    const allText = processedData.value.map(segment =>
        Object.values(segment).map(user => user.text).join(" ")
    ).join(" ");


    try {
        const response = await fetch('http://localhost:8899/api/overall_summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: allText }),
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
                overallSummary.value += chunk;
            }
        }

    } catch (err) {
        console.error('获取整体摘要出错:', err);
        overallSummary.value = '获取整体摘要失败';

    } finally {
        overallSummaryLoading.value = false;
    }
}


// 获取会议待办与拓展函数
async function getTodosAndExtensions() {
    todosLoading.value = true;
    todosAndExtensions.value = ''; // 清空旧数据

    const allText = processedData.value.map(segment =>
        Object.values(segment).map(user => user.text).join(" ")
    ).join(" ");

    try {
        const response = await fetch('http://localhost:8899/api/todos_and_extensions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: allText }),
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
                todosAndExtensions.value += chunk;
            }
        }
    } catch (err) {
        console.error('获取待办与拓展出错:', err);
        todosAndExtensions.value = '获取待办与拓展失败';
    } finally {
        todosLoading.value = false;
    }
}

// 新增：生成词云函数
async function generateWordCloud() {
    wordCloudLoading.value = true;
    wordCloudData.value = []; // 清空旧数据

    const allText = processedData.value.map(segment =>
        Object.values(segment).map(user => user.text).join(" ")
    ).join(" ");

    try {
        const response = await fetch('http://localhost:8899/api/generate_wordcloud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: allText }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        //直接使用 json()
        const data = await response.json();
        wordCloudData.value = data; // 更新词云数据
        console.log('词云数据 (展开):', ...wordCloudData.value); // 使用展开运算符
console.log('词云数据 (第一个元素):', wordCloudData.value[0]); // 打印第一个元素

    } catch (err) {
        console.error('生成词云出错:', err);
        // 可以给用户更友好的错误提示
    } finally {
        wordCloudLoading.value = false;
    }
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
  transition: box-shadow 0.3s ease;
}

.note:hover {
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
/*原样式保留,但默认不设置高度*/
.optimized-text {
  color: #495057;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

/*优化md 样式*/
.optimized-text p {
  margin-top: 0;
  margin-bottom: 1rem;
  line-height: 1.5;
}
.optimized-text h1 {
font-size: 1.2em;
margin-bottom: 0.4em;
color: #444;
}

.optimized-text h2 {
  font-size: 1.1em;
  margin-bottom: 0.3em;
  color: #555;
}

.optimized-text h3 {
  font-size: 1em;
  margin-bottom: 0.2em;
  color: #666;
}
.optimized-text strong{
font-weight: bold;
}

.optimized-text ul{
list-style-type: disc;
  margin-left: 20px;
  padding-left: 0;
}

.optimized-text ol {
  list-style-type: decimal;
  margin-left: 20px;
  padding-left: 0;
}
.optimized-text  a {
    color: #007bff;
    text-decoration: none;
  }
.optimized-text  a:hover {
        text-decoration: underline;
}

/* 行内代码 `code` */
.optimized-text code {
  font-family: 'Courier New', Courier, monospace;
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  color: #d63384;
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
  max-height: 200px; /* 设置最大高度 */
  overflow-y: auto;  /* 超出时显示滚动条 */
  transition: max-height 0.3s ease;
  position: relative;
}
/*去掉原来得.expanded-scroll,不再需要*/

.overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.5);
display: flex;
justify-content: center;
align-items: center;
z-index: 2000;
  /* 移除transition */
}

.expanded-note {
position: relative; /* 改为 relative，不再需要 absolute */
background-color: white;
padding: 20px;
border-radius: 12px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
z-index: 2001;
  width: 80%; /* 或者你想要的宽度 */
  max-width: 800px; /* 设置一个最大宽度 */
  max-height: 80vh; /* 设置最大高度为视口高度的80% */
  overflow-y: auto; /* 添加滚动条 */
/* 移除 transition */
}
/* 优化后文本的 Markdown 样式（在展开的便签中） */
.expanded-optimized-text {
    /* 这里可以复制 .optimized-text 的所有样式 */
    color: #495057;
    line-height: 1.6;
    margin: 0;
    white-space: pre-line;
    overflow-y: auto; /* 确保有滚动条 */
    max-height: 60vh; /* 或者其他合适的高度 */
}

/*原样式保留,但默认不设置高度*/
.expanded-optimized-text p {
    margin-top: 0;
    margin-bottom: 1rem;
    line-height: 1.5;
}

  /* 调整 h1 样式 */
.expanded-optimized-text h1 {
    font-size: 1.3em;
    margin-bottom: 0.4em;
    margin-top: 0.6em;
    font-weight: bold;
    line-height: 1.2;
}

  /* 调整 h2 样式 */
.expanded-optimized-text h2 {
    font-size: 1.1em;
    margin-bottom: 0.3em;
    margin-top: 0.5em;
    color: #555;
    font-weight: bold;
    line-height: 1.2;
}

  /* 调整 h3 样式 */
.expanded-optimized-text h3 {
    font-size: 1em;
    margin-bottom: 0.2em;
    margin-top: 0.4em;
    color: #666;
    font-weight: bold;
    line-height: 1.2;
}

.expanded-optimized-text strong{
    font-weight: bold;
}

.expanded-optimized-text ul{
    list-style-type: disc;
    margin-left: 20px;
    padding-left: 0;
}

.expanded-optimized-text ol {
    list-style-type: decimal;
    margin-left: 20px;
    padding-left: 0;
}
.expanded-optimized-text  a {
        color: #007bff;
        text-decoration: none;
    }
.expanded-optimized-text  a:hover {
            text-decoration: underline;
}

  /* 行内代码 `code` */
.expanded-optimized-text code {
    font-family: 'Courier New', Courier, monospace;
    background-color: #f8f9fa;
    padding: 2px 4px;
    border-radius: 3px;
    color: #d63384;
}


  /* 一键生成按钮的样式 */
.global-buttons {
  display: flex;
  justify-content: center; /* 水平居中 */
  margin-bottom: 20px;
  gap: 10px; /* 按钮之间的间距 */
}

.summary-all-btn, .keyword-all-btn, .overall-summary-btn, .todos-btn, .wordcloud-btn  {
  /* 移除之前的 float: left; */
    padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* 按钮颜色和悬停效果 */
.summary-all-btn {
  background-color: #007bff; /* 蓝色 */
  color: white;
}
.summary-all-btn:hover {
  background-color: #0056b3;
}

.keyword-all-btn {
  background-color: #28a745; /* 绿色 */
  color: white;
}
.keyword-all-btn:hover {
  background-color: #218838;
}

.overall-summary-btn {
  background-color: #17a2b8; /* 使用不同的颜色 */
  color: white;
}
.overall-summary-btn:hover {
  background-color: #138496; /* 悬停时颜色加深 */
}

.todos-btn {
  background-color: #ffc107; /* 黄色 */
  color: white;
}
.todos-btn:hover {
  background-color: #e0a800; /* 悬停时颜色加深 */
}
.wordcloud-btn{
    background-color: #6f42c1;
    color: white;
}
.wordcloud-btn:hover{
background-color: #5a3791;
}

  /* 摘要和关键词卡片样式 */
.summary-card, .keyword-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid #e0e0e0;
    max-height: 200px; /* 添加最大高度 */
    overflow-y: auto;  /* 添加垂直滚动 */
}

.card-label {
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
}

.summary-text, .keyword-text {
    color: #555;
    line-height: 1.5;
     /*  .keyword-text，保留原来的样式 */
}

/* summary md渲染优化*/
.summary-text p {
    margin-top: 0;
    margin-bottom: 1rem;
     line-height: 1.5;
}
.summary-text h1 {
  font-size: 1.2em;
  margin-bottom: 0.4em;
  color: #444;
}

.summary-text h2 {
    font-size: 1.1em;
    margin-bottom: 0.3em;
    color: #555;
}

.summary-text h3 {
    font-size: 1em;
    margin-bottom: 0.2em;
    color: #666;
}
.summary-text strong{
  font-weight: bold;
}

.summary-text ul{
list-style-type: disc;
  margin-left: 20px;
  padding-left: 0;
}

.summary-text ol {
    list-style-type: decimal;
    margin-left: 20px;
    padding-left: 0;
}
.summary-text  a {
      color: #007bff;
      text-decoration: none;
    }
.summary-text  a:hover {
        text-decoration: underline;
}

  /* 行内代码 `code` */
.summary-text code {
    font-family: 'Courier New', Courier, monospace;
    background-color: #f8f9fa;
    padding: 2px 4px;
    border-radius: 3px;
    color: #d63384;
}

  /* 会议整体摘要卡片样式 */
.overall-summary-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 15px;
    margin-bottom: 15px; /* 与下方内容的间距 */
    border: 1px solid #e0e0e0;
    max-height: 300px; /* 可以根据需要调整 */
    overflow-y: auto;
}

/* 待办事项和词云的容器 */
.todos-wordcloud-container {
  display: flex;
  justify-content: space-between; /* 两端对齐 */
  margin-bottom: 20px; /* 与下方内容的间距，保持一致 */
}

/* 待办事项卡片和词云卡片 */
.todos-card,
.wordcloud-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  border: 1px solid #e0e0e0;
  max-height: 300px;
  overflow-y: auto;
  width: calc(50% - 10px); /* 各占一半宽度，并留出间距 */
}

/* 响应式设计：小屏幕时垂直排列 */
@media (max-width: 768px) {
  .todos-wordcloud-container {
    flex-direction: column;
  }

  .todos-card,
  .wordcloud-card {
    width: 100%; /* 小屏幕时占满整个宽度 */
    margin-bottom: 10px;
  }
    /*button 组,小屏幕也需要独占一行*/
.global-buttons{
 flex-direction: column;
  }
  .content-container{
     flex-direction: column;
  }
  .content-segment{
    border-right:none;
}
}
</style>
