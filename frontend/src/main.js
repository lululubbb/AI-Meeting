// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ZoomVideoService from './services/ZoomVideoService.js'
import '@fortawesome/fontawesome-free/css/all.min.css'; // 引入 Font Awesome
import 'element-plus/dist/index.css'; // Import Element Plus CSS globally
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn'; 
// 设置中文语言包

const app = createApp(App)

app.use(router)
app.use(store)
// 使用 Element Plus 并设置中文语言
app.use(ElementPlus, { locale: zhCn });


// 将 ZoomVideoService 挂载到全局，以便在组件中访问（如果需要）
app.config.globalProperties.$zoomVideoService = ZoomVideoService

// 初始化认证监听
store.dispatch('initAuth')

// 挂载应用
app.mount('#app')
// ** 启用跨域隔离和 SharedArrayBuffer 检查 **
if (typeof SharedArrayBuffer !== 'undefined') {
    console.log('SharedArrayBuffer is supported!');
  } else {
    console.log('SharedArrayBuffer is NOT supported!');
  }if (typeof SharedArrayBuffer !== 'undefined' && document.originIsolation) {
  console.log('SharedArrayBuffer and Cross-Origin Isolation are enabled.');
} else {
  console.log('SharedArrayBuffer is not enabled or Cross-Origin Isolation is not applied.');
}
