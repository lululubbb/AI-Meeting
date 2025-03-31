import sys
import regex as re # 使用功能更强的 regex 库
from typing import List, Dict, Tuple, Set, Optional, Any # 引入类型提示
# 确保导入 pipeline
try:
    from transformers import pipeline, Pipeline
except ImportError:
    print("错误：transformers 库未安装。请运行 'pip install transformers torch' (或 'pip install transformers tensorflow')")
    sys.exit(1)
import warnings
import os
try:
    import torch # 导入 torch 库用于检查 GPU 和版本
except ImportError:
    print("警告：torch 库未安装。GPU 加速将不可用。请运行 'pip install torch'")
    torch = None # 设置为 None，以便后续检查

# --- 全局配置和常量 ---

# 忽略 transformers 的一些未来版本警告和用户警告
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
# 可选：设置环境变量，有时有助于解决 tokenizers 库的并行问题
# os.environ["TOKENIZERS_PARALLELISM"] = "false"

# NER 模型配置
MODELS_TO_TRY: List[str] = [
    "ckiplab/bert-base-chinese-ner",   # 优先尝试这个专门的 NER 模型
    "ckiplab/albert-base-chinese-ner", # 备选的专门 NER 模型 (ALBERT)
]
# NER 置信度阈值 (过滤掉低于此分数的 NER 预测) - 可调整
NER_CONFIDENCE_THRESHOLD: float = 0.30

# 定义需要检测和脱敏的 PII 实体类型 (基于 NER 模型的标签)
# (需要根据你最终选择的模型实际输出的标签进行调整)
PII_ENTITY_TYPES_NER: Set[str] = {
    "PERSON", "NAME",              # 人名
    "LOC", "LOCATION", "GPE",      # 地理位置 (GPE 通常指地缘政治实体，如国家、城市)
    "ORG", "COMPANY", "ORGANIZATION" # 组织机构/公司
    # 可以根据模型能力和需求添加其他类型, 如 ADDRESS (如果模型支持)
}

# 增强的正则表达式模式 (用于高精度匹配常见 PII)
REGEX_PATTERNS: Dict[str, str] = {
    # 中国大陆手机号 (11位) | 带区号固话 | 400/800电话
    "PHONE": r"(?<![\d.-])(?:(?:1[3-9]\d{9})|(?:(?:0\d{2,3}-)?\d{7,8})|(?:(?:400|800)-?\d{3}-?\d{4}))(?!\d)",
    # 常用邮箱格式
    "EMAIL": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    # 18位身份证号 | 15位身份证号 (简单校验)
    "ID_CARD": r"(?<!\d)(?:[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]|[1-9]\d{5}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3})(?!\d)",
    # 常见银行卡号长度 (16-19位)
    "BANK_CARD": r"(?<!\d)(?:\d{16}|\d{17}|\d{18}|\d{19})(?!\d)"
    # 可以根据需要添加更多正则, 如护照号、车牌号等
}

# --- 模型加载 ---

def load_ner_pipeline() -> Tuple[Optional[Pipeline], Optional[str]]:
    loaded_pipeline: Optional[Pipeline] = None
    successful_model: Optional[str] = None
    device_to_use: int = -1 # 默认 CPU

    if torch and torch.cuda.is_available():
        device_to_use = 0 # 使用第一个 GPU
        print(f"检测到 {torch.cuda.device_count()} 个可用的 CUDA GPU。将尝试使用 GPU (device=0)。")
    else:
        print("未检测到 CUDA GPU 或 torch 未配置 GPU 支持。将使用 CPU (device=-1)。")

    for model_name in MODELS_TO_TRY:
        print(f"\n尝试加载 NER 模型: {model_name} on device {device_to_use} ...")
        try:
            loaded_pipeline = pipeline(
                "ner",
                model=model_name,
                tokenizer=model_name,
                aggregation_strategy="simple", # 'simple' 合并 B-/I- 标签
                device=device_to_use
            )
            successful_model = model_name
            device_name = "GPU" if device_to_use == 0 else "CPU"
            print(f"成功加载 NER 模型: {successful_model} on {device_name}")
            break
        except Exception as e:
            print(f"加载 {model_name} 失败: {e}")
            # 如果是 GPU 加载失败 (可能是显存不足), 尝试强制用 CPU 加载
            if device_to_use == 0:
                print(f"GPU 加载失败，尝试在 CPU 上重新加载 {model_name} ...")
                try:
                    loaded_pipeline = pipeline(
                        "ner", model=model_name, tokenizer=model_name,
                        aggregation_strategy="simple", device=-1 # 强制 CPU
                    )
                    successful_model = model_name
                    print(f"成功在 CPU 上加载 NER 模型: {successful_model}")
                    break
                except Exception as e_cpu:
                    print(f"在 CPU 上加载 {model_name} 也失败: {e_cpu}")
            print("-" * 20)

    if not loaded_pipeline:
        print("\n错误：无法加载任何预训练的 NER 模型。后续处理将仅依赖正则表达式。")

    return loaded_pipeline, successful_model

# 执行加载
ner_pipeline, loaded_model_name = load_ner_pipeline()

# --- 脱敏函数 ---

def desensitize_pii(text: str, pii_type: str) -> str:
    mask_char: str = "*"
    length: int = len(text)
    pii_type_upper: str = pii_type.upper() # 统一转大写处理

    if not text:
        return ""

    try:
        if pii_type_upper in ["PHONE", "ID_CARD", "BANK_CARD"]:
            if length > 7: # 至少保留前3后4
                return f"{text[:3]}{mask_char * (length - 7)}{text[-4:]}"
            elif length > 4: # 对于较短的数字串，至少保留后4位
                return f"{mask_char * (length - 4)}{text[-4:]}"
            else:
                return mask_char * length
        elif pii_type_upper == "EMAIL":
            parts = text.split('@')
            if len(parts) == 2:
                username, domain = parts
                ulen = len(username)
                if ulen > 2: # 用户名大于2，首尾保留
                    masked_username = f"{username[0]}{mask_char * (ulen - 2)}{username[-1]}"
                elif ulen > 0: # 用户名1或2位，全隐藏
                    masked_username = mask_char * ulen
                else: # 无用户名
                    masked_username = ""
                return f"{masked_username}@{domain}"
            else: # 格式不规范，全部隐藏
                return mask_char * length
        elif pii_type_upper in ["PERSON", "NAME"]:
            if length > 1: # 保留姓氏
                return f"{text[0]}{mask_char * (length - 1)}"
            else: # 单字名
                return mask_char
        elif pii_type_upper in ["LOC", "LOCATION", "GPE", "ORG", "COMPANY", "ORGANIZATION", "ADDRESS"]:
             # 对地址、组织等，可以采取只显示前几个字或后几个字的策略
             if length > 4:
                 return f"{text[:2]}{mask_char * (length - 4)}{text[-2:]}"
             elif length > 2:
                 return f"{text[:1]}{mask_char * (length - 2)}{text[-1:]}"
             else:
                 return mask_char * length
        else: # 其他未知类型，全部隐藏
            return mask_char * length
    except Exception as e:
        print(f"脱敏处理 '{text}' (Type: {pii_type}) 时出错: {e}", file=sys.stderr)
        return mask_char * length # 出错时返回全掩码

# --- 后处理函数 ---

def merge_adjacent_single_char_persons(entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not entities:
        return []

    merged_entities: List[Dict[str, Any]] = []
    i = 0
    while i < len(entities):
        current_entity = entities[i].copy() # 使用副本操作
        current_source = current_entity.get('source', 'UNKNOWN')
        # 检查是否是来自 NER 的单字人名
        entity_type = current_entity.get('type', 'UNKNOWN').upper()
        is_single_char_ner_person = (current_source == 'NER' and
                                     entity_type in {"PERSON", "NAME"} and
                                     current_entity.get('end', 0) - current_entity.get('start', 0) == 1)

        if is_single_char_ner_person:
            j = i + 1
            while j < len(entities):
                next_entity = entities[j]
                next_source = next_entity.get('source', 'UNKNOWN')
                next_entity_type = next_entity.get('type', 'UNKNOWN').upper()

                # 检查下一个实体是否紧邻且也是单字人名
                is_adjacent_single_char_ner_person = (
                    next_entity.get('start') == current_entity.get('end') and # 紧邻
                    next_source == 'NER' and
                    next_entity_type in {"PERSON", "NAME"} and
                    next_entity.get('end', 0) - next_entity.get('start', 0) == 1
                )

                if is_adjacent_single_char_ner_person:
                    # 合并信息到 current_entity (它是副本)
                    current_entity['value'] += next_entity.get('value', '')
                    current_entity['end'] = next_entity.get('end')
                    # 合并分数可以取最低分、平均分或保留第一个，这里取最低分
                    current_entity['score'] = min(current_entity.get('score', 1.0), next_entity.get('score', 1.0))
                    current_entity['source'] = 'NER_Merged' # 标记为合并产生
                    print(f"  合并人名: '{entities[i].get('value','')}' + '{next_entity.get('value','')} B-> '{current_entity['value']}'")
                    j += 1 # 继续尝试合并下一个
                else:
                    break # 停止合并

            merged_entities.append(current_entity) # 添加合并后的（或未合并的）实体
            i = j # 更新 i 跳过已合并的实体
        else:
            # 不是需要合并的类型，直接添加到结果
            merged_entities.append(current_entity)
            i += 1

    return merged_entities


# --- 主函数 ---

def detect_and_desensitize_pii_enhanced(
    input_text: str,
    ner_confidence_threshold: float = NER_CONFIDENCE_THRESHOLD
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    检测并脱敏文本中的 PII（增强版）。
    结合高精度正则和基于 Transformer 的 NER 模型，并进行后处理。

    处理流程:
    1. 使用正则表达式优先检测高置信度模式 (电话, 邮箱, 身份证, 银行卡)。
    2. 对未被正则覆盖的部分，使用 NER 模型检测其他 PII 类型 (人名, 地址, 组织)。
    3. 应用 NER 置信度阈值过滤低可信度预测。
    4. 后处理：合并相邻的单字人名实体。
    5. 应用脱敏规则，替换原始文本中的 PII。

    Args:
        input_text (str): 需要处理的原始文本。
        ner_confidence_threshold (float): NER 预测的置信度阈值。

    Returns:
        Tuple[str, List[Dict[str, Any]]]:
            - str: 脱敏处理后的文本。
            - List[Dict[str, Any]]: 检测到的 PII 详细信息列表 (包含类型, 值, 起止位置, 来源, 置信度)。
    """
    if not input_text:
        return "", []

    processed_text_list: List[str] = list(input_text)
    detected_pii: List[Dict[str, Any]] = []
    # 使用集合跟踪已被占用的字符索引，优先保证 Regex 的结果
    claimed_indices: Set[int] = set()

    # --- 步骤 1: 正则表达式检测 (高优先级) ---
    print("\n--- 开始 Regex 检测 ---")
    for pii_type, pattern in REGEX_PATTERNS.items():
        try:
            for match in re.finditer(pattern, input_text):
                start, end = match.span()
                # 检查是否与已处理区域完全重叠 (简单检查，避免部分重叠导致的复杂处理)
                if all(i in claimed_indices for i in range(start, end)):
                    continue
                # 如果部分重叠，正则优先，移除旧的（可能来自低置信 NER 的）重叠项
                overlaps = False
                indices_to_add = set(range(start, end))
                if any(i in claimed_indices for i in indices_to_add):
                    overlaps = True
                    # (可选) 可以在这里添加逻辑移除与当前正则匹配重叠的旧 detected_pii 项
                    # 为了简化，我们只打印警告并继续，正则会覆盖

                original_value = match.group(0)
                print(f"Regex 发现: {pii_type} - '{original_value}' at [{start}:{end}] {'(覆盖已有标记)' if overlaps else ''}")
                detected_pii.append({
                    "type": pii_type, "value": original_value, "start": start, "end": end,
                    "source": "Regex", "score": 1.0 # 正则匹配视为最高置信度
                })
                claimed_indices.update(indices_to_add) # 标记索引已被正则占用
        except Exception as e:
            print(f"Regex 处理 {pii_type} 时出错: {e}", file=sys.stderr)
    print("--- Regex 检测结束 ---")

    # 对初步检测结果按 start 排序，方便后续处理
    detected_pii.sort(key=lambda x: x['start'])

    # --- 步骤 2: NER 模型检测 ---
    print("\n--- 开始 NER 检测 ---")
    if ner_pipeline:
        try:
            # 在原始文本上运行 NER
            ner_results = ner_pipeline(input_text)
            for entity in ner_results:
                entity_type_label = entity.get('entity_group', 'UNKNOWN').upper()
                start = entity.get('start')
                end = entity.get('end')
                original_value = entity.get('word')
                score = entity.get('score', 0.0)

                # 基本有效性检查 和 类型检查
                if start is None or end is None or not original_value or entity_type_label not in PII_ENTITY_TYPES_NER:
                    continue

                # 检查是否与更高置信度（Regex）的区域重叠
                is_processed_by_regex = any(i in claimed_indices for i in range(start, end))
                if is_processed_by_regex:
                    # print(f"  NER 跳过: '{original_value}' at [{start}:{end}] (已被 Regex 覆盖)")
                    continue

                # 应用置信度阈值
                if score >= ner_confidence_threshold:
                    print(f"NER 发现: {entity_type_label} - '{original_value}' at [{start}:{end}], score={score:.4f}")
                    detected_pii.append({
                        "type": entity_type_label, "value": original_value, "start": start, "end": end,
                        "source": "NER", "score": score
                    })
                    # 注意：这里暂时不更新 claimed_indices，让正则始终优先
                # else:
                #    print(f"NER 发现低置信度 PII ({score:.4f})，已忽略: {entity_type_label} - '{original_value}'")

        except Exception as e:
            print(f"NER 处理时出错: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc() # 打印详细堆栈信息
    else:
        print("NER pipeline 未加载，跳过 NER 检测。")
    print("--- NER 检测结束 ---")

    # --- 步骤 3: 再次排序并后处理 (合并人名) ---
    print("\n--- 开始后处理 (合并相邻单字人名) ---")
    # 需要按 start 再次排序，因为 NER 结果是无序加入的
    detected_pii.sort(key=lambda x: x['start'])
    print(f"合并前检测到的 PII 数量: {len(detected_pii)}")
    merged_pii = merge_adjacent_single_char_persons(detected_pii)
    print(f"合并后检测到的 PII 数量: {len(merged_pii)}")
    print("--- 后处理结束 ---")

    # --- 步骤 4: 应用脱敏 ---
    print("\n--- 开始应用脱敏替换 ---")
    final_claimed_indices: Set[int] = set()
    desensitized_count = 0
    # 按结束位置逆序处理合并后的结果，防止索引错乱
    merged_pii.sort(key=lambda x: x['end'], reverse=True)

    for pii_item in merged_pii:
        start = pii_item.get('start', -1)
        end = pii_item.get('end', -1)
        if start == -1 or end == -1 or start >= end: # 基本检查
            continue

        # 检查是否与已应用的脱敏区域重叠
        if any(i in final_claimed_indices for i in range(start, end)):
            # print(f"  跳过重叠区域: '{pii_item.get('value')}' at [{start}:{end}]")
            continue

        # 获取类型和值，进行脱敏
        pii_type = pii_item.get('type', 'UNKNOWN').upper()
        original_value = pii_item.get('value', '')
        desensitized_value = desensitize_pii(original_value, pii_type)

        # 只有当脱敏后的值与原值不同时才进行替换
        if original_value != desensitized_value:
            print(f"应用脱敏: 将 '{original_value}' (Type: {pii_type}, Src: {pii_item.get('source')}) 替换为 '{desensitized_value}' at [{start}:{end}]")
            # 执行替换 (注意 list 切片替换)
            processed_text_list[start:end] = list(desensitized_value)
            final_claimed_indices.update(range(start, end)) # 标记此区域已被最终处理
            desensitized_count += 1
        # else:
            # print(f"无需脱敏或规则未生效: '{original_value}' at [{start}:{end}]")

    print(f"--- 应用脱敏结束 (共 {desensitized_count} 处) ---")

    final_text: str = "".join(processed_text_list)
    # 返回按起始位置排序的最终 PII 列表
    merged_pii.sort(key=lambda x: x['start'])
    return final_text, merged_pii

# --- 测试执行 ---
if __name__ == "__main__":
    print("-" * 60)
    print("环境信息:")
    if torch:
        print(f"  PyTorch Version: {torch.__version__}")
        print(f"  CUDA Available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"  CUDA Version: {torch.version.cuda}")
            print(f"  GPU Count: {torch.cuda.device_count()}")
            try:
                print(f"  GPU Name (Device 0): {torch.cuda.get_device_name(0)}")
            except Exception as e:
                print(f"  无法获取 GPU 名称: {e}")
    else:
        print("  Torch 未安装或导入失败。")
    print(f"  Loaded NER Model: {loaded_model_name if loaded_model_name else 'None'}")
    print(f"  NER Confidence Threshold: {NER_CONFIDENCE_THRESHOLD}")
    print("-" * 60)

    test_texts: List[str] = [
        "你好，我是张三，我的电话是13812345678，邮箱是zhangsan@example.com。我们公司在北京朝阳区。",
        "请联系李四，他的身份证号是 11010119900307123X，旧号码是110101900307123，地址在上海市人民路 1 号。他的银行卡号是6228480012345678901。",
        "会议纪要：王五提到项目预算，他的工号是 9527。但是他的备用邮箱是 wangwu_backup@another.com", # 工号不应被识别为 PII
        "Participants: Alice Smith (alice.smith@domain.co), Bob Jones (ID: 440301198501015432), Charlie Brown (from Google Inc.)", # 英文名和组织，看模型能力
        "安恒信息技术股份有限公司成立于2007年, 联系电话 0571-12345678. 官网 www.dbappsecurity.com.cn", # 公司名和固话
        "我的手机是13511112222，卡号1234567890123456，家住阳光小区。", # 地址较短
        "订单号 1234567890, 金额 $199. 请勿拨打 400-800-1234 查询。", # 订单号不应识别，400电话应识别
        "测试单字名： 李 雷 和 韩 梅 梅 。", # 测试人名合并
        "邮箱： test@test.com, 电话：13987654321, 地址：未来科技城海创园",
        "无敏感信息。"
    ]

    print("\n" + "=" * 60)
    print("开始 PII 检测与脱敏测试")
    print("=" * 60)
    if not ner_pipeline and not REGEX_PATTERNS:
         print("\n警告：NER 模型未加载且无 Regex 规则，无法进行有效测试。\n")
         sys.exit(1)
    elif not ner_pipeline:
         print("\n警告：NER 模型未加载，测试将仅依赖 Regex。\n")


    for i, text in enumerate(test_texts):
        print(f"\n--- 测试用例 {i+1} ---")
        print(f"原始文本:\n{text}")
        try:
            desensitized_text, pii_info = detect_and_desensitize_pii_enhanced(text)
            print(f"\n脱敏后文本:\n{desensitized_text}")
            print(f"\n检测到的 PII 详情:")
            if pii_info:
                for pii in pii_info:
                    value = pii.get('value', 'N/A')
                    start = pii.get('start', -1)
                    end = pii.get('end', -1)
                    pii_type = pii.get('type', 'UNKNOWN')
                    source = pii.get('source', 'UNKNOWN')
                    score = pii.get('score', 0.0)
                    print(f"  - [{start}:{end}] '{value}' (Type: {pii_type}, Src: {source}, Score: {score:.4f})")
            else:
                print("  (未检测到 PII)")
        except Exception as e:
            print(f"\n处理测试用例时发生严重错误: {e}")
            import traceback
            traceback.print_exc() # 打印详细的回溯信息
        print("-" * 60)

    print("\n测试完成。")