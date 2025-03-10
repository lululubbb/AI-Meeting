<!-- videocall.vue -->
<template>
  <div
    class="video-call-container"
     :class="{ maximized: isMaximized, minimized: !isMaximized }"
  >
  <el-tooltip v-if="!isMaximized" content="返回会议" placement="top">
        <button class="return-icon-button" @click="returnToMeeting">
            <svg t="1741349201621" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                p-id="3610">
                <path
                    d="M432.16 251.72l5.11 0.32c20.08 2.51 35.61 19.64 35.61 40.4 0 20.44-15.07 37.37-34.7 40.28l-6.02 0.44-41.44-0.06 130.11 130.15 3.64 4.17c12.15 15.96 10.93 38.84-3.64 53.41-14.31 14.31-36.63 15.74-52.54 4.29l-5.05-4.29L333.1 390.72l0.06 41.44-0.32 5.11c-2.51 20.08-19.64 35.61-40.4 35.61-20.44 0-37.37-15.07-40.28-34.7l-0.44-6.02V292.44l0.32-5.11 0.02-0.19c0.12-0.86 0.25-1.67 0.41-2.49 0.25-1.34 0.58-2.67 0.98-3.97 0.15-0.49 0.31-0.98 0.47-1.46 0.39-1.13 0.82-2.23 1.29-3.3 1.15-2.53 2.34-4.61 3.69-6.57l1.6-2.22 3.15-3.48 0.89-0.87c0.29-0.28 0.57-0.53 0.86-0.78l1.11-0.95 0.99-0.79c0.42-0.33 0.81-0.62 1.2-0.9 1.6-1.12 2.85-1.9 4.15-2.62 0.47-0.26 0.92-0.5 1.37-0.72l2.2-1.01 1.99-0.79c0.69-0.25 1.34-0.47 2-0.67 0.02-0.01 0.07-0.02 0.11-0.04 0.87-0.27 1.72-0.49 2.57-0.69a41.44 41.44 0 0 1 9.36-1.08h139.71z m398.4-58.28H193.44v637.13h357.63l0.06-238.72c0-22.49 18.23-40.72 40.72-40.72l238.72-0.06-0.01-357.63z m0.8-81.44c44.54 0 80.64 36.1 80.64 80.64v638.72c0 41.75-31.73 76.09-72.39 80.22l-8.24 0.42H192.64C148.1 912 112 875.9 112 831.36V192.64c0-44.54 36.1-80.64 80.64-80.64h638.72z"
                    p-id="3611" fill="#515151"></path>
            </svg>
        </button>
    </el-tooltip>
    <main>
    <!-- 会议信息表单：仅在 autoJoin=false 时显示 -->
    <div id="action-flow" v-if="!autoJoin">
  <span class="closeBtn" @click="goHome">×</span>
  <h1>视频会议</h1>

  <!-- 创建/加入会议表单 -->
  <div v-if="mode === 'create'" class="input-group">
    <label for="sessionName">会议名称:</label>
    <input id="sessionName" v-model="config.sessionName" placeholder="请输入会议名称" @paste="handlePaste"/>
  </div>
  <div v-if="mode === 'create'" class="input-group">
    <label for="userName">用户名:</label>
    <input id="userName" v-model="config.userName" placeholder="请输入用户名" @paste="handlePaste"/>
  </div>
  <div v-if="mode === 'create'" class="input-group">
    <label for="sessionPasscode">会议密码 (可选):</label>
    <input id="sessionPasscode" v-model="config.sessionPasscode" placeholder="请输入会议密码" @paste="handlePaste"/>
  </div>
  <div v-if="mode === 'join'" class="input-group">
    <label for="sessionName">会议名称:</label>
    <input id="sessionName" v-model="config.sessionName" placeholder="请输入会议名称" @paste="handlePaste"/>
  </div>
  <div v-if="mode === 'join'" class="input-group">
    <label for="userName">用户名:</label>
    <input id="userName" v-model="config.userName" placeholder="请输入用户名" @paste="handlePaste"/>
  </div>
  <div v-if="mode === 'join'" class="input-group">
    <label for="sessionPasscode">会议密码 (可选):</label>
    <input id="sessionPasscode" v-model="config.sessionPasscode" placeholder="请输入会议密码" @paste="handlePaste"/>
  </div>

  <!-- 角色选择 (仅在创建会议时显示) -->
  <div v-if="mode === 'create'" class="input-group">
    <label for="role">角色:</label>
    <select id="role" v-model.number="role">
      <option :value="1">主持人</option>
      <option :value="0">参与者</option>
    </select>
  </div>

  <!-- 按钮容器，保证按钮水平排列 -->
  <div class="button-container">
    <CustomButton :text="mode === 'create' ? '切换到加入会议' : '切换到创建会议'" @click="toggleMode"></CustomButton>
    <CustomButton :text="buttonText" :onPressed="handleSession" />
    <CustomButton text="复制会议邀请" @click="copyInvitationToClipboard" /> 
  </div>
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
            <video-player-container v-for="user in users" :key="user.userId" class="participant-tile"
              :id="`user-${user.userId}`">
              <div class="video-content">
                <div v-if="!user.hasVideo.final" class="placeholder">
                  {{ user.userName }}
                </div>
              </div>
              <div class="username-label">{{ user.userName }}</div>
            </video-player-container>
          </div>

          <!-- 演讲者/共享 大区域 -->
          <video-player-container class="speaker-area">
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
            <button @click="toggleTranscription" :class="{ active: isTranscribing }">
  <img v-if="isTranscribing" src="@/assets/transcription_off.png" alt="停止转录" />
  <img v-else src="@/assets/transcription_on.png" alt="开始转录" />
</button>

            <button @click="toggleVideo" :class="{ active: isVideoOn }">
              <img v-if="isVideoOn" src="@/assets/video_off.png" alt="关闭视频" />
              <img v-else src="@/assets/video_on.png" alt="开启视频" />
            </button>
            <button @click="toggleAudio" :class="{ active: !isAudioOn }">
              <img v-if="isAudioOn" src="@/assets/audio_off.png" alt="静音" />
              <img v-else src="@/assets/audio_on.png" alt="开启麦克风" />
            </button>
            <button @click="toggleScreenShare" :class="{ active: isSharing }">
              <img v-if="isSharing" src="@/assets/share_off.png" alt="停止共享屏幕" />
              <img v-else src="@/assets/share_on.png" alt="共享屏幕" />
            </button>
            <!-- 服务质量按钮 -->
            <button @click="toggleServiceQuality" :class="{ active: showServiceQuality }">
              <img src="@/assets/服务质量.png" alt="服务质量" />
            </button>
            <button v-if="isHost" @click="endSession" class="exit-button">
              <img src="@/assets/end.png" alt="结束会议" />
            </button>
            <button v-else @click="leaveSession" class="exit-button">
              <img src="@/assets/exit2.png" alt="退出会议" />
            </button>
          </div>

    <!-- 服务质量窗口 (弹窗)，仅当 showServiceQuality=true 时显示 -->
  <div v-if="showServiceQuality" class="service-quality-overlay">
    <div class="service-quality-header">
      <span>{{ t('serviceQuality.title') }}</span>
      <button @click="toggleServiceQuality" class="close-quality">×</button>
    </div>
    <div class="service-quality-content">
      <!-- 只保留 ECharts 容器，不显示文字 -->
      <div id="networkChart" class="chart-container"></div>

      <!-- == 新增文字显示区: 显示实时统计信息 == -->
      <div class="stats-text">
        <h3>{{ t('serviceQuality.realTimeStats') }}</h3>

        <h4>{{ t('serviceQuality.videoEncode') }}</h4>
        <table class="stats-table" v-if="statsData.videoEncode">
          <tbody>
            <tr>
              <td>{{ t('serviceQuality.fps') }}:</td>
              <td>{{ statsData.videoEncode.fps ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.bitrate') }}:</td>
              <td>{{ statsData.videoEncode.bitrate ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.avgLoss') }}:</td>
              <td>{{ statsData.videoEncode.avg_loss ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.rtt') }}:</td>
              <td>{{ statsData.videoEncode.rtt ?? '--' }}</td>
            </tr>
          </tbody>
        </table>

        <h4>{{ t('serviceQuality.videoDecode') }}</h4>
        <table class="stats-table" v-if="statsData.videoDecode">
          <tbody>
            <tr>
              <td>{{ t('serviceQuality.fps') }}:</td>
              <td>{{ statsData.videoDecode.fps ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.bitrate') }}:</td>
              <td>{{ statsData.videoDecode.bitrate ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.avgLoss') }}:</td>
              <td>{{ statsData.videoDecode.avg_loss ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.rtt') }}:</td>
              <td>{{ statsData.videoDecode.rtt ?? '--' }}</td>
            </tr>
          </tbody>
        </table>

        <h4>{{ t('serviceQuality.audioEncode') }}</h4>
        <table class="stats-table" v-if="statsData.audioEncode">
          <tbody>
            <tr>
              <td>{{ t('serviceQuality.bitrate') }}:</td>
              <td>{{ statsData.audioEncode.bitrate ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.avgLoss') }}:</td>
              <td>{{ statsData.audioEncode.avg_loss ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.rtt') }}:</td>
              <td>{{ statsData.audioEncode.rtt ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.sampleRate') }}:</td>
              <td>{{ statsData.audioEncode.sample_rate ?? '--' }}</td>
            </tr>
          </tbody>
        </table>

        <h4>{{ t('serviceQuality.audioDecode') }}</h4>
        <table class="stats-table" v-if="statsData.audioDecode">
          <tbody>
            <tr>
              <td>{{ t('serviceQuality.bitrate') }}:</td>
              <td>{{ statsData.audioDecode.bitrate ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.avgLoss') }}:</td>
              <td>{{ statsData.audioDecode.avg_loss ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.rtt') }}:</td>
              <td>{{ statsData.audioDecode.rtt ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.sampleRate') }}:</td>
              <td>{{ statsData.audioDecode.sample_rate ?? '--' }}</td>
            </tr>
          </tbody>
        </table>

        <h4>{{ t('serviceQuality.shareEncode') }}</h4>
        <table class="stats-table" v-if="statsData.shareEncode">
          <tbody>
            <tr>
              <td>{{ t('serviceQuality.fps') }}:</td>
              <td>{{ statsData.shareEncode.fps ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.bitrate') }}:</td>
              <td>{{ statsData.shareEncode.bitrate ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.avgLoss') }}:</td>
              <td>{{ statsData.shareEncode.avg_loss ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.widthHeight') }}:</td>
              <td>{{ statsData.shareEncode.width }} x {{ statsData.shareEncode.height }}</td>
            </tr>
          </tbody>
        </table>

        <h4>{{ t('serviceQuality.shareDecode') }}</h4>
        <table class="stats-table" v-if="statsData.shareDecode">
          <tbody>
            <tr>
              <td>{{ t('serviceQuality.fps') }}:</td>
              <td>{{ statsData.shareDecode.fps ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.bitrate') }}:</td>
              <td>{{ statsData.shareDecode.bitrate ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.avgLoss') }}:</td>
              <td>{{ statsData.shareDecode.avg_loss ?? '--' }}</td>
            </tr>
            <tr>
              <td>{{ t('serviceQuality.widthHeight') }}:</td>
              <td>{{ statsData.shareDecode.width }} x {{ statsData.shareDecode.height }}</td>
            </tr>
          </tbody>
        </table>
              </div>
            </div>
          </div>
        </div>

        <ChatPanel
          :chat-messages-list="chatMessagesList"
          :chat-receivers="chatReceivers"
          :selected-receiver-id="selectedReceiverId"
          :upload-progress-info="uploadProgressInfo"
          @update:selected-receiver-id="newValue => selectedReceiverId = newValue"
          @send-chat="handleSendChat"
          @trigger-file-input="triggerFileInput"
          @file-input-change="onFileInputChange"
          @cancel-send-file="cancelSendFile"
          @download-file="downloadFile"
          @open-ai-assistant="openAiAssistant"
          ref="chatPanel"
        />
      </div>
    </div>
  </main>
  <!-- 字幕容器 -->
<div class="subtitle">
   {{ subtitle }}
</div>

      <!-- 引入 AIFloatingChat 组件, 并传递参数 -->
      <AIFloatingChat ref="aiChat" :file-to-analyze="fileToAnalyze" :file-msg-id="fileMsgId"/>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, onBeforeUnmount, nextTick, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js';
import ZoomVideoService, { VideoQuality } from '../services/ZoomVideoService.js';
import { showSnackBar } from '../utils/utils.js';
import AIFloatingChat from '../components/AIFloatingChat.vue'; // 导入组件
import ChatPanel from '../components/ChatContainer.vue';
import CustomButton from '../components/CustomButton.vue';
import * as echarts from 'echarts';
import { useI18n } from 'vue-i18n';
import defaultAvatar from '../assets/柴犬.png';

const { t } = useI18n();

import { ElMessage,ElMessageBox} from 'element-plus';


/// Vuex / Router
const store = useStore();
const route = useRoute();
const router = useRouter(); 
const isMaximized = computed(() => store.state.isMaximized);

const goHome = () => {
  store.commit('SET_VIDEOCALL_MAXIMIZED', true); // 设置为最大化
  store.commit('SET_VIDEOCALL_ACTIVE', true); // 显示
};

onMounted(() => {
  checkRouteParams();
  checkClipboard(); // 打开页面时检查剪贴板
  window.addEventListener("paste", handlePaste);
  checkAndJoinFromConfig();
  //checkRouteParams(); // 移除 checkRouteParams
    // 获取会议配置信息
   const savedConfig = store.getters.getMeetingConfig;
  if (savedConfig) {
    Object.assign(config, savedConfig); // 将保存的配置合并到 config
     mode.value = config.mode;
     role.value = mode.value === 'create' ? 1 : 0;
    buttonText.value = mode.value === 'create' ? '创建会议' : '加入会议';
  }
  ZoomVideoService.client.on('chat-file-download-progress', handleFileDownloadProgress);
});

onUnmounted(() => {
  window.removeEventListener("paste", handlePaste);
});

// 获取当前用户的邮箱
const getUserEmail = () => {
  const user = store.getters.getUser;
  console.log('当前用户ID:', user.uid);
  return user.email || 'unknown@domain.com'
};

// // 获取当前用户的邮箱
// getUserEmail() {
//       const user = this.$store.getters.getUser;
//       console.log('当前用户邮箱:', user.email); // 调试信息
//       return user.email || 'unknown@domain.com';
//     },

//复制预约会议信息
const generateInvitationContent = () => {
  const meetingInfo = `用户${config.userName}向您发来一个会议邀请~\n会议名称: ${config.sessionName}\n会议时间: ${new Date().toLocaleString()}\n会议密码:${config.sessionPasscode}\n复制该文本打开“慧议”系统点击“加入会议”可直接入会！`;
  return meetingInfo;
};

const copyInvitationToClipboard = async () => {
  // 检查用户输入是否完整
  if (!config.userName || !config.sessionName || !config.sessionPasscode) {
    ElMessage.warning('请填写完整的会议信息后再复制');
    return;
  }
  const invitationContent = generateInvitationContent();
  console.log("复制的内容:", invitationContent); // 调试日志
  try {
    await navigator.clipboard.writeText(invitationContent);
    ElMessage.success('会议邀请已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败，请手动复制');
  }
};

const parseInvitationContent = (text) => {
  console.log("开始解析",text)
  const userNameMatch = text.match(/用户(\S+)\s+向您发来一个会议邀请/);
  const sessionNameMatch = text.match(/会议名称:\s*(.+)/);
  const sessionPasscodeMatch = text.match(/会议密码:\s*(\d+)/);

  const result={
    userName: userNameMatch ? userNameMatch[1].trim() : '',
    sessionName: sessionNameMatch ? sessionNameMatch[1].trim() : '',
    sessionPasscode: sessionPasscodeMatch ? sessionPasscodeMatch[1].trim() : '',
  };

  console.log("解析结果",result);
  return result;
};

const handlePaste = async (event) => {
  let pastedText = (event.clipboardData || window.clipboardData).getData("text");

  console.log("剪贴板内容:", pastedText); // 先打印剪贴板内容

  if (!pastedText) {
    ElMessage.warning("未检测到粘贴内容，请检查剪贴板");
    return;
  }

  // 解析粘贴的会议信息
  const parsedData = parseInvitationContent(pastedText);

  console.log("解析后的数据:", parsedData); // 调试信息

  // 更新响应式对象
  if (parsedData.sessionName) config.sessionName = parsedData.sessionName;
  config.userName = getUserEmail();
  if (parsedData.sessionPasscode) config.sessionPasscode = parsedData.sessionPasscode;

  // 让 Vue 立即检测到变化
  await nextTick();

  ElMessage.success("会议信息已自动填充");
};

 const checkClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      console.log("剪贴板内容:", text);
      const parsedData = parseInvitationContent(text);
      
      // 如果解析成功，自动填充
      if (parsedData.sessionName || parsedData.userName || parsedData.sessionPasscode) {
        config.sessionName = parsedData.sessionName;
        // config.userName = parsedData.userName;
        config.userName=getUserEmail();
        config.sessionPasscode = parsedData.sessionPasscode;

        await nextTick(); 
        ElMessage.success("检测到会议信息，已自动填充");
      }
    }
  } catch (err) {
    console.error("无法访问剪贴板:", err);
  }
};


//* 会议相关状态 */
const config = reactive({
  videoSDKJWT: '',
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  expirationSeconds: 7200,
  meetingId: '',  // 新增：用于 update
  hostId: ''      // 新增：用于记录会议的 host
});
const mode = ref(route.query.mode || 'join');
const role = ref(mode.value === 'create' ? 1 : 0);
const buttonText = ref(mode.value === 'create' ? '创建会议' : '加入会议');
const isJoining = ref(false);
const sessionJoined = ref(false);
const autoJoin = ref(false);
/** 切换模式 */
const toggleMode = () => {
  mode.value = mode.value === 'create' ? 'join' : 'create';
  buttonText.value = mode.value === 'create' ? '创建会议' : '加入会议';
  role.value = mode.value === 'create' ? 1 : 0;
};
const closeVideoCall = () => {
  ElMessageBox.confirm(
    '确定要关闭视频通话吗？', // 提示文字
    '确认', // 标题
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning', // 图标类型
       // 自定义样式 (可选)
      customClass: 'close-videocall-confirm', // 添加自定义类名
      center: true,       // 居中显示
      closeOnClickModal: false, // 点击遮罩层不关闭
      closeOnPressEscape: false, // 按 ESC 键不关闭
      confirmButtonClass: 'confirm-button',  // 自定义确认按钮 class
      cancelButtonClass: 'cancel-button',    // 自定义取消按钮 class
    }
  )
    .then(() => {
      // 用户点击了“确定”
      store.commit('SET_VIDEOCALL_ACTIVE', false);
      store.commit('SET_VIDEOCALL_MAXIMIZED', true);
    })
    .catch(() => {
      // 用户点击了“取消”或关闭了对话框, 什么也不做
    });
};

const returnToMeeting = () => {
    store.commit('SET_VIDEOCALL_MAXIMIZED', true); // 设置为最大化
    store.commit('SET_VIDEOCALL_ACTIVE', true);      // 显示 (这行可能不需要, 因为已经在最大化状态了)
};
// 预定会议使用的函数
async function checkAndJoinFromConfig() {
    const savedConfig = store.getters.getMeetingConfig;
    if (savedConfig && savedConfig.sessionName && savedConfig.userName && savedConfig.videoSDKJWT) {
        Object.assign(config, savedConfig);
        mode.value = config.mode;
        role.value = mode.value === 'create' ? 1 : 0;
        buttonText.value = mode.value === 'create' ? '创建会议' : '加入会议';
        autoJoin.value = true;
        await nextTick();
        await joinSession();
    }
}
/* *********************
会议加入和创建
   ********************* */
/** 如果 URL query 有 sessionName等参数就自动加入会议 */
async function checkRouteParams() {
  const {
    sessionName,
    userName,
    sessionPasscode,
    role: roleParam,
    videoSDKJWT,
    expirationSeconds,
    hostId,       // 新增
    meetingId     // 新增
  } = route.query;

  if (sessionName && userName && roleParam !== undefined && videoSDKJWT) {
    config.sessionName = sessionName;
    config.userName = userName;
    config.sessionPasscode = sessionPasscode || '';
    config.expirationSeconds = expirationSeconds ? parseInt(expirationSeconds, 10) : 7200;
    role.value = parseInt(roleParam, 10);
    config.videoSDKJWT = videoSDKJWT;
    // 如果是加入会议，hostId 和 meetingId 也需要
    if (mode.value === 'join') {
        if(!hostId || !meetingId){
            console.error('加入会议缺少 hostId 或 meetingId');
            showSnackBar("加入会议链接不完整，请检查")
            router.push('/home');
            return;
        }
      config.hostId = hostId;
      config.meetingId = meetingId;
    }
    
    // 如果是创建会议，从路由参数中获取 meetingId 和 hostId
    if (mode.value === 'create') {
       config.meetingId = meetingId; // 从路由参数中获取
       config.hostId = hostId;       // 从路由参数中获取
    }
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
    const user = store.getters.getUser;
  try {
    isJoining.value = true;
    let jwt;
    let meetingId;

    // *修改*:  先设置 config.hostId (创建会议时)
    if (mode.value === 'create' && user) {
         config.hostId = user.uid; //  创建会议, hostId 就是当前用户
    }

        // 统一逻辑: 无论是创建还是加入, 都先尝试创建 Firestore 文档
    if(user){
          // mode.value 为 'create' 的时候，config.hostId 一定有值
          // mode.value 为 'join' 的时候, 如果路由中有 hostId, config.hostId 也有值
		  // mode.value 为 'join' 的时候, 如果路由中没有 hostId, config.hostId 是空字符串 ''，config.hostId需要从ZoomVideoService中获取。
        meetingId = await FirestoreService.addToMeetingHistory( // 先创建文档，拿到 meetingId
          user.uid,
          config.sessionName,  // 会议名称
        {
          status: 'ongoing', // 初始状态
        //  hostId:  mode.value === 'create'? user.uid : config.hostId, // 如果是创建, hostId 就是当前用户; 如果是加入, hostId 来自路由
          hostId:config.hostId,
          hostName: config.userName,
          sessionPasscode: config.sessionPasscode,
          startTime: new Date(),
          // 其他字段...
        }
      );
        config.meetingId = meetingId; // 把 meetingId 存入 config
    }
    if (mode.value === 'create') {
  // 创建JWT
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
      console.error('无法获取有效 JWT');
      isJoining.value = false;
      return;
    }

    config.videoSDKJWT = jwt;
    autoJoin.value = true;
    await nextTick();
    await joinSession(); //  join 流程
  } catch (error) {
    console.error('handleSession error:', error);
    showSnackBar('加入/创建会议失败');
    isJoining.value = false;

    // 如果是创建会议，并且 Firestore 文档创建失败了，把刚刚创建的文档删除。
    if (mode.value === 'create' && user && config.meetingId) { // 使用 mode.value
      try {
        await FirestoreService.deleteMeetingHistory(user.uid, config.meetingId);
      } catch (deleteError) {
        console.error('删除 Firestore 文档失败:', deleteError);
      }
    }
  }
};


/* *********************
会议初始化
   ********************* */
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

        checkIfHost();   // *务必* 先调用 checkIfHost, 设置好 config.hostId

        // 拿到当前用户, 并加入 users 列表
        const currentUser = ZoomVideoService.client.getCurrentUserInfo();
        if (currentUser && currentUser.userId) {
            currentUserId.value = currentUser.userId;
            // 把当前用户加入 users 数组 (无论主持人还是参与者)
            users.value.push({
                userId: currentUser.userId,
                userName: currentUser.displayName,
                role: isHost.value ? 'host' : 'participant',
                joinTime: new Date(),
                leaveTime: null,
                hasVideo: {
                    initial: isVideoOn.value,
                    final: isVideoOn.value,
                    timeline: [{ time: Date.now(), value: isVideoOn.value }],
                },
                isAudioOn: {
                    initial: isAudioOn.value,
                    final: isAudioOn.value,
                    timeline: [{ time: Date.now(), value: isAudioOn.value }],
                },
                isSharing: {
                    initial: false,
                    final: false,
                    timeline: [{ time: Date.now(), value: false }],
                },
                isUpdated: false,  // 用于标记是否已更新
                hostId: config.hostId, // *重要*: 所有用户都记录 hostId, 方便后续查询
                uploads: 0,
                downloads: 0,
                messagesSent: 0,
            });

            const user = store.getters.getUser; // 从 Vuex 获取用户信息

          if (user) {
              // 如果是主持人, 什么都不做 (已经在 handleSession 中创建了主会议文档)
              if (isHost.value) {
                  // 什么都不做!
              } else {
                  // 如果是参与者, 调用 addParticipantMeeting, 创建指向主持人文档的引用
                  // *重要*: 在这里检查 config.hostId 是否为空
                  if (!config.hostId) {
                      const allUsers = ZoomVideoService.client.getAllUser();
                        allUsers.forEach(u => {
                            if(u.isHost){
                                config.hostId = u.userId.toString(); // 将数值类型转换为字符串类型
                            }
                        })
                      console.warn('config.hostId 为空! 尝试从 allUser 中获取');
                      //  可以添加更详细的错误处理, 例如给用户提示, 或者直接退出会议
                  }
                  try {
                      await FirestoreService.addParticipantMeeting(
                        user.uid,            // 参与者自己的 ID
                        config.hostId,     // 主持人 ID
                        config.meetingId,   // 会议 ID (来自路由参数或 handleSession)
                        new Date()          // 加入时间
                      );
                  } catch (err) {
                      console.error('添加参与者会议记录失败:', err);
                      showSnackBar('添加参与者会议记录失败');
                      // 可以考虑更完善的错误处理
                  }
              }
          }
        }
        // 订阅 SDK 事件
        subscribeEvents();

        // 获取已加入会议的用户, 并加入 users 列表 (用于 UI 显示和统计)
        const allUsers = ZoomVideoService.client.getAllUser();
        const localId = currentUserId.value;

      allUsers.forEach(u => {
      if (u.userId !== localId) { // *不* 重复添加自己
        users.value.push({
          userId: u.userId,
          userName: u.displayName,
          role: u.isHost ? 'host' : 'participant',
          joinTime: new Date(), // 注意: 这里简化了, 实际加入时间应该通过 user-added 事件获取更准确
          leaveTime: null,
          hasVideo: {
            initial: u.bVideoOn,
            final: u.bVideoOn,
            timeline: [{ time: Date.now(), value: u.bVideoOn }]
          },
          isAudioOn: {
            initial: true, // 假设默认开启音频
            final: true,
            timeline: [{ time: Date.now(), value: true }]
          },
          isSharing: {
            initial: u.sharerOn,
            final: u.sharerOn,
            timeline: [{ time: Date.now(), value: u.sharerOn }]
          },
          isUpdated: false, //
          hostId: config.hostId,  // *重要*:  所有用户 (包括已加入的) 都记录 hostId
          uploads: 0,
          downloads: 0,
          messagesSent: 0,
        });
      }
    });
        // 等待 DOM 渲染完成
        await nextTick();

        // attach 远端用户的视频
        for (const u of allUsers) {
         if (u.userId !== localId) { //
            if (u.bVideoOn) {
                await ZoomVideoService.attachUserVideo(u.userId, VideoQuality.VIDEO_360P);
          }
          if (u.sharerOn) {
              await ZoomVideoService.attachScreenShare(u.userId);
          }
        }
    }
        // 初始化可聊天用户列表
        updateChatReceivers();
        // 订阅服务质量事件
        subscribeServiceQuality();

    } catch (error) {
        console.error('joinSession error:', error);
        showSnackBar('加入会议失败');
        isJoining.value = false;
    }
};

function checkIfHost() {
   //  在 checkIfHost 中设置 config.hostId
    if (ZoomVideoService.client.isHost()) {
        isHost.value = true;
        config.hostId = currentUserId.value; // 主持人:  config.hostId 就是自己的 ID
    } else {
        isHost.value = false;
        config.hostId = route.query.hostId; //参与者：从路由中获取hostId
    }
    config.isHost = ZoomVideoService.getIsHost();
}


/* *********************
  视频/音频/共享屏幕方面的代码
   ********************* */
/* 视频/音频/屏幕共享控制 */
const isVideoOn = ref(true);
const isAudioOn = ref(true);
const isSharing = ref(false); // 本地是否在共享

/** 计算属性: 是否有人共享 */
const someoneIsSharing = computed(() => {
    return users.value.some(u => u.isSharing.timeline.length > 0 && u.isSharing.timeline[u.isSharing.timeline.length - 1].value);
});

/** 切换本地视频 */
const toggleVideo = async () => {
  isVideoOn.value = !isVideoOn.value;
  await ZoomVideoService.toggleLocalVideo(isVideoOn.value);

   const localUser = users.value.find(u => u.userId === currentUserId.value);
    if (localUser) {
      localUser.hasVideo.final = isVideoOn.value;
      localUser.hasVideo.timeline.push({time: Date.now(), value: isVideoOn.value}); // 更新 timeline
    }
};

/** 切换本地音频 */
const toggleAudio = async () => {
  isAudioOn.value = !isAudioOn.value;
  await ZoomVideoService.toggleLocalAudio(isAudioOn.value);
    const localUser = users.value.find(u => u.userId === currentUserId.value);
    if(localUser){
        localUser.isAudioOn.final = isAudioOn.value;
        localUser.isAudioOn.timeline.push({time: Date.now(), value: isAudioOn.value});
    }
};

/**
 * 切换“本地屏幕共享”开关
 * - 仅本地共享，远端共享由 SDK 事件管理
 */
const toggleScreenShare = async () => {
  if (isSharing.value) {
    // 已在共享 => 停止共享
      await ZoomVideoService.stopLocalScreenShare();  // 先停止
      isSharing.value = false;

      const localUser = users.value.find(u => u.userId == currentUserId.value);
      if(localUser){
        localUser.isSharing.final = false;
        localUser.isSharing.timeline.push({time: Date.now(), value: false});
      }

  } else {
    // 开始本地共享
    const result = await ZoomVideoService.startLocalScreenShare();
    if (result) {
      isSharing.value = true;

        const localUser = users.value.find(u=> u.userId == currentUserId.value);
        if(localUser){
          localUser.isSharing.final = true;
          localUser.isSharing.timeline.push({time: Date.now(), value: true});
        }
    }
  }
};
















/* *********************
聊天和文件传输方面的代码
   ********************* */
const chatMessagesList = ref([]);
const chatPanel = ref(null);
// 用于私聊、文件传输
const chatReceivers = ref([]);
const selectedReceiverId = ref(0);
const uploadProgressInfo = ref(null);
let cancelSendFileFn = null;
const aiChat = ref(null);
const fileToAnalyze = ref(null); // 存储要分析的文件信息，用于传递给 AIFloatingChat 组件
const fileMsgId = ref(null);

/* 用户列表 */
const users = ref([]);       //  改回数组
const currentUserId = ref(null);
const isHost = ref(false);
// 发送信息
const handleSendChat = async (text) => {
    if (!text) return;
    const timestamp = new Date();
  try {
      if (selectedReceiverId.value === 0) {
          await ZoomVideoService.sendMessageToAll(text, timestamp);
      } else {
          await ZoomVideoService.sendMessageToUser(text, selectedReceiverId.value, timestamp);
    }
       // chatInput.value = '';  // 在 ChatPanel 组件内部清除
    } catch (err) {
      console.error('发送消息失败:', err);
    showSnackBar('发送消息失败');
}
    };


/** 群聊切换 */
const toggleChat = () => {
  isChatVisible.value = !isChatVisible.value;
};
//  发送聊天消息
const sendChat = async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  const timestamp = new Date(); // 新增：获取时间戳
  try {
    if (selectedReceiverId.value === 0) {
      await ZoomVideoService.sendMessageToAll(text, timestamp); // 传递时间戳
    } else {
      await ZoomVideoService.sendMessageToUser(text, selectedReceiverId.value, timestamp);  // 传递时间戳
    }
    chatInput.value = '';
  } catch (err) {
    console.error('发送消息失败:', err);
    showSnackBar('发送消息失败');
  }
};
// 收到他人聊天消息
function handleChatMessage(payload) {
    const { message, sender, receiver, file, timestamp, id} = payload; //  timestamp, 增加 id
     // 3. 使用默认头像
  const getAvatar = () => {
  // 优先使用消息中的avatar
  if (sender.avatar) return sender.avatar;
  // 从store中查找用户信息
  const userInStore = store.state.users?.find(u => u.userId === sender.userId);
  return userInStore?.avatarUrl || defaultAvatar;
};
  console.log("Received chat message:", payload); // 打印整个 payload
    console.log('Message ID:', id);
    console.log('Sender AvatarUrl:', sender.avatar);
    console.log('[DEBUG] 收到消息:', {
    senderId: payload.sender.userId,
    senderAvatar: getAvatar(),
    currentUserId: store.state.user.uid // 当前用户 ID
  });
    // 1. 检查 msgId 是否已存在, 如果存在, 直接返回
    if (ZoomVideoService.isMessageAlreadyAdded(id)) {
        return;
    }
    // 2. 如果不存在, 添加到已处理列表
    ZoomVideoService.addMessageId(id);

    // 3. 构造消息对象, 添加到列表 (和之前一样)
    let messageObj;
    if (!file) {
      messageObj = {
        type: receiver.userId === "0" ? 'group' : 'private',
        senderId: sender.userId,
        senderName: sender.name,
        receiverId: receiver.userId,
        message,
        file: null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        msgId: id,
        avatar: getAvatar(),
      };

    } else {
      messageObj = {
        type: receiver.userId === '0' ? 'group' : 'private',
        senderId: sender.userId,
        senderName: sender.name,
        receiverId: receiver.userId,
        message: null,
        avatar: getAvatar(),
        file: {
          name: file.name,
          size: file.size,
          fileUrl: file.fileUrl
        },
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        fileDownloadProgress: 0,
        fileDownloadStatus: null,
        msgId: id 
      };
  }
  chatMessagesList.value.push(messageObj);
  scrollToBottom();
}

//  自己发送消息的回调,只负责添加消息到列表
function handleMessageSent(msg) {
     // 1. 添加 msgId, 防止重复处理
     ZoomVideoService.addMessageId(msg.id);    // 重要!

    // 2. 直接复用 handleChatMessage
    handleChatMessage(msg); // 复用
}

// 聊天历史
function handleChatHistory(history) {
    history.forEach(msg => {
      if (!msg.file) {
        chatMessagesList.value.push({
          type: msg.receiver.userId === '0' ? 'group' : 'private',
          senderId: msg.sender.userId,
          senderName: msg.sender.name,
          receiverId: msg.receiver.userId,
          message: msg.message,
          avatar: msg.sender.avatar || defaultAvatar,
          file: null,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date() // 使用传入的时间戳
        });
      } else {
        chatMessagesList.value.push({
          type: msg.receiver.userId === '0' ? 'group' : 'private',
          senderId: msg.sender.userId,
          senderName: msg.sender.name,
          receiverId: msg.receiver.userId,
          avatar: msg.sender.avatar || defaultAvatar, 
          message: null,
          file: {
            name: msg.file.name,
            size: msg.file.size,
            fileUrl: msg.file.fileUrl
          },
           timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(), // 使用传入的时间戳
          fileDownloadProgress: msg.file.download?.progress || 0,
          fileDownloadStatus: msg.file.download?.status || null,
          msgId: msg.id
        });
      }
    });
    scrollToBottom();
}
const chatMessages = ref(null);
function scrollToBottom() {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
}

/** --- 新增: 发送文件 --- */
/** 1) 点击“发送文件”按钮 => 打开文件选择器 */
/** 2) 选择文件后，调用 sendFile 方法 */
async function onFileInputChange(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    const file = files[0];
    try {
      let msgId;
      if (selectedReceiverId.value === 0) {
         msgId = await ZoomVideoService.sendFileToAll(file);  //  await, 获取 msgId
      } else {
         msgId = await ZoomVideoService.sendFileToUser(file, selectedReceiverId.value); //  await, 获取 msgId
      }
        //  发送文件消息,很关键
        if(msgId){
            const curUser = ZoomVideoService.client.getCurrentUserInfo();
            handleMessageSent({
                sender: { userId: curUser.userId, name: curUser.displayName, avatar:curUser.avatar|| store.state.user.avatarUrl },
                receiver:{userId: selectedReceiverId.value.toString()},  // 新增
                file: {
                  name: file.name,
                  size: file.size,
                },
                timestamp: Date.now(),
                id:msgId,
            });
        }
    }
    catch(err){
      console.error("发送文件失败",err);
      showSnackBar('发送文件失败');
    }
  }
  e.target.value = ''; // 清空
}

/** 更新可聊天用户列表(供私聊选择) */
const updateChatReceivers = async () => {
  const receivers = ZoomVideoService.getChatReceivers();
    // 过滤掉 Everyone(ID:0)
  chatReceivers.value = receivers.filter(receiver => !(receiver.userId === '0' && receiver.displayName ==='Everyone'));
  console.log('[updateChatReceivers]', receivers);
};





// 打开 AI 助手 (并传递文件)
const openAiAssistant = (msg) => {
  fileToAnalyze.value = msg.file;
  fileMsgId.value = msg.msgId; // 新增：保存 msgId
  console.log("fileToAnalyze:", fileToAnalyze.value); // 打印
  console.log("fileMsgId:", fileMsgId.value);      // 打印
  nextTick(() => {
    if (aiChat.value) {
      aiChat.value.openChat();
    }
  });
};
// 处理文件下载事件
function handleFileDownloadProgress(payload) {
          const { fileName, progress, status, id, fileBlob } = payload;
           // 找到对应的消息
          const msgObj = chatMessagesList.value.find(m => m.msgId === id);

             if (!msgObj) return;  //  没找到, 直接返回

            // 更新进度
          msgObj.fileDownloadProgress = progress;

          switch (status) {
          case 1: // InProgress
          msgObj.fileDownloadStatus = 'InProgress';
            break;
         case 2: // Success, *关键修改*
          msgObj.fileDownloadStatus = 'Success';

           //  如果是 blob 下载, 且是当前分析的文件,  处理
          if (fileBlob && msgObj.msgId === fileMsgId.value) {
              const objUrl = URL.createObjectURL(fileBlob);
              const link = document.createElement('a');
              link.href = objUrl;
              link.download = fileName;
              link.click();
              URL.revokeObjectURL(objUrl);
              aiChat.value.sendFileDataToAnalyze(fileBlob, "summary");
          }
          msgObj.cancelDownloadFn = null;
              break; 
          case 3:
          msgObj.fileDownloadStatus = "Fail";
          msgObj.cancelDownloadFn = null;
              break;
          case 4:
          msgObj.fileDownloadStatus = "Cancel";
          msgObj.cancelDownloadFn = null;
            break;
          }
        }


/* *********************
  服务质量方面的代码
   ********************* */
// 控制“服务质量”面板的显示/隐藏
const showServiceQuality = ref(false);
// 用于记录“最新的”编码/解码数据，用于在文本区显示
const statsData = reactive({
  videoEncode: null,
  videoDecode: null,
  audioEncode: null,
  audioDecode: null,
  shareEncode: null,
  shareDecode: null
});
//用数组去记录关键数值(用于折线图)
const uplinkData = ref([]);  // 网络上行
const downlinkData = ref([]); // 网络下行

const videoEncodeFpsData = ref([]); // 视频发送FPS
const videoDecodeFpsData = ref([]); // 视频接收FPS

const audioEncodeLossData = ref([]); // 音频发送avg_loss
const audioDecodeLossData = ref([]); // 音频接收avg_loss

let networkChart = null;  // ECharts实例

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

function forceCloseServiceQuality() {
  if (networkChart) {
    networkChart.dispose();
    networkChart = null;
  }
  showServiceQuality.value = false;
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
      // decode 侧,只更新图表
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
          // 音频编码, 只更新图表
      pushAudioEncodeLoss(data.avg_loss ?? 0);
      statsData.audioEncode = data;
    }
    else {
          // 音频解码,只更新图表
      pushAudioDecodeLoss(data.avg_loss ?? 0);
      statsData.audioDecode = data;
    }
  });

  // 4. share  ,只更新最新数据
  stream.subscribeShareStatisticData({ encode: true, decode: true });
    client.on('share-statistic-data-change', (payload) => {
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


/* *********************
会议离开和结束
   ********************* */
const leaveSession = async () => { //普通用户离开会议
  try {
      // 离开会议, 更新 leaveTime
      const localUser = users.value.find(u => u.userId === currentUserId.value);
    if (localUser) {
      localUser.leaveTime = new Date();
      localUser.hasVideo.final = isVideoOn.value;  //  hasVideo
      localUser.hasVideo.timeline.push({ time: Date.now(), value: isVideoOn.value }); // 更新 timeline
      localUser.isAudioOn.final = isAudioOn.value; //新增
      localUser.isAudioOn.timeline.push({time: Date.now(), value: isAudioOn.value});
      localUser.isSharing.final = isSharing.value; // 更新 isSharing
      localUser.isSharing.timeline.push({ time: Date.now(), value: isSharing.value }); // 更新 timeline
      localUser.isUpdated = true;//设置标志位
    }
    // 普通用户离开，不再更新会议记录
    await ZoomVideoService.leaveSession(false);
    resetState();
    ElMessage.success('已退出会议');
    store.commit('SET_VIDEOCALL_ACTIVE', false); 
    router.push('/home');
  } catch (error) {
    console.error('leaveSession error:', error);
    showSnackBar('退出会议失败');
  }
};

  const endSession = async () => { //主持人结束会议
    if (!isHost.value) {
      showSnackBar('只有主持人可以结束会议');
      return;
    }
    try {
      // 结束会议前, 更新所有用户的 leaveTime (包括自己)
      const now = new Date();
      users.value.forEach(u => {
        if (!u.leaveTime) {  // 还没离开, 更新!
          u.leaveTime = now;
          //  对 u.hasVideo.timeline 进行空值检查
          if(u.hasVideo && u.hasVideo.timeline && u.hasVideo.timeline.length > 0){
            u.hasVideo.final = u.hasVideo.timeline[u.hasVideo.timeline.length - 1].value;
          }
          else{
              u.hasVideo = {  //  进行初始化
                  initial: false,
                  final: false,
                  timeline: []
                }
          }
          u.hasVideo.timeline.push({ time: now, value:  u.hasVideo.final});

          // 对 u.isAudioOn.timeline 进行空值检查
          if(u.isAudioOn && u.isAudioOn.timeline && u.isAudioOn.timeline.length > 0){
            u.isAudioOn.final = u.isAudioOn.timeline[u.isAudioOn.timeline.length - 1].value;
          }
          else{
              u.isAudioOn = { //  进行初始化
                initial: false,
                final: false,
                timeline: []
              }
          }
          u.isAudioOn.timeline.push({time: now, value: u.isAudioOn.final});

          //  对 u.isSharing.timeline 进行空值检查
          if(u.isSharing && u.isSharing.timeline && u.isSharing.timeline.length > 0){
              u.isSharing.final = u.isSharing.timeline[u.isSharing.timeline.length - 1].value;
          }
          else{
              u.isSharing = {
                initial: false,
                final: false,
                timeline:[]
              }
          }
          u.isSharing.timeline.push({ time: now, value: u.isSharing.final });
        }
      });
      //在更新 Firestore 之前，过滤和检查数据,这部分过滤数据的代码可以考虑封装成一个函数
      const filteredUsers = users.value.map(user => {
        const filteredUser = { ...user };
        // 确保 participant 对象中没有 undefined 值
        Object.keys(filteredUser).forEach(key => {
          if (filteredUser[key] === undefined) {
            console.warn(`User ${filteredUser.userId} has undefined value for key: ${key}`);
            delete filteredUser[key]; // 从对象中删除 undefined 的键
          }
        });
        return filteredUser;
      });

      const filteredChatMessages = chatMessagesList.value
        .filter(
          (msg) =>
            // 确保 chatMessages 对象中没有 undefined 值
            !Object.values(msg).some((value) => value === undefined)
        )
        .map((msg) => {
          const filteredmes = { ...msg };
          Object.keys(filteredmes).forEach((key) => {
            if (filteredmes[key] === undefined) {
              console.warn(`chatMessages has undefined valur for key: ${key}`);
              delete filteredmes[key];
            }
          });
          return filteredmes;
        });

      console.log('endSession - filteredUsers:', filteredUsers); //  检查
      console.log('endSession - filteredChatMessages:', filteredChatMessages); // 检查
      const user = store.getters.getUser; // 获取当前用户信息
      //  更新 Firestore 中的状态和结束时间
      if (user && config.meetingId) {
        await FirestoreService.updateMeetingHistory(user.uid, config.meetingId, {
          //  user.uid
          status: 'finished',
          endTime: now, // 直接使用 now
          participants: filteredUsers, //  更新
          chatMessages: filteredChatMessages, //
        });
      } else {
        console.error('config.meetingId 不存在 (endSession)');
      }

       ZoomVideoService.leaveSession(true); //  结束会议, 放到后面
      resetState();
      ElMessage.success('会议已结束');
      store.commit('SET_VIDEOCALL_ACTIVE', false);
      router.push('/home');
    } catch (error) {
      console.error('endSession error:', error);
      showSnackBar('结束会议失败');
    }
  };

function resetState() {
  sessionJoined.value = false;
  autoJoin.value = false;
  users.value = [];
  chatMessagesList.value = [];
  // activeSpeaker.value = null;
  isSharing.value = false; //
  config.meetingId = ''; // 清空 meetingId
  config.hostId = ''; // 清空
}


/* *********************
转录方面
   ********************* */
// ... 其他已有的代码 ...
const isTranscribing = ref(false);
const subtitle = ref("");  // 用于存储字幕
let mediaStream = null;      // 用于存储麦克风流
let websocket = null;       // WebSocket 连接
let audioContext = null; // AudioContext
let sourceNode = null;  // MediaStreamAudioSourceNode
let gainNode = null; // GainNode (可选，用于音量控制)
let processor = null;    // ScriptProcessorNode

const toggleTranscription = async () => {
  isTranscribing.value = !isTranscribing.value;
  if (isTranscribing.value) {
    await startTranscription();
  } else {
    stopTranscription();
  }
};

const startTranscription = async () => {
    console.log("开始转录");
  try {
    // 1. 获取麦克风权限
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("麦克风已获取:", mediaStream);

    // 2. 创建 WebSocket 连接
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:4321/ws`; //  WebSocket URL
      console.log("尝试连接到:", wsUrl);
    websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
       console.log("WebSocket 连接已建立");
    };

    websocket.onmessage = (event) => {
      //  处理从服务器接收到的消息
        const data = event.data;
        console.log("从服务器接收到消息:", data);  // 打印原始消息

      if (data.startsWith("[INTERMEDIATE]")) {
        subtitle.value = data.substring(14); // 去掉 "[INTERMEDIATE]" 前缀
          console.log("更新字幕 (中间结果):", subtitle.value);
      } else if (data.startsWith("[FINAL]")) {
        subtitle.value = data.substring(7);   //  去掉 "[FINAL]" 前缀
          console.log("更新字幕 (最终结果):", subtitle.value);
      } else if (data.startsWith("[ERROR]")) {
        console.error("转录错误:", data.substring(7));  // 去掉 “[ERROR]” 前缀
      }
    };

    websocket.onclose = () => {
        console.log("WebSocket 连接已关闭");
       if(isTranscribing.value)
              {
                  stopTranscription(); // 自动停止
                  isTranscribing.value = false; // 更新状态
              }
    };
      websocket.onerror = (error) => {
          console.error("WebSocket 错误:", error);
      };

    // 3. 创建音频处理上下文和节点
    audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000}); // 指定采样率！
      console.log("AudioContext 已创建, 采样率:", audioContext.sampleRate);
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
      console.log("源节点已创建",sourceNode);

      gainNode = audioContext.createGain(); // 创建增益节点
      gainNode.gain.value = 1.0; // 设置增益 (1.0 表示不变)
      console.log("增益节点已创建",gainNode);
      sourceNode.connect(gainNode);

      processor = audioContext.createScriptProcessor(0, 1, 1);   // 缓冲区大小自动, 单声道输入, 单声道输出
      console.log('处理器已创建',processor)
      processor.onaudioprocess = (audioProcessingEvent) => {  //  处理音频数据
      if (!isTranscribing.value || websocket.readyState !== WebSocket.OPEN) {
          return;
      }
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0); //  获取第一个声道 (单声道)

      // 转换为 Int16 格式 (后端要求)
      const int16Data = float32ToInt16(inputData);

                // 检查数据长度, 如果很小, 可能是静音
                if (int16Data.length > 0) {
                    const buffer = int16Data.buffer; // 获取底层的 ArrayBuffer
              
                     console.log("发送音频数据, 大小:", buffer.byteLength);
                    try {
                        if(websocket && websocket.readyState === WebSocket.OPEN){
                           websocket.send(buffer);
                        }
                    }
                     catch(error){
                       console.error("WebSocket 发送失败", error)
                    }
               }
    };

      gainNode.connect(processor);
     processor.connect(audioContext.destination); //  连接到 destination, 否则没有声音事件!


  } catch (error) {
    console.error("启动转录失败:", error);
        ElMessage.error("启动转录失败，请检查麦克风权限")
  }
};


const stopTranscription = () => {
 console.log("停止转录");

    // 1. 关闭 WebSocket
    if (websocket && websocket.readyState !== WebSocket.CLOSED) {
         // 发送 [DONE] 消息 (如果连接还开着)
           if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(new Uint8Array([0x5B, 0x44, 0x4F, 0x4E, 0x45, 0x5D])); //  "[DONE]" 的二进制表示

            console.log('已发送[DONE]')
        }
    }
    websocket.close();
      websocket = null;
  // 2. 停止麦克风
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // 3. 关闭音频上下文和节点
  if (audioContext) {
    if(sourceNode) sourceNode.disconnect();
    if(gainNode) gainNode.disconnect();
      if(processor) processor.disconnect(); // 断开
        audioContext.close().then(()=>{
         audioContext = null;
           sourceNode = null;
        processor = null;
        gainNode = null;
        console.log('音频上下文已关闭')
    });
  }
      subtitle.value = ""
};

// Float32Array 转 Int16Array 的辅助函数
function float32ToInt16(buffer) {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf;
}

// 记得在组件卸载时停止转录 (重要!)
onBeforeUnmount(() => {
    if (sessionJoined.value) {
        ZoomVideoService.leaveSession(false);
        sessionJoined.value = false;
    }
    if (isTranscribing.value) {
      stopTranscription();
    }


// ... 其他已有的 onBeforeUnmount 内容 ...
});



// stopRecording(); 
ZoomVideoService.client.off('chat-file-download-progress', handleFileDownloadProgress); 


/* *********************
SDK事件订阅
   ********************* */
function subscribeEvents() {
  const client = ZoomVideoService.client;

  client.on('user-added', async (userList) => {
    if (!Array.isArray(userList)) return;
    for (const user of userList) {
      if (!users.value.find(u => u.userId === user.userId)) {
        console.log('[user-added] =>', user);

        // 将新用户添加到 users 数组
        const newUser = {
          userId: user.userId,
          userName: user.displayName,
          role: user.isHost ? 'host' : 'participant',
          joinTime: new Date(),
          leaveTime: null,
          avatar: user.avatar,
          hasVideo: {
            initial: user.bVideoOn,
            final: user.bVideoOn,
            timeline: [{ time: Date.now(), value: user.bVideoOn }],
          },
          isAudioOn: {
            initial: true, // 假设新加入的用户默认开启音频
            final: true,
            timeline: [{ time: Date.now(), value: true }],
          },
          isSharing: {
            initial: user.sharerOn,
            final: user.sharerOn,
            timeline: [{ time: Date.now(), value: user.sharerOn }],
          },
          messagesSent: 0,
        };
        users.value.push(newUser);

        // 如果当前用户是主持人，更新 host 的 participants 字段
        if (isHost.value) {
          const loginUser = store.getters.getUser;
          if (loginUser && config.meetingId) {
            try {
              // 过滤 undefined, *包括* timeline 数组中的 undefined
              const filteredUsers = users.value.map(userData => {
                const filteredUser = { ...userData }; //  浅拷贝

                // 深度过滤
                function deepFilter(obj) {
                  for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                      if (obj[key] === undefined) {
                        delete obj[key]; // 删除 undefined 属性
                      } else if (Array.isArray(obj[key])) {
                        // 过滤数组中的 undefined 元素
                        obj[key] = obj[key].filter(item => item !== undefined);
                        // 如果数组是 timeline, 进一步检查
                        if (key === 'timeline') {
                          obj[key] = obj[key].filter(item => {
                            return item !== null && typeof item === 'object' && Object.values(item).every(val => val !== undefined);
                          })
                        }

                      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        deepFilter(obj[key]); // 递归处理嵌套对象
                      }
                    }
                  }
                  return obj;
                }

                return deepFilter(filteredUser); // 返回过滤后的对象
              });


              await FirestoreService.updateMeetingHistory(
                loginUser.uid,
                config.meetingId,
                { participants: filteredUsers }
              );
            } catch (err) {
              console.error('更新会议信息失败 (user-added, host):', err);
            }
          }
        }
      }
    }
    // 等 Vue DOM 渲染
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
    updateChatReceivers(); // 移到这里
  });

  client.on('user-removed', async (userList) => {
    if (!Array.isArray(userList)) return;

    for (const user of userList) {
      console.log('[user-removed]', user.userId);
      const userIndex = users.value.findIndex(u => u.userId === user.userId);

      if (userIndex !== -1) {
        // 更新内存中的用户信息
        const userObj = users.value[userIndex];
        userObj.leaveTime = new Date();
        userObj.hasVideo.final = userObj.hasVideo.timeline[userObj.hasVideo.timeline.length - 1].value;
        userObj.hasVideo.timeline.push({ time: userObj.leaveTime, value: userObj.hasVideo.final });

        userObj.isAudioOn.final = userObj.isAudioOn.timeline[userObj.isAudioOn.timeline.length - 1].value;
        userObj.isAudioOn.timeline.push({ time: userObj.leaveTime, value: userObj.isAudioOn.final });

        userObj.isSharing.final = userObj.isSharing.timeline[userObj.isSharing.timeline.length - 1].value;
        userObj.isSharing.timeline.push({ time: userObj.leaveTime, value: userObj.isSharing.final });

        //  user-removed 事件 *不再* 更新 Firestore 中的 participants。
        //  *只更新当前离开用户自己的信息*。
        if (user.userId === currentUserId.value) { // 确保是当前用户
          const loginUser = store.getters.getUser;
          if (loginUser && config.meetingId && !userObj.isUpdated) {  //  添加 !userObj.isUpdated 判断
            try {
              // 只更新当前离开的用户的数据，不需要participants这个字段了
              const updatedData = {
                leaveTime: new Date(),
                hasVideo: {
                  final: userObj.hasVideo.final,
                  timeline: userObj.hasVideo.timeline
                },
                isAudioOn: {
                  final: userObj.isAudioOn.final,
                  timeline: userObj.isAudioOn.timeline
                },
                isSharing: {
                  final: userObj.isSharing.final,
                  timeline: userObj.isSharing.timeline
                }
              };

              await FirestoreService.updateMeetingHistory(loginUser.uid, config.meetingId, updatedData);
              userObj.isUpdated = true; // 标记为已更新
            } catch (err) {
              console.error('更新会议信息失败 (user-removed, self):', err);
            }
          }
        }

        users.value.splice(userIndex, 1);  // 从 users 数组中移除
      }

      ZoomVideoService.detachUserVideo(user.userId);
      ZoomVideoService.detachScreenShare(user.userId);
      updateChatReceivers(); // 移到这里
    }
  });


  client.on('peer-video-state-change', async ({ action, userId }) => {
    console.log('[peer-video-state-change]', action, ' user=', userId);
    const userObj = users.value.find(u => u.userId === userId);
    if (!userObj) return;
    const now = Date.now();
    if (action === 'Start') {
      userObj.hasVideo.final = true; // 更新 hasVideo
      userObj.hasVideo.timeline.push({ time: now, value: true }); // 更新时间线
      await nextTick();
      await ZoomVideoService.attachUserVideo(userId, VideoQuality.VIDEO_360P);

    } else if (action === 'Stop') {
      userObj.hasVideo.final = false;
      userObj.hasVideo.timeline.push({ time: now, value: false }); // 更新时间线
      ZoomVideoService.detachUserVideo(userId);
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
    const now = Date.now();

    if (state === 'Active') {
      userObj.isSharing.final = true;
      userObj.isSharing.timeline.push({ time: now, value: true }); // 更新时间线

      //  强制关闭服务质量窗口:
      forceCloseServiceQuality();

      // 如果是别人共享 => 渲染远端共享
      if (userId !== currentUserId.value) {
        await ZoomVideoService.attachScreenShare(userId);
      }

    } else if (state === 'Inactive') {
      userObj.isSharing.final = false;
      userObj.isSharing.timeline.push({ time: now, value: false });// 更新时间线
      ZoomVideoService.detachScreenShare(userId);
    }
  });

  client.on('video-active-change', (payload) => {
    const { state, userId } = payload;
    console.log('[video-active-change]', state, ' user=', userId);
  });

  client.on('connection-change', (payload) => {
    const { state, reason } = payload;
    console.log('[connection-change]', state, reason)
    if (state === 'Closed') {
      ElMessage.info(`会议连接已关闭:${reason}`);
      leaveSession();
    } else if (state === "Reconnecting") {
      ElMessage.info("正在重新连接...")
    } else if (state === "Connected") {
      ElMessage.info("已重新连接")
    } else if (state === 'Fail') {
      ElMessage.info("连接失败")
      leaveSession();
    }
  });

  client.on('device-change', () => {
    console.log('device changed:', ZoomVideoService.stream?.getCameraList() || []);
  });

  client.on('session-closed', async () => { // 改为 async 函数
    ElMessage.info('会议已结束');
    //  stopRecording();  //  *不要*在这里停止录音
    // 直接更新状态为 finished
    const user = store.getters.getUser;
    if (user && config.meetingId) {
      // 如果是主持人主动结束,已经在 endSession() 里更新, 这里主要是处理因为其他原因导致的 session-closed (例如网络问题)
      // 因此,最好先尝试读取 Firestore 的数据,防止覆盖 endSession() 的更新.

      try {
        const existingMeeting = await FirestoreService.getMeetingHistory(config.hostId, config.meetingId);
        if (existingMeeting && existingMeeting.status !== 'finished') { // 如果还不是 finished, 才更新
          await FirestoreService.updateMeetingHistory(config.hostId, config.meetingId, { // config.hostId
            status: 'finished',
            endTime: new Date()
          });
        }

      }
      catch (err) {
        console.error("更新会议状态失败");
      }
      finally {
        router.push('/home');  // 一定
      }
    }
    else {
      // 不是主持人,或者没有 meetingId,也跳转
      router.push('/home');
    }
  });

  client.on('session-expired', () => {
    ElMessage.info("会议会话已过期")
    leaveSession();
  });
  client.on("session-kicked-out", (payload) => {
    ElMessage.info(`已被踢出会议`);
    leaveSession();
  });

  // 聊天事件 (以下部分保持不变，因为 ChatPanel 会触发父组件的相应方法)
  client.on('chat-on-message', (payload) => {
    handleChatMessage(payload);
    // 增加发送者的 messagesSent，只在收到“文本消息”时增加.
    if (!payload.file) {
      const sender = users.value.find(u => u.userId === payload.sender.userId);
      if (sender) {
        sender.messagesSent += 1;
      }
    }
  });

  ZoomVideoService.getChatHistory().then((history) => {
    handleChatHistory(history);
    // 增加历史消息中每个发送者的消息数
    history.forEach(msg => {
      const sender = users.value.find(u => u.userId === msg.sender.userId);
      if (sender) {
        sender.messagesSent += 1;
      }
    })
  });
  ZoomVideoService.setMessageSentCallback(handleMessageSent);

  /**
* 文件上传进度事件
*/
  client.on('chat-file-upload-progress', (payload) => {
    const { fileName, progress, status, id } = payload;
    uploadProgressInfo.value = {  // 这个 uploadProgressInfo 仍然在 videocall.vue
      fileName,
      progress,
      status,
    };

    if (status === 3 || status === 4) {
      cancelSendFileFn = null;
      setTimeout(() => {
        uploadProgressInfo.value = null;
      }, 3000);
    }

    // 上传成功，增加发送者的 messagesSent
    if (status === 2) {
      cancelSendFileFn = null;
      const msgObj = chatMessagesList.value.find((m) => m.msgId === id);
      if (msgObj) {
        const senderUser = users.value.find((u) => u.userId === msgObj.senderId);
        if (senderUser) {
          senderUser.messagesSent += 1; // 增加消息数
        }
      }
      setTimeout(() => {
        uploadProgressInfo.value = null;
      }, 3000);
    }
  });

  /**
  * 文件下载进度事件 (此事件监听器 *必须* 留在 videocall.vue, 因为它涉及到 AI 分析)
  */
 client.on('chat-file-download-progress', handleFileDownloadProgress); // 必须保留, 且放在 videocall.vue
}


onBeforeUnmount(() => {
  if (sessionJoined.value) {
    ZoomVideoService.leaveSession(false);
    sessionJoined.value = false;
  }


});

</script>

<style scoped>
/* 基础样式 */
main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f7f7f7;
  position: relative;
  margin: 0;
}
.return-icon-button {
   position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
   color: white;
   padding: 0;/* 移除 padding */
   border: none;
   border-radius: 50%;/* 圆形按钮 */
    width: 45px;/* 调整大小 */
    height: 45px;
   display: flex;  /* 使用 flex 布局 */
  align-items: center; /*  垂直居中 */
  justify-content: center; /*  水平居中 */
   cursor: pointer;
   font-size: 40px; /* 移除 */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
   z-index: 1002;
transition: background-color 0.3s;  /* 添加过渡效果 */
}
.return-icon-button:hover .icon {
  opacity: 1; /* 鼠标悬停时完全不透明 */
}
/* .video-call-container.minimized .return-icon-button {
  bottom: 20px;  
  left: 20px;
} */

.return-icon-button .icon {
  width: 30px;
  height: 30px;
  opacity: 0.7; /* 设置透明度为 80% */
  transition: opacity 0.3s; /* 可选：添加平滑过渡 */
}
.closeBtn {
  position: absolute;
  top: 10px;
  right: 20px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.closeBtn:hover {
  color: #e53935;
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
/* 模式切换按钮样式 */
.mode-switch {
  text-align: center;
  margin-top: 20px;
}
.controls {
  flex-shrink: 0;
  background: #1a1a1a;
  padding: 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
.controls button {
  background-color: #333;
  color: #fff;
  border: none;
  padding: 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color;
  width:60px; /* 根据需求调整宽度 */
  height: 60px; /* 根据需求调整高度 */
}

.controls button img {
    width: 90px; /* 根据需求调整宽度 */
    height: 90px; /* 根据需求调整高度 */
    transform: scale(2); /* 放大1.5倍 */
    vertical-align: middle; /* 使图标在按钮中垂直居中 */
}

.switch-button {
  background-color: #9dccff; /* 蓝色背景 */
  color: rgb(0, 0, 0); /* 白色文字 */
  padding: 12px 20px; /* 内边距 */
  border: none; /* 无边框 */
  border-radius: 6px; /* 圆角 */
  cursor: pointer; /* 指针样式 */
  font-size: 16px; /* 字体大小 */
  transition: background-color 0.3s, transform 0.3s; /* 过渡效果 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 阴影 */
  margin-bottom: 10px;
}

.switch-button:hover {
  background-color: #6bb3ff; /* 悬停时背景颜色变深 */
  transform: translateY(-2px); /* 悬停时向上移动 */
}

.switch-button:active {
  background-color: #5aaaff; /* 点击时背景颜色更深 */
  transform: translateY(0); /* 点击时恢复原位 */
}
/* 会议布局 */
.meeting-layout {
  width: 90%;
  height: 90vh;
  background: #fff;
  max-height: calc(100vh - 90px); 
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



.controls button.active {
  background-color: #1a73e8;
}

.exit-button {
  background-color: #e53935;
}

.controls button:hover {
  background-color: #555;
}

/* 群聊窗口 */
/* .chat-container {
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
    z-index: 99;
     } */      /* 样式修改 */

.chat-container {
  flex: 1;
  /* 占据剩余空间 */
  max-width: 400px;
  /* 可选：设置最大宽度 */
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
  border-left: 1px solid #ddd;
  /* 与左侧面板分隔 */
  /* 其他样式保持不变 */
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
.analyze-button {
    background-color: #1890ff; /* 蓝色 */
    color: white;
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-left: 10px;
}
.analyze-button:hover {
  background-color: #40a9ff;
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
  .controls {
        flex-wrap: wrap; /* 使按钮在空间不足时换行 */
        justify-content: center; /* 按钮左对齐 */
        padding: 5px; /* 减少内边距 */
        gap: 20px; /* 减少按钮间距 */
    }
  .controls button {
        padding: 10px 12px; /* 调整按钮内边距 */
        font-size: 12px; /* 减小字体大小 */
        width: 40px; /* 根据需求调整宽度 */
        height: 40px; /* 根据需求调整高度 */
    }
  .controls button img {
    width: 16px; /* 减小图标宽度 */
    height: 16px; /* 减小图标高度 */
    vertical-align: middle; /* 使图标在按钮中垂直居中 */
    }

    .subtitle {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7); /* 增加透明度 */
  color: #fff;
  padding: 10px 20px; /* 增大内边距，提升视觉效果 */
  border-radius: 8px; /* 稍微增大圆角，更美观 */
  max-width: 90%; /* 增大最大宽度，适应更多内容 */
  text-align: center;
  font-size: clamp(16px, 3vw, 24px); /* 动态字体大小，适配不同屏幕 */
  white-space: normal; /* 自动换行，无需强制保留空白符 */
  word-break: break-word; /* 更好的长单词断行处理 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* 添加阴影，增强层次感 */
  z-index: 100; /* 确保字幕在其他内容之上 */
}

  #transcriptionContainer {
    width: 100%;
    margin-left: 0;
    margin-top: 10px;
    height: 300px;
  }

  /* 响应式布局调整 */
  .meeting-content {
    flex-direction: column;
  }

  .chat-container {
    max-width: none;
    /* 移除最大宽度限制 */
    border-left: none;
    /*移除边框*/
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
  .controls {
        flex-wrap: wrap; /* 使按钮在空间不足时换行 */
        justify-content:center; /* 按钮左对齐 */
        padding: 10px; /* 减少内边距 */
        gap: 15px; /* 减少按钮间距 */
    }
  .controls button {
        padding: 10px 10px; /* 调整按钮内边距 */
        font-size: 10px; /* 减小字体大小 */
        width: 12%; /* 根据需求调整宽度 */
    }
  .controls button img {
        width: 10px; /* 减小图标宽度 */
        height: 10px; /* 减小图标高度 */
    }
.service-quality-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  max-height: 70vh;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 16px;
  z-index: 99;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.service-quality-overlay:hover {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}
.service-quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #e2e4e9, #bec3c9);  
  color: #000000;
  padding: 20px;
  border-radius: 16px 16px 0 0;
  letter-spacing: 0.8px;
  font-size: 19px;
  font-weight: bold;
}

.close-quality {
  background: none;
  border: none;
  color: #000000;
  font-size: 28px;
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 4px;
}

.close-quality:hover {
  transform: rotate(90deg);
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
  padding-top: 20px;
  border: 1px solid #ccc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border-radius: 12px;
  grid-column: span 2;
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

.stats-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  color: #161d25;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1.5px solid #c6c6c6;
}

.stats-table td {
  padding: 12px;
  border-bottom: 1.5px solid #c6c6c6;
  color: #151c23;
  font-size: 15px;
  border: 1px solid #ddd;
}

.stats-table tr:hover {
  background: #f3f4f8;
}

.button-container {
  display: flex;
  justify-content: center; /* 按钮居中 */
  gap: 10px; /* 按钮之间的间距 */
  margin-top: 20px; /* 调整与上方内容的间距 */
}

.button-container > * {
  flex: 1; /* 让按钮宽度均等 */
  max-width: 200px; /* 限制按钮最大宽度 */
  text-align: center;
}
/* 
字幕的样式
.subtitle {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  text-align: center;
  font-size: 16px;
  white-space: pre-wrap;
  word-wrap: break-word;
  z-index: 10;

*/
/* 新增：聊天部分样式 */
.chat-controls {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.chat-controls label {
  margin-right: 10px;
}

.receiver-select {
  margin-right: 10px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.send-file-bitton {
  background-color: #1a73e8;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.send-file-bitton:hover {
  background-color: #3d85c6;
}

/* 下载按钮样式 */
.download-button {
  background-color: #4CAF50;
  /* 绿色 */
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.download-button:hover {
  background-color: #367c39;
}

/*新增: 调整录音指示器的位置和样式*/
.recording-indicator {
  /* display: inline-block; */
  margin-left: 5px;
  /*vertical-align: middle; */
}

.recording-indicator .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: red;
  animation: blink 1s infinite;
  margin: 0 2px;
}

/* 字幕为空时的提示, 可以选择显示或移除 */
 .subtitle-placeholder {
    position: absolute;
    bottom: 70px;
     left: 0;
    right: 0;
    /* left: 50%; */
   /* transform: translateX(-50%); */
    color: #999;
    font-size: 14px;
     text-align: center
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    opacity: 1;
  }
}
/* 上传进度样式 */
.upload-progress {
  padding: 10px;
  background-color: #f0f0f0;
  border-top: 1px solid #ddd;
}

.meeting-container {
  position: relative;  /* 确保子元素定位基准 */
  height: 100vh;
}

.transcription-float {
  position: absolute;
  bottom: 80px;    /* 根据原有布局调整 */
  right: 30px;
  z-index: 88;   /* 确保覆盖其他元素 */
  width: 300px;    /* 根据需要调整 */
}

.video-call-container {
  position: absolute; /*  重要 */
  width: 100%;
  background-color: white;
  border: 1px solid #ccc;
  z-index: 100;      /*  重要, 比其他页面高, 但比 Header, AIFloatingChat 低 */
  overflow: hidden;          /* 确保内容不会溢出 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  min-width: 300px;
  min-height: 200px;
  transition: all 0.3s ease; /* 平滑过渡 */
}

/* 关闭按钮样式 */
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  z-index: 1001; /* 确保在最上层 */
}

/*  自定义的 MessageBox 样式 (可选, 根据需要调整) */
.close-videocall-confirm {
    border-radius: 8px; /* 圆角 */
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);  /* 阴影 */
    font-family: 'Helvetica Neue', Arial, sans-serif;
}

.close-videocall-confirm .el-message-box__header {
  background-color: #f0f4f8; /* 头部背景色 */
  padding: 15px 15px 10px;
}

.close-videocall-confirm .el-message-box__title {
    font-weight: 500;      /* 标题加粗 */
    color: #303133;       /* 标题颜色 */
}

.close-videocall-confirm .el-message-box__content{
    padding: 10px 15px;
    color: #606266;  /* 文本颜色 */
    font-size: 14px;
}

/* 确认按钮 */
.close-videocall-confirm .confirm-button {
  background-color: #409eff;  /* 主题色 */
  border-color: #409eff;
  color: #fff;
  padding: 10px 20px;
  border-radius: 4px;
}

.close-videocall-confirm .confirm-button:hover {
    background-color: #66b1ff; /* 悬停颜色 */
    border-color: #66b1ff;
}

/* 取消按钮 */
.close-videocall-confirm .cancel-button {
    background-color: #fff;
    border-color: #dcdfe6;
    color: #606266;
    padding: 10px 20px;
}

.close-videocall-confirm .cancel-button:hover{
  background-color: #f5f7fa; /* 悬停颜色 */
  border-color: #c6cbd1;
}

/* 最小化时的样式 */
.video-call-container.minimized {
  top: 90px; 
  left: 20px;  
  bottom: auto; 
  right: auto;  
  width: 320px; /* 缩小后的宽度 */
  height: 180px; /* 缩小后的高度 */
  border-radius: 8px;  /* 圆角 */
}
/* 当 isMaximized 为 true 时的样式 */
.video-call-container.maximized {
    top: 0;  /* 或者你希望的值 */
    left: 0;
    width: 100%;
    height: 100%; ; /* 根据你的页头高度调整 */
    border-radius: 0; /* 取消圆角 */
}
/* 响应式设计 (根据需要添加更多断点) */
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
  .controls {
        flex-wrap: wrap; /* 使按钮在空间不足时换行 */
        justify-content: center; /* 按钮左对齐 */
        padding: 5px; /* 减少内边距 */
        gap: 20px; /* 减少按钮间距 */
    }
  .controls button {
        padding: 10px 12px; /* 调整按钮内边距 */
        font-size: 12px; /* 减小字体大小 */
        width: 40px; /* 根据需求调整宽度 */
        height: 40px; /* 根据需求调整高度 */
    }
  .controls button img {
    width: 16px; /* 减小图标宽度 */
    height: 16px; /* 减小图标高度 */
    vertical-align: middle; /* 使图标在按钮中垂直居中 */
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

  /* 响应式布局调整 */
  .meeting-content {
    flex-direction: column;
  }

  .chat-container {
    max-width: none;
    /* 移除最大宽度限制 */
    border-left: none;
    /*移除边框*/
  }

  .chat-controls {
    flex-wrap: wrap;
    padding: 8px;
  }

  .chat-controls label {
    margin-bottom: 5px;
  }

  .receiver-select {
    margin-bottom: 5px;
    width: 100%;
  }

  .send-file-bitton {
    width: 100%;
    margin-top: 5px;
  }

  .download-button {
    width: 100%;
    margin-left: 0;
    margin-top: 5px;
  }

  .recording-indicator {
    margin-top: 5px;
  }
  .service-quality-overlay {
    width: 90%;
  }
  
  .service-quality-content {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    grid-column: span 1;
    height: 200px;
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
  .chat-controls {
    padding: 6px;
  }

  .chat-controls label {
    font-size: 14px;
  }

  .receiver-select {
    padding: 4px 6px;
  }

  .send-file-bitton {
    padding: 4px 8px;
    font-size: 14px;
  }

  .download-button {
    padding: 4px 8px;
    font-size: 14px;
  }

  .recording-indicator .dot {
    width: 5px;
    height: 5px;
  }
}

</style>
