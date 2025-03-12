const express = require('express');
const app = express();
const cors = require('cors');
const { pipeline } = require('@xenova/transformers');
const { cosineSimilarity } = require('mathjs');
const path = require('path');

// 允许跨域请求
app.use(cors());
app.use(express.json());

// 1. 行为参与度计算（保持不变）
function calculate_behavior_score(camera_on_times, camera_duration, audio_on_times, audio_duration, share_on_times,
    share_duration, message_count, total_duration) {
    // 参与频度
    const BE_f = camera_on_times + audio_on_times + share_on_times + message_count;

    // 参与广度
    const BE_b = total_duration > 0 ? (camera_duration + audio_duration + share_duration) / total_duration : 0;

    // 参与深度
    const BE_d = 6 > 0 ? (camera_on_times + audio_on_times + share_on_times + message_count) / 6 : 0;

    // 标准化为百分制
    const BE_f_norm = Math.min(BE_f / Math.max(BE_f, 1), 1) * 100; // 频度标准化
    const BE_b_norm = BE_b * 100; // 广度已经是 [0, 1] 范围，直接乘以 100
    const BE_d_norm = BE_d / Math.max(BE_d, 1) * 100; // 深度标准化

    // 权重
    const w1 = 0.4, w2 = 0.3, w3 = 0.3;

    // 综合行为参与度得分
    const BE = w1 * BE_f_norm + w2 * BE_b_norm + w3 * BE_d_norm;

    return BE;
}

// 2. 认知参与度计算（使用 Sentence - BERT 类似功能）
async function calculate_cognitive_score(messages, topic_keywords) {
    if (messages.length === 0) {
        return 0;
    }
    // 加载预训练的模型
    console.log('开始加载预训练模型...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('预训练模型加载完成');

    // 将消息和主题关键词编码为向量
    const message_embeddings = await Promise.all(messages.map(async (message) => {
        const embedding = await extractor(message, { pooling: 'mean', normalize: true });
        return embedding.data;
    }));

    const topic_embedding = await extractor(topic_keywords, { pooling: 'mean', normalize: true });

    // 计算余弦相似度
    const similarities = message_embeddings.map((embedding) => {
        return cosineSimilarity(embedding, topic_embedding.data);
    });

    // 认知参与度得分（取平均值并转换为百分制）
    const CE = (similarities.reduce((sum, value) => sum + value, 0) / similarities.length) * 100;

    return CE;
}

// 3. 综合参与度计算（保持不变）
function calculate_participation_score(BE, CE) {
    // 权重
    const w4 = 0.6, w5 = 0.4;

    // 综合参与度得分
    const PE = w4 * BE + w5 * CE;

    return PE;
}

app.post('/analyze-participation', async (req, res) => {
    console.log('收到 /analyze-participation 请求');
    const data = req.body;
    const participants = data.participants || [];
    const topic_keywords = data.topicKeywords || '';
    const meeting_id = data.meetingId;

    console.log(`请求中的会议 ID: ${meeting_id}`);
    console.log(`请求中的参与者数量: ${participants.length}`);

    const results = [];
    for (const participant of participants) {
        const camera_on_times = participant.cameraOnTimes || 0;
        const camera_duration = participant.cameraDuration || 0;
        const audio_on_times = participant.audioOnTimes || 0;
        const audio_duration = participant.audioDuration || 0;
        const share_on_times = participant.shareOnTimes || 0;
        const share_duration = participant.shareDuration || 0;
        const message_count = participant.messageCount || 0;
        const total_duration = participant.totalDuration || 0;
        const messages = participant.messages || [];
        const userId = participant.userId;
        const userName = participant.userName;
        const role = participant.role;
        console.log(`处理参与者 - 用户 ID: ${userId}, 用户名: ${userName}, 角色: ${role}`);

        // 计算行为参与度
        const BE = calculate_behavior_score(camera_on_times, camera_duration, audio_on_times, audio_duration,
            share_on_times, share_duration, message_count, total_duration);

        // 计算认知参与度
        const CE = await calculate_cognitive_score(messages, topic_keywords);

        // 计算综合参与度
        const PE = calculate_participation_score(BE, CE);
        console.log("BE CE PE:", BE, CE, PE);

        results.push({
            userId,
            userName,
            role,
            behaviorScore: BE,
            cognitiveScore: CE,
            participationScore: PE
        });
    }

    // 返回结果时包含会议 ID
    res.json({
        meetingId: meeting_id,
        results
    });
    console.log('响应已发送');
});

const port = process.env.PORT || 3554;
app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
});