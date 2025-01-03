import uvicorn
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import base64
import os
from PIL import Image
from wordcloud import WordCloud
import jieba
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from opencc import OpenCC
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from math import pi

# 创建 FastAPI 应用
app = FastAPI()

# 添加 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 跨域支持
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 设置中文字体路径
font_path = "SimHei.ttf"  # 替换为本地中文字体路径
font_prop = FontProperties(fname=font_path)

# 情绪映射字典
label_mapping = {
    0: "平淡语气",
    1: "关切语调",
    2: "开心语调",
    3: "愤怒语调",
    4: "悲伤语调",
    5: "疑问语调",
    6: "惊奇语调",
    7: "厌恶语调"
}

# 设置字体路径，确保路径正确
font_path = "SimHei.ttf"  # 替换为本地中文字体路径

# 设置全局字体，确保所有图表都能使用该字体
from matplotlib import rcParams
rcParams['font.family'] = FontProperties(fname=font_path).get_name()

# 情绪映射字典
label_mapping = {
    0: "平淡语气",
    1: "关切语调",
    2: "开心语调",
    3: "愤怒语调",
    4: "悲伤语调",
    5: "疑问语调",
    6: "惊奇语调",
    7: "厌恶语调"
}

# 初始化模型和分词器
tokenizer, model = None, None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def initialize_model():
    global tokenizer, model
    tokenizer = AutoTokenizer.from_pretrained("Johnson8187/Chinese-Emotion")
    model = AutoModelForSequenceClassification.from_pretrained("Johnson8187/Chinese-Emotion").to(device)
    model.eval()


initialize_model()

# ====================== 功能函数 ======================

def image_to_base64(fig):
    """将 Matplotlib 图像转换为 Base64 编码"""
    buffer = BytesIO()
    fig.savefig(buffer, format="PNG")
    buffer.seek(0)
    base64_data = base64.b64encode(buffer.read()).decode('utf-8')
    buffer.close()
    return f"data:image/png;base64,{base64_data}"


def generate_wordcloud(text):
    """生成词云图并返回 Base64 编码"""
    word_list = jieba.cut(text, cut_all=False)
    word_str = ' '.join(word_list)
    mask = np.array(Image.open("filled_star.png"))
    wordcloud = WordCloud(
        font_path=font_path,
        background_color="white",
        width=800,
        height=600,
        max_words=200,
        max_font_size=80,
        mask=mask
    ).generate(word_str)
    img_buffer = BytesIO()
    wordcloud.to_image().save(img_buffer, format="PNG")
    img_buffer.seek(0)
    base64_data = base64.b64encode(img_buffer.read()).decode('utf-8')
    img_buffer.close()
    return f"data:image/png;base64,{base64_data}"


def predict_emotions(texts):
    """预测情绪并返回情绪向量"""
    emotion_vectors = []
    for text in texts:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True).to(device)
        with torch.no_grad():
            outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]
        emotion_vectors.append(probabilities)

    # 计算每个维度的平均值
    emotion_avg = np.mean(emotion_vectors, axis=0)
    emotion_probs = {label_mapping[i]: float(prob) for i, prob in enumerate(emotion_avg)}
    return emotion_probs


# def generate_bar_chart(emotion_probs):
#     """生成条形图并返回 Base64 编码"""
#     df = pd.DataFrame({
#         '情绪': list(emotion_probs.keys()),
#         '概率': list(emotion_probs.values())
#     }).sort_values(by='概率', ascending=False)
#
#     plt.figure(figsize=(8, 6))
#     colors = plt.cm.Blues(np.linspace(0.4, 0.8, len(df)))
#     plt.barh(df['情绪'], df['概率'], color=colors)
#     plt.xlabel('概率', fontproperties=font_prop)
#     plt.title('情绪分布条形图', fontproperties=font_prop)
#     plt.tight_layout()
#     base64_data = image_to_base64(plt)
#     plt.close()
#     return base64_data
def generate_bar_chart(emotion_probs):
    """生成条形图并返回 Base64 编码"""
    df = pd.DataFrame({
        '情绪': list(emotion_probs.keys()),
        '概率': list(emotion_probs.values())
    }).sort_values(by='概率', ascending=False)

    plt.figure(figsize=(8, 6))
    colors = plt.cm.Blues(np.linspace(0.4, 0.8, len(df)))
    plt.barh(df['情绪'], df['概率'], color=colors)
    plt.xlabel('概率')
    plt.title('情绪分布条形图')
    plt.tight_layout()
    base64_data = image_to_base64(plt)
    plt.close()
    return base64_data

def generate_pie_chart(emotion_probs):
    """生成饼图并返回 Base64 编码"""
    labels = list(emotion_probs.keys())
    sizes = list(emotion_probs.values())

    plt.figure(figsize=(8, 6))
    explode = [0.05] * len(labels)
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, explode=explode,
            textprops={'fontproperties': font_prop}, shadow=True)
    plt.title('情绪分布饼图', fontproperties=font_prop)
    plt.tight_layout()
    base64_data = image_to_base64(plt)
    plt.close()
    return base64_data


def generate_radar_chart(emotion_probs):
    """生成雷达图并返回 Base64 编码"""
    labels = list(emotion_probs.keys())
    values = list(emotion_probs.values())
    values += values[:1]  # 闭合雷达图

    angles = [n / float(len(labels)) * 2 * pi for n in range(len(labels))]
    angles += angles[:1]

    plt.figure(figsize=(8, 6))
    ax = plt.subplot(111, polar=True)
    plt.xticks(angles[:-1], labels, fontproperties=font_prop)
    ax.plot(angles, values, linewidth=2, linestyle='solid')
    ax.fill(angles, values, alpha=0.4)
    plt.title('情绪分布雷达图', fontproperties=font_prop)
    plt.tight_layout()
    base64_data = image_to_base64(plt)
    plt.close()
    return base64_data

# ====================== API 路由 ======================

@app.post("/generate-charts/")
async def generate_charts(text: str = Form(...)):
    """
    接收文本，生成词云图、条形图、饼图和雷达图
    """
    try:
        # 分割输入文本为句子
        sentences = [s.strip() for s in text.split("。") if s.strip()]
        emotion_probs = predict_emotions(sentences)

        # 生成图表
        wordcloud_base64 = generate_wordcloud(text)
        bar_chart_base64 = generate_bar_chart(emotion_probs)
        pie_chart_base64 = generate_pie_chart(emotion_probs)
        radar_chart_base64 = generate_radar_chart(emotion_probs)

        return {
            "wordcloud": wordcloud_base64,
            "bar_chart": bar_chart_base64,
            "pie_chart": pie_chart_base64,
            "radar_chart": radar_chart_base64
        }
    except Exception as e:
        return {"error": str(e)}


# 启动服务
if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8003)
