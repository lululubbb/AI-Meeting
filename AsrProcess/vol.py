from openai import OpenAI
import os
from pprint import pprint

# 初始化Openai客户端
client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key="af7fce6d-5bac-469e-bc84-54087604ea49",  # 替换为您的API Key
)

message = """
"的严峻，他是蔓延寻求3月4日国际肥胖日留业涛发表了一项涵盖204个国家和地区数据的最新最全面研究。1990到2021年，全球应对肥胖危危机严重失败，25岁及以上成年人称重和肥胖的人数从7.31亿增加到21.1亿。5岁到24岁儿"
"""

# 流式输出
print("----- streaming request -----")
stream = client.chat.completions.create(
    model="deepseek-r1-distill-qwen-32b-250120",  # 你的模型名称
    messages=[
        {"role": "system", "content": "你是人工智能助手,需要帮我把ASR转录结果进行优化，记住只发送优化后的结果即可其他什么也不要发送"},  # 增加了让模型输出推理过程的提示
        {"role": "user", "content": message},
    ],
    stream=True,
)

for chunk in stream:
    if chunk.choices:
        choice = chunk.choices[0]
        if choice.delta.content:
            print(choice.delta.content, end="")
        if hasattr(choice.delta, 'reasoning_content') and choice.delta.reasoning_content:  # 检查reasoning_content是否存在
            print(choice.delta.reasoning_content, end="")

print()  # 换行
