<template>
  <div class="recent-activity-container">
    <div class="recent-activity-card">
      <h2 class="title">最近活动</h2>

      <!-- 使用 v-if 检查 activities 是否存在且有内容 -->
      <div v-if="activities && activities.length > 0" class="activities">
        <ActivityItem
          v-for="(activity, index) in activities"
          :key="activity.id"
          :iconColor="activity.iconColor"
          :icon="activity.icon"
          :description="activity.description"
          :date="activity.date"
          :activityId="activity.id"
          @edit-activity="editActivity"
          @delete-activity="deleteActivity"
        />
      </div>      
      <!-- 空状态提示（可选） -->
      <div v-else class="empty-state">
        <p>暂无活动记录，请添加！</p>
      </div>

      <!-- 添加活动按钮 -->
      <button class="add-activity-btn" @click="toggleAddActivityForm">
        {{ isAddingActivity ? '取消' : '➕ ' }}
      </button>

      <!-- 添加活动表单 -->
      <CreateActivity 
        v-if="isAddingActivity" 
        @add-activity="addActivity" 
        @cancel="toggleAddActivityForm"
      />
       <!-- 编辑对话框 -->
       <div v-if="isEditDialogVisible" class="todo-dialog">
        <div class="dialog-content">
          <h3>编辑最近活动</h3>
          <div class="form-fields"> <!-- 新增表单字段容器 -->
      <input v-model="editedActivity.description" placeholder="输入活动描述">
      <input v-model="editedActivity.date" type="date" id="date">
    </div>
    <div class="dialog-actions"> <!-- 新增操作按钮容器 -->
      <button @click="saveEditedActivity">保存</button>
      <button @click="closeEditDialog">取消</button>
    </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ActivityItem from './ActivityItem.vue';
import CreateActivity from './CreateActivity.vue';
import { ref, computed, onMounted, nextTick, onBeforeUnmount   } from 'vue'; // 导入 onMounted
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus'; // 导入 ElMessage

export default {
  name: 'RecentActivityCard',
  components: {
    CreateActivity,
    ActivityItem,
  },
  setup() {
    const store = useStore();
    const isAddingActivity = ref(false);
    const isEditDialogVisible = ref(false);
    const editedActivity = ref({ description: '', date: '' });
    // 从 Vuex store 获取 activities
    const activities = computed(() => store.getters.getActivities);
    let asyncOperation;
    // 在组件挂载时获取活动数据
    onMounted(() => {
      store.dispatch('fetchActivities');
    });

    const toggleAddActivityForm = () => {
      isAddingActivity.value = !isAddingActivity.value;
    };
    // 调用 Vuex 的 addActivity action
    const addActivity = async (newActivity) => {
      const isDuplicate = activities.value.some(activity => {
        return activity.date === newActivity.date && activity.description === newActivity.description;
      });

      if (isDuplicate) {
        ElMessage.warning('该活动（日期和名称）已经存在！');
        return;
      }

      await store.dispatch('addActivity', newActivity);
      await asyncOperation;
      await nextTick(); 
      toggleAddActivityForm(); 
    };

    const editActivity = (activityId) => {
      const activity = activities.value.find(a => a.id === activityId);
      if (activity) {
        console.log('Editing activity with ID:', activity.id);
        editedActivity.value = { ...activity };
        isEditDialogVisible.value = true;
      }
    };

    const saveEditedActivity = async () => {
      try {
        await store.dispatch('updateActivity', { id: editedActivity.value.id, ...editedActivity.value });
        await asyncOperation;
        await nextTick(); 
        closeEditDialog();
      } catch (error) {
        console.error('编辑活动失败:', error);
        ElMessage.error('编辑活动失败');
      }
    };

    const closeEditDialog = () => {
      isEditDialogVisible.value = false;
      editedActivity.value = { description: '', date: '' };
    };

    const deleteActivity = async (activityId) => {
      try {
        await store.dispatch('deleteActivity', activityId);
        await asyncOperation;
        await nextTick(); 
      } catch (error) {
        console.error('删除活动失败:', error);
        ElMessage.error('删除活动失败');
      }
    };
    onBeforeUnmount(() => {
  if (asyncOperation) {
    // 这里可以添加取消异步操作的逻辑，比如取消请求
    asyncOperation = null;
  }
});
    return {
      activities,
      isAddingActivity,
      toggleAddActivityForm,
      addActivity, // 现在 addActivity 调用 Vuex action
      isEditDialogVisible,
      editedActivity,
      editActivity,
      saveEditedActivity,
      closeEditDialog,
      deleteActivity
    };
  },
};
</script>

<style scoped>
/* 样式保持不变 */
.recent-activity-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px; 
  padding: 10px;
  margin:5px;
  margin-top: 10px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.recent-activity-card {
  width: 90%;
  height: auto;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  border-radius: 8px;
  /* box-shadow: rgba(20, 29, 43, 0.15) 0px 20px 40px; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  padding: 30px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.title {
  font-size: 20px;
  font-weight: bold;
  background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;  
  margin-bottom: 20px;
}

.activities {
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 350px;  /* 新增最大高度限制 */
  overflow-y: auto;   /* 新增垂直滚动条 */
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;  /* 现代浏览器滚动条优化 */
  scrollbar-color: #eeeeef rgba(242, 242, 242, 0.1); /* 滚动条颜色 */
}
/* 滚动条样式美化（兼容Webkit浏览器） */
.activities::-webkit-scrollbar {
  width: 8px;
}
.activities::-webkit-scrollbar-track {
  background: rgba(242, 242, 242, 0.1);
  border-radius: 4px;
}
.activities::-webkit-scrollbar-thumb {
  background:  rgba(242, 242, 242, 0.1);
  border-radius: 4px;
}
.activities::-webkit-scrollbar-thumb:hover {
  background:  rgba(242, 242, 242, 0.1);
}
/* 空状态样式（可选） */
.empty-state {
    text-align: center;
    color: #999;
    padding: 20px;
  }

.add-activity-btn {
padding: 10px 10px;
background-color: #b9ddfe;
color: #fff;
font-size: 16px;
font-weight: bold;
border: none;
border-radius: 5px;
cursor: pointer;
margin-bottom: 0px;
transition: background-color 0.3s, transform 0.2s;
}

.add-activity-btn:hover {
background-color: #84befd;
transform: translateY(-2px);
}

.todo-dialog {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.5);
display: flex;
justify-content: center;
align-items: center;
z-index: 9999; /* 设置一个高的 z-index 值，确保对话框位于最上层 */
}

.dialog-content {
background: white;
padding: 20px;
border-radius: 10px;
text-align: center;
width: 350px;
z-index: 9999; /* 保证内容区域也在顶层 */
}

.dialog-content h3 {
  margin-bottom: 10px;
  text-align: center;
  background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;  
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 15px; /* 字段间距 */
  margin: 20px 0;
}

.form-fields input {
  width: 95%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  gap: 50px; /* 按钮间距 */
  justify-content:center; /* 按钮右对齐 */
}

.dialog-actions button {
  padding: 10px 25px;
  border-radius: 6px;
  transition: all 0.3s;
  flex: 1; /* 等宽按钮 */
  max-width: 120px; /* 限制最大宽度 */
  background-color: #b9ddfe;
  border: solid 1px #95cbfe;
  color:#0B6BAB;
  cursor: pointer;
}

button:hover {
  background-color: #84befd;
  transform: translateY(-5px); 
}
/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .recent-activity-container {
    gap: 20px;
    padding: 15px;
    margin: 8px;
    margin-top: 10px;
  }

  .recent-activity-card {
    width: 95%;
    padding: 20px 20px;
  }

  .title {
    font-size: 18px;
    margin-bottom: 20px;
  }
  .activities {
    max-height: 200px;  /* 移动端更小高度 */
  }
  .add-activity-btn {
    padding: 8px 10px;
    font-size: 16px;
  }
  .form-fields {
    gap: 12px;
    margin: 15px 0;
  }

  .dialog-actions {
    gap: 15px;
    flex-direction: column; /* 移动端改为垂直排列 */
  }

  .dialog-actions button {
    max-width: 100%;
    width: 100%;
    padding: 12px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .recent-activity-container {
    gap: 10px;
    padding: 10px;
    margin: 5px;
    margin-top: 5px;
  }
  .activities {
    max-height: 150px;  /* 手机端优化高度 */
  }
  .recent-activity-card {
    width: 100%;
    padding: 15px 15px;
  }

  .title {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .add-activity-btn {
    padding: 6px 10px;
    font-size: 14px;
  }

  .empty-state {
    padding: 15px;
    font-size: 14px;
  }
  .form-fields input {
    font-size: 13px;
    padding: 8px;
  }
  
  .dialog-actions button {
    font-size: 14px;
  }
}
</style>
