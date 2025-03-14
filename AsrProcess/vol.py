from openai import OpenAI
import os
from pprint import pprint

# 请确保您已将 API Key 存储在环境变量 ARK_API_KEY 中  (示例中已将Key直接写入，如果实际使用，强烈建议用环境变量)
# 初始化Openai客户端，从环境变量中读取您的API Key 或直接使用明文（不推荐生产环境）
client = OpenAI(
    # 此为默认路径，您可根据业务所在地域进行配置
    base_url="https://ark.cn-beijing.volces.com/api/v3",  # 或您的自定义地址
    # 从环境变量中获取您的 API Key (推荐) 或 直接填写 API Key （不推荐）
    # api_key=os.environ.get("ARK_API_KEY"),  # 环境变量方式
     api_key="af7fce6d-5bac-469e-bc84-54087604ea49",   #直接写入  （你的API KEY）
)



message="""
"的严峻，他是蔓延寻求3月4日国际肥胖日留业涛发表了一项涵盖204个国家和地区数据的最新最全面研究。1990到2021年，全球应对肥胖危危机严重失败，25岁及以上成年人称重和肥胖的人数从7.31亿增加到21.1亿。5岁到24岁儿"
"""

#  单轮对话示例 (参考图片中的代码结构)
completion = client.chat.completions.create(
    # 指定您创建的推理接入点 ID
    model="deepseek-r1-distill-qwen-32b-250120",  # 你的模型名称
    messages=[
        {"role": "system", "content": "你是人工智能助手,需要帮我把ASR转录结果进行优化"}, # 系统提示词
        {"role": "user", "content": message},  # 用户输入
    ],
)

# 输出整个 completion 对象 (用于调试, 更详细的信息)
# print(completion)

# 输出模型名称 (类似于图片中的 model_dump())
# print(completion.model) # 这将直接输出model名称，不需要model_dump()

# 更简洁的输出模型名称的方法 (与原图最接近)
pprint(completion.model)

#  输出推理结果的内容 （正文）
print(completion.choices[0].message.content)
#  输出推理结果的内容 （正文）
print(completion.model_dump())


#  流式输出 (如果需要)
# print("----- streaming request -----")  # 这部分保留，结构与原代码一致
# stream = client.chat.completions.create(
#     model="deepseek-r1-distill-qwen-32b-250120",  # 你的模型名称
#     messages=[
#         {"role": "system", "content": "你是人工智能助手,需要帮我把ASR转录结果进行优化"},
#         {"role": "user", "content": message},
#     ],
#     stream=True,
# )
# for chunk in stream:
#     if chunk.choices:  #  更简洁的写法
#         print(chunk.choices[0].delta.content, end="")
# print()

