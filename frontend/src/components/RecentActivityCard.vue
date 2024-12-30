<template>
    <div class="recent-activity-card">
      <h2 class="title">Recent Activity</h2>
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
    </div>
  </template>
  
  <script>
  import ActivityItem from './ActivityItem.vue';
  
  export default {
    name: 'RecentActivityCard',
    components: {
      ActivityItem,
    },
    data() {
      return {
        activities: [
          {
            iconColor: '#5dc983', // 绿色
            icon: '💬', // 占位符图标（根据需要替换为实际图标）
            description: 'Karen 在 Konsep Ilustrasi 上留下了一些评论',
            date: '8月10日',
          },
          {
            iconColor: '#7784ee', // 蓝色
            icon: '✏️', // 占位符图标
            description: 'Karen 修改了项目主页的项目信息',
            date: '8月10日',
          },
          {
            iconColor: '#fba63c', // 橙色
            icon: '📅', // 占位符图标
            description: 'Andrea 修改了项目主页的截止日期',
            date: '8月10日',
          },
        ],
      };
    },
  };
  </script>
  
  <style scoped>
  .recent-activity-card {
    width: 378px;
    height: 368px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: rgba(35, 56, 85, 0.15) 0px 30px 60px;
    padding: 31px 33px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #121212;
    margin-bottom: 30.94px;
  }
  
  .activities {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  </style>
  