import matplotlib
matplotlib.use('TkAgg')  # 指定使用 TkAgg 后端
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 阶段名称和核心内容
stages = [
    "初始评估与目标设定",
    "传播协作文化",
    "架构部署与组织调整",
    "自动化管道建设",
    "监控与反馈优化",
    "成果评估与持续改进"
]
descriptions = [
    "分析现状，设定目标",
    "推广协作文化",
    "调整架构与组织",
    "构建自动化管道",
    "监控与反馈优化",
    "评估成果，持续改进"
]

# 颜色
colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#9467bd", "#d62728", "#bcbd22"]

# 创建图形
fig, ax = plt.subplots(figsize=(12, 4))

# 绘制阶段图形
for i, (stage, desc, color) in enumerate(zip(stages, descriptions, colors)):
    hexagon = patches.RegularPolygon((i * 2, 0), numVertices=6, radius=1, facecolor=color, edgecolor="black")
    ax.add_patch(hexagon)
    ax.text(i * 2, 0, stage, ha="center", va="center", fontsize=10, color="white")
    ax.text(i * 2, -1.5, desc, ha="center", va="center", fontsize=8)

# 绘制箭头
for i in range(len(stages) - 1):
    ax.arrow(i * 2 + 0.8, 0, 0.4, 0, head_width=0.2, head_length=0.2, fc="black", ec="black")

# 设置图形范围
ax.set_xlim(-1, len(stages) * 2 - 1)
ax.set_ylim(-2, 1)
ax.axis("off")

# 保存图片（可选）
plt.savefig("devops_model.png", dpi=300, bbox_inches="tight")

# 显示图形
plt.show()