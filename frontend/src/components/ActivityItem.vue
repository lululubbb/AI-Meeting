<template>
    <div class="activity-item">
      <div class="icon-container">
        <div class="icon-background" :style="{ backgroundColor: iconColor }"></div>
        <div class="icon-foreground">
          <span class="icon">{{ icon }}</span>
        </div>
      </div>
      <div class="text-container">
        <p class="description">{{ description }}</p>
        <p class="date">{{ date }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ActivityItem',
    props: {
      iconColor: {
        type: String,
        required: true,
      },
      icon: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      date: {
        type: String,
        required: true,
      },
    },
  };
  </script>
  
  <style scoped>
  .activity-item {
    display: flex;
    align-items: center;
    margin-bottom: 30.94px;
  }
  
  .icon-container {
    position: relative;
    width: 33.18px;
    height: 30.94px;
    flex-shrink: 0;
  }
  
  .icon-background {
    position: absolute;
    width: 33.18px;
    height: 30.94px;
    border-radius: 50%;
    bottom: 0;
    right: 0;
  }
  
  .icon-foreground {
    position: absolute;
    width: 23.7px;
    height: 22.1px;
    bottom: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon {
    font-size: 14px; /* 根据需要调整 */
  }
  
  .text-container {
    margin-left: 14.22px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .description {
    font-size: 12px;
    color: #41475e;
    letter-spacing: 0.5px;
    margin: 0;
  }
  
  .date {
    font-size: 12px;
    color: rgba(65, 71, 94, 0.5);
    margin: 8.84px 0 0 0;
  }
  </style>
  