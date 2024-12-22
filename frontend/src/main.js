// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ZoomVideoService from './services/ZoomVideoService.js'

const app = createApp(App)

app.use(router)
app.use(store)

// 将 ZoomVideoService 挂载到全局，以便在组件中访问（如果需要）
app.config.globalProperties.$zoomVideoService = ZoomVideoService

// 初始化认证监听
store.dispatch('initAuth')

// 挂载应用
app.mount('#app')
