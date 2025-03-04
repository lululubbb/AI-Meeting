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
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }
  
  .icon-background {
    position: absolute;
    width: 90%;
    height: 90%;
    border-radius: 50%;
    bottom: 0;
    right: 0;
  }
  
  .icon-foreground {
    position: absolute;
    width:  90%;
    height:  90%x;
    bottom: 8px;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon {
    font-size: 16px; /* 根据需要调整 */
  }
  
  .text-container {
    margin-left: 14.22px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .description {
    font-size: 18px;
    color: var(--text-color);
    letter-spacing: 0.5px;
    margin: 0;
  }
  
  .date {
    font-size: 18px;
    color: rgba(65, 71, 94, 0.5);
    margin: 8.84px 0 0 0;
  }

  @media screen and (max-width: 768px) {
  .activity-item {
    margin-bottom: 20px;
  }

  .icon-container {
    width: 35px;
    height: 35px;
  }

  .icon {
    font-size: 14px;
  }

  .text-container {
    margin-left: 12px;
  }

  .description {
    font-size: 16px;
    line-height: 1.3;
    letter-spacing: 0.3px;
  }

  .date {
    font-size: 14px;
    margin-top: 6px;
  }

  /* 调整图标定位 */
  .icon-foreground {
    bottom: 6px;
    width: 85%;
    height: 85%;
  }
}

@media screen and (max-width: 480px) {
  .activity-item {
    margin-bottom: 15px;
  }

  .icon-container {
    width: 30px;
    height: 30px;
  }

  .icon {
    font-size: 12px;
  }

  .text-container {
    margin-left: 10px;
  }

  .description {
    font-size: 14px;
    letter-spacing: 0.2px;
    /* 允许文字换行 */
    white-space: normal;
    line-height: 1.2;
  }

  .date {
    font-size: 12px;
    margin-top: 4px;
  }

  /* 精细调整图标位置 */
  .icon-background {
    width: 85%;
    height: 85%;
  }

  .icon-foreground {
    bottom: 5px;
    width: 80%;
    height: 80%;
  }
}

/* 防止超长文本溢出 */
.description {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制两行 */
  -webkit-box-orient: vertical;
}

/* 增强触控体验 */
@media (pointer: coarse) {
  .activity-item {
    padding: 8px 0;
    min-height: 44px; /* 最小触控高度 */
  }
}
  </style>
  