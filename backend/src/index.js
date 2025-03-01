// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { KJUR } from 'jsrsasign';
import { toStringArray } from './utils.js';
import {
  inNumberArray,
  isBetween,
  isLengthLessThan,
  isRequired,
  matchesStringArray,
  validateRequest
} from './validations.js';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
// 获取当前模块的文件名和目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 配置内容安全策略 (CSP) 和 SharedArrayBuffer 支持
app.use((req, res, next) => {
  // 设置Cross-Origin-Opener-Policy和Cross-Origin-Embedder-Policy头
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// 中间件
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // 根据需要调整
}));

// 设置静态文件服务（用于下载文件）
app.use('/files', express.static(path.join(__dirname, 'files')));

// 文件存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Zoom Video SDK JWT生成路由
const zoomValidator = {
  role: [isRequired, inNumberArray([0, 1])],
  sessionName: [isRequired, isLengthLessThan(200)],
  expirationSeconds: isBetween(1800, 172800),
  userIdentity: isLengthLessThan(35),
  sessionKey: isLengthLessThan(36),
  geoRegions: matchesStringArray(['AU', 'BR', 'CA', 'CN', 'DE', 'HK', 'IN', 'JP', 'MX', 'NL', 'SG', 'US']),
  cloudRecordingOption: inNumberArray([0, 1]),
  cloudRecordingElection: inNumberArray([0, 1]),
  audioCompatibleMode: inNumberArray([0, 1])
};

const coerceZoomRequestBody = (body) => ({
  ...body,
  ...['role', 'expirationSeconds', 'cloudRecordingOption', 'cloudRecordingElection', 'audioCompatibleMode'].reduce(
    (acc, cur) => ({ ...acc, [cur]: typeof body[cur] === 'string' ? parseInt(body[cur]) : body[cur] }),
    {}
  )
});

const joinGeoRegions = (geoRegions) => toStringArray(geoRegions)?.join(',');

// Zoom JWT生成路由
app.post('/api/zoom-jwt', (req, res) => {
  const requestBody = coerceZoomRequestBody(req.body);
  const validationErrors = validateRequest(requestBody, zoomValidator);

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const {
    role,
    sessionName,
    expirationSeconds,
    userIdentity,
    sessionKey,
    geoRegions,
    cloudRecordingOption,
    cloudRecordingElection,
    audioCompatibleMode
  } = requestBody;

  const iat = Math.floor(Date.now() / 1000);
  const exp = expirationSeconds ? iat + expirationSeconds : iat + 60 * 60 * 2;
  const oHeader = { alg: 'HS256', typ: 'JWT' };

  const oPayload = {
    app_key: process.env.ZOOM_VIDEO_SDK_KEY,
    role_type: role,
    tpc: sessionName,
    version: 1,
    iat,
    exp,
    user_identity: userIdentity,
    session_key: sessionKey,
    geo_regions: joinGeoRegions(geoRegions),
    cloud_recording_option: cloudRecordingOption,
    cloud_recording_election: cloudRecordingElection,
    audio_compatible_mode: audioCompatibleMode
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_VIDEO_SDK_SECRET);
  return res.json({ signature: sdkJWT });
});

// AI聊天代理路由
app.post('/api/chat/completions', async (req, res) => {
  try {
    const { stream } = req.body;

    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XF_API_PASSWORD}`
      }
    };

    if (stream) {
      axiosConfig.responseType = 'stream';
    }

    const response = await axios.post('https://spark-api-open.xf-yun.com/v1/chat/completions', req.body, axiosConfig);

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      response.data.pipe(res);
    } else {
      res.json(response.data);
    }
  } catch (error) {
    console.error('Error calling AI API:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: error.response ? error.response.data : 'Internal Server Error'
    });
  }
});

// 文件上传与摘要生成路由
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('接收到文件:', req.file);

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

        // 添加文件类型白名单验证
    const allowedTypes = ['application/pdf', 
    'application/msword', 
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
    error: "不支持的格式",
    details: `仅支持PDF/Word文档，当前类型：${req.file.mimetype}`
    });
    }

    // 根据文件类型提取文本
    if (fileExt === '.pdf') {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const text = await page.getTextContent();
        extractedText += text.items.map(item => item.str).join(' ') + '\n';
      }
    } else if (['.doc', '.docx'].includes(fileExt)) {
      const docBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    console.log('提取的文本长度:', extractedText.length);

    if (extractedText.length === 0) {
      return res.status(400).json({ error: 'No text found in the document' });
    }

    // 调用讯飞星火大模型生成摘要
    const aiRequestBody = {
      model: "lite",      // 指定请求的模型版本
      // user: this.getUserEmail(), // 可选：添加用户唯一ID              
      messages: [{
        role: "user",
        content: `请为以下文档内容生成一个摘要：\n\n${extractedText}`
      }],
      temperature: 0.5,
      max_tokens: 1000           // 根据需要调整生成摘要的 token 数量
    };

    const aiResponse = await axios.post('https://spark-api-open.xf-yun.com/v1/chat/completions', aiRequestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XF_API_PASSWORD}`
      }
    });

    const summary = aiResponse.data.choices[0].message.content.trim();
    console.log('生成的摘要:', summary);

    // 可选：删除上传的文件以节省存储空间
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('删除文件出错:', err);
      } else {
        console.log('已删除上传的文件:', filePath);
      }
    });

    return res.json({ summary });
  } catch (error) {
    console.error('处理上传文件出错:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: error.response ? error.response.data : 'Internal Server Error'
    });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
