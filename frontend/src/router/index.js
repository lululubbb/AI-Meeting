// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import HistoryMeeting from '../views/HistoryMeeting.vue'
import VideoCall from '../views/VideoCall.vue'
import store from '../store'

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
    path: '/video-call',
    name: 'VideoCall',
    component: VideoCall,
    meta: { requiresAuth: true }
  },
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
