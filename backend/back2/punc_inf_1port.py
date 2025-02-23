# -*- coding: utf-8 -*-
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from funasr import AutoModel
import re
import torch
import uvicorn

# 检查CUDA是否可用
if torch.cuda.is_available():
    device = "cuda"
    print("CUDA可用，使用GPU进行推理。")
else:
    device = "cpu"
    print("CUDA不可用，使用CPU进行推理。")

# 初始化模型
model = AutoModel(model="ct-punc", device=device, disable_update=True)


def remove_non_chinese_english(text: str) -> str:
    """
    移除非中英文字符，仅保留中英文字符。
    """
    chinese_english_characters = re.findall(r'[\u4e00-\u9fffA-Za-z]', text)
    return ''.join(chinese_english_characters)


# FastAPI 应用实例
app = FastAPI()

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许的源（可以设置为具体的前端地址，比如 "http://localhost:8080"）
    allow_credentials=True,
    allow_methods=["*"],  # 允许的 HTTP 方法
    allow_headers=["*"],  # 允许的 HTTP 请求头
)


# 请求数据模型
class TextRequest(BaseModel):
    text: str  # 输入的长字符串


@app.post("/process_text/")
async def process_text(request: TextRequest):
    """
    接收前端发送的文本数据，调用模型推理，并返回结果。
    """
    # 清理输入文本
    clean_text = remove_non_chinese_english(request.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="输入文本中不包含中文字符，请检查输入。")

    # 调用模型进行推理
    try:
        res = model.generate(input=clean_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"模型推理出错：{e}")

    # 返回推理结果
    return {"input": clean_text, "result": res}


# WebSocket 连接管理器
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


# 创建 WebSocket 管理器实例
manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 端点，用于接收和处理客户端的实时消息。
    """
    await manager.connect(websocket)
    try:
        while True:
            # 接收消息
            data = await websocket.receive_text()
            print(f"接收到客户端消息: {data}")

            # 清理并处理输入文本
            clean_text = remove_non_chinese_english(data)
            if not clean_text:
                await manager.send_message("输入文本中不包含中文字符，请检查输入。", websocket)
                continue

            # 调用模型进行推理
            try:
                res = model.generate(input=clean_text)[0]['text']
            except Exception as e:
                await manager.send_message(f"模型推理出错: {e}", websocket)
                continue

            # 返回推理结果
            await manager.send_message(res, websocket)
    except WebSocketDisconnect:
        print("客户端断开连接")
        manager.disconnect(websocket)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
