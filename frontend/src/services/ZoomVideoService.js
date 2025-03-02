// zoomvideoservice.js
import ZoomVideo from '@zoom/videosdk';
import axios from 'axios';
import { showSnackBar } from '../utils/utils.js';
import { nextTick } from 'vue'; // 导入 nextTick

export const VideoQuality = {
  VIDEO_180P: 1,
  VIDEO_360P: 2,
  VIDEO_720P: 3,
  VIDEO_1080P: 4
};

const DEPENDENT_ASSETS_PATH = 'Global';


async function initializeZoomSDK(client) {
  const sysCheck = await ZoomVideo.checkSystemRequirements();
  if (!sysCheck.audio || !sysCheck.video || !sysCheck.screen) {
    throw new Error('当前浏览器不支持必要功能');
  }
  ZoomVideo.preloadDependentAssets(DEPENDENT_ASSETS_PATH);
  await client.init('zh-CN', DEPENDENT_ASSETS_PATH, {
    enforceMultipleVideos: true
  });
}

class ZoomVideoService {
  constructor() {
    this.client = ZoomVideo.createClient();
    this.stream = null;
    this.sessionJoined = false;
    this.isHost = false; // 新增: 是否为主持人

    // 聊天
    this.chatClient = null;
    this.onMessageSent = null;
  }
  getIsHost() {
    return this.isHost;
  }

  async getVideoSDKJWT(sessionName, role, userIdentity, sessionPasscode = '', expirationSeconds = 7200) {
    try {
      const resp = await axios.post('/api/zoom-jwt', {
        sessionName,
        role,
        userIdentity,
        sessionPasscode,
        expirationSeconds
      });
      if (resp.data && resp.data.signature) {
        return resp.data.signature;
      }
      throw new Error('未获取到有效的 signature');
    } catch (error) {
      showSnackBar('获取 JWT 失败: ' + (error.response?.data?.errors?.join(', ') || error.message));
      console.error(error);
      return null;
    }
  }

  async joinSession(config) {
    try {
      await initializeZoomSDK(this.client);
      await this.client.join(
        config.sessionName,
        config.videoSDKJWT,
        config.userName,
        config.sessionPasscode
      );
      this.stream = this.client.getMediaStream();
      this.sessionJoined = true;
      await this.startLocalAudio();
      await this.startLocalVideo();
      await this.initChat();

      // 新增: 获取当前用户是否为主持人
      this.isHost = this.client.isHost();

      return true;
    } catch (error) {
      showSnackBar('加入会议失败: ' + error.message);
      console.error(error);
      return false;
    }
  }

  async initChat() {
    try {
      this.chatClient = this.client.getChatClient();
      console.log('File transfer enabled?: ', this.chatClient.isFileTransferEnabled());
      if (!this.chatClient) {
        throw new Error('无法获取聊天客户端');
      }
    } catch (e) {
      showSnackBar('初始化聊天失败: ' + e.message);
      console.error(e);
    }
  }

  // --- 新增 START ---

  /** 获取可用的聊天接收者列表(用于私聊) */
  getChatReceivers() {
    if (!this.chatClient) return [];
    return this.chatClient.getReceivers() || [];
  }

/** 私聊给 userId 发送文本消息 */
async sendMessageToUser(text, userId, timestamp) {  // 增加 timestamp 参数
  if (!this.chatClient) {
    showSnackBar('聊天客户端未初始化');
    return;
  }
  try {
    const result = await this.chatClient.send(text, userId);
    if (this.onMessageSent && result && !result.message && !result.errorCode) {
      const curUser = this.client.getCurrentUserInfo();
      this.onMessageSent({
        sender: { userId: curUser.userId, name: curUser.displayName }, // 同时发送 userId
        message: text,
        receiver: { userId },
        timestamp: timestamp.getTime() // 传递时间戳的数值
      });
    }
  } catch (error) {
    showSnackBar('发送私聊消息失败: ' + error.message);
    console.error(error);
  }
}

  /** 文件发送: 发给所有人 */
  async sendFileToAll(file) {
    if (!this.chatClient) {
      showSnackBar('聊天客户端未初始化');
      return null;
    }
    if (!this.chatClient.isFileTransferEnabled()) {
      showSnackBar('当前会议未启用文件传输');
      return null;
    }
    return new Promise((resolve, reject) => { // 使用 Promise
      let cancelFn;
      const onMessage = (payload) => {
        if (payload.file && payload.file.name === file.name && payload.sender.userId === this.client.getCurrentUserInfo().userId ) {
            // 确保是当前用户发送的这个文件
          this.client.off('chat-on-message', onMessage); // 解除监听
          resolve(payload.id); // 返回 msgId
        }
      };
      this.client.on('chat-on-message', onMessage); // 监听消息

      this.chatClient.sendFile(file, 0).then(fn => {
          cancelFn = fn;
      }).catch(err => {
        this.client.off('chat-on-message', onMessage);
        reject(err);  // 失败
      });
    });
  }

  /** 文件发送: 发给指定 userId */
  async sendFileToUser(file, userId) {
    if (!this.chatClient) {
      showSnackBar('聊天客户端未初始化');
      return null;
    }
    if (!this.chatClient.isFileTransferEnabled()) {
      showSnackBar('当前会议未启用文件传输');
      return null;
    }

     return new Promise((resolve, reject) => { // 使用 Promise
      let cancelFn;
      const onMessage = (payload) => {
         if (payload.file && payload.file.name === file.name && payload.sender.userId === this.client.getCurrentUserInfo().userId) {
          this.client.off('chat-on-message', onMessage);
          resolve(payload.id);  // 返回 msgId
        }
      };
       this.client.on('chat-on-message', onMessage);

      this.chatClient.sendFile(file, userId).then(fn => {
          cancelFn = fn;
      }).catch(err => {
          this.client.off('chat-on-message', onMessage);
        reject(err); // 失败
      });
    });
  }

  /** 下载文件 (SDK 会自动下载到浏览器的默认下载位置) */
  async downloadFile(msgId, fileUrl, blob = false) {
    if (!this.chatClient) {
      showSnackBar('聊天客户端未初始化');
      return null;
    }
    try {
      const cancelFn = await this.chatClient.downloadFile(msgId, fileUrl, blob);
      return cancelFn;
    } catch (error) {
      showSnackBar('下载文件失败:' + error.message);
      console.error(error);
      return null;
    }
  }

  // --- 新增 END ---

  async getChatHistory() {
    if (!this.chatClient) return [];
    try {
      const history = await this.chatClient.getHistory();
      // 转换 history 数组
      return history.map(msg => ({
        ...msg,
        type: msg.receiver.userId === '0' ? 'group' : 'private',  // 添加 type
        timestamp: msg.timestamp ?  msg.timestamp: Date.now(),   // 添加时间戳
        sender: {
          userId: msg.sender.userId, // 同时发送 userId
          name: msg.sender.name
        }
      }));
    } catch (err) {
      console.error('getChatHistory error:', err);
      return [];
    }
  }

    async sendMessageToAll(message, timestamp) { //增加 timestamp
    if (!this.chatClient) {
      showSnackBar('聊天客户端未初始化');
      return;
    }
    try {
      const result = await this.chatClient.sendToAll(message);
      if (this.onMessageSent && result && !result.message && !result.errorCode) {
        const curUser = this.client.getCurrentUserInfo();
        this.onMessageSent({
          sender: { userId: curUser.userId, name: curUser.displayName },  // 同时发送 userId
          message,
          timestamp: timestamp.getTime()  // 传递时间戳的数值
        });
      }
    } catch (error) {
      showSnackBar('发送聊天消息失败: ' + error.message);
      console.error(error);
    }
  }

  setMessageSentCallback(cb) {
    this.onMessageSent = cb;
  }

  async startLocalVideo(options = {}) {
    try {
      const videoOptions = { hd: true, ...options };
      await this.stream.startVideo(videoOptions);
    } catch (error) {
      showSnackBar('开启本地视频失败:' + error.message);
      console.error(error);
    }
  }

  async toggleLocalVideo(isVideoOn) {
    if (!this.sessionJoined) {
      showSnackBar('尚未加入会议');
      return;
    }
    try {
      if (isVideoOn) {
        await this.stream.startVideo({ hd: true });
      } else {
        await this.stream.stopVideo();
      }
    } catch (error) {
      showSnackBar('切换本地视频失败:' + error.message);
      console.error(error);
    }
  }

  async attachUserVideo(userId, videoQuality) {
    if (!this.sessionJoined || !this.stream) return null;
    try {
      const container = document.getElementById(`user-${userId}`);
      if (!container) {
        const newEl = await this.stream.attachVideo(userId, videoQuality);
        newEl.classList.add('video-element');
        return newEl;
      } else {
        const existing = container.querySelector('video, video-player, canvas');
        if (existing) existing.remove();
        const userVideoEl = await this.stream.attachVideo(userId, videoQuality);
        userVideoEl.classList.add('video-element');
        container.appendChild(userVideoEl);
        return userVideoEl;
      }
    } catch (error) {
      console.error('attachUserVideo error:', error);
      return null;
    }
  }

  async detachUserVideo(userId) {
    if (!this.sessionJoined || !this.stream) return;
    try {
      const elements = await this.stream.detachVideo(userId);
      if (Array.isArray(elements)) {
        elements.forEach(el => el.remove());
      } else if (elements) {
        elements.remove();
      }
      const container = document.getElementById(`user-${userId}`);
      if (container) {
        const oldEl = container.querySelector('video, video-player, canvas');
        if (oldEl) oldEl.remove();
      }
    } catch (error) {
      console.error('detachUserVideo error:', error);
    }
  }

  async startLocalAudio() {
    try {
      await this.stream.startAudio();
    } catch (error) {
      showSnackBar('开启音频失败:' + error.message);
      console.error(error);
    }
  }

  async toggleLocalAudio(isAudioOn) {
    if (!this.sessionJoined) {
      showSnackBar('尚未加入会议');
      return;
    }
    try {
      if (isAudioOn) {
        await this.stream.startAudio();
      } else {
        await this.stream.stopAudio();
      }
    } catch (error) {
      showSnackBar('切换音频失败:' + error.message);
      console.error(error);
    }
  }

 async startLocalScreenShare() {
    if (!this.sessionJoined || !this.stream) return false;
    try {
        const shareArea = document.querySelector('.speaker-area');
        if (!shareArea) return false;

        // 先清空
        let oldVideo = document.getElementById('local-share-video');
        let oldCanvas = document.getElementById('local-share-canvas');
        if (oldVideo) oldVideo.remove();
        if (oldCanvas) oldCanvas.remove();

        // 使用 nextTick 确保 DOM 更新
        await nextTick();

        if (this.stream.isStartShareScreenWithVideoElement()) {
            const shareVideo = document.createElement('video');
            shareVideo.id = 'local-share-video';
            shareVideo.autoplay = true;
            shareVideo.playsInline = true;
            shareVideo.classList.add('video-element', 'share-video');

            shareArea.innerHTML = ''; // 再次清空，确保安全
            shareArea.appendChild(shareVideo);
            await this.stream.startShareScreen(shareVideo);
        } else {
            const shareCanvas = document.createElement('canvas');
            shareCanvas.id = 'local-share-canvas';
            shareCanvas.classList.add('video-element', 'share-video');

            shareArea.innerHTML = '';// 再次清空，确保安全
            shareArea.appendChild(shareCanvas);
            await this.stream.startShareScreen(shareCanvas);
        }
        return true;
    } catch (error) {
        showSnackBar('开启屏幕共享失败:' + error.message);
        console.error(error);
        return false;
    }
}

  async stopLocalScreenShare() {
    if (!this.sessionJoined || !this.stream) return;
    try {
      await this.stream.stopShareScreen(); // 先停止共享

      // 再从 DOM 中移除
      const shareVideo = document.getElementById('local-share-video');
      if (shareVideo) shareVideo.remove();
      const shareCanvas = document.getElementById('local-share-canvas');
      if (shareCanvas) shareCanvas.remove();
    } catch (error) {
      showSnackBar('停止屏幕共享失败:' + error.message);
      console.error(error);
    }
  }

  async attachScreenShare(userId) {
    if (!this.sessionJoined || !this.stream) return;
    try {
      const shareArea = document.querySelector('.speaker-area');
      if (!shareArea) return;
      await this.stream.stopShareView();
      shareArea.innerHTML = '';
      const shareCanvas = document.createElement('canvas');
      shareCanvas.id = `share-${userId}-canvas`;
      shareCanvas.classList.add('video-element', 'share-video');
      shareArea.appendChild(shareCanvas);
      await this.stream.startShareView(shareCanvas, userId);
    } catch (error) {
      console.error('attachScreenShare error:', error);
    }
  }

  async detachScreenShare(userId) {
    if (!this.sessionJoined || !this.stream) return;
    try {
      await this.stream.stopShareView();
      const shareCanvas = document.getElementById(`share-${userId}-canvas`);
      if (shareCanvas) shareCanvas.remove();
    } catch (error) {
      console.error('detachScreenShare error:', error);
    }
  }

  async leaveSession(endSession = false) {
    if (!this.sessionJoined) return;
    try {
      await this.client.leave(endSession);
      this.sessionJoined = false;
      this.stream = null;
      this.chatClient = null;
      this.isHost = false; // 重置 isHost
    } catch (error) {
      showSnackBar('离开会议失败:' + error.message);
      console.error(error);
    }
  }
}

export default new ZoomVideoService();
