import os
from openai import OpenAI

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中
# 初始化Openai客户端，从环境变量中读取您的API Key
client = OpenAI(
    # 此为默认路径，您可根据业务所在地域进行配置
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    # 从环境变量中获取您的 API Key
    api_key="af7fce6d-5bac-469e-bc84-54087604ea49",
)
message=""""
所以，普通学生就算比较清醒的认识到，自己的考试能力，也总可以见你离自己最近的一个小目标。希望多稳定一些，重复练习，用量变换来 复古 复古和老师也会反复强调一点，和学生共同制造的长期的那 茭米这家日本的案例证明，分层不是问题，只要愤怒相对简单，学生相对就能更轻 但是，
"""
# Streaming:
print("----- streaming request -----")
stream = client.chat.completions.create(
    # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
    model="deepseek-v3-241226",
    messages=[
        {"role": "system", "content": "你是人工智能助手，把下面ASR的结果进行优化"},
        {"role": "user", "content": message},
    ],
    # 响应内容是否流式返回
    stream=True,
)
for chunk in stream:
    if not chunk.choices:
        continue
    print(chunk.choices[0].delta.content, end="")
print()