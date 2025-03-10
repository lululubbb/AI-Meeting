<!-- historymeeting.vue -->
<template>
  <div class="history-container">
    <h2>📜 会议记录</h2>
    <!-- 关闭按钮 -->
        <div  v-if="route.name === 'HistoryMeeting'" class="close-btn-wrapper">
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
        <img src="@/assets/search.png" alt="搜索" class="search-icon" />
      </div>
    </div>

    <div v-if="visibleMeetings.length === 0" class="no-results">
      <p>😕 没有找到符合条件的会议记录</p>
    </div>
    <ul v-else class="meeting-list">
      <li v-for="meeting in visibleMeetings" :key="meeting.meetingId"
        :class="{
          'ongoing': meeting.status === 'ongoing',
          'finished': meeting.status === 'finished',
          'scheduled': meeting.status === 'scheduled' // 显示 scheduled 状态
        }"
        @click="showMeetingDetails(meeting)"
      >
        <strong>📅 会议名称:</strong> {{ meeting.sessionName }} <br />
        <strong>👤 创建人员:</strong> {{ meeting.hostName }} <br /> <!-- 修改这里 -->
        <strong>🕒 创建时间:</strong> {{ formatDate(meeting.startTime) }} <br /> <!-- startTime -->
        <strong>📊 会议状态:</strong> {{ meeting.status }}<br />
        <strong>⏰ 结束时间:</strong> {{ formatDate(meeting.endTime) }}
      </li>
    </ul>

    <div v-if="loading" class="loading-indicator">📥 加载中...</div>
    <!-- 页码导航 -->
    <div v-if="allFilteredMeetings.length > pageSize" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>

    
    <!-- 会议详情 -->
    <div v-if="showModal" class="meeting-detail-modal">
      <div id="meetingDetails">
        <!-- <span class="closeBtn" @click="closeModal">×</span> -->
        <button @click="closeModal" class="close-btn" aria-label="关闭">
          <img src="@/assets/exit.png" alt="退出" />
        </button>
        <h3>📋 会议详情</h3>
        <p><strong>📅 会议名称:</strong> {{ selectedMeeting.sessionName }}</p>
        <p><strong>🔑 会议号:</strong> {{ selectedMeeting.meetingId }}</p>
        <p><strong>👤 发起人:</strong> {{ selectedMeeting.host }}</p>
        <p><strong>🕒 开始时间:</strong> {{ formatDate(selectedMeeting.createdAt) }}</p>
        <p><strong>⏰ 结束时间:</strong>  {{ formatDate(selectedMeeting.endTime) }}</p>
        
        <!-- 只在当前用户是会议的host时显示以下内容 -->
        <div v-if="selectedMeeting.hostId === getUserId()" class="meeting-actions">   <!-- 也要修改 -->
                    <p><strong>📈 参会数据汇总:</strong></p>
          <button @click="downloadParticipantsAllData" class="download-btn" aria-label="下载数据">
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
            <button @click="downloadMeetingRecord" class="share">📤 分享</button>
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
              <button @click="downloadKeywordsSummary" class="share">📤分享</button>
            </div>
          </div>
          <div v-else class="info-message">
             会议未结束，无法生成摘要。
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
          <div v-if="selectedMeeting.status === 'finished'">
            <!--          <p>📈 参会统计内容...</p>-->
            <!-- 参会者列表 -->
            <div class="chat-record-container">
              <h3>参会者列表</h3>
              <button @click="downloadParticipantsData" class="download-btn" aria-label="下载聊天记录">
                <img src="@/assets/download.png" alt="下载" />
              </button>
            </div>
            <div v-if="selectedMeeting.participants && selectedMeeting.participants.length > 0">
                <!-- 增加一个外层 div，用于实现水平滚动 -->
                <div class="table-scrollable-wrapper">
                    <table class="participants-table">
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>角色</th>
                                <th>加入时间</th>
                                <th>离开时间</th>
                                <th>参会时长</th>
                                <th>视频</th>
                                <th>音频</th>
                                <th>屏幕共享</th>
                                <th>消息数</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- 使用计算属性 limitedParticipants 截取前 5 条数据 -->
                            <tr v-for="participant in limitedParticipants" :key="participant.userId">
                                <td>{{ participant.userName }}</td>
                                <td>{{ participant.role }}</td>
                                <td>{{ formatDate(participant.joinTime) }}</td>
                                <td>{{ participant.leaveTime ? formatDate(participant.leaveTime) : '未离开' }}</td>
                                <td>{{ calculateDuration(participant.joinTime, participant.leaveTime) }}</td>

                                <td>
                                    <template v-if="participant.hasVideo && participant.hasVideo.timeline">
                                        开启次数: {{ getVideoOnCount(participant.hasVideo.timeline) }} <br>
                                        总开启时长: {{ getVideoTotalOnTime(participant.hasVideo.timeline) }} <br>
                                    </template>
                                </td>

                                <td>
                                    <template v-if="participant.isAudioOn && participant.isAudioOn.timeline">
                                        开启次数: {{ getAudioOnCount(participant.isAudioOn.timeline) }} <br>
                                        总开启时长: {{ getAudioTotalOnTime(participant.isAudioOn.timeline) }}
                                    </template>
                                    <template v-else>
                                        未开启
                                    </template>

                                </td>

                                <td>
                                    <template v-if="participant.isSharing && participant.isSharing.timeline">
                                        开启次数:{{ getSharingCounts(participant.isSharing.timeline) }}<br>
                                        总开启时长:{{ getSharingTotalTime(participant.isSharing.timeline) }}
                                    </template>
                                    <template v-else>未开启</template>
                                </td>
                                <!-- 新增列 -->
                                <td>{{ participant.messagesSent || 0 }}</td>
                            </tr>
                        </tbody>
                    </table>
                  </div>
                    <!-- 在参会者列表的表格表头部分添加新列 -->
            <div class="chat-record-container">
              <button @click="showExplanationModal" class="download-btn" aria-label="显示评分说明">
                <img src="@/assets/explanati.png" alt="说明" />
            </button>

              <h3>参会者参与度分析</h3>
              <button @click="downloadParticipationAnalysis" class="download-btn" aria-label="分析参与度">
                <img src="@/assets/download.png" alt="下载" />
              </button>              
            </div>
            <!-- 显示进度条 -->
            <el-progress v-if="isLoadingAnalysis" :percentage="analysisProgress" status="active"></el-progress>
            <div v-if="participationAnalysisResults.length > 0">
            <div class="table-scrollable-wrapper">
            <table class="participants-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>行为参与度</th>
              <th>认知参与度</th>
              <th>综合参与度</th>
            </tr>
          </thead>
          <tbody>
<!-- 使用计算属性 limitedAnalysisResults 截取前 5 条数据 -->
<tr v-for="result in limitedAnalysisResults" :key="result.userId">
              <td>{{ result.userName }}</td>
              <td>{{ result.role }}</td>
              <td>{{ result.behaviorScore.toFixed(2) }}</td>
              <td>{{ result.cognitiveScore.toFixed(2) }}</td>
              <td>{{ result.participationScore.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div> 
    </div>
              <div v-else>
                <p>暂无参会者数据</p>
              </div>

            <!-- 聊天记录,  显示/下载 按钮 -->
            <div class="chat-record-container">
              <h3>聊天记录</h3>
              <button @click="downloadChatData" class="download-btn" aria-label="下载聊天记录">
                <img src="@/assets/download.png" alt="下载" />
              </button>
            </div>
            <div v-if="selectedMeeting.chatMessages && selectedMeeting.chatMessages.length > 0">

              <div v-for="(msg, index) in selectedMeeting.chatMessages" :key="index" class="chat-message">
                <p>
                  <strong>{{ msg.senderName }}</strong>
                  <span v-if="msg.type === 'private'"> -> {{ getReceiverName(msg.receiverId) }}</span>
                  ({{ formatDate(msg.timestamp) }}):
                  {{ msg.message }}
                  <!-- 如果是文件消息，显示文件名 -->
                  <span v-if="msg.file">
                    (文件: {{ msg.file.name }})
                    </span>
                </p>
              </div>
            </div>
            <div v-else>
                <p>暂无聊天记录</p>
            </div>

          </div>
          <div v-else class="info-message">
            🕒 会议未结束，无法查看参会统计
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showExplanation" class="explanation-modal">
    <div class="modal-content">
      <button @click="hideExplanationModal" class="close-btn" aria-label="关闭">
          <img src="@/assets/exit.png" alt="退出" />
        </button>
      <h4>参会者参与度评分说明</h4>
      <p><strong>行为参与度（Behavior Engagement, BE）</strong></p>
      <p>行为参与度主要衡量参会者在会议中的实际行为表现，综合考虑了参与频度、参与广度和参与深度三个方面：</p>
      <ul>
        <li><strong>参与频度（BE<sub>f</sub>）</strong>：计算方式为视频开启次数、音频开启次数、屏幕共享次数和消息发送数量之和，反映了参会者在会议中主动参与的频繁程度。</li>
        <li><strong>参与广度（BE<sub>b</sub>）</strong>：计算方式为视频开启时长、音频开启时长和屏幕共享时长之和与会议总时长的比值，体现了参会者在会议中参与活动的时间占比。</li>
        <li><strong>参与深度（BE<sub>d</sub>）</strong>：计算方式为（视频开启次数 + 音频开启次数 + 屏幕共享次数 + 消息发送数量）除以 6，衡量了参会者在不同参与方式上的均衡程度。</li>
      </ul>
      <p>综合行为参与度得分（BE）是通过对参与频度、参与广度和参与深度进行加权平均得到的，权重分别为 0.4、0.3 和 0.3。</p>
      <p><strong>认知参与度（Cognitive Engagement, CE）</strong></p>
      <p>认知参与度主要评估参会者的发言内容与会议主题的相关性，使用 Sentence - BERT 模型计算：</p>
      <ul>
        <li>首先，使用预训练的 Sentence - BERT 模型将参会者的消息和会议主题关键词编码为向量。</li>
        <li>然后，计算消息向量与主题关键词向量的余弦相似度。</li>
        <li>最后，取所有相似度的平均值并转换为百分制。</li>
      </ul>
      <p>反映了参会者在会议中对主题的理解和思考程度。</p>
      <p><strong>综合参与度（Participation Engagement, PE）</strong></p>
      <p>综合参与度是行为参与度和认知参与度的加权平均值，权重分别为 0.6 和 0.4：</p>
      <ul>
        <li>计算方式：PE = 0.6 * BE + 0.4 * CE</li>
        <li>意义：全面评估了参会者在会议中的整体参与情况。</li>
      </ul>
    </div>
  </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import FirestoreService from '../services/FirestoreService.js';
import { showSnackBar } from '../utils/utils.js';
import { generateSummaryAPI } from '../api/chat.js';
import axios from 'axios'; // 导入 Axios
import * as XLSX from 'xlsx';
import { nextTick } from 'vue'; 

const isLoadingSummary = ref(false);
//参会者分析加载
const isLoadingAnalysis = ref(false);
const analysisProgress = ref(0);
const summary = ref('');
// 初始化情感分析图片
const sentimentImages = ref({
  wordcloud: '',
  bar_chart: '',
  pie_chart: '',
  radar_chart: ''
});

const currentPage = ref(1);
const pageSize = ref(8);
const loading = ref(false);

const showExplanation = ref(false);

const showExplanationModal = () => {
  showExplanation.value = true;
};

const hideExplanationModal = () => {
  showExplanation.value = false;
};

// 辅助函数：格式化日期用于比较 (YYYY-MM-DD) 
const formatDateForComparison = (date) => {
    if (!date) return ''; // 处理 null/undefined
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 添加前导零
    const day = String(date.getDate()).padStart(2, '0');     // 添加前导零
    return `${year}-${month}-${day}`;
};
// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(allFilteredMeetings.value.length / pageSize.value);
});

// 上一页函数
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// 下一页函数
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

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
  onUnmounted(() => abortController.abort());
};


// 获取 Vuex store
const store = useStore();
const router = useRouter();
const route = useRoute();

// 获取当前用户的邮箱
const getUserEmail = () => {
  const user = store.getters.getUser;
  // console.log('当前用户ID:', user.uid);
  return user?.email || 'unknown@domain.com'
};
// 获取用户 ID
const getUserId = () => {
  const user = store.getters.getUser;
  return user?.uid;  //  user  null, ?
}

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
const showCloseButton = ref(false);

// 监听 route.path 变化
watch(() => route.path, (newPath) => {
  showCloseButton.value = newPath === '/history';
});
// 监听搜索查询变化，重置状态
watch(searchQuery, () => {
  currentPage.value = 1;
});

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
  console.log('All properties of selected meeting:', Object.keys(meeting));
  console.log('Selected meeting:', meeting); // 打印会议对象
  console.log('Selected meeting participants:', meeting.participants); // 打印参会者数组
  console.log('Selected meeting:', meeting);
  if (meeting.host) {
    console.log('Host data:', meeting.host);
  } else {
    console.log('Host data is missing or empty.');
  }
  showModal.value = true;
  activeSection.value = ''; //  重置 activeSection
};

// 关闭详情弹窗
const closeModal = () => {
  showModal.value = false;
  selectedMeeting.value = null;
  activeSection.value = ''; //重置
  meetingTranscriptions.value = ''; //重置
};


// 定义分享会议记录的函数
const downloadMeetingRecord = () => {
  const content = meetingTranscriptions.value;
  const blob = new Blob([content], { type: 'application/msword' });
  const fileName = `${selectedMeeting.value.sessionName}-会议记录.doc`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

// 定义分享关键提取的函数
const downloadKeywordsSummary = () => {
  const content = summary.value;
  const blob = new Blob([content], { type: 'application/msword' });
  const fileName = `${selectedMeeting.value.sessionName}-关键提取.doc`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};


// 新增函数：下载参会者数据为 CSV
const downloadParticipantsData = () => {
  if (!selectedMeeting.value || !selectedMeeting.value.participants) {
    ElMessage.info('没有参会者数据可供下载。');
    return;
  }

  // BOM + UTF-8 编码
  let csvContent = '\uFEFF';

  // CSV 头部 (修改)
  csvContent += '用户名,角色,加入时间,离开时间,参会时长,视频开启次数,视频总开启时长,音频开启次数,音频总开启时长,屏幕共享次数,屏幕共享总时长,消息数\n';

  // CSV 数据行
  selectedMeeting.value.participants.forEach(p => {
    // 过滤 undefined 值
    if (Object.values(p).some(value => value === undefined)) {
      console.warn('Skipping participant due to undefined values:', p);
      return; // 跳过此参会者
    }
    const joinTime = p.joinTime ? formatDate(p.joinTime) : 'N/A';
    const leaveTime = p.leaveTime ? formatDate(p.leaveTime) : '未离开';
    const duration = calculateDuration(p.joinTime, p.leaveTime);

    const videoOnCount = p.hasVideo ? getVideoOnCount(p.hasVideo.timeline) : 0;
    const videoTotalOnTime = p.hasVideo ? getVideoTotalOnTime(p.hasVideo.timeline) : '0秒';

    const audioOnCount = p.isAudioOn ? getAudioOnCount(p.isAudioOn.timeline) : 0;
    const audioTotalOnTime = p.isAudioOn ? getAudioTotalOnTime(p.isAudioOn.timeline) : '0秒';
    const sharingCount = p.isSharing ? getSharingCounts(p.isSharing.timeline) : 0;
    const sharingTotalOnTime = p.isSharing ? getSharingTotalTime(p.isSharing.timeline) : '0秒';
    // 新增
    // const uploads = p.uploads || 0; // 移除
    // const downloads = p.downloads || 0; // 移除
    const messagesSent = p.messagesSent || 0;

    csvContent += `${p.userName},${p.role},${joinTime},${leaveTime},${duration},${videoOnCount},${videoTotalOnTime},${audioOnCount},${audioTotalOnTime},${sharingCount},${sharingTotalOnTime},${messagesSent}\n`;
  });

  // 创建 Blob 对象, 指定编码
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // 创建下载链接, 触发下载 (和之前一样)
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${selectedMeeting.value.sessionName}-参会者.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// 格式化日期和时间（精确到秒）
const formatDateTimeForCSV = (timestamp) => {
  if (!timestamp) return '';
  let date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  // 使用更详细的格式化
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};
// 新增函数：下载聊天数据
const downloadChatData = () => {
  if (!selectedMeeting.value || !selectedMeeting.value.chatMessages) {
    ElMessage.info('没有聊天数据可供下载。');
    return;
  }

  // CSV 头部, 添加 BOM
  let csvContent = '\uFEFF类型,发送者,接收者,消息内容,时间戳\n';

  // CSV 数据行
  selectedMeeting.value.chatMessages.forEach(msg => {
    // 过滤掉 undefined 值
    if (Object.values(msg).some(value => value === undefined)) {
      console.warn('Skipping chat message due to undefined values:', msg);
      return; // 跳过此消息
    }
    const type = msg.type === 'group' ? '群聊' : '私聊';
    const sender = msg.senderName;
    const receiver = msg.type === 'private' ? getReceiverName(msg.receiverId) : '所有人';
    const message = msg.message ? msg.message.replace(/,/g, '，') : `[文件] ${msg.file?.name || '未知文件名'}`;  // 使用可选链和空值合并
    //  const timestamp = formatDate(msg.timestamp); // 使用新的格式化函数
    const timestamp = formatDateTimeForCSV(msg.timestamp);
    csvContent += `${type},${sender},${receiver},"${message}",${timestamp}\n`; // 使用双引号包裹消息内容
  });

  // 创建 Blob 对象，并触发下载,  和上面下载参会者类似
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${selectedMeeting.value.sessionName}-聊天记录.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// 根据 receiverId 获取接收者名称（用于私聊）
const getReceiverName = (receiverId) => {
  // 如果是群发消息，直接返回 "所有人"
  if (receiverId === '0' || receiverId === 0) {
    return '所有人';
  }

  // 如果不是群发消息，查找对应的用户
  if (!selectedMeeting.value || !selectedMeeting.value.participants) {
    return `未知用户 (ID: ${receiverId})`; // 显示 ID
  }
  const receiver = selectedMeeting.value.participants.find(p => p.userId === receiverId);

  // 同时显示用户名和 ID
  return receiver ? `${receiver.userName} (ID: ${receiverId})` : `未知用户 (ID: ${receiverId})`;
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
          showSnackBar('获取转录文本失败');
        }
      } else {
        console.warn('用户信息或 meetingId 不存在');
      }
    }
    // 如果切换到 'sentiment'，则调用 fetchSentimentImages
    if (section === 'sentiment') {
      await fetchSentimentImages();
    }
    if (section === 'statistics') {
      await analyzeParticipation();
    }
  } else {
    ElMessage.warning("请等会议结束后再进行查看");
  }
};


onMounted(() => {
  // const dateFromRoute = route.query.date;
  // if (dateFromRoute) {
  //   // 确保 userId 已经就绪
  //   if (store.getters.getUser?.uid) {
  //     fetchMeetingsByDate(dateFromRoute);
  //   } else {
  //     // 如果 userId 还没准备好，设置一个临时的 watcher
  //     const unwatch = store.watch(
  //       (state) => state.user.uid,
  //       (newUid) => {
  //         if (newUid) {
  //           fetchMeetingsByDate(dateFromRoute);
  //           unwatch(); // 取消 watcher
  //         }
  //       }
  //     );
  //   }
  // } else {
  //   // 如果没有日期参数，监听所有会议
  //   if (store.state.user) {
  //     store.dispatch('listenToMeetings');
  //   }
  // }
});
// 获取会议
const fetchMeetingsByDate = async (date) => {
    loading.value = true;
    const userId = store.getters.getUser?.uid;

    if (!userId) {
        console.error("User ID is missing.");
        loading.value = false;
        return;
    }

    try {
        const meetingsOnDate = await FirestoreService.getAllMeetingHistory(userId);

        // 1. 将 Firestore 时间戳转换为 JavaScript Date 对象，*然后*过滤
        const filteredMeetings = meetingsOnDate.filter(meeting => {
             if (!meeting || !meeting.startTime) { //只需要判断startTime
               //console.warn('Invalid meeting data:', meeting);
               return false; // 排除无效的会议
        }

          //将 Firestore Timestamps 转换为 JavaScript Date 对象
          const timestamp = meeting.startTime;  //  只使用 startTime
          if (typeof timestamp.toDate !== 'function') {
               console.warn('startTime 或 joinTime 类型错误', timestamp); //修改
                return false;
            }
            const meetingDate = timestamp.toDate();
            return formatDateForComparison(meetingDate) === date;
        });
        store.commit('SET_MEETINGS', filteredMeetings);
            await nextTick(); //重要！

    } catch (error) {
           console.error('获取会议失败:', error);
        ElMessage.error('获取会议失败：' + error.message);
    } finally {
        loading.value = false;
    }
};
// 监听 Vuex store 中的用户状态变化
watch(
  () => store.getters.getUser,
  (user) => {
    if (user && user.uid) {
      const dateFromRoute = route.query.date;
      if (dateFromRoute) {
          fetchMeetingsByDate(dateFromRoute); // 按日期获取
      } else {
        store.dispatch('listenToMeetings'); // 获取所有，如果没有指定日期
      }
    }
  },
  { immediate: true } 
);



// 获取所有过滤后的会议记录
const allFilteredMeetings = computed(() => {
    // 如果提供了查询参数，且 meetings 数组不为空，则进行过滤
  if (!searchQuery.value) return meetings.value;
     const query = searchQuery.value.toLowerCase();
     return meetings.value.filter((meeting) => {
     // 确保 meeting 对象和必要的属性都存在
     const meetingNameMatch = meeting.sessionName && meeting.sessionName.toLowerCase().includes(query); // 会议名称搜索
    const statusMatch = meeting.status && meeting.status.toLowerCase().includes(query); // 会议状态搜索
        // 确保 startTime 和 endTime 存在，并且是有效的 Date 对象
     const createdAtMatch = meeting.startTime && formatDate(meeting.startTime).toLowerCase().includes(query);
    const endedAtMatch = meeting.endTime && formatDate(meeting.endTime).toLowerCase().includes(query); // 假设这是会议结束时间

        // 返回所有匹配条件的或运算结果
     return meetingNameMatch || statusMatch || createdAtMatch || endedAtMatch;
    });
});

// 当前可见的会议记录
const visibleMeetings = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return allFilteredMeetings.value.slice(startIndex, endIndex);
});


// 返回主页
const goHome = () => {
  showModal.value = false;
  router.push('/home');
};

// 函数：发送转录文本到后端并获取情感分析图表
const fetchSentimentImages = async () => {
  if (!meetingTranscriptions.value) {
    ElMessage.error('会议转录文本为空，无法进行情感分析');
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

// 计算视频开启次数
const getVideoOnCount = (timeline) => {
  if (!timeline || timeline.length === 0) return 0;
  let count = 0;
  let previousValue = timeline[0].value;
  if (previousValue) {
    count = 1;
  }

  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].value && !previousValue) {
      count++;
    }
    previousValue = timeline[i].value;
  }
  return count;
};
// 计算音频开启次数
const getAudioOnCount = (timeline) => {
  if (!timeline || timeline.length === 0) return 0;
  let count = 0;
  let previousValue = timeline[0].value;
  if (previousValue) {
    count = 1;
  }
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].value && !previousValue) {
      count++;
    }
    previousValue = timeline[i].value;
  }
  return count;
};

// 计算视频总开启时长
const getVideoTotalOnTime = (timeline) => {
  if (!timeline || timeline.length === 0) return '0秒';
  let totalOnTime = 0;
  let onTimeStart = null;

  for (const entry of timeline) {
    if (entry.value && onTimeStart === null) {
      onTimeStart = entry.time;
    } else if (!entry.value && onTimeStart !== null) {
      totalOnTime += entry.time - onTimeStart;
      onTimeStart = null;
    }
  }

  // 如果最后是开启状态，且 onTimeStart 不为 null，则需要加上到现在的时长
  if (onTimeStart !== null) {
    totalOnTime += Date.now() - onTimeStart;
  }
  return formatDuration(totalOnTime);
};

// 计算音频总开启时长
const getAudioTotalOnTime = (timeline) => {
  if (!timeline || timeline.length === 0) return '0秒';
  let totalOnTime = 0;
  let onTimeStart = null;

  for (const entry of timeline) {
    if (entry.value && onTimeStart === null) {
      onTimeStart = entry.time;
    } else if (!entry.value && onTimeStart !== null) {
      totalOnTime += entry.time - onTimeStart;
      onTimeStart = null;
    }
  }
  if (onTimeStart !== null) {
    totalOnTime += Date.now() - onTimeStart;
  }
  return formatDuration(totalOnTime);
};

// 计算屏幕共享次数
const getSharingCounts = (timeline) => {
  if (!timeline || timeline.length === 0) return 0;
  let count = 0;
  let previousValue = timeline[0].value;
  if (previousValue) {
    count = 1;
  }
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].value && !previousValue) {
      count++;
    }
    previousValue = timeline[i].value;
  }
  return count;
}
//计算屏幕共享总开启时长
const getSharingTotalTime = (timeline) => {
  if (!timeline || timeline.length === 0) return '0秒';
  let totalOnTime = 0;
  let onTimeStart = null;

  for (const entry of timeline) {
    if (entry.value && onTimeStart === null) {
      onTimeStart = entry.time;
    } else if (!entry.value && onTimeStart !== null) {
      totalOnTime += entry.time - onTimeStart;
      onTimeStart = null;
    }
  }
  if (onTimeStart !== null) {
    totalOnTime += Date.now() - onTimeStart;
  }
  return formatDuration(totalOnTime);
}

// 将毫秒数格式化为 "x小时 y分钟 z秒"
const formatDuration = (milliseconds) => {
  if (milliseconds === 0) return '0秒';

  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let result = '';
  if (hours > 0) {
    result += `${hours}小时 `;
  }
  if (minutes > 0) {
    result += `${minutes}分钟 `;
  }
  if (remainingSeconds > 0 || result === '') { // 如果只有秒, 或者毫秒数为0, 都显示秒
    result += `${remainingSeconds}秒`;
  }
  return result.trim();
};

// 计算参会时长
const calculateDuration = (joinTime, leaveTime) => {
  if (!joinTime) return '未知';
  if (!leaveTime) return '未离开';

  // 确保 joinTime 和 leaveTime 是 Date 对象
  const joinDate = joinTime instanceof Date ? joinTime : joinTime.toDate();
  const leaveDate = leaveTime instanceof Date ? leaveTime : leaveTime.toDate();

  const diffInSeconds = Math.floor((leaveDate.getTime() - joinDate.getTime()) / 1000);
  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  // 修改为 "时:分:秒" 格式，并补零
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return formattedTime;
};

// ——————————参会者行为分析——————————————
// 存储参与度分析结果
const participationAnalysisResults = ref([]);
// 存储当前会议的 ID
const currentMeetingId = ref(null);

// 新增函数：发送参与度分析请求
const analyzeParticipation = async () => {
  if (!selectedMeeting.value || !selectedMeeting.value.participants) {
    showSnackBar('没有参会者数据可供分析');
    return;
  }
  // 检查是否切换了会议，如果是则重置分析结果
  if (currentMeetingId.value !== selectedMeeting.value.meetingId) {
    participationAnalysisResults.value = [];
    currentMeetingId.value = selectedMeeting.value.meetingId;
  }
  // 检查是否有会议摘要
  // if (!summary.value) {
  //   showSnackBar('暂无会议摘要，无法进行参与度分析');
  //   return;
  // }
  // 提取每个用户的参与数据
  const participantsData = selectedMeeting.value.participants.map(p => {
    const cameraOnTimes = p.hasVideo ? getVideoOnCount(p.hasVideo.timeline) : 0;
    const cameraDuration = p.hasVideo ? getVideoTotalOnTime(p.hasVideo.timeline) : '0秒';
    const audioOnTimes = p.isAudioOn ? getAudioOnCount(p.isAudioOn.timeline) : 0;
    const audioDuration = p.isAudioOn ? getAudioTotalOnTime(p.isAudioOn.timeline) : '0秒';
    const shareOnTimes = p.isSharing ? getSharingCounts(p.isSharing.timeline) : 0;
    const shareDuration = p.isSharing ? getSharingTotalTime(p.isSharing.timeline) : '0秒';
    const messageCount = p.messagesSent || 0;
    const totalDuration = calculateDuration(selectedMeeting.value.startTime, selectedMeeting.value.endTime);

    // 提取用户的聊天消息
    const messages = selectedMeeting.value.chatMessages
      .filter(msg => msg.senderId === p.userId)
      .map(msg => msg.message);

    return {
      userId: p.userId,
      userName: p.userName,
      role: p.role,
      cameraOnTimes,
      cameraDuration: convertDurationToSeconds(cameraDuration),
      audioOnTimes,
      audioDuration: convertDurationToSeconds(audioDuration),
      shareOnTimes,
      shareDuration: convertDurationToSeconds(shareDuration),
      messageCount,
      totalDuration: convertDurationToSeconds(totalDuration),
      messages
    };
  });

  try {
    // 开始加载，显示进度条
    isLoadingAnalysis.value = true;
    analysisProgress.value = 0;

    // 模拟进度条更新
    const intervalId = setInterval(() => {
      if (analysisProgress.value < 100) {
        analysisProgress.value += 9;
      }
    }, 1000);

    // 发送 POST 请求到后端 API
    const response = await axios.post('http://localhost:5000/analyze-participation', {
      participants: participantsData,
      topicKeywords: summary.value,
      meetingId: selectedMeeting.value.meetingId
    });

     // 清除进度条更新定时器
     clearInterval(intervalId);
    analysisProgress.value = 100;

    // 检查返回结果的会议 ID 是否与当前会议 ID 一致
    if (response.data.meetingId === currentMeetingId.value) {
      // 处理后端返回的结果
      participationAnalysisResults.value = response.data.results;
      console.log('参与度分析结果:', participationAnalysisResults.value);
    } else {
      console.log('忽略旧会议的分析结果');
    }
  } catch (error) {
    console.error('参与度分析请求失败:', error);
    ElMessage.info('参与度分析请求失败，请稍后重试');
  } finally {
    // 结束加载，隐藏进度条
    isLoadingAnalysis.value = false;
    analysisProgress.value = 0;
  }
};
// 监听 selectedMeeting 的变化，当会议切换时重置分析结果
watch(selectedMeeting, (newMeeting) => {
  if (newMeeting) {
    participationAnalysisResults.value = [];
    currentMeetingId.value = newMeeting.meetingId;
  }
});
// 将时长字符串转换为秒数
const convertDurationToSeconds = (duration) => {
  const parts = duration.match(/(\d+)小时 (\d+)分钟 (\d+)秒/);
  if (parts) {
    const hours = parseInt(parts[1], 10);
    const minutes = parseInt(parts[2], 10);
    const seconds = parseInt(parts[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
};
// 计算属性：截取 selectedMeeting.participants 的前 5 条数据
const limitedParticipants = computed(() => {
  return selectedMeeting.value.participants.slice(0, 5);
});

// 计算属性：截取 participationAnalysisResults 的前 5 条数据
const limitedAnalysisResults = computed(() => {
  return participationAnalysisResults.value.slice(0, 5);
});
// 新增函数：下载参与度分析结果为 Excel 文件
const downloadParticipationAnalysis = () => {
  console.log('开始下载参与度分析结果');
  if (participationAnalysisResults.value.length === 0) {
    console.log('参与度分析结果为空，无法下载');
    ElMessage.info('参与度分析结果未准备好，请等待');
    return;
  }
  const customHeader = ['用户名', '角色', '行为参与度', '认知参与度', '综合参与度'];
  const data = participationAnalysisResults.value.map(result => [
    result.userName,
    result.role,
    result.behaviorScore.toFixed(2),
    result.cognitiveScore.toFixed(2),
    result.participationScore.toFixed(2)
  ]);
  console.log('准备生成的 Excel 数据:', data);
  const worksheet = XLSX.utils.aoa_to_sheet([customHeader, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '参与度分析结果');
  try {
    console.log('开始生成 Excel 文件');
    XLSX.writeFile(workbook, `${selectedMeeting.value.sessionName}-参与度分析.xlsx`);
    console.log('Excel 文件生成并下载成功');
  } catch (error) {
    console.error('文件生成失败:', error);
    showSnackBar('文件生成失败，请稍后重试');
  }
};
// 下载参与者所有信息
const downloadParticipantsAllData = () => {
  if (participationAnalysisResults.value.length === 0) {
    ElMessage.info('暂无参与度分析结果可供下载');
    return;
  }
  // 合并参会者数据和参与度分析结果
  const combinedData = selectedMeeting.value.participants.map((participant) => {
    const analysisResult = participationAnalysisResults.value.find((result) => result.userId === participant.userId);
    const joinTime = participant.joinTime ? formatDate(participant.joinTime) : 'N/A';
    const leaveTime = participant.leaveTime ? formatDate(participant.leaveTime) : '未离开';
    const duration = calculateDuration(participant.joinTime, participant.leaveTime);
    const videoOnCount = participant.hasVideo ? getVideoOnCount(participant.hasVideo.timeline) : 0;
    const videoTotalOnTime = participant.hasVideo ? getVideoTotalOnTime(participant.hasVideo.timeline) : '0秒';
    const audioOnCount = participant.isAudioOn ? getAudioOnCount(participant.isAudioOn.timeline) : 0;
    const audioTotalOnTime = participant.isAudioOn ? getAudioTotalOnTime(participant.isAudioOn.timeline) : '0秒';
    const sharingCount = participant.isSharing ? getSharingCounts(participant.isSharing.timeline) : 0;
    const sharingTotalOnTime = participant.isSharing ? getSharingTotalTime(participant.isSharing.timeline) : '0秒';
    const messagesSent = participant.messagesSent || 0;

    return {
      用户名: participant.userName,
      角色: participant.role,
      加入时间: joinTime,
      离开时间: leaveTime,
      参会时长: duration,
      视频开启次数: videoOnCount,
      视频总开启时长: videoTotalOnTime,
      音频开启次数: audioOnCount,
      音频总开启时长: audioTotalOnTime,
      屏幕共享次数: sharingCount,
      屏幕共享总时长: sharingTotalOnTime,
      消息数: messagesSent,
      行为参与度: analysisResult ? analysisResult.behaviorScore.toFixed(2) : 'N/A',
      认知参与度: analysisResult ? analysisResult.cognitiveScore.toFixed(2) : 'N/A',
      综合参与度: analysisResult ? analysisResult.participationScore.toFixed(2) : 'N/A'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(combinedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '参与度分析结果');
  XLSX.writeFile(workbook, `${selectedMeeting.value.sessionName}-参会数据.xlsx`);
};


</script>
<style scoped>
/* ... 之前的样式 ... */
/* 通用样式 */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.pagination button {
  margin: 0 10px;
  padding: 5px 10px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pagination button:hover {
  background-color: #0056b3;
}

.pagination button:disabled {
  background-color: #eeeeee;
  cursor: not-allowed;
}

.pagination span {
  margin: 0 10px;
}
/* 关闭按钮样式 */
.close-btn-wrapper{
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
  width: 25px;
  height: 25px;
}
.close-btn:hover{
    transform: rotate(90deg);
}
/* 容器样式 */
.history-container {
  padding: 10px 10px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  margin: 10px auto;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  border-radius: 15px;
  /* box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); */
  /* box-shadow: var(--global-box-shadow); 应用全局边框阴影 */
  border: none;
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
  align-items: center;
}

.input-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
  display: flex; /* 确保子元素也能正确布局 */
  justify-content: center; /* 水平居中 */
}

.search-input {
  width: 100%;
  padding: 12px 50px 12px 40px; /* 为图标留出空间 */
  border-radius: 30px;
  border: 2px solid #ccc; /* 边框颜色 */
  font-size: 16px;
  outline: none; /* 取消默认的聚焦样式 */
  transition: border-color 0.3s, box-shadow 0.3s; /* 平滑过渡 */
}

.search-input:focus {
  border-color: #007BFF;
  /* box-shadow: 0 0 8px rgba(0, 123, 255, 0.3); */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
}

.search-input::placeholder {
  color: #999999;
  font-style: italic; /* 可选：占位符斜体 */
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 12px; /* 图标位置 */
  transform: translateY(-50%);
  width: 24px; /* 图标大小 */
  height: 24px;
  pointer-events: none;
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
   background-color: #e6f7ff; /* 浅蓝色背景 */
   border-color: #91d5ff;
 }
 .load-more-btn {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.load-more-btn:hover {
  background-color: #0056b3;
}

.loading-indicator {
  text-align: center;
  color: #007BFF;
  margin: 20px 0;
}


 .meeting-list li.finished {
  background-color: #f6ffed; /* 浅绿色背景 */
  border-color: #b7eb8f;
}

.meeting-list li.scheduled {
  background-color: #fff1f0;
  border-color: #ffa39e;
}

.meeting-list strong {
  color: #333333;
  display: inline-block;
  width: 120px; /* 调整标题宽度 */
}
.explanation-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 600px;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
}

.modal-content h4 {
  text-align: center;
  color: #a962ff;
  margin-bottom: 20px;
  margin-top: -10px;
  font-size: 22px;
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
  box-shadow: var(--global-box-shadow); 
  overflow-y: auto; 
  margin-top: 40px;
}


#meetingDetails h3 {
  text-align: center;
  color: #007BFF;
  margin-bottom: 20px;
  font-size: 22px;
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
.chat-record-container {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  justify-content: center; /* 水平居中整体内容 */
  gap: 10px; /* 设置元素之间的间距 */
}
.download-btn {
  border: none; /* 蓝色边框 */
  background-color:transparent;
  border-radius: 8px;
  cursor: pointer;
  padding: 8px;
  transition: background-color 0.3s, transform 0.3s;
}
.download-btn img{
    width: 24px; /* 图标大小 */
    height: 24px;
}

.download-btn:hover {
  background-color: #cbe4ff; /* 鼠标悬停时变为蓝色背景 */
  transform: scale(1.05);  /* 稍微放大 */
}

.download-btn:active {
  transform: scale(0.95); /* 点击时略微缩小 */
}

/* 功能按钮样式 */
.function-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  flex-wrap: wrap; /* 允许按钮换行 */
}

.function-buttons button {
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s, transform 0.2s;
  font-size: 16px;
  margin: 10px; /* 添加外边距 */
  flex: 1 1 40%; /* 允许按钮根据内容自动调整宽度，最多占据40% */
  max-width: 200px; /* 设置最大宽度 */
}

.function-buttons button:hover {
  background-color: #e0e0e0;
  border-color: #007BFF;
  transform: translateY(-2px); /* 轻微上移效果 */
}

.function-buttons button:active {
  transform: translateY(0); /* 点击时恢复原位 */
}

/* 内容区域样式 */
.section-content {
  margin-top: 25px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 10px;
  border: 1px solid #ddd; /* 添加边框 */
  transition: background-color 0.3s, border-color 0.3s;
}

.section-content p {
  color: #444444;
  font-size: 16px;
  line-height: 1.8;
}

.info-message {
  text-align: center;
  color: #ff4d4f; /* 使用 Element Plus 的错误色 */
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
  max-width: 800px; /* 限制图片最大宽度 */
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
  margin-top: 15px; /* 添加上边距 */
}

.summary-icon {
  font-size: 24px; /* 加大图标大小 */
  transition: transform 0.3s; /* 添加过渡效果 */
}

.icon-container:hover .summary-icon {
  transform: scale(1.2); /* 鼠标悬停放大效果 */
}

/* 摘要输出样式 */
.summary-output {
  margin-top: 25px;
  padding: 15px;
  background-color: #f0f8ff; /* 浅蓝色背景 */
  border-radius: 10px;
  border: 1px solid #cceeff; /* 浅蓝色边框 */
}

.summary-output p {
  margin: 0; /* 清除默认边距 */
  font-size: 16px;
  color: #333333;
  line-height: 1.8;
}

/* 禁用按钮样式 */
button:disabled {
  background-color: #eeeeee;
  cursor: not-allowed;
}

/* 参会者表格样式 */
.table-scrollable-wrapper {
    overflow-x: auto; /* 允许水平滚动 */
    width: 100%;
}
.participants-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.participants-table th,
.participants-table td {
  padding: 10px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
   min-width: 100px; /*  最小宽度 */
  white-space: nowrap; /*  不换行 */
}

.participants-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}
.share{
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background-color: #bedeff;
  color: #000;
  cursor: pointer;
  font-size: 15px;
  transition: background-color 0.3s ease;
}
.share:hover{
  transform: translateY(-5px);
  background-color: #90c4f8;

}
/* 响应式设计 */
@media (max-width: 768px) {
  /* 通用调整 */
  .history-container {
    padding: 15px 10px;
    width: 100%;
    margin: 10px auto;
    max-height: 95vh;
  }

  h2 {
    font-size: 20px !important;
    margin-bottom: 15px !important;
  }

  /* 搜索框 */
  .input-wrapper {
    max-width: 100%;
  }

  .search-container {
    padding: 0 10px;
    max-width: 100%;
  }

  .search-input {
    padding: 10px 40px 10px 15px;
    font-size: 14px;
    width: 100%; /* 确保在小屏幕上宽度占满父容器 */
  }
  .search-icon {
    width: 20px;
    height: 20px;
  }

  /* 会议列表 */
  .meeting-list li {
    padding: 10px 12px;
    margin-bottom: 10px;
  }

  .meeting-list strong {
    width: 80px;
    font-size: 14px;
  }

  .meeting-list li > br {
    display: none;
  }

  /* 分页 */
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }

  .pagination button {
    margin: 0 5px;
    padding: 4px 8px;
  }

  /* 会议详情弹窗 */
  .meeting-detail-modal {
    width: 95%;
    padding: 15px 10px;
    max-height: 90vh;
  }

  #meetingDetails h3 {
    font-size: 18px;
    margin-bottom: 15px;
  }

  /* 功能按钮 */
  .function-buttons button {
    flex: 1 1 100%;
    max-width: 100%;
    margin: 5px 0;
    padding: 10px 15px;
    font-size: 14px;
  }

  /* 表格调整 */
  .table-scrollable-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .participants-table {
    font-size: 12px;
  }

  .participants-table th,
  .participants-table td {
    padding: 8px 10px;
    min-width: 80px;
  }

  /* 评分说明弹窗 */
  .modal-content {
    width: 90%;
    padding: 15px;
  }

  .modal-content h4 {
    font-size: 18px;
  }

  /* 下载按钮 */
  .download-btn img {
    width: 20px;
    height: 20px;
  }

  /* 分享按钮 */
  .share {
    padding: 6px 12px;
    font-size: 13px;
  }

  /* 关闭按钮 */
  .close-btn img {
    width: 20px;
    height: 20px;
  }

  /* 图表容器 */
  .chart-container img {
    max-width: 100%;
  }

  /* 文本内容 */
  .section-content p {
    font-size: 14px;
  }

  /* 参与度分析标题 */
  .chat-record-container h3 {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  /* 更小屏幕的额外调整 */
  .meeting-list strong {
    width: 70px;
    font-size: 12px;
  }

  .participants-table {
    font-size: 11px;
  }

  .function-buttons button {
    font-size: 13px;
    padding: 8px 12px;
  }
  .search-input {
    padding-left: 50px;
    border-width: 1px;
    border-radius: 20px;
    width: 100%; /* 确保在更小屏幕上宽度占满父容器 */
  }
  #meetingDetails p {
    font-size: 14px;
  }
}


</style>

