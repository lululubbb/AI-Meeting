# -*- coding: utf-8 -*-
from funasr import AutoModel
# 初始化模型并指定设备为GPU
model = AutoModel(model="ct-punc", device="cuda",disable_update=True)
while 1:
    text=input("请输入文本：")
    # 使用模型生成结果
    res = model.generate(input=text)
    print(res)

