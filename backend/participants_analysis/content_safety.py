# backend/src/content_safety.py
import torch
import numpy as np
import warnings
import sys
import traceback
from typing import Dict, Optional

# 尝试导入 Detoxify
try:
    from detoxify import Detoxify
except ImportError:
    print("错误：detoxify 库未安装。请运行 'pip install detoxify'")
    # 如果 detoxify 是可选的，可以不退出，但在加载时会失败
    # sys.exit(1)
    Detoxify = None # 定义为 None，以便后续检查

# --- 全局配置 ---
warnings.filterwarnings("ignore", category=UserWarning)

# --- Detoxify 模型配置 ---
DETOXIFY_MODEL_NAME = 'original' # 或者 'unbiased', 'multilingual' 等，确保已安装
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# Detoxify 各标签的风险阈值 (匹配 'original' 模型, 其他模型标签可能不同)
# 你可以根据实际需要调整这些阈值
DETOXIFY_THRESHOLDS: Dict[str, float] = {
    'toxicity': 0.8,          # 注意: 'original' 和 'unbiased' 模型的主要标签是 'toxicity'
    'severe_toxicity': 0.5,   # 'original' 模型的标签
    'obscene': 0.8,
    'threat': 0.6,
    'insult': 0.7,
    'identity_attack': 0.6     # 'unbiased' 模型的标签是 'identity_attack'
    # 'identity_hate': 0.6    # 'original' 模型的标签是 'identity_hate'
}
# 注意：需要根据你选择的 DETOXIFY_MODEL_NAME 来确定实际存在的标签及其含义，并设置对应阈值

# --- 模型加载函数 ---
def load_detoxify_model() -> Optional[Detoxify]:
    """加载 Detoxify 模型"""
    if Detoxify is None:
        print("[Content Safety] detoxify 库未安装，无法加载模型。")
        return None

    print(f"[Content Safety] 尝试加载 Detoxify 模型 '{DETOXIFY_MODEL_NAME}' 到设备 '{DEVICE}'...")
    loaded_model: Optional[Detoxify] = None
    try:
        loaded_model = Detoxify(DETOXIFY_MODEL_NAME, device=DEVICE)
        print(f"[Content Safety] Detoxify 模型 '{DETOXIFY_MODEL_NAME}' 加载成功。")
    except ValueError as e:
         print(f"[Content Safety] 加载 Detoxify 模型 '{DETOXIFY_MODEL_NAME}' 时发生 ValueError: {e}")
         print(f"[Content Safety] 这通常意味着模型名称无效或未正确安装。请尝试 'original', 'unbiased' 或 'multilingual'。")
    except Exception as e:
        print(f"[Content Safety] 错误：无法加载 Detoxify 模型 '{DETOXIFY_MODEL_NAME}'。错误信息: {e}")
        # 可以在这里打印更详细的堆栈信息
        # traceback.print_exc()

    return loaded_model

# --- 主检测函数 (接收模型实例) ---
def check_content_safety(
    text: str,
    detoxify_model: Optional[Detoxify], # 接收预加载的模型
    thresholds: Dict[str, float] = DETOXIFY_THRESHOLDS,
) -> tuple[bool, Optional[Dict[str, float]], Optional[list[str]]]:
    """
    使用预加载的 Detoxify 模型检查单个文本的安全性。

    Args:
        text: 需要检查的文本字符串。
        detoxify_model: 预加载的 Detoxify 模型实例，如果为 None 则跳过检测。
        thresholds: 包含标签及其对应阈值的字典。

    Returns:
        Tuple[bool, Optional[Dict[str, float]], Optional[List[str]]]:
        - bool: True 代表安全，False 代表不安全或发生错误/模型未加载。
        - Optional[Dict[str, float]]: 包含所有预测分数的字典 (如果预测成功)。
        - Optional[List[str]]: 如果不安全，包含超标原因的列表。
    """
    if detoxify_model is None:
        print("[Content Safety] Detoxify 模型未加载，跳过安全检查，默认视为安全。")
        # 或者根据你的策略返回 False
        return True, None, None # 返回安全，无分数，无原因

    if not isinstance(text, str) or not text.strip():
        # print("[Content Safety] 输入文本为空或非字符串，视为安全。")
        return True, None, None # 空文本视为安全

    try:
        # 进行预测
        # Detoxify.predict() 返回一个字典，键是标签，值是分数 (float)
        scores = detoxify_model.predict(text)

        if not isinstance(scores, dict):
            print(f"[Content Safety] 警告: Detoxify 预测返回了非预期类型: {type(scores)}，视为不安全。")
            return False, None, ["预测返回类型错误"]

        # 检查每个标签的分数是否超过阈值
        is_safe = True
        unsafe_reasons = []
        relevant_scores = {} # 只记录我们在阈值中定义的标签分数

        # print(f"  [Content Safety] Detoxify scores for '{text[:50]}...':") # 打印分数用于调试
        for label, score_value in scores.items():
            # 确保分数是数值类型
            score_float = 0.0
            if isinstance(score_value, (float, int, np.number)):
                score_float = float(score_value)
            elif isinstance(score_value, list) and len(score_value) == 1 and isinstance(score_value[0], (float, int, np.number)):
                 score_float = float(score_value[0]) # 兼容某些奇怪的返回格式
            else:
                # print(f"    [Content Safety] 忽略标签 '{label}' 的无效分数类型: {type(score_value)}")
                continue # 跳过无效分数

            # print(f"    {label}: {score_float:.4f}") # 打印所有分数

            # 检查我们关心的标签是否超阈值
            if label in thresholds:
                relevant_scores[label] = score_float # 记录关心的分数
                if score_float > thresholds[label]:
                    is_safe = False
                    unsafe_reasons.append(f"{label} > {thresholds[label]:.2f} (得分: {score_float:.4f})")

        if not is_safe:
            print(f"  [Content Safety] 检测到不安全内容 for '{text[:50]}...'，原因: {', '.join(unsafe_reasons)}")
            return False, relevant_scores, unsafe_reasons
        else:
            # print("  [Content Safety] 文本安全。")
            return True, relevant_scores, None # 安全，返回相关分数，无原因

    except Exception as e:
        print(f"[Content Safety] 处理文本 '{text[:50]}...' 时发生错误: {e}")
        traceback.print_exc() # 打印详细错误堆栈
        return False, None, ["处理时发生内部错误"] # 发生任何错误都视为不安全

# --- (可选) 主程序入口，用于独立测试此文件 ---
if __name__ == "__main__":
    print("开始独立测试 content_safety.py...")
    test_model = load_detoxify_model()

    if test_model:
        test_prompts = [
            "Hello, how is the weather today?",
            "This is wonderful!",
            "fuck you",
            "I hate you and hope you die.", # 包含 threat 和 insult?
            "People like you should not exist.", # 包含 identity_attack/identity_hate?
            "This movie is pure garbage.",
        ]

        print(f"\n--- 使用阈值: {DETOXIFY_THRESHOLDS} ---")
        for i, prompt in enumerate(test_prompts):
            print(f"\n--- 测试 {i+1} ---")
            print(f"输入文本: '{prompt}'")
            is_safe, scores, reasons = check_content_safety(prompt, test_model)
            print(f"  判断结果: {'✅ 安全' if is_safe else '❌ 不安全'}")
            if scores:
                 print(f"  相关分数: {scores}")
            if reasons:
                 print(f"  不安全原因: {reasons}")
            print("-" * 20)
    else:
        print("模型加载失败，无法执行测试。")

    print("\n独立测试完成。")