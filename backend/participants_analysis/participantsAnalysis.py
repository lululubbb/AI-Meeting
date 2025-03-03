from flask import Flask, request, jsonify
import numpy as np
from sentence_transformers import SentenceTransformer, util
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# 1. 行为参与度计算（保持不变）
def calculate_behavior_score(camera_on_times, camera_duration, audio_on_times, audio_duration, share_on_times,
                             share_duration, message_count, total_duration):
    # 参与频度
    BE_f = camera_on_times + audio_on_times + share_on_times + message_count

    # 参与广度
    BE_b = (camera_duration + audio_duration + share_duration) / total_duration if total_duration > 0 else 0

    # 参与深度
    BE_d = (camera_on_times + audio_on_times + share_on_times + message_count) / 6 if 6 > 0 else 0

    # 标准化为百分制
    BE_f_norm = min(BE_f / max(BE_f, 1), 1) * 100  # 频度标准化
    BE_b_norm = BE_b * 100  # 广度已经是 [0, 1] 范围，直接乘以 100
    BE_d_norm = BE_d / max(BE_d, 1) * 100  # 深度标准化

    # 权重
    w1, w2, w3 = 0.4, 0.3, 0.3

    # 综合行为参与度得分
    BE = w1 * BE_f_norm + w2 * BE_b_norm + w3 * BE_d_norm

    return BE


# 2. 认知参与度计算（使用 Sentence-BERT）
def calculate_cognitive_score(messages, topic_keywords):
    if not messages:
        return 0
    # 加载预训练的 Sentence-BERT 模型
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # 将消息和主题关键词编码为向量
    message_embeddings = model.encode(messages)
    topic_embedding = model.encode([topic_keywords])

    # 计算余弦相似度
    similarities = util.cos_sim(message_embeddings, topic_embedding).numpy()

    # 认知参与度得分（取平均值并转换为百分制）
    CE = np.mean(similarities) * 100

    return CE


# 3. 综合参与度计算（保持不变）
def calculate_participation_score(BE, CE):
    # 权重
    w4, w5 = 0.6, 0.4

    # 综合参与度得分
    PE = w4 * BE + w5 * CE

    return PE


@app.route('/analyze-participation', methods=['POST'])
def analyze_participation():
    data = request.get_json()
    participants = data.get('participants', [])
    topic_keywords = data.get('topicKeywords', '')
    meeting_id = data.get('meetingId')

    results = []
    for participant in participants:
        camera_on_times = participant.get('cameraOnTimes', 0)
        camera_duration = participant.get('cameraDuration', 0)
        audio_on_times = participant.get('audioOnTimes', 0)
        audio_duration = participant.get('audioDuration', 0)
        share_on_times = participant.get('shareOnTimes', 0)
        share_duration = participant.get('shareDuration', 0)
        message_count = participant.get('messageCount', 0)
        total_duration = participant.get('totalDuration', 0)
        messages = participant.get('messages', [])
        userId = participant.get('userId')
        userName = participant.get('userName')
        role = participant.get('role')
        print(f"处理参与者 - 用户 ID: {userId}, 用户名: {userName}, 角色: {role}")
        # 计算行为参与度
        BE = calculate_behavior_score(camera_on_times, camera_duration, audio_on_times, audio_duration,
                                      share_on_times, share_duration, message_count, total_duration)

        # 计算认知参与度
        CE = calculate_cognitive_score(messages, topic_keywords)

        # 计算综合参与度
        PE = calculate_participation_score(BE, CE)
        print("BE CE PE:", BE, CE, PE)
        results.append({
            'userId': userId,
            'userName': userName,
            'role': role,
            'behaviorScore': BE,
            'cognitiveScore': CE,
            'participationScore': PE
        })

        # 返回结果时包含会议 ID
    return jsonify({
        'meetingId': meeting_id,
        'results': results
    })


if __name__ == '__main__':
    app.run(debug=True)