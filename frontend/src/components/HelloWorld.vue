<script setup>
  import uitoolkit from "@zoom/videosdk-ui-toolkit";
  import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css'

  // 定义变量
  var sessionContainer;
  var authEndpoint = 'http://localhost:4000';  // 后端 JWT 生成端点
  var config = {
    videoSDKJWT: '',  // 存储 JWT
    sessionName: 'test',  // 会话名称
    userName: 'ZoomDev',  // 用户名称
    sessionPasscode: '123',  // 会话密码
    features: ['preview', 'video', 'audio', 'settings', 'users', 'chat', 'share'],  // 启用的功能
    options: { init: {}, audio: {}, video: {}, share: {} },  // 初始化选项
    virtualBackground: {
      allowVirtualBackground: true,
      allowVirtualBackgroundUpload: true,
      virtualBackgrounds: ['https://images.unsplash.com/photo-1715490187538-30a365fa05bd?q=80&w=1945&auto=format&fit=crop']
    }
  };
  var role = 1;  // 1 是主持人，0 是参与者

  // 获取 JWT 并加入会议的函数
  function getVideoSDKJWT() {
    sessionContainer = document.getElementById('sessionContainer');
    
    // 隐藏加入会话的按钮
    document.getElementById('join-flow').style.display = 'none';

    // 发送 POST 请求到后端获取 JWT
    fetch(authEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionName: config.sessionName,  // 会话名称
        role: role,  // 用户角色
      })
    })
    .then((response) => response.json())  // 解析 JSON 响应
    .then((data) => {
      if (data.signature) {  // 如果有 signature，则加入会议
        console.log('JWT:', data.signature);  // 打印 signature 以供调试
        config.videoSDKJWT = data.signature;  // 设置 JWT
        joinSession();  // 调用加入会议函数
      } else {
        console.error('Error: No signature returned', data);  // 错误处理
      }
    })
    .catch((error) => {
      console.error('Request failed', error);  // 捕获并打印错误
    });
  }

  // 加入会议的函数
  function joinSession() {
    uitoolkit.joinSession(sessionContainer, config);  // 使用 Video SDK 加入会议

    // 监听会议关闭事件
    uitoolkit.onSessionClosed(sessionClosed);
  }

  // 会议关闭时的回调
  var sessionClosed = (() => {
    console.log('Session closed');  // 打印日志
    uitoolkit.closeSession(sessionContainer);  // 关闭会话

    // 显示加入会话的按钮
    document.getElementById('join-flow').style.display = 'block';
  });
</script>

<template>
  <main>
    <div id="join-flow">
      <h1>Zoom Video SDK Sample Vue.js</h1>
      <p>User interface offered by the Video SDK UI Toolkit</p>

      <!-- 点击按钮获取 JWT 并加入会议 -->
      <button @click="getVideoSDKJWT">Join Session</button>
    </div>

    <!-- 用于嵌入视频会议的容器 -->
    <div id='sessionContainer'></div>
  </main>
</template>

<style scoped>
  /* 可根据需要修改样式 */
</style>
