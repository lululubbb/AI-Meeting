// asr.js - 仅核心功能，无额外依赖, 增加详细日志
import { WebSocketServer } from 'ws';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Nls = require('alibabacloud-nls');

// 阿里云配置（替换为实际值）
const CONFIG = {
    URL: "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1",
    APPKEY: "wvpwo9lGGSkfMHfn", // 你的 AppKey
    TOKEN: "a9b422e0d8894e028158c5f3c13fd107"  // 你的 Token
  };

const wss = new WebSocketServer({ port: 4399 });

const transcriptionClients = new Map();
const HEARTBEAT_INTERVAL = 30000;

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1));
  const userId = urlParams.get('userId');
  const userName = urlParams.get('userName');

  console.log(`[Server] 客户端已连接, userId: ${userId}, userName: ${userName}`);

  if (!userId) {
    console.error('[Server] 连接缺少 userId，关闭连接');
    ws.close();
    return;
  }
    // 检查是否已有同 userId 的连接
    if (transcriptionClients.has(userId)) {
        console.warn(`[Server] 用户 ${userId} 已存在活动连接，关闭旧连接`);
        const oldClient = transcriptionClients.get(userId);
        // 异步关闭 Nls.SpeechTranscription 实例
        oldClient.st.close().then(() => {
            console.log(`[Server] 用户 ${userId} 的旧 NLS 连接已成功关闭`);
        }).catch(err => {
            console.error(`[Server] 用户 ${userId} 的旧 NLS 连接关闭失败:`, err);
        });
        // 关闭 WebSocket 连接
        oldClient.ws.close();

    }
  const st = new Nls.SpeechTranscription({
    url: CONFIG.URL,
    appkey: CONFIG.APPKEY,
    token: CONFIG.TOKEN
  });

  let isServiceStarted = false;

  transcriptionClients.set(userId, { ws, st, userName, isAlive: true });

  st.on('started', () => {
    console.log(`[Server] 用户 ${userId} 的阿里云服务已启动`);
    isServiceStarted = true;
  });

  st.on('changed', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data?.payload?.result) {
        console.log(`[Server] 用户 ${userId} 收到中间结果: ${data.payload.result}`);
        broadcastTranscription(userId, userName, data.payload.result, 'interim');
      }
    } catch (err) {
      console.error(`[Server] 用户 ${userId} 解析中间结果失败:`, err);
    }
  });

  st.on('completed', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data?.payload?.result) {
        console.log(`[Server] 用户 ${userId} 收到最终结果: ${data.payload.result}`);
        broadcastTranscription(userId, userName, data.payload.result, 'final');
      }
    } catch (err) {
      console.error(`[Server] 用户 ${userId} 解析最终结果失败:`, err);
    }
  });

  st.on('closed', () => {
    console.log(`[Server] 用户 ${userId} 的阿里云服务已关闭`);
    isServiceStarted = false;
    transcriptionClients.delete(userId);
  });

  st.on('failed', (err) => {
    console.error(`[Server] 用户 ${userId} 的识别失败:`, err);
    isServiceStarted = false;
     if(transcriptionClients.has(userId)){
        const client = transcriptionClients.get(userId);
        client.ws.close();
        transcriptionClients.delete(userId);
     }
  });

  //  startParams 设置 (根据官方文档)
  const startParams = {
    format: 'pcm',
    sample_rate: 16000,
    enable_intermediate_result: true,
    enable_punctuation_prediction: true,
    enable_inverse_text_normalization: true,
    //  不需要 sentence_timeout, max_end_silence
  };

  st.start(startParams, true, 6000) // 第二个参数 true, 第三个参数 6000
    .catch(err => console.error(`[Server] 启动失败:`, err));

  ws.on('message', audioData => {
    if (isServiceStarted && audioData instanceof Buffer) {
      if (!st.sendAudio(audioData)) {
        console.error(`[Server] 音频发送失败`);
      }
    }
  });

  ws.on('close', () => {
    console.log(`[Server] 用户 ${userId} 的客户端连接已关闭`);
        if (transcriptionClients.has(userId)) {
            const client = transcriptionClients.get(userId);
            // 异步关闭 Nls.SpeechTranscription 实例
            client.st.close().catch(err => {
                console.error(`[Server] 用户 ${userId} 的 NLS 连接关闭失败:`, err);
            });

            // 从 Map 中移除客户端信息
            transcriptionClients.delete(userId);
        }
  });

    ws.on('pong', () => {
        if (transcriptionClients.has(userId)) {
          const client = transcriptionClients.get(userId)
          client.isAlive = true
        }

    });
});

setInterval(() => {
  transcriptionClients.forEach((client, userId) => {
    if (client.isAlive === false) {
      console.log(`[Server] 用户 ${userId} 心跳超时，关闭连接`);
      client.ws.terminate();
      return;
    }

    client.isAlive = false;
    client.ws.ping();
  });
}, HEARTBEAT_INTERVAL);

function broadcastTranscription(senderId, senderName, text, type) {
  const message = JSON.stringify({
    type,
    userId: senderId,
    userName: senderName,
    text
  });
  console.log(`[Server] 广播消息: ${message}`);
  transcriptionClients.forEach(client => {
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(message);
    }
  });
}

console.log('[Server] WebSocket服务运行在 ws://localhost:4399');
