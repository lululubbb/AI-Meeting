<template>
  <div class="tools-page">
    <el-row :gutter="16" justify="start">
      <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="tool in tools" :key="tool.name" class="tool-card-wrapper">
         <el-card shadow="hover" class="tool-card" @click="navigateTo(tool.route)">
          <div class="tool-icon-wrapper">
             <i :class="tool.icon" class="tool-icon" :style="{ color: tool.color }"></i>
           </div>
           <div class="tool-content">
             <h3 class="tool-title">{{ tool.title }}</h3>
            <p class="tool-description">{{ tool.description }}</p>
          </div>
       </el-card>
     </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ElRow, ElCol, ElCard } from 'element-plus';
import { ElMessage } from 'element-plus';
const router = useRouter();

const tools = [
  {
    name: 'AIBot',
    title: '会议AI',
    description: '咨询智能体西湖论剑会议相关事宜',
    icon: 'fa-solid fa-robot',
    color: '#409eff',
    route: 'AIBot',
  },
  {
    name: 'Map',
    title: '地图导航',
    description: '查看会议地点及周边信息',
    icon: 'fa-solid fa-map-location-dot',
    color: '#67c23a',
    route: 'Map',
  },
  {
    name: 'Forum',
    title: '会议论坛',
    description: '参与讨论，与其他参会者交流',
    icon: 'fa-solid fa-users',
    color: '#e6a23c',
    route: 'Forum',
  },
  {
    name: 'Materials',
    title: '会议资料',
    description: '下载会议资料',
    icon: 'fas fa-file-download',
    color: '#f56c6c',
    route: 'Materials',
  },
  {
    name: 'DataSummary', 
    title: '会议数据',
    description: '查看会议统计图表',
    icon: 'fa-solid fa-chart-pie', 
    color: '#17a2b8', 
    route: 'DataSummary', 
  },
  {
    name: 'CalendarToDoList',
    title: '日历助手',
    description: '帮助您管理日程',
    icon: 'fa-solid fa-calendar-days',
    color: '#b37feb', 
    route: 'CalendarToDoList',
  },
  {
    name: 'RecentActivityCard',
    title: '最近活动',
    description: '查看近期活动',
    icon: 'fa-solid fa-star',
    color: '#909399',
    route: 'RecentActivityCard',
  },
  {
    name: 'Help',
    title: '帮助页面',
    description: '查看与会议相关帮助信息',
    icon: 'fa-solid fa-circle-question', // 更新了图标
    color: '#5bc0de', 
    route: 'Help',
  },
  {
    name: 'ConferenceAgenda',
    title: '大会议程',
    description: '查看详细会议日程安排',
    icon: 'fa-solid fa-calendar-alt', // 日程图标
    color: '#5cb85c', 
    route: 'ConferenceAgenda',
  },
  {
    name: 'ParticipantGuide',
    title: '参会指南',
    description: '交通、住宿、签到等指引',
    icon: 'fa-solid fa-book-open', // 指南/书本图标
    color: '#f0ad4e', 
    route: 'ParticipantGuide',
  },
  {
    name: 'NewsCenter',
    title: '新闻中心',
    description: '查看会议最新动态与报道',
    icon: 'fa-solid fa-newspaper', // 新闻图标
    color: '#d9534f', 
    route: 'NewsCenter',
  },
  {
    name: 'FeaturedEvents',
    title: '特色活动',
    description: '了解会议期间的特别活动',
    icon: 'fa-solid fa-lightbulb', // 灯泡/创意图标
    color: '#337ab7', 
    route: 'FeaturedEvents',
  },
  {
    name: 'ExhibitorShowcase',
    title: '展商风采',
    description: '浏览参展商信息与展位',
    icon: 'fa-solid fa-store', // 商店/展位图标
    color: '#777777', 
    route: 'ExhibitorShowcase',
  },
  {
    name: 'Guests', 
    title: '参会嘉宾',
    description: '了解本次大会的重要嘉宾',
    icon: 'fa-solid fa-users-rectangle', // 备选: fa-solid fa-id-card, fa-solid fa-user-tie
    color: '#8a6d3b', 
    route: 'Guests', 
  },
];

const navigateTo = (routeName) => {
  // 检查路由名称是否存在，避免无效跳转
  if (router.hasRoute(routeName)) {
      router.push({ name: routeName });
  } else {
      ElMessage.warning(`功能 "${routeName}" 正在开发中...`);
  }
};
</script>

<style scoped>


.tools-page {
  padding: 16px; /* 减小整体 padding */
  background-color:var(--background-color);
  box-sizing: border-box;
  min-height: 100vh;
  position: relative;
  margin-bottom: 70px;
}

.tool-card-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 25px;
}

.tool-card {
  border-radius: 8px; /* 减小圆角 */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
 width: 100%; /* 添加 width: 100% */
  max-width: 250px; /* 设置最大宽度 */
  display: flex;
  margin-bottom: 20px;
  background-color:var(--background-color);
}

.tool-card:hover {
  transform: translateY(-4px); /* 减小上浮幅度 */
  box-shadow: var(--global-box-shadow);
}

.tool-icon-wrapper {
  padding: 12px; /* 减小图标区域 padding */
  text-align: center;
  border-radius: 8px 8px 0 0;
}

.tool-icon {
  font-size: 36px; /* 减小图标大小 */
}

.tool-content {
  padding: 10px 16px;
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tool-title {
  font-size: 16px; /* 减小标题字体大小 */
  font-weight: bold;
  margin-bottom: 4px; /* 减小标题下边距 */
  background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;
}

.tool-description {
  font-size: 14px; /* 减小描述字体大小 */
  color: #777;
  line-height: 1.3; /* 减小行高 */
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tool-title {
    font-size: 14px;
  }
  .tool-card{
     max-width: 300px; /* 设置最大宽度 */
     margin-bottom: 5px;
}
  .tool-description {
    font-size: 11px;
  }
}

@media (max-width: 576px) {
.tool-card-wrapper{
    justify-content: flex-start;
}
.tool-card{
     max-width: 250px; /* 设置最大宽度 */
     margin-bottom: 5px;
}
  .tool-icon-wrapper {
    padding: 8px; /* 进一步减小 padding */
  }

  .tool-icon {
    font-size: 30px; /* 进一步减小图标大小 */
  }

  .tool-content {
    padding: 8px 12px; /* 减小 padding */
  }
}
</style>
