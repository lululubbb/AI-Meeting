from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse # 导入 JSONResponse
from openai import OpenAI
import os
import json
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
# 新增导入
import jieba
import jieba.analyse
from collections import Counter
import requests


app = FastAPI()

# 允许跨域请求 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化OpenAI客户端
client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key="af7fce6d-5bac-469e-bc84-54087604ea49",  # 您的API Key
)

class OptimizationRequest(BaseModel):
    text: str


class SummarizationRequest(BaseModel):
    texts: List[str]  # 接收文本列表


class KeywordExtractionRequest(BaseModel):
    texts: List[str]

class OverallSummarizationRequest(BaseModel):
    text: str

class TodosAndExtensionsRequest(BaseModel):
    text: str

#新增 词云
class WordCloudRequest(BaseModel):
    text: str

async def generate_optimized_text(text: str):
    try:
        stream = client.chat.completions.create(
            model="deepseek-v3-241226",
            messages=[
                {"role": "system", "content": "你是人工智能助手，把下面ASR的结果进行优化(重点：不用用### 来做标题得区分 只给总结后内容然后必须是md格式 关键词要加粗,适当分段增加小标题等，但是小标题 不用用 #这种 而是用加粗 然后换行来显示小标题)"},
                {"role": "user", "content": text},
            ],
            stream=True,
        )

        for chunk in stream:
            if chunk.choices:
                choice = chunk.choices[0]
                if choice.delta.content:
                    yield choice.delta.content

    except Exception as e:
        print(f"Error during text optimization: {e}")
        yield json.dumps({"error": "优化过程中出现错误。"}) + "\n"


async def generate_summary(texts: List[str]):
    """生成摘要"""
    try:
        for i, text in enumerate(texts):
            stream = client.chat.completions.create(
                model="deepseek-v3-241226",
                messages=[
                    {"role": "system", "content": "你是人工智能助手，请总结以下文本(重点：只给总结后内容然后必须是md格式 关键词要加粗,适当分段增加小标题等，但是小标题 不用用 #这种 而是用加粗 然后换行来显示小标题)"},
                    {"role": "user", "content": text},
                ],
                stream=True
            )
            yield json.dumps({"segment": i}) + "\n"  # 先发送段落编号
            for chunk in stream:
                if chunk.choices:
                    choice = chunk.choices[0]
                    if choice.delta.content:
                        yield choice.delta.content
            yield json.dumps({"segment_end": i}) + "\n"  # 段落结束标志

    except Exception as e:
        print(f"Error during summarization: {e}")
        yield json.dumps({"error": "摘要生成过程中出现错误。"}) + "\n"


async def generate_keywords(texts: List[str]):
    """生成关键词"""
    try:
        for i, text in enumerate(texts):
            stream = client.chat.completions.create(
                model="deepseek-v3-241226",
                messages=[
                    {"role": "system", "content": "你是人工智能助手，请提取以下文本的关键词"},
                    {"role": "user", "content": text},
                ],
                stream=True
            )
            yield json.dumps({"segment": i}) + "\n"  # 先发送段落编号
            for chunk in stream:
                if chunk.choices:
                    choice = chunk.choices[0]
                    if choice.delta.content:
                        yield choice.delta.content
            yield json.dumps({"segment_end": i}) + "\n"  # 段落结束标志

    except Exception as e:
        print(f"Error during keyword extraction: {e}")
        yield json.dumps({"error": "关键词提取过程中出现错误。"}) + "\n"

async def generate_overall_summary(text: str):
    """生成会议整体摘要"""
    try:
        stream = client.chat.completions.create(
            model="deepseek-v3-241226",
            messages=[
                {"role": "system", "content": "你是人工智能助手，请总结以下会议记录(重点：只给总结后内容然后必须是md格式 关键词要加粗,适当分段增加小标题等，但是小标题 不用用 #这种 而是用加粗 然后换行来显示小标题)"},  # 使用更具体的 prompt
                {"role": "user", "content": text},
            ],
            stream=True
        )
        for chunk in stream:
            if chunk.choices:
                choice = chunk.choices[0]
                if choice.delta.content:
                    yield choice.delta.content

    except Exception as e:
        print(f"Error during overall summarization: {e}")
        yield json.dumps({"error": "生成整体摘要过程中出现错误。"}) + "\n"

async def generate_todos_and_extensions(text: str):
    """生成会议待办与拓展"""
    try:
        stream = client.chat.completions.create(
            model="deepseek-v3-241226",
            messages=[
                {"role": "system", "content": "你是人工智能助手，请根据以下会议记录，生成待办事项和拓展任务(重点：只给总结后内容然后必须是md格式 关键词要加粗,适当分段增加小标题等，但是小标题 不用用 #这种 而是用加粗 然后换行来显示小标题)"},  # 明确的 prompt
                {"role": "user", "content": text},
            ],
            stream=True
        )
        for chunk in stream:
            if chunk.choices:
                choice = chunk.choices[0]
                if choice.delta.content:
                    yield choice.delta.content
    except Exception as e:
        print(f"Error during todos and extensions generation: {e}")
        yield json.dumps({"error": "生成待办与拓展过程中出现错误"}) + "\n"

# 新增：生成词云数据的函数
def generate_keywords_for_wordcloud(text, top_k=50, stop_words_url="https://raw.githubusercontent.com/goto456/stopwords/master/cn_stopwords.txt", allowed_pos=('n', 'nr', 'ns', 'nt', 'eng', 'v', 'vn')):
    """
    生成用于词云的关键词及权重。
    """
    try:
        # 1. 获取在线停用词
        try:
            response = requests.get(stop_words_url)
            response.raise_for_status()
            stop_words = set(response.text.splitlines())
        except requests.exceptions.RequestException as e:
            print(f"获取停用词失败: {e}, 使用jieba默认")
            stop_words = set() #jieba 内置

        # 2. 使用 jieba 分词并提取关键词，返回权重
        words = jieba.analyse.extract_tags(text, topK=top_k, withWeight=True, allowPOS=allowed_pos) # withWeight 改为 True
        filtered_words = [(word, weight) for word, weight in words if word not in stop_words and len(word) > 1] #同时过滤词语

        # 不需要 Counter 统计, 直接返回
        return [{"name": word, "value": weight*1000} for word, weight in filtered_words] # 格式化


    except Exception as e:
        print(f"生成词云数据时发生错误: {e}")
        return []



@app.post("/api/optimize")
async def optimize(request: Request, optimization_request: OptimizationRequest):
    return StreamingResponse(generate_optimized_text(optimization_request.text), media_type="text/plain")


@app.post("/api/summarize")
async def summarize(request: Request, summarization_request: SummarizationRequest):
    return StreamingResponse(generate_summary(summarization_request.texts), media_type="text/plain")


@app.post("/api/extract_keywords")
async def extract_keywords(request: Request, keyword_extraction_request: KeywordExtractionRequest):
    return StreamingResponse(generate_keywords(keyword_extraction_request.texts), media_type="text/plain")

@app.post("/api/overall_summarize")
async def overall_summarize(request: Request, overall_summarization_request: OverallSummarizationRequest):
    return StreamingResponse(generate_overall_summary(overall_summarization_request.text), media_type="text/plain")

@app.post("/api/todos_and_extensions")
async def todos_and_extensions(request: Request, todos_and_extensions_request: TodosAndExtensionsRequest):
    return StreamingResponse(generate_todos_and_extensions(todos_and_extensions_request.text), media_type="text/plain")

# 新增：词云 API
@app.post("/api/generate_wordcloud")
async def generate_wordcloud_api(request: Request, wordcloud_request: WordCloudRequest):
    wordcloud_data = generate_keywords_for_wordcloud(wordcloud_request.text)
    return JSONResponse(content=wordcloud_data)  # 使用 JSONResponse 返回


if __name__ == "__main__":
    import uvicorn
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    uvicorn.run(app, host="0.0.0.0", port=8899)
