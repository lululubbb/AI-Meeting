// src/services/ZoomVideoService.js

import axios from 'axios';
import { showSnackBar } from '../utils/utils.js';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';

class ZoomVideoService {
  constructor() {
    this.jwt = '';
    this.isTesting = false; // 是否处于测试模式
    this.videoStats = {};
    this.audioStats = {};
  }

  // 获取 Zoom Video SDK 的 JWT
  async getVideoSDKJWT(sessionName, role, userIdentity, sessionPasscode = '') {
    if (this.isTesting) {
      // 测试模式下使用固定的 JWT
      this.jwt = 'your_test_jwt_here'; // 请替换为有效的测试 JWT
      console.log('使用测试模式的JWT');
      return this.jwt;
    }

    try {
      const response = await axios.post('/api/zoom-jwt', { // 使用相对路径，Vite代理会自动转发
        sessionName: sessionName,
        role: role,
        userIdentity: userIdentity,
        sessionPasscode: sessionPasscode
      });

      console.log('JWT 请求响应:', response.data); // 调试信息

      if (response.data && response.data.signature) {
        this.jwt = response.data.signature;
        return this.jwt;
      } else {
        throw new Error('JWT signature not found in response');
      }
    } catch (error) {
      showSnackBar('获取 JWT 失败: ' + (error.response?.data?.error?.message || error.message));
      console.error('获取 JWT 失败:', error);
      return null;
    }
  }

  // 加入会议
  joinSession(config) {
    return new Promise((resolve, reject) => {
      try {
        console.log('开始加入会议:', config); // 调试信息

        // 使用 UI Toolkit 加入会议
        uitoolkit.joinSession(document.getElementById('sessionContainer'), {
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
          resolve();
        });

        // 监听会议关闭事件
        uitoolkit.onSessionClosed(() => {
          console.log('会议已关闭');
          uitoolkit.closeSession(document.getElementById('sessionContainer'));
          reject(new Error('会议已关闭'));
        });

      } catch (error) {
        console.error('自动加入会议失败:', error);
        showSnackBar('自动加入会议失败: ' + error.message);
        reject(error);
      }
    });
  }
}
export default new ZoomVideoService();
