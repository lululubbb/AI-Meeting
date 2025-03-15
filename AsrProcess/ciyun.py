import jieba
import jieba.analyse
from collections import Counter

def generate_keywords(text, top_k=20, stop_words_url="https://raw.githubusercontent.com/goto456/stopwords/master/cn_stopwords.txt"):
    """
    输入长字符串，输出排名后的关键词（去除在线停用词）。

    Args:
        text: 输入的长字符串。
        top_k:  返回的关键词数量，默认为 20。
        stop_words_url:  在线停用词列表的 URL，默认为常用中文停用词。

    Returns:
        一个列表，包含排名靠前的关键词。
    """

    # 1. 获取在线停用词
    try:
        import requests  # 导入 requests 库
        response = requests.get(stop_words_url)
        response.raise_for_status()  # 如果请求失败，抛出异常
        stop_words = set(response.text.splitlines())
      
    except requests.exceptions.RequestException as e:
        print(f"获取停用词失败: {e}")
        print("将使用 jieba 内置停用词") # 使用jieba 内置
        stop_words = set() # jieba 内置的停用词,不需要额外下载,直接使用
    
    # 2. 使用 jieba 分词，并移除停用词
    # words = jieba.cut(text) #精确模式
    words = jieba.analyse.extract_tags(text, topK=None, withWeight=False, allowPOS=())  # 使用 TF-IDF 提取关键词，不过滤词性,withWeight 是否返回权重
    filtered_words = [word for word in words if word not in stop_words and len(word) > 1] # 过滤词长=1

    # 3. 统计词频 使用Counter 统计
    word_counts = Counter(filtered_words)

    # 4. 获取 top_k 关键词
    top_keywords = [word for word, count in word_counts.most_common(top_k)]
    # top_keywords = word_counts.most_common(top_k) #返回的是列表内元组

    return top_keywords




# 示例用法
long_text = """
Python是一种高级的、解释型的、通用的编程语言。它的设计哲学强调代码的可读性，
并允许开发者用少量代码表达想法。Python支持多种编程范式，包括面向对象、命令式、
函数式和过程式编程。Python拥有庞大且活跃的社区，提供了丰富的第三方库，
可以应用于Web开发、数据科学、机器学习、人工智能、自动化脚本等领域。
由于其易学性和广泛的应用，Python已成为最受欢迎的编程语言之一。Python 的标准库
提供了广泛的功能，例如文本/二进制数据处理、数学运算、文件 I/O、网络编程、
多线程等，这使得 Python 成为一个“内置电池”的语言。Python 解释器本身
也可以通过 C 或 C++（或其他可以从 C 调用的语言）扩展新功能和数据类型。
Python 也可用作定制软件中的扩展语言。
"""

keywords = generate_keywords(long_text)
print(keywords)

# 可以更改停用词 URL 测试不同的停用词表
# keywords = generate_keywords(long_text, stop_words_url="https://example.com/another_stopwords.txt")

# 使用jieba内置的停用词表(如果下载失败，则使用这个)
#keywords = generate_keywords(long_text, stop_words_url="")
#print(keywords)


#更复杂的例子，包括错误处理 和  词性筛选
def generate_keywords_advanced(text, top_k=20, stop_words_url="https://raw.githubusercontent.com/goto456/stopwords/master/cn_stopwords.txt", allowed_pos=('n', 'nr', 'ns', 'nt', 'eng', 'v', 'vn')):
    """
    输入长字符串，输出排名后的关键词（去除在线停用词），并进行词性筛选和错误处理。

    Args:
        text: 输入的长字符串。
        top_k:  返回的关键词数量，默认为 20。
        stop_words_url:  在线停用词列表的 URL，默认为常用中文停用词。
        allowed_pos: 允许的词性元组，默认为 ('n', 'nr', 'ns', 'nt', 'eng', 'v', 'vn')，
                     表示名词、人名、地名、机构名、英文、动词、动名词。

    Returns:
        一个列表，包含排名靠前的关键词，如果发生错误则返回空列表。
    """

    try:
        # 1. 获取在线停用词
        try:
            import requests
            response = requests.get(stop_words_url)
            response.raise_for_status()
            stop_words = set(response.text.splitlines())
        except requests.exceptions.RequestException as e:
            print(f"获取停用词失败: {e}, 使用jieba默认")
            stop_words = set() #jieba 内置

        # 2. 使用 jieba 分词并提取关键词，进行词性筛选
        words = jieba.analyse.extract_tags(text, topK=None, withWeight=False, allowPOS=allowed_pos)
        filtered_words = [word for word in words if word not in stop_words and len(word) > 1]

        # 3. 统计词频
        word_counts = Counter(filtered_words)

        # 4. 获取 top_k 关键词
        top_keywords = [word for word, _ in word_counts.most_common(top_k)]
        return top_keywords

    except Exception as e:
        print(f"处理文本时发生错误: {e}")
        return []


long_text_2 = """
自然语言处理（NLP）是人工智能（AI）的一个重要分支，它使计算机能够理解、解释和生成人类语言。
NLP技术广泛应用于机器翻译、情感分析、文本摘要、问答系统等领域。近年来，随着深度学习的发展，
NLP取得了显著的进步。Transformer模型，特别是BERT和GPT系列，已经在各种NLP任务中取得了最先进的成果。
这些模型通过在大规模文本数据上进行预训练，学习到了丰富的语言知识，从而能够更好地理解和生成文本。
未来，NLP有望在更多领域发挥重要作用，例如智能客服、个性化推荐、医疗诊断等。
"""

# 使用高级函数，并指定允许的词性
keywords_advanced = generate_keywords_advanced(long_text_2, top_k=15, allowed_pos=('n', 'nz', 'v', 'vn'))  # 常用词性
print(keywords_advanced)

#使用高级函数，不指定允许的词性
keywords_advanced = generate_keywords_advanced(long_text_2, top_k=15) #不指定词性
print(keywords_advanced)


