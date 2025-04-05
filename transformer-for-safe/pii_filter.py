import sys
import regex as re  # 使用功能更强的 regex 库
from typing import List, Dict, Tuple, Set, Optional, Any  # 引入类型提示
import warnings
import os

# 确保导入 pipeline 和 torch
try:
    from transformers import pipeline, Pipeline
except ImportError:
    print("错误：transformers 库未安装。请运行 'pip install transformers torch' (或 'pip install transformers tensorflow')")
    sys.exit(1)

try:
    import torch  # 导入 torch 库用于检查 GPU 和版本
except ImportError:
    print("警告：torch 库未安装。GPU 加速将不可用。请运行 'pip install torch'")
    torch = None  # 设置为 None，以便后续检查

# --- 全局配置和常量 ---

# 忽略 transformers 的一些未来版本警告和用户警告
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
# 可选：设置环境变量，有时有助于解决 tokenizers 库的并行问题
# os.environ["TOKENIZERS_PARALLELISM"] = "false"

# NER 模型配置 (按优先级排列)
MODELS_TO_TRY: List[str] = [
    "ckiplab/bert-base-chinese-ner",   # 专门的中文 NER 模型
    "ckiplab/albert-base-chinese-ner", # 备选的中文 NER 模型 (ALBERT)

]
# NER 置信度阈值 (过滤掉低于此分数的 NER 预测) - 可调整
NER_CONFIDENCE_THRESHOLD: float = 0.50 # 适当提高阈值减少噪音

# 定义 NER 模型输出的、需要检测和脱敏的 PII 实体类型
# (请根据你选择的模型实际输出标签进行最终确认和调整)
PII_ENTITY_TYPES_NER: Set[str] = {
    "PERSON", "NAME",              # 人名
    "LOC", "LOCATION", "GPE",      # 地理位置 (GPE 通常指地缘政治实体，如国家、城市)
    "ORG", "COMPANY", "ORGANIZATION" # 组织机构/公司
    # "ADDRESS"                    # 如果模型支持并需要，可以添加
}

# 增强的正则表达式模式 (用于高精度匹配常见 PII)
REGEX_PATTERNS: Dict[str, str] = {
    # 中国大陆手机号 (11位) | 带区号固话 | 400/800电话
    "PHONE": r"(?<![\d.-])(?:(?:1[3-9]\d{9})|(?:(?:0\d{2,3}-?)\d{7,8})|(?:(?:400|800)-?\d{3}-?\d{4}))(?!\d)",
    # 常用邮箱格式
    "EMAIL": r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b", # 使用\b确保边界
    # 18位身份证号 (简单校验，X结尾) | 15位身份证号 (简单校验)
    "ID_CARD": r"(?<!\d)(?:[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dX]|[1-9]\d{5}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3})(?!\d)",
    # 常见银行卡号长度 (16-19位)
    "BANK_CARD": r"(?<!\d)\d{16,19}(?!\d)" # 简化写法
    # 可以根据需要添加更多正则, 如护照号、车牌号等
}

# --- 模型加载 ---

def load_ner_pipeline() -> Tuple[Optional[Pipeline], Optional[str]]:
    """尝试加载预定义的 NER 模型列表中的一个，优先使用 GPU。"""
    loaded_pipeline: Optional[Pipeline] = None
    successful_model: Optional[str] = None
    device_to_use: int = -1 # 默认 CPU

    if torch and torch.cuda.is_available():
        print(f"检测到 {torch.cuda.device_count()} 个 CUDA GPU。尝试使用 GPU (device=0)。")
        device_to_use = 0
    else:
        print("未检测到 CUDA GPU 或 torch 未配置 GPU 支持。将使用 CPU。")

    for model_name in MODELS_TO_TRY:
        print(f"\n尝试加载 NER 模型: {model_name} on device {device_to_use}...")
        try:
            # 尝试使用指定设备加载
            loaded_pipeline = pipeline(
                "ner",
                model=model_name,
                tokenizer=model_name, # 通常与模型同名
                aggregation_strategy="simple", # 'simple' 合并 B-/I- 标签为一个实体
                device=device_to_use,
                # ignore_labels=[] # 可以忽略某些不需要的标签类型
            )
            successful_model = model_name
            device_name = "GPU" if device_to_use == 0 else "CPU"
            print(f"成功加载 NER 模型: {successful_model} on {device_name}")
            break # 加载成功即退出循环
        except Exception as e:
            print(f"加载模型 {model_name} on device {device_to_use} 失败: {e}")
            # 如果是 GPU 加载失败 (如显存不足)，尝试在 CPU 上重新加载一次
            if device_to_use == 0:
                print(f"GPU 加载失败，尝试强制在 CPU 上加载 {model_name}...")
                try:
                    loaded_pipeline = pipeline(
                        "ner", model=model_name, tokenizer=model_name,
                        aggregation_strategy="simple", device=-1 # 强制 CPU
                    )
                    successful_model = model_name
                    print(f"成功在 CPU 上加载 NER 模型: {successful_model}")
                    break # 加载成功即退出循环
                except Exception as e_cpu:
                    print(f"在 CPU 上加载 {model_name} 也失败: {e_cpu}")
            print("-" * 20) # 分隔符

    if not loaded_pipeline:
        print("\n警告：无法加载任何预定义的 NER 模型。PII 检测将主要依赖正则表达式。")

    return loaded_pipeline, successful_model

# --- 脱敏函数 ---

def desensitize_pii(text: str, pii_type: str) -> str:
    """根据 PII 类型对文本进行脱敏处理。"""
    mask_char: str = "*"
    length: int = len(text)
    pii_type_upper: str = pii_type.upper() # 统一转大写处理

    if not text:
        return ""

    try:
        # 数字类 PII (手机, 身份号, 银行卡): 保留前几位和后几位
        if pii_type_upper in ["PHONE", "ID_CARD", "BANK_CARD"]:
            if length > 7: # 例如，手机号、身份证号、长银行卡号，保留前3后4
                return f"{text[:3]}{mask_char * (length - 7)}{text[-4:]}"
            elif length > 4: # 较短数字串，保留后4位
                return f"{mask_char * (length - 4)}{text[-4:]}"
            else: # 非常短的数字串，全部隐藏
                return mask_char * length
        # 邮箱: 隐藏用户名部分字符
        elif pii_type_upper == "EMAIL":
            parts = text.split('@')
            if len(parts) == 2:
                username, domain = parts
                ulen = len(username)
                if ulen > 3: # 用户名较长，保留前1后1
                    masked_username = f"{username[0]}{mask_char * (ulen - 2)}{username[-1]}"
                elif ulen > 0: # 用户名1-3位，只保留首位（或全隐藏，这里选择保留首位）
                    masked_username = f"{username[0]}{mask_char * (ulen - 1)}"
                else: # 无用户名部分
                    masked_username = ""
                # 域名部分一般不脱敏，但如果需要也可添加逻辑
                return f"{masked_username}@{domain}"
            else: # 格式不规范的邮箱，全部隐藏
                return mask_char * length
        # 人名: 保留姓氏（第一个字），隐藏名
        elif pii_type_upper in ["PERSON", "NAME"]:
            if length > 1:
                return f"{text[0]}{mask_char * (length - 1)}"
            else: # 单字名，直接隐藏
                return mask_char
        # 地址/组织机构: 保留首尾部分字符
        elif pii_type_upper in ["LOC", "LOCATION", "GPE", "ORG", "COMPANY", "ORGANIZATION", "ADDRESS"]:
             if length > 6: # 较长，保留前2后2
                 return f"{text[:2]}{mask_char * (length - 4)}{text[-2:]}"
             elif length > 3: # 中等长度，保留前1后1
                 return f"{text[:1]}{mask_char * (length - 2)}{text[-1:]}"
             elif length > 1: # 短，保留第一个字
                 return f"{text[0]}{mask_char * (length - 1)}"
             else: # 单字，隐藏
                 return mask_char
        # 其他未知类型或未指定规则的，保守起见全部隐藏
        else:
            return mask_char * length
    except Exception as e:
        print(f"脱敏处理 '{text}' (Type: {pii_type}) 时出错: {e}", file=sys.stderr)
        return mask_char * length # 出错时返回全掩码

# --- 后处理函数 ---

def merge_adjacent_single_char_persons(entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    后处理步骤：合并由 NER 模型识别出的、紧邻的、单字人名实体。
    例如：模型可能将 "李 雷" 识别为两个独立的 PERSON 实体，此函数将其合并为 "李雷"。
    """
    if not entities:
        return []

    # 按起始位置排序是合并的前提
    entities.sort(key=lambda x: x.get('start', 0))

    merged_entities: List[Dict[str, Any]] = []
    i = 0
    while i < len(entities):
        current_entity = entities[i] # 直接引用，如果合并则修改或跳过

        # 检查当前实体是否是需要考虑合并的类型 (来自NER的单字人名)
        is_single_char_ner_person = (
            current_entity.get('source') == 'NER' and
            current_entity.get('type', '').upper() in {"PERSON", "NAME"} and
            current_entity.get('end', 0) - current_entity.get('start', 0) == 1
        )

        if is_single_char_ner_person:
            merged = False
            j = i + 1
            # 向后查找紧邻的单字人名实体
            while j < len(entities):
                next_entity = entities[j]
                is_adjacent_single_char_ner_person = (
                    next_entity.get('start') == current_entity.get('end') and # 必须紧邻
                    next_entity.get('source') == 'NER' and
                    next_entity.get('type', '').upper() in {"PERSON", "NAME"} and
                    next_entity.get('end', 0) - next_entity.get('start', 0) == 1
                )

                if is_adjacent_single_char_ner_person:
                    # 找到了可以合并的，更新当前实体的信息
                    print(f"  合并人名: '{current_entity.get('value','')}' + '{next_entity.get('value','')} -> '{current_entity.get('value','') + next_entity.get('value','')}'")
                    current_entity['value'] += next_entity.get('value', '')
                    current_entity['end'] = next_entity.get('end')
                    # 合并分数：可以取最低分、平均分、最高分或第一个。这里取最低分作为保守估计。
                    current_entity['score'] = min(current_entity.get('score', 1.0), next_entity.get('score', 1.0))
                    current_entity['source'] = 'NER_Merged' # 标记来源为合并产生
                    merged = True
                    j += 1 # 继续尝试合并下一个（例如处理 "欧 阳 修"）
                else:
                    break # 不是紧邻的单字人名，停止向后查找

            # 将合并后的（或未发生合并的）当前实体加入结果列表
            merged_entities.append(current_entity)
            # 更新主循环的索引 i，跳过所有被合并的实体
            i = j
        else:
            # 当前实体不是需要合并的类型，直接加入结果列表
            merged_entities.append(current_entity)
            i += 1 # 处理下一个

    return merged_entities

# --- 主检测与脱敏函数 ---

def detect_and_desensitize_pii_enhanced(
    input_text: str,
    ner_pipeline_instance: Optional[Pipeline], # 显式传入已加载的 pipeline
    ner_confidence_threshold: float = NER_CONFIDENCE_THRESHOLD
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    检测并脱敏文本中的 PII（增强版）。
    结合高精度正则和基于 Transformer 的 NER 模型，并进行后处理（如合并人名）。

    处理流程:
    1. 正则表达式优先检测：查找电话、邮箱、身份证号、银行卡号。记录匹配位置。
    2. NER 模型检测：如果模型已加载，对整个文本进行 NER。
    3. 结果合并与过滤：
        - 保留所有 Regex 结果。
        - 保留满足置信度阈值、且不与 Regex 结果重叠的 NER 结果。
        - (注意：此版本不处理 NER 结果之间的重叠，依赖后续脱敏步骤的优先级处理)
    4. 后处理：合并相邻的单字 NER 人名。
    5. 脱敏：根据最终确定的 PII 列表及其类型，在原始文本副本上进行脱敏替换。
       使用逆序处理和已处理索引集合，确保替换的准确性。

    Args:
        input_text (str): 需要处理的原始文本。
        ner_pipeline_instance (Optional[Pipeline]): 已加载的 NER pipeline 实例，或 None。
        ner_confidence_threshold (float): NER 预测的置信度阈值。

    Returns:
        Tuple[str, List[Dict[str, Any]]]:
            - str: 脱敏处理后的文本。
            - List[Dict[str, Any]]: 检测到的 PII 详细信息列表 (按起始位置排序)。
              包含: type, value, start, end, source ('Regex', 'NER', 'NER_Merged'), score.
    """
    if not input_text:
        return "", []

    detected_pii: List[Dict[str, Any]] = []
    # 记录被 Regex 匹配占用的字符索引区间 (start, end)
    regex_claimed_spans: List[Tuple[int, int]] = []

    # --- 步骤 1: 正则表达式检测 (高优先级) ---
    print("\n--- 开始 Regex 检测 ---")
    for pii_type, pattern in REGEX_PATTERNS.items():
        try:
            for match in re.finditer(pattern, input_text):
                start, end = match.span()
                original_value = match.group(0)
                # 注意：这里简单添加，暂不处理 Regex 之间的重叠（一般正则设计上会避免）
                print(f"Regex 发现: {pii_type} - '{original_value}' at [{start}:{end}]")
                detected_pii.append({
                    "type": pii_type, "value": original_value, "start": start, "end": end,
                    "source": "Regex", "score": 1.0 # 正则匹配视为最高置信度
                })
                regex_claimed_spans.append((start, end))
        except Exception as e:
            print(f"Regex 处理 {pii_type} 时出错: {e}", file=sys.stderr)
    print(f"--- Regex 检测结束 (发现 {len(detected_pii)} 个) ---")

    # 对 Regex 结果排序并优化 claimed_spans (合并重叠或包含的区间)
    regex_claimed_spans.sort()
    merged_spans = []
    for start, end in regex_claimed_spans:
        if not merged_spans or start > merged_spans[-1][1]:
            merged_spans.append([start, end])
        else:
            merged_spans[-1][1] = max(merged_spans[-1][1], end)
    regex_claimed_spans = [(s, e) for s, e in merged_spans] # 转回 tuple list

    # --- 步骤 2: NER 模型检测 ---
    print("\n--- 开始 NER 检测 ---")
    ner_found_count = 0
    if ner_pipeline_instance:
        try:
            # 在原始文本上运行 NER
            ner_results = ner_pipeline_instance(input_text)
            for entity in ner_results:
                entity_type_label = entity.get('entity_group', 'UNKNOWN').upper()
                start = entity.get('start')
                end = entity.get('end')
                original_value = entity.get('word')
                score = entity.get('score', 0.0)

                # 1. 基本有效性检查 和 目标类型检查
                if start is None or end is None or start >= end or not original_value or entity_type_label not in PII_ENTITY_TYPES_NER:
                    continue

                # 2. 置信度阈值过滤
                if score < ner_confidence_threshold:
                    # print(f"  NER 忽略 (低置信度 {score:.3f}): {entity_type_label} - '{original_value}' at [{start}:{end}]")
                    continue

                # 3. 检查是否与高优先级的 Regex 结果重叠
                is_overlapped_with_regex = False
                for r_start, r_end in regex_claimed_spans:
                    # 检查区间是否有交集: max(start1, start2) < min(end1, end2)
                    if max(start, r_start) < min(end, r_end):
                        is_overlapped_with_regex = True
                        # print(f"  NER 忽略 (与 Regex 重叠): {entity_type_label} - '{original_value}' at [{start}:{end}]")
                        break

                if not is_overlapped_with_regex:
                    print(f"NER 发现: {entity_type_label} - '{original_value}' at [{start}:{end}], score={score:.4f}")
                    detected_pii.append({
                        "type": entity_type_label, "value": original_value, "start": start, "end": end,
                        "source": "NER", "score": score
                    })
                    ner_found_count += 1

        except Exception as e:
            print(f"NER 处理时出错: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc() # 打印详细堆栈信息
    else:
        print("NER pipeline 未加载，跳过 NER 检测。")
    print(f"--- NER 检测结束 (发现 {ner_found_count} 个有效实体) ---")

    # --- 步骤 3: 后处理 (合并人名等) ---
    print("\n--- 开始后处理 (合并相邻单字人名) ---")
    # 注意：合并前需要保证是按起始位置排序的
    detected_pii.sort(key=lambda x: x['start'])
    print(f"合并前检测到的 PII 总数: {len(detected_pii)}")
    merged_pii = merge_adjacent_single_char_persons(detected_pii)
    print(f"合并后检测到的 PII 总数: {len(merged_pii)}")
    print("--- 后处理结束 ---")
    # 注意：merged_pii 内部实体仍可能存在其他类型的重叠（如 地址 vs GPE），
    # 但脱敏步骤会基于位置优先级处理。

    # --- 步骤 4: 应用脱敏 ---
    print("\n--- 开始应用脱敏替换 ---")
    processed_text_list: List[str] = list(input_text) # 在副本上操作
    final_claimed_indices: Set[int] = set() # 跟踪最终被替换的字符索引
    desensitized_count = 0
    # 按结束位置逆序处理合并后的结果，防止索引错乱
    merged_pii.sort(key=lambda x: x.get('end', 0), reverse=True)

    for pii_item in merged_pii:
        start = pii_item.get('start', -1)
        end = pii_item.get('end', -1)

        # 基本检查 + 检查是否与已应用的脱敏区域重叠
        if start == -1 or end == -1 or start >= end or any(i in final_claimed_indices for i in range(start, end)):
            # 如果重叠，跳过当前项（因为是按结束位置逆序，意味着更早结束的、可能被包含的项已被处理）
            # print(f"  跳过重叠或无效区域: '{pii_item.get('value')}' at [{start}:{end}]")
            continue

        # 获取类型和值，进行脱敏
        pii_type = pii_item.get('type', 'UNKNOWN').upper()
        original_value = pii_item.get('value', '') # 使用 get 避免 KeyError
        desensitized_value = desensitize_pii(original_value, pii_type)

        # 只有当脱敏后的值与原值不同时才进行替换
        if original_value != desensitized_value:
            print(f"应用脱敏: 将 '{original_value}' (Type: {pii_type}, Src: {pii_item.get('source')}) 替换为 '{desensitized_value}' at [{start}:{end}]")
            # 执行替换 (注意 list 切片替换的用法)
            processed_text_list[start:end] = list(desensitized_value)
            final_claimed_indices.update(range(start, end)) # 标记此区域已被最终处理
            desensitized_count += 1
        # else:
            # print(f"无需脱敏或规则未生效: '{original_value}' at [{start}:{end}]")

    print(f"--- 应用脱敏结束 (共 {desensitized_count} 处) ---")

    final_text: str = "".join(processed_text_list)
    # 返回按起始位置排序的最终 PII 列表
    merged_pii.sort(key=lambda x: x.get('start', 0))
    return final_text, merged_pii

# --- 主测试执行 ---
if __name__ == "__main__":
    # 加载模型
    ner_pipeline_instance, loaded_model_name = load_ner_pipeline()

    print("\n" + "=" * 60)
    print("环境与配置信息:")
    if torch:
        print(f"  PyTorch Version: {torch.__version__}")
        print(f"  CUDA Available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            try:
                print(f"    GPU Name (Device 0): {torch.cuda.get_device_name(0)}")
                print(f"    CUDA Version: {torch.version.cuda}")
            except Exception as e:
                print(f"    无法获取 GPU 详细信息: {e}")
    else:
        print("  Torch 未安装或导入失败。")
    print(f"  使用的 NER 模型: {loaded_model_name if loaded_model_name else '无 (仅 Regex)'}")
    print(f"  NER 置信度阈值: {NER_CONFIDENCE_THRESHOLD}")
    print(f"  将检测的 NER 实体类型: {PII_ENTITY_TYPES_NER}")
    print(f"  使用的 Regex 模式数量: {len(REGEX_PATTERNS)}")
    print("=" * 60)

    # 扩展的测试用例
    test_texts: List[str] = [
        # 基础用例
        "你好，我是张三，我的电话是13812345678，邮箱是zhangsan@example.com。我们公司在北京朝阳区。",
        "请联系李四，他的身份证号是 11010119900307123X，旧号码是110101900307123，地址在上海市人民路 1 号。银行卡号6228480012345678901。",
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

    print("\n" + "=" * 60)
    print("开始 PII 检测与脱敏测试")
    print("=" * 60)
    if not ner_pipeline_instance and not REGEX_PATTERNS:
         print("\n严重警告：NER 模型未加载且无 Regex 规则，无法进行有效测试。\n")
         # sys.exit(1) # 可以选择退出，或者继续看空跑
    elif not ner_pipeline_instance:
         print("\n警告：NER 模型未加载，测试将仅依赖 Regex。\n")

    for i, text in enumerate(test_texts):
        print(f"\n--- 测试用例 {i+1} ---")
        print(f"原始文本:\n'{text}'") # 用引号包裹原始文本，便于看清空格等
        try:
            # 调用主函数，传入已加载的 pipeline 实例
            desensitized_text, pii_info = detect_and_desensitize_pii_enhanced(
                text,
                ner_pipeline_instance=ner_pipeline_instance,
                ner_confidence_threshold=NER_CONFIDENCE_THRESHOLD
            )
            print(f"\n脱敏后文本:\n'{desensitized_text}'") # 用引号包裹结果
            print(f"\n检测到的 PII 详情 ({len(pii_info)} 个):")
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