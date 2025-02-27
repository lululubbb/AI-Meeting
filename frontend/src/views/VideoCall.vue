<template>
  <main>
    <!-- 会议信息表单：仅在 autoJoin=false 时显示 -->
    <div id="action-flow" v-if="!autoJoin">
      <span class="closeBtn" @click="goHome">×</span>
      <h1>视频会议</h1>

      <!-- 创建会议表单 -->
      <div v-if="mode === 'create'" class="input-group">
        <label for="sessionName">会议名称:</label>
        <input
          id="sessionName"
          v-model="config.sessionName"
          placeholder="请输入会话名称"
        />
      </div>
      <div v-if="mode === 'create'" class="input-group">
        <label for="userName">用户名:</label>
        <input
          id="userName"
          v-model="config.userName"
          placeholder="请输入用户名"
        />
      </div>
      <div v-if="mode === 'create'" class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input
          id="sessionPasscode"
          v-model="config.sessionPasscode"
          placeholder="请输入会议密码"
        />
      </div>

      <!-- 加入会议表单 -->
      <div v-if="mode === 'join'" class="input-group">
        <label for="sessionName">会议名称:</label>
        <input
          id="sessionName"
          v-model="config.sessionName"
          placeholder="请输入会议名称"
        />
      </div>
      <div v-if="mode === 'join'" class="input-group">
        <label for="userName">用户名:</label>
        <input
          id="userName"
          v-model="config.userName"
          placeholder="请输入用户名"
        />
      </div>
      <div v-if="mode === 'join'" class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input
          id="sessionPasscode"
          v-model="config.sessionPasscode"
          placeholder="请输入会议密码"
        />
      </div>

      <!-- 角色选择 (仅在创建会议时显示) -->
      <div v-if="mode === 'create'" class="input-group">
        <label for="role">角色:</label>
        <select id="role" v-model.number="role">
          <option :value="1">主持人</option>
          <option :value="0">参与者</option>
        </select>
      </div>

      <!-- 模式切换按钮 -->
      <div class="mode-switch">
        <button @click="toggleMode">
          {{ mode === 'create' ? '切换到加入会议' : '切换到创建会议' }}
        </button>
      </div>

      <!-- 提交按钮 -->
      <CustomButton :text="buttonText" :onPressed="handleSession" />
    </div>

    <!-- 主会议界面：当 autoJoin=true 时显示 -->
    <div v-else class="meeting-layout">
      <!-- 加入会议时的加载动画 -->
      <div v-if="isJoining && !sessionJoined" class="meeting-loading">
        <div class="spinner"></div>
        <p>正在加入会议，请稍候...</p>
      </div>

      <!-- 实际会议内容 -->
      <div v-else class="meeting-content">
        <!-- 左侧：视频区域 -->
        <div class="left-panel">
          <!-- 参与者缩略图行 -->
          <div class="participants-row">
            <video-player-container
              v-for="user in users"
              :key="user.userId"
              class="participant-tile"
              :id="`user-${user.userId}`"
            >
              <div class="video-content">
                <div v-if="!user.hasVideo" class="placeholder">
                  {{ user.userName }}
                </div>
              </div>
              <div class="username-label">{{ user.userName }}</div>
            </video-player-container>
          </div>

          <!-- 演讲者/共享 大区域 -->
          <video-player-container class="speaker-area" >
            <!-- 当没有人共享时，显示提示 -->
            <div v-if="!someoneIsSharing" class="speaker-placeholder">
              <p>当前无人共享</p>
            </div>
            <!-- 字幕容器 -->
            <div class="subtitle">
              {{ subtitle }}
            </div>
          </video-player-container>

          <!-- 底部控制栏 -->
          <div class="controls">
            <button @click="toggleVideo" :class="{ active: isVideoOn }">
              {{ isVideoOn ? '关闭视频' : '开启视频' }}
            </button>
            <button @click="toggleAudio" :class="{ active: !isAudioOn }">
              {{ isAudioOn ? '静音' : '开启麦克风' }}
            </button>
            <button @click="toggleScreenShare" :class="{ active: isSharing }">
              {{ isSharing ? '停止共享屏幕' : '共享屏幕' }}
            </button>
            <button @click="toggleChat" :class="{ active: isChatVisible }">
              群聊
            </button>
            <!-- 服务质量按钮 -->
            <button @click="toggleServiceQuality" :class="{ active: showServiceQuality }">
              服务质量
            </button>
            <button v-if="isHost" @click="endSession" class="exit-button">
              结束会议
            </button>
            <button v-else @click="leaveSession" class="exit-button">
              退出会议
            </button>
          </div>

          <!-- 群聊窗口 (弹层) -->
          <div v-if="isChatVisible" class="chat-container">
            <div class="chat-header">
              <span>聊天</span>
              <button @click="toggleChat" class="close-chat">×</button>
            </div>
            <!-- --- 新增部分 START: 选择聊天对象 + 文件发送 --- -->
            <div class="chat-controls">
              <label>发送给：</label>
              <select v-model="selectedReceiverId" class="receiver-select">
                <option value="0">所有人</option>
                <option
                  v-for="userItem in chatReceivers"
                  :key="userItem.userId"
                  :value="userItem.userId"
                >
                  {{ userItem.displayName }} (ID: {{ userItem.userId }})
                </option>
              </select>
              
              <!-- 文件发送按钮 -->
              <button
                class="send-file-button"
                @click="triggerFileInput"
              >
                发送文件
              </button>
              <!-- 隐藏的文件 input，用于发送文件 -->
              <input
                ref="fileInput"
                type="file"
                style="display: none;"
                @change="onFileInputChange"
              />
            </div>
            <!-- --- 新增部分 END: 选择聊天对象 + 文件发送 --- -->

            <!-- 消息列表 -->
            <div class="chat-messages" ref="chatMessages">
              <div
                v-for="(msg, index) in chatMessagesList"
                :key="index"
                class="chat-message"
              >
                <!-- 如果是文件消息，显示文件名 + 下载按钮 -->
                <div v-if="msg.file">
                  <strong>{{ msg.sender }} 发来的文件：</strong>
                  <span>{{ msg.file.name }} ({{ msg.file.size }} bytes)</span>
                  <button
                    @click="downloadFile(msg)"
                    class="download-button"
                  >
                    下载
                  </button>
                  <!-- 显示文件下载进度/状态 -->
                  <div v-if="msg.fileDownloadProgress !== undefined">
                    下载进度: {{ msg.fileDownloadProgress }}%
                    <span v-if="msg.fileDownloadStatus === 'Fail'">下载失败</span>
                    <span v-if="msg.fileDownloadStatus === 'Cancel'">已取消</span>
                  </div>
                </div>
                <!-- 否则显示文本消息 -->
                <div v-else>
                  <strong>{{ msg.sender }}:</strong> {{ msg.message }}
                </div>
              </div>
            </div>

            <!-- 输入框 + 发送按钮 -->
            <div class="chat-input">
              <input
                v-model="chatInput"
                @keyup.enter="sendChat"
                placeholder="输入消息..."
              />
              <button @click="sendChat">发送</button>
            </div>

            <!-- 显示文件上传进度/状态（如果有） -->
            <div v-if="uploadProgressInfo" class="upload-progress">
              <p>
                文件 "{{ uploadProgressInfo.fileName }}" 上传中:
                {{ uploadProgressInfo.progress }}%
                <button @click="cancelSendFile">取消</button>
              </p>
              <p v-if="uploadProgressInfo.status === 'Fail'">上传失败</p>
              <p v-if="uploadProgressInfo.status === 'Cancel'">上传已取消</p>
            </div>
          </div>

          <!-- 服务质量窗口 (弹窗)，仅当 showServiceQuality=true 时显示 -->
          <div v-if="showServiceQuality" class="service-quality-overlay">
            <div class="service-quality-header">
              <span>服务质量</span>
              <button @click="toggleServiceQuality" class="close-quality">×</button>
            </div>
            <div class="service-quality-content">
              <!-- 只保留 ECharts 容器，不显示文字 -->
              <div id="networkChart" class="chart-container"></div>

              <!-- == 新增文字显示区: 显示实时统计信息 == -->
              <div class="stats-text">
                <h3>实时统计信息</h3>
                
                <h4>Video Encode</h4>
                <table class="stats-table" v-if="statsData.videoEncode">
                  <tbody>
                  <tr><td>FPS:</td><td>{{ statsData.videoEncode.fps ?? '--' }}</td></tr>
                  <tr><td>Bitrate:</td><td>{{ statsData.videoEncode.bitrate ?? '--' }}</td></tr>
                  <tr><td>avg_loss:</td><td>{{ statsData.videoEncode.avg_loss ?? '--' }}</td></tr>
                  <tr><td>rtt:</td><td>{{ statsData.videoEncode.rtt ?? '--' }}</td></tr>
                  </tbody>
                </table>

                <h4>Video Decode</h4>
                <table class="stats-table" v-if="statsData.videoDecode">
                  <tbody>
                  <tr><td>FPS:</td><td>{{ statsData.videoDecode.fps ?? '--' }}</td></tr>
                  <tr><td>Bitrate:</td><td>{{ statsData.videoDecode.bitrate ?? '--' }}</td></tr>
                  <tr><td>avg_loss:</td><td>{{ statsData.videoDecode.avg_loss ?? '--' }}</td></tr>
                  <tr><td>rtt:</td><td>{{ statsData.videoDecode.rtt ?? '--' }}</td></tr>
                  </tbody>
                </table>

                <h4>Audio Encode</h4>
                <table class="stats-table" v-if="statsData.audioEncode">
                  <tbody>
                  <tr><td>Bitrate:</td><td>{{ statsData.audioEncode.bitrate ?? '--' }}</td></tr>
                  <tr><td>avg_loss:</td><td>{{ statsData.audioEncode.avg_loss ?? '--' }}</td></tr>
                  <tr><td>rtt:</td><td>{{ statsData.audioEncode.rtt ?? '--' }}</td></tr>
                  <tr><td>sample_rate:</td><td>{{ statsData.audioEncode.sample_rate ?? '--' }}</td></tr>
                  </tbody>
                </table>

                <h4>Audio Decode</h4>
                <table class="stats-table" v-if="statsData.audioDecode">
                  <tbody>
                  <tr><td>Bitrate:</td><td>{{ statsData.audioDecode.bitrate ?? '--' }}</td></tr>
                  <tr><td>avg_loss:</td><td>{{ statsData.audioDecode.avg_loss ?? '--' }}</td></tr>
                  <tr><td>rtt:</td><td>{{ statsData.audioDecode.rtt ?? '--' }}</td></tr>
                  <tr><td>sample_rate:</td><td>{{ statsData.audioDecode.sample_rate ?? '--' }}</td></tr>
                </tbody>
                </table>

                <h4>Share Encode</h4>
                <table class="stats-table" v-if="statsData.shareEncode">
                  <tbody>
                  <tr><td>FPS:</td><td>{{ statsData.shareEncode.fps ?? '--' }}</td></tr>
                  <tr><td>Bitrate:</td><td>{{ statsData.shareEncode.bitrate ?? '--' }}</td></tr>
                  <tr><td>avg_loss:</td><td>{{ statsData.shareEncode.avg_loss ?? '--' }}</td></tr>
                  <tr><td>width x height:</td>
                      <td>{{ statsData.shareEncode.width }} x {{ statsData.shareEncode.height }}</td></tr>
                    </tbody>
                </table>

                <h4>Share Decode</h4>
                <table class="stats-table" v-if="statsData.shareDecode">
                  <tbody>
                  <tr><td>FPS:</td><td>{{ statsData.shareDecode.fps ?? '--' }}</td></tr>
                  <tr><td>Bitrate:</td><td>{{ statsData.shareDecode.bitrate ?? '--' }}</td></tr>
                  <tr><td>avg_loss:</td><td>{{ statsData.shareDecode.avg_loss ?? '--' }}</td></tr>
                  <tr><td>width x height:</td>
                      <td>{{ statsData.shareDecode.width }} x {{ statsData.shareDecode.height }}</td></tr></tbody>
                </table>

              </div>
              <!-- == 新增文字显示区结束 == -->
            </div>
          </div>
        </div>

        <!-- 右侧：转录 & 录音 -->
        <div class="right-panel" v-if="sessionJoined">
          <h2>会议转录</h2>
          <p>{{ fullTranscription }}</p>

          <div class="recording-controls">
            <img
              :src="isRecording ? stopIcon : startIcon"
              alt="语音转录"
              @click="toggleRecording"
              class="recording-icon"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick,computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js';
import * as echarts from 'echarts';
import CustomButton from '../components/CustomButton.vue';
import ZoomVideoService, { VideoQuality } from '../services/ZoomVideoService.js';
import { showSnackBar } from '../utils/utils.js';

import startIcon from '@/assets/start-icon.png';
import stopIcon from '@/assets/stop-icon.png';

// Vuex / Router
const store = useStore();
const route = useRoute();
const router = useRouter();

// 录音状态
const isRecording = ref(false);
// WebSocket 连接
const ws8000 = ref(null); // ASR服务器 WebSocket (8000)
const ws8001 = ref(null); // 标点处理服务器 WebSocket (8001)
// 存储转录文本（作为单个字符串）
const fullTranscription = ref('');
// 存储字幕文本
const subtitle = ref('');
// 累计无标点字符
const accumulatedText = ref('');
// 定时器 ID
const intervalId = ref(null);

/* 会议相关状态 */
const config = reactive({
  videoSDKJWT: '',
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  expirationSeconds: 7200,
  meetingId: ''
});
const mode = ref(route.query.mode || 'join');
const role = ref(mode.value === 'create' ? 1 : 0);
const sessionJoined = ref(false);
const autoJoin = ref(false);
const buttonText = ref(mode.value === 'create' ? '创建会议' : '加入会议');
const isJoining = ref(false);

/* 视频/音频/屏幕共享控制 */
const isVideoOn = ref(true);
const isAudioOn = ref(true);
const isSharing = ref(false); // 本地是否在共享

/** 计算属性: 是否有人共享 */
const someoneIsSharing = computed(() => {
  return users.value.some(u => u.isSharing);
});

// 控制“服务质量”面板的显示/隐藏
 const showServiceQuality = ref(false);
//  用于记录“最新的”编码/解码数据，用于在文本区显示
 const statsData = reactive({
  videoEncode: null,
  videoDecode: null,
  audioEncode: null,
  audioDecode: null,
  shareEncode: null,
  shareDecode: null
});
//    用数组去记录关键数值(用于折线图)
const uplinkData = ref([]);  // 网络上行
const downlinkData = ref([]); // 网络下行

const videoEncodeFpsData = ref([]); // 视频发送FPS
const videoDecodeFpsData = ref([]); // 视频接收FPS

const audioEncodeLossData = ref([]); // 音频发送avg_loss
const audioDecodeLossData = ref([]); // 音频接收avg_loss

let networkChart = null;  // ECharts实例

/* 聊天 */
const isChatVisible = ref(false);
const chatInput = ref('');
const chatMessagesList = ref([]);
// 用于私聊、文件传输
const chatReceivers = ref([]);
const selectedReceiverId = ref(0);
const uploadProgressInfo = ref(null);
let cancelSendFileFn = null;
/* 用户列表 */
const users = ref([]);
const currentUserId = ref(null);
const isHost = ref(false);

/* DOM引用 */
// const speakerArea = ref(null);
const chatMessages = ref(null);

const goHome = () => {
  router.push('/home');
};

/** 切换模式 */
const toggleMode = () => {
  mode.value = mode.value === 'create' ? 'join' : 'create';
  buttonText.value = mode.value === 'create' ? '创建会议' : '加入会议';
  role.value = mode.value === 'create' ? 1 : 0;
};

onMounted(() => {
  checkRouteParams();
});

/** 如果 URL query 有 sessionName等参数就自动加入会议 */
async function checkRouteParams() {
  const {
    sessionName,
    userName,
    sessionPasscode,
    role: roleParam,
    videoSDKJWT,
    expirationSeconds
  } = route.query;

  if (sessionName && userName && roleParam !== undefined && videoSDKJWT) {
    config.sessionName = sessionName;
    config.userName = userName;
    config.sessionPasscode = sessionPasscode || '';
    config.expirationSeconds = expirationSeconds ? parseInt(expirationSeconds, 10) : 7200;
    role.value = parseInt(roleParam, 10);
    config.videoSDKJWT = videoSDKJWT;

    autoJoin.value = true;
    await nextTick();
    await joinSession();
  }
}

/** 创建或加入会议 */
const handleSession = async () => {
  if (!config.sessionName || !config.userName) {
    showSnackBar('请填写会议名称和用户名');
    return;
  }
  if (mode.value === 'create' && role.value !== 1) {
    showSnackBar('创建会议时角色必须为主持人');
    return;
  }

  try {
    isJoining.value = true;
    let jwt;
    if (mode.value === 'create') {
      jwt = await ZoomVideoService.getVideoSDKJWT(
        config.sessionName,
        1,
        config.userName,
        config.sessionPasscode,
        config.expirationSeconds
      );
    } else {
      jwt = await ZoomVideoService.getVideoSDKJWT(
        config.sessionName,
        parseInt(role.value, 10),
        config.userName,
        config.sessionPasscode,
        config.expirationSeconds
      );
    }

    if (!jwt) {
      showSnackBar('无法获取有效 JWT');
      isJoining.value = false;
      return;
    }

    config.videoSDKJWT = jwt;
    const user = store.getters.getUser;
    if (user) {
      try {
        // 添加一条会议历史记录(ongoing)
        const meetingId = await FirestoreService.addToMeetingHistory(
          user.uid,
          config.sessionName,
          { status: 'ongoing' }
        );
        config.meetingId = meetingId;  // 保存到 config，后续 update 用到
        console.log('已添加会议历史记录，ID:', meetingId);
      } catch (error) {
        console.error('添加会议历史记录失败:', error);
        showSnackBar('添加会议历史记录失败: ' + error.message);
      }
    } else {
      console.error('当前无登录用户，无法添加会议历史记录');
      showSnackBar('用户信息未找到，无法添加会议历史记录');
    }
    autoJoin.value = true;
    await nextTick();
    await joinSession();
  } catch (error) {
    console.error('handleSession error:', error);
    showSnackBar('加入/创建会议失败: ' + error.message);
    isJoining.value = false;
  }
};

// 更新滚动字幕的方法
const updateSubtitle = (char) => {
  subtitle.value += char;
  // 限制滚动字幕长度 (只显示最后 50 个字符)
  if (subtitle.value.length > 50) {
    subtitle.value = subtitle.value.slice(-30)
  }
};
// 点击服务质量按钮时，初始化图表并显示弹窗
function toggleServiceQuality() {
  if (!showServiceQuality.value) {
    // 从 false -> true，先设置 true，让 <div v-if="showServiceQuality"> 出现
    showServiceQuality.value = true;
    nextTick(() => {
      // 等DOM挂载后再 init
      if (!networkChart) {
        initNetworkChart();
      }
      // 可选: 也可立即 resize
      networkChart.resize();
    });
  } else {
    // 从 true -> false，需要先手动销毁 ECharts，再隐藏 DOM
    if (networkChart) {
      networkChart.dispose();
      networkChart = null;
    }
    showServiceQuality.value = false;
  }
}

// 初始化ECharts
function initNetworkChart() {
  const chartDom = document.getElementById('networkChart');
  if (!chartDom) return;

  if (!networkChart) {
    networkChart = echarts.init(chartDom);
  }

  // 初始option
  networkChart.setOption({
    // title: { text: '服务质量实时图表' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: [
        'NetworkUp','NetworkDown','VidEncFPS','VidDecFPS','AudEncLoss','AudDecLoss'
      ]
    },
    xAxis: { type: 'category', boundaryGap: false, data: [] },
    yAxis: {
      type: 'value',
      min: 0
    },
    series: [
      {name: 'NetworkUp',type: 'line',data: [],smooth: true,color: '#EE6666'},
      {name: 'NetworkDown',type: 'line',data: [],smooth: true,color: '#91CC75'},
      {name: 'VidEncFPS',type: 'line',data: [],smooth: true,color: '#FAC858'},
      {name: 'VidDecFPS',type: 'line',data: [],smooth: true,color: '#5470C6'},
      {name: 'AudEncLoss',type: 'line',data: [],smooth: true,color: '#73C0DE'},
      {name: 'AudDecLoss',type: 'line',data: [],smooth: true,color: '#3BA272'}
    ]
  });
}

// 更新图表
function updateChart() {
  if (!networkChart) return;

  const len = Math.max(
    uplinkData.value.length,
    downlinkData.value.length,
    videoEncodeFpsData.value.length,
    videoDecodeFpsData.value.length,
    audioEncodeLossData.value.length,
    audioDecodeLossData.value.length
  );
  const indices = [...Array(len).keys()]; // 0,1,2,...

  networkChart.setOption({
    xAxis: { data: indices },
    series: [
      { name: 'NetworkUp', data: uplinkData.value },
      { name: 'NetworkDown', data: downlinkData.value },
      { name: 'VidEncFPS', data: videoEncodeFpsData.value },
      { name: 'VidDecFPS', data: videoDecodeFpsData.value },
      { name: 'AudEncLoss', data: audioEncodeLossData.value },
      { name: 'AudDecLoss', data: audioDecodeLossData.value }
    ]
  });
}

// push 函数
function pushNetwork(uplink, downlink) {
  uplinkData.value.push(uplink);
  downlinkData.value.push(downlink);
  if (uplinkData.value.length > 50) uplinkData.value.shift();
  if (downlinkData.value.length > 50) downlinkData.value.shift();
  updateChart();
}
function pushVideoEncodeFps(fps) {
  videoEncodeFpsData.value.push(fps);
  if (videoEncodeFpsData.value.length > 50) videoEncodeFpsData.value.shift();
  updateChart();
}
function pushVideoDecodeFps(fps) {
  videoDecodeFpsData.value.push(fps);
  if (videoDecodeFpsData.value.length > 50) videoDecodeFpsData.value.shift();
  updateChart();
}
function pushAudioEncodeLoss(loss) {
  audioEncodeLossData.value.push(loss);
  if (audioEncodeLossData.value.length > 50) audioEncodeLossData.value.shift();
  updateChart();
}
function pushAudioDecodeLoss(loss) {
  audioDecodeLossData.value.push(loss);
  if (audioDecodeLossData.value.length > 50) audioDecodeLossData.value.shift();
  updateChart();
}
// 订阅服务质量事件
function subscribeServiceQuality() {
  const client = ZoomVideoService.client;
  const stream = ZoomVideoService.stream;

  // 1. network
  client.on('network-quality-change', (payload) => {
    // console.log('[network-quality-change]', payload);
    pushNetwork(payload.uplink ?? 0, payload.downlink ?? 0);
  });

  // 2. video
  stream.subscribeVideoStatisticData({ encode: true, decode: true });
  client.on('video-statistic-data-change', (payload) => {
    // console.log('[video-statistic-data-change]', payload);
    const data = payload.data; // avg_loss, bitrate, encoding, fps, etc.
    if (!data) return;
    if (data.encoding) {
      //  encode 侧 更新图表
      pushVideoEncodeFps(data.fps ?? 0);
      // 同步存储最新数据
      statsData.videoEncode = data;
    }
    else {
      // decode 侧
      pushVideoDecodeFps(data.fps ?? 0);
      statsData.videoDecode = data;
    }
  });

  // 3. audio
  stream.subscribeAudioStatisticData({ encode: true, decode: true });
  client.on('audio-statistic-data-change', (payload) => {
    // console.log('[audio-statistic-data-change]', payload);
    const data = payload.data;
    if (!data) return;
    if (data.encoding) {
          // 音频编码
      pushAudioEncodeLoss(data.avg_loss ?? 0);
      statsData.audioEncode = data;
    }
    else {
          // 音频解码
      pushAudioDecodeLoss(data.avg_loss ?? 0);
      statsData.audioDecode = data;
    }
  });

  // 4. share 
  stream.subscribeShareStatisticData({ encode: true, decode: true });
  client.on('share-statistic-data-change', (payload) => {
    // console.log('[share-statistic-data-change]', payload);
    const data = payload.data;
    if(!data) return;
    if (data.encoding) {
      statsData.shareEncode = data;
    }
    else {
      statsData.shareDecode = data;
    }
  });
}



/** 加入会议并设置用户、事件、渲染远端视频 */
const joinSession = async () => {
  try {
    const success = await ZoomVideoService.joinSession(config);
    if (!success) {
      isJoining.value = false;
      return;
    }
    sessionJoined.value = true;
    isJoining.value = false;

    // 检查是否支持多路视频
    if (!ZoomVideoService.stream.isSupportMultipleVideos()) {
      console.warn('当前环境不支持多路视频，只能渲染本地+1路远端');
    }

    checkIfHost();

    // 拿到当前用户
    const currentUser = ZoomVideoService.client.getCurrentUserInfo();
    if (currentUser && currentUser.userId) {
      currentUserId.value = currentUser.userId;
      users.value.push({
        userId: currentUser.userId,
        userName: currentUser.displayName,
        hasVideo: isVideoOn.value, // 本地默认 isVideoOn
        isSharing: false
      });
    }

    // 订阅事件
    subscribeEvents();

    // 获取已有用户
    const allUsers = ZoomVideoService.client.getAllUser();
    const localId = currentUserId.value;

    // 加入 users 列表
    allUsers.forEach(u => {
      if (u.userId !== localId) {
        console.log('已有远端用户:', u);
        users.value.push({
          userId: u.userId,
          userName: u.displayName,
          hasVideo: u.bVideoOn,
          isSharing: u.sharerOn
        });
      }
    });

    // 等待 <video-player-container id="user-xxx"> 渲染
    await nextTick();

    // attach 远端用户视频
    for (const u of allUsers) {
      if (u.userId !== localId && u.bVideoOn) {
        if (u.bVideoOn) {
          console.log('attachVideo for user:', u.userId);
          await ZoomVideoService.attachUserVideo(u.userId, VideoQuality.VIDEO_360P);
        }
        // 如果该用户已经在共享
        if (u.sharerOn) {
          console.log('attachScreenShare for user:', u.userId);
          await ZoomVideoService.attachScreenShare(u.userId);
        }
      }
    }

    // 初始化可聊天用户列表
    updateChatReceivers();
    // 订阅服务质量
    subscribeServiceQuality();
  } catch (error) {
    console.error('joinSession error:', error);
    showSnackBar('加入会议失败:' + error.message);
    isJoining.value = false;
  }
};

function checkIfHost() {
  if (ZoomVideoService.client.isHost()) {
    isHost.value = true;
  } else {
    isHost.value = false;
  }
}

const leaveSession = async () => {
  try {
    await ZoomVideoService.leaveSession(false);
    resetState();
    showSnackBar('已退出会议');
    router.push('/home');
  } catch (error) {
    console.error('leaveSession error:', error);
    showSnackBar('退出会议失败:' + error.message);
  }
};

const endSession = async () => {
  if (!isHost.value) {
    showSnackBar('只有主持人可以结束会议');
    return;
  }
  try {
    await ZoomVideoService.leaveSession(true);
    resetState();
    showSnackBar('会议已结束');
       // 停止录音
    stopRecording();

   // 更新会议历史记录
   const user = store.getters.getUser;
      if (user && config.meetingId) {
     FirestoreService.updateMeetingHistory(user.uid, config.meetingId, {
       status: 'finished',
       endedAt: new Date()
     })
     .then(() => {
      console.log('已更新会议历史记录为 finished');
      router.push('/home');
     })
     .catch((error) => {
       console.error('更新会议历史记录失败:', error);
       showSnackBar('更新会议历史记录失败: ' + error.message);
       // 即使更新失败，也可以 router.push('/home') 看您需求
       router.push('/home');
     });
   } else {
     // 如果获取不到 user 或 meetingId，依旧跳转首页
     router.push('/home');
  }}
  catch (error) {
    console.error('endSession error:', error);
    showSnackBar('结束会议失败:' + error.message);
  }
};

function resetState() {
  sessionJoined.value = false;
  autoJoin.value = false;
  users.value = [];
  chatMessagesList.value = [];
  // activeSpeaker.value = null;
  isSharing.value = false;
}

/** 切换本地视频 */
const toggleVideo = async () => {
  isVideoOn.value = !isVideoOn.value;
  await ZoomVideoService.toggleLocalVideo(isVideoOn.value);

  const localUser = users.value.find(u => u.userId === currentUserId.value);
  if (localUser) localUser.hasVideo = isVideoOn.value;
};

/** 切换本地音频 */
const toggleAudio = async () => {
  isAudioOn.value = !isAudioOn.value;
  await ZoomVideoService.toggleLocalAudio(isAudioOn.value);
};

/**
 * 切换“本地屏幕共享”开关
 * - 仅本地共享，远端共享由 SDK 事件管理
 */
const toggleScreenShare = async () => {
  if (isSharing.value) {
    // 已在共享 => 停止共享
    await ZoomVideoService.stopLocalScreenShare();
    isSharing.value = false;

    const localUser = users.value.find(u => u.userId === currentUserId.value);
    if (localUser) localUser.isSharing = false;
  } else {
    // 开始本地共享
    const result = await ZoomVideoService.startLocalScreenShare();
    if (result) {
      isSharing.value = true;
      const localUser = users.value.find(u => u.userId === currentUserId.value);
      if (localUser) localUser.isSharing = true;
    }
  }
};

/** 群聊切换 */
const toggleChat = () => {
  isChatVisible.value = !isChatVisible.value;
};

const sendChat = async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  try {
    // 根据 selectedReceiverId 来判断发送给所有人还是特定用户
    if (selectedReceiverId.value === 0) {
      // 发送给所有人
      await ZoomVideoService.sendMessageToAll(text);
    } else {
      // 私聊
      await ZoomVideoService.sendMessageToUser(text, selectedReceiverId.value);
    }
    chatInput.value = '';
  } catch (err) {
    console.error('发送聊天消息失败:', err);
    showSnackBar('发送聊天消息失败: ' + err.message);
  }
};

/** 收到他人聊天消息 */
function handleChatMessage(payload) {
  const { message, sender, receiver, file } = payload;
  // 如果是文本消息
  if (!file) {
    chatMessagesList.value.push({
      sender: sender.name,
      message,
      file: null
    });
  } else {
    // 文件类型
    chatMessagesList.value.push({
      sender: sender.name,
      message: null,
      file: {
        name: file.name,
        size: file.size,
        fileUrl: file.fileUrl
      },
      // 用于记录下载进度
      fileDownloadProgress: 0,
      fileDownloadStatus: null,
      msgId: payload.id // 用于下载时需要 msgId
    });
  }
  scrollToBottom();
}
/** 聊天历史 */
function handleChatHistory(history) {
  history.forEach(msg => {
    // 判断是否有文件
    if (!msg.file) {
      chatMessagesList.value.push({
        sender: msg.sender.name,
        message: msg.message,
        file: null
      });
    } else {
      chatMessagesList.value.push({
        sender: msg.sender.name,
        message: null,
        file: {
          name: msg.file.name,
          size: msg.file.size,
          fileUrl: msg.file.fileUrl
        },
        fileDownloadProgress: msg.file.download?.progress || 0,
        fileDownloadStatus: msg.file.download?.status || null,
        msgId: msg.id
      });
    }
  });
  scrollToBottom();
}
/** 自己发送消息的回调 */
function handleMessageSent(msg) {
  if (!msg.file) {
    // 文本消息
    chatMessagesList.value.push({
      sender: msg.sender.name,
      message: msg.message,
      file: null
    });
  } else {
    // 文件消息(发送成功后会进入 chat-file-upload-progress)
    // 这里可能暂不处理，或仅做简单提示
  }
  scrollToBottom();
}
function scrollToBottom() {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
}

/** --- 新增: 发送文件 --- */
/** 1) 点击“发送文件”按钮 => 打开文件选择器 */
const fileInput = ref(null);
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

/** 2) 选择文件后，调用 sendFile 方法 */
async function onFileInputChange(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    const file = files[0];
    // 传给 ZoomVideoService
    if (selectedReceiverId.value === 0) {
      cancelSendFileFn = await ZoomVideoService.sendFileToAll(file);
    } else {
      cancelSendFileFn = await ZoomVideoService.sendFileToUser(file, selectedReceiverId.value);
    }
  }
  e.target.value = ''; // 清空
}

/** 3) 取消文件上传 */
function cancelSendFile() {
  if (cancelSendFileFn) {
    cancelSendFileFn(); // 调用SDK返回的取消方法
    cancelSendFileFn = null;
  }
}

/** --- 新增: 下载文件 --- */
async function downloadFile(msg) {
  if (!msg.file) return;
  try {
    const { msgId, file } = msg;
    // 传给 ZoomVideoService
    const cancelDownloadFn = await ZoomVideoService.downloadFile(msgId, file.fileUrl);
    // 将返回的“取消下载”函数存储到 message 对象中(如果想提供“取消下载”按钮)
    msg.cancelDownloadFn = cancelDownloadFn;
  } catch (error) {
    console.error('下载文件出错:', error);
    showSnackBar('下载文件失败:' + error.message);
  }
}

/** 更新可聊天用户列表(供私聊选择) */
const updateChatReceivers = async () => {
  // 通过SDK获取可选接收者
  const receivers = ZoomVideoService.getChatReceivers();
  chatReceivers.value = receivers;
  console.log('[updateChatReceivers]', receivers);
};

/** 录音相关 */
function toggleRecording() {
  if (isRecording.value) stopRecording();
  else startRecording();
}
async function startRecording() {
  if (isRecording.value) return;

  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

    // 添加 AudioWorklet 处理器
    await audioContext.audioWorklet.addModule('/processor.js'); // 确保路径正确
    const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');

    // 连接音频节点
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioWorkletNode);
    audioWorkletNode.connect(audioContext.destination);

    // 建立 ASR WebSocket 连接 (8000)
    ws8000.value = new WebSocket('ws://192.168.243.63:8000/ws'); // 修改为实际服务器地址
    ws8000.value.binaryType = 'arraybuffer';

    // 全局累计文本
    const fullAccumulatedText = ref(''); // 从开始到现在所有的累计字符

    ws8000.value.onopen = () => {
      console.log('8000端口 WebSocket 连接已打开');
      showSnackBar('ASR 服务器连接已打开，开始录音...');
      isRecording.value = true;
    };

    ws8000.value.onerror = (error) => {
      console.error('8000端口 WebSocket 错误:', error);
      showSnackBar('ASR 服务器连接错误，停止录音。');
      isRecording.value = false;
      stopRecording();
    };

    ws8000.value.onclose = () => {
      console.log('8000端口 WebSocket 连接已关闭');
      showSnackBar('ASR 服务器连接已关闭，停止录音。');
      isRecording.value = false;
    };

    // 监听来自 AudioWorklet 的音频数据
    audioWorkletNode.port.onmessage = (event) => {
      const audioBuffer = event.data;
      console.log('发送音频块大小:', audioBuffer.byteLength); // 调试信息
      if (ws8000.value && ws8000.value.readyState === WebSocket.OPEN) {
        ws8000.value.send(audioBuffer);
      }
    };

    // 建立标点处理 WebSocket 连接 (8001)
    ws8001.value = new WebSocket('ws://192.168.243.63:8001/ws'); // 修改为实际服务器地址
    ws8001.value.binaryType = 'arraybuffer';

    ws8001.value.onopen = () => {
      console.log('8001端口 WebSocket 连接已打开');
      showSnackBar('标点处理服务器连接已打开。');
    };

    ws8001.value.onerror = (error) => {
      console.error('8001端口 WebSocket 错误:', error);
      showSnackBar('标点处理服务器连接错误。');
    };

    ws8001.value.onclose = () => {
      console.log('8001端口 WebSocket 连接已关闭');
      showSnackBar('标点处理服务器连接已关闭。');
    };

    // 监听 8000 的消息（逐字无标点字符）
    ws8000.value.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const char = event.data; // 接收到的单个字符
        fullAccumulatedText.value += char; // 更新从开始到目前为止的累计文本
        updateSubtitle(char); // 更新滚动字幕
      }
    };

    // 监听 8001 的消息（带标点的文本）
    ws8001.value.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const punctuatedText = event.data; // 接收到带标点的文本
        fullTranscription.value = punctuatedText; // 更新转录文本
        console.log('收到带标点文本:', punctuatedText);
      }
    };

    // 每隔 3 秒发送累计无标点字符到 8001
    intervalId.value = setInterval(() => {
      if (fullAccumulatedText.value.length > 0 && ws8001.value && ws8001.value.readyState === WebSocket.OPEN) {
        ws8001.value.send(fullAccumulatedText.value); // 发送完整累计文本
        console.log('发送到 8001 的完整累计文本:', fullAccumulatedText.value);
      }
    }, 3000);

    // 保存引用以便后续清理
    config.audioContext = audioContext;
    config.audioWorkletNode = audioWorkletNode;
    config.stream = stream;
  } catch (error) {
    console.error('录音启动失败:', error);
    showSnackBar('无法启动录音，请检查麦克风权限或浏览器支持情况。');
  }
}
async function stopRecording() {
  if (!isRecording.value) return;

isRecording.value = false;

// 关闭 ASR WebSocket 连接 (8000)
if (ws8000.value) {
  ws8000.value.close();
  ws8000.value = null;
}

// 关闭 标点处理 WebSocket 连接 (8001)
if (ws8001.value) {
  ws8001.value.close();
  ws8001.value = null;
}

// 清除定时器
if (intervalId.value) {
  clearInterval(intervalId.value);
  intervalId.value = null;
}

// 关闭 AudioWorklet 和 AudioContext
if (config.audioWorkletNode) {
  config.audioWorkletNode.port.postMessage({ command: 'stop' });
  config.audioWorkletNode.disconnect();
  config.audioWorkletNode = null;
}

if (config.audioContext) {
  await config.audioContext.close();
  config.audioContext = null;
}

if (config.stream) {
  config.stream.getTracks().forEach((track) => track.stop());
  config.stream = null;
}

showSnackBar('已停止录音');


// 保存转录文本到 Firestore
  if (config.meetingId && fullTranscription.value.length > 0) {
    const user = store.getters.getUser;
    if (user) {
      try {
        await FirestoreService.saveTranscriptions(user.uid, config.meetingId, fullTranscription.value);
        console.log('转录文本已保存到 Firestore');
        showSnackBar('转录文本已保存');
      } catch (error) {
        console.error('保存转录文本失败:', error);
        showSnackBar('保存转录文本失败: ' + error.message);
      }
    }
  }
}

// /**
//  * 演讲者视图 or 共享
//  * 当 activeSpeaker 变化或共享开始/结束时调用
//  * - 如果有人共享，本地 UI 就不需要再 attachVideo 到演讲者视图
//  * - 如果没人共享 => 显示 activeSpeaker 的视频
//  */
// async function renderActiveSpeaker(userId) {
//   const speakerContainer = speakerArea.value;
//   if (!speakerContainer) return;

//   // 1. 如果有人（含自己）在共享 => 不需要重复 attachVideo
//   const sharingUser = users.value.find(u => u.isSharing);
//   if (sharingUser) {
//     // 已经在 ZoomVideoService 里做了 startShareScreen / startShareView
//     // 这里不再重复 attach
//     return;
//   }

//   // 2. 否则 => 渲染 activeSpeaker 的视频
//   speakerContainer.innerHTML = '';
//   if (userId) {
//     const activeUser = users.value.find(u => u.userId === userId);
//     if (activeUser && activeUser.hasVideo) {
//       const bigVideo = await ZoomVideoService.attachUserVideo(userId, VideoQuality.VIDEO_720P);
//       if (bigVideo) {
//         speakerContainer.appendChild(bigVideo);
//       } else {
//         const placeholder = document.createElement('div');
//         placeholder.classList.add('speaker-placeholder');
//         placeholder.innerText = '当前无发言者视频';
//         speakerContainer.appendChild(placeholder);
//       }
//     } else {
//       const placeholder = document.createElement('div');
//       placeholder.classList.add('speaker-placeholder');
//       placeholder.innerText = '当前无发言者';
//       speakerContainer.appendChild(placeholder);
//     }
//   } else {
//     // userId=null
//     const placeholder = document.createElement('div');
//     placeholder.classList.add('speaker-placeholder');
//     placeholder.innerText = '当前无发言者';
//     speakerContainer.appendChild(placeholder);
//   }
// }

function forceCloseServiceQuality() {
  if (networkChart) {
    networkChart.dispose();
    networkChart = null;
  }
  showServiceQuality.value = false;
}
/** SDK事件订阅 */
function subscribeEvents() {
  const client = ZoomVideoService.client;

  client.on('user-added', async (userList) => {
    if (!Array.isArray(userList)) return;
    for (const user of userList) {
      if (!users.value.find(u => u.userId === user.userId)) {
        console.log('[user-added] =>', user);
        users.value.push({
          userId: user.userId,
          userName: user.displayName,
          hasVideo: user.bVideoOn,
          isSharing: user.sharerOn
        });
      }
    }
    // 等 Vue 渲染
    await nextTick();
    // Attach 视频/共享
    for (const user of userList) {
      if (user.bVideoOn) {
        console.log('[user-added -> attachVideo]', user.userId);
        await ZoomVideoService.attachUserVideo(user.userId, VideoQuality.VIDEO_360P);
      }
      if (user.sharerOn) {
        console.log('[user-added -> attachScreenShare]', user.userId);
        await ZoomVideoService.attachScreenShare(user.userId);
      }
    }
    // 重新更新可聊天用户列表
    updateChatReceivers();
  });

  client.on('user-removed', (userList) => {
    if (!Array.isArray(userList)) return;
    for (const user of userList) {
      console.log('[user-removed]', user.userId);
      ZoomVideoService.detachUserVideo(user.userId);
      ZoomVideoService.detachScreenShare(user.userId);
      users.value = users.value.filter(u => u.userId !== user.userId);

      // if (activeSpeaker.value === user.userId) {
      //   activeSpeaker.value = null;
      //   renderActiveSpeaker(null);
      // }
    }
        // 更新聊天接收者
        updateChatReceivers();
  });

  client.on('peer-video-state-change', async ({ action, userId }) => {
    console.log('[peer-video-state-change]', action, ' user=', userId);
    const userObj = users.value.find(u => u.userId === userId);
    if (!userObj) return;

    if (action === 'Start') {
      userObj.hasVideo = true;
      await nextTick();
      await ZoomVideoService.attachUserVideo(userId, VideoQuality.VIDEO_360P);

      // if (activeSpeaker.value === userId) {
      //   renderActiveSpeaker(userId);
      // }
    } else if (action === 'Stop') {
      userObj.hasVideo = false;
      ZoomVideoService.detachUserVideo(userId);
      // if (activeSpeaker.value === userId) {
      //   renderActiveSpeaker(null);
      // }
    }
  });

  /**
   * 当有人开始共享/停止共享
   * - 若是自己，不调用 attachScreenShare
   * - 若是他人，则调用 attachScreenShare
   */
  client.on('active-share-change', async ({ state, userId }) => {
    console.log('[active-share-change]', state, ' user=', userId);
    const userObj = users.value.find(u => u.userId === userId);
    if (!userObj) return;

    if (state === 'Active') {
      userObj.isSharing = true;
                // 强制关闭服务质量窗口:
    forceCloseServiceQuality();
      // 如果是别人共享 => 渲染远端共享
      if (userId !== currentUserId.value) {
        await ZoomVideoService.attachScreenShare(userId);
        // activeSpeaker.value = userId;
        // renderActiveSpeaker(userId);
      }
    } else if (state === 'Inactive') {
      userObj.isSharing = false;
      ZoomVideoService.detachScreenShare(userId);

      // // 恢复演讲者模式
      // if (activeSpeaker.value === userId) {
      //   activeSpeaker.value = null;
      //   renderActiveSpeaker(null);
      // }
    }
  });

  client.on('video-active-change', (payload) => {
    const { state, userId } = payload;
    console.log('[video-active-change]', state, ' user=', userId);
    if (state === 'Active') {
      // 仅当没有屏幕共享时，才切换 active speaker
      const sharingUser = users.value.find(u => u.isSharing);
      if (!sharingUser) {
        // activeSpeaker.value = userId;
        // renderActiveSpeaker(userId);
      }
    } else if (state === 'Inactive') {
      // if (activeSpeaker.value === userId) {
      //   activeSpeaker.value = null;
      //   renderActiveSpeaker(null);
      // }
    }
  });

  client.on('connection-change', (payload) => {
    const { state, reason } = payload;
    console.log('[connection-change]', state, reason);
    if (state === 'Closed') {
      showSnackBar(`会议连接已关闭: ${reason}`);
      leaveSession();
    } else if (state === 'Reconnecting') {
      showSnackBar('正在重新连接...');
    } else if (state === 'Connected') {
      showSnackBar('已重新连接');
    } else if (state === 'Fail') {
      showSnackBar('连接失败');
      leaveSession();
    }
  });

  client.on('device-change', () => {
    console.log('device changed:', ZoomVideoService.stream?.getCameraList() || []);
  });

  client.on('session-closed', () => {
    showSnackBar('会议已结束');
    leaveSession();
     // 停止录音
     stopRecording();

// 更新会议历史记录
  const user = store.getters.getUser;
   if (user && config.meetingId) {
  FirestoreService.updateMeetingHistory(user.uid, config.meetingId, {
    status: 'finished',
    endedAt: new Date()
  })
  .then(() => {
   console.log('已更新会议历史记录为 finished');
   router.push('/home');
  })
  .catch((error) => {
    console.error('更新会议历史记录失败:', error);
    showSnackBar('更新会议历史记录失败: ' + error.message);
  });
}
});

  client.on('session-expired', () => {
    showSnackBar('会议会话已过期');
    leaveSession();
  });
  client.on('session-kicked-out', (payload) => {
    showSnackBar(`已被踢出会议: ${payload.reason}`);
    leaveSession();
  });

  // 聊天事件
  client.on('chat-on-message', (payload) => {
    handleChatMessage(payload);
  });
  ZoomVideoService.getChatHistory().then((history) => {
    handleChatHistory(history);
  });
  ZoomVideoService.setMessageSentCallback(handleMessageSent);

    /**
   * 文件上传进度事件
   */
   client.on('chat-file-upload-progress', (payload) => {
    const { fileName, progress, status } = payload;
    uploadProgressInfo.value = {
      fileName,
      progress,
      status
    };
    // 如果是失败或取消等，清理本地 cancelSendFileFn
    if (status === 3 /*Fail*/ || status === 4 /*Cancel*/ || status === 2 /*Success*/) {
      cancelSendFileFn = null;
    }
    if (status === 2 /*Success*/ || status === 3 /*Fail*/ || status === 4 /*Cancel*/) {
      // 上传完成，3秒后清空
      setTimeout(() => {
        uploadProgressInfo.value = null;
      }, 3000);
    }
  });

  /**
   * 文件下载进度事件
   */
  client.on('chat-file-download-progress', (payload) => {
    const { fileName, progress, status, id, fileBlob } = payload;
    // 找到对应的消息
    const msgObj = chatMessagesList.value.find((m) => m.msgId === id);
    if (!msgObj) return;

    msgObj.fileDownloadProgress = progress;
    switch (status) {
      case 1: // InProgress
        msgObj.fileDownloadStatus = 'InProgress';
        break;
      case 2: // Success
        msgObj.fileDownloadStatus = 'Success';
        // 如果是 blob 下载，可以自己处理
        if (fileBlob) {
          // 例如自动显示图片，或手动下载
          const objUrl = URL.createObjectURL(fileBlob);
          // 这里演示：自动触发浏览器下载
          const link = document.createElement('a');
          link.href = objUrl;
          link.download = fileName;
          link.click();
        }
        // 否则，SDK会自动触发浏览器下载
        msgObj.cancelDownloadFn = null;
        break;
      case 3: // Fail
        msgObj.fileDownloadStatus = 'Fail';
        msgObj.cancelDownloadFn = null;
        break;
      case 4: // Cancel
        msgObj.fileDownloadStatus = 'Cancel';
        msgObj.cancelDownloadFn = null;
        break;
    }
  });
}


onBeforeUnmount(() => {
  if (sessionJoined.value) {
    ZoomVideoService.leaveSession(false);
    sessionJoined.value = false;
  }
  stopRecording();
});
</script>

<style scoped>
/* 基础样式 */
main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  position: relative;
  margin: 0;
}

.closeBtn {
  position: absolute;
  top: 10px;
  right: 20px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-color);
}

.closeBtn:hover {
  color: var(--text-color);
}

#action-flow {
  background-color: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
  position: relative;
}

#action-flow h1 {
  margin-bottom: 20px;
  color: #333;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #444;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}

/* 会议布局 */
.meeting-layout {
  width: 90%;
  height: 90vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.meeting-content {
  display: flex;
  width: 100%;
  height: 100%;
}

.meeting-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 600px;
  height: 400px;
  background-color: #fafafa;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 6px solid #ccc;
  border-top: 6px solid #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {transform: rotate(0);}
  100% {transform: rotate(360deg);}
}

.left-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  position: relative;
  min-width: 70%; /* 确保左侧面板占据主要空间 */
}

.participants-row {
  flex-shrink: 0;
  height: 120px;
  background: #262626;
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 8px;
}

video-player-container.participant-tile {
  width: 140px;
  height: 80px;
  background: #444;
  border: 2px solid #1a73e8;
  border-radius: 6px;
  margin-right: 8px;
  position: relative;
}

.video-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-element {
  /* 对摄像头视频: 让其填满容器 */
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  background: #666;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.username-label {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
}

video-player-container.speaker-area {
  flex: 1;
  background: #000;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.speaker-placeholder {
  color: #ccc;
  text-align: center;
  padding: 20px;
}

/* 让共享的画面只在 .speaker-area 区域内等比例缩放 */
video.video-element.share-video,
canvas.video-element.share-video {

  width: 100%;       
  height: auto;
  object-fit: contain;
  overflow: auto;

}

.controls {
  flex-shrink: 0;
  background: #1a1a1a;
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.controls button {
  background-color: #333;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.controls button.active {
  background-color: #1a73e8;
}

.exit-button {
  background-color: #e53935;
}

.controls button:hover {
  background-color: #555;
}

/* 右侧: 转录 & 录音 */
.right-panel {
  flex: 1;
  background-color: #fff;
  border-left: 1px solid #ccc;
  padding: 10px;
  overflow-y: auto;
  position: relative;
}

.right-panel h2 {
  margin-bottom: 10px;
  color: #333;
}

.right-panel p {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #555;
}

.recording-controls {
  display: flex;
  justify-content: center;
  margin-top: 180%;
  margin-left: -80%;
}

.recording-icon {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: transform 0.2s;
}

.recording-icon:hover {
  transform: scale(1.1);
}

/* 群聊窗口 */
.chat-container {
  position: absolute;
  bottom: 100px;
  right: 20px;
  width: 300px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  z-index: 999;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #1a73e8;
  color: #fff;
}

.close-chat {
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #fafafa;
}

.chat-message {
  margin-bottom: 8px;
}

.chat-input {
  display: flex;
  border-top: 1px solid #ccc;
}

.chat-input input {
  flex: 1;
  border: none;
  padding: 10px;
}

.chat-input button {
  background-color: #1a73e8;
  color: #fff;
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom-right-radius: 5px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  main {
    flex-direction: column;
    padding: 20px;
  }

  #action-flow {
    max-width: 100%;
    margin-top: 20px;
  }

  .video-and-transcription {
    flex-direction: column;
    margin-top: 20px;
  }

  #sessionContainer {
    width: 100%;
    height: 400px;
  }

  .subtitle {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 5px 10px;
    border-radius: 5px;
    max-width: 80%;
    text-align: center;
    font-size: 20px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  #transcriptionContainer {
    width: 100%;
    margin-left: 0;
    margin-top: 10px;
    height: 300px;
  }
}

@media (max-width: 480px) {
  .input-group input,
  .input-group select {
    font-size: 14px;
    padding: 8px;
  }

  #transcriptionContainer {
    height: 250px;
  }
}
.service-quality-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-height: 600px;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 6px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}
.service-quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a73e8;
  color: #fff;
  padding: 10px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}
.close-quality {
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}
.service-quality-content {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}
.chart-container {
  width: 100%;
  height: 300px;
  margin-top: 10px;
  border: 1px solid #ccc;
}
/* == 新增: 文字表格样式，可自行调整美观 == */
.stats-text {
  margin-top: 20px;
}
.stats-text h4 {
  margin: 10px 0 5px;
  color: #333;
}
.stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
}
.stats-table td {
  border: 1px solid #ddd;
  padding: 6px 8px;
}

</style>
