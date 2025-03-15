from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
import os
import json
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

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


@app.post("/api/optimize")
async def optimize(request: Request, optimization_request: OptimizationRequest):
    return StreamingResponse(generate_optimized_text(optimization_request.text), media_type="text/plain")


@app.post("/api/summarize")
async def summarize(request: Request, summarization_request: SummarizationRequest):
    return StreamingResponse(generate_summary(summarization_request.texts), media_type="text/plain")


@app.post("/api/extract_keywords")
async def extract_keywords(request: Request, keyword_extraction_request: KeywordExtractionRequest):
    return StreamingResponse(generate_keywords(keyword_extraction_request.texts), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    uvicorn.run(app, host="0.0.0.0", port=8899)
