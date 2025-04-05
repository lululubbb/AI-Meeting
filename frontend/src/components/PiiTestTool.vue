<!-- src/components/PiiTestTool.vue -->
<template>
  <el-card class="pii-test-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>PII 脱敏测试工具</span>
        <el-tooltip content="快速测试后端 PII 过滤 API" placement="top">
          <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
      </div>
    </template>

    <el-input
      v-model="inputText"
      type="textarea"
      :rows="3"
      placeholder="在此输入需要脱敏的文本..."
      style="margin-bottom: 10px;"
    />
    <el-button
      type="primary"
      @click="handlePiiFilter"
      :loading="isFiltering"
      :disabled="!inputText.trim()"
      size="small"
    >
      <el-icon style="margin-right: 4px;"><MagicStick /></el-icon>
      执行脱敏
    </el-button>

    <div v-if="desensitizedText !== null" style="margin-top: 15px;">
      <strong>脱敏结果:</strong>
      <el-input
        :model-value="desensitizedText"
        type="textarea"
        :rows="3"
        readonly
        placeholder="脱敏后的文本将显示在这里"
        style="margin-top: 5px; background-color: #f9f9f9;"
      />
    </div>
    <div v-if="filterError" style="margin-top: 10px; color: red;">
      错误: {{ filterError }}
    </div>
     <!-- (可选) 显示 PII 详情 -->
     <!-- <div v-if="detectedPiiDetails.length > 0" ... > ... </div> -->
  </el-card>
</template>

<script setup>
import { ref } from 'vue';
// 导入需要的 Element Plus 组件和图标
import {
  ElCard,
  ElInput,
  ElButton,
  ElIcon,
  ElMessage,
  ElTooltip
} from 'element-plus';
import { InfoFilled, MagicStick } from '@element-plus/icons-vue';
// 导入 axios
import axios from 'axios';

// --- PII 测试相关状态变量 ---
const inputText = ref('');
const desensitizedText = ref(null);
const isFiltering = ref(false);
const filterError = ref('');
// const detectedPiiDetails = ref([]); // 如果需要显示详情

// --- PII 脱敏处理函数 ---
const handlePiiFilter = async () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入需要脱敏的文本');
    return;
  }
  isFiltering.value = true;
  filterError.value = '';
  desensitizedText.value = null;
  // detectedPiiDetails.value = [];

  try {
    // **重要:** 替换为你后端 API 的实际地址
    const apiUrl = 'http://localhost:5000/api/pii-filter';
    console.log(`[PiiTestTool] 发送请求到: ${apiUrl}`);
    const response = await axios.post(apiUrl, {
      text: inputText.value
    });
    console.log('[PiiTestTool] 收到响应:', response.data);

    if (response.data) {
      desensitizedText.value = response.data.desensitizedText !== undefined ? response.data.desensitizedText : '处理完成，但未返回脱敏文本。';
      // if (Array.isArray(response.data.detectedPiiDetails)) { // 处理详情
      //   detectedPiiDetails.value = response.data.detectedPiiDetails;
      // }
    } else {
      filterError.value = '处理失败，响应数据无效。';
      ElMessage.error(filterError.value);
    }
  } catch (error) {
    console.error('[PiiTestTool] 调用 PII 过滤 API 时出错:', error);
    if (error.response) {
      filterError.value = `请求失败 (${error.response.status}): ${error.response.data?.error || '未知服务器错误'}`;
    } else if (error.request) {
      filterError.value = '请求后端服务失败，无法连接或超时。';
    } else {
      filterError.value = `请求设置错误: ${error.message}`;
    }
    ElMessage.error(filterError.value);
    desensitizedText.value = null;
    // detectedPiiDetails.value = [];
  } finally {
    isFiltering.value = false;
  }
};
</script>

<style scoped>
.pii-test-card {
  /* 可以定义一些默认样式，或者在使用的地方通过 class 覆盖 */
  border: 1px solid #eee;
}

.pii-test-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 1.05em; /* 比主页推荐的标题稍小一点 */
}

.pii-test-card .card-header .el-icon {
  color: #909399;
  cursor: help;
}
</style>