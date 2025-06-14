// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import HistoryMeeting from '../views/HistoryMeeting.vue'
import ReserveMeeting from '../components/ReserveMeeting.vue'
import VideoCall from '../views/VideoCall.vue'
import Meetings from '../views/Meetings.vue';
import store from '../store'
import Reservations from '../views/Reservations.vue';
import Files from '../views/Files.vue';
import More from '../views/More.vue';
import Chat from '../views/Chat.vue';
import Helpview from '../views/Helpview.vue';
import Settingview from '../views/Settingview.vue';
import IntroductionPage from '../views/IntroductionPage.vue'
import MeetingShow from '../components/MeetingShow.vue'; // 1. 导入 MeetingShow 组件
import Tools from '../components/Tools.vue';
import AIFloatingChat from '../components/AIFloatingChat.vue'
import DataSummary from '../components/DataSummary.vue'
import Footer from '../components/Footer.vue'
import Map from '../components/Map.vue'
import Forum from '../components/Forum.vue'
import CalendarToDoList from '../components/CalendarToDoList.vue'
import RecentActivityCard from '../components/RecentActivityCard.vue'
import Materials from '../components/Materials.vue'
import ConferenceAgenda from '../components/ConferenceAgenda.vue'; 
import ParticipantGuide from '../components/ParticipantGuide.vue'; 
import NewsCenter from '../components/NewsCenter.vue';       
import FeaturedEvents from '../components/FeaturedEvents.vue';     
import Guests from '../components/Guests.vue';  
import ExhibitorShowcase from '../components/ExhibitorShowcase.vue';  
import AIBot from '../components/AIBot.vue'  // 确保路径正确
import crypto from 'crypto';
// 定义路由规则
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendarToDoList',
    name: 'CalendarToDoList',
    component: CalendarToDoList,
    meta: { requiresAuth: true }
  },
  {
    path: '/recentActivityCard',
    name: 'RecentActivityCard',
    component: RecentActivityCard,
    meta: { requiresAuth: true }
  },
  {
    path: '/forum',
    name: 'Forum',
    component: Forum,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'HistoryMeeting',
    component: HistoryMeeting,
    meta: { requiresAuth: true }
  },
  {
    path: '/reserveMeeting',
    name: 'ReserveMeeting',
    component: ReserveMeeting,
    meta: { requiresAuth: true }
  },
  {
    path: '/footer',
    name: 'Footer',
    component: Footer,
    meta: { requiresAuth: true }
  },
  {
    path: '/map',
    name: 'Map',
    component: Map,
    meta: { requiresAuth: true }
  },
  {
    path: '/materials',
    name: 'Materials',
    component: Materials,
    meta: { requiresAuth: true } 
  },
  { path: '/meetings',
    name: 'Meetings', 
    component: Meetings,
    meta: { requiresAuth: true }
  },
  { path: '/tools',
    name: 'Tools', 
    component: Tools,
    meta: { requiresAuth: true }
  },
  { path: '/dataSummary', 
    name: 'DataSummary', 
    component: DataSummary,
    meta: { requiresAuth: true }
   },
  { path: '/reservations',
    name: 'Reservations', 
    component: Reservations,
    meta: { requiresAuth: true }
  },
  { path: '/files',
    name: 'Files',
    component: Files,
    meta: { requiresAuth: true }
  },
  { path: '/more',
    name: 'More', 
    component: More,
    meta: { requiresAuth: true }
  },
  { path: '/chat',
    name: 'Chat', 
    component: Chat,
    meta: { requiresAuth: true }
  },
  { path: '/aiFloatingChat',
    name: 'AIFloatingChat', 
    component: AIFloatingChat,
    meta: { requiresAuth: true }
  },
  { path: '/help',
    name: 'Help', 
    component: Helpview,
    meta: { requiresAuth: true }
  },
  { path: '/settings',
    name: 'Settings', 
    component: Settingview,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'Introduction',
    component: IntroductionPage
  },
    // 新增 MeetingShow 路由
  {
    path: '/MeetingReview/:meetingId',  // 动态路由参数
    name: 'Transcription',             // 路由名称
    component: MeetingShow,              // 对应的组件
    meta: { requiresAuth: true }      // 添加路由元信息，表示需要身份验证

  },
  { path: '/agenda',name: 'ConferenceAgenda',component: ConferenceAgenda, 
      meta: { requiresAuth: true } },
  { path: '/guide', name: 'ParticipantGuide', component: ParticipantGuide, meta: { requiresAuth: true } },
  { path: '/news', name: 'NewsCenter', component: NewsCenter, meta: { requiresAuth: true } },
  { path: '/events', name: 'FeaturedEvents', component: FeaturedEvents, meta: { requiresAuth: true } },
  { path: '/exhibitors', name: 'ExhibitorShowcase', component: ExhibitorShowcase, meta: { requiresAuth: true } },
  { path: '/guests', name: 'Guests', component: Guests, meta: { requiresAuth: true } }, 
  { 
    path: '/aibot',
    name: 'AIBot', 
    component: AIBot,
    meta: { requiresAuth: true }  // 最新手机版 AIBOT的路由
  },
  // 处理未定义的路径
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫，检查是否需要认证
router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters.isLoggedIn
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
