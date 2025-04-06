<template>
  <div class="transcription-page">
    <!-- 导航栏 -->
    <nav class="navbar">
  <ul>
    <li><a :class="{ 'active': activeTab === 'overview' }" href="#overview">会议总览</a></li>
    <li><a :class="{ 'active': activeTab === 'content' }" href="#content">会议内容记录</a></li>
    <li><a :class="{ 'active': activeTab === 'summary' }" href="#summary">会议整理</a></li>
  </ul>
</nav>



    <!-- 会议总览 -->
    <section id="overview">
      <div class="section-header">
        <h2>会议总览</h2>
      </div>
      
      <div class="timeline-container">
        <div v-for="(segment, index) in timeSegments" :key="index" class="timeline-segment">
          <span class="emoji">{{ segment.emoji }}</span>
          <span class="time">{{ formatTime(segment.start) }} - {{ formatTime(segment.end) }}</span>
        </div>
      </div>
    </section>


    <!-- ECharts 图表 -->
    <div class="echart-container">
      <EChartsBar ref="echart" :chartData="chartData" v-if="chartData"/>
    </div>
    <ExportButtons 
      :transcriptionData="transcriptionData"
      :processedData="processedData"
      :optimizationData="optimizationData"
      :summaries="summaries"
      :keywords="keywords"
      :overallSummary="overallSummary"
      :todosAndExtensions="todosAndExtensions"
      :wordCloudData="wordCloudData"
      :meetingTitle="meetingTitle"
    />
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="transcriptionData && transcriptionData.length > 0">

      <!-- 会议内容记录 -->
      <section id="content">  
        <div class="section-header">
          <h2>会议内容记录</h2>
        </div>
        <!-- 优化按钮 (全局) -->
        <button @click="startAllOptimization" :disabled="allOptimizationStarted" class="optimize-all-btn">
          {{ allOptimizationStarted ? '优化中...' : '一键优化' }}
          <span v-if="allOptimizationStarted" class="btn-spinner"></span>
        </button>

        <!-- 一键生成按钮 -->
        <div class="global-buttons">
          <button @click="getAllSummaries" :disabled="summaryLoading" class="summary-all-btn action-btn">
            <span class="btn-text">{{ summaryLoading ? '生成中...' : '一键生成摘要' }}</span>
            <span v-if="summaryLoading" class="btn-spinner"></span>
          </button>
          <button @click="getAllKeywords" :disabled="keywordLoading" class="keyword-all-btn action-btn">
            <span class="btn-text">{{ keywordLoading ? '生成中...' : '一键生成关键词' }}</span>
            <span v-if="keywordLoading" class="btn-spinner"></span>
          </button>
          <button @click="getOverallSummary" :disabled="overallSummaryLoading" class="overall-summary-btn action-btn">
            <span class="btn-text">{{ overallSummaryLoading ? '生成中...' : '生成会议整体摘要' }}</span>
            <span v-if="overallSummaryLoading" class="btn-spinner"></span>
          </button>
          <button @click="getTodosAndExtensions" :disabled="todosLoading" class="todos-btn action-btn">
            <span class="btn-text">{{ todosLoading ? '生成中...' : '生成会议待办与拓展' }}</span>
            <span v-if="todosLoading" class="btn-spinner"></span>
          </button>
          <button @click="generateWordCloud" :disabled="wordCloudLoading" class="wordcloud-btn action-btn">
            <span class="btn-text">{{ wordCloudLoading ? '生成中...' : '生成词云' }}</span>
            <span v-if="wordCloudLoading" class="btn-spinner"></span>
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="content-container">
          <div v-for="(segment, segmentIndex) in processedData" :key="segmentIndex" class="content-segment">
            <div v-for="(item, userId) in segment" :key="userId" class="user-transcription">
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
                    <div class="optimized-text markdown-content" :id="`optimized-text-${segmentIndex}-${userId}`" v-html="processedOptimizationData[segmentIndex]?.[userId]"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 摘要卡片 -->
            <div v-if="summaries[segmentIndex]" class="summary-card">
              <p class="card-label">摘要:</p>
              <div class="summary-text markdown-content" v-html="processedSummaries[segmentIndex]"></div>
            </div>

            <!-- 关键词卡片 -->
            <div v-if="keywords[segmentIndex]" class="keyword-card">
              <p class="card-label">关键词:</p>
              <div class="keyword-tags">
                <span v-for="(keyword, idx) in keywords[segmentIndex].split('，')" :key="idx" class="keyword-tag">
                  {{ keyword.trim() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>  

      <section id="summary">
        <div class="section-header">
          <h2>会议整理</h2>
        </div>

        <!-- 会议整体摘要卡片 -->
        <div v-if="overallSummary" class="overall-summary-card">
          <h3>会议整体摘要</h3>
          <div class="summary-text markdown-content" v-html="processedOverallSummary"></div>
        </div>

        <!-- 待办事项和词云的容器 -->
        <div class="todos-wordcloud-container">
          <!-- 会议待办与拓展卡片 -->
          <div v-if="todosAndExtensions" class="todos-card">
            <h3>会议待办</h3>
            <div class="summary-text markdown-content" v-html="processedTodosAndExtensions"></div>
          </div>

          <!-- 新增：词云显示区域 -->
          <div v-if="wordCloudData && wordCloudData.length > 0" class="wordcloud-card">
            <h3>会议词云</h3>
            <WordCloud :wordData="wordCloudData" />
          </div>
        </div>
      </section>
    </div>
    <div v-else class="no-data-message">没有转录数据。</div>
  </div>
  
  <!-- 扩展浮层 -->
  <div class="overlay" v-if="overlayVisible" @click="closeOverlay">
    <div class="expanded-note" @click.stop>
      <div class="note-header">
        <span class="user-name">{{ expandedNoteData.userName }}</span>
        <span class="close-icon" @click.stop="closeOverlay">×</span>
      </div>
      <div class="expanded-content">
        <h4>原始内容</h4>
        <p class="transcription-text full-text">
          {{ expandedNoteData.text }}
        </p>

        <!-- 优化结果 -->
        <div class="expanded-optimized-container" v-if="expandedNoteData.optimizedText">
          <h4>优化结果</h4>
          <div class="expanded-optimized-text markdown-content" v-html="marked(expandedNoteData.optimizedText)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick, watch, onUnmounted } from 'vue';
import FirestoreService from '../services/FirestoreService.js';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import EChartsBar from './EChartsBar.vue';
import { marked } from 'marked'; // 导入 marked
import WordCloud from './WordCloud.vue'; // 导入词云组件
import backgroundImageSrc from '@/assets/intro1.png'; // 导入图片
// 添加活动标签状态
import ExportButtons from './ExportButton.vue';
const activeTab = ref('overview');

// 设置活动标签的方法
function setActiveTab(tab) {
  activeTab.value = tab;
}

// 监听滚动，自动更新活动标签
function updateActiveTabOnScroll() {
  const overviewSection = document.getElementById('overview');
  const contentSection = document.getElementById('content');
  const summarySection = document.getElementById('summary');
  
  const scrollPosition = window.scrollY + 100; // 增加一点偏移量以提高准确性
  
  if (summarySection && scrollPosition >= summarySection.offsetTop) {
    activeTab.value = 'summary';
  } else if (contentSection && scrollPosition >= contentSection.offsetTop) {
    activeTab.value = 'content';
  } else if (overviewSection && scrollPosition >= overviewSection.offsetTop) {
    activeTab.value = 'overview';
  }
}

// 在 onMounted 钩子中添加滚动监听
onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', updateActiveTabOnScroll);
  
  // 初始化活动标签
  nextTick(() => {
    updateActiveTabOnScroll();
  });
});

// 在 onUnmounted 钩子中移除滚动监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', updateActiveTabOnScroll);
});
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
const expandedNoteData = reactive({
  userName: '',
  text: '',
  optimizedText: ''
});

// 会议整体摘要
const overallSummary = ref('');
const overallSummaryLoading = ref(false);

// 会议待办与拓展
const todosAndExtensions = ref('');
const todosLoading = ref(false);

// 新增：词云数据和加载状态
const wordCloudData = ref([]);
const wordCloudLoading = ref(false);

const echart = ref(null);

// 修改 MeetingShow.vue 中的 handleResize 函数
const handleResize = () => {
  if (echart.value && typeof echart.value.resize === 'function') {
    echart.value.resize(); // 只有当 resize 是函数时才调用
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

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
      
      // 加载已保存的优化文本(如果有)
      if (meetingData.optimizedTexts) {
        Object.keys(meetingData.optimizedTexts).forEach(segmentIndex => {
          Object.keys(meetingData.optimizedTexts[segmentIndex]).forEach(userId => {
            if (!optimizationData[segmentIndex]) {
              optimizationData[segmentIndex] = {};
            }
            optimizationData[segmentIndex][userId] = meetingData.optimizedTexts[segmentIndex][userId];
          });
        });
        console.log('已加载优化文本');
      }
      
      // 加载已保存的摘要(如果有)
      if (meetingData.summaries) {
        Object.keys(meetingData.summaries).forEach(segmentIndex => {
          summaries[segmentIndex] = meetingData.summaries[segmentIndex];
        });
        console.log('已加载摘要');
      }
      
      // 加载已保存的关键词(如果有)
      if (meetingData.keywords) {
        Object.keys(meetingData.keywords).forEach(segmentIndex => {
          keywords[segmentIndex] = meetingData.keywords[segmentIndex];
        });
        console.log('已加载关键词');
      }
      
      // 加载已保存的整体摘要(如果有)
      if (meetingData.overallSummary) {
        overallSummary.value = meetingData.overallSummary;
        console.log('已加载整体摘要');
      }
      
      // 加载已保存的待办与拓展(如果有)
      if (meetingData.todosAndExtensions) {
        todosAndExtensions.value = meetingData.todosAndExtensions;
        console.log('已加载待办与拓展');
      }
      
      // 加载已保存的词云数据(如果有)
      if (meetingData.wordCloudData) {
        wordCloudData.value = meetingData.wordCloudData;
        console.log('已加载词云数据');
      }
      
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
    let optimizedContent = ''; // 用于累积完整的优化内容

    while (!done) {
      const { value, done: readDone } = await reader.read();
      done = readDone;
      if (value) {
        const chunk = decoder.decode(value);
        if (!optimizationData[segmentIndex]) {
          optimizationData[segmentIndex] = {};
        }
        optimizationData[segmentIndex][userId] += chunk;
        optimizedContent += chunk; // 累积完整内容
        nextTick(() => {
          scrollToBottom(segmentIndex, userId);
        });
      }
    }

    // 保存到 Firebase
    saveOptimizedTextToFirebase(segmentIndex, userId, optimizedContent);

  } catch (err) {
    console.error('优化文本出错:', err);
    if (!optimizationData[segmentIndex]) {
      optimizationData[segmentIndex] = {};
    }
    optimizationData[segmentIndex][userId] = '优化失败';
  }
}

async function saveOptimizedTextToFirebase(segmentIndex, userId, content) {
  try {
    const meetingId = route.params.meetingId;
    const currentUserId = store.state.user.uid;
    
    // 获取当前的优化文本数据（如果存在）
    let optimizedTexts = {};
    const meetingData = await FirestoreService.getMeetingHistory(currentUserId, meetingId);
    if (meetingData && meetingData.optimizedTexts) {
      optimizedTexts = meetingData.optimizedTexts;
    }
    
    // 更新优化文本
    if (!optimizedTexts[segmentIndex]) {
      optimizedTexts[segmentIndex] = {};
    }
    optimizedTexts[segmentIndex][userId] = content;
    
    // 保存到 Firebase
    await FirestoreService.saveOptimizedText(currentUserId, meetingId, optimizedTexts);
    console.log(`优化文本已保存到 Firebase: 段落 ${segmentIndex}, 用户 ${userId}`);
    
  } catch (error) {
    console.error('保存优化文本到 Firebase 失败:', error);
  }
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
  expandedNoteData.userName = processedData.value[segmentIndex][userId].userName;
  expandedNoteData.text = processedData.value[segmentIndex][userId].text;
  expandedNoteData.optimizedText = optimizationData[segmentIndex]?.[userId] || '';
  overlayVisible.value = true;
}

function closeOverlay() {
  overlayVisible.value = false;
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
    let summaryTexts = {}; // 用于保存完整的摘要内容

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
              
              // 同时累积完整摘要
              if (!summaryTexts[currentSegment]) {
                summaryTexts[currentSegment] = '';
              }
              summaryTexts[currentSegment] += line;
            }
            continue;
          }

          if (parsedLine.segment !== undefined) {
            currentSegment = parsedLine.segment;
          } else if (parsedLine.segment_end !== undefined) {
            // 可以做些动画
          } else if (parsedLine.error) {
            summaries[currentSegment] = parsedLine.error;
            summaryTexts[currentSegment] = parsedLine.error;
          }
        }
      }
    }

    // 保存到 Firebase
    await saveSummariesToFirebase(summaryTexts);

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

async function saveSummariesToFirebase(summaryTexts) {
  try {
    const meetingId = route.params.meetingId;
    const currentUserId = store.state.user.uid;
    
    // 保存到 Firebase
    await FirestoreService.saveSummaries(currentUserId, meetingId, summaryTexts);
    console.log(`摘要已保存到 Firebase`);
    
  } catch (error) {
    console.error('保存摘要到 Firebase 失败:', error);
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
    let keywordTexts = {}; // 用于保存完整的关键词内容

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
              
              // 同时累积完整关键词
              if (!keywordTexts[currentSegment]) {
                keywordTexts[currentSegment] = '';
              }
              keywordTexts[currentSegment] += line;
            }
            continue;
          }

          if (parsedLine.segment !== undefined) {
            currentSegment = parsedLine.segment;
          } else if (parsedLine.segment_end !== undefined) {
            // 可以做些动画
          } else if (parsedLine.error) {
            keywords[currentSegment] = parsedLine.error;
            keywordTexts[currentSegment] = parsedLine.error;
          }
        }
      }
    }

    // 保存到 Firebase
    await saveKeywordsToFirebase(keywordTexts);

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

async function saveKeywordsToFirebase(keywordTexts) {
  try {
    const meetingId = route.params.meetingId;
    const currentUserId = store.state.user.uid;
    
    // 保存到 Firebase
    await FirestoreService.saveKeywords(currentUserId, meetingId, keywordTexts);
    console.log(`关键词已保存到 Firebase`);
    
  } catch (error) {
    console.error('保存关键词到 Firebase 失败:', error);
  }
}

// 接续上一部分代码...

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
        let fullSummary = ''; // 用于累积完整的摘要

        while (!done) {
            const { value, done: readDone } = await reader.read();
            done = readDone;
            if (value) {
                const chunk = decoder.decode(value);
                overallSummary.value += chunk;
                fullSummary += chunk; // 累积完整摘要
            }
        }

        // 保存到 Firebase
        await saveOverallSummaryToFirebase(fullSummary);

    } catch (err) {
        console.error('获取整体摘要出错:', err);
        overallSummary.value = '获取整体摘要失败';

    } finally {
        overallSummaryLoading.value = false;
    }
}

async function saveOverallSummaryToFirebase(summary) {
  try {
    const meetingId = route.params.meetingId;
    const currentUserId = store.state.user.uid;
    
    // 保存到 Firebase
    await FirestoreService.saveOverallSummary(currentUserId, meetingId, summary);
    console.log(`整体摘要已保存到 Firebase`);
    
  } catch (error) {
    console.error('保存整体摘要到 Firebase 失败:', error);
  }
}

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
        let fullTodos = ''; // 用于累积完整的待办与拓展

        while (!done) {
            const { value, done: readDone } = await reader.read();
            done = readDone;
            if (value) {
                const chunk = decoder.decode(value);
                todosAndExtensions.value += chunk;
                fullTodos += chunk; // 累积完整内容
            }
        }

        // 保存到 Firebase
        await saveTodosToFirebase(fullTodos);

    } catch (err) {
        console.error('获取待办与拓展出错:', err);
        todosAndExtensions.value = '获取待办与拓展失败';
    } finally {
        todosLoading.value = false;
    }
}

async function saveTodosToFirebase(todos) {
  try {
    const meetingId = route.params.meetingId;
    const currentUserId = store.state.user.uid;
    
    // 保存到 Firebase
    await FirestoreService.saveTodosAndExtensions(currentUserId, meetingId, todos);
    console.log(`待办与拓展已保存到 Firebase`);
    
  } catch (error) {
    console.error('保存待办与拓展到 Firebase 失败:', error);
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
        
        // 保存到 Firebase
        await saveWordCloudToFirebase(data);

    } catch (err) {
        console.error('生成词云出错:', err);
        // 可以给用户更友好的错误提示
    } finally {
        wordCloudLoading.value = false;
    }
}

async function saveWordCloudToFirebase(wordcloudData) {
  try {
    const meetingId = route.params.meetingId;
    const currentUserId = store.state.user.uid;
    
    // 保存到 Firebase
    await FirestoreService.saveWordCloudData(currentUserId, meetingId, wordcloudData);
    console.log(`词云数据已保存到 Firebase`);
    
  } catch (error) {
    console.error('保存词云数据到 Firebase 失败:', error);
  }
}

onMounted(fetchData);

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

</script>

<style scoped>
/* 设置全局变量 */
:root {
  --primary-color: #4a6bff;
  --primary-light: #e8eeff;
  --secondary-color: #8a54d8;
  --accent-color: #0aacb6;
  --text-color: #333;
  --text-light: #666;
  --background-color: #f5f7fa; /* 更改为浅灰色背景 */
  --card-background: #ffffff; /* 保持卡片为白色 */
  --border-color: #e0e0e0;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
  --border-radius-sm: 6px;
  --border-radius-md: 12px;
  --border-radius-lg: 20px;
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  /* 暗色模式 */
  @media (prefers-color-scheme: dark) {
  .expanded-note {
    background-color: var(--card-background); /* 确保暗色模式下背景色正确 */
    color: var(--text-color); /* 确保暗色模式下文字颜色正确 */
  }
  
    .expanded-content {
    background-color: var(--card-background);
    color: var(--text-color);
  }
}
}

/* 整体页面样式 */
.transcription-page {
  font-family: var(--font-family);
  padding: 30px;
  background-color: var(--background-color);
  color: var(--text-color);
  max-width: 1800px;
  margin: 0 auto;
  line-height: 1.6;
}


/* 导航栏左上角样式 */
.navbar {
  position: fixed;
  top: 30;
  left: 0;
  background-color: var(--card-background);
  padding: 10px 15px;
  border-radius: 0 0 var(--border-radius-md) 0;
  box-shadow: var(--shadow-sm);
  z-index: 1100;
  max-width: 200px;
}

.navbar ul {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}

.navbar li {
  margin: 8px 0;
}

.navbar a {
  position: relative;
  text-decoration: none;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-normal);
  display: block;
}

.navbar a:hover {
  color: var(--primary-color);
  background-color: var(--primary-light);
  transform: translateX(3px);
}

.navbar a::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 0;
  top: 50%;
  left: 0;
  background-color: var(--primary-color);
  transition: all 0.3s ease;
  transform: translateY(-50%);
}

.navbar a:hover::after {
  height: 70%;
}

/* 适应主内容区域 */
.transcription-page {
  padding-left: 21px; /* 为左侧导航留出空间 */
}

/* 调整标签栏位置 */
.meeting-tabs-sticky {
  left: 21px; /* 与左侧内容对齐 */
  width: calc(100% - 210px);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .navbar {
    position: static;
    max-width: 100%;
    border-radius: var(--border-radius-md);
    margin-bottom: 20px;
  }
  
  .navbar ul {
    flex-direction: row;
    justify-content: center;
  }
  
  .navbar li {
    margin: 0 10px;
  }
  
  .navbar a:hover {
    transform: translateY(-2px);
  }
  
  .navbar a::after {
    width: 0;
    height: 3px;
    bottom: 0;
    left: 50%;
    top: auto;
    transform: translateX(-50%);
  }
  
  .navbar a:hover::after {
    width: 70%;
    height: 3px;
  }
  
  .transcription-page {
    padding-left: 30px;
  }
  
  .meeting-tabs-sticky {
    left: 0;
    width: 100%;
  }
}
/* 修改固定标签栏的样式，使其与顶部图片中样式一致 */
.meeting-tabs-sticky {
  position: sticky;
  top: 70px; /* 在顶部导航栏下方固定 */
  z-index: 999;
  /* background-color: var(--background-color); */
  padding: 0;
  margin-bottom: 30px;
}

.meeting-tabs {
  display: flex;
  justify-content: center;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  border: none;
  border-bottom: 1px solid var(--border-color);
}

.meeting-tab {
  flex: 1;
  text-align: center;
  padding: 15px 20px;
  text-decoration: none;
  color: var(--text-color);
  border-radius: 0;
  transition: all var(--transition-normal);
  font-weight: 500;
  position: relative;
  max-width: 200px;
}

.meeting-tab:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.meeting-tab.active {
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
}

/* 移除三角形指示器 */
.meeting-tab.active::after {
  display: none;
}

/* 添加下划线指示器，与图片中的蓝色线条一致 */
.meeting-tab.active::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--primary-color);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .meeting-tabs {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
    justify-content: flex-start;
  }
  
  .meeting-tab {
    flex: 0 0 auto;
    padding: 12px 15px;
  }
}
/* 页面区块样式 */
section {
  margin-bottom: 40px;
  scroll-margin-top: 130px; /* 增加滚动边距，以避免被固定导航遮挡 */
  padding: 20px;
  border-radius: var(--border-radius-md);
  background-color: var(--card-background);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-normal);
}

section:hover {
  box-shadow: var(--shadow-md);
}

.section-header {
  position: relative;
  margin-bottom: 25px;
  text-align: center;
}

h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  position: relative;
  display: inline-block;
}

h2::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--secondary-color);
  margin-top: 0;
  margin-bottom: 15px;
}

h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 12px;
  border-left: 4px solid var(--accent-color);
  padding-left: 10px;
}
/* 移动端导航栏优化 */
@media (max-width: 768px) {
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.7); /* 半透明背景 */
    backdrop-filter: blur(10px); /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(10px); /* Safari 兼容 */
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 0;
    margin: 0;
    z-index: 1200;
    border-radius: 0;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid rgba(230, 230, 230, 0.7);
  }
  
  .navbar ul {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
    padding: 0;
  }
  
  .navbar li {
    margin: 0;
    flex: 1;
    text-align: center;
  }
  
  .navbar a {
    display: block;
    padding: 15px 8px;
    font-size: 14px;
    border-radius: 0;
    text-align: center;
    transition: all 0.3s ease;
    color: var(--text-color);
    font-weight: 500;
  }
  
  /* 活动标签样式 */
  .navbar a.active {
    color: var(--primary-color);
    position: relative;
  }
  
  .navbar a.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 25%;
    width: 50%;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: 3px 3px 0 0;
  }
  
  /* 暗色模式下的调整 */
  @media (prefers-color-scheme: dark) {
    .navbar {
      background-color: rgba(30, 30, 30, 0.7);
      border-bottom: 1px solid rgba(50, 50, 50, 0.7);
    }
  }
}

@media (max-width: 768px) {
  .timeline-container {
    display: none;
  }
}
/* 时间线样式 */
.timeline-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  background-color: var(--card-background);
  padding: 20px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.timeline-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  z-index: 1;
}

.timeline-segment {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  padding: 10px;
  transition: transform var(--transition-fast);
}

.timeline-segment:hover {
  transform: translateY(-5px);
}

.timeline-segment .emoji {
  font-size: 28px;
  margin-bottom: 12px;
  background-color: var(--background-color);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.timeline-segment .time {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
}

/* 图表容器 */
.echart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 30px;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background-color: var(--card-background);
  box-shadow: var(--shadow-sm);
}

/* 加载状态样式 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--primary-light);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message, .no-data-message {
  text-align: center;
  padding: 40px;
  color: #e74c3c;
  background-color: #fde8e8;
  border-radius: var(--border-radius-md);
  margin: 20px 0;
}

.no-data-message {
  color: var(--text-light);
  background-color: var(--primary-light);
}

/* 按钮样式 */
.optimize-all-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: var(--border-radius-sm);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  margin: 0 auto 25px;
  display: block;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.optimize-all-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.7s;
}

.optimize-all-btn:hover::before {
  left: 100%;
}

.optimize-all-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.optimize-all-btn:disabled {
  background: #b0b0b0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.global-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.action-btn {
  background-color: var(--primary-light);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 10px 18px;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.action-btn:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  margin-left: 8px;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 内容区域样式 - 5列布局 */
.content-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-top: 20px;
  width: 100%;
}

/* 确保在不同屏幕尺寸下优雅降级 */
@media (max-width: 1600px) {
  .content-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1280px) {
  .content-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

.content-segment {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0; /* 防止内容溢出 */
}

/* 便签样式 */
.note {
  background-color: var(--card-background);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
}

.note:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.note::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(to bottom, var(--primary-color), var(--secondary-color));
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border-color);
}

.user-name {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.expand-icon, .close-icon {
  font-size: 18px;
  color: var(--secondary-color);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.expand-icon:hover, .close-icon:hover {
  background-color: var(--primary-light);
}

.transcription-text {
  margin: 0;
  line-height: 1.6;
  color: var(--text-color);
  max-height: 4.8em;
  overflow: hidden;
  font-size: 14px;
}

.truncated {
  display: -webkit-box;
  -webkit-line-clamp: 4; /* 增加行数，原为3 */
  max-height: 6.4em; /* 增加高度 */
  line-clamp: 3; /* 添加标准属性 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.full-text {
  max-height: none;
  margin-bottom: 20px;
}

.optimized-text-container {
  margin-top: 15px;
  border-top: 1px solid var(--border-color);
  padding-top: 15px;
}

.optimized-label, .card-label {
  font-weight: 600;
  color: var(--secondary-color);
  margin-bottom: 8px;
  display: block;
  font-size: 14px;
}

.optimized-text-scroll-wrapper {
  max-height: 150px;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) var(--background-color);
}

.optimized-text-scroll-wrapper::-webkit-scrollbar {
  width: 6px;
}

.optimized-text-scroll-wrapper::-webkit-scrollbar-track {
  background: var(--background-color);
  border-radius: 10px;
}

.optimized-text-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--primary-color);
  border-radius: 10px;
}

/* 摘要和关键词卡片样式 */
.summary-card, .keyword-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 15px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.summary-card::before, .keyword-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
}

.summary-card:hover, .keyword-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  background-color: var(--primary-light);
  color: var(--primary-color);
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.keyword-tag:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* 会议整体摘要卡片 */
.overall-summary-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
  position: relative;
}

.overall-summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
}

.overall-summary-card:hover {
  box-shadow: var(--shadow-md);
}

/* 待办事项和词云

/* 待办事项和词云的容器 */
.todos-wordcloud-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

/* 待办事项卡片和词云卡片 */
.todos-card, .wordcloud-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
  height: 100%;
  position: relative;
  overflow: hidden;
}

.todos-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, var(--secondary-color), var(--accent-color));
}

.wordcloud-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(90deg, var(--accent-color), var(--primary-color));
}

.todos-card:hover, .wordcloud-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

/* 浮层 - 优化点击后的卡片设计 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.expanded-note {
  position: relative;
  width: 85%;
  max-width: 900px;
  max-height: 85vh;
  background-color: var(--card-background); /* 确保使用正确的背景色 */
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 25px;
  z-index: 2001; /* 确保在overlay之上 */
  overflow: hidden;
  animation: slideIn 0.4s ease;
  border: 1px solid var(--border-color);
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.expanded-content {
  max-height: calc(85vh - 120px);
  overflow-y: auto;
  padding-right: 15px;
  padding-left: 5px;
  background-color: var(--card-background); /* 确保内容区域有正确的背景色 */
  color: var(--text-color); /* 确保文字颜色正确 */
}

.expanded-content::-webkit-scrollbar {
  width: 6px;
}

.expanded-content::-webkit-scrollbar-track {
  background: var(--background-color);
  border-radius: 10px;
}

.expanded-content::-webkit-scrollbar-thumb {
  background-color: var(--primary-color);
  border-radius: 10px;
}

.expanded-optimized-container {
  margin-top: 25px;
  border-top: 1px solid var(--border-color);
  padding-top: 15px;
}

/* 关闭按钮样式优化 */
.close-icon {
  font-size: 22px;
  font-weight: bold;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--primary-light);
  color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.close-icon:hover {
  background-color: var(--primary-color);
  color: white;
}

/* Markdown 内容样式 */
.markdown-content {
  color: var(--text-color);
  line-height: 1.6;
}

.markdown-content h1 {
  font-size: 1.5em;
  margin-top: 1em;
  margin-bottom: 0.6em;
  color: var(--primary-color);
  font-weight: 600;
}

.markdown-content h2 {
  font-size: 1.3em;
  margin-top: 0.8em;
  margin-bottom: 0.5em;
  color: var(--secondary-color);
  font-weight: 600;
}

.markdown-content h3 {
  font-size: 1.1em;
  margin-top: 0.6em;
  margin-bottom: 0.4em;
  color: var(--text-color);
  font-weight: 600;
}

.markdown-content p {
  margin-top: 0;
  margin-bottom: 1em;
  line-height: 1.6;
}

.markdown-content strong {
  font-weight: 700;
  color: var(--primary-color);
  background-color: rgba(74, 107, 255, 0.08);
  padding: 0 4px;
  border-radius: 3px;
}

.markdown-content em {
  font-style: italic;
  color: var(--accent-color);
}

.markdown-content ul {
  list-style-type: disc;
  margin-left: 20px;
  padding-left: 0;
  margin-bottom: 1em;
}

.markdown-content ol {
  list-style-type: decimal;
  margin-left: 20px;
  padding-left: 0;
  margin-bottom: 1em;
}

.markdown-content li {
  margin-bottom: 0.5em;
}

.markdown-content a {
  color: var(--primary-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--primary-color);
  transition: border-bottom var(--transition-fast);
}

.markdown-content a:hover {
  border-bottom: 1px solid var(--primary-color);
}

.markdown-content code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background-color: #f3f4f6;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #d63384;
}

.markdown-content pre {
  background-color: #f3f4f6;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.markdown-content blockquote {
  border-left: 4px solid var(--primary-color);
  margin-left: 0;
  padding-left: 15px;
  color: var(--text-light);
  font-style: italic;
  margin-bottom: 1em;
}

.markdown-content hr {
  border: 0;
  height: 1px;
  background: var(--border-color);
  margin: 20px 0;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
  overflow-x: auto;
  display: block;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content table th {
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}

.markdown-content table tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.02);
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 10px 0;
}

/* 词云组件样式增强 */
.wordcloud-wrapper {
  height: 350px;
  width: 100%;
  position: relative;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 10px;
  opacity: 0.8;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--secondary-color);
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .meeting-tabs {
    flex-direction: column;
    padding: 0;
  }
  
  .meeting-tab {
    padding: 12px 10px;
    border-radius: 0;
  }
  
  .meeting-tab.active::after {
    display: none;
  }
  
  .meeting-tab:first-child {
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
  }
  
  .meeting-tab:last-child {
    border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  }
  
  .global-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .expanded-note {
    width: 95%;
    padding: 15px;
  }
}

/* 打印样式 */
@media print {
  .navbar, .meeting-tabs-sticky, .optimize-all-btn, .global-buttons {
    display: none;
  }
  
  section {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 20px;
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .transcription-page {
    padding: 0;
  }
}

/* 暗黑模式增强 */
@media (prefers-color-scheme: dark) {
  .markdown-content code {
    background-color: #2a2a2a;
    color: #e83e8c;
  }
  
  .markdown-content pre {
    background-color: #2a2a2a;
  }
  
  .markdown-content table th {
    background-color: #353535;
    color: var(--primary-light);
  }
  
  .markdown-content table tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .overlay {
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  .close-icon {
    background-color: #353535;
    color: var(--primary-light);
  }
  
  .close-icon:hover {
    background-color: var(--primary-color);
    color: #fff;
  }
}
@media (max-width: 768px) {
  .expanded-note {
    width: 95%;
    max-width: none;
    max-height: 90vh;
    padding: 15px;
    border-radius: var(--border-radius-md);
  }
  
  .expanded-content {
    max-height: calc(90vh - 100px);
    padding-right: 10px;
  }
  
  .close-icon {
    width: 24px;
    height: 24px;
    font-size: 18px;
  }
}

/* 按钮样式修改 */
.action-btn {
  border-radius: 20px; /* 增加圆角效果 */
}

/* 一键优化按钮 */
.optimize-all-btn {
  border-radius: 20px; /* 增加圆角效果 */
}

/* 底部的几个选项卡按钮 */
.meeting-tab {
  border-radius: 20px; /* 增加圆角效果 */
}

/* 绿色的"一键优化"按钮 */
button {
  border-radius: 20px; /* 默认所有按钮添加圆角 */
}
</style>