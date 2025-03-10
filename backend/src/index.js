// server.js
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

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
const PORT = process.env.PORT || 4000;
const parentDir = path.join(__dirname, '..'); 
// 在Express初始化后立即添加
app.use(cors({
  origin: 'http://localhost:5173', // 前端开发地址
  credentials: true
}))
// 中间件

app.use(express.json({ limit: '100mb' })); // 增加请求体大小限制 (例如 50MB)
app.use(express.urlencoded({ limit: '100mb', extended: true })); // 也要增加 urlencoded 的限制

// 配置内容安全策略 (CSP) 和 SharedArrayBuffer 支持
app.use((req, res, next) => {
  // 设置Cross-Origin-Opener-Policy和Cross-Origin-Embedder-Policy头
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  //console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  //console.log('Query:', req.query);
  //console.log('Headers:', req.headers);
  next();
});

//  文件存储配置 (修改 filename)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
      const uniqueId = uuidv4();
      const fileExt = path.extname(file.originalname);
      const originalName = file.originalname; // 原始文件名
      const finalName = `${uniqueId}-${originalName}`; // 组合
      cb(null, finalName);
  }
});
const upload = multer({
  storage: storage,  // 使用修改后的 storage
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
      } else {
          cb(new Error('不支持的文件类型'));
      }
  }
});
// 静态资源中间件（关键修改）
app.use('/avatar', express.static(path.join(parentDir, 'avatar')));
// 新增：头像存储配置
// const avatarStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // 从查询参数获取用户ID
//     const userId = req.query.userId;
//     //console.log('收到的查询参数:', req.query); // 调试日志

//     if (!userId) {
//       //console.error('错误：未收到用户ID');
//       return cb(new Error('USER_ID_REQUIRED'), null);
//     }

//     const avatarPath = path.join(__dirname, '..', 'avatar', userId);
//     //console.log('头像存储路径:', avatarPath); // 调试日志

//     // 创建目录（如果不存在）
//     if (!fs.existsSync(avatarPath)) {
//       fs.mkdirSync(avatarPath, { recursive: true });
//     }
//     cb(null, avatarPath);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const filename = `${Date.now()}${ext}`;
//     cb(null, filename);
//   }
// });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.query.userId; // 从查询参数获取
    if (!userId) return cb(new Error('USER_ID_REQUIRED'), null);
    
    const uploadPath = path.join(parentDir, 'avatar', userId);
    fs.mkdirSync(uploadPath, { recursive: true }); // 自动创建目录
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const avatarUpload = multer({ storage: avatarStorage });

// 头像上传路由
// app.post('/api/upload-avatar', (req, res, next) => {
//   //console.log('请求到达，查询参数:', req.query); // 调试中间件
//   next();
// }, avatarUpload.single('avatar'), (req, res) => {
//   if (req.file) {
//     res.json({
//       avatarUrl: `/avatar/${req.query.userId}/${req.file.filename}`
//     });
//   } else {
//     res.status(400).json({ error: 'FILE_UPLOAD_FAILED' });
//   }
// });
app.post('/api/upload-avatar', avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'UPLOAD_FAILED' });
  
  // 返回完整访问路径
  const avatarUrl = `http://localhost:4000/avatar/${req.query.userId}/${req.file.filename}`;
  res.json({ avatarUrl });
});

// 统一错误处理
app.use((err, req, res, next) => {
  if (err.message === 'USER_ID_REQUIRED') {
    return res.status(400).json({ error: '用户ID未提供' });
  }
  res.status(500).json({ error: '服务器内部错误' });
});

// 设置静态文件服务（用于下载文件）
app.use('/files', express.static(path.join(__dirname, 'files')));

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
    //console.error('Error calling AI API:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      error: error.response ? error.response.data : 'Internal Server Error'
    });
  }
});
app.post('/api/analyze-file', async (req, res) => {
  try {
    const { fileData, fileType, type, question, conversation, stream } = req.body;

    if (!fileData || !fileType) {
      return res.status(400).json({ error: "fileData and fileType are required" });
    }

    const fileBuffer = Buffer.from(fileData, 'base64');

    function cleanExtractedText(text) {
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
      return text;
    }

    let extractedText = '';
    if (fileType === 'pdf') {
       // ... (PDF 处理逻辑) ...
    } else if (fileType === 'doc' || fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    extractedText = cleanExtractedText(extractedText);

    const maxContentLength = 500000;
    const truncatedText = extractedText.length > maxContentLength
      ? extractedText.substring(0, maxContentLength) + "..."
      : extractedText;

    if (type === 'summary') {
      const aiRequestBody = {
        model: "lite",
        messages: [{
          role: "user",
          content: `请为以下文档内容生成一个摘要：\n\n${truncatedText}`
        }],
        temperature: 0.5,
        max_tokens: 1000,
        stream: true, //  开启流式
      };

        const aiResponse = await axios.post('https://spark-api-open.xf-yun.com/v1/chat/completions', aiRequestBody, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.XF_API_PASSWORD}`
            },
          responseType: 'stream', //  重要:  流式响应
       });

      //  设置响应头,  SSE
       res.setHeader('Content-Type', 'text/event-stream');
       res.setHeader('Cache-Control', 'no-cache');
       res.setHeader('Connection', 'keep-alive');
    
       aiResponse.data.on('data', (chunk) => {
        const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
         for (const line of lines) {
           if (line.startsWith('data:')) {
             const dataStr = line.replace(/^data:/, '').trim();
              if (dataStr !== '[DONE]') {
                try {
                    const data = JSON.parse(dataStr);
                   if (data.choices && data.choices.length > 0) {
                      const delta = data.choices[0].delta;
                      if (delta && delta.content) {
                        // 逐字发送
                        for (const char of delta.content) {
                          res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
                          }
                           }
                        }
                  } catch (error) {
                   //console.error('解析JSON失败:', error);
                 }
               }
            }
           }
         });

       aiResponse.data.on('end', () => {
       res.write('data: [DONE]\n\n');  //  发送 [DONE] 标记
       res.end(); //  结束响应
       });

    } else if (type === 'question') {
        //  ... (question 处理逻辑,  与 summary 类似,  也要逐字拆分)

       if (!question) {
        return res.status(400).json({ error: 'Question is required for question type' });
        }
     const messages = [
       { role: 'system', content: '你是一个文档助手，你的任务是根据提供的文档内容回答用户的问题。' },
       { role: 'user', content: `文档内容:\n${truncatedText}` }
     ];

   if (conversation && Array.isArray(conversation)) {
       const filteredConversation = conversation.filter(item => !(item.role === 'assistant' && item.content === ''));
       messages.push(...filteredConversation);
     }
     messages.push({ role: 'user', content: question });
      const aiRequestBody = {
       model: "lite",
       messages: messages,
       temperature: 0.5,
       max_tokens: 4096, //可以适当调小，按需处理
       stream: true
     };

     const aiResponse = await axios.post('https://spark-api-open.xf-yun.com/v1/chat/completions', aiRequestBody, {
         headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${process.env.XF_API_PASSWORD}`
           },
         responseType: 'stream'
      });


   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Connection', 'keep-alive');

       //  *** 关键修改:  逐字/逐词拆分 (与 summary 类似) ***
      aiResponse.data.on('data', (chunk) => {
        const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
         for (const line of lines) {
            if (line.startsWith('data:')) {
             const dataStr = line.replace(/^data:/, '').trim();
              if (dataStr !== '[DONE]') {
                 try {
                      const data = JSON.parse(dataStr);
                    if (data.choices && data.choices.length > 0) {
                      const delta = data.choices[0].delta;
                     if (delta && delta.content) {
                           // 逐字发送
                        for (const char of delta.content) {
                           res.write(`data: ${JSON.stringify({ content: char })}\n\n`); // 发送单个字符,  注意格式
                          }
                      }
                   }
               } catch (error) {
                   //console.error('解析JSON失败:', error);
               }
             }
         }
     }
         });

  aiResponse.data.on('end', () => {
    res.write('data: [DONE]\n\n');  // 发送 [DONE] 标记
    res.end();
   });
    }
 else {
       return res.status(400).json({ error: 'Invalid analysis type' });
   }
 }
  catch (error) {
           //console.error('文件分析出错:', error);
           let errorMessage = "文件分析失败"; // 默认错误消息
         if (error.response) {
            // 来自服务器的错误响应 (有状态码)
            errorMessage = error.response.data?.error || error.response.statusText;
         } else if (error.request) {
         // 请求已发送，但没有收到响应 (网络错误)
             errorMessage =               "无法连接到服务器";
            } else {
                // 其他错误 (例如代码中的错误)
                errorMessage = error.message;
            }
            return res.status(500).json({ error: errorMessage });
        }
    });
           

 
//   文件上传 (只处理上传)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const fileInfo = {
      id: req.file.filename.split('-')[0],
      fileName: req.file.originalname, // 直接使用原始文件名
      fileType: req.file.mimetype.split('/')[1],
      fileSizeMB: (req.file.size / (1024 * 1024)).toFixed(2),
      uploadDate: new Date()
    };
    res.json({ file: fileInfo });
  } catch (error) {
    res.status(500).json({ error: '上传失败' });
  }
});

//  获取文件列表
app.get('/api/files', (req, res) => {
  const uploadPath = path.join(__dirname, 'uploads');
  fs.readdir(uploadPath, (err, files) => {
      if (err) {
          console.error('读取文件列表出错:', err);
          return res.status(500).json({ error: '无法读取文件列表' });
      }

      const fileDetails = [];
      files.forEach(file => {
          const filePath = path.join(uploadPath, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory()) return;

          const fileExt = path.extname(file).toLowerCase();
          const fileNameWithoutExt = path.basename(file, fileExt); // UUID部分

          fileDetails.push({
              id: fileNameWithoutExt.split('-')[0],  // 只保留UUID
              fileName: getOriginalFileName(file),       //  提取原始文件名
              fileType: fileExt.slice(1),
              fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
              uploadDate: stats.birthtime,
          });
      });
      res.json(fileDetails);

  });
});

// 从UUID文件名中提取原始文件名 (辅助函数)
function getOriginalFileName(uuidFileName) {
  const parts = uuidFileName.split('-');
  if (parts.length > 1) {
      //  找到第一个破折号后的所有内容
     return parts.slice(1).join('-');
   }
   return uuidFileName;
 }
//  文件下载
app.get('/api/download/:fileId', (req, res) => {
  const fileName = `${originalName}${fileExt}`;
  const encodedFileName = encodeURIComponent(fileName)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A');

  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodedFileName}`
  );
  const { fileId } = req.params;
  const uploadPath = path.join(__dirname, 'uploads');

  //  使用  glob  来查找文件 (更安全,  避免路径遍历)
  const files = fs.readdirSync(uploadPath);
  const matchingFiles = files.filter(file => file.startsWith(fileId));


  if (matchingFiles.length === 0) {
      return res.status(404).json({ error: '文件未找到' });
  }
  const file = matchingFiles[0];
  const filePath = path.join(uploadPath, file);
  const fileExt = path.extname(file);
  const originalName = getOriginalFileName(file);
  const downloadFileName = originalName + fileExt
  //  设置响应头
    res.setHeader('Content-Disposition', `attachment; filename=${downloadFileName}`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
      console.error('文件流读取错误:', err);
      res.status(500).json({ error: '文件下载失败' });
  });
});

//  文件删除 (新增)
app.delete('/api/delete/:fileId', (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
      return res.status(400).json({ error: '缺少 fileId' });
  }

  const uploadPath = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadPath);
  const matchingFiles = files.filter(file => file.startsWith(fileId));

  if (matchingFiles.length === 0) {
      return res.status(404).json({ error: '文件未找到' });
  }
  const fileName = matchingFiles[0];
  const filePath = path.join(uploadPath, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件未找到' });
}
try{
    fs.unlinkSync(filePath); // 删除文件
    res.json({ message: '文件删除成功' });
  }
  catch (error) {
      console.error('删除文件出错:', error);
      res.status(500).json({ error: '文件删除失败' }); // 统一错误消息
  }
});
//生成摘要
app.get('/api/generate-summary', async (req, res) => {
  const fileId = req.query.fileId;

  if (!fileId) {
    return res.status(400).json({ error: '缺少 fileId' });
  }

  const uploadPath = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadPath);
  const matchingFiles = files.filter(file => file.startsWith(fileId));

  if (matchingFiles.length === 0) {
    return res.status(404).json({ error: '文件未找到' });
  }

  const fileName = matchingFiles[0];
  const filePath = path.join(uploadPath, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件未找到' });
  }

  const fileExt = path.extname(fileName).toLowerCase();

    try {
      let extractedText = '';

      if (fileExt === '.pdf') {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        for (const page of pages) {
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
      } else if (['.doc', '.docx'].includes(fileExt)) {
        const docBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        extractedText = result.value;
          // 清理 mammoth 提取的文本中的特殊字符和多余空格
          extractedText = extractedText.replace(/[\t\n\r\f\v]/g, ' ') // 移除特殊空白符
                                    .replace(/ {2,}/g, ' ')        // 将多个空格替换为单个空格
                                     .replace(/#/g, ''); // 移除 # 符号
      } else {
        return res.status(400).json({ error: '不支持的文件类型' });
      }

      if (!extractedText) {
        return res.status(400).json({ error: '无法提取文本内容' });
      }
        // 调用讯飞星火大模型
      const aiRequestBody = {
        model: "lite",
        messages: [{
            role: "user",
            content: `请为以下文档内容生成一个摘要：\n\n${extractedText}`
        }],
        temperature: 0.5,
        max_tokens: 1000,
        stream: true, // 开启流式
      };
  const aiResponse = await axios.post('https://spark-api-open.xf-yun.com/v1/chat/completions', aiRequestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XF_API_PASSWORD}`
    },
    responseType: 'stream'
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    aiResponse.data.on('data', (chunk) => {
    const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          let dataStr = line.substring(5).trim();
            if (dataStr !== '[DONE]') {
              try {
                  const parsedData = JSON.parse(dataStr);
                  const content = parsedData.choices[0]?.delta?.content;
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } catch (parseError) {
                    console.error("AI 响应解析错误:", parseError, "原始数据:", dataStr);
                }
            }
           else { // 收到 [DONE]
             res.write('data: [DONE]\n\n');  // 明确发送 [DONE]
              }
          }
      }
    });
      aiResponse.data.on('end', () => {
          console.log("AI 响应流结束"); // 调试日志
          res.end();
      });

    aiResponse.data.on('error', (err) => {
      console.error("AI 响应流错误:", err);
      res.status(500).write('data: {"error": "生成摘要时发生错误"}\n\n');
      res.end();
    });

    } catch (error) {
    console.error('生成摘要出错 (详细):', error.response || error);
      return res.status(500).json({ error: "生成摘要失败" });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  //console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
