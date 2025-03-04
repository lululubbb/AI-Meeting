import { SpeechTranscription } from "alibabacloud-nls";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

// 阿里云配置
const ALIYUN_AK_ID = process.env.ALIYUN_AK_ID;
const ALIYUN_AK_SECRET = process.env.ALIYUN_AK_SECRET;
const APP_KEY = process.env.ALIYUN_APP_KEY;
const NLS_URL = "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1";

// WebSocket服务器配置
const WS_PORT = 4321;
const wss = new WebSocket.Server({ port: WS_PORT });

// 存储客户端连接
const clients = new Map();

// 获取阿里云Token（复用您之前的实现）
async function getAliyunToken() {
  const client = new RPCClient({
    accessKeyId: ALIYUN_AK_ID,
    accessKeySecret: ALIYUN_AK_SECRET,
    endpoint: "http://nls-meta.cn-shanghai.aliyuncs.com",
    apiVersion: "2019-02-28"
  });
  
  try {
    const res = await client.request("CreateToken");
    return res.Token.Id;
  } catch (err) {
    console.error("获取Token失败:", err);
    process.exit(1);
  }
}

// 处理WebSocket连接
wss.on("connection", async (ws) => {
  console.log("新客户端连接");
  const token = await getAliyunToken();
  
  // 初始化语音识别实例
  const transcriber = new SpeechTranscription({
    url: NLS_URL,
    token: token,
    appkey: APP_KEY
  });

  // 语音识别事件处理
  transcriber.on("changed", (result) => {
    ws.send(JSON.stringify({ type: "transcript", data: result }));
  });

  transcriber.on("completed", (result) => {
    ws.send(JSON.stringify({ type: "final_transcript", data: result }));
  });

  transcriber.on("error", (err) => {
    ws.send(JSON.stringify({ type: "error", message: err.message }));
  });

  // 启动识别
  await transcriber.start({
    format: "pcm",
    sample_rate: 16000,
    enable_intermediate_result: true
  });

  // 处理客户端发送的音频数据
  ws.on("message", (data) => {
    if (data instanceof Buffer) {
      transcriber.sendAudio(data);
    }
  });

  // 连接关闭处理
  ws.on("close", () => {
    transcriber.shutdown();
    console.log("客户端断开连接");
  });
});

console.log(`ASR服务已启动，监听端口: ${WS_PORT}`);