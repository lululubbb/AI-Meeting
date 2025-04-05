# backend/src/pii_logic.py
import sys
import regex as re
from typing import List, Dict, Tuple, Set, Optional, Any
import warnings
import os

# 确保导入 transformers 和 torch (或 tensorflow)
try:
    from transformers import pipeline, Pipeline
except ImportError:
    print("错误：transformers 库未安装。请运行 'pip install transformers torch' (或 'pip install transformers[tf]')")
    sys.exit(1)

try:
    import torch
except ImportError:
    print("警告：torch 库未安装，transformers 将尝试使用 tensorflow (如果已安装)。GPU 加速可能不可用。")
    torch = None

# --- 全局配置和常量 ---
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# NER 模型配置 (按优先级排列)
# 这些模型将由 transformers 库从 Hugging Face Hub 下载并缓存
MODELS_TO_TRY: List[str] = [
    "ckiplab/bert-base-chinese-ner",   # 优先尝试这个专门的中文 NER 模型
    "ckiplab/albert-base-chinese-ner", # 备选的中文 NER 模型 (ALBERT)
]
# NER 置信度阈值 (过滤掉低于此分数的 NER 预测) - 可调整
NER_CONFIDENCE_THRESHOLD: float = 0.70 # 可以根据模型效果调整

# 定义 NER 模型输出的、需要检测和脱敏的 PII 实体类型
# (请根据你最终选择并成功加载的模型实际输出标签进行确认和调整)
PII_ENTITY_TYPES_NER: Set[str] = {
    "PERSON", "NAME",              # 人名 (ckiplab 模型常用 PERSON)
    "LOC", "LOCATION", "GPE",      # 地理位置 (ckiplab 模型常用 GPE, LOC)
    "ORG", "COMPANY", "ORGANIZATION" # 组织机构 (ckiplab 模型常用 ORG)
    # "ADDRESS"                    # 如果模型支持并需要，可以添加
    #     # === 可能敏感的信息 ===
    # "DATE",         # 日期 (如出生日期)
    # "TIME",         # 时间 (有时与特定事件关联)
    # "MONEY",        # 货币金额 (财务信息)
    # "NORP",         # 国籍、宗教、政治团体 (某些场景下敏感)
}

# 增强的正则表达式模式 (用于高精度匹配常见 PII)
REGEX_PATTERNS: Dict[str, str] = {
    # 中国大陆手机号 (11位) | 带区号固话 | 400/800电话
    "PHONE": r"(?<![\d.-])(?:(?:1[3-9]\d{9})|(?:(?:0\d{2,3}-?)\d{7,8})|(?:(?:400|800)-?\d{3}-?\d{4}))(?!\d)",
    # 常用邮箱格式
    "EMAIL": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b", # 使用\b确保边界
    # 18位身份证号 (简单校验，X结尾) | 15位身份证号 (简单校验)
    "ID_CARD": r"(?<!\d)(?:[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]|[1-9]\d{5}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3})(?!\d)",
    # 常见银行卡号长度 (16-19位) - 优化以减少误报身份证
    "BANK_CARD": r"(?<![\dX])(?<!\d[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{2})\b\d{16,19}\b(?!\d)", # 尝试用负向后行断言排除身份证结尾部分
}

# --- 模型加载函数 ---
def load_ner_pipeline() -> Tuple[Optional[Pipeline], Optional[str]]:
    """
    尝试加载预定义的 NER 模型列表中的一个，优先使用 GPU。
    模型文件由 transformers 库自动管理（下载与缓存）。
    """
    loaded_pipeline: Optional[Pipeline] = None
    successful_model: Optional[str] = None
    device_to_use: int = -1 # 默认 CPU

    # 检查是否有可用的 CUDA GPU
    if torch and torch.cuda.is_available():
        print(f"[PII Logic] 检测到 {torch.cuda.device_count()} 个 CUDA GPU。尝试使用 GPU (device=0)。")
        device_to_use = 0
    else:
        print("[PII Logic] 未检测到 CUDA GPU 或 torch 未安装/配置。将使用 CPU。")

    # 尝试加载列表中的模型
    for model_name in MODELS_TO_TRY:
        print(f"\n[PII Logic] 尝试加载 NER 模型: {model_name} on device {device_to_use}...")
        try:
            # pipeline 会自动处理模型下载和缓存
            loaded_pipeline = pipeline(
                "ner",                # 任务类型
                model=model_name,     # 模型标识符 (Hugging Face Hub 或本地路径)
                tokenizer=model_name, # 通常与模型相同
                aggregation_strategy="simple", # 合并 B-/I- 标签
                device=device_to_use, # 指定设备 (-1 CPU, 0 GPU 0, ...)
                # framework="pt" # 可选：明确指定框架 'pt' for PyTorch, 'tf' for TensorFlow
            )
            successful_model = model_name
            device_name = "GPU" if device_to_use == 0 else "CPU"
            print(f"[PII Logic] 成功加载 NER 模型: {successful_model} on {device_name}")
            break # 加载成功即退出循环
        except OSError as e:
            # OSError 通常表示模型文件找不到或无法下载
            print(f"[PII Logic] 加载模型 {model_name} 失败 (OSError): {e}")
            print(f"[PII Logic] 请检查模型名称是否正确，以及网络连接是否可以访问 Hugging Face Hub。")
        except Exception as e:
            # 其他可能的错误 (如内存不足, 依赖问题等)
            print(f"[PII Logic] 加载模型 {model_name} on device {device_to_use} 时发生未知错误: {e}")
            # 如果是 GPU 加载失败 (如显存不足)，尝试在 CPU 上重新加载一次
            if device_to_use == 0:
                print(f"[PII Logic] GPU 加载失败，尝试强制在 CPU 上加载 {model_name}...")
                try:
                    loaded_pipeline = pipeline(
                        "ner", model=model_name, tokenizer=model_name,
                        aggregation_strategy="simple", device=-1 # 强制 CPU
                    )
                    successful_model = model_name
                    print(f"[PII Logic] 成功在 CPU 上加载 NER 模型: {successful_model}")
                    break # 加载成功即退出循环
                except Exception as e_cpu:
                    print(f"[PII Logic] 在 CPU 上加载 {model_name} 也失败: {e_cpu}")
            print("-" * 20) # 分隔符

    if not loaded_pipeline:
        print("\n[PII Logic] 警告：无法加载任何预定义的 NER 模型。PII 检测将主要依赖正则表达式。")

    return loaded_pipeline, successful_model

# --- 脱敏函数 ---
def desensitize_pii(text: str, pii_type: str) -> str:
    """根据 PII 类型对文本进行脱敏处理。"""
    mask_char: str = "*"
    length: int = len(text)
    pii_type_upper: str = pii_type.upper()

    if not text: return ""

    try:
        if pii_type_upper in ["PHONE", "ID_CARD", "BANK_CARD"]:
            if length > 7: return f"{text[:3]}{mask_char * (length - 7)}{text[-4:]}"
            if length > 4: return f"{mask_char * (length - 4)}{text[-4:]}"
            return mask_char * length
        elif pii_type_upper == "EMAIL":
            parts = text.split('@')
            if len(parts) == 2:
                username, domain = parts
                ulen = len(username)
                maskedUsername = ""
                if ulen > 3: maskedUsername = f"{username[0]}{mask_char * (ulen - 2)}{username[-1]}"
                elif ulen > 0: maskedUsername = f"{username[0]}{mask_char * (ulen - 1)}"
                return f"{maskedUsername}@{domain}"
            return mask_char * length
        elif pii_type_upper in ["PERSON", "NAME"]:
            if length > 1: return f"{text[0]}{mask_char * (length - 1)}"
            return mask_char
        elif pii_type_upper in ["LOC", "LOCATION", "GPE", "ORG", "COMPANY", "ORGANIZATION", "ADDRESS"]:
            if length > 6: return f"{text[:2]}{mask_char * (length - 4)}{text[-2:]}"
            if length > 3: return f"{text[:1]}{mask_char * (length - 2)}{text[-1:]}"
            if length > 1: return f"{text[0]}{mask_char * (length - 1)}"
            return mask_char
        else:
            return mask_char * length
    except Exception as e:
        print(f"[PII Logic] 脱敏处理 '{text}' (Type: {pii_type}) 时出错: {e}", file=sys.stderr)
        return mask_char * length

# --- 后处理函数：合并相邻单字人名 ---
def merge_adjacent_single_char_persons(entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    后处理步骤：合并由 NER 模型识别出的、紧邻的、单字人名实体。
    例如：模型可能将 "李 雷" 识别为两个独立的 PERSON 实体，此函数将其合并为 "李雷"。
    """
    if not entities: return []

    entities.sort(key=lambda x: x.get('start', 0))
    merged_entities: List[Dict[str, Any]] = []
    i = 0
    while i < len(entities):
        current_entity = entities[i]
        is_single_char_ner_person = (
            current_entity.get('source') == 'NER' and
            current_entity.get('type', '').upper() in {"PERSON", "NAME"} and
            current_entity.get('end', 0) - current_entity.get('start', 0) == 1
        )
        if is_single_char_ner_person:
            j = i + 1
            while j < len(entities):
                next_entity = entities[j]
                is_adjacent_single_char_ner_person = (
                    next_entity.get('start') == current_entity.get('end') and # 紧邻
                    next_entity.get('source') == 'NER' and
                    next_entity.get('type', '').upper() in {"PERSON", "NAME"} and
                    next_entity.get('end', 0) - next_entity.get('start', 0) == 1
                )
                if is_adjacent_single_char_ner_person:
                    # print(f"  [PII Logic] 合并人名: '{current_entity.get('value','')}' + '{next_entity.get('value','')} -> '{current_entity.get('value','') + next_entity.get('value','')}'")
                    current_entity['value'] += next_entity.get('value', '')
                    current_entity['end'] = next_entity.get('end')
                    current_entity['score'] = min(current_entity.get('score', 1.0), next_entity.get('score', 1.0))
                    current_entity['source'] = 'NER_Merged'
                    j += 1
                else:
                    break
            merged_entities.append(current_entity)
            i = j
        else:
            merged_entities.append(current_entity)
            i += 1
    return merged_entities

# --- 主检测与脱敏函数 ---
def detect_and_desensitize_pii_enhanced(
    input_text: str,
    ner_pipeline_instance: Optional[Pipeline], # 接收加载好的模型实例
    ner_confidence_threshold: float = NER_CONFIDENCE_THRESHOLD
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    检测并脱敏文本中的 PII（增强版）。
    结合高精度正则和基于 Transformer 的 NER 模型，并进行后处理。
    """
    if not input_text: return "", []

    detected_pii: List[Dict[str, Any]] = []
    regex_claimed_spans: List[Tuple[int, int]] = []

    # --- 步骤 1: 正则表达式检测 ---
    for pii_type, pattern in REGEX_PATTERNS.items():
        try:
            for match in re.finditer(pattern, input_text):
                start, end = match.span()
                detected_pii.append({
                    "type": pii_type, "value": match.group(0), "start": start, "end": end,
                    "source": "Regex", "score": 1.0
                })
                regex_claimed_spans.append((start, end))
        except Exception as e:
            print(f"[PII Logic] Regex 处理 {pii_type} 时出错: {e}", file=sys.stderr)

    # 合并 Regex 区间
    regex_claimed_spans.sort()
    merged_spans = []
    for start, end in regex_claimed_spans:
        if not merged_spans or start > merged_spans[-1][1]: merged_spans.append([start, end])
        else: merged_spans[-1][1] = max(merged_spans[-1][1], end)
    regex_claimed_spans = [(s, e) for s, e in merged_spans]

    # --- 步骤 2: NER 模型检测 ---
    ner_found_count = 0
    if ner_pipeline_instance:
        try:
            # 假设 pipeline 输出 [{ 'entity_group': 'PER', 'score': 0.99, 'word': '张 三', 'start': 5, 'end': 7 }, ...]
            ner_results = ner_pipeline_instance(input_text)
            for entity in ner_results:
                entity_type_label = entity.get('entity_group', 'UNKNOWN').upper()
                start = entity.get('start')
                end = entity.get('end')
                original_value = entity.get('word') # 'word' 应该是聚合后的实体
                score = float(entity.get('score', 0.0)) #确保是 float

                if start is None or end is None or start >= end or not original_value or entity_type_label not in PII_ENTITY_TYPES_NER: continue
                if score < ner_confidence_threshold: continue

                is_overlapped_with_regex = any(max(start, r_start) < min(end, r_end) for r_start, r_end in regex_claimed_spans)

                if not is_overlapped_with_regex:
                    detected_pii.append({
                        "type": entity_type_label, "value": original_value, "start": start, "end": end,
                        "source": "NER", "score": score
                    })
                    ner_found_count += 1
        except Exception as e:
            print(f"[PII Logic] NER 处理时出错: {e}", file=sys.stderr)
    else:
        pass # NER 模型不可用

    # --- 步骤 3: 后处理 (合并人名) ---
    detected_pii.sort(key=lambda x: x['start'])
    merged_pii = merge_adjacent_single_char_persons(detected_pii) # 仍然尝试合并单字，可能对某些模型输出有用

    # --- 步骤 4: 应用脱敏 ---
    processed_text_list: List[str] = list(input_text)
    final_claimed_indices: Set[int] = set()
    desensitized_count = 0
    merged_pii.sort(key=lambda x: x.get('end', 0), reverse=True) # 逆序处理

    for pii_item in merged_pii:
        start = pii_item.get('start', -1)
        end = pii_item.get('end', -1)
        if start == -1 or end == -1 or start >= end or any(i in final_claimed_indices for i in range(start, end)): continue

        pii_type = pii_item.get('type', 'UNKNOWN').upper()
        original_value = pii_item.get('value', '')
        desensitized_value = desensitize_pii(original_value, pii_type)

        if original_value != desensitized_value:
            processed_text_list[start:end] = list(desensitized_value)
            final_claimed_indices.update(range(start, end))
            desensitized_count += 1

    final_text: str = "".join(processed_text_list)
    merged_pii.sort(key=lambda x: x.get('start', 0)) # 按起始位置排序返回
    return final_text, merged_pii

# --- (可选) 主程序入口，用于独立测试此文件 ---
if __name__ == '__main__':
    print("开始独立测试 pii_logic.py...")

    # 尝试加载模型进行测试
    test_pipeline, model_name = load_ner_pipeline()

    test_texts = [
        "你好，我是张三，我的电话是13812345678，邮箱是zhangsan@example.com。我们公司在北京朝阳区。",
        "请联系李四，他的身份证号是 11010119900307123X。",
        "无敏感信息。",
        "你好，我是张三，我的电话是13812345678，邮箱是zhangsan@example.com。我们公司在北京朝阳区。",
        "请联系李四，他的身份证号是 11010119900307123X，旧号码是110101900307123，地址在上海市人民路 1 号。银行卡密码是123456。",
        # 包含非 PII 数字和特殊字符
        "会议纪要：王五提到项目预算 1,000,000 元，他的工号是 9527。项目编号 P-202405。他的备用邮箱是 wangwu_backup@another.com",
        # 英文名、组织、混合大小写 ID (看模型能力)
        "Participants: Alice Smith (alice.smith@domain.co), Bob Jones (ID: 440301198501015432), Charlie Brown from Google Inc.",
        # 公司名、固话、网址
        "安恒信息技术股份有限公司成立于2007年, 联系电话 0571-12345678. 官网 www.dbappsecurity.com.cn (请勿拨打400-123-4567)",
        # 短地址、混合 PII
        "我的手机是13511112222，卡号1234567890123456，家住阳光小区。",
        # 边界测试：PII 在开头或结尾
        "13987654321 是我的号码。", "我的邮箱是 end@test.com",
        # 单字人名合并测试
        "测试单字名： 李 雷 和 韩 梅 梅 。还有 欧 阳 锋。",
        # 嵌套或重叠地址/组织 (看模型如何处理，以及我们的过滤逻辑)
        "地址：浙江省杭州市滨江区网商路阿里巴巴集团总部。或者去北京海淀区中关村。",
        # 无敏感信息
        "这是一段完全正常的文本，不包含任何个人信息。",
        # 只有 Regex 能匹配的
        "只有电话 18800001111 和邮箱 only_regex@mail.net",
        # 只有 NER 能匹配的 (假设模型能识别)
        "这里只有人名 诸葛亮 和地名 赤壁。",
        # 包含换行符
        "姓名：赵六\n电话：17712345678\n公司：测试公司",
        # 极端情况：空字符串或只有空格
        "", "   ",
        # 看起来像但可能不是 PII 的（需要模型和正则足够精确）
        "订单号: 8001234567890123 (16位数字), 会员 ID: 19900101 (8位数字)",
        # 更复杂的邮箱
        "联系人 first.last-name+tag@sub-domain.example.co.uk"
    ]

    for i, text in enumerate(test_texts):
        print(f"\n--- 测试用例 {i+1} ---")
        print(f"原始文本: '{text}'")
        desensitized, info = detect_and_desensitize_pii_enhanced(text, test_pipeline)
        print(f"脱敏后文本: '{desensitized}'")
        print("检测到的 PII:")
        if info:
            for item in info:
                print(f"  - {item}")
        else:
            print("  (无)")
        print("-" * 20)

    print("\n独立测试完成。")