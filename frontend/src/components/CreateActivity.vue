<template>
    <div class="create-activity-container">
    <h2 class="title">添加新活动</h2>

    <div class="form">
        <!-- 事项描述 -->
        <div class="form-item">
        <label for="description">事项描述</label>
        <input v-model="description" type="text" id="description" placeholder="输入事项描述"  @keyup.enter="submitActivity"/>
        </div>

        <!-- 日期选择 -->
        <div class="form-item">
        <label for="date">日期</label>
        <input v-model="date" type="date" id="date"  @keyup.enter="submitActivity"/>
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
import { ElMessage } from 'element-plus';

// 父组件传递的函数
const emit = defineEmits(['addActivity']);

// 定义响应式变量
const description = ref('');
const date = ref('');
const type = ref('修改');
const iconColor = ref('#5dc983');

  // 提交活动的函数
const submitActivity = () => {
     // 校验事项描述和日期是否为空
    if (!description.value || !date.value) {
    ElMessage.error('事项描述和日期不能为空！'); // 显示错误信息
    return; // 如果为空，阻止上传活动
    }

    // 生成活动数据
    const newActivity = {
    iconColor: iconColor.value,
    icon: getIconByType(type.value), // 根据类型选择不同的图标
    description: description.value,
    date: date.value,
};

    // 向父组件发送事件，添加新活动
    emit('addActivity', newActivity);

    // 清空表单
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
  </style>
  