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


message="""
"的严峻，他是蔓延寻求3月4日国际肥胖日留业涛发表了一项涵盖204个国家和地区数据的最新最全面研究。1990到2021年，全球应对肥胖危危机严重失败，25岁及以上成年人称重和肥胖的人数从7.31亿增加到21.1亿。5岁到24岁儿"
"""

# Non-streaming:
print("----- standard request -----")
completion = client.chat.completions.create(
    # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
    model="deepseek-r1-distill-qwen-32b-250120",
    messages=[
        {"role": "system", "content": "你是人工智能助手,需要帮我把ASR转录结果进行优化"},
        {"role": "user", "content": message},
    ],
)
print(completion.choices[0].message.content)


# Streaming:
print("----- streaming request -----")
stream = client.chat.completions.create(
    # 指定您创建的方舟推理接入点 ID，此处已帮您修改为您的推理接入点 ID
    model="deepseek-r1-distill-qwen-32b-250120",
    messages=[
        {"role": "system", "content": "你是人工智能助手,需要帮我把ASR转录结果进行优化"},
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