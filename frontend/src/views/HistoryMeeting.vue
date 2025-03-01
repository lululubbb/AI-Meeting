<!-- src/views/HistoryMeeting.vue -->
<template>
  <div class="history-container">
    <h2>📜 会议历史记录</h2>
    <!-- 关闭按钮 -->
    <div v-if="route.name === 'HistoryMeeting'" class="close-btn-wrapper">      
      <button @click="goHome" class="close-btn" aria-label="关闭">
        <img src="@/assets/exit.png" alt="退出" />
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-container">
      <div class="input-wrapper">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索会议相关信息"
          class="search-input"
        />
        <img
          src="@/assets/search.png"
          alt="搜索"
          class="search-icon"
        />
      </div>
    </div>

    <div v-if="filteredMeetings.length === 0" class="no-results">
      <p>😕 没有找到符合条件的会议记录</p>
    </div>

    <ul v-else class="meeting-list">
      <li v-for="meeting in filteredMeetings" :key="meeting.meetingId"
        :class="{
          'ongoing': meeting.status === 'ongoing',
          'finished': meeting.status === 'finished',
          'scheduled': meeting.status === 'scheduled' // 显示 scheduled 状态
        }"
        @click="showMeetingDetails(meeting)"
      >
        <strong>📅 会议名称:</strong> {{ meeting.sessionName }} <br />
        <strong>👤 创建人员:</strong> {{ meeting.host }} <br />
        <strong>🕒 创建时间:</strong> {{ formatDate(meeting.createdAt) }} <br />
        <strong>📊 会议状态:</strong> {{ meeting.status }}<br />
        <strong>⏰ 结束时间:</strong> {{ formatDate(meeting.endTime) }}
      </li>
    </ul>

    <!-- 会议详情 -->
    <div v-if="showModal" class="meeting-detail-modal">
      <div id="meetingDetails">
        <span class="closeBtn" @click="closeModal">×</span>
        <h3>📋 会议详情</h3>
        <p><strong>📅 会议名称:</strong> {{ selectedMeeting.sessionName }}</p>
        <p><strong>🔑 会议号:</strong> {{ selectedMeeting.meetingId }}</p>
        <p><strong>👤 发起人:</strong> {{ selectedMeeting.host }}</p>
        <p><strong>🕒 开始时间:</strong> {{ formatDate(selectedMeeting.createdAt) }}</p>
        <p><strong>⏰ 结束时间:</strong>  {{ formatDate(meeting.endTime) }}</p>
        
        <!-- 只在当前用户是会议的host时显示以下内容 -->
        <div v-if="selectedMeeting.host === getUserEmail()" class="meeting-actions">
          <p><strong>👥 参会人员:</strong></p>
          <button @click="downloadData" class="download-btn" aria-label="下载数据">
            <img src="@/assets/download.png" alt="下载" />
          </button>
        </div>
        <div v-if="selectedMeeting.host === getUserEmail()" class="meeting-actions">
          <p><strong>📈 参会度:</strong></p>
          <button @click="downloadData" class="download-btn" aria-label="下载参会度">
            <img src="@/assets/download.png" alt="下载" />
          </button>
        </div>
        
        <!-- 添加四个功能按钮 -->
        <div class="function-buttons">
          <button @click="showSection('record')">📝 会议记录</button>
          <button @click="showSection('keywords')">🔑 关键提取</button>
          <button @click="showSection('sentiment')">❤️ 情感分析&词云图</button>
          <button @click="showSection('statistics')">📊 参会统计</button>
        </div>

        <!-- 动态切换显示内容 -->
        <div v-if="activeSection === 'record'" class="section-content">
          <!-- 会议记录的内容 -->
          <!-- 判断会议状态是否为已结束 -->
          <div v-if="selectedMeeting.status === 'finished'">
            <p>{{ meetingTranscriptions }}</p>
          </div>
          <div v-else class="info-message">
            🕒 会议未结束，无法查看记录。
          </div>
        </div>

        <div v-if="activeSection === 'keywords'" class="section-content">
          <!-- 关键提取的内容 -->
          <div v-if="selectedMeeting.status === 'finished'">
            <!-- 表情点击触发摘要生成 -->
            <div class="icon-container" @click="generateStreamedSummary">
              <!-- 显示不同状态的表情 -->
              <span class="summary-icon">
                {{ isLoadingSummary ? '⏳ 生成中...' : '✨ 点击生成摘要' }}
              </span>
            </div>

            <!-- 展示流式摘要 -->
            <div v-if="summary" class="summary-output">
              <p><strong>📝 摘要:</strong></p>
              <p>{{ summary }}</p>
            </div>
          </div>
          <div v-else class="info-message">
            🕒 会议未结束，无法生成摘要。
          </div>
        </div>
        
        <div v-if="activeSection === 'sentiment'" class="section-content">
          <!-- 情感分析&词云图的内容 -->
          <div v-if="selectedMeeting.status === 'finished'">
            <!-- 展示后端返回的图表 -->
            <div v-if="sentimentImages.wordcloud" class="chart-container">
              <h4>☁️ 词云图</h4>
              <img :src="sentimentImages.wordcloud" alt="词云图" />
            </div>
            <div v-if="sentimentImages.bar_chart" class="chart-container">
              <h4>📊 情绪分布条形图</h4>
              <img :src="sentimentImages.bar_chart" alt="情绪分布条形图" />
            </div>
            <div v-if="sentimentImages.pie_chart" class="chart-container">
              <h4>🥧 情绪分布饼图</h4>
              <img :src="sentimentImages.pie_chart" alt="情绪分布饼图" />
            </div>
            <div v-if="sentimentImages.radar_chart" class="chart-container">
              <h4>🕸️ 情绪分布雷达图</h4>
              <img :src="sentimentImages.radar_chart" alt="情绪分布雷达图" />
            </div>
          </div>
          <div v-else class="info-message">
            🕒 会议未结束，无法查看情感分析。
          </div>
        </div>

        <div v-if="activeSection === 'statistics'" class="section-content">
          <!-- 参会统计的内容 -->
          <!-- 判断会议状态是否为已结束 -->
          <div v-if="selectedMeeting.status === 'finished'">
            <p>📈 参会统计内容...</p>
          </div>
          <div v-else class="info-message">
            🕒 会议未结束，无法查看参会统计。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import FirestoreService from '../services/FirestoreService.js';
import { showSnackBar } from '../utils/utils.js';
import { generateSummaryAPI } from '../api/chat.js';
import axios from 'axios'; // 导入 Axios

const isLoadingSummary = ref(false);
const summary = ref('');

// 初始化情感分析图片
const sentimentImages = ref({
  wordcloud: '',
  bar_chart: '',
  pie_chart: '',
  radar_chart: ''
});

// 定义后端 API 地址
const BACKEND_URL = 'http://localhost:8003'; // 根据实际情况修改

// 函数：生成流式摘要（保持不变）
const generateStreamedSummary = async () => {
  if (isLoadingSummary.value) {
    return;
  }

  if (!meetingTranscriptions.value) {
    summary.value = '会议记录为空，无法生成摘要。';
    return;
  }

  isLoadingSummary.value = true;
  summary.value = '';

  try {
    const response = await generateSummaryAPI(meetingTranscriptions.value);

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let doneReading = false;

    // 创建一个缓冲区来存储接收到的内容
    const contentBuffer = [];

    // 定义每次追加的时间间隔（毫秒）
    const appendInterval = 50;

    // 定义每次追加的内容长度
    const chunkSize = 5;

    // 定义一个定时器来定期追加内容
    const intervalId = setInterval(() => {
      if (contentBuffer.length > 0) {
        // 从缓冲区中取出一部分内容
        const chunk = contentBuffer.shift();
        summary.value += chunk;
      } else if (doneReading) {
        // 如果读取已完成且缓冲区为空，清除定时器
        clearInterval(intervalId);
      }
    }, appendInterval);

    while (!doneReading) {
      const { value, done } = await reader.read();
      doneReading = done;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.replace(/^data:/, '').trim();
            if (dataStr === '[DONE]') {
              doneReading = true;
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0].delta;
              if (delta && delta.content) {
                // 将接收到的内容分割成更小的块并推入缓冲区
                for (let i = 0; i < delta.content.length; i += chunkSize) {
                  const subChunk = delta.content.substring(i, i + chunkSize);
                  contentBuffer.push(subChunk);
                }
              }
            } catch (err) {
              console.error('解析流式摘要失败:', err);
            }
          }
        }
      }
    }

    // 确保所有内容都已追加
    // 等待缓冲区清空
    const waitUntilBufferEmpty = () => {
      return new Promise(resolve => {
        const checkBuffer = () => {
          if (contentBuffer.length === 0) {
            clearInterval(intervalId);
            resolve();
          } else {
            setTimeout(checkBuffer, appendInterval);
          }
        };
        checkBuffer();
      });
    };

    await waitUntilBufferEmpty();
  } catch (error) {
    console.error('生成摘要失败:', error);
    summary.value = '抱歉，生成摘要失败，请稍后重试。';
  } finally {
    isLoadingSummary.value = false;
  }
};



// 获取 Vuex store
const store = useStore();
const router = useRouter();
const route = useRoute();

// 获取当前用户的邮箱
const getUserEmail = () => {
  const user = store.getters.getUser;
  console.log('当前用户邮箱:', user.email);
  return user.email || 'unknown@domain.com';
};

// 获取会议列表
const meetings = computed(() => store.getters.getMeetings);

// 搜索框的绑定数据
const searchQuery = ref('');
// 选中的会议详情
const selectedMeeting = ref(null);
const showModal = ref(false);
const activeSection = ref(''); // 用于控制显示哪个区域

// 转录文本
const meetingTranscriptions = ref('');

// 创建一个 ref 来控制是否显示关闭按钮
const showCloseButton = ref(false);

// 监听 route.path 变化
watch(() => route.path, (newPath) => {
  showCloseButton.value = newPath === '/history';
});

// 格式化日期
// const formatDate = (timestamp) => {
//   if (!timestamp) return '';
//   const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
//   return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
// };


// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''; // 如果时间戳为空，返回空字符串

  let date;
  if (typeof timestamp === 'number') {
    // 如果时间戳是数字，直接转换为 Date 对象
    date = new Date(timestamp);
  } else if (timestamp.toDate) {
    // 如果时间戳是 Firestore 的 Timestamp 对象，调用 toDate() 方法
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    // 如果时间戳是 Date 对象，直接使用
    date = timestamp;
  } else {
    // 如果时间戳是其他类型，尝试直接转换为 Date 对象
    date = new Date(timestamp);
  }

  // 如果 date 是无效的 Date 对象，返回空字符串
  if (isNaN(date.getTime())) {
    return '';
  }

  // 返回格式化后的日期和时间
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// 显示会议详情
const showMeetingDetails = (meeting) => {
  selectedMeeting.value = meeting;
  showModal.value = true;
};

// 关闭详情弹窗
const closeModal = () => {
  showModal.value = false;
  selectedMeeting.value = null;
};

// 下载数据
const downloadData = () => {
  if (selectedMeeting.value) {
    const data = {
      meetingId: selectedMeeting.value.meetingId,
      participants: selectedMeeting.value.participants,
      participationRate: selectedMeeting.value.participationRate,
      transcriptions: selectedMeeting.value.transcriptions,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedMeeting.value.sessionName}-data.json`;
    link.click();
  }
};

// 切换功能区域
const showSection = async (section) => {
  if (selectedMeeting.value && selectedMeeting.value.status === 'finished') {
    activeSection.value = section;

    if (section === 'record') {
      // 获取转录文本
      const user = store.getters.getUser;
      if (user && selectedMeeting.value.meetingId) {
        try {
          const transcription = await FirestoreService.getTranscriptions(user.uid, selectedMeeting.value.meetingId);
          meetingTranscriptions.value = transcription;
          console.log('获取到的转录文本:', transcription);
        } catch (error) {
          console.error('获取转录文本失败:', error);
          showSnackBar('获取转录文本失败: ' + error.message);
        }
      } else {
        console.warn('用户信息或 meetingId 不存在');
      }
    }

    // 如果切换到 'sentiment'，则调用 fetchSentimentImages
    if (section === 'sentiment') {
      await fetchSentimentImages();
    }
  } else {
    ElMessage.warning("请等会议结束后再进行查看");
  }
};

// 生命周期钩子
onMounted(() => {
  if (store.state.user) {
    store.dispatch('listenToMeetings');
  }
});

// 根据搜索条件过滤会议列表
const filteredMeetings = computed(() => {
  if (!searchQuery.value) return meetings.value;

  const query = searchQuery.value.toLowerCase();
  return meetings.value.filter((meeting) => {
    const meetingNameMatch = meeting.sessionName && meeting.sessionName.toLowerCase().includes(query);
    const statusMatch = meeting.status && meeting.status.toLowerCase().includes(query);
    const createdAtMatch = meeting.createdAt && formatDate(meeting.createdAt).toLowerCase().includes(query);
    const endedAtMatch = meeting.endedAt && formatDate(meeting.endedAt).toLowerCase().includes(query);

    return meetingNameMatch || statusMatch || createdAtMatch || endedAtMatch;
  });
});

// 返回主页
const goHome = () => {
  router.push('/home');
};

// 函数：发送转录文本到后端并获取情感分析图表
const fetchSentimentImages = async () => {
  if (!meetingTranscriptions.value) {
    ElMessage.error('会议转录文本为空，无法进行情感分析。');
    return;
  }

  try {
    // 发送 POST 请求到后端
    const response = await axios.post(`${BACKEND_URL}/generate-charts/`, new URLSearchParams({
      text: meetingTranscriptions.value
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.error) {
      console.error('后端错误:', response.data.error);
      ElMessage.error(`后端错误: ${response.data.error}`);
      return;
    }

    // 更新情感分析图表
    sentimentImages.value = {
      wordcloud: response.data.wordcloud || '',
      bar_chart: response.data.bar_chart || '',
      pie_chart: response.data.pie_chart || '',
      radar_chart: response.data.radar_chart || ''
    };

    console.log('接收到的情感分析图表:', sentimentImages.value);
  } catch (error) {
    console.error('获取情感分析图表失败:', error);
    ElMessage.error('获取情感分析图表失败，请稍后重试。');
  }
};
</script>

<style scoped>
/* 通用样式 */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

/* 容器样式 */
.history-container {
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
  color: #000;
}

.history-container h2 {
  text-align: center;
  color: var(--text-color);
  margin-bottom: 25px;
  font-size: 28px;
}

/* 搜索框样式 */
.search-container {
  position: relative;
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
}

.input-wrapper {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 12px 50px 12px 40px;
  border-radius: 30px;
  border: 2px solid #ccc;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-input:focus {
  border-color: #007BFF;
  /* box-shadow: 0 0 8px rgba(0, 123, 255, 0.3); */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
}

.search-input::placeholder {
  color: #999999;
  font-style: italic;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
}
.closeBtn {
  position: absolute;  /* 设置为绝对定位 */
  top: 30px;           /* 调整顶部间距 */
  right:30px;   
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
}
.closeBtn:hover {
  color: red;
}
/* 无结果提示 */
.no-results {
  text-align: center;
  color: #666666;
  font-size: 18px;
  margin-top: 20px;
}

/* 会议列表样式 */
.meeting-list {
  list-style-type: none;
  padding: 0;
}

.meeting-list li {
  /* background-color: #fdfdfd; */
  color: #000;
  padding: 15px 20px;
  margin-bottom: 15px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.3s, border-color 0.3s;
  cursor: pointer;

}

.meeting-list li:hover {
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  border-color: #007BFF;
}

.meeting-list li.ongoing {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.meeting-list li.finished {
  background-color: #f6ffed;
  border-color: #b7eb8f;
}

.meeting-list li.scheduled {
  background-color: #fff1f0;
  border-color: #ffa39e;
}

.meeting-list strong {
  color: #333333;
  display: inline-block;
  width: 120px;
}

/* 会议详情弹窗样式 */
.meeting-detail-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* background-color: #ffffff; */
  padding: 25px 20px;
  /* box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); */
  z-index: 100;
  width: 90%;
  max-width: 900px;
  max-height: 85%;
  overflow-y: auto;
  border-radius: 15px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -60%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}

#meetingDetails {
  padding: 10px;
  background-color: #ffffff;
  border-radius: 10px;

  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */

}

#meetingDetails h3 {
  text-align: center;
  color: #007BFF;
  margin-bottom: 20px;
  font-size: 24px;
}

#meetingDetails p {
  margin: 12px 0;
  font-size: 16px;
  color: #0e0e0e;
  line-height: 1.6;
}

#meetingDetails strong {
  font-weight: bold;
  color: #333333;
}

/* 会议操作按钮样式 */
.meeting-actions {
  display: flex;
  align-items: center;
  margin-top: 20px;
}

.meeting-actions p {
  margin: 0 10px 0 0;
  font-size: 16px;
  color: #333333;
}

.download-btn {
  background-color: #ffffff;
  border: 2px solid #007BFF;
  border-radius: 8px;
  cursor: pointer;
  padding: 8px;
  transition: background-color 0.3s, transform 0.3s;
}

.download-btn img {
  width: 24px;
  height: 24px;
}

.download-btn:hover {
  background-color: #007BFF;
  transform: scale(1.05);
}

.download-btn:active {
  transform: scale(0.95);
}

/* 功能按钮样式 */
.function-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  flex-wrap: wrap;
}

.function-buttons button {
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s, transform 0.2s;
  font-size: 16px;
  margin: 10px;
  flex: 1 1 40%;
  max-width: 200px;
}

.function-buttons button:hover {
  background-color: #e0e0e0;
  border-color: #007BFF;
  transform: translateY(-2px);
}

.function-buttons button:active {
  transform: translateY(0);
}

/* 内容区域样式 */
.section-content {
  margin-top: 25px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 10px;
  border: 1px solid #ddd;
  transition: background-color 0.3s, border-color 0.3s;
}

.section-content p {
  color: #444444;
  font-size: 16px;
  line-height: 1.8;
}

.info-message {
  text-align: center;
  color: #ff4d4f;
  font-size: 18px;
  margin-top: 15px;
}

/* 图表容器样式 */
.chart-container {
  margin-top: 20px;
}

.chart-container h4 {
  color: #333333;
  margin-bottom: 10px;
  font-size: 18px;
}

.chart-container img {
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 8px;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
}

/* 表情图标容器样式 */
.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin-top: 15px;
}

.summary-icon {
  font-size: 24px;
  transition: transform 0.3s;
}

.icon-container:hover .summary-icon {
  transform: scale(1.2); /* 鼠标悬停放大效果 */
}

/* 摘要输出样式 */
.summary-output {
  margin-top: 25px;
  padding: 15px;
  background-color: #f0f8ff;
  border-radius: 10px;
  border: 1px solid #cceeff;
}

.summary-output p {
  margin: 0;
  font-size: 16px;
  color: #333333;
  line-height: 1.8;
}

/* 禁用按钮样式 */
button:disabled {
  background-color: #eeeeee;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .function-buttons {
    flex-direction: column;
    align-items: center;
  }

  .function-buttons button {
    max-width: none;
    width: 80%;
  }

  .meeting-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .meeting-actions p {
    margin-bottom: 10px;
  }
}
</style>
