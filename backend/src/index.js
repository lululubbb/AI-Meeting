// server.js

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws'; 
import { fileURLToPath } from 'url';
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
import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import pdfPoppler from 'pdf-poppler';
import fs from 'fs';
import path from 'path';
import { Client } from './trans.js'; // 引入翻译模块 (确保路径正确)
import crypto from 'crypto';


import pdfParse from 'pdf-parse';


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

app.use(express.json({ limit: '100mb', charset: 'utf-8' })); // 增加请求体大小限制 (例如 50MB)
app.use(express.urlencoded({ limit: '100mb', extended: true, charset: 'utf-8'  })); // 也要增加 urlencoded 的限制

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
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       const uploadPath = path.join(__dirname, 'uploads');
//       if (!fs.existsSync(uploadPath)) {
//           fs.mkdirSync(uploadPath);
//       }
//       cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//       const uniqueId = uuidv4();
//       const fileExt = path.extname(file.originalname);
//       const originalName = file.originalname; // 原始文件名
//       const finalName = `${uniqueId}--${originalName}`; // 使用双破折号分隔
//       console.log(`[文件上传] 存储文件名: ${finalName}（原始文件名: ${originalName}）`);
//       cb(null, finalName);
//   }
// });

// 文件存储配置（关键修改）
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath);
//     }
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueId = uuidv4();
//     const encodedOriginalName = encodeURIComponent(file.originalname); // 编码原始文件名
//     const finalName = `${uniqueId}--${encodedOriginalName}`; // 使用编码后的名称
//     console.log(`[文件上传] 存储文件名: ${finalName}（原始文件名: ${file.originalname}）`);
//     cb(null, finalName);
//   }
// });
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
      const finalName = `${uniqueId}--${originalName}`; // 使用双破折号分隔
      console.log(`[文件上传] 存储文件名: ${finalName}（原始文件名: ${originalName}）`);
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

// 新增: 翻译路由
app.post('/api/translate', async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  try {
    const translatedText = await Client.translate(text, sourceLanguage, targetLanguage);
    res.json({ translated: translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

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
    if (fileType === '.pdf') {
      console.log('开始解析 PDF 文件:', filePath);
      const dataBuffer = fs.readFileSync(filePath);

      try {
          // 尝试使用 pdf-parse 解析
          const data = await pdfParse(dataBuffer);
          extractedText = data.text;

          if (extractedText.length === 0) {
              // 若解析结果为空，尝试将 PDF 转换为图像并进行 OCR 处理
              console.log('pdf-parse 解析结果为空，尝试将 PDF 转换为图像并进行 OCR 处理...');

              // 定义转换选项
              const options = {
                  format: 'png',
                  out_dir: path.dirname(filePath),
                  out_prefix: path.basename(filePath, path.extname(filePath)),
                  page: null // 处理所有页面
              };

              // 执行 PDF 到图像的转换
              const outputFiles = await pdfPoppler.convert(filePath, options);
              console.log('PDF 已成功转换为图像，但 OCR 功能未启用，跳过识别');
              for (const outputFile of outputFiles) {
                  const { data: { text } } = await Tesseract.recognize(
                      outputFile,
                      'chi_sim', // 如果是中文文档，使用 'chi_sim'
                      {
                          logger: m => console.log(m)
                      }
                  );
                  extractedText += text;
              }

                 // 完成 OCR 处理后，删除生成的 PNG 文件
              for (const outputFile of outputFiles) {
                try {
                  fs.unlinkSync(outputFile);
                  console.log(`已删除临时文件: ${outputFile}`);
                } catch (deleteError) {
                  console.error(`删除临时文件 ${outputFile} 时出错:`, deleteError);
                }
              }               

              if (extractedText.length === 0) {
                  // 若 OCR 处理后仍为空，尝试使用 pdfjs-dist 解析
                  console.log('由于 OCR 功能未启用，且 pdfjs-dist 解析已禁用，无法处理扫描件或图片型 PDF');      
                  const pdfData = new Uint8Array(dataBuffer);
                  const loadingTask = pdfjsLib.getDocument(pdfData);
                  const pdfDoc = await loadingTask.promise;
                  for (let i = 1; i <= pdfDoc.numPages; i++) {
                      const page = await pdfDoc.getPage(i);
                      const content = await page.getTextContent();
                      const pageText = content.items.map(item => item.str).join(' ');
                      extractedText += pageText;
                  }
              }
          }
          console.log('PDF 解析完成，提取文本长度:', extractedText.length);
      } catch (pdfError) {
          console.error('解析 PDF 文件出错:', pdfError);
          return res.status(500).json({ error: 'PDF 文件解析失败，请检查文件是否损坏' });
      }
    } 
      else if (fileType === 'doc' || fileType === 'docx') {
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
                  const parsedData = JSON.parse(dataStr);
                  const content = parsedData.choices[0]?.delta?.content;
                  if (content) {
                    // 去除多余空格和换行符
                    const cleanedContent = content.trim().replace(/\s+/g, ' ');
                    if (cleanedContent) {
                      res.write(`data: ${JSON.stringify({ content: cleanedContent })}\n\n`);

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


// //  获取文件列表
// app.get('/api/files', (req, res) => {
//   const uploadPath = path.join(__dirname, 'uploads');
//   fs.readdir(uploadPath, (err, files) => {
//       if (err) {
//           console.error('读取文件列表出错:', err);
//           return res.status(500).json({ error: '无法读取文件列表' });
//       }

//       const fileDetails = [];
//       files.forEach(file => {
//           const filePath = path.join(uploadPath, file);
//           const stats = fs.statSync(filePath);

//           if (stats.isDirectory()) return;

//           const fileExt = path.extname(file).toLowerCase();
//           const fileNameWithoutExt = path.basename(file, fileExt); // UUID部分

//           const originalName = getOriginalFileName(file);
//           // 确保文件名以 UTF-8 编码返回
//           //const encodedOriginalName = Buffer.from(originalName, 'binary').toString('utf8');
//           const encodedOriginalName = iconv.decode(Buffer.from(originalName, 'binary'), 'utf-8');

//           fileDetails.push({
//               id: fileNameWithoutExt.split('-')[0],  // 只保留UUID
//               fileName: encodedOriginalName,       //  提取原始文件名
//               fileType: fileExt.slice(1),
//               fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
//               uploadDate: stats.birthtime,
//           });
//       });
//       console.log('返回的文件列表:', fileDetails); // 添加日志确认返回的数据
//       res.json(fileDetails);

//   });
// });

// 修改版
// 获取文件列表路由（优化解析逻辑）
// server.js 中文件列表路由（/api/files）
// 文件列表路由（/api/files）
app.get('/api/files', (req, res) => {
  const uploadPath = path.join(__dirname, 'uploads');
  
  fs.readdir(uploadPath, { encoding: 'utf8' }, (err, files) => { // 显式指定UTF-8编码
    if (err) {
      console.error('读取文件列表出错:', err);
      return res.status(500).json({ error: '无法读取文件列表' });
    }

    const fileDetails = files.map(file => {
      try {
        const filePath = path.join(uploadPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) return null;

        // 关键修改：解析文件名并解码URL编码
        const [uuid, encodedOriginalName] = file.split('--', 2);
        const originalName = decodeURIComponent(encodedOriginalName); // 解码URL编码

        return {
          id: uuid,
          fileName: originalName, // 使用解码后的名称
          fileType: path.extname(originalName).slice(1), // 从解码后的名称获取扩展名
          fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          uploadDate: stats.birthtime
        };
      } catch (error) {
        console.error('文件解析错误:', file, error);
        return null;
      }
    }).filter(Boolean);

    console.log('返回的文件列表:', fileDetails);
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
// app.get('/api/download/:fileId', (req, res) => {
//   const { fileId } = req.params;
//   const uploadPath = path.join(__dirname, 'uploads');
//   const files = fs.readdirSync(uploadPath);
//   const matchingFiles = files.filter(file => file.startsWith(fileId));

//   if (matchingFiles.length === 0) {
//       return res.status(404).json({ error: '文件未找到' });
//   }

//   const file = matchingFiles[0];
//   const filePath = path.join(uploadPath, file);
//   const originalName = getOriginalFileName(file); // 获取原始文件名 (包含扩展名)
//   // const encodedFileName = encodeURIComponent(originalName)
//   //   .replace(/['()]/g, escape)
//   //   .replace(/\*/g, '%2A');


//   // 设置响应头 (Content-Disposition)
//   res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
//   res.setHeader('Content-Type', 'application/octet-stream');

//   // 创建文件流并发送
//   const fileStream = fs.createReadStream(filePath);
//   fileStream.pipe(res);

//   fileStream.on('error', (err) => {
//     console.error('文件流读取错误:', err);
//     res.status(500).json({ error: '文件下载失败' });
//   });
// });


// 文件下载路由（简化解析逻辑）
app.get('/api/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const uploadPath = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadPath);

  // 查找匹配的文件（关键修改）
  const matchingFiles = files.filter(file => {
    const [uuid] = file.split('--', 2);
    return uuid === fileId;
  });

  if (matchingFiles.length === 0) {
    return res.status(404).json({ error: '文件未找到' });
  }

  const storedFileName = matchingFiles[0];
  const filePath = path.join(uploadPath, storedFileName);
  const [uuid, originalName] = storedFileName.split('--', 2);

  console.log(`[文件下载] UUID: ${uuid}, 原始文件名: ${originalName}`);

  // 设置响应头（关键修改）
  res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    console.error('文件流读取错误:', err);
    res.status(500).json({ error: '文件下载失败' });
  });
});


// 文件删除路由（优化匹配逻辑）
app.delete('/api/delete/:fileId', (req, res) => {
  const { fileId } = req.params;
  const uploadPath = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadPath);
  
  // 查找匹配的文件（关键修改）
  const matchingFiles = files.filter(file => {
    const [uuid] = file.split('--', 2);
    return uuid === fileId;
  });

  if (matchingFiles.length === 0) {
    return res.status(404).json({ error: '文件未找到' });
  }

  const fileName = matchingFiles[0];
  const filePath = path.join(uploadPath, fileName);
  const [uuid, originalName] = fileName.split('--', 2);

  console.log(`[文件删除] UUID: ${uuid}, 原始文件名: ${originalName}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件未找到' });
  }

  try {
    fs.unlinkSync(filePath);
    console.log(`[文件删除] 成功删除文件: ${filePath}`);
    res.json({ message: '文件删除成功' });
  } catch (error) {
    console.error('删除文件出错:', error);
    res.status(500).json({ error: '文件删除失败' });
  }
});



// 手动实现 Promise.withResolvers 以兼容旧版本 Node.js
if (!Promise.withResolvers) {
  Promise.withResolvers = () => {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
      });
      return { promise, resolve, reject };
  };
}

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
  let extractedText = '';

   // 创建临时目录
  const tempDir = path.join(__dirname, 'temp', Date.now().toString());
  fs.mkdirSync(tempDir, { recursive: true });
  
    try { 

      if (fileExt === '.pdf') {
        console.log('开始解析 PDF 文件:', filePath);
        const dataBuffer = fs.readFileSync(filePath);

        try {
            // 尝试使用 pdf-parse 解析
            const data = await pdfParse(dataBuffer);
            extractedText = data.text;

            if (extractedText.length === 0) {
                // 若解析结果为空，尝试将 PDF 转换为图像并进行 OCR 处理
                console.log('pdf-parse 解析结果为空');

                // 定义转换选项
                const options = {
                    format: 'png',
                    out_dir: tempDir,
                    out_prefix: path.basename(filePath, path.extname(filePath)),
                    page: null // 处理所有页面
                };

               // 执行 PDF 到图像的转换
                const outputFiles = await pdfPoppler.convert(filePath, options);

                for (const outputFile of outputFiles) {
                    const { data: { text } } = await Tesseract.recognize(
                        outputFile,
                        'chi_sim', // 如果是中文文档，使用 'chi_sim'
                        {
                            logger: m => console.log(m)
                        }
                    );
                    extractedText += text;
                }

                   // 完成 OCR 处理后，删除生成的 PNG 文件
                for (const outputFile of outputFiles) {
                  try {
                    fs.unlinkSync(outputFile);
                    console.log(`已删除临时文件: ${outputFile}`);
                  } catch (deleteError) {
                    console.error(`删除临时文件 ${outputFile} 时出错:`, deleteError);
                  }
                }               

                if (extractedText.length === 0) {
                    // 若 OCR 处理后仍为空，尝试使用 pdfjs-dist 解析
                    console.log('pdf-parse 解析结果为空，但 OCR 功能的Tesseract依赖无法配置，跳过 OCR 步骤');
                    const pdfData = new Uint8Array(dataBuffer);
                    const loadingTask = pdfjsLib.getDocument(pdfData);
                    const pdfDoc = await loadingTask.promise;
                    for (let i = 1; i <= pdfDoc.numPages; i++) {
                        const page = await pdfDoc.getPage(i);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(' ');
                        extractedText += pageText;
                    }
                }
            }
            console.log('PDF 解析完成，提取文本长度:', extractedText.length);
        } catch (pdfError) {
            console.error('解析 PDF 文件出错:', pdfError);
            return res.status(500).json({ error: 'PDF 文件解析失败，请检查文件是否损坏' });
        }
      } 
        else if (['.doc', '.docx'].includes(fileExt)) {
        const docBuffer = fs.readFileSync(filePath);
        try{
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        extractedText = result.value;
          // 清理 mammoth 提取的文本中的特殊字符和多余空格
          extractedText = extractedText.replace(/[\t\n\r\f\v]/g, ' ') // 移除特殊空白符
                                    .replace(/ {2,}/g, ' ')        // 将多个空格替换为单个空格
                                     .replace(/#/g, ''); // 移除 # 符号
        console.log('Word 文件解析成功');
      } catch (wordError) {
        console.error('Word 文件解析错误:', wordError);
        return res.status(500).json({ error: 'Word 文件解析失败，请检查文件是否损坏' });
    }
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
                // 检查是否有错误码
                if (parsedData.code) {
                    console.error("AI 接口返回错误:", parsedData.message);
                    res.status(500).write(`data: {"error": "${parsedData.message}"} \n\n`);
                    continue;
                }
                const content = parsedData.choices[0]?.delta?.content;
                if (content) {
                    for (let i = 0; i < content.length; i++) {
                        const char = content[i];
                        const escapedChar = char.replace(/\n/g, '\\n');
                        console.log('Sending character:', escapedChar);
                        res.write(`data: ${JSON.stringify({ content: escapedChar })}\n\n`);
                    }
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
  }finally {
    // 删除临时目录及其所有内容
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`已删除临时目录: ${tempDir}`);
    } catch (err) {
      console.error('删除临时目录失败:', err);
    }
  }
});

// --- 1. 录屏相关配置 ---

// 1.1 设置保存录像的目录 (recordings 文件夹在 backend 同级目录下)
const recordingsDir = path.join(__dirname, '..', 'recordings');  // .. 表示上级目录
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true }); // 递归创建目录
}

// 1.2 创建 WebSocketServer (noServer: true，表示不启动独立的 HTTP 服务器)
const wss = new WebSocketServer({ noServer: true });

// 1.3 WebSocket 连接事件 (处理客户端连接)
wss.on('connection', (ws) => {
  console.log('客户端已连接 (WebSocket)');

  // 1.3.1 生成唯一的文件名 (使用时间戳)
  const fileName = `recording-${Date.now()}.webm`;
  const filePath = path.join(recordingsDir, fileName);

  // 1.3.2 创建文件写入流
  const fileStream = fs.createWriteStream(filePath);

  // 1.3.3 监听 message 事件 (接收来自客户端的视频数据)
  ws.on('message', (message) => {
    try {
      // 将接收到的 ArrayBuffer 数据写入文件
      fileStream.write(Buffer.from(message));
    } catch (error) {
      console.error('写入文件流时出错:', error);
       if (fileStream) {
         fileStream.end();  // 出错时，确保关闭文件流
       }
    }
  });

  // 1.3.4 监听 close 事件 (客户端断开连接)
  ws.on('close', () => {
    console.log('客户端已断开连接 (WebSocket)');
    fileStream.end(() => {
      console.log('录制文件已保存:', filePath);
    });
  });

    //1.3.5 error
    ws.on('error',(error)=>{
        console.error('错误',error);
        if(fileStream) fileStream.end();
    });

});
const getMaterials = (dirPath, relativePath = '') => {
  const items = fs.readdirSync(dirPath);
  const result = [];
  for (const item of items) {
      try {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
              result.push({
                  id: path.join(relativePath, item), // 使用相对路径作为 ID
                  name: item,
                  type: 'directory',
                  children: getMaterials(fullPath, path.join(relativePath, item)), // 递归
              });
          } else if (stat.isFile()) {
              result.push({
                  id: path.join(relativePath, item),
                  name: item,
                  type: 'file',
                  size: stat.size,
              });
          }
      } catch (error) {
          console.error("处理文件/文件夹时出错:", error, item);
      }
  }
  return result;
};

// 为智能体API创建代理路由
app.post('/api/proxy/agent/execute', async (req, res) => {
  try {
    // 从请求体中获取所有参数
    const { id, input, sid, stream } = req.body;
    
    // 获取appKey和appSecret
    const APP_KEY = process.env.APP_KEY || "hengnaoyam8i78QnY8j0HkOyT0f";
    const APP_SECRET = process.env.APP_SECRET || "uu3rcxiwlkupwo493b4g5exdwvwsvya5";
    const BASE_URL = process.env.BASE_URL || "https://www.das-ai.com";
    
    // 生成签名
    const timestamp = Date.now();
    const data = `${timestamp}\n${APP_SECRET}\n${APP_KEY}`;
    const hmacSha256 = crypto.createHmac('sha256', APP_SECRET);
    hmacSha256.update(data);
    const sign = `${timestamp}${hmacSha256.digest('base64')}`;
    
    // 设置请求头
    const headers = {
      'appKey': APP_KEY,
      'sign': sign,
      'Content-Type': 'application/json'
    };
    
    if (stream) {
      headers['Accept'] = 'text/event-stream';
    }
    
    // 准备请求体
    const payload = { id, input, sid, stream };
    
    // 转发请求到智能体API
    const apiUrl = `${BASE_URL}/open/api/v2/agent/execute`;
    
    if (stream) {
      // 处理流式响应
      const response = await axios({
        method: 'post',
        url: apiUrl,
        data: payload,
        headers: headers,
        responseType: 'stream'
      });
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 将流式数据转发给客户端
      response.data.pipe(res);
    } else {
      // 处理非流式响应
      const response = await axios({
        method: 'post',
        url: apiUrl,
        data: payload,
        headers: headers
      });
      
      // 将响应数据发送给客户端
      res.json(response.data);
    }
  } catch (error) {
    console.error('代理请求失败:', error);
    res.status(500).json({
      error: error.response ? error.response.data : '代理请求失败'
    });
  }
});


app.get('/api/materials', (req, res) => {
  const materialsDir = path.join(__dirname, 'public', 'materials'); // 正确！
  console.log(materialsDir);
  try {
      const materials = getMaterials(materialsDir);
      res.status(200).json(materials);
  } catch (error) {
      console.error("获取资料列表失败:", error);
      res.status(500).send({ error: '无法获取资料列表' });
  }
});

// 2. 提供文件下载的 API (根据路径参数)
app.get('/api/downloadMaterial', (req, res) => {
  const relativeFilePath = req.query.path; // 从查询参数获取相对路径
  if (!relativeFilePath) {
      return res.status(400).send({ error: '缺少文件路径参数' });
  }

  // 修正: 使用 materialsDir，不再使用 process.cwd()
  const materialsDir = path.join(__dirname, 'public', 'materials');
  const fullFilePath = path.join(materialsDir, relativeFilePath);

  fs.access(fullFilePath, fs.constants.F_OK, (err) => {
      if (err) {
          console.error('文件不存在或不可访问:', err, fullFilePath);
          return res.status(404).send({ error: '文件未找到' });
      }
      // 使用 res.download()
      res.download(fullFilePath, (err) => {
          if (err) {
              console.error('下载出错：', err);
              res.status(500).send({ error: "下载出错" });
          }
      }); // 设置响应头
  });
});

// // --- 百度地图 Web 服务 API 代理 ---
// const BAIDU_API_BASE = 'https://api.map.baidu.com';
// const BAIDU_MAP_WEB_AK = process.env.BAIDU_MAP_AK; // 从环境变量获取 AK

// if (!BAIDU_MAP_WEB_AK) {
//     console.error("错误：未在环境变量中设置 BAIDU_MAP_AK！");
//     // 在开发环境中可能不退出，但在生产环境中应考虑退出或抛出错误
//     // process.exit(1);
// }

// /**
//  * 统一的百度 Web API 代理请求处理器
//  * @param {string} baiduEndpoint 目标百度 API 路径 (e.g., '/geocoding/v3/')
//  * @param {import('express').Request} req Express 请求对象
//  * @param {import('express').Response} res Express 响应对象
//  */
// async function handleBaiduApiProxy(baiduEndpoint, req, res) {
//     if (!BAIDU_MAP_WEB_AK) {
//         return res.status(500).json({ error: '服务器未配置百度地图 AK' });
//     }

//     // 1. 获取前端传递的查询参数
//     const frontendQueryParams = req.query;
//     console.log(`[Proxy][${baiduEndpoint}] Received params from frontend:`, frontendQueryParams);

//     // 2. 准备请求百度的参数 (合并前端参数，并强制添加 AK 和 output=json)
//     const baiduRequestParams = {
//         ...frontendQueryParams,
//         ak: BAIDU_MAP_WEB_AK, // 使用服务器端 AK
//         output: 'json',     // 确保返回 JSON
//         // 注意：coord_type 和 ret_coordtype 如果前端传了就用，没传用默认或由百度API决定
//     };

//     // 3. 构建请求百度的完整 URL
//     const targetUrl = `${BAIDU_API_BASE}${baiduEndpoint}`;
//     console.log(`[Proxy][${baiduEndpoint}] Requesting Baidu API: ${targetUrl}`);

//     try {
//         // 4. 使用 axios 从后端服务器发起请求
//         const baiduResponse = await axios.get(targetUrl, {
//             params: baiduRequestParams,
//             timeout: 10000 // 设置 10 秒超时
//         });

//         console.log(`[Proxy][${baiduEndpoint}] Baidu API Response Status:`, baiduResponse.status);
//         // 5. 将百度 API 的响应直接转发给前端
//         // 设置响应头 Content-Type 为 application/json
//         res.setHeader('Content-Type', 'application/json; charset=utf-8');
//         res.status(baiduResponse.status).json(baiduResponse.data);

//     } catch (error) {
//         console.error(`[Proxy][${baiduEndpoint}] Error requesting Baidu API:`, error.message);
//         // 处理请求百度 API 时的错误
//         if (error.response) {
//             // 请求成功发出，但百度服务器返回了错误状态码 (4xx, 5xx)
//             console.error('[Proxy] Baidu API Error Response Data:', error.response.data);
//             res.status(error.response.status).json({
//                 error: `地图服务错误: ${error.response.statusText}`,
//                 details: error.response.data // 可以选择性地将百度返回的错误细节也传回前端
//             });
//         } else if (error.request) {
//             // 请求已发出，但没有收到响应 (网络问题, 超时)
//             console.error('[Proxy] No response received from Baidu API:', error.request);
//              res.status(504).json({ error: '无法连接到地图服务或请求超时' });
//         } else {
//             // 设置请求时发生错误
//              console.error('[Proxy] Error setting up request to Baidu API:', error.message);
//              res.status(500).json({ error: '代理服务器内部错误' });
//         }
//     }
// }

// // 地理编码代理接口 (地址 -> 坐标)
// app.get('/api/map/geocode', async (req, res) => {
//     // 验证前端是否传递了 address 参数
//     if (!req.query.address) {
//         return res.status(400).json({ error: '缺少 address 参数' });
//     }
//     await handleBaiduApiProxy('/geocoding/v3/', req, res);
// });

// // 逆地理编码代理接口 (坐标 -> 地址)
// app.get('/api/map/reverse-geocode', async (req, res) => {
//     // 验证前端是否传递了 location 参数 (格式: lat,lng)
//     if (!req.query.location || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(req.query.location)) {
//         return res.status(400).json({ error: '缺少或无效的 location 参数 (格式: lat,lng)' });
//     }
//     await handleBaiduApiProxy('/reverse_geocoding/v3/', req, res);
// });

// // 统一的路线规划代理接口
// app.get('/api/map/plan-route', async (req, res) => {
//     const { origin, destination, mode } = req.query;
//     // 简单验证必要参数
//     if (!origin || !destination || !mode) {
//         return res.status(400).json({ error: '缺少 origin, destination 或 mode 参数' });
//     }
//     if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(origin) || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(destination)) {
//         return res.status(400).json({ error: '无效的 origin 或 destination 坐标格式 (应为: lat,lng)' });
//     }

//     let baiduEndpoint = '';
//     switch (mode) {
//         case 'driving': baiduEndpoint = '/directionlite/v1/driving'; break;
//         case 'walking': baiduEndpoint = '/directionlite/v1/walking'; break;
//         case 'riding': baiduEndpoint = '/directionlite/v1/riding'; break;
//         case 'transit': baiduEndpoint = '/directionlite/v1/transit'; break;
//         default:
//             return res.status(400).json({ error: `不支持的 mode: ${mode}` });
//     }
//     // 将 mode 参数从 query 中移除，因为它已经用来确定 endpoint 了
//     // 其他参数如 tactics, waypoints 等会通过 ...req.query 传递
//     const { mode: removedMode, ...restQuery } = req.query;
//     req.query = restQuery; // 更新 req.query 以传递给 handleBaiduApiProxy

//     await handleBaiduApiProxy(baiduEndpoint, req, res);
// });

// // (可选) 批量算路代理接口 - 需要根据具体 API 实现
// app.get('/api/map/bulk-route', async (req, res) => {
//     // 获取参数 (例如 origins, destinations, mode)
//     const { mode } = req.query;
//     let baiduEndpoint = '';
//     // 根据 mode 选择合适的百度批量 API 端点
//     switch (mode) {
//          case 'driving': baiduEndpoint = '/routematrix/v2/driving'; break; // 示例：驾车距离矩阵
//          // case 'walking': baiduEndpoint = '/routematrix/v2/walking'; break;
//          // case 'riding': baiduEndpoint = '/routematrix/v2/riding'; break;
//         default:
//              return res.status(400).json({ error: `批量计算不支持的 mode: ${mode}` });
//     }
//     // 验证其他必要参数...
//     if (!req.query.origins || !req.query.destinations) {
//          return res.status(400).json({ error: '批量计算缺少 origins 或 destinations 参数' });
//     }

//     const { mode: removedMode, ...restQuery } = req.query;
//     req.query = restQuery;

//     await handleBaiduApiProxy(baiduEndpoint, req, res);
// });



// 2.1 启动 Express 应用 (并获取 HTTP 服务器对象)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
});

// 2.2 处理 upgrade 请求 (将 HTTP 连接升级为 WebSocket)
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);  // 触发 connection 事件
  });
});