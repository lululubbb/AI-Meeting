from funasr import AutoModel
import asyncio
import websockets
import json
import numpy as np
import time
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("asr_server.log")
    ]
)
logger = logging.getLogger("ASR_SERVER")

# 音频参数配置
RATE = 16000
CHUNK = 960  # 60ms的音频块

# 流式模型配置
model = AutoModel(
    model="paraformer-zh-streaming",
    model_revision="v2.0.4",
    disable_update=True
)

# 流式处理参数
chunk_size_config = [0, 8, 4]  # 480ms窗口，官方推荐配置
chunk_stride = 8 * CHUNK  # 480ms的音频数据（8*960=7680样本）

# 客户端会话管理
active_sessions = {}

class ASRSession:
    def __init__(self, websocket):
        self.websocket = websocket
        self.cache = {}  # 模型缓存
        self.audio_buffer = np.array([], dtype=np.float32)  # 音频缓冲区
        self.last_text = ""  # 上一次的文本结果
        self.segments = []  # 已完成的段落
        self.current_segment = ""  # 当前正在处理的段落
        self.segment_id = 0  # 段落ID计数器
        self.last_activity = time.time()  # 最后活动时间
        self.is_processing = False  # 处理状态标志
        logger.info(f"创建新会话: {id(self)}")

    def get_timestamp(self):
        """获取当前时间戳"""
        return time.strftime("%H:%M:%S", time.localtime())

    async def send_status(self, status):
        """发送状态消息"""
        await self.websocket.send(json.dumps({
            "type": "connection_status",
            "status": status
        }))

    async def send_incremental_text(self, text):
        """发送增量文本更新"""
        self.current_segment = text
        await self.websocket.send(json.dumps({
            "type": "incremental_text",
            "full_current_segment": text
        }))

    async def complete_segment(self):
        """完成当前段落并开始新段落"""
        if self.current_segment.strip():
            self.segment_id += 1
            segment = {
                "id": self.segment_id,
                "text": self.current_segment,
                "timestamp": self.get_timestamp()
            }
            self.segments.append(segment)
            
            # 发送段落完成消息
            await self.websocket.send(json.dumps({
                "type": "segment_complete",
                "segment": segment
            }))
            
            # 重置当前段落
            self.current_segment = ""
            
            # 更新完整转录
            await self.send_full_transcription()

    async def send_full_transcription(self):
        """发送完整转录文本"""
        full_text = "\n\n".join([f"[{s['timestamp']}] {s['text']}" for s in self.segments])
        if self.current_segment:
            full_text += f"\n\n[{self.get_timestamp()}] {self.current_segment}"
            
        await self.websocket.send(json.dumps({
            "type": "full_transcription",
            "text": full_text
        }))

    async def send_all_segments(self):
        """发送所有段落"""
        await self.websocket.send(json.dumps({
            "type": "all_segments",
            "segments": self.segments
        }))

    def process_audio_chunk(self, chunk, is_final=False):
        """处理音频块并返回识别结果"""
        try:
            res = model.generate(
                input=chunk,
                cache=self.cache,
                is_final=is_final,
                chunk_size=chunk_size_config,
                encoder_chunk_look_back=4,
                decoder_chunk_look_back=1
            )
            return res[0]['text'] if res else ""
        except Exception as e:
            logger.error(f"处理音频块时出错: {e}")
            return ""

    async def handle_incremental_text(self, current_text):
        """处理增量识别结果"""
        # 更新最后活动时间
        self.last_activity = time.time()
        
        # 如果文本有变化，发送更新
        if current_text != self.last_text:
            self.last_text = current_text
            await self.send_incremental_text(current_text)
            
            # 检查是否需要分段 - 当文本超过一定长度或包含句号/问号/感叹号时
            if len(current_text) > 100 or any(char in current_text for char in "。！？.!?"):
                await self.complete_segment()
                return True
        return False

    async def process_buffer(self):
        """处理音频缓冲区"""
        if self.is_processing:
            return
            
        self.is_processing = True
        try:
            # 处理完整的音频块
            while len(self.audio_buffer) >= chunk_stride:
                # 提取处理块
                chunk = self.audio_buffer[:chunk_stride]
                self.audio_buffer = self.audio_buffer[chunk_stride:]

                # 实时识别
                current_text = self.process_audio_chunk(chunk)
                
                # 处理增量结果
                if current_text:
                    await self.handle_incremental_text(current_text)
        finally:
            self.is_processing = False

    async def finalize(self):
        """完成处理并清理资源"""
        logger.info(f"完成会话处理: {id(self)}")
        
        # 处理剩余缓冲区
        if len(self.audio_buffer) > 0:
            final_text = self.process_audio_chunk(self.audio_buffer, is_final=True)
            if final_text:
                self.current_segment = final_text
                await self.complete_segment()
        
        # 发送最终结果
        await self.send_all_segments()
        await self.send_full_transcription()

async def handle_client(websocket):
    """处理WebSocket客户端连接"""
    session_id = id(websocket)
    session = ASRSession(websocket)
    active_sessions[session_id] = session
    
    try:
        await session.send_status("已连接")
        logger.info(f"客户端已连接: {session_id}")
        
        async for message in websocket:
            try:
                # 检查是否是JSON命令
                if isinstance(message, str):
                    try:
                        data = json.loads(message)
                        if "command" in data and data["command"] == "stop":
                            logger.info(f"收到停止命令: {session_id}")
                            await session.finalize()
                            continue
                    except json.JSONDecodeError:
                        # 不是JSON，可能是旧版本的字符串消息
                        pass
                
                # 处理二进制音频数据
                if isinstance(message, bytes):
                    # 转换音频格式
                    audio_data = np.frombuffer(message, dtype=np.int16).astype(np.float32) / 32768.0
                    session.audio_buffer = np.concatenate((session.audio_buffer, audio_data))
                    
                    # 处理缓冲区
                    await session.process_buffer()
            except Exception as e:
                logger.error(f"处理消息时出错: {e}")
                await session.send_status(f"错误: {str(e)}")
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"客户端连接已关闭: {session_id}")
    except Exception as e:
        logger.error(f"处理客户端时出错: {e}")
    finally:
        # 清理会话
        if session_id in active_sessions:
            del active_sessions[session_id]
        logger.info(f"客户端会话已清理: {session_id}")

async def cleanup_inactive_sessions():
    """清理不活跃的会话"""
    while True:
        await asyncio.sleep(30)  # 每30秒检查一次
        current_time = time.time()
        inactive_sessions = []
        
        for session_id, session in active_sessions.items():
            # 如果会话超过2分钟没有活动，标记为不活跃
            if current_time - session.last_activity > 120:
                inactive_sessions.append(session_id)
        
        # 清理不活跃会话
        for session_id in inactive_sessions:
            logger.info(f"清理不活跃会话: {session_id}")
            if session_id in active_sessions:
                del active_sessions[session_id]

async def main():
    """主函数"""
    # 启动清理任务
    asyncio.create_task(cleanup_inactive_sessions())
    
    # 启动WebSocket服务器
    server = await websockets.serve(
        handle_client, 
        "localhost", 
        8000,
        ping_interval=30,
        ping_timeout=10
    )
    
    logger.info("ASR WebSocket服务器已启动，监听端口 8000")
    
    # 保持服务器运行
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("服务器已通过键盘中断停止")
    except Exception as e:
        logger.error(f"服务器运行时出错: {e}")
