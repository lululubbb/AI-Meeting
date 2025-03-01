<!-- src/components/UserProfileCard.vue -->
<template>
  <div class="user-card">
    <div class="card-header">
      <img :src="user.avatarUrl || 'https://randomuser.me/api/portraits/men/32.jpg'" alt="User Avatar" class="user-avatar" />
      <button v-if="!isEditing" @click="editProfile" class="edit-btn">编辑</button>
    </div>
    
    <div v-if="isEditing">
      <p class="user-name">
        <el-input v-model="editableUser.name" size="small" />
      </p>
      <p class="user-email">{{ user.email }}</p> <!-- Email is read-only -->
      
      <p>状态信息：
        <el-select v-model="editableUser.status" placeholder="选择状态">
          <el-option label="在线" value="在线"></el-option>
          <el-option label="离线" value="离线"></el-option>
          <el-option label="请勿打扰" value="请勿打扰"></el-option>
          <el-option label="离开" value="离开"></el-option>
        </el-select>
      </p>

      <p>工作位置：
        <el-input v-model="editableUser.workLocation" size="small" />
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
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import AuthService from '../services/AuthService'; // 导入 AuthService
import { defineEmits } from 'vue';
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
  name: user.value.name || '',
  status: user.value.status || '在线',
  workLocation: user.value.workLocation || '中国',
  mood: user.value.mood || '开心', 
});

// 编辑按钮点击事件
const editProfile = () => {
  isEditing.value = true;
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
      name: editableUser.value.name,
      status: editableUser.value.status,
      workLocation: editableUser.value.workLocation,
      mood: editableUser.value.mood,
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
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
  font-size: 16px;
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
</style>

