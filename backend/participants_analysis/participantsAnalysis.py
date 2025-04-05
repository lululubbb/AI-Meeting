from flask import Flask, request, jsonify
import numpy as np
from sentence_transformers import SentenceTransformer, util
from flask_cors import CORS
import os 
import torch
# --- 新增：导入 PII 处理逻辑 ---
from pii_logic import load_ner_pipeline, detect_and_desensitize_pii_enhanced

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- 新增：应用启动时加载 NER 模型 ---
print("[Main App] 尝试在应用启动时加载 PII NER 模型...")
# 注意：模型文件默认会缓存到 ~/.cache/huggingface/hub
# 如果需要指定缓存目录，可以设置环境变量 TRANSFORMERS_CACHE
# os.environ['TRANSFORMERS_CACHE'] = '/path/to/your/cache'
ner_pipeline_instance, loaded_model_name = load_ner_pipeline()
if ner_pipeline_instance:
    print(f"[Main App] PII NER 模型 '{loaded_model_name}' 加载成功。")
else:
    print("[Main App] 警告：PII NER 模型加载失败。PII 过滤功能将主要依赖正则表达式。")


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

# === 新增：PII 检测与脱敏 API 路由 ===
@app.route('/api/pii-filter', methods=['POST'])
def pii_filter_route():
    print('\n[Main App] 收到 /api/pii-filter 请求')
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "请求体必须是 JSON 格式"}), 400

        input_text = data.get('text')
        if not input_text or not isinstance(input_text, str):
            return jsonify({"error": '请求体必须包含一个名为 "text" 的字符串字段。'}), 400

        if not ner_pipeline_instance:
             print("[Main App] 警告: PII NER 模型未加载，处理将仅依赖 Regex。")
             # 如果模型未加载，你也可以选择返回错误：
             # return jsonify({"error": "PII 处理服务暂时不可用（模型加载失败）"}), 503

        print("[Main App] 开始 PII 检测与脱敏...")
        start_time = torch.cuda.Event(enable_timing=True) if torch and torch.cuda.is_available() else None # 用于计时 (可选)
        if start_time: start_time.record()

        # 调用核心处理逻辑，传入加载好的模型实例
        desensitized_text, pii_info = detect_and_desensitize_pii_enhanced(
            input_text,
            ner_pipeline_instance # <--- 传入实例
            # ner_confidence_threshold=0.6 # 可选：如果需要覆盖默认阈值
        )

        if start_time:
            end_time = torch.cuda.Event(enable_timing=True)
            end_time.record()
            torch.cuda.synchronize()
            duration = start_time.elapsed_time(end_time)
            print(f"[Main App] PII 处理完成，耗时: {duration:.2f} ms (GPU)")
        else:
             # 简单的 CPU 计时
             import time
             # (需要将 start_time = time.time() 放在调用前)
             # duration = (time.time() - start_time) * 1000
             print(f"[Main App] PII 处理完成。") # 简单打印

        # 返回脱敏后的文本
        # 你可以选择只返回脱敏文本，或包含检测到的 PII 详情
        response_data = {
            'desensitizedText': desensitized_text
            # 'detectedPiiDetails': pii_info # 可选
        }
        print('[Main App] PII 过滤响应已发送')
        return jsonify(response_data)

    except Exception as e:
        print(f"[Main App] 处理 /api/pii-filter 时发生严重错误: {e}")
        # import traceback; traceback.print_exc() # 打印详细堆栈信息以供调试
        return jsonify({"error": "处理 PII 过滤请求时发生内部服务器错误。"}), 500

if __name__ == '__main__':
    app.run(debug=True)