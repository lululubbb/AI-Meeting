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
// 定义路由规则
const routes = [
  {
    path: '/',
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
    path: '/video-call',
    name: 'VideoCall',
    component: VideoCall,
    meta: { requiresAuth: true }
  },
  { path: '/meetings',
    name: 'Meetings', 
    component: Meetings,
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
