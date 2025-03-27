<template>
  <div class="create-activity-container">
    <h2 class="title">添加新活动</h2>

    <div class="form">
      <!-- 事项描述 -->
      <div class="form-item">
        <label for="description">事项描述</label>
        <input v-model="description" type="text" id="description" placeholder="输入事项描述" @keyup.enter="submitActivity"/>
      </div>

      <!-- 日期选择 -->
      <div class="form-item">
        <label for="date">日期</label>
        <input v-model="date" type="date" id="date" @keyup.enter="submitActivity"/>
      </div>

      <!-- 活动类型选择 -->
      <div class="form-item">
        <label for="type">活动类型</label>
        <select v-model="type" id="type" @change="updateColorByType">
          <option v-for="(value, key) in activityTypes" :key="key" :value="key">
            {{ key }}
          </option>
          <option value="其他">其他</option>
        </select>
      </div>

      <!-- 分类标签（颜色预览） -->
      <div class="form-item1">
        <label for="color">分类标签</label>
        <span class="color-preview" :style="{ backgroundColor: iconColor }"></span>
      </div>

      <!-- 操作按钮组 -->
      <div class="button-group">
        <button @click="submitActivity" class="submit-btn">上传活动</button>
        <button @click="cancel" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus'; // 导入 ElMessage

// 父组件传递的函数（通过 emits）
const emit = defineEmits(['addActivity', 'cancel']);

// 定义响应式变量
const description = ref('');
const date = ref('');
const type = ref('锻炼');
const iconColor = ref('#5dc983');

// 活动类型映射
const activityTypes = {
  '学习': { color: '#67b2fd', icon: '📖' },
  '计划': { color: '#67b2fd', icon: '📆' },
  '会议': { color: '#67b2fd', icon: '👥' },
  '培训': { color: '#67b2fd', icon: '📚' },
  '出差': { color: '#67b2fd', icon: '✈️' },
  '汇报': { color: '#67b2fd', icon: '🗒️' },
  '文档': { color: '#67b2fd', icon: '📝' },
  '观影': { color: '#ad9afa', icon: '🎬' },
  '旅行': { color: '#ad9afa', icon: '🏕️' },
  '锻炼': { color: '#5dc983', icon: '🏋️' },
  '修改': { color: '#ffbebe', icon: '✏️' },
  '上传': { color: '#ffbebe', icon: '📁' },
  '添加': { color: '#ffbebe', icon: '➕' },
};

// 根据活动类型选择不同的图标
const getIconByType = (type) => {
  return activityTypes[type]?.icon || '✏️';
};

// 根据活动类型获取颜色
const getColorByType = (type) => {
  return activityTypes[type]?.color || '#ffbebe';
};

// 根据活动类型更新颜色
const updateColorByType = () => {
  iconColor.value = getColorByType(type.value);
};

// 提交活动的函数
const submitActivity = () => {
  if (!description.value.trim()) {
    ElMessage.warning('事项描述不能为空！');
    return;
  }
  if (!date.value) {
    ElMessage.warning('日期不能为空！');
    return;
  }
  // 可以添加更多日期格式验证逻辑

  const newActivity = {
    iconColor: iconColor.value,
    icon: getIconByType(type.value),
    description: description.value,
    date: date.value,
    type: type.value
  };

  emit('addActivity', newActivity); // 触发父组件的 addActivity 方法

  // 清空表单
  description.value = '';
  date.value = '';
  type.value = '锻炼';
  updateColorByType();
};

// 取消操作
const cancel = () => {
  emit('cancel');
  // 清空表单
  description.value = '';
  date.value = '';
  type.value = '锻炼';
  updateColorByType();
};

// 初始化颜色
updateColorByType();
</script>

<style scoped>
/* 样式保持不变 */
.create-activity-container {
  width: 90%;
  height: auto;
  /* background-color: #fff; */
  background-color: var(--background-color); /* 使用全局背景颜色 */
  max-width: 100%;
  padding: 20px;
  /* border-radius: 8px;
  box-shadow: var(--global-box-shadow); */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  font-size: 18px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}


.form-item1 {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

input, select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 18px;
}

.button-group {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #9acafa;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #ccc;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #66b1ff;
}

.cancel-btn:hover {
  background-color: #999;
}

.color-preview {
  width: 40px;
  height: 20px;
  border-radius: 4px;
  border: none;
  margin-left: 20px;
}

/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .create-activity-container {
    width: 95%;
    padding: 15px;
  }

  .title {
    font-size: 18px;
    margin-bottom: 15px;
  }

  .form {
    font-size: 16px;
    gap: 15px;
  }

  .form-item {
    gap: 3px;
  }

  input,
  select {
    padding: 8px;
    font-size: 16px;
  }

  .button-group {
    gap: 15px;
  }

  .submit-btn,
  .cancel-btn {
    font-size: 16px;
    padding: 8px 16px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .create-activity-container {
    width: 100%;
    padding: 10px;
  }

  .title {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .form {
    font-size: 14px;
    gap: 10px;
  }

  .form-item {
    gap: 2px;
  }

  input,
  select {
    padding: 6px;
    font-size: 14px;
  }

  .button-group {
    gap: 10px;
  }

  .submit-btn,
  .cancel-btn {
    font-size: 14px;
    padding: 6px 12px;
  }
}
</style>