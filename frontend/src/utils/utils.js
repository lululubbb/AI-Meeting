// src/utils/utils.js

import { ref } from 'vue'
import { ElMessage } from 'element-plus';

// 显示消息提示
export function showSnackBar(message) {
  ElMessage.warning(message) // 简化版，实际项目可以使用 Toast 组件
}

// 创建视频播放器组件引用
export const videoPlayerRefs = ref({})
