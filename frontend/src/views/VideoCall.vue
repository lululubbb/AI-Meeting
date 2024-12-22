<!-- src/views/VideoCall.vue -->
<template>
  <main>
    <!-- 根据 mode 显示创建或加入会议的表单 -->
    <div id="action-flow" v-if="!autoJoin">
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

const store = useStore();
const route = useRoute();
const router = useRouter();
const sessionContainer = ref(null);

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
const autoJoin = ref(false);

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

    // 监听会议加入成功事件
    uitoolkit.onSessionJoined(() => {
      console.log('会议加入成功');
      sessionJoined.value = true;
    });

    // 监听会议关闭事件
    uitoolkit.onSessionClosed(() => {
      console.log('会议已关闭');
      uitoolkit.closeSession(sc);
      sessionJoined.value = false;

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
});
</script>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #2c2c2c;
}

#action-flow {
  background-color: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

#action-flow h1 {
  margin-bottom: 20px;
  color: #333333;
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
  width: 100%;
  height: 100vh;
  background-color: #000000;
}
</style>
