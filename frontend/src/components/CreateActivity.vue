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

      <!-- 类型选择 -->
      <div class="form-item">
        <label for="type">活动类型</label>
        <select v-model="type" id="type">
          <option value="修改">修改</option>
          <option value="上传">上传</option>
          <option value="添加">添加</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <!-- 颜色选择 -->
      <div class="form-item">
        <label for="color">选择颜色</label>
        <select v-model="iconColor" id="color">
          <option value="#5dc983">绿色</option>
          <option value="#7784ee">蓝色</option>
          <option value="#fba63c">橙色</option>
           <option value="#ffbebe">红色</option>
        </select>
      </div>

      <!-- 提交按钮 -->
      <button @click="submitActivity" class="submit-btn">上传活动</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus'; // 导入 ElMessage

// 父组件传递的函数（通过 emits）
const emit = defineEmits(['addActivity', 'cancel']); // 添加 'cancel'


// 定义响应式变量
const description = ref('');
const date = ref('');
const type = ref('修改');
const iconColor = ref('#5dc983');

// 提交活动的函数
const submitActivity = () => {
  if (!description.value || !date.value) {
    ElMessage.error('事项描述和日期不能为空！');
    return;
  }

  const newActivity = {
    iconColor: iconColor.value,
    icon: getIconByType(type.value),
    description: description.value,
    date: date.value,
  };

  emit('addActivity', newActivity); // 触发父组件的 addActivity 方法

  // 清空表单（可选，如果希望在添加后保留数据，可以不执行这些）
  description.value = '';
  date.value = '';
  type.value = '修改';
  iconColor.value = '#5dc983';
};

// 根据活动类型选择不同的图标
const getIconByType = (type) => {
  switch (type) {
    case '修改':
      return '✏️';
    case '上传':
      return '📁';
    case '添加':
      return '➕';
    default:
      return '✏️';
  }
};
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
  border-radius: 8px;
  /* box-shadow: rgba(35, 56, 85, 0.15) 0px 20px 40px; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
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

input, select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 18px;
}

button {
  padding: 10px 20px;
  background-color: #9acafa;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  padding: 10px;
}

button:hover {
  background-color: #66b1ff;
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

  button {
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

  button {
    font-size: 14px;
    padding: 6px 12px;
  }
}
</style>
