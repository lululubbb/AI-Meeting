<!-- src/views/VideoCall.vue -->
<template>
  <main>
    <!-- 根据 mode 显示创建或加入会议的表单 -->
    <div id="action-flow" v-if="!autoJoin">
      <span class="closeBtn" @click="goHome">×</span>
      <h1>视频会议</h1>

      <!-- 创建会议表单 -->
      <div v-if="mode === 'create'" class="input-group">
        <label for="sessionName">会议名称:</label>
        <input id="sessionName" v-model="config.sessionName" placeholder="请输入会话名称" />
      </div>

      <div v-if="mode === 'create'" class="input-group">
        <label for="userName">用户名:</label>
        <input id="userName" v-model="config.userName" placeholder="请输入用户名" />
      </div>

      <div v-if="mode === 'create'" class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input id="sessionPasscode" v-model="config.sessionPasscode" placeholder="请输入会议密码" />
      </div>

      <!-- 加入会议表单 -->
      <div v-if="mode === 'join'" class="input-group">
        <label for="sessionName">会议名称:</label>
        <input id="sessionName" v-model="config.sessionName" placeholder="请输入会话名称" />
      </div>

      <div v-if="mode === 'join'" class="input-group">
        <label for="userName">用户名:</label>
        <input id="userName" v-model="config.userName" placeholder="请输入用户名" />
      </div>

      <div v-if="mode === 'join'" class="input-group">
        <label for="sessionPasscode">会议密码 (可选):</label>
        <input id="sessionPasscode" v-model="config.sessionPasscode" placeholder="请输入会议密码" />
      </div>

      <!-- 角色选择 (仅限创建会议时显示) -->
      <div v-if="mode === 'create'" class="input-group">
        <label for="role">角色:</label>
        <select id="role" v-model="role">
          <option :value="1">主持人</option>
          <option :value="0">参与者</option>
        </select>
      </div>

      <!-- 提交按钮 -->
      <CustomButton :text="buttonText" :onPressed="handleSession" />
    </div>

    <!-- 视频和转录区域 -->
    <div v-else class="video-and-transcription">
      <!-- 视频会议容器 -->
      <div id="sessionContainer" ref="sessionContainer">
        <!-- 字幕容器 -->
        <div class="subtitle">
          {{ subtitle }}
        </div>
      </div>

    <!-- 转录文本容器 -->
    <div id="transcriptionContainer" v-if="sessionJoined">
      <h2>会议转录</h2>
      <p>{{ fullTranscription }}</p>
      
      <!-- 录音控制图标 -->
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
  </main>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';
import { useStore } from 'vuex';
import ZoomVideoService from '../services/ZoomVideoService.js';
import { showSnackBar } from '../utils/utils.js';
import CustomButton from '../components/CustomButton.vue';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js';
import ZoomVideo from '@zoom/videosdk';
import startIcon from '@/assets/start-icon.png';
import stopIcon from '@/assets/stop-icon.png';

const store = useStore();
const route = useRoute();
const router = useRouter();
const sessionContainer = ref(null);

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

// 定义响应式状态
const config = reactive({
  videoSDKJWT: '',
  sessionName: '',
  userName: '',
  sessionPasscode: '',
  meetingId: '',
  features: ['preview', 'video', 'audio', 'settings', 'users', 'chat', 'share'],
  options: { init: {}, audio: {}, video: {}, share: {} },
  virtualBackground: {
    allowVirtualBackground: true,
    allowVirtualBackgroundUpload: true,
    virtualBackgrounds: [
      'https://images.unsplash.com/photo-1715490187538-30a365fa05bd?q=80&w=1945&auto=format&fit=crop'
    ]
  },
  audioContext: null,
  audioWorkletNode: null,
  stream: null
});
const mode = ref(route.query.mode || 'join'); // 默认模式为加入会议
const role = ref(mode.value === 'create' ? 1 : 0);
const sessionJoined = ref(false);
const autoJoin = ref(false);
const buttonText = ref(mode.value === 'create' ? '创建会议' : '加入会议');

// 路由导航回主页方法
const goHome = () => {
  router.push('/home');
};

// 获取当前用户的邮箱
const getUserEmail = () => {
  const user = store.getters.getUser;
  console.log('当前用户邮箱:', user.email); // 调试信息
  return user.email || 'unknown@domain.com';
};

// 更新滚动字幕的方法
const updateSubtitle = (char) => {
  subtitle.value += char;
  // 限制滚动字幕长度 (只显示最后 50 个字符)
  if (subtitle.value.length > 50) {
    subtitle.value = subtitle.value.slice(-30)
  }
};

// 读取路由参数并自动加入会议
const checkRouteParams = async () => {
  const { sessionName, userName, sessionPasscode, role: roleParam, videoSDKJWT } = route.query;

  if (sessionName && userName && roleParam !== undefined && videoSDKJWT) {
    console.log('路由参数存在，准备自动加入会议');

    // 设置配置对象
    config.sessionName = sessionName;
    config.userName = userName;
    config.sessionPasscode = sessionPasscode || '';
    role.value = parseInt(roleParam, 10);
    config.videoSDKJWT = videoSDKJWT;

    // 设置 autoJoin 为 true，显示 sessionContainer
    autoJoin.value = true;
    console.log('已设置 autoJoin 为 true');

    // 等待 DOM 更新完成
    await nextTick();
    console.log('DOM 更新完成，准备调用 joinSession');

    // 添加会议历史记录（状态为进行中）
    const user = store.getters.getUser;
    if (user) {
      try {
        const meetingId = await FirestoreService.addToMeetingHistory(user.uid, config.sessionName, {
          status: 'ongoing'
        });
        config.meetingId = meetingId;
        console.log('已添加会议历史记录，meetingId:', meetingId);
      } catch (error) {
        console.error('添加会议历史记录失败:', error);
        showSnackBar('添加会议历史记录失败: ' + error.message);
      }
    } else {
      console.error('用户信息未找到，无法添加会议历史记录');
      showSnackBar('用户信息未找到，无法添加会议历史记录');
    }

    // 调用 joinSession
    await joinSession();
  } else {
    console.log('路由参数不完整，不进行自动加入会议');
  }
};

// 处理创建或加入会议
const handleSession = async () => {
  if (!config.sessionName || !config.userName) {
    showSnackBar('请填写会话名称和用户名');
    return;
  }

  if (mode.value === 'create' && !role.value) {
    showSnackBar('创建会议时角色必须为主持人');
    return;
  }

  try {
    console.log(`${mode.value === 'create' ? '创建' : '加入'}会议，开始获取 JWT`);
    let jwt;

    if (mode.value === 'create') {
      jwt = await ZoomVideoService.getVideoSDKJWT(config.sessionName, 1, config.userName, config.sessionPasscode);
    } else {
      jwt = await ZoomVideoService.getVideoSDKJWT(config.sessionName, parseInt(role.value, 10), config.userName, config.sessionPasscode);
    }

    if (!jwt) {
      showSnackBar(`无法获取有效的 JWT，无法${mode.value === 'create' ? '创建' : '加入'}会议`);
      return;
    }

    console.log('已获取 JWT:', jwt);
    // 设置 JWT
    config.videoSDKJWT = jwt;

    // 设置 autoJoin 为 true，显示 sessionContainer
    autoJoin.value = true;
    console.log('已设置 autoJoin 为 true');

    // 等待 DOM 更新完成
    await nextTick();
    console.log('DOM 更新完成，准备调用 joinSession');

    // 添加会议历史记录（状态为进行中）
    const user = store.getters.getUser;
    if (user) {
      try {
        const meetingId = await FirestoreService.addToMeetingHistory(user.uid, config.sessionName, {
          status: 'ongoing'
        });
        config.meetingId = meetingId;
        console.log('已添加会议历史记录，meetingId:', meetingId);
      } catch (error) {
        console.error('添加会议历史记录失败:', error);
        showSnackBar('添加会议历史记录失败: ' + error.message);
      }
    } else {
      console.error('用户信息未找到，无法添加会议历史记录');
      showSnackBar('用户信息未找到，无法添加会议历史记录');
    }

    // 调用 joinSession
    await joinSession();
  } catch (error) {
    console.error(`${mode.value === 'create' ? '创建' : '加入'}会议失败:`, error);
    showSnackBar(`${mode.value === 'create' ? '创建' : '加入'}会议失败: ` + error.message);
  }
};

// 自动加入会议的逻辑
const joinSession = async () => {
  try {
    // 获取 sessionContainer 元素
    const sc = sessionContainer.value;
    console.log('sessionContainer:', sc); // 调试信息

    if (!sc) {
      throw new Error('sessionContainer 元素未找到');
    }

    // 使用 UI Toolkit 加入会议
    uitoolkit.joinSession(sc, {
      videoSDKJWT: config.videoSDKJWT,
      sessionName: config.sessionName,
      userName: config.userName,
      sessionPasscode: config.sessionPasscode,
      features: config.features,
      options: config.options,
      virtualBackground: config.virtualBackground
    });
    console.log('调用 uitoolkit.joinSession 成功');
    console.log(uitoolkit);

    // 监听会议加入成功事件
    uitoolkit.onSessionJoined(() => {
      sessionJoined.value = true;
      console.log('会议加入成功');
    });

    // 监听会议关闭事件
    uitoolkit.onSessionClosed(() => {
      console.log('会议已关闭');
      uitoolkit.closeSession(sc);
      sessionJoined.value = false;
      // 停止录音并保存转录文本
      stopRecording();
      // 更新会议历史记录（状态为已完成）
      const user = store.getters.getUser;
      if (user && config.meetingId) {
        FirestoreService.updateMeetingHistory(user.uid, config.meetingId, {
          status: 'finished',
          endedAt: new Date()
        })
        .then(() => {
          console.log('已更新会议历史记录为 finished');
          // 导航回主页
          router.push('/home');
        })
        .catch((error) => {
          console.error('更新会议历史记录失败:', error);
          showSnackBar('更新会议历史记录失败: ' + error.message);
          // 即使更新失败，也尝试导航回主页
          router.push('/home');
        });
      } else {
        // 如果用户信息或 meetingId 无效，依然导航回主页
        router.push('/home');
      }
    });
  } catch (error) {
    console.error('自动加入会议失败:', error);
    showSnackBar('自动加入会议失败: ' + error.message);
  }
};

// 录音控制方法
const startRecording = async () => {
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
};
// 切换录音状态的方法
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};
// 停止录音方法
const stopRecording = async () => {
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
};

// 生命周期钩子
onMounted(() => {
  checkRouteParams();
});

onBeforeUnmount(() => {
  if (sessionJoined.value) {
    const sc = sessionContainer.value;
    if (sc) {
      uitoolkit.closeSession(sc);
      sessionJoined.value = false;
      console.log('会议已关闭，并清理 sessionJoined 状态');
      // 可选：导航回主页
      router.push('/home');
    }
  }

  // 确保停止录音并清理资源
  stopRecording();
});
</script>
<style scoped>
main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 95vh;
  background-color: #ffffff;
  margin: 0; 
}

.closeBtn {
  position: absolute;  /* 设置为绝对定位 */
  top: 5px;           /* 调整顶部间距 */
  right: 20px;   
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
}
.closeBtn:hover {
  color: red;
}

#action-flow {
  background-color: #ffffff;
  padding: 40px;
  margin: 0px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
  position: relative; /* 设置父容器为相对定位 */
}

#action-flow h1 {
  margin-bottom: 20px;
  color: #000000;
}

.input-group {

  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #333333;
  font-weight: bold;
}
.input-group input:focus,
.input-group select:focus {
  border-color: #1a73e8;
  outline: none;
}
.input-group input,
.input-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: #1a73e8;
  outline: none;
}

.video-and-transcription {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 90%;
  height: 100vh;
  margin-top: 50px;
}
#sessionContainer {
  position: relative;
  width: 80%;
  height: 100%;
  background-color: rgb(255, 255, 255);
  border-radius: 8px;
  overflow: hidden;
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

/* 可选：调整录音控制按钮的样式 */
/* 录音控制图标的容器样式 */
.recording-controls {
  position: absolute;
  bottom: 10px;
  left: 10px;
}

/* 录音控制图标的样式 */
.recording-icon {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: transform 0.2s;
}

.recording-icon:hover {
  transform: scale(1.1);
}

.recording-controls button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.recording-controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.search-container {
    position: relative;
    margin-bottom: 20px;
  }

.input-wrapper {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  width: 95%; 
} 
.search-input {
    width: 70%;
    padding: 10px 40px 10px 40px;
    border-radius: 25px;
    border-width: 2px;
    font-size: 16px;
    outline: none;
    border-color: #d7d7d7;
  
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
.search-input:focus {
    border-color: #b1b1b1;
}
  
.search-input::placeholder {
    color: #bbb;
    font-style: italic;
}
/* 高亮显示搜索出来的部分 */
.highlight {
  background-color: yellow;
  font-weight: bold;
}
/* 添加录音控制按钮的样式 */
.recording-controls {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.recording-controls button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.recording-controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

#transcriptionContainer {
  position: relative;
  width: 22%; 
  height: 80vh;
  background-color: rgb(255, 255, 255);
  padding: 10px;
  color: rgb(0, 0, 0);
  border-radius: 8px;
  overflow-y: auto;
  border: solid 1px #b9b9b9;
  margin-left: 10px;
  margin-top: 10px;
}
/* 美化转录文本区域标题 */
#transcriptionContainer h2 {
  font-family: 'Arial', sans-serif; /* 更换字体 */
  font-size: 24px; /* 增大字体大小 */
  color: #333333; /* 深灰色字体 */
  text-align: center; /* 居中对齐 */
  margin-bottom: 15px; /* 增加底部间距 */
}
/* 美化转录文本内容 */
#transcriptionContainer p {
  white-space: pre-wrap; /* 保留换行 */
  word-wrap: break-word; /* 自动换行 */
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #555555;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  max-height: 70vh;
  overflow-y: auto;
}

#transcriptionContainer ul {
  list-style-type: none; 
  padding: 0;
  margin: 0;
}

#transcriptionContainer li {
  background-color: #f0f0f0; 
  color: #000; 
  padding: 10px;
  margin-bottom: 10px; 
  border-radius: 12px; 
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 14px; 
  word-wrap: break-word; 
}

</style>