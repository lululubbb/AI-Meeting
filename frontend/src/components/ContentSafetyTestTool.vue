<!-- src/components/ContentSafetyTestTool.vue -->
<template>
    <el-card class="content-safety-test-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>内容安全检查工具</span>
          <el-tooltip content="使用 Detoxify 模型检测文本风险" placement="top">
          </el-tooltip>
        </div>
      </template>
  
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="3"
        placeholder="输入需要进行安全检查的文本..."
        style="margin-bottom: 10px;"
      />
      <el-button
        type="warning"  
        @click="handleSafetyCheck"
        :loading="isLoading"
        :disabled="!inputText.trim()"
        size="small"
      >
        <el-icon style="margin-right: 4px;"><Search /></el-icon>
        检查安全性
      </el-button>
  
      <!-- 结果显示区域 -->
      <div v-if="checkResult !== null" style="margin-top: 15px;">
         <el-alert
          :title="checkResult.isSafe ? '内容安全' : '内容不安全'"
          :type="checkResult.isSafe ? 'success' : 'error'"
          show-icon
          :closable="false"
        >
          <template #default>
            <div v-if="!checkResult.isSafe && checkResult.reasons && checkResult.reasons.length > 0">
              <strong>检测到的风险:</strong>
              <ul>
                <li v-for="(reason, index) in checkResult.reasons" :key="index" style="margin-left: 15px;">{{ reason }}</li>
              </ul>
            </div>
            <div v-if="checkResult.scores" style="margin-top: 8px; font-size: 0.9em; opacity: 0.8;">
                <strong>相关分数:</strong>
                <div>
                    <el-tag
                      v-for="(score, label) in checkResult.scores"
                      :key="label"
                      size="small"
                      :type="score > (DETOXIFY_THRESHOLDS[label] || 0.99) ? 'danger' : 'info'"
                      effect="light"
                      style="margin-right: 5px; margin-top: 3px;"
                     >
                     {{ label }}: {{ score.toFixed(4) }}
                   </el-tag>
                </div>
            </div>
            <div v-if="checkResult.message" style="margin-top: 8px; font-size: 0.9em;">
                {{ checkResult.message }}
            </div>
          </template>
         </el-alert>
      </div>
  
      <!-- API 调用错误显示 -->
      <div v-if="apiError" style="margin-top: 10px; color: red;">
         错误: {{ apiError }}
      </div>
  
    </el-card>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  // 导入 Element Plus 组件和图标
  import {
    ElCard,
    ElInput,
    ElButton,
    ElIcon,
    ElMessage,
    ElTooltip,
    ElAlert, // 用于显示结果
    ElTag    // 用于显示分数
  } from 'element-plus';
  import {  Search } from '@element-plus/icons-vue'; // 导入新图标
  // 导入 axios
  import axios from 'axios';
  
  // --- 组件内部状态 ---
  const inputText = ref('');
  const isLoading = ref(false);
  const apiError = ref('');
  const checkResult = ref(null); // 存储检查结果: { isSafe: boolean, scores: object|null, reasons: string[]|null, message?: string }
  
  // 从后端或配置文件获取阈值会更好，这里暂时硬编码以便显示 Tag 类型
  const DETOXIFY_THRESHOLDS = {
      'toxicity': 0.8,
      'severe_toxicity': 0.5,
      'obscene': 0.8,
      'threat': 0.6,
      'insult': 0.7,
      'identity_hate': 0.6,
      'identity_attack': 0.6 // 包含 unbiased 模型的标签
  };
  
  
  // --- 内容安全检查处理函数 ---
  const handleSafetyCheck = async () => {
    if (!inputText.value.trim()) {
      ElMessage.warning('请输入需要检查的文本');
      return;
    }
    isLoading.value = true;
    apiError.value = '';
    checkResult.value = null; // 清空旧结果
  
    try {
      // **重要:** 替换为你后端 API 的实际地址
      const apiUrl = 'http://localhost:5000/api/check-safety';
      console.log(`[ContentSafetyTestTool] 发送请求到: ${apiUrl}`);
      const response = await axios.post(apiUrl, {
        text: inputText.value
      });
      console.log('[ContentSafetyTestTool] 收到响应:', response.data);
  
      if (response.data && typeof response.data.isSafe === 'boolean') {
        checkResult.value = {
            isSafe: response.data.isSafe,
            scores: response.data.scores || null, // 后端返回的分数
            reasons: response.data.reasons || null, // 后端返回的原因
            message: response.data.message || null // 后端可能返回的附加信息
        };
      } else {
        apiError.value = '处理失败，响应数据格式不符合预期。';
        ElMessage.error(apiError.value);
        checkResult.value = null; // 确保结果为空
      }
    } catch (error) {
      console.error('[ContentSafetyTestTool] 调用内容安全 API 时出错:', error);
      if (error.response) {
        apiError.value = `请求失败 (${error.response.status}): ${error.response.data?.error || '未知服务器错误'}`;
      } else if (error.request) {
        apiError.value = '请求后端服务失败，无法连接或超时。';
      } else {
        apiError.value = `请求设置错误: ${error.message}`;
      }
      ElMessage.error(apiError.value);
      checkResult.value = null; // 出错时清空结果
    } finally {
      isLoading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .content-safety-test-card {
    border: 1px solid #f0ad4e; /* 使用警告色边框 */
  }
  
  .content-safety-test-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 1.05em;
  }
  
  .content-safety-test-card .card-header .el-icon {
    color: #f0ad4e; /* 警告色图标 */
    cursor: help;
  }
  
  /* Alert 内部列表样式 */
  .el-alert ul {
      padding-left: 20px;
      margin-top: 5px;
      margin-bottom: 0;
  }
  .el-alert li {
      font-size: 0.9em;
      line-height: 1.4;
  }
  </style>