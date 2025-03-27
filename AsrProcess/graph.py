import matplotlib
matplotlib.use('QtAgg')
import matplotlib.pyplot as plt
import numpy as np

# 解决中文显示问题
plt.rcParams['font.sans-serif'] = ['SimHei']  # 设置中文字体为黑体
plt.rcParams['axes.unicode_minus'] = False  # 正确显示负号

# 数据
tool_types = ["知识共享工具", "版本控制工具", "配置管理工具", "容器管理工具",
              "源码静态分析工具", "自动化测试工具", "持续集成工具", "部署自动化工具", "监测工具"]
tools = [
    ["Confluence", "Jira", "Rocket Chat"],
    ["Git", "GitHub", "GitLab\nCI/CD", "SVN", "Bitbucket"],
    ["Ansible", "Puppet", "Chef"],
    ["Docker", "Kubernetes"],
    ["SonarQube", "Analizo"],
    ["JUnit", "Selenium", "Ranorex", "Test.ai"],
    ["Jenkins", "GitLab\nCI/CD", "Travis CI"],
    ["Terraform"],
    ["Nagios", "Zabbix", "Prometheus", "Grafana", "Graylog", "ELK\nStack"]
]
counts = [
    [2, 6, 1],
    [15, 14, 7, 2, 3],
    [6, 9, 7],
    [16, 9],
    [3, 2],
    [2, 4, 1, 1],
    [11, 4, 2],
    [4],
    [4, 5, 6, 4, 4, 3]
]

# 自定义柔和颜色方案
soft_colors = [
    '#B2DF8A',  # 浅绿
    '#A6CEE3',  # 浅蓝
    '#CAB2D6',  # 浅紫
    '#FB9A99',  # 浅粉
    '#FDBF6F',  # 浅橙
    '#FFFF99',  # 浅黄
    '#B15928',  # 浅棕
    '#E31A1C',  # 浅红
    '#33A02C',  # 深绿
    '#1F78B4',  # 深蓝
    '#6A3D9A',  # 深紫
    '#FF7F00',  # 深橙
    '#FFD700',  # 金色
    '#C0C0C0',  # 银色
    '#A9A9A9',  # 灰色
    '#000000',  # 黑色
]

# 绘制堆叠条形图
bar_width = 0.6
index = np.arange(len(tool_types))  # X轴位置
plt.figure(figsize=(16, 8))

for i in range(len(tool_types)):
    bottom = 0
    for j in range(len(counts[i])):
        # 使用柔和颜色方案
        plt.bar(index[i], counts[i][j], width=bar_width, bottom=bottom,
                color=soft_colors[j % len(soft_colors)])
        # 添加工具名称和次数标签
        plt.text(index[i], bottom + counts[i][j]/2,
                 f"{tools[i][j]}  {counts[i][j]}",
                 ha="center", va="center", fontsize=10)
        bottom += counts[i][j]

# 设置标签和标题
plt.xlabel("工具类型", fontsize=12)
plt.ylabel("提及次数", fontsize=12)
plt.title("不同类型工具在文献中的提及次数统计", fontsize=14)
plt.xticks(index, tool_types, rotation=45, ha="right")

# 去掉黑色边框，仅保留X轴和Y轴
ax = plt.gca()  # 获取当前轴
ax.spines['top'].set_visible(False)    # 去掉上边框
ax.spines['right'].set_visible(False)  # 去掉右边框
ax.spines['bottom'].set_visible(True)  # 保留下边框（X轴）
ax.spines['left'].set_visible(True)    # 保留左边框（Y轴）

plt.tight_layout()
plt.show()