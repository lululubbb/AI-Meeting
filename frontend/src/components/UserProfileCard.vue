<!-- src/components/UserProfileCard.vue -->
<template>
  <div class="user-card">
    <div class="card-header">
      <div class="avatar-container">
    <div class="avatar-wrapper">
      <img 
        :src="editableUser.avatarUrl || defaultAvatar" 
        alt="User Avatar" 
        class="user-avatar" 
        :class="{ editable: isEditing }"
        @click="handleAvatarClick"
      />

    </div>
    <input 
      type="file" 
      ref="avatarInput" 
      accept="image/*" 
      @change="handleAvatarChange"
      style="display: none"
    />
  </div>
      <button v-if="!isEditing" @click="editProfile" class="edit-btn">编辑</button>
    </div>
    
    <div v-if="isEditing">
      <p class="user-name">
        <el-input v-model="editableUser.name"/>
      </p>
      <p class="user-email">{{ user.email }}</p> <!-- Email is read-only -->
      
      <p class="info">状态信息：
        <el-select v-model="editableUser.status" placeholder="选择状态">
          <el-option label="在线" value="在线"></el-option>
          <el-option label="离线" value="离线"></el-option>
          <el-option label="请勿打扰" value="请勿打扰"></el-option>
          <el-option label="离开" value="离开"></el-option>
        </el-select>
      </p>

      <p class="info">工作位置：
        <el-input v-model="editableUser.workLocation" />
      </p>
      
      <el-button type="primary" size="small" @click="saveChanges">保存</el-button>
      <el-button size="small" @click="cancelEditing">取消</el-button>
    </div>

    <div v-else>
      <p class="user-name">{{ user.name }}</p>
      <p class="user-email">{{ user.email }}</p>

      <p>状态信息：{{ user.status }}</p>
      <p>工作位置：{{ user.workLocation }}</p>
    </div>
    
    <el-button type="text" @click="goToHelpPage">帮助</el-button>
    <el-button type="text" @click="goToSettingsPage">设置</el-button>
    <el-button type="text" @click="logout">退出登录</el-button>

    <!-- 关闭按钮 -->
    <el-button type="text" @click="closeCard">关闭</el-button>
  </div>
</template>

<script setup>
import { ref,onMounted  } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import AuthService from '../services/AuthService'; // 导入 AuthService
import { defineEmits } from 'vue';
import defaultAvatar from '@/assets/柴犬.png'; // 默认头像
import axios from 'axios';
// 获取 Vuex store 和 Router 实例
const store = useStore();
const router = useRouter();
// 定义要触发的事件
const emit = defineEmits();

// 定义用户信息
const user = ref(store.state.user);

// 控制是否处于编辑模式
const isEditing = ref(false);

// 创建可编辑的用户副本
const editableUser = ref({
  uid: user.value.uid || '',
  name: user.value.name || '',
  status: user.value.status || '在线',
  workLocation: user.value.workLocation || '中国',
  mood: user.value.mood || '开心', 
  avatarUrl:user.value.avatarUrl || ''
});

// 编辑按钮点击事件
const editProfile = () => {
  isEditing.value = true;
  console.log('isEditing:', isEditing.value); // 调试信息
};

// 头像上传相关引用
const avatarInput = ref(null);
const isUploading = ref(false);

// 修改后的script部分
const handleAvatarClick = () => {
  console.log('点击事件触发，当前编辑模式:', isEditing.value)
  console.log('avatarInput 引用:', avatarInput.value)
  
  if (isEditing.value && avatarInput.value) {
    console.log('准备触发文件选择')
    avatarInput.value.click()
  } else {
    console.warn('无法触发文件选择，原因:', 
      !isEditing.value ? '未在编辑模式' : '没有找到文件输入元素')
  }
}
// 在handleAvatarChange方法中添加数据库保存逻辑
const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  isUploading.value = true; // 显示上传中的加载状态

  console.log('用户 ID:', user.value.uid);

  try {
    const formData = new FormData();
    formData.append('avatar', file);
    if (user.value.uid) {
      formData.append('userId', user.value.uid);
    } else {
      console.error('用户 ID 未定义');
      return;
    }

    // 打印 formData 内容进行调试
    for (let pair of formData.entries()) {
      console.log('form',pair[0] + ': ' + pair[1]);
    }

    // 调用后端上传头像的 API
    // 在handleAvatarChange方法中修改请求URL
  // 使用模板字符串确保参数正确拼接
  const response = await axios.post(
      `http://localhost:4000/api/upload-avatar?userId=${encodeURIComponent(user.value.uid)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // 更新可编辑用户信息的头像 URL
    editableUser.value.avatarUrl = response.data.avatarUrl;
    ElMessage.success('头像更新成功');
  } catch (error) {
    console.error('头像上传失败:', error);
    ElMessage.error('头像上传失败');
  } finally {
    isUploading.value = false; // 隐藏上传中的加载状态
  }
};


// 保存修改——仅仅修改vuex中数据
// const saveChanges = () => {
//   // 保存修改的用户信息到 Vuex 或数据库
//   user.value = { ...editableUser.value }; // 更新用户信息
//   ElMessage.success('修改已保存');
//   isEditing.value = false; // 退出编辑模式
//   // 这里可以调用API将修改的信息保存到数据库
//   // updateUserProfile(user.value);
// };

// 保存修改到数据库
const saveChanges = async () => {
  try {
    // 创建一个新的对象，只包含需要更新的字段
    const userDataToUpdate = {
      ...editableUser.value, 
      uid: editableUser.value.uid,
      name: editableUser.value.name,
      status: editableUser.value.status,
      workLocation: editableUser.value.workLocation,
      mood: editableUser.value.mood,
      avatarUrl: editableUser.value.avatarUrl // 包含头像 URL
    };

    // 调用 UserService 来更新用户信息到 Firebase Firestore
    await AuthService.updateUserStatus(userDataToUpdate);

    // 更新本地 store 或者直接更新 user 信息
    user.value = { ...editableUser.value };
    ElMessage.success('修改已保存');
    isEditing.value = false; // 退出编辑模式
  } catch (error) {
    ElMessage.error('保存失败');
    console.error('保存失败:', error);
  }
};
// 取消编辑
const cancelEditing = () => {
  editableUser.value = { ...user.value }; // 恢复原始信息
  isEditing.value = false;
};

// 退出登录
const logout = async () => {
  try {
    await AuthService.signOutUser(); // 调用 AuthService 退出登录
    ElMessage.success('已成功退出登录');
    router.push('/login'); // 重定向到登录页
  } catch (error) {
    ElMessage.error('退出登录失败');
  }
};

// 跳转到帮助页面
const goToHelpPage = () => {
  router.push('/help');
};

// 跳转到设置页面
const goToSettingsPage = () => {
  router.push('/settings');
};

// 关闭卡片
const closeCard = () => {
  // 触发父组件的事件来关闭卡片
  emit('close');
};

onMounted(() => {
  // 通过 $refs 获取输入框引用
  console.log('avatarInput 引用:', avatarInput.value);
});
</script>

<style scoped>
.user-card {
  position: absolute;
  right: 30px;
  top: 70px;
  width: 300px;
  padding: 25px;
  /* background: #fff; */
  background-color: var(--background-color); /* 使用全局背景颜色 */
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  border-radius: 10px;
  font-size: 18px;
  z-index: 999;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-wrapper {
  position: relative;
}

.uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uploading-overlay .el-icon {
  color: #fff;
  font-size: 24px;
  animation: rotating 2s linear infinite;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  transition: opacity 0.3s ease;
  position: relative;
  z-index: 10;
}
input[type="file"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0; /* 让 input 元素透明 */
  z-index: 0; /* 确保 input 元素在下层 */
}
.user-avatar.editable {
  cursor: pointer;
  opacity: 0.9;
}

.user-avatar:not(.editable) {
  cursor: default;
  opacity:1;
}

.user-avatar:hover.editable {
  opacity: 0.8;
}
div p{
  font-size: 16px;
  margin-bottom: 5px;
}
.info{
  font-size: 15px;
}
.user-name {
  font-weight: bold;
  font-size: 22px;
  margin-bottom: 0px;
  margin-top: 10px;
  color: var(--text-color);
}

.user-email {
  color: var(--text-color);
  font-size: 18px;
  font-weight: bold;
  margin-top: 10px;
}

.edit-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  color:rgba(0, 132, 255, 0.97);
  cursor: pointer;
}

.el-input {
  width: 100%;
  font-size: 14px;
  margin-top: 5px;
}

.el-select {
  font-size: 20px;
}

.el-button {
  font-size: 16px;
  margin-top: 10px;
  padding: 10px;
}

.el-button + .el-button {
  margin-left: 10px;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .user-card {
    right: 15px;
    top: 60px;
    width: 280px;
    padding: 20px;
    font-size: 16px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
  }
  .uploading-overlay .el-icon {
    font-size: 18px;
  }
  .user-name {
    font-size: 20px;
  }

  .user-email {
    font-size: 16px;
  }

  .edit-btn {
    font-size: 14px;
  }

  .el-input {
    font-size: 14px;
  }

  .el-select {
    font-size: 18px;
  }

  .el-button {
    font-size: 14px;
    padding: 8px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .user-card {
    right: 10px;
    top: 50px;
    width: 250px;
    padding: 15px;
    font-size: 14px;
  }

  .user-avatar {
    width: 35px;
    height: 35px;
  }

  .user-name {
    font-size: 18px;
  }

  .user-email {
    font-size: 14px;
  }

  .edit-btn {
    font-size: 12px;
  }

  .el-input {
    font-size: 12px;
  }

  .el-select {
    font-size: 16px;
  }

  .el-button {
    font-size: 12px;
    padding: 6px;
    margin-top: 8px;
  }

  .el-button + .el-button {
    margin-left: 8px;
  }
}
</style>

