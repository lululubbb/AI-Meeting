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
        />
      </div>
       <!-- 空状态提示（可选） -->
      <div v-else class="empty-state">
        <p>暂无活动记录</p>
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

    </div>
  </div>
</template>

<script>
import ActivityItem from './ActivityItem.vue';
import CreateActivity from './CreateActivity.vue';
import { ref, computed, onMounted } from 'vue'; // 导入 onMounted
import { useStore } from 'vuex';

export default {
  name: 'RecentActivityCard',
  components: {
    CreateActivity,
    ActivityItem,
  },
  setup() {
    const store = useStore();
    const isAddingActivity = ref(false);

    // 从 Vuex store 获取 activities
    const activities = computed(() => store.getters.getActivities);

    // 在组件挂载时获取活动数据
    onMounted(() => {
      store.dispatch('fetchActivities');
    });

    const toggleAddActivityForm = () => {
      isAddingActivity.value = !isAddingActivity.value;
    };
    // 调用 Vuex 的 addActivity action
    const addActivity = (newActivity) => {
       store.dispatch('addActivity', newActivity);
       toggleAddActivityForm(); // 关闭表单
    };
    return {
      activities,
      isAddingActivity,
      toggleAddActivityForm,
      addActivity, // 现在 addActivity 调用 Vuex action
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
  padding: 20px;
  margin: 10px;
  margin-top: 20px;
}
.recent-activity-card {
  width: 90%;
  height: auto;
  background-color: var(--background-color); /* 使用全局背景颜色 */
  border-radius: 8px;
  /* box-shadow: rgba(20, 29, 43, 0.15) 0px 20px 40px; */
  box-shadow: var(--global-box-shadow); /* 应用全局边框阴影 */
  padding: 30px 33px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 30px;
}

.activities {
  width: 100%;
  display: flex;
  flex-direction: column;
}
/* 空状态样式（可选） */
.empty-state {
    text-align: center;
    color: #999;
    padding: 20px;
  }

.add-activity-btn {
padding: 10px 20px;
background-color: #b9ddfe;
color: #fff;
font-size: 18px;
font-weight: bold;
border: none;
border-radius: 5px;
cursor: pointer;
margin-bottom: 10px;
transition: background-color 0.3s, transform 0.2s;
}

.add-activity-btn:hover {
background-color: #84befd;
transform: translateY(-2px);
}

/* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .recent-activity-container {
    gap: 20px;
    padding: 15px;
    margin: 8px;
    margin-top: 15px;
  }

  .recent-activity-card {
    width: 95%;
    padding: 20px 23px;
  }

  .title {
    font-size: 18px;
    margin-bottom: 20px;
  }

  .add-activity-btn {
    padding: 8px 16px;
    font-size: 16px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .recent-activity-container {
    gap: 15px;
    padding: 10px;
    margin: 5px;
    margin-top: 10px;
  }

  .recent-activity-card {
    width: 100%;
    padding: 15px 18px;
  }

  .title {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .add-activity-btn {
    padding: 6px 12px;
    font-size: 14px;
  }

  .empty-state {
    padding: 15px;
    font-size: 14px;
  }
}
</style>
