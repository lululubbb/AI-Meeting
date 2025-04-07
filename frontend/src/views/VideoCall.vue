<!-- videocall.vue -->
<template>
  <div
    class="video-call-container"
    :class="{ maximized: isMaximized, minimized: !isMaximized }"
  >
    <el-tooltip v-if="!isMaximized" content="返回会议" placement="top">
      <button class="return-icon-button" @click="returnToMeeting">
        <svg
          t="1741349201621"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="3610"
        >
          <path
            d="M432.16 251.72l5.11 0.32c20.08 2.51 35.61 19.64 35.61 40.4 0 20.44-15.07 37.37-34.7 40.28l-6.02 0.44-41.44-0.06 130.11 130.15 3.64 4.17c12.15 15.96 10.93 38.84-3.64 53.41-14.31 14.31-36.63 15.74-52.54 4.29l-5.05-4.29L333.1 390.72l0.06 41.44-0.32 5.11c-2.51 20.08-19.64 35.61-40.4 35.61-20.44 0-37.37-15.07-40.28-34.7l-0.44-6.02V292.44l0.32-5.11 0.02-0.19c0.12-0.86 0.25-1.67 0.41-2.49 0.25-1.34 0.58-2.67 0.98-3.97 0.15-0.49 0.31-0.98 0.47-1.46 0.39-1.13 0.82-2.23 1.29-3.3 1.15-2.53 2.34-4.61 3.69-6.57l1.6-2.22 3.15-3.48 0.89-0.87c0.29-0.28 0.57-0.53 0.86-0.78l1.11-0.95 0.99-0.79c0.42-0.33 0.81-0.62 1.2-0.9 1.6-1.12 2.85-1.9 4.15-2.62 0.47-0.26 0.92-0.5 1.37-0.72l2.2-1.01 1.99-0.79c0.69-0.25 1.34-0.47 2-0.67 0.02-0.01 0.07-0.02 0.11-0.04 0.87-0.27 1.72-0.49 2.57-0.69a41.44 41.44 0 0 1 9.36-1.08h139.71z m398.4-58.28H193.44v637.13h357.63l0.06-238.72c0-22.49 18.23-40.72 40.72-40.72l238.72-0.06-0.01-357.63z m0.8-81.44c44.54 0 80.64 36.1 80.64 80.64v638.72c0 41.75-31.73 76.09-72.39 80.22l-8.24 0.42H192.64C148.1 912 112 875.9 112 831.36V192.64c0-44.54 36.1-80.64 80.64-80.64h638.72z"
            p-id="3611"
            fill="#515151"
          ></path>
        </svg>
      </button>
    </el-tooltip>
    <main>
      <!-- 会议信息表单：仅在 autoJoin=false 时显示 -->
      <div id="action-flow" v-if="!autoJoin">
        <span class="closeBtn" @click="goHome">x</span>

        <h1>视频会议</h1>

        <!-- 创建/加入会议表单 -->
        <div v-if="mode === 'create'" class="input-group">
          <label for="sessionName">会议名称:</label>
          <input
            id="sessionName"
            v-model="config.sessionName"
            placeholder="请输入会议名称"
            @paste="handlePaste"
          />
        </div>
        <div v-if="mode === 'create'" class="input-group">
          <label for="userName">用户名:</label>
          <input id="userName" v-model="config.userName" @paste="handlePaste" />
        </div>
        <div v-if="mode === 'create'" class="input-group">
          <label for="sessionPasscode">会议密码 (可选):</label>
          <input
            id="sessionPasscode"
            v-model="config.sessionPasscode"
            placeholder="请输入会议密码(无密码请不输入任何字符)"
            @paste="handlePaste"
          />
        </div>
        <div v-if="mode === 'create'" class="input-group">
          <label for="sessionIntro">会议简介 (可选):</label>
          <input
            id="sessionIntro"
            v-model="config.sessionIntro"
            placeholder="请输入会议简介"
            @paste="handlePaste"
          />
        </div>
        <div v-if="mode === 'join'" class="input-group">
          <label for="sessionName">会议名称:</label>
          <input
            id="sessionName"
            v-model="config.sessionName"
            placeholder="请输入会议名称"
            @paste="handlePaste"
          />
        </div>
        <div v-if="mode === 'join'" class="input-group">
          <label for="userName">用户名:</label>
          <input id="userName" v-model="config.userName" @paste="handlePaste" />
        </div>
        <div v-if="mode === 'join'" class="input-group">
          <label for="sessionPasscode">会议密码 (可选):</label>
          <input
            id="sessionPasscode"
            v-model="config.sessionPasscode"
            placeholder="请输入会议密码(无密码请不输入任何字符)"
            @paste="handlePaste"
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

        <!-- 按钮容器，保证按钮水平排列 -->
        <div class="button-container">
          <CustomButton
            :text="mode === 'create' ? '切换到加入会议' : '切换到创建会议'"
            @click="toggleMode"
          ></CustomButton>
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
              <video-player-container
                v-for="user in users"
                :key="user.userId"
                :id="`user-${user.userId}`"
                class="participant-tile"
              >
                <!--  占位符 -->
                <div v-show="!user.hasVideo.final" class="placeholder">
                  {{ user.userName || user.userIdentity || "Loading..." }}
                </div>
                <!-- Zoom SDK 会在这里添加 <video-player>，不要手动创建 -->
                <div class="username-label">{{ user.userName }}</div>
              </video-player-container>
            </div>

            <!-- 演讲者/共享 大区域 -->
            <video-player-container class="speaker-area">
              <!-- 当没有人共享时，显示提示 -->
              <div v-if="!someoneIsSharing" class="speaker-placeholder">
                <p>当前无人共享</p>
              </div>
            </video-player-container>

<!-- 改进后的字幕容器模板 -->
<div class="subtitle-container" v-if="isTranscribing">
  <transition-group name="subtitle-trans" tag="div" class="subtitle">
    <template v-for="(sub, userId) in subtitles" :key="userId">
      <div 
        class="subtitle-item" 
        v-if="sub.visible && sub.originalText"
      >
        <!-- 移动端优化：用户名和文本分开布局 -->
        <div class="subtitle-header">
          <span class="subtitle-user">{{ sub.userName }}</span>
          <span class="subtitle-time" v-if="false">{{ getCurrentTime() }}</span>
        </div>
        <div class="subtitle-content">
          <p class="subtitle-text">{{ sub.originalText }}</p>
          <p class="subtitle-translation" v-if="sub.translatedText">
            {{ sub.translatedText }}
          </p>
        </div>
      </div>
    </template>
    
    <!-- 空状态显示优化 -->
    <div 
      v-if="Object.keys(subtitles).length === 0 || !Object.values(subtitles).some(sub => sub.visible && sub.originalText)" 
      class="subtitle-placeholder"
      key="placeholder"
    >
      <span>等待发言...</span>
    </div>
  </transition-group>
</div>
            <!-- 底部控制栏 -->
            <div class="controls">
              <button 
    @click="showLanguageDropdown = !showLanguageDropdown" 
    :class="{ active: showLanguageDropdown }"
  >
    <img src="@/assets/transcription.png" alt="语言选择" />
  </button>
  
  <!-- 下拉菜单改为向上弹出 -->
  <div v-if="showLanguageDropdown" class="language-dropdown">
    <div
      v-for="lang in supportedLanguages"
      :key="lang.code"
      @click="selectLanguage(lang.code)"
      class="language-option"
      :class="{ active: targetLanguage === lang.code }"
    >
      {{ lang.name }}
    </div>
  </div>
  

<!-- Other buttons remain the same -->
<button @click="toggleTranscription" :class="{ active: isTranscribing }">
    <img v-if="isTranscribing" src="@/assets/字幕_on.png" alt="停止转录" />
    <img v-else src="@/assets/字幕_off.png" alt="开始转录" />
</button>
<button @click="toggleVideo" :class="{ active: isVideoOn }">
    <img v-if="isVideoOn" src="@/assets/video_on.png" alt="关闭视频" />
    <img v-else src="@/assets/video_off.png" alt="开启视频" />
</button>

              <button @click="toggleAudio" :class="{ active: !isAudioOn }">
                <img v-if="isAudioOn" src="@/assets/audio_on.png" alt="开启麦克风" />
                <img v-else src="@/assets/audio_off.png" alt="静音" />
              </button>
              <button @click="toggleScreenShare" :class="{ active: isSharing }">
                <img v-if="isSharing" src="@/assets/share_on.png" alt="停止共享屏幕" />
                <img v-else src="@/assets/share_off.png" alt="共享屏幕" />
              </button>
              <button
                v-if="isHost"
                @click="toggleScreenRecording"
                :class="{ active: isScreenRecording }"
              >
                <img
                  v-if="isScreenRecording"
                  src="@/assets/停止录制.png"
                  alt="停止录制"
                />
                <img v-else src="@/assets/开始录制.png" alt="开始录制" />
                <!-- <span>{{ isScreenRecording ? "停止录制屏幕" : "开始录制屏幕" }}</span> -->
              </button>
              <!-- 服务质量按钮 -->
              <button
                @click="toggleServiceQuality"
                :class="{ active: showServiceQuality }"
              >
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
                <span>{{ t("serviceQuality.title") }}</span>
                <button @click="toggleServiceQuality" class="close-quality">×</button>
              </div>
              <div class="service-quality-content">
                <!-- 只保留 ECharts 容器，不显示文字 -->
                <div id="networkChart" class="chart-container"></div>

                <!-- == 新增文字显示区: 显示实时统计信息 == -->
                <div class="stats-text">
                  <h3>{{ t("serviceQuality.realTimeStats") }}</h3>

                  <h4>{{ t("serviceQuality.videoEncode") }}</h4>
                  <table class="stats-table" v-if="statsData.videoEncode">
                    <tbody>
                      <tr>
                        <td>{{ t("serviceQuality.fps") }}:</td>
                        <td>{{ statsData.videoEncode.fps ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.bitrate") }}:</td>
                        <td>{{ statsData.videoEncode.bitrate ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.avgLoss") }}:</td>
                        <td>{{ statsData.videoEncode.avg_loss ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.rtt") }}:</td>
                        <td>{{ statsData.videoEncode.rtt ?? "--" }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4>{{ t("serviceQuality.videoDecode") }}</h4>
                  <table class="stats-table" v-if="statsData.videoDecode">
                    <tbody>
                      <tr>
                        <td>{{ t("serviceQuality.fps") }}:</td>
                        <td>{{ statsData.videoDecode.fps ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.bitrate") }}:</td>
                        <td>{{ statsData.videoDecode.bitrate ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.avgLoss") }}:</td>
                        <td>{{ statsData.videoDecode.avg_loss ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.rtt") }}:</td>
                        <td>{{ statsData.videoDecode.rtt ?? "--" }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4>{{ t("serviceQuality.audioEncode") }}</h4>
                  <table class="stats-table" v-if="statsData.audioEncode">
                    <tbody>
                      <tr>
                        <td>{{ t("serviceQuality.bitrate") }}:</td>
                        <td>{{ statsData.audioEncode.bitrate ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.avgLoss") }}:</td>
                        <td>{{ statsData.audioEncode.avg_loss ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.rtt") }}:</td>
                        <td>{{ statsData.audioEncode.rtt ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.sampleRate") }}:</td>
                        <td>{{ statsData.audioEncode.sample_rate ?? "--" }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4>{{ t("serviceQuality.audioDecode") }}</h4>
                  <table class="stats-table" v-if="statsData.audioDecode">
                    <tbody>
                      <tr>
                        <td>{{ t("serviceQuality.bitrate") }}:</td>
                        <td>{{ statsData.audioDecode.bitrate ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.avgLoss") }}:</td>
                        <td>{{ statsData.audioDecode.avg_loss ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.rtt") }}:</td>
                        <td>{{ statsData.audioDecode.rtt ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.sampleRate") }}:</td>
                        <td>{{ statsData.audioDecode.sample_rate ?? "--" }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4>{{ t("serviceQuality.shareEncode") }}</h4>
                  <table class="stats-table" v-if="statsData.shareEncode">
                    <tbody>
                      <tr>
                        <td>{{ t("serviceQuality.fps") }}:</td>
                        <td>{{ statsData.shareEncode.fps ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.bitrate") }}:</td>
                        <td>{{ statsData.shareEncode.bitrate ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.avgLoss") }}:</td>
                        <td>{{ statsData.shareEncode.avg_loss ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.widthHeight") }}:</td>
                        <td>
                          {{ statsData.shareEncode.width }} x
                          {{ statsData.shareEncode.height }}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <h4>{{ t("serviceQuality.shareDecode") }}</h4>
                  <table class="stats-table" v-if="statsData.shareDecode">
                    <tbody>
                      <tr>
                        <td>{{ t("serviceQuality.fps") }}:</td>
                        <td>{{ statsData.shareDecode.fps ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.bitrate") }}:</td>
                        <td>{{ statsData.shareDecode.bitrate ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.avgLoss") }}:</td>
                        <td>{{ statsData.shareDecode.avg_loss ?? "--" }}</td>
                      </tr>
                      <tr>
                        <td>{{ t("serviceQuality.widthHeight") }}:</td>
                        <td>
                          {{ statsData.shareDecode.width }} x
                          {{ statsData.shareDecode.height }}
                        </td>
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
            @update:selected-receiver-id="(newValue) => (selectedReceiverId = newValue)"
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

    <!-- 引入 AIFloatingChat 组件, 并传递参数 -->
    <AIFloatingChat
      ref="aiChat"
      :file-to-analyze="fileToAnalyze"
      :file-msg-id="fileMsgId"
    />
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  nextTick,
  computed,
  provide,
  watchEffect,
  inject,
} from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import FirestoreService from "../services/FirestoreService.js";
import ZoomVideoService, { VideoQuality } from "../services/ZoomVideoService.js";
import { showSnackBar } from "../utils/utils.js";
import AIFloatingChat from "../components/AIFloatingChat.vue"; // 导入组件
import ChatPanel from "../components/ChatContainer.vue";
import CustomButton from "../components/CustomButton.vue";
import * as echarts from "echarts";
import { useI18n } from "vue-i18n";
import defaultAvatar from "../assets/柴犬.png";
import { format } from "date-fns"; // 导入 date-fns 的 format函数
const { t } = useI18n();
// 翻译目标语言
const targetLanguage = ref('en'); // 默认为英语

// 支持的语言列表
const supportedLanguages = [
  { code: 'en', name: '英语' },
  { code: 'ko', name: '韩语' },
  { code: 'ru', name: '俄语' },
  { code: 'zh', name: '中文' }
];

import { ElMessage, ElMessageBox } from "element-plus";

/// Vuex / Router
const store = useStore();
const route = useRoute();
const router = useRouter();
const isMaximized = computed(() => store.state.isMaximized);
const users = computed(() => store.state.usersInMeeting);
// *关键*:  通过 provide 暴露 handleChatMessage 给子组件
provide("handleChatMessage", handleChatMessage);

// 录屏相关
// const isHost = ref(false);
const isScreenRecording = ref(false);
let screenRecorder = null;
let screenStream = null;
let socket = null; //  WebSocket 实例

const toggleScreenRecording = async () => {
  if (isScreenRecording.value) {
    stopScreenRecording();
  } else {
    await startScreenRecording();
  }
};

const startScreenRecording = async () => {
  try {
    // 1. 获取屏幕共享流 (限制为浏览器标签页)
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser", // 只录制当前浏览器标签页
        logicalSurface: true,
        cursor: "always",
      },
      audio: true,
      preferCurrentTab: true,
    });

    // 2. 创建 MediaRecorder
    screenRecorder = new MediaRecorder(screenStream, {
      mimeType: "video/webm;codecs=vp9,opus", // 推荐的 WebM 编码
    });

    // 3. 创建 WebSocket 连接
    socket = new WebSocket("ws://localhost:4000"); // 你的后端 WebSocket 地址
    socket.binaryType = "arraybuffer"; // 务必设置为 arraybuffer

    socket.onopen = () => {
      console.log("WebSocket 连接已建立");

      // 4. 数据处理: 通过 WebSocket 发送
      screenRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data); // 直接发送 Blob 数据
        }
      };

      // 5. 录制停止事件 (简化)
      screenRecorder.onstop = () => {
        ElMessage.success("屏幕录制已停止");
        isScreenRecording.value = false;
        // 不要在这里关闭 WebSocket, 在 stopScreenRecording 中关闭
      };

      // 6. 开始录制
      screenRecorder.start(1000); // 每 1000ms 触发一次 ondataavailable
      isScreenRecording.value = true;
      ElMessage.success("开始录制屏幕");
      // 监听 ended 事件
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenRecording(); //  自动停止录制
      };
    };

    socket.onerror = (error) => {
      console.error("WebSocket 错误:", error);
      ElMessage.error("WebSocket 连接错误");
      isScreenRecording.value = false; //  WebSocket 错误, 停止录制
    };

    // (可选) 可以在这里添加 socket.onclose 的处理, 但不是必须的
  } catch (error) {
    console.error("开始录制屏幕失败:", error);
    ElMessage.error("开始录制屏幕失败，请确保已授权屏幕共享,并且没有开启画中画");
    isScreenRecording.value = false;
    // 清理 screenStream
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      screenStream = null;
    }
  }
};

const stopScreenRecording = () => {
  // 1. 停止 MediaRecorder
  if (screenRecorder && screenRecorder.state !== "inactive") {
    screenRecorder.stop();
    console.log("录屏停止");
  }

  // 2. 停止并释放 screenStream
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenStream = null;
  }
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
    socket = null;
    console.log("WebSocket已关闭");
  }
  isScreenRecording.value = false; // 确保状态正确
};
const showLanguageDropdown = ref(false);

// 选择目标语言
const selectLanguage = (langCode) => {
  targetLanguage.value = langCode;
  showLanguageDropdown.value = false; // 选择后关闭下拉菜单
};

// 点击外部区域关闭下拉菜单
const closeLanguageDropdown = (event) => {
  const dropdown = document.querySelector('.language-selector');
  if (dropdown && !dropdown.contains(event.target)) {
    showLanguageDropdown.value = false;
  }
};

//  定义翻译函数
async function translateText(text, sourceLang, targetLang) {
  if (!text) return "";

  try {
    const response = await fetch("/api/translate", {
      //  调用后端的 /api/translate 接口
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translated; //  从后端返回的 JSON 数据中获取翻译结果
  } catch (error) {
    console.error("翻译请求失败:", error);
    return "Translation Failed";
  }
}
// *新增*: 用于强制刷新 users 计算属性
const usersRefreshKey = ref(0);
const goHome = () => {
  console.log("正在关闭会议...");
  store.commit("SET_VIDEOCALL_MAXIMIZED", true); // 设置为最大化
  store.commit("SET_VIDEOCALL_ACTIVE", false); // 显示
  router.push("/home");
};
// 使用 watchEffect 来响应 users 数组的变化
watchEffect(() => {
  for (const user of users.value) {
    if (user.hasVideo.final) {
      nextTick(() => {
        attachUserVideo(user.userId, VideoQuality.VIDEO_360P);
      });
    }
  }
});
onMounted(() => {
  checkRouteParams();
  checkClipboard(); // 打开页面时检查剪贴板
  window.addEventListener("paste", handlePaste);
  checkAndJoinFromConfig();
  isHost.value = ZoomVideoService.getIsHost(); // 从你的服务获取 isHost
  //checkRouteParams(); // 移除 checkRouteParams
  // 获取会议配置信息
  const savedConfig = store.getters.getMeetingConfig;
  if (savedConfig) {
    Object.assign(config, savedConfig); // 将保存的配置合并到 config
    mode.value = config.mode;
    role.value = mode.value === "create" ? 1 : 0;
    buttonText.value = mode.value === "create" ? "创建会议" : "加入会议";
  }
  ZoomVideoService.client.on("chat-file-download-progress", handleFileDownloadProgress);
});

onUnmounted(() => {
  window.removeEventListener("paste", handlePaste);
});

// 获取当前用户的邮箱
const getUserEmail = () => {
  const user = store.getters.getUser;
  console.log("当前用户ID:", user.uid);
  return user.email || "unknown@domain.com";
};

// 获取当前用户的名字
const getUserName = () => {
  const user = store.getters.getUser;
  console.log("当前用户名字:", user.name); // 调试信息
  return user.name || "user";
};
// 计算默认用户名
const defaultUserName = computed(() => {
  const user = store.state.user;
  return user.name || user.email || "请输入用户名";
});

//复制预约会议信息
const generateInvitationContent = () => {
  // const meetingInfo = `用户${config.userName}向您发来一个会议邀请~\n会议名称: ${config.sessionName}\n会议时间: ${new Date().toLocaleString()}\n会议密码:${config.sessionPasscode}\n复制该文本打开“慧议”系统点击“加入会议”可直接入会！`;
  // return meetingInfo;
  let content = `用户${config.userName} 向您发来一个会议邀请~\n会议名称: ${config.sessionName}`;

  // 仅当密码存在时才添加密码行
  if (config.sessionPasscode) {
    content += `\n会议密码: ${config.sessionPasscode}`;
  }

  content += "\n复制该文本打开“慧议”系统点击“加入会议”可直接入会！";
  return content;
};

const copyInvitationToClipboard = async () => {
  // 检查用户输入是否完整
  if (!config.userName || !config.sessionName) {
    ElMessage.warning("请填写完整的会议信息（用户名和会议名称）后再复制");
    return;
  }
  const invitationContent = generateInvitationContent();
  console.log("复制的内容:", invitationContent); // 调试日志
  try {
    await navigator.clipboard.writeText(invitationContent);
    ElMessage.success("会议邀请已复制到剪贴板");
  } catch (err) {
    ElMessage.error("复制失败，请手动复制");
  }
};

const parseInvitationContent = (text) => {
  console.log("开始解析", text);
  const userNameMatch = text.match(/用户(\S+)\s+向您发来一个会议邀请/);
  // const sessionNameMatch = text.match(/会议名称:\s*(.+)/);
  // const sessionPasscodeMatch = text.match(/会议密码:\s*(.*)/); // 修改正则表达式，允许匹配空字符串
  const sessionNameMatch = text.match(/会议名称:\s*([^\n]+)/);

  // 使用正向预查确保只匹配到换行符前
  const sessionPasscodeMatch = text.match(/会议密码:\s*([^\n]*)(?=\n|$)/);

  const result = {
    userName: userNameMatch ? userNameMatch[1].trim() : "",
    sessionName: sessionNameMatch ? sessionNameMatch[1].trim() : "",
    sessionPasscode: sessionPasscodeMatch ? sessionPasscodeMatch[1].trim() : "",
  };

  console.log("解析结果", result);
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
  // 先获取姓名，如果姓名为空则使用邮箱
  const name = getUserName();
  config.userName = name || getUserEmail();

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
        // 先获取姓名，如果姓名为空则使用邮箱
        const name = getUserName();
        config.userName = name || getUserEmail();
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
  videoSDKJWT: "",
  sessionName: "",
  userName: computed(() => {
    const user = store.state.user;
    return user.name || user.email || "请输入用户名";
  }).value,
  sessionPasscode: "",
  sessionIntro: "",
  expirationSeconds: 7200,
  meetingId: "", // 新增：用于 update
  hostId: "", // 新增：用于记录会议的 host
});
const mode = ref(route.query.mode || "join");
const role = ref(mode.value === "create" ? 1 : 0);
const buttonText = ref(mode.value === "create" ? "创建会议" : "加入会议");
const isJoining = ref(false);
const sessionJoined = ref(false);
const autoJoin = ref(false);
/** 切换模式 */
const toggleMode = () => {
  mode.value = mode.value === "create" ? "join" : "create";
  buttonText.value = mode.value === "create" ? "创建会议" : "加入会议";
  role.value = mode.value === "create" ? 1 : 0;
};
const closeVideoCall = () => {
  ElMessageBox.confirm(
    "确定要关闭视频通话吗？", // 提示文字
    "确认", // 标题
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning", // 图标类型
      // 自定义样式 (可选)
      customClass: "close-videocall-confirm", // 添加自定义类名
      center: true, // 居中显示
      closeOnClickModal: false, // 点击遮罩层不关闭
      closeOnPressEscape: false, // 按 ESC 键不关闭
      confirmButtonClass: "confirm-button", // 自定义确认按钮 class
      cancelButtonClass: "cancel-button", // 自定义取消按钮 class
    }
  )
    .then(() => {
      // 用户点击了“确定”
      store.commit("SET_VIDEOCALL_ACTIVE", false);
      store.commit("SET_VIDEOCALL_MAXIMIZED", true);
    })
    .catch(() => {
      // 用户点击了“取消”或关闭了对话框, 什么也不做
    });
};

const returnToMeeting = () => {
  store.commit("SET_VIDEOCALL_MAXIMIZED", true); // 设置为最大化
  store.commit("SET_VIDEOCALL_ACTIVE", true); // 显示 (这行可能不需要, 因为已经在最大化状态了)
};
// 预定会议使用的函数
async function checkAndJoinFromConfig() {
  const savedConfig = store.getters.getMeetingConfig;
  if (
    savedConfig &&
    savedConfig.sessionName &&
    savedConfig.userName &&
    savedConfig.videoSDKJWT
  ) {
    Object.assign(config, savedConfig);
    mode.value = config.mode;
    role.value = mode.value === "create" ? 1 : 0;
    buttonText.value = mode.value === "create" ? "创建会议" : "加入会议";
    autoJoin.value = true;
    await nextTick();
    await joinSession();
  }
}

// 视频渲染
// 视频渲染 (创建 <video-player> 元素, 交给 Zoom SDK 处理)
async function attachUserVideo(userId, videoQuality) {
  if (!ZoomVideoService.sessionJoined || !ZoomVideoService.stream) return;

  try {
    // 1. 获取容器
    const container = document.getElementById(`user-${userId}`);
    if (!container) {
      console.warn(`Container not found for user ${userId}`);
      return;
    }

    // 2. 清空容器内容
    container.innerHTML = "";

    // 3. 创建 <video-player> 元素, 并添加到 container 中
    const videoPlayer = document.createElement("video-player");
    videoPlayer.classList.add("video-element"); // 添加 CSS 类
    container.appendChild(videoPlayer);

    // 4. 调用 ZoomVideoService 去绑定视频流 (传入 userId, videoQuality 和 video-player的选择器)
    await ZoomVideoService.attachUserVideo(userId, videoQuality, ".video-element");
  } catch (error) {
    console.error("attachUserVideo error:", error);
  }
}

async function detachUserVideo(userId) {
  try {
    const container = document.getElementById(`user-${userId}`);
    if (container) {
      //  直接移除容器内的所有video-player元素
      container.innerHTML = ""; //更彻底地清空, 不依赖具体的 class name 或者 id
    }
    await ZoomVideoService.detachUserVideo(userId); //  不需要具体的 element
  } catch (error) {
    console.error("detachUserVideo error:", error);
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
    hostId, // 新增
    meetingId, // 新增
    sessionIntro,
  } = route.query;

  if (sessionName && userName && roleParam !== undefined && videoSDKJWT) {
    config.sessionName = sessionName;
    config.userName = userName;
    config.sessionPasscode = sessionPasscode || "";
    config.sessionIntro = sessionIntro || ""; // 新增
    config.expirationSeconds = expirationSeconds ? parseInt(expirationSeconds, 10) : 7200;
    role.value = parseInt(roleParam, 10);
    config.videoSDKJWT = videoSDKJWT;
    // 如果是加入会议，hostId 和 meetingId 也需要
    if (mode.value === "join") {
      if (!hostId || !meetingId) {
        console.error("加入会议缺少 hostId 或 meetingId");
        showSnackBar("加入会议链接不完整，请检查");
        router.push("/home");
        return;
      }
      config.hostId = hostId;
      config.meetingId = meetingId;
    }

    // 如果是创建会议，从路由参数中获取 meetingId 和 hostId
    if (mode.value === "create") {
      config.meetingId = meetingId; // 从路由参数中获取
      config.hostId = hostId; // 从路由参数中获取
    }
    autoJoin.value = true;
    await nextTick();
    await joinSession();
  }
}

/** 创建或加入会议 */
const handleSession = async () => {
  if (!config.sessionName || !config.userName) {
    showSnackBar("请填写会议名称和用户名");
    return;
  }
  if (mode.value === "create" && role.value !== 1) {
    showSnackBar("创建会议时角色必须为主持人");
    return;
  }
  const user = store.getters.getUser;
  try {
    isJoining.value = true;
    let jwt;
    let meetingId;

    // *修改*:  先设置 config.hostId (创建会议时)
    if (mode.value === "create" && user) {
      config.hostId = user.uid; //  创建会议, hostId 就是当前用户
    }

    // 统一逻辑: 无论是创建还是加入, 都先尝试创建 Firestore 文档
    if (user) {
      // mode.value 为 'create' 的时候，config.hostId 一定有值
      // mode.value 为 'join' 的时候, 如果路由中有 hostId, config.hostId 也有值
      // mode.value 为 'join' 的时候, 如果路由中没有 hostId, config.hostId 是空字符串 ''，config.hostId需要从ZoomVideoService中获取。
      meetingId = await FirestoreService.addToMeetingHistory(
        // 先创建文档，拿到 meetingId
        user.uid,
        config.sessionName, // 会议名称
        {
          status: "ongoing", // 初始状态
          //  hostId:  mode.value === 'create'? user.uid : config.hostId, // 如果是创建, hostId 就是当前用户; 如果是加入, hostId 来自路由
          hostId: config.hostId,
          hostName: config.userName,
          sessionPasscode: config.sessionPasscode,
          sessionIntro: config.sessionIntro,
          startTime: new Date(),
          // 其他字段...
        }
      );
      config.meetingId = meetingId; // 把 meetingId 存入 config
    }
    if (mode.value === "create") {
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
      console.error("无法获取有效 JWT");
      isJoining.value = false;
      return;
    }

    config.videoSDKJWT = jwt;
    autoJoin.value = true;
    await nextTick();
    await joinSession(); //  join 流程
  } catch (error) {
    console.error("handleSession error:", error);
    showSnackBar("加入/创建会议失败");
    isJoining.value = false;

    // 如果是创建会议，并且 Firestore 文档创建失败了，把刚刚创建的文档删除。
    if (mode.value === "create" && user && config.meetingId) {
      // 使用 mode.value
      try {
        await FirestoreService.deleteMeetingHistory(user.uid, config.meetingId);
      } catch (deleteError) {
        console.error("删除 Firestore 文档失败:", deleteError);
      }
    }
  }
};

/* *********************
会议初始化
   ********************* */
// 加入会议 (只负责加入逻辑, *不渲染* 远端视频)
const joinSession = async () => {
  try {
    const success = await ZoomVideoService.joinSession(config);
    if (!success) {
      isJoining.value = false;
      return; // 加入失败，直接返回
    }
    sessionJoined.value = true; // 标记会议已加入
    isJoining.value = false;
    // 检查是否支持多路视频, 放到后面
    if (!ZoomVideoService.stream.isSupportMultipleVideos()) {
      console.warn("当前环境不支持多路视频，只能渲染本地+1路远端");
    }

    checkIfHost(); // *务必* 先调用 checkIfHost, 设置好 config.hostId

    // 拿到当前用户, 并加入 users 列表
    const currentUser = ZoomVideoService.client.getCurrentUserInfo();
    store.dispatch("initializeUsersInMeeting", []); // 初始化为空数组
    if (currentUser && currentUser.userId) {
      currentUserId.value = currentUser.userId;
      // *关键*:  获取当前用户的头像
      const currentUserAvatar = store.state.user.avatarUrl || defaultAvatar;
      //------------------------------------------
      // 新增:  获取并存储 Zoom userId (在这里获取并存储)
      //------------------------------------------
      const zoomUserId = currentUser.userId; // Zoom 的 userId (数值类型)
      const firebaseUid = store.state.user.uid; // Firebase Auth uid (字符串)

      if (firebaseUid) {
        try {
          // **重要**: 调用 FirestoreService 的方法来更新/创建文档
          await FirestoreService.updateUserZoomId(firebaseUid, zoomUserId);
          console.log("已存储Zoom UserId", zoomUserId);
        } catch (error) {
          console.error("存储 Zoom userId 失败:", error);
        }
      }
      //------------------------------------------

      // 把当前用户加入 users 数组 (无论主持人还是参与者)
      const localUser = {
        // 立即创建本地用户对象
        userId: currentUser.userId,
        userName: currentUser.displayName,
        avatarUrl: currentUserAvatar, // *** 重要 *** 使用获取到的头像
        role: isHost.value ? "host" : "participant",
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
        isUpdated: false,
        hostId: config.hostId,
        uploads: 0,
        downloads: 0,
        messagesSent: 0,
      };
      users.value.push(localUser);
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
            allUsers.forEach((u) => {
              if (u.isHost) {
                config.hostId = u.userId.toString(); // 将数值类型转换为字符串类型
              }
            });
            console.warn("config.hostId 为空! 尝试从 allUser 中获取");
            //  可以添加更详细的错误处理, 例如给用户提示, 或者直接退出会议
          }
          try {
            await FirestoreService.addParticipantMeeting(
              user.uid, // 参与者自己的 ID
              config.hostId, // 主持人 ID
              config.meetingId, // 会议 ID (来自路由参数或 handleSession)
              new Date() // 加入时间
            );
          } catch (err) {
            console.error("添加参与者会议记录失败:", err);
            showSnackBar("添加参与者会议记录失败");
            // 可以考虑更完善的错误处理
          }
        }
      }
    }
    // 获取已加入会议的用户, 并加入 users 列表 (用于 UI 显示和统计)
    // 这部分用户信息不完整,  主要用于占位,  在 user-added 事件中会更新
    const allUsers = ZoomVideoService.client.getAllUser();
    const localId = currentUserId.value;
    // *关键修改*: 先获取已经在 users 数组中的用户 (主要是当前用户)
    const existingUserIds = new Set(users.value.map((u) => u.userId));

    allUsers.forEach((u) => {
      if (u.userId !== localId && !existingUserIds.has(u.userId)) {
        users.value.push({
          userId: u.userId,
          userName: u.displayName,
          avatarUrl: defaultAvatar,
          role: u.isHost ? "host" : "participant", // 设置角色
          joinTime: new Date(),
          leaveTime: null,
          hasVideo: {
            initial: u.bVideoOn, //  initial 和 final 都设置为正确的值
            final: u.bVideoOn,
            timeline: [{ time: Date.now(), value: u.bVideoOn }],
          },
          isAudioOn: {
            //新增
            initial: true, // 假设默认开启音频
            final: true,
            timeline: [{ time: Date.now(), value: true }],
          },
          isSharing: {
            //新增
            initial: u.sharerOn,
            final: u.sharerOn,
            timeline: [{ time: Date.now(), value: u.sharerOn }],
          },
          isUpdated: false, //新增
          hostId: config.hostId, // *重要*: 所有用户都记录 hostId
          uploads: 0, //新增
          downloads: 0, //新增
          messagesSent: 0, //新增
        });
        // *关键*:  dispatch action,  更新 Vuex 中的 usersInMeeting, user-added中会从firestore中获取信息
        store.dispatch("updateUserAvatarInMeeting", {
          userId: u.userId,
          avatarUrl: defaultAvatar,
        });
      }
    });

    // 订阅 SDK 事件
    subscribeEvents();
    // *关键*: 调用 initChat, 并传入 handleChatMessage
    await ZoomVideoService.initChat(handleChatMessage);
    // 初始化可聊天用户列表, 放到 initChat之后
    updateChatReceivers();

    // 订阅服务质量事件 (放到最后)
    subscribeServiceQuality();

    // *不要* 在这里调用 attachVideo 或 attachScreenShare!  让 watchEffect 自动处理.
  } catch (error) {
    console.error("joinSession error:", error);
    showSnackBar("加入会议失败");
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
  return users.value.some(
    (u) =>
      u.isSharing.timeline.length > 0 &&
      u.isSharing.timeline[u.isSharing.timeline.length - 1].value
  );
});

/** 切换本地视频 */
const toggleVideo = async () => {
  isVideoOn.value = !isVideoOn.value;
  await ZoomVideoService.toggleLocalVideo(isVideoOn.value);

  const localUser = users.value.find((u) => u.userId === currentUserId.value);
  if (localUser) {
    localUser.hasVideo.final = isVideoOn.value;
    localUser.hasVideo.timeline.push({ time: Date.now(), value: isVideoOn.value }); // 更新 timeline
  }
};

/** 切换本地音频 */
const toggleAudio = async () => {
  isAudioOn.value = !isAudioOn.value;
  await ZoomVideoService.toggleLocalAudio(isAudioOn.value);
  const localUser = users.value.find((u) => u.userId === currentUserId.value);
  if (localUser) {
    localUser.isAudioOn.final = isAudioOn.value;
    localUser.isAudioOn.timeline.push({ time: Date.now(), value: isAudioOn.value });
  }
};

/**
 * 切换“本地屏幕共享”开关
 * - 仅本地共享，远端共享由 SDK 事件管理
 */
const toggleScreenShare = async () => {
  // 检查是否有人正在共享屏幕
  if (someoneIsSharing.value && !isSharing.value) {
    ElMessageBox.confirm("当前有人正在共享屏幕，请等待其结束后再共享。", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    return;
  }
  if (isSharing.value) {
    // 已在共享 => 停止共享
    await ZoomVideoService.stopLocalScreenShare(); // 先停止
    isSharing.value = false;

    const localUser = users.value.find((u) => u.userId == currentUserId.value);
    if (localUser) {
      localUser.isSharing.final = false;
      localUser.isSharing.timeline.push({ time: Date.now(), value: false });
    }
  } else {
    // 开始本地共享
    const result = await ZoomVideoService.startLocalScreenShare();
    if (result) {
      isSharing.value = true;

      const localUser = users.value.find((u) => u.userId == currentUserId.value);
      if (localUser) {
        localUser.isSharing.final = true;
        localUser.isSharing.timeline.push({ time: Date.now(), value: true });
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
//  改回数组
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
    console.error("发送消息失败:", err);
    showSnackBar("发送消息失败");
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
      await ZoomVideoService.sendMessageToUser(text, selectedReceiverId.value, timestamp); // 传递时间戳
    }
    chatInput.value = "";
  } catch (err) {
    console.error("发送消息失败:", err);
    showSnackBar("发送消息失败");
  }
};

// 收到他人聊天消息
function handleChatMessage(payload) {
  const { message, sender, receiver, file, timestamp, id } = payload; //  timestamp, 增加 id

  // 1. 检查 msgId 是否已存在, 如果存在, 直接返回
  if (ZoomVideoService.isMessageAlreadyAdded(id)) {
    return;
  }
  // 2. 如果不存在, 添加到已处理列表
  ZoomVideoService.addMessageId(id);

  // 3. 获取头像 (修改部分)
  const getAvatar = () => {
    // 优先从 users 数组中查找 (本地+已加入的远端)
    const userInStore = users.value.find((u) => u.userId === sender.userId);
    console.log("在vuex中查找头像", userInStore);
    return userInStore?.avatarUrl || defaultAvatar;
  };
  console.log("Received chat message:", payload); // 打印整个 payload
  console.log("Message ID:", id);
  console.log("Sender AvatarUrl:", sender.avatar);
  //4. 打印调试信息
  console.log("[DEBUG] 收到消息:", {
    senderId: payload.sender.userId,
    senderAvatar: getAvatar(),
    currentUserId: store.state.user.uid, // 当前用户 ID
  });

  // 5. 构造消息对象, 添加到列表 (和之前一样)
  let messageObj;
  if (!file) {
    messageObj = {
      type: receiver.userId === "0" ? "group" : "private",
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
      type: receiver.userId === "0" ? "group" : "private",
      senderId: sender.userId,
      senderName: sender.name,
      receiverId: receiver.userId,
      message: null,
      avatar: getAvatar(),
      file: {
        name: file.name,
        size: file.size,
        fileUrl: file.fileUrl,
      },
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      fileDownloadProgress: 0,
      fileDownloadStatus: null,
      msgId: id,
    };
  }
  chatMessagesList.value.push(messageObj);
  scrollToBottom();
}

// 聊天历史
// 聊天历史
function handleChatHistory(history) {
  history.forEach((msg) => {
    if (!msg.file) {
      chatMessagesList.value.push({
        type: msg.receiver.userId === "0" ? "group" : "private",
        senderId: msg.sender.userId,
        senderName: msg.sender.name,
        receiverId: msg.receiver.userId,
        message: msg.message,
        avatar:
          store.state.usersInMeeting.find((u) => u.userId === msg.sender.userId)
            ?.avatarUrl || defaultAvatar, // *关键修改*: 移除 ?
        file: null,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(), // 使用传入的时间戳
      });
    } else {
      chatMessagesList.value.push({
        type: msg.receiver.userId === "0" ? "group" : "private",
        senderId: msg.sender.userId,
        senderName: msg.sender.name,
        receiverId: msg.receiver.userId,
        // *关键修改*: 移除 ?
        avatar:
          store.state.usersInMeeting.find((u) => u.userId === msg.sender.userId)
            ?.avatarUrl || defaultAvatar, // 从Vuex store中取
        message: null,
        file: {
          name: msg.file.name,
          size: msg.file.size,
          fileUrl: msg.file.fileUrl,
        },
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(), // 使用传入的时间戳
        fileDownloadProgress: msg.file.download?.progress || 0,
        fileDownloadStatus: msg.file.download?.status || null,
        msgId: msg.id,
      });
    }
  });
  scrollToBottom();
}

//  自己发送消息的回调,只负责添加消息到列表
function handleMessageSent(msg) {
  // 1. 添加 msgId, 防止重复处理
  ZoomVideoService.addMessageId(msg.id); // 重要!
  console.log("以下是handleMessageSent复用的handleChatMessage输出");
  // 2. 直接复用 handleChatMessage
  handleChatMessage(msg); // 复用
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
        msgId = await ZoomVideoService.sendFileToAll(file); //  await, 获取 msgId
      } else {
        msgId = await ZoomVideoService.sendFileToUser(file, selectedReceiverId.value); //  await, 获取 msgId
      }
      //  发送文件消息,很关键
      if (msgId) {
        const curUser = ZoomVideoService.client.getCurrentUserInfo();
        handleMessageSent({
          sender: {
            userId: curUser.userId,
            name: curUser.displayName,
            avatar: curUser.avatar || store.state.user.avatarUrl,
          },
          receiver: { userId: selectedReceiverId.value.toString() }, // 新增
          file: {
            name: file.name,
            size: file.size,
          },
          timestamp: Date.now(),
          id: msgId,
        });
      }
    } catch (err) {
      console.error("发送文件失败", err);
      showSnackBar("发送文件失败");
    }
  }
  e.target.value = ""; // 清空
}

/** 更新可聊天用户列表(供私聊选择) */
const updateChatReceivers = async () => {
  const receivers = ZoomVideoService.getChatReceivers();
  // 过滤掉 Everyone(ID:0)
  chatReceivers.value = receivers.filter(
    (receiver) => !(receiver.userId === "0" && receiver.displayName === "Everyone")
  );
  console.log("[updateChatReceivers]", receivers);
};

// 打开 AI 助手 (并传递文件)
const openAiAssistant = (msg) => {
  fileToAnalyze.value = msg.file;
  fileMsgId.value = msg.msgId; // 新增：保存 msgId
  console.log("fileToAnalyze:", fileToAnalyze.value); // 打印
  console.log("fileMsgId:", fileMsgId.value); // 打印
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
  const msgObj = chatMessagesList.value.find((m) => m.msgId === id);

  if (!msgObj) return; //  没找到, 直接返回

  // 更新进度
  msgObj.fileDownloadProgress = progress;

  switch (status) {
    case 1: // InProgress
      msgObj.fileDownloadStatus = "InProgress";
      break;
    case 2: // Success, *关键修改*
      msgObj.fileDownloadStatus = "Success";

      //  如果是 blob 下载, 且是当前分析的文件,  处理
      if (fileBlob && msgObj.msgId === fileMsgId.value) {
        const objUrl = URL.createObjectURL(fileBlob);
        const link = document.createElement("a");
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
  shareDecode: null,
});
//用数组去记录关键数值(用于折线图)
const uplinkData = ref([]); // 网络上行
const downlinkData = ref([]); // 网络下行

const videoEncodeFpsData = ref([]); // 视频发送FPS
const videoDecodeFpsData = ref([]); // 视频接收FPS

const audioEncodeLossData = ref([]); // 音频发送avg_loss
const audioDecodeLossData = ref([]); // 音频接收avg_loss

let networkChart = null; // ECharts实例

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
  const chartDom = document.getElementById("networkChart");
  if (!chartDom) return;

  if (!networkChart) {
    networkChart = echarts.init(chartDom);
  }

  // 初始option
  networkChart.setOption({
    // title: { text: '服务质量实时图表' },
    tooltip: { trigger: "axis" },
    legend: {
      data: [
        "NetworkUp",
        "NetworkDown",
        "VidEncFPS",
        "VidDecFPS",
        "AudEncLoss",
        "AudDecLoss",
      ],
    },
    xAxis: { type: "category", boundaryGap: false, data: [] },
    yAxis: {
      type: "value",
      min: 0,
    },
    series: [
      { name: "NetworkUp", type: "line", data: [], smooth: true, color: "#EE6666" },
      { name: "NetworkDown", type: "line", data: [], smooth: true, color: "#91CC75" },
      { name: "VidEncFPS", type: "line", data: [], smooth: true, color: "#FAC858" },
      { name: "VidDecFPS", type: "line", data: [], smooth: true, color: "#5470C6" },
      { name: "AudEncLoss", type: "line", data: [], smooth: true, color: "#73C0DE" },
      { name: "AudDecLoss", type: "line", data: [], smooth: true, color: "#3BA272" },
    ],
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
      { name: "NetworkUp", data: uplinkData.value },
      { name: "NetworkDown", data: downlinkData.value },
      { name: "VidEncFPS", data: videoEncodeFpsData.value },
      { name: "VidDecFPS", data: videoDecodeFpsData.value },
      { name: "AudEncLoss", data: audioEncodeLossData.value },
      { name: "AudDecLoss", data: audioDecodeLossData.value },
    ],
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
  client.on("network-quality-change", (payload) => {
    // console.log('[network-quality-change]', payload);
    pushNetwork(payload.uplink ?? 0, payload.downlink ?? 0);
  });

  // 2. video
  stream.subscribeVideoStatisticData({ encode: true, decode: true });
  client.on("video-statistic-data-change", (payload) => {
    // console.log('[video-statistic-data-change]', payload);
    const data = payload.data; // avg_loss, bitrate, encoding, fps, etc.
    if (!data) return;
    if (data.encoding) {
      //  encode 侧 更新图表
      pushVideoEncodeFps(data.fps ?? 0);
      // 同步存储最新数据
      statsData.videoEncode = data;
    } else {
      // decode 侧,只更新图表
      pushVideoDecodeFps(data.fps ?? 0);
      statsData.videoDecode = data;
    }
  });

  // 3. audio
  stream.subscribeAudioStatisticData({ encode: true, decode: true });
  client.on("audio-statistic-data-change", (payload) => {
    // console.log('[audio-statistic-data-change]', payload);
    const data = payload.data;
    if (!data) return;
    if (data.encoding) {
      // 音频编码, 只更新图表
      pushAudioEncodeLoss(data.avg_loss ?? 0);
      statsData.audioEncode = data;
    } else {
      // 音频解码,只更新图表
      pushAudioDecodeLoss(data.avg_loss ?? 0);
      statsData.audioDecode = data;
    }
  });

  // 4. share  ,只更新最新数据
  stream.subscribeShareStatisticData({ encode: true, decode: true });
  client.on("share-statistic-data-change", (payload) => {
    const data = payload.data;
    if (!data) return;
    if (data.encoding) {
      statsData.shareEncode = data;
    } else {
      statsData.shareDecode = data;
    }
  });
}

/* *********************
会议离开和结束
   ********************* */
const leaveSession = async () => {
  //普通用户离开会议
  try {
    // 离开会议, 更新 leaveTime
    const localUser = users.value.find((u) => u.userId === currentUserId.value);
    if (localUser) {
      localUser.leaveTime = new Date();
      localUser.hasVideo.final = isVideoOn.value; //  hasVideo
      localUser.hasVideo.timeline.push({ time: Date.now(), value: isVideoOn.value }); // 更新 timeline
      localUser.isAudioOn.final = isAudioOn.value; //新增
      localUser.isAudioOn.timeline.push({ time: Date.now(), value: isAudioOn.value });
      localUser.isSharing.final = isSharing.value; // 更新 isSharing
      localUser.isSharing.timeline.push({ time: Date.now(), value: isSharing.value }); // 更新 timeline
      localUser.isUpdated = true; //设置标志位
    }
    // 普通用户离开，不再更新会议记录
    await ZoomVideoService.leaveSession(false);
    resetState();
    // ElMessage.success("已退出会议");
    store.commit("SET_VIDEOCALL_ACTIVE", false);
    router.push("/home");
  } catch (error) {
    console.error("leaveSession error:", error);
    showSnackBar("退出会议失败");
  }
};
const endSession = async () => {
  //主持人结束会议
  if (!isHost.value) {
    showSnackBar("只有主持人可以结束会议");
    return;
  }
  try {
    // 结束会议前, 更新所有用户的 leaveTime (包括自己)
    const now = new Date();
    users.value.forEach((u) => {
      if (!u.leaveTime) {
        // 还没离开, 更新!
        u.leaveTime = now;
        //  对 u.hasVideo.timeline 进行空值检查
        if (u.hasVideo && u.hasVideo.timeline && u.hasVideo.timeline.length > 0) {
          u.hasVideo.final = u.hasVideo.timeline[u.hasVideo.timeline.length - 1].value;
        } else {
          u.hasVideo = {
            //  进行初始化
            initial: false,
            final: false,
            timeline: [],
          };
        }
        u.hasVideo.timeline.push({ time: now, value: u.hasVideo.final });

        // 对 u.isAudioOn.timeline 进行空值检查
        if (u.isAudioOn && u.isAudioOn.timeline && u.isAudioOn.timeline.length > 0) {
          u.isAudioOn.final = u.isAudioOn.timeline[u.isAudioOn.timeline.length - 1].value;
        } else {
          u.isAudioOn = {
            //  进行初始化
            initial: false,
            final: false,
            timeline: [],
          };
        }
        u.isAudioOn.timeline.push({ time: now, value: u.isAudioOn.final });

        //  对 u.isSharing.timeline 进行空值检查
        if (u.isSharing && u.isSharing.timeline && u.isSharing.timeline.length > 0) {
          u.isSharing.final = u.isSharing.timeline[u.isSharing.timeline.length - 1].value;
        } else {
          u.isSharing = {
            initial: false,
            final: false,
            timeline: [],
          };
        }
        u.isSharing.timeline.push({ time: now, value: u.isSharing.final });
      }
    });
    
    //在更新 Firestore 之前，过滤和检查数据,这部分过滤数据的代码可以考虑封装成一个函数
    const filteredUsers = users.value.map((user) => {
      const filteredUser = { ...user };
      // 确保 participant 对象中没有 undefined 值
      Object.keys(filteredUser).forEach((key) => {
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

    console.log("endSession - filteredUsers:", filteredUsers); //  检查
    console.log("endSession - filteredChatMessages:", filteredChatMessages); // 检查
    const user = store.getters.getUser; // 获取当前用户信息

    // 新增: 保存转录历史 (如果 isTranscribing.value 为 true)
    if (isTranscribing.value) {
      // 新增: 处理未完成的转录句子
      Object.keys(userTranscriptions).forEach(userId => {
        const userState = userTranscriptions[userId];
        
        // 如果当前有未完成的文本内容，将其作为完整句子保存
        if (userState.currentText && userState.currentText.trim().length > 0) {
          // 添加到完整句子列表中
          completedSentences.value.push({
            userId: userId,
            userName: userState.userName,
            text: userState.currentText,
            translatedText: subtitles.value[userId]?.translatedText || "",
            timestamp: new Date()
          });
          console.log(`添加未完成句子: ${userState.currentText}`);
        }
      });
      
      // 先停止转录 (重要!)
      stopTranscription(); 
      
      // 立即保存所有转录内容 (新增，确保立即保存)
      await saveTranscriptionsToFirebase();
      console.log("会议结束时立即保存转录内容，句子数:", completedSentences.value.length);
      
      // 确保保存所有已完成的句子
      const formattedTranscriptions = formatTranscriptionsForSaving(completedSentences.value);

      // 更新 Firestore
      if (user && config.meetingId) {
        await FirestoreService.updateMeetingHistory(user.uid, config.meetingId, {
          status: "finished",
          endTime: now,
          participants: filteredUsers,
          chatMessages: filteredChatMessages,
          transcriptionHistory: formattedTranscriptions, // 使用新的转录历史格式
        });
      }
    } else {
      // 添加 else 分支
      // 如果没有开启转录，仍然更新其他信息
      if (user && config.meetingId) {
        await FirestoreService.updateMeetingHistory(user.uid, config.meetingId, {
          status: "finished",
          endTime: now,
          participants: filteredUsers,
          chatMessages: filteredChatMessages,
          // transcriptionHistory 不需要, 因为没有开启
        });
      }
    }

    ZoomVideoService.leaveSession(true); //  结束会议, 放到后面
    resetState();
    ElMessage.success("会议已结束");
    store.commit("SET_VIDEOCALL_ACTIVE", false);
    router.push("/home");
  } catch (error) {
    console.error("endSession error:", error);
    showSnackBar("结束会议失败");
  }
};

// 格式化转录数据以便保存
function formatTranscriptionsForSaving(sentences) {
  return sentences.map(sentence => ({
    userId: sentence.userId,
    userName: sentence.userName,
    text: sentence.text,
    translatedText: sentence.translatedText,
    date: format(sentence.timestamp, 'yyyy-MM-dd'),
    time: format(sentence.timestamp, 'HH:mm:ss')
  }));
}


function resetState() {
  sessionJoined.value = false;
  autoJoin.value = false;
  users.value = [];
  chatMessagesList.value = [];
  // activeSpeaker.value = null;
  isSharing.value = false; //
  config.meetingId = ""; // 清空 meetingId
  config.hostId = ""; // 清空
}

/* *********************
转录方面
   ********************* */
// videocall.vue  <script setup> 部分
// 新增：转录历史记录
const transcriptionHistory = ref({});
// 新增：当前时间段 (用于标记当前正在记录的时间段)
let currentTimeslot = ref("");
// 新增：计算当前时间段的函数

// 辅助函数：获取当前日期 (YYYY-MM-DD 格式)
const getCurrentDate = () => {
  return format(new Date(), "yyyy-MM-dd");
};

// 新增：将转录数据添加到历史记录的函数
const addTranscriptionToHistory = (userId, userName, text, timestamp) => {
  const date = getCurrentDate(); // YYYY-MM-DD
  
  const time = format(timestamp, "HH:mm:ss"); // HH:mm:ss
  // 确保日期存在
  if (!transcriptionHistory.value[date]) {
    transcriptionHistory.value[date] = {};
  }

  // 确保时间段存在
  if (!transcriptionHistory.value[date][timeslot]) {
    transcriptionHistory.value[date][timeslot] = [];
  }

  transcriptionHistory.value[date][timeslot].push({
    userId,
    userName,
    time,
    text,
  });
};
const isTranscribing = ref(false);
const subtitles = ref({}); // 使用对象存储字幕, 键是 userId
const subtitle = ref(""); // (已弃用)
const subtitleTimers = ref({});
const transcriptionWs = ref(null); //  转录 WebSocket
let audioContext = null; //  全局的 AudioContext
let scriptNode = null; //  全局的 ScriptProcessorNode
let mediaStream = null; // 全局
const userTranscriptions = reactive({}); // 存储每个用户的转录状态
const completedSentences = ref([]); // 存储完整的句子缓存
const lastSaveTimestamp = ref(Date.now()); // 上次保存到Firebase的时间戳

const toggleTranscription = async () => {
  if (isTranscribing.value) {
    stopTranscription();
  } else {
    await startTranscription();
  }
};

// const startTranscription = async () => {
//   try {
//     // ... (之前的代码) ...
//     // 获取当前用户信息
//        const curUser = ZoomVideoService.client.getCurrentUserInfo();
//     if (!curUser || !curUser.userId) {
//       console.error("无法获取当前用户信息");
//       return;
//     }
//     // 6. 构建 WebSocket URL (带上 userId 和 userName)
//       if (!transcriptionWs.value || transcriptionWs.value.readyState !== WebSocket.OPEN) {
//         // 6. 构建 WebSocket URL, 带上 userId 和 userName 参数
//         const wsUrl = `ws://localhost:4399?userId=${curUser.userId}&userName=${encodeURIComponent(curUser.displayName)}`; // 替换你的 WebSocket 地址
//         transcriptionWs.value = new WebSocket(wsUrl);

//         transcriptionWs.value.onopen = () => {
//           console.log('[Client] 转录 WebSocket 连接已建立');
//           isTranscribing.value = true;
//           currentTimeslot.value = getCurrentTimeslot(); //  设置初始时间段

//         };

//         transcriptionWs.value.onmessage = (event) => {
//              const data = JSON.parse(event.data);
//           const now = new Date(); //  获取当前时间

//           //  更新 subtitles 对象
//           if (data.type === 'interim') {
//             //   有 userId, 更新到 subtitles 对象中
//             if (!subtitles.value[data.userId]) {
//               subtitles.value[data.userId] = { userName: data.userName, text: '' };
//             }
//             subtitles.value[data.userId].text = data.text; // 更新
//             addTranscriptionToHistory(data.userId, data.userName, data.text, now); //  添加
//           } else if (data.type === 'final') {
//             if (!subtitles.value[data.userId]) {
//               subtitles.value[data.userId] = { userName: data.userName, text: '' };
//             }
//             subtitles.value[data.userId].text = data.text;
//             addTranscriptionToHistory(data.userId, data.userName, data.text, now); // 添加
//           }
//         };

//         transcriptionWs.value.onerror = (error) => {
//           console.error('[Client] 转录 WebSocket 错误:', error);
//             ElMessage.error("转录服务出错")
//           isTranscribing.value = false;
//         };

//         transcriptionWs.value.onclose = () => {
//           console.log('[Client] 转录 WebSocket 连接已关闭');
//           isTranscribing.value = false;
//               subtitles.value = {}; // 清空
//         };
//       }
//   } catch (error) {
//     console.error('启动转录失败:', error);
//      ElMessage.error("启动转录失败,请检查麦克风权限")
//   }
// };

// 停止转录 (修改)
const startTranscription = async () => {
  try {
    // 1. 获取麦克风权限和音频流
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 2. 创建 AudioContext (如果尚未创建)
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 16000 });
      audioContext.onstatechange = () => {
        console.log("AudioContext state:", audioContext.state);
      };
    }
    // 3. 创建 MediaStreamSource
    const source = audioContext.createMediaStreamSource(mediaStream);

    // 4. 创建 ScriptProcessorNode (如果尚未创建)
    if (!scriptNode) {
      scriptNode = audioContext.createScriptProcessor(1024, 1, 1);
    }

    // 获取当前用户信息
    const curUser = ZoomVideoService.client.getCurrentUserInfo();
    if (!curUser || !curUser.userId) {
      console.error("无法获取当前用户信息");
      return;
    }

    // 初始化状态变量
    completedSentences.value = [];
    userTranscriptions[curUser.userId] = {
      currentText: "",
      lastText: "",
      lastUpdateTime: new Date(),
      userName: curUser.displayName
    };
    lastSaveTimestamp.value = Date.now();

    // 5. 建立 WebSocket 连接
    if (!transcriptionWs.value || transcriptionWs.value.readyState !== WebSocket.OPEN) {
      const wsUrl = `ws://localhost:4399?userId=${
        curUser.userId
      }&userName=${encodeURIComponent(curUser.displayName)}`;
      transcriptionWs.value = new WebSocket(wsUrl);

      transcriptionWs.value.onopen = () => {
        console.log("[Client] 转录 WebSocket 连接已建立");
        isTranscribing.value = true;

        // 6. 在 onopen 中设置 onaudioprocess
        scriptNode.onaudioprocess = (e) => {
          const pcmData = e.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(pcmData.length);

          // 转换为 16bit PCM
          for (let i = 0; i < pcmData.length; i++) {
            buffer[i] = pcmData[i] * 32767;
          }

          // 检查 WebSocket 状态
          if (
            transcriptionWs.value &&
            transcriptionWs.value.readyState === WebSocket.OPEN
          ) {
            transcriptionWs.value.send(buffer.buffer);
          } else {
            console.warn("[Client] WebSocket 未准备好，无法发送音频数据");
          }
        };
        // 连接节点
        source.connect(scriptNode);
        scriptNode.connect(audioContext.destination);
      };

      transcriptionWs.value.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const now = new Date();

  // 初始化用户的转录状态（如果不存在）
  if (!userTranscriptions[data.userId]) {
    userTranscriptions[data.userId] = {
      currentText: "",
      lastText: "",
      lastUpdateTime: now,
      userName: data.userName
    };
  }

  // 获取当前用户状态
  const userState = userTranscriptions[data.userId];
  
  // 检查句子是否结束的逻辑
  const isSentenceComplete = 
    // 1. 文本变短了，说明是新句子开始
    (data.text.length < userState.currentText.length) ||
    // 2. 文本超过2秒没有变化，且不为空
    (userState.currentText.length > 0 && 
     now - userState.lastUpdateTime > 2000 && 
     data.text === userState.currentText);
  
  // 如果句子完成，缓存它
  if (isSentenceComplete && userState.currentText.trim() !== "") {
    // 缓存完整句子
    completedSentences.value.push({
      userId: data.userId,
      userName: data.userName,
      text: userState.currentText,
      translatedText: subtitles.value[data.userId]?.translatedText || "",
      timestamp: now
    });
    
    // 重置当前句子
    userState.lastText = userState.currentText;
    userState.currentText = data.text.length < userState.currentText.length ? data.text : "";
  } else {
    // 更新当前文本
    userState.currentText = data.text;
  }
  
  // 更新最后更新时间
  userState.lastUpdateTime = now;
  
  // 使用Vue的响应式API安全地更新subtitles对象
  if (!subtitles.value[data.userId]) {
    // 如果不存在这个用户的字幕，添加一个新的空对象
    const newSubtitle = {
      userName: data.userName,
      originalText: data.text, 
      translatedText: "",
      visible: true
    };
    
    // 使用Vue的响应式API安全地更新
    subtitles.value = { 
      ...subtitles.value, 
      [data.userId]: newSubtitle 
    };
  } else {
    // 如果已存在，直接更新属性
    const updatedSubtitles = { ...subtitles.value };
    updatedSubtitles[data.userId] = {
      ...updatedSubtitles[data.userId],
      originalText: data.text,
      visible: true
    };
    subtitles.value = updatedSubtitles;
  }

  // 清除之前的计时器
  if (subtitleTimers.value[data.userId]) {
    clearTimeout(subtitleTimers.value[data.userId]);
  }

  // 设置新的计时器：1.5秒后隐藏此用户的字幕
  const timerId = setTimeout(() => {
    if (subtitles.value[data.userId]) {
      const updatedSubtitles = { ...subtitles.value };
      updatedSubtitles[data.userId] = {
        ...updatedSubtitles[data.userId],
        visible: false
      };
      subtitles.value = updatedSubtitles;
    }
  }, 1500);
  
  // 保存计时器ID到响应式对象
  const updatedTimers = { ...subtitleTimers.value };
  updatedTimers[data.userId] = timerId;
  subtitleTimers.value = updatedTimers;

  // 调用翻译函数
  translateText(data.text, "zh", targetLanguage.value)
    .then((translated) => {
      // 翻译成功，安全地更新翻译结果
      if (subtitles.value[data.userId]) {
        const updatedSubtitles = { ...subtitles.value };
        updatedSubtitles[data.userId] = {
          ...updatedSubtitles[data.userId],
          translatedText: translated
        };
        subtitles.value = updatedSubtitles;
      }
      
      // 如果这是最近添加到completedSentences的句子，更新其译文
      const lastSentenceIndex = completedSentences.value.findIndex(
        s => s.userId === data.userId && s.text === userState.lastText
      );
      if (lastSentenceIndex !== -1) {
        const updatedSentences = [...completedSentences.value];
        updatedSentences[lastSentenceIndex] = {
          ...updatedSentences[lastSentenceIndex],
          translatedText: translated
        };
        completedSentences.value = updatedSentences;
      }
    })
    .catch((err) => {
      console.error("翻译失败:", err);
    });
          
  // 定期保存到Firebase (每20秒一次)
  const currentTime = Date.now();
  if (currentTime - lastSaveTimestamp.value > 20000) {
    saveTranscriptionsToFirebase();
    lastSaveTimestamp.value = currentTime;
  }
};

      transcriptionWs.value.onerror = (error) => {
        console.error("[Client] 转录 WebSocket 错误:", error);
        ElMessage.error("转录服务出错");
        isTranscribing.value = false;
      };

      transcriptionWs.value.onclose = () => {
        console.log("[Client] 转录 WebSocket 连接已关闭");
        isTranscribing.value = false;
        subtitles.value = {};
      };
    }
  } catch (error) {
    console.error("启动转录失败:", error);
    ElMessage.error("启动转录失败,请检查麦克风权限");
  }
};

// 停止转录函数
const stopTranscription = () => {
  // 保存最后的转录内容
  saveTranscriptionsToFirebase();
  
  // 清除所有字幕计时器
  Object.values(subtitleTimers.value).forEach(timer => {
    clearTimeout(timer);
  });
  subtitleTimers.value = {}; // 重置计时器对象
  
  // 1. 关闭 WebSocket 连接 (如果存在)
  if (
    transcriptionWs.value &&
    (transcriptionWs.value.readyState === WebSocket.OPEN ||
     transcriptionWs.value.readyState === WebSocket.CONNECTING)
  ) {
    transcriptionWs.value.close();
  }
  transcriptionWs.value = null;

  // 2. 停止麦克风 (如果已开启)
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  // 3. 停止 ScriptProcessorNode (如果已创建), 防止内存泄漏
  if (scriptNode) {
    scriptNode.disconnect();
    scriptNode = null;
  }

  // 4. 重置字幕相关状态
  isTranscribing.value = false;
  subtitles.value = {}; // 清空字幕
};

// 在组件销毁前清理计时器
onBeforeUnmount(() => {
  // 清除所有字幕计时器
  Object.values(subtitleTimers.value).forEach(timer => {
    clearTimeout(timer);
  });
  subtitleTimers.value = {};
});

// 保存到Firebase的函数
// 保存到Firebase的函数
// 保存到Firebase的函数 - 改进版
// 保存到Firebase的函数 - 改进版
// 保存到Firebase的函数 - 改进版
async function saveTranscriptionsToFirebase() {
  if (completedSentences.value.length === 0) return;
  
  try {
    const user = store.getters.getUser; // 获取当前用户信息
    const meetingId = config.meetingId;
    
    // 确定正确的用户ID - 这是关键修改
    const correctUserId = isHost.value ? user.uid : config.hostId;
    
    if (!correctUserId || !meetingId) {
      console.error('保存转录历史记录失败: 用户ID或会议ID为空', {
        correctUserId,
        meetingId
      });
      return;
    }
    
    // 格式化转录数据
    const formattedTranscriptions = completedSentences.value.map(sentence => ({
      userId: sentence.userId,
      userName: sentence.userName,
      text: sentence.text,
      translatedText: sentence.translatedText || "",
      date: format(sentence.timestamp, 'yyyy-MM-dd'),
      time: format(sentence.timestamp, 'HH:mm:ss')
    }));
    
    // 检查文档是否存在
    console.log(`尝试更新会议记录，用户ID: ${correctUserId}, 会议ID: ${meetingId}`);
    
    // 保存到 Firebase
    await FirestoreService.updateMeetingHistory(
      correctUserId, 
      meetingId, 
      { transcriptionHistory: formattedTranscriptions }
    );
    
    console.log(`转录历史记录已保存到Firebase，共 ${formattedTranscriptions.length} 条`);
  } catch (error) {
    console.error("保存转录历史记录失败:", error);
  }
}

onUnmounted(() => {
  // ... 其他清理
  stopTranscription(); //
  //stopRecording();
  ZoomVideoService.client.off("chat-file-download-progress", handleFileDownloadProgress);
});

// stopRecording();
ZoomVideoService.client.off("chat-file-download-progress", handleFileDownloadProgress);

/* *********************
SDK事件订阅
   ********************* */
function subscribeEvents() {
  const client = ZoomVideoService.client;

  // user-added 事件 (只添加/更新用户数据, 不渲染)
  client.on("user-added", async (userList) => {
    if (!Array.isArray(userList)) return;

    for (const user of userList) {
      // 防止重复添加
      if (!users.value.find((u) => u.userId === user.userId)) {
        console.log("[user-added] =>", user);
        // *关键修改*: 从 Firestore 获取用户信息 (包括头像)
        let avatarUrl = defaultAvatar; // 默认头像
        try {
          const userInfo = await FirestoreService.getUserInfo(user.userId); // 使用 Zoom 的 userId
          avatarUrl = userInfo?.avatarUrl || defaultAvatar; // 如果有, 用 Firestore 的; 否则用默认头像
        } catch (error) {
          console.error("获取用户信息失败 (user-added):", error);
        }
        // *关键修改*:  在获取到 avatarUrl 之后,  再创建 newUser 对象
        const newUser = {
          userId: user.userId, // *** 重要 *** Zoom 的 userId (数值)
          userName: user.displayName,
          role: user.isHost ? "host" : "participant",
          joinTime: new Date(),
          leaveTime: null,
          avatarUrl: avatarUrl, //  *关键*:  使用获取到的头像 URL
          hasVideo: {
            initial: user.bVideoOn,
            final: user.bVideoOn,
            timeline: [{ time: Date.now(), value: user.bVideoOn }],
          },
          isAudioOn: {
            initial: true, // 假设默认开启音频
            final: true,
            timeline: [{ time: Date.now(), value: true }],
          },
          isSharing: {
            initial: user.sharerOn,
            final: user.sharerOn,
            timeline: [{ time: Date.now(), value: user.sharerOn }],
          },
          messagesSent: 0,
          hostId: config.hostId, // *重要*: 所有用户都记录 hostId, 方便后续查询
          uploads: 0, //
          downloads: 0, //
        };
        // *关键*: 更新 store.state.usersInMeeting.  在添加到 users 之后执行。
        if (!users.value.find((u) => u.userId === newUser.userId)) {
          users.value.push(newUser); // *必须* 在 dispatch 之前添加.  因为 dispatch 会触发视图更新, 那时 users 必须已经是最新的
          // *关键*:  dispatch action,  更新 Vuex 中的 usersInMeeting, user-added中会从firestore中获取信息
          store.dispatch("updateUserAvatarInMeeting", {
            userId: user.userId,
            avatarUrl: avatarUrl,
          });
        }
        const zoomUserId = user.userId;
        const firebaseUid = store.state.user.uid;
        // 只处理当前登录用户的信息,其他用户不用处理，只用获取头像即可
        if (zoomUserId == currentUserId.value) {
          if (firebaseUid) {
            try {
              await FirestoreService.updateUserZoomId(firebaseUid, zoomUserId);
            } catch (error) {
              console.error("存储 Zoom userId 失败 (user-added):", error);
            }
          }
        }
        if (isHost.value) {
          const loginUser = store.getters.getUser;
          if (loginUser && config.meetingId) {
            try {
              // 过滤 undefined, *包括* timeline 数组中的 undefined
              const filteredUsers = users.value.map((userData) => {
                const filteredUser = { ...userData }; //  浅拷贝

                // 深度过滤
                function deepFilter(obj) {
                  for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                      if (obj[key] === undefined) {
                        delete obj[key]; // 删除 undefined 属性
                      } else if (Array.isArray(obj[key])) {
                        // 过滤数组中的 undefined 元素
                        obj[key] = obj[key].filter((item) => item !== undefined);
                        // 如果数组是 timeline, 进一步检查
                        if (key === "timeline") {
                          obj[key] = obj[key].filter((item) => {
                            return (
                              item !== null &&
                              typeof item === "object" &&
                              Object.values(item).every((val) => val !== undefined)
                            );
                          });
                        }
                      } else if (typeof obj[key] === "object" && obj[key] !== null) {
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
              console.error("更新会议信息失败 (user-added, host):", err);
            }
          }
        }
      }
    }
  });

  client.on("user-removed", async (userList) => {
    if (!Array.isArray(userList)) return;
    for (const user of userList) {
      console.log("[user-removed]", user.userId);
      const userIndex = users.value.findIndex((u) => u.userId === user.userId);
      if (userIndex !== -1) {
        const userObj = users.value[userIndex];
        userObj.leaveTime = new Date();
        if (user.userId === currentUserId.value) {
          const loginUser = store.getters.getUser;
          if (loginUser && config.meetingId && !userObj.isUpdated) {
            try {
              const updatedData = {
                leaveTime: new Date(),
                hasVideo: {
                  final:
                    userObj.hasVideo.timeline[userObj.hasVideo.timeline.length - 1].value,
                  timeline: userObj.hasVideo.timeline,
                },
                isAudioOn: {
                  final:
                    userObj.isAudioOn.timeline[userObj.isAudioOn.timeline.length - 1]
                      .value,
                  timeline: userObj.isAudioOn.timeline,
                },
                isSharing: {
                  final:
                    userObj.isSharing.timeline[userObj.isSharing.timeline.length - 1]
                      .value,
                  timeline: userObj.isSharing.timeline,
                },
              };

              await FirestoreService.updateMeetingHistory(
                loginUser.uid,
                config.meetingId,
                updatedData
              );
              userObj.isUpdated = true;
            } catch (err) {
              console.error("更新会议信息失败 (user-removed, self):", err);
            }
          }
        }
        users.value.splice(userIndex, 1); // 从 users 数组中移除
      }
    }
  });

  client.on("peer-video-state-change", async ({ action, userId }) => {
    console.log("[peer-video-state-change]", action, " user=", userId);
    const userObj = users.value.find((u) => u.userId === userId);
    if (!userObj) return;
    const now = Date.now();
    if (action === "Start") {
      userObj.hasVideo.final = true; //  更新状态
      userObj.hasVideo.timeline.push({ time: now, value: true }); // 更新时间线
      // 在这里 *不要* 调用 attach, watchEffect 会处理。
      //重点！：只更新数据, 不执行DOM操作
    } else if (action === "Stop") {
      userObj.hasVideo.final = false; //  更新状态
      userObj.hasVideo.timeline.push({ time: now, value: false }); // 更新时间线
      // 在这里调用 detachUserVideo
      detachUserVideo(userId);
    }
  });

  /**
   * 当有人开始共享/停止共享
   * - 若是自己，不调用 attachScreenShare
   * - 若是他人，则调用 attachScreenShare
   */
  client.on("active-share-change", async ({ state, userId }) => {
    console.log("[active-share-change]", state, " user=", userId);
    const userObj = users.value.find((u) => u.userId === userId);
    if (!userObj) return;
    const now = Date.now();

    if (state === "Active") {
      userObj.isSharing.final = true;
      userObj.isSharing.timeline.push({ time: now, value: true }); // 更新时间线

      //  强制关闭服务质量窗口:
      forceCloseServiceQuality();

      // 如果是别人共享 => 渲染远端共享
      if (userId !== currentUserId.value) {
        await ZoomVideoService.attachScreenShare(userId);
      }
    } else if (state === "Inactive") {
      userObj.isSharing.final = false;
      userObj.isSharing.timeline.push({ time: now, value: false }); // 更新时间线
      ZoomVideoService.detachScreenShare(userId);
    }
  });

  client.on("video-active-change", (payload) => {
    const { state, userId } = payload;
    console.log("[video-active-change]", state, " user=", userId);
  });

  client.on("connection-change", (payload) => {
    const { state, reason } = payload;
    console.log("[connection-change]", state, reason);
    if (state === "Closed") {
      // ElMessage.info(`会议连接已关闭`);
      leaveSession();
    } else if (state === "Reconnecting") {
      ElMessage.info("正在重新连接...");
    } else if (state === "Connected") {
      ElMessage.info("已重新连接");
    } else if (state === "Fail") {
      ElMessage.info("连接失败");
      leaveSession();
    }
  });

  client.on("device-change", () => {
    console.log("device changed:", ZoomVideoService.stream?.getCameraList() || []);
  });

  client.on("session-closed", async () => {
    // 改为 async 函数
    ElMessage.info("会议已结束");
    //  stopRecording();  //  *不要*在这里停止录音
    // 直接更新状态为 finished
    const user = store.getters.getUser;
    if (user && config.meetingId) {
      // 如果是主持人主动结束,已经在 endSession() 里更新, 这里主要是处理因为其他原因导致的 session-closed (例如网络问题)
      // 因此,最好先尝试读取 Firestore 的数据,防止覆盖 endSession() 的更新.

      try {
        const existingMeeting = await FirestoreService.getMeetingHistory(
          config.hostId,
          config.meetingId
        );
        if (existingMeeting && existingMeeting.status !== "finished") {
          // 如果还不是 finished, 才更新
          await FirestoreService.updateMeetingHistory(config.hostId, config.meetingId, {
            // config.hostId
            status: "finished",
            endTime: new Date(),
          });
        }
      } catch (err) {
        console.error("更新会议状态失败");
      } finally {
        router.push("/home"); // 一定
      }
    } else {
      // 不是主持人,或者没有 meetingId,也跳转
      router.push("/home");
    }
  });

  client.on("session-expired", () => {
    ElMessage.info("会议会话已过期");
    leaveSession();
  });
  client.on("session-kicked-out", (payload) => {
    ElMessage.info(`已被踢出会议`);
    leaveSession();
  });

  // // 聊天事件 (以下部分保持不变，因为 ChatPanel 会触发父组件的相应方法)
  // client.on('chat-on-message', (payload) => {
  //   handleChatMessage(payload);
  //   // 增加发送者的 messagesSent，只在收到“文本消息”时增加.
  //   if (!payload.file) {
  //     const sender = users.value.find(u => u.userId === payload.sender.userId);
  //     if (sender) {
  //       sender.messagesSent += 1;
  //     }
  //   }
  // });

  // ZoomVideoService.getChatHistory().then((history) => {
  //   handleChatHistory(history);
  //   // 增加历史消息中每个发送者的消息数
  //   history.forEach(msg => {
  //     const sender = users.value.find(u => u.userId === msg.sender.userId);
  //     if (sender) {
  //       sender.messagesSent += 1;
  //     }
  //   })
  // });
  // ZoomVideoService.setMessageSentCallback(handleMessageSent);

  /**
   * 文件上传进度事件
   */
  client.on("chat-file-upload-progress", (payload) => {
    const { fileName, progress, status, id } = payload;
    uploadProgressInfo.value = {
      // 这个 uploadProgressInfo 仍然在 videocall.vue
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
  client.on("chat-file-download-progress", handleFileDownloadProgress); // 必须保留, 且放在 videocall.vue
}

onBeforeUnmount(() => {
  if (sessionJoined.value) {
    ZoomVideoService.leaveSession(false);
    sessionJoined.value = false;
  }
  stopScreenRecording();
});

onUnmounted(() => {
  if (sessionJoined.value) {
    ZoomVideoService.leaveSession(false);
    sessionJoined.value = false;
  }
  stopScreenRecording();
});

// 在页面加载完成后绑定事件
onMounted(() => {
  const mainElement = document.querySelector("main");
  if (mainElement) {
    mainElement.addEventListener("scroll", handleScroll, { passive: false });
  }
});

// 在组件卸载时移除事件监听
onUnmounted(() => {
  const mainElement = document.querySelector("main");
  if (mainElement) {
    mainElement.removeEventListener("scroll", handleScroll);
  }
});

// 检查是否已经加载了会议界面
onMounted(() => {
  const meetingLayout = document.querySelector(".meeting-layout");
  if (meetingLayout) {
    meetingLayout.addEventListener("scroll", handleScroll, { passive: false });
  }
});

onUnmounted(() => {
  const meetingLayout = document.querySelector(".meeting-layout");
  if (meetingLayout) {
    meetingLayout.removeEventListener("scroll", handleScroll);
  }
});

// 处理滚动事件
const handleScroll = (event) => {
  const { scrollTop } = event.target;

  // 如果页面已经滚动到顶部，阻止向下滚动
  if (scrollTop <= 0) {
    event.preventDefault();
    return false;
  }
};

// 在页面加载完成后绑定事件
onMounted(() => {
  const meetingContent = document.querySelector(".meeting-content");
  if (meetingContent) {
    meetingContent.addEventListener("scroll", handleScroll, { passive: false });
  }
});

// 在组件卸载时移除事件监听
onUnmounted(() => {
  const meetingContent = document.querySelector(".meeting-content");
  if (meetingContent) {
    meetingContent.removeEventListener("scroll", handleScroll);
  }
});

// 禁止页面滚动
const preventScroll = (event) => {
  event.preventDefault();
};

// 在页面加载完成后绑定事件
onMounted(() => {
  const meetingContent = document.querySelector(".meeting-content");
  if (meetingContent) {
    meetingContent.addEventListener("touchmove", preventScroll, { passive: false });
  }
});

// 在组件卸载时移除事件监听
onUnmounted(() => {
  const meetingContent = document.querySelector(".meeting-content");
  if (meetingContent) {
    meetingContent.removeEventListener("touchmove", preventScroll);
  }
});
</script>

<style scoped>
/* 基础样式 (PC端样式) */
main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f7f7f7;
  position: relative;
  margin: 0;
  /* 注意：移动端会覆盖 padding */
}
.return-icon-button {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 0; /* 移除 padding */
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 45px; /* 调整大小 */
  height: 45px;
  display: flex; /* 使用 flex 布局 */
  align-items: center; /*  垂直居中 */
  justify-content: center; /*  水平居中 */
  cursor: pointer;
  /* font-size: 40px; */ /* 移除 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1002;
  transition: background-color 0.3s; /* 添加过渡效果 */
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
  transition: transform 0.3s;
}

.closeBtn:hover {
  color: #e53935;
}

#action-flow {
  background-color: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
  position: relative;
  margin: 50px auto; /* Center the container */
}

#action-flow h1 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.8rem;
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
  font-size: 0.95rem;
}

.input-group input,
.input-group select {
  width: 95%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 25px;
  transition: border-color 0.3s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: #409eff;
  outline: none;
}
.button-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
  flex-wrap: wrap; /* Allow wrapping on small screens */
}

.button-container > * {
  flex: 1;
  max-width: 220px;
  min-width: 150px;
  text-align: center;
}

/* .closeBtn defined earlier */

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
  /* 注意：移动端会覆盖部分样式 */
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
  width: 60px; /* 根据需求调整宽度 */
  height: 60px; /* 根据需求调整高度 */
  /* 注意：移动端会覆盖部分样式 */
}

.controls button img {
  width: 90px; /* 根据需求调整宽度 */
  height: 90px; /* 根据需求调整高度 */
  transform: scale(2); /* 放大1.5倍 */
  vertical-align: middle; /* 使图标在按钮中垂直居中 */
  /* 注意：移动端会覆盖部分样式 */
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
/* 会议布局 (PC端样式) */
.meeting-layout {
  width: 90%;
  height: 90vh;
  background: #fff;
  max-height: calc(100vh - 90px);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 注意：移动端会覆盖这些样式 */
}

.meeting-content {
  display: flex;
  width: 100%;
  height: 100%;
  /* 注意：移动端会覆盖 flex-direction */
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
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
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.left-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  position: relative;
  min-width: 70%; /* 确保左侧面板占据主要空间 */
  /* 注意：移动端会调整 flex 和 min-width */
}

.participants-row {
  flex-shrink: 0;
  height: 120px;
  background: #262626;
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 8px;
  /* 注意：移动端会调整 height */
}
.participant-tile {
  width: 140px; /* 或者你希望的值 */
  height: 80px; /* 或者你希望的值 */
  position: relative; /* 可能需要, 用于定位 username-label */
  overflow: hidden; /*  重要! 防止内容溢出 */
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
/* 优化字幕容器 - 适用于所有屏幕 */
/* 修改字幕容器 - 更轻量化背景 */
.subtitle-container {
  position: absolute;
  bottom: 80px; /* 控制栏上方的距离 */
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 20px;
  pointer-events: none; /* 允许点击穿透 */
}

/* 字幕基础样式 - 降低背景透明度 */
.subtitle {
  max-width: 85%;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.4); /* 降低背景透明度 */
  border-radius: 12px;
  padding: 8px 12px; /* 减小内边距 */
  transition: opacity 0.3s ease;
}

/* 字幕项样式 - 降低背景透明度，减小边距 */
.subtitle-item {
  display: flex;
  margin-bottom: 6px; /* 减小间距 */
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.2); /* 降低背景透明度 */
  border-radius: 8px;
  padding: 6px 10px; /* 减小内边距 */
  backdrop-filter: blur(2px); /* 减轻毛玻璃效果 */
  transform-origin: bottom center;
  animation: subtitleFadeIn 0.3s ease forwards;
}

/* 发言者名称样式 */
.subtitle-user {
  color: #4fc3f7; /* 保持亮蓝色 */
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
  font-size: 14px;
}

/* 字幕文本样式 */
.subtitle-text {
  color: #ffffff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5); /* 减轻文字阴影 */
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

/* 翻译文本样式 */
.subtitle-translation {
  color: #e0e0e0; /* 浅灰色 */
  font-size: 13px;
  margin-top: 2px; /* 减小间距 */
  font-style: italic;
  opacity: 0.85;
}

/* 字幕占位符 */
.subtitle-placeholder {
  text-align: center;
  padding: 8px; /* 减小内边距 */
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  font-size: 14px;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .subtitle-container {
    bottom: 70px;
  }
  
  .subtitle {
    max-width: 95%;
    padding: 6px 10px;
  }
  
  .subtitle-item {
    flex-direction: column;
    padding: 6px 8px;
    margin-bottom: 5px;
    background: rgba(0, 0, 0, 0.25); /* 移动端更透明 */
  }
}

/* 平板/中等屏幕优化 */
@media (min-width: 481px) and (max-width: 768px) {
  .subtitle {
    max-width: 90%;
    padding: 10px 15px;
  }
  
  .subtitle-item {
    padding: 8px 12px;
  }
  
  .subtitle-user {
    font-size: 14px;
  }
  
  .subtitle-text {
    font-size: 15px;
  }
}

/* 竖屏手机特别优化 */
@media (max-width: 480px) and (orientation: portrait) {
  .subtitle {
    max-width: 98%; /* 几乎占满宽度 */
  }
  
  .subtitle-item {
    margin-bottom: 5px;
  }
}

/* 横屏手机特别优化 */
@media (max-height: 480px) and (orientation: landscape) {
  .subtitle-container {
    bottom: 60px; /* 横屏时控制栏可能更小 */
  }
  
  .subtitle {
    max-width: 70%; /* 横屏时可以窄一些 */
  }
  
  .subtitle-item {
    padding: 5px 10px;
    margin-bottom: 4px;
  }
  
  .subtitle-text, .subtitle-user {
    font-size: 13px; /* 横屏时字体略小 */
  }
  
  .subtitle-translation {
    font-size: 11px;
  }
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .subtitle-item {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .subtitle-text {
    text-shadow: none;
  }
  
  .subtitle-user {
    color: #74d9ff; /* 更亮的蓝色 */
  }
}

/* 让共享的画面只在 .speaker-area 区域内等比例缩放 */
video.video-element.share-video,
canvas.video-element.share-video {
  width: 100%;
  height: auto;
  object-fit: contain;
  overflow: auto;
}

/* .controls defined earlier */

.controls button.active {
  background-color: #1a73e8;
}

.exit-button {
  background-color: #e53935;
}

.controls button:hover {
  background-color: #555;
}

/* 群聊窗口 (由 ChatContainer.vue 控制主要样式) */
/* 仅保留 videocall.vue 中影响其布局的部分 */
.chat-container {
  flex: 1; /* 占据剩余空间 (PC端水平布局) */
  max-width: 400px; /* 可选：设置最大宽度 (PC端) */
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
  /* 移动端会覆盖 grid */
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
  /* 移动端会覆盖 grid */
}

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
  /* 注意：移动端会覆盖 */
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

/* 下载按钮样式 (保持不变) */
.download-button {
  background-color: #4caf50;
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

/*新增: 调整录音指示器的位置和样式 (保持不变) */
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

/* 字幕为空时的提示 (保持不变) */
.subtitle-placeholder {
  /* 样式保持不变 */
  position: absolute;
  bottom: 70px;
  left: 0;
  right: 0;
  color: #999;
  font-size: 14px;
  text-align: center;
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
/* 上传进度样式 (保持不变) */
.upload-progress {
  padding: 10px;
  background-color: #f0f0f0;
  border-top: 1px solid #ddd;
}

.meeting-container {
  position: relative; /* 确保子元素定位基准 */
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
  z-index: 100; /*  重要, 比其他页面高, 但比 Header, AIFloatingChat 低 */
  overflow: hidden; /* 确保内容不会溢出 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  min-width: 300px;
  min-height: 200px;
  transition: all 0.3s ease; /* 平滑过渡 */
}

/* 关闭按钮样式 (保持不变) */
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  z-index: 1001; /* 确保在最上层 */
}

/*  自定义的 MessageBox 样式 (保持不变) */
.close-videocall-confirm {
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); /* 阴影 */
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.close-videocall-confirm .el-message-box__header {
  background-color: #f0f4f8; /* 头部背景色 */
  padding: 15px 15px 10px;
}

.close-videocall-confirm .el-message-box__title {
  font-weight: 500; /* 标题加粗 */
  color: #303133; /* 标题颜色 */
}

.close-videocall-confirm .el-message-box__content {
  padding: 10px 15px;
  color: #606266; /* 文本颜色 */
  font-size: 14px;
}

/* 确认按钮 */
.close-videocall-confirm .confirm-button {
  background-color: #409eff; /* 主题色 */
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

.close-videocall-confirm .cancel-button:hover {
  background-color: #f5f7fa; /* 悬停颜色 */
  border-color: #c6cbd1;
}

/* 最小化时的样式 (保持不变) */
.video-call-container.minimized {
  top: 90px;
  left: 20px;
  bottom: auto;
  right: auto;
  width: 320px; /* 缩小后的宽度 */
  height: 180px; /* 缩小后的高度 */
  border-radius: 8px; /* 圆角 */
}
/* 当 isMaximized 为 true 时的样式 (保持不变) */
.video-call-container.maximized {
  top: 0; /* 或者你希望的值 */
  left: 0;
  width: 100%;
  height: 100%; /* 根据你的页头高度调整 */
  border-radius: 0; /* 取消圆角 */
}

/* ================================================ */
/* ========== 移动端响应式样式 (< 768px) ========== */
/* ================================================ */
@media (max-width: 768px) {
  /* 让 main 元素内容充满屏幕，移除内边距 */
  main {
    /* flex-direction: column; */ /* 不再需要，因为 meeting-layout 会充满屏幕 */
    padding: 0; /* 移除内边距 */
    align-items: stretch; /* 让子元素充满高度 */
    touch-action: manipulation; /* 禁用默认的触摸行为 */
    overscroll-behavior-y: contain; /* 防止过度滚动 */
    height: 100vh; /* 确保页面高度充满视口 */
    overflow-y: auto; /* 允许垂直滚动 */
    position: relative; /* 确保子元素定位基准 */
  }

  .video-call-container {
    border: none; /* 移除边框 */
    box-shadow: none; /* 移除阴影 */
  }
  /* 当页面到达顶部或底部时，禁止额外滚动 */
  .video-call-container.minimized,
  .video-call-container.maximized {
    touch-action: manipulation;
    overscroll-behavior-y: contain;
    height: 100%; /* 确保容器高度与视口一致 */
    overflow-y: auto; /* 允许内部滚动 */
  }
  .video-call-container.minimized {
    width: 100%; /* 确保宽度充满屏幕 */
    height: 100%; /* 确保高度充满屏幕 */
    border-radius: 0; /* 移除圆角 */
    /*position: fixed; /* 固定在屏幕上 */
    top: 0;
    left: 0;
    z-index: 100; /* 确保在最上层 */
  }
  .video-call-container.maximized {
    width: 100%; /* 确保宽度充满屏幕 */
    height: 100%; /* 确保高度充满屏幕 */
    border-radius: 0; /* 移除圆角 */
    /*position: fixed; /* 固定在屏幕上 */
    top: 0;
    left: 0;
    z-index: 100; /* 确保在最上层 */
  }

  #action-flow {
    margin: 0;
    padding: 20px; /* 保留内部边距 */
    min-height: 100vh; /* 仍然充满屏幕高度 */
    border-radius: 0;
    box-shadow: none;
    max-width: 100%; /* 确保充满宽度 */
    display: flex; /* 使用 flex 垂直居中内容 */
    flex-direction: column;
    justify-content: center;
  }

  #action-flow h1 {
    font-size: 1.6rem;
    margin-bottom: 20px;
  }

  .input-group {
    margin-bottom: 15px;
  }

  #action-flow .input-group label {
    font-size: 18px;
  }

  .input-group input,
  .input-group select {
    min-height: 40px; /* 增大触摸区域 */
    width: 100%; /* 输入框充满容器宽度 */
    box-sizing: border-box; /* 包含 padding 和 border */
    font-size: 17px;
  }

  .button-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-top: 25px;
    width: 100%;
  }

  .button-container > * {
    flex: none;
    width: 100%;
    max-width: none;
    min-height: 44px;
    font-size: 1rem;
  }
  .button-container button {
    font-size: 18px;
  }

  .closeBtn {
    top: 15px; /* 调整关闭按钮位置 */
    right: 15px;
    font-size: 1.4rem;
  }

  /* --- 核心修改：会议界面全屏化 --- */
  .meeting-layout {
    width: 100%; /* 强制全屏宽 */
    height: 100vh; /* 强制全屏高 */
    max-height: 100vh; /* 移除最大高度限制 */
    border-radius: 0; /* 移除圆角 */
    box-shadow: none; /* 移除阴影 */
    border: none; /* 移除边框 */
    background: #f0f0f0; /* 设置统一背景色 */
    position: relative; /* 恢复正常文档流定位 */
    margin: 0; /* 移除外边距 */
    padding: 0; /* 移除内边距 */
    display: flex; /* 确保内部 flex 布局生效 */
    /* align-items: stretch;  会让 meeting-content 充满 */
    touch-action: manipulation;
    overscroll-behavior-y: contain;
    height: 100%; /* 确保内容高度与视口一致 */
    border-radius: 0; /* 移除圆角 */
    /*position: fixed; /* 固定在屏幕上 */
    top: 0;
    left: 0;
    z-index: 101; /* 确保在最上层 */
    /*overflow-y: auto; /* 允许内部滚动 */
  }
  /*
  .meeting-content {
    flex-direction: column; *
    height: 100%;
    border-radius: 0;
    /*position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
  }*/
  .meeting-content {
    flex-direction: column; /* 垂直排列内容 */
    height: 100%; /* 确保内容高度与视口一致 */
    overflow-y: auto; /* 允许内部滚动 */
    margin: 0; /* 移除外边距 */
    padding: 0; /* 移除内边距 */
    border-radius: 0; /* 移除圆角 */
    /*position: fixed; /* 固定在屏幕上 */
    top: 0;
    left: 0;
    z-index: 200; /* 确保在最上层 */
    touch-action: manipulation; /* 禁用默认的触摸行为 */
    overscroll-behavior-y: contain; /* 防止顶部和底部过度滚动 */
    display: flex; /* 使用 Flexbox 布局 */
    flex-direction: column; /* 内容垂直堆叠 */
    justify-content: flex-start;
    align-items: stretch; /* 子元素拉伸以填充宽度 */
    height: 100vh; /* 强制全屏高度 */
    overflow: hidden; /* 禁止滚动 */
  }

  /* 调整视频区域和聊天区域的占比 */
  .left-panel {
    flex: 1; /* 主要视频区域占据更多空间 */
    min-height: 0; /* 允许收缩 */
    width: 100%; /* 确保宽度 */
    background: #f0f0f0; /* 保持背景色 */
    display: flex; /* 内部元素垂直排列 */
    flex-direction: column;
    position: relative; /* 为了 controls 定位 */
    /*overflow-y: auto; /* 允许内部滚动 */
    overflow: hidden; /* 禁止内部滚动 */
  }

  .chat-container {
    flex: 0 0 40vh; /* 聊天区域固定占据约 40% 的视口高度，可调整 */
    max-width: none; /* 移除 PC 端的最大宽度限制 */
    border-left: none; /* 移除 PC 端的左边框 */
    border-top: 1px solid #ddd; /* 在视频区和聊天区之间添加分隔线 */
    height: 40vh; /* 显式设置高度 */
    overflow: hidden; /* 防止内部元素溢出 */
    overflow-y: auto; /* 允许内部滚动 */
    display: flex; /* 确保内部 flex 布局生效 */
    flex-direction: column;
  }

  /* 参与者行调整 */
  .participants-row {
    height: 90px; /* 可以适当减小高度 */
    flex-shrink: 0;
    overflow-x: auto; /* 保持水平滚动 */
  }
  .participant-tile {
    width: 100px; /* 减小缩略图尺寸 */
    height: 70px;
  }
  video-player-container.participant-tile {
    width: 100px;
    height: 70px;
  }

  /* 演讲者区域 */
  video-player-container.speaker-area {
    flex: 1; /* 占据 left-panel 内的剩余空间 */
    min-height: 0; /* 允许收缩 */
  }

  /* 控制栏调整 */
  .controls {
    flex-wrap: wrap; /* 保持换行 */
    justify-content: center; /* 居中按钮 */
    padding: 8px 5px; /* 调整内边距 */
    gap: 15px; /* 按钮间距 */
    background: #1a1a1a; /* 确保背景色 */
    flex-shrink: 0; /* 防止被压缩 */
    /* position: absolute; */ /* 不再需要绝对定位 */
    /* bottom: 0; */
    width: 100%; /* 充满宽度 */
    z-index: 10; /* 确保在视频之上 */
  }
  .controls button {
    padding: 0; /* 移除内边距，让图标居中 */
    font-size: 10px; /* 减小文字大小（如果按钮内有文字） */
    width: 48px; /* 固定按钮宽度 */
    height: 48px; /* 固定按钮高度 */
    display: flex; /* 使用 flex 居中图标 */
    align-items: center;
    justify-content: center;
    border-radius: 50%; /* 圆形按钮 */
  }
  .controls button img {
    width: 24px; /* 调整图标大小 */
    height: 24px;
    transform: scale(1); /* 恢复正常大小 */
    vertical-align: middle;
  }
  .controls button span {
    /* 如果按钮内有文字，隐藏它 */
    display: none;
  }

  /* 字幕位置调整 */
  .subtitle-container {
    bottom: 65px; /* 根据 controls 的新高度调整 */
    /* 其他样式继承或保持不变 */
    z-index: 5; /* 低于 controls */
  }

  /* 服务质量弹窗调整 */
  .service-quality-overlay {
    width: 95%; /* 弹窗宽度适应屏幕 */
    max-width: 400px; /* 但不要过宽 */
  }
  
  .chart-container {
    /* grid-column: span 1; */
    height: 200px; /* 图表高度 */
  }
  /* 聊天控制栏调整 */
  .chat-controls {
    flex-wrap: wrap;
    padding: 8px;
  }

  .chat-controls label {
    margin-bottom: 5px;
    font-size: 14px; /* 调整字体大小 */
  }

  .receiver-select {
    margin-bottom: 5px;
    width: 100%; /* 选择框占满整行 */
    padding: 8px; /* 增大内边距 */
  }

  .send-file-bitton {
    /* 注意类名拼写 */
    width: 100%; /* 按钮占满整行 */
    margin-top: 5px;
    padding: 10px; /* 增大内边距 */
    font-size: 14px; /* 调整字体大小 */
  }

  /* 下载按钮等调整 */
  .download-button,
  .analyze-button {
    /* width: 100%; */ /* 文件列表中的按钮不需要占满整行 */
    margin-left: 0;
    margin-top: 5px;
    padding: 6px 12px; /* 调整内边距 */
    font-size: 13px; /* 调整字体大小 */
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
.controls {
  /* 可能需要调整 justify-content 或添加 flex-wrap */
  /* 例如: justify-content: space-around; */
  align-items: center; /* 垂直居中对齐控件 */
  }

/* 新增：语言选择控件容器 */
.language-controls {
  display: flex;
  gap: 15px; /* 下拉菜单之间的间距 */
  align-items: center; /* 垂直居中 */
  margin: 0 10px; /* 可以调整左右外边距 */
}

/* 新增：单个语言选择组（标签+下拉框） */
.lang-select-group {
  display: flex;
  align-items: center;
  gap: 5px; /* 标签和下拉框之间的间距 */
}

.lang-select-group label {
  color: #ccc; /* 标签文字颜色 */
  font-size: 12px; /* 标签字体大小 */
  white-space: nowrap; /* 防止标签换行 */
}

/* 新增：下拉菜单样式 */
.lang-select {
  background-color: #444; /* 背景色 */
  color: #fff; /* 文字颜色 */
  border: 1px solid #666; /* 边框 */
  padding: 5px 8px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  font-size: 12px; /* 字体大小 */
  cursor: pointer;
  height: 30px; /* 固定高度，使其与其他按钮对齐 */
  appearance: none; /* 移除默认样式(部分浏览器) */
  -webkit-appearance: none;
  -moz-appearance: none;
  }

.lang-select:focus {
  outline: none;
  border-color: #1a73e8; /* 聚焦时边框颜色 */
}

/* 响应式调整（可选） */
@media (max-width: 768px) {
  .language-controls {
    order: -1; /* 在小屏幕上将语言选择移到最前面 */
    width: 100%; /* 占据整行 */
    justify-content: center; /* 居中 */
    margin-bottom: 10px; /* 添加底部间距 */
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
  video-player-container.participant-tile {
      width: 90px;
      height: 60px;
  }

  .controls {
        gap: 10px; /* 进一步减少按钮间距 */
        padding: 6px 4px;
  }
  .controls button {
        width: 44px; /* 稍微减小按钮尺寸 */
        height: 44px;
  }
  .controls button img {
        width: 22px; /* 相应调整图标大小 */
        height: 22px;
  }

.subtitle-container {
  position: absolute;
  bottom: 80px; /* 或根据你的控制栏高度调整 */
  left: 10px;  /* 调整左右边距 */
  right: 10px; /* 调整左右边距 */
  z-index: 100;
  /* background: rgba(0, 0, 0, 0.5); /* 可选：给容器一个半透明背景 */
  /* border-radius: 6px; */ /* 可选：容器圆角 */
  /* padding: 5px 0; */ /* 可选：容器内边距 */
}

/* 字幕显示区域 */
  .subtitle {
  background: rgba(26, 26, 26, 0.7); /* 半透明深色背景 */
  color: #fff;
  padding: 8px 15px; /* 内边距 */
  border-radius: 8px; /* 圆角 */
  max-width: 70%;   /* 限制最大宽度 */
  margin: 5px auto; /* 居中并与其他用户字幕留间距 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);

  /* === 滚动关键样式 === */
  max-height: 120px; /* 限制最大高度，比如最多显示 4-5 行的高度 */
  overflow-y: auto;  /* 超出部分垂直滚动 */
  text-align: left; /* 让内容靠左对齐 */
}

/* 单条字幕项 */
.subtitle-item {
  margin-bottom: 5px; /* 条目间距 */
  line-height: 1.5;  /* 行高 */
  }
.subtitle-item:last-child {
  margin-bottom: 0;
  }

/* 发言人名字 */
.subtitle-user {
  color: #67c23a; /* 名字颜色，例如 Element Plus 的 Success 颜色 */
  font-weight: bold; /* 加粗 */
  margin-right: 8px; /* 和文本间距 */
  }

/* 原始文本 和 翻译文本 */
.subtitle-text,
.subtitle-translation {
  /* === 确保能换行 === */
  white-space: normal;  /* 允许自动换行 */
  word-break: break-all; /* 允许在任意字符处断词，防止长单词溢出 */
  display: inline; /* 让它们能在同一行显示（如果空间足够） */
}

.subtitle-text {
    /* 可以保留之前的描边等效果 */
    font-size: 15px; /* 调整字体大小 */
    /* -webkit-text-stroke: 1px #000; */
    /* text-shadow: 0 1px 2px rgba(0,0,0,0.5); */
    /* paint-order: stroke fill; */
}

.subtitle-translation {
    color: #e0e0e0; /* 翻译文本颜色稍浅 */
    font-size: 14px; /* 翻译字体稍小 */
    margin-left: 5px; /* 和原文括号的间距 */
}

/* Webkit 浏览器滚动条美化 (可选) */
.subtitle::-webkit-scrollbar {
    width: 5px;
}
.subtitle::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}
.subtitle::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 10px;
  }
.subtitle::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.6);
}}


.language-selector {
  position: relative; /* Crucial for positioning the absolute dropdown */
  display: inline-block; /* Or 'flex' if needed within controls */
}

/* Style the language button to match other controls */
.language-button {
  /* Inherit or match styles from .controls button */
  background-color: #faf2f2;
  color: #fff;
  border: none;
  padding: 0; /* Reset padding if applying flex */
  border-radius: 50%; /* Make it circular like others */
  cursor: pointer;
  transition: background-color 0.3s;
  width: 60px; /* Match other buttons */
  height: 60px; /* Match other buttons */
  display: flex; /* Use flex to arrange icon and text */
  flex-direction: column; /* Stack icon and text vertically */
  align-items: center; /* Center items horizontally */
  justify-content: center; /* Center items vertically */
  gap: 2px; /* Space between icon and text */
  overflow: hidden; /* Hide overflow if text is too long */
  text-align: center; /* Center text */
}

.language-button:hover {
  background-color: #555;
}

.language-button img {
  width: 24px; /* Adjust icon size as needed */
  height: 24px;
  margin-bottom: 2px; /* Space below icon */
}

.language-button .selected-language {
  font-size: 10px; /* Smaller font size for the language name */
  line-height: 1.2;
  display: block; /* Ensure it takes its own line */
  max-width: 90%; /* Prevent text overflowing button width */
  white-space: nowrap; /* Prevent wrapping */
  overflow: hidden; /* Hide overflow */
  text-overflow: ellipsis; /* Add ellipsis (...) if too long */
  color: #eee; /* Slightly lighter text color */
}

/* The dropdown menu itself */
/* 调整下拉菜单定位和样式 */
.language-dropdown {
  position: absolute;
  bottom: 70px; /* 调整为控制栏上方适当位置 */
  left: 40px; /* 对齐第一个按钮位置 */
  background-color: #333;
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 100;
  width: auto;
  padding: 8px 0;
}

/* 确保所有控制栏按钮尺寸一致 */
.controls button {
  width: 600px; /* 统一宽度 */
  height: 60px; /* 统一高度 */
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333;
  border: none;
  border-radius: 4px;
  margin: 0 5px;
}



/* 确保controls容器为单行 */
.controls {
  display: flex;
  flex-wrap: nowrap; /* 防止换行 */
  overflow-x: auto; /* 如果按钮太多，允许水平滚动 */
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: #1a1a1a;
}

/* Styling for each language option in the dropdown */
.language-option {
  padding: 8px 15px; /* Comfortable padding */
  color: #eee; /* Light text color */
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap; /* Prevent options from wrapping */
}

/* Hover effect for options */
.language-option:hover {
  background-color: #5a5a5a; /* Slightly lighter background on hover */
}

/* Style for the currently active/selected language option */
.language-option.active {
  background-color: #1a73e8; /* Use a highlight color (e.g., blue) */
  color: #fff; /* White text for active item */
  font-weight: 500;
}

/* --- Responsive Adjustments for Language Selector --- */
@media (max-width: 768px) {
  .language-button {
    width: 48px; /* Match smaller control buttons */
    height: 48px;
    gap: 1px;
  }

  .language-button img {
    width: 20px; /* Adjust icon size */
    height: 20px;
  }

  .language-button .selected-language {
    font-size: 8px; /* Even smaller font */
  }

  .language-dropdown {
    /* Potentially adjust min-width or max-height for mobile */
    min-width: 90px;
  }

  .language-option {
    padding: 7px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
   .language-button {
    width: 44px; /* Match smallest control buttons */
    height: 44px;
  }

  .language-button img {
    width: 18px; /* Adjust icon size */
    height: 18px;
  }
    .language-button .selected-language {
    font-size: 7px; /* Even smaller font */
  }
}


/* 额外的极小屏幕优化 */

/* 字幕过渡动画 */
.subtitle-trans-enter-active, 
.subtitle-trans-leave-active {
  transition: all 0.3s ease;
}

.subtitle-trans-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.subtitle-trans-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 字幕头部（用户名区域）样式 */
.subtitle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.subtitle-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.subtitle-content {
  width: 100%;
}

/* 针对极小屏幕的优化 (4英寸及以下手机) */
@media (max-width: 360px) {
  .subtitle-container {
    padding: 0 10px;
    bottom: 65px;
  }
  
  .subtitle {
    padding: 6px 8px;
  }
  
  .subtitle-item {
    padding: 6px 8px;
    margin-bottom: 4px;
  }
  
  .subtitle-user {
    font-size: 12px;
  }
  
  .subtitle-text {
    font-size: 13px;
    line-height: 1.2;
  }
  
  .subtitle-translation {
    font-size: 11px;
  }
  
  .subtitle-placeholder {
    font-size: 12px;
    padding: 5px;
  }
}

/* 适配折叠屏/可折叠设备 */
@media (max-width: 320px) {
  .subtitle {
    max-width: 100%;
    margin: 0;
    border-radius: 8px;
  }
  
  .subtitle-item {
    padding: 5px 7px;
  }
  
  .subtitle-user {
    font-size: 11px;
  }
  
  .subtitle-text {
    font-size: 12px;
  }
  
  .subtitle-translation {
    font-size: 10px;
  }
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .subtitle-item {
    background: rgba(30, 30, 30, 0.75);
  }
  
  .subtitle-user {
    color: #64b5f6; /* 稍暗的蓝色 */
  }
}

/* 浅色模式优化 */
@media (prefers-color-scheme: light) {
  .subtitle-item {
    background: rgba(0, 0, 0, 0.7); /* 稍深的背景 */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .subtitle-user {
    color: #29b6f6; /* 更亮的蓝色 */
  }
  
  .subtitle-text {
    color: #ffffff;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8); /* 增强阴影 */
  }
}

/* 更平滑的滚动 */
.subtitle {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  overscroll-behavior: contain;
}

.subtitle::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 降低动画效果 - 对于减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .subtitle-trans-enter-active, 
  .subtitle-trans-leave-active {
    transition: opacity 0.2s ease;
  }
  
  .subtitle-trans-enter-from,
  .subtitle-trans-leave-to {
    opacity: 0;
    transform: none;
  }
  
  .subtitle-item {
    animation: none;
  }
}
</style>
