<template>
  <div class="recent-activity-container">
    <div class="recent-activity-card">
      <h2 class="title">最近活动</h2>

      
      <!-- 最近活动列表 -->
      <div class="activities">
        <ActivityItem
          v-for="(activity, index) in activities"
          :key="index"
          :icon-color="activity.iconColor"
          :icon="activity.icon"
          :description="activity.description"
          :date="activity.date"
        />
      </div>
      <!-- 添加活动按钮 -->
      <button class="add-activity-btn" @click="toggleAddActivityForm">
        {{ isAddingActivity ? '取消' : '➕ ' }}
      </button>

      <!-- 添加活动表单 -->
      <CreateActivity 
        v-if="isAddingActivity" 
        @addActivity="addActivity" 
        @cancel="toggleAddActivityForm"
      />

    </div>
  </div>
</template>
  
  <script>
  import ActivityItem from './ActivityItem.vue';
  import CreateActivity from './CreateActivity.vue';
  import { ref } from 'vue';

  export default {
  name: 'RecentActivityCard',
  components: {
    CreateActivity,
    ActivityItem,
  },
  setup() {
    const activities = ref([
      {
        iconColor: '#5dc983', 
        icon: '📁', 
        description: '同学A已经确定了分工和DDL',
        date: '2024-12-18',
      },
      {
        iconColor: '#7784ee',
        icon: '✏️',
        description: '同学B提交了相关代码',
        date: '2024-12-19',
      },
      {
        iconColor: '#fba63c',
        icon: '➕',
        description: '同学C修改了项目主页的截止日期',
        date: '2024-12-28',
      },
    ]);
    
    const isAddingActivity = ref(false); // 控制添加活动表单的显示状态

    // 切换添加活动表单的显示状态
    const toggleAddActivityForm = () => {
      isAddingActivity.value = !isAddingActivity.value;
    };

    const addActivity = (newActivity) => {
      activities.value.push(newActivity);
      toggleAddActivityForm(); // 添加完成后自动隐藏表单
    };

    return {
      activities,
      isAddingActivity,
      toggleAddActivityForm,
      addActivity,
    };
  },
};
  </script>
  
  <style scoped>
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
  </style>
  