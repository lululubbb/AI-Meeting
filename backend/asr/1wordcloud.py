
import numpy as np
from PIL import Image
from wordcloud import WordCloud
import jieba
def fun_str2cloud(mask_path, text, resultpath):
    # 使用jieba进行中文分词
    word_list = jieba.cut(text, cut_all=False)
    word_str = ' '.join(word_list)

    mask = np.array(Image.open(mask_path))
    wordcloud = WordCloud(background_color="white",
                          width=800,
                          height=600,
                          max_words=200,
                          max_font_size=80,
                          mask=mask,
                          contour_width=3,
                          contour_color='steelblue',
                          font_path="SimHei.ttf").generate(word_str)
    # 将生成的词云图保存为图片
    wordcloud.to_file(resultpath)
if __name__ == '__main__':
    fun_str2cloud("../情感分析+返回/filled_star.png", "嗨，我是通义灵码，你的智能编码助手。你可以问我编码相关的问题，或提交反馈让我变得更好。通过帮助文档或官网，可以了解更多我的能力、动态及企业版信息。 更详细的诉求描述和更多的上下文（如文件、图片、提", "./asd.png")