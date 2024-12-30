<!-- src/views/VideoCall.vue -->
<template>
  <main>
    <!-- 根据 mode 显示创建或加入会议的表单 -->
    <div id="action-flow" v-if="!autoJoin">
      <span class="closeBtn" @click="goHome">×</span>
      <h1>视频会议</h1>

      <!-- 创建会议表单 -->
      <div v-if="mode === 'create'" class="input-group">
        <label for="sessionName">会话名称:</label>
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
        <label for="sessionName">会话名称:</label>
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

 <!-- 用于嵌入视频会议的容器 -->
 <div id="sessionContainer" ref="sessionContainer" v-else></div>
      <!-- 显示音频转录结果 -->
      <div v-if="sessionJoined" id="transcriptionContainer">
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
        <h2>会议转录</h2>
        <ul>
          <!-- 搜索框搜索出来高亮显示 -->
          <li v-for="(transcript, index) in filteredTranscriptionList" :key="index">
          <span v-html="highlightMatch(transcript)"></span>
        </li>
        </ul>
      </div>

  </main>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';
import { useStore } from 'vuex';
import ZoomVideoService from '../services/ZoomVideoService.js';
import { showSnackBar } from '../utils/utils.js';
import CustomButton from '../components/CustomButton.vue';
import { useRoute, useRouter } from 'vue-router';
import FirestoreService from '../services/FirestoreService.js';
import ParticipantStatistics from '../services/ParticipantStatistics.js';
import ZoomVideo from '@zoom/videosdk';

const store = useStore();
const route = useRoute();
const router = useRouter();
const sessionContainer = ref(null);


const goHome = () => {
  router.push({ name: 'Home' });
};

// Initialize participantStatistics
// let participantStatistics = null;

// 获取 mode from query
const mode = ref(route.query.mode || 'join'); // 默认模式为加入会议

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
  }
});
const role = ref(mode.value === 'create' ? 1 : 0);
const sessionJoined = ref(false);
const autoJoin = ref(false)
const buttonText = ref(mode.value === 'create' ? '创建会议' : '加入会议');

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

    //初始化——要用不是组件形式的？
    // participantStatistics = new ParticipantStatistics(ZoomVideo.createClient()); 

    // participantStatistics.initializeEventListeners(); 
    // participantStatistics.startPeriodicSave(store.getters.getUser.uid, config.meetingId); 

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

    // 启动音频转录
    startTranscription();

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
      // participantStatistics = null; 
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


//此处用来写呈现转录和翻译结果的代码
//存储转录文本
const searchQuery = ref('');  // 搜索框的输入
const transcriptionList = ref([]);  // 存储转录的内容
const filteredTranscriptionList = ref([]);  // 存储经过过滤后的转录内容


// 模拟音频转录过程
const startTranscription = () => {
  // 使用 Web Speech API 或其他转录服务进行音频转录
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'zh-CN';
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    transcriptionList.value.push(transcript);  // 将转录文本加入列表
  };

  recognition.start();
};

// 模糊搜索函数
const filterTranscriptions = () => {
  const query = searchQuery.value.trim().toLowerCase();
  if (query === '') {
    filteredTranscriptionList.value = transcriptionList.value; // 如果没有搜索词，显示所有转录内容
  } else {
    filteredTranscriptionList.value = transcriptionList.value.filter(transcript =>
      transcript.toLowerCase().includes(query)  // 如果转录文本包含搜索词
    );
  }
};

// 高亮显示匹配的部分
const highlightMatch = (text) => {
  const query = searchQuery.value.trim();
  if (!query) return text;  // 如果没有搜索内容，直接返回原文本

  const regex = new RegExp(`(${query})`, 'gi');  // 使用正则表达式匹配搜索词
  return text.replace(regex, '<span class="highlight">$1</span>');  // 高亮显示匹配部分
};

// 监听搜索框的变化，实时过滤转录内容
watch(searchQuery, filterTranscriptions);


// 生命周期钩子
onMounted(() => {
  checkRouteParams();
// 当会议开始时启动音频转录
    if (sessionJoined.value) {
    startTranscription();
  }
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
});
</script>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
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

#sessionContainer {
  width: 75%;
  height: 90vh;
  margin-top: 0px;
  display: flex;
  justify-content: space-between;
  background-color: rgb(255, 255, 255);
}

#transcriptionContainer {
  width:22%; 
  height:75vh;
  background-color: rgb(255, 255, 255);
  padding: 5px;
  color: rgb(0, 0, 0);
  border-radius: 8px;
  overflow-y: auto;
  border: solid;
  border-color: #b9b9b9;
  margin-left: 10px;
  margin-top: 140px;
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
</style>
