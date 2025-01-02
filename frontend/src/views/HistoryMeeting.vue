<!-- src/views/HistoryMeeting.vue -->
<template>
  <div class="history-container">
    <h2>会议历史记录</h2>
    <!-- 关闭按钮 -->
    <div v-if="route.name === 'HistoryMeeting'" class="close-btn-wrapper">      
      <button @click="goHome" class="close-btn">
        <img src="@/assets/exit.png" alt="exit"/>
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
          alt="Search"
          class="search-icon"
        />
      </div>
    </div>

    <div v-if="filteredMeetings.length === 0">
      <p>没有找到符合条件的会议记录</p>
    </div>

    <ul v-else>
      <li v-for="meeting in filteredMeetings" :key="meeting.meetingId"
        :class="{
          'ongoing': meeting.status === 'ongoing',
          'finished': meeting.status === 'finished',
          'not-started': meeting.status !== 'finished' && meeting.status !== 'ongoing'
        }"
        @click="showMeetingDetails(meeting)"
      >
        <strong>会议名称: </strong> {{ meeting.sessionName }} <br />
        <strong>创建人员: </strong> {{ meeting.host }} <br />
        <strong>创建时间: </strong> {{ formatDate(meeting.createdAt) }} <br />
        <strong>会议状态: </strong> {{ meeting.status }}<br />
        <strong>结束时间: </strong> {{ meeting.endedAt ? formatDate(meeting.endedAt) : '正在进行中' }}
      </li>
    </ul>

    <!-- 会议详情 -->
    <div v-if="showModal" class="meeting-detail-modal">
      <div id="meetingDetails">
        <span class="closeBtn" @click="closeModal">×</span>
        <h3>会议详情</h3>
        <p><strong>会议名称:</strong> {{ selectedMeeting.sessionName }}</p>
        <p><strong>会议号:</strong> {{ selectedMeeting.meetingId }}</p>
        <p><strong>发起人:</strong> {{ selectedMeeting.host }}</p>
        <p><strong>开始时间:</strong> {{ formatDate(selectedMeeting.createdAt) }}</p>
        <p><strong>结束时间:</strong> {{ selectedMeeting.endedAt ? formatDate(selectedMeeting.endedAt) : '正在进行中' }}</p>
        
        <!-- 只在当前用户是会议的host时显示以下内容 -->
        <div v-if="selectedMeeting.host === getUserEmail()" class="meeting-actions">
          <p><strong>参会人员:</strong></p>
          <button @click="downloadData" class="download-btn">
            <img src="@/assets/download.png" alt="Download" />
          </button>
        </div>
        <div v-if="selectedMeeting.host === getUserEmail()" class="meeting-actions">
          <p><strong>参会度:</strong></p>
          <button @click="downloadData" class="download-btn">
            <img src="@/assets/download.png" alt="Download" />
          </button>
        </div>
        
        <!-- 添加四个功能按钮 -->
        <div class="function-buttons">
          <button @click="showSection('record')">会议记录</button>
          <button @click="showSection('keywords')">关键提取</button>
          <button @click="showSection('sentiment')">情感分析&词云图</button>
          <button @click="showSection('statistics')">参会统计</button>
        </div>

        <!-- 动态切换显示内容 -->
        <div v-if="activeSection === 'record'" class="section-content">
          <!-- 会议记录的内容 -->
          <!-- 判断会议状态是否为已结束 -->
          <div v-if="selectedMeeting.status === 'finished'">
            <p>{{ meetingTranscriptions }}</p>
          </div>
          <div v-else>
            会议未结束，无法查看记录。
          </div>
        </div>

        <div v-if="activeSection === 'keywords'" class="section-content">
  <!-- 关键提取的内容 -->
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
      <p><strong>摘要:</strong></p>
      <p>{{ summary }}</p>
    </div>
  </div>
</div>

</div>

<div v-if="activeSection === 'sentiment'" class="section-content">
  <!-- 情感分析&词云图的内容 -->
  <div v-if="selectedMeeting.status === 'finished'">
    <!-- 展示转录文本（可选） -->
    <!-- <p>{{ meetingTranscriptions }}</p> -->

    <!-- 展示后端返回的图表 -->
    <div v-if="sentimentImages.wordcloud">
      <h4>词云图</h4>
      <img :src="sentimentImages.wordcloud" alt="词云图" />
    </div>
    <div v-if="sentimentImages.bar_chart">
      <h4>情绪分布条形图</h4>
      <img :src="sentimentImages.bar_chart" alt="情绪分布条形图" />
    </div>
    <div v-if="sentimentImages.pie_chart">
      <h4>情绪分布饼图</h4>
      <img :src="sentimentImages.pie_chart" alt="情绪分布饼图" />
    </div>
    <div v-if="sentimentImages.radar_chart">
      <h4>情绪分布雷达图</h4>
      <img :src="sentimentImages.radar_chart" alt="情绪分布雷达图" />
    </div>
  </div>
  <div v-else>
    会议未结束，无法查看情感分析。
  </div>
</div>

        <div v-if="activeSection === 'statistics'" class="section-content">
          <!-- 参会统计的内容 -->
          <!-- 判断会议状态是否为已结束 -->
          <div v-if="selectedMeeting.status === 'finished'">
            参会统计内容...
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
    summary.value = '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let doneReading = false;

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
                summary.value += delta.content;
              }
            } catch (err) {
              console.error('解析流式摘要失败:', err);
            }
          }
        }
      }
    }
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
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
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
/* 清理重复的样式定义，保留一次 */

.close-btn-wrapper {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
}
.close-btn img{
  width: 30px;
  height: 30px;
}
.close-btn:hover {
  background-color: #f0f0f0;
}
.history-container {
  padding: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 87vh;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow-y: auto;  
}

.history-container h2 {
  text-align: center;
  color: #000000;
  margin-bottom: 20px;
}
.history-container ul {
  list-style-type: none;
  padding: 0;
}

.history-container li {
  background-color: #ffffff;
  padding: 5px;
  padding-left: 20px;
  margin-bottom: 10px;
  border-radius: 8px;
  border-width: 1.5px ;
  border-style: solid; 
  border-color: #d2d2d2; 
  transition: background-color 0.3s;
  color: #000000;
}
.history-container li.ongoing {
  background-color: #ddefff; 
  border-color: #bdd8ff;
  color: #000000;  
}

.history-container li.finished {
  background-color: #f9f9f9;  
  border-color: #c8c8c8; 
  color: #000000; 
}

.history-container li.not-started {
  background-color: #ffe7de; 
  border-color: #ffcabc;  
  color: #000000;  
}
.history-container li:hover {
  /* background-color: #eeeeee56; */
  border-color: #000000;  
}
.history-container strong {
  color: #000000;
}
.history-container p {
  color: #000000;
  text-align: center;
}
strong{
  margin-right: 5px;
}

/* 搜索框样式 */
.search-container {
  position: relative;
  margin-bottom: 20px;
}
.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border-radius: 25px;
  border-width: 2px;
  font-size: 16px;
  outline: none;
  border-color: #d7d7d7;
}

.search-input:focus {
  border-color: #b1b1b1;
}

.search-input::placeholder {
  color: #bbb;
  font-style: italic;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  width: 90%; 
} 
.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  margin-left: 10px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  pointer-events: none; 
}

.meeting-detail-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  padding-top: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
  width: 800px;
  max-height: 80%;
  overflow-y: auto;
  border-radius: 10px;
  box-sizing: border-box;
}

#meetingDetails {
  padding: 10px;
  background-color: #ffffff;
  border-radius: 8px;
}

#meetingDetails p {
  margin: 8px 0; /* 设置每个<p>的间距 */
  font-size: 16px;
  color: #333; /* 设置字体颜色 */
  text-align: left; /* 左对齐 */
}

#meetingDetails strong {
  font-weight: bold;
  color: #333;
}

.meeting-actions {
  display: flex;
  justify-content:flex-start; 
  align-items: center; 
  margin-top: 16px; 
}

.meeting-actions p {
  margin: 0;
  font-size: 14px;
  color: #000000; 
}

.closeBtn {
  position: absolute;
  top: 5px;
  right: 15px;
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
}
.closeBtn:hover {
  color: red;
}
.download-btn {
  background-color: #ffffff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.download-btn img {
  width: 20px;
  height: 20px;
}

.download-btn:hover {
  background-color: #f1f1f1;
}

.function-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.function-buttons button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 15px;
}

.function-buttons button:hover {
  background-color: #ddd;
}

.section-content {
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.section-content p {
  color: #333;
  font-size: 16px;
  margin: 10px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.icon-container {
  display: inline-block;
  cursor: pointer;
  margin: 10px 0;
  text-align: center;
}

.summary-icon {
  width: 40px;
  height: 40px;
  transition: transform 0.3s;
}

.icon-container:hover .summary-icon {
  transform: scale(1.2); /* 鼠标悬停放大效果 */
}

.summary-output {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f8ff;
  border-radius: 5px;
  border: 1px solid #ccc;
}
.summary-output p {
  margin: 0;
  font-size: 14px;
  color: #333;
}
button:disabled {
  background-color: #eee;
  cursor: not-allowed;
}

</style>