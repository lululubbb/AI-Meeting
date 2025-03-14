from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
import os
import json
from pydantic import BaseModel
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

async def generate_optimized_text(text: str):
    """
    使用OpenAI API优化文本并流式返回优化结果。
    """
    try:
        stream = client.chat.completions.create(
            model="deepseek-v3-241226",  # 新的模型
            messages=[
                {"role": "system", "content": "你是人工智能助手，把下面ASR的结果进行优化"}, # 简化 prompt
                {"role": "user", "content": text},
            ],
            stream=True,
        )

        for chunk in stream:
            if chunk.choices:
                choice = chunk.choices[0]
                if choice.delta.content:
                    yield choice.delta.content  # 直接 yield 优化后的文本

    except Exception as e:
        print(f"Error during text optimization: {e}")
        yield json.dumps({"error": "优化过程中出现错误。"}) + "\n"  # 错误处理仍然返回 JSON


@app.post("/api/optimize")
async def optimize(request: Request, optimization_request: OptimizationRequest):
     return StreamingResponse(generate_optimized_text(optimization_request.text), media_type="text/plain") #改回text/plain

if __name__ == "__main__":
    import uvicorn
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    uvicorn.run(app, host="0.0.0.0", port=8899)
