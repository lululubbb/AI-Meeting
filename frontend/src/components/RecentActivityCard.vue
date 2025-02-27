<template>
  <div class="recent-activity-container">
    <div class="recent-activity-card">
      <h2 class="title">最近活动</h2>

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

      <!-- 添加新活动组件 -->
    </div>
    <CreateActivity @addActivity="addActivity" />
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
        description: 'Karen 在 Konsep Ilustrasi 上留下了一些评论',
        date: '2024-12-18',
      },
      {
        iconColor: '#7784ee',
        icon: '✏️',
        description: 'Karen 修改了项目主页的项目信息',
        date: '2024-12-19',
      },
      {
        iconColor: '#fba63c',
        icon: '➕',
        description: 'Andrea 修改了项目主页的截止日期',
        date: '2024-12-28',
      },
    ]);

    const addActivity = (newActivity) => {
      activities.value.push(newActivity);
    };

    return {
      activities,
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
  </style>
  