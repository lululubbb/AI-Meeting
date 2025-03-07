<template>
  <div id="app">
    <AIFloatingChat v-if="!isLoginOrIntroductionPage" />
    <Header v-if="!isLoginOrIntroductionPage" />
    <div :class="['content', { 'no-header': isLoginOrIntroductionPage }]">
      <!-- 新增：用一个 div 包裹 -->
      <div style="position: relative;">
        <transition name="fade" mode="out-in">
          <router-view />
        </transition>
        <!-- 移动到这里，和 router-view 同级 -->
        <VideoCall v-if="isVideoCallActive" />
      </div>
    </div>
       <!--  "返回会议" 按钮 -->
        <div
          v-if="isVideoCallActive && route.name !== 'Home'"
          class="return-to-meeting"
           @click="returnToMeeting"
         >
       返回会议
      </div>
  </div>
</template>

<script>
import { computed, ref, provide, onMounted, watchEffect,watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AIFloatingChat from './components/AIFloatingChat.vue';
import Header from './components/Header.vue';
import IntroductionPage from '@/views/IntroductionPage.vue';
import { ElMessageBox } from 'element-plus';
import { showSnackBar } from './utils/utils';
import FirestoreService from './services/FirestoreService.js';
import { useStore } from 'vuex';
import axios from 'axios';
import VideoCall from './views/VideoCall.vue'; // 作为全局组件导入
export default {
  name: 'App',
  components: {
    AIFloatingChat,
    Header,
    IntroductionPage,
    VideoCall, 
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const aiFloatingChat = ref(null);
    const isLoginOrIntroductionPage = computed(() => route.name === 'Login' || route.name === 'Introduction');
    const store = useStore();
    const isVideoCallActive = computed(() => store.state.isVideoCallActive);
    const isMaximized = computed(() => store.state.isMaximized); //获取最大化状态
    // 全局的显示会议开始通知的方法
     const showMeetingStartNotification = (meetingData) => {

          if(!meetingData) return;

        ElMessageBox.confirm(
          `您预约的会议 "${meetingData.sessionName}" 时间已到，是否立即创建会议？`,
          '会议开始提醒',
          {
            confirmButtonText: '创建会议',
            cancelButtonText: '取消',
            type: 'info',
          }
        )
          .then(async () => {
            //  确认
             await createMeetingAutomatically(meetingData);  //  直接调用
          })
          .catch(() => {
            console.log("用户取消");
            showSnackBar("已取消");
            if (meetingData.meetingId && store.getters.getUser.uid) {
              FirestoreService.updateMeetingHistory(
                store.getters.getUser.uid,
                meetingData.meetingId,
                { status: 'cancelled' }
              ).catch(error => console.error("更新失败", error))
            }
             clearTimerAndMeeting(); //  取消也要清除
          })

      };

      // 自动创建会议
      const createMeetingAutomatically = async (meetingData) => { // 新增参数
          console.log('开始自动创建');
            try {
              const user = store.getters.getUser;
              if (!user) {
                showSnackBar('未登录');
                return;
              }
               if (!meetingData) {
                showSnackBar('没有要创建的会议');
                return;
              }

              // isJoining.value = true; //  这里不需要, 因为跳转到新页面, 会有加载动画
              const { meetingId, sessionName, sessionPasscode, hostName } = meetingData;

              const jwtResp = await axios.post('/api/zoom-jwt', {
                sessionName,
                role: 1,
                userIdentity: user.email,
                sessionPasscode,
              });
              const jwt = jwtResp.data.signature;
              if (!jwt) {
                showSnackBar('获取JWT失败');
                return;
              }

              await FirestoreService.updateMeetingHistory(user.uid, meetingId, {
                status: 'ongoing',
                startTime: new Date(),
                hostId: user.uid,
              });
    // 通过 Vuex 控制 VideoCall 组件的显示和最大化
    store.commit('SET_MEETING_CONFIG', {
      mode: 'create', // 确保是 create 模式
      sessionName,
      userName: hostName,
      sessionPasscode,
      videoSDKJWT: jwt,
      role: 1,
      meetingId,
      hostId: user.uid
    });
     store.commit('SET_VIDEOCALL_MAXIMIZED', true); // 设置为最大化
     store.commit('SET_VIDEOCALL_ACTIVE', true); // 显示 VideoCall 组件
                // router.push({
                //   name: 'VideoCall',
                //   query: {
                //     mode: 'create',
                //     sessionName,
                //     userName: hostName,
                //     sessionPasscode,
                //     videoSDKJWT: jwt,
                //     role: 1,
                //     meetingId,
                //     hostId: user.uid,
                //   },
                // });

            showSnackBar(`已创建会议"${sessionName}"`);
            clearTimerAndMeeting();

          } catch(error){
              console.error('自动创建失败', error);
              showSnackBar('自动创建失败:' + error.message);
            }
      };

        const clearTimerAndMeeting = () => {
            if (timer.value) {
              clearTimeout(timer.value);
               timer.value = null;
            }
           scheduledMeeting.value = null;
        };

    const scheduledMeeting = ref(null); //  直接在 App.vue 中管理
    const timer = ref(null);            //  直接在 App.vue 中管理


    //  提供 emitMeetingScheduled
     const emitMeetingScheduled = (meetingData) => {
         scheduledMeeting.value = meetingData;
      }
      provide('emitMeetingScheduled', emitMeetingScheduled);


    // 使用 watchEffect 监视 scheduledMeeting
    watchEffect(() => {
      if (timer.value) {
        clearTimeout(timer.value);
        timer.value = null;
      }

       if(scheduledMeeting.value){ //  设置
        const now = Date.now();
        const startTimeMs = new Date(scheduledMeeting.value.startTime).getTime();
        const delay = startTimeMs - now;
        if(delay> 0){
            console.log("设置定时器")
            timer.value = setTimeout(()=>{
                console.log("定时器触发")
                showMeetingStartNotification(scheduledMeeting.value);
            }, delay)
         }
         else{
             showMeetingStartNotification(scheduledMeeting.value); //  立即显示
         }
       }
    });

    const returnToMeeting = () => {
   store.commit('SET_VIDEOCALL_MAXIMIZED', true); // 设置为最大化
   store.commit('SET_VIDEOCALL_ACTIVE', true); // 显示
   router.push('/home')
};
  // 监听路由变化
  watch(() => route.name, (newRouteName) => {
    if (newRouteName !== 'Home' && newRouteName!=="VideoCall") {
        store.commit('SET_VIDEOCALL_MAXIMIZED', false); // 切换到其他页面, 设置为小窗
        }
  });
    onMounted(() => {
      const user = store.getters.getUser;
      if (user) {
        FirestoreService.getAllMeetingHistory(user.uid)
          .then(meetings => {
            const scheduled = meetings.find(m => m.status === 'scheduled' && new Date(m.startTime).getTime() > Date.now());
              if (scheduled) {
              //  直接设置 scheduledMeeting
                scheduledMeeting.value = scheduled;  //  触发 watchEffect
            }
          });
      }
    });

    return {
      isLoginOrIntroductionPage,
      aiFloatingChat,
      isVideoCallActive,
      route,         
      returnToMeeting, 

    };
  },
};
</script>

<style>
/* 样式保持不变 */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  display: flex;
  flex-direction: column;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  box-shadow: var(--global-box-shadow);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  scrollbar-width: thin;  /* 现代浏览器滚动条优化 */
  scrollbar-color: #eeeeef rgba(242, 242, 242, 0.1); /* 滚动条颜色 */
}



a {
  color: inherit;
  text-decoration: none;
}

.content {
  padding-top: 90px;
  min-height: calc(100vh - 90px);
  box-sizing: border-box;
}

.content.no-header {
  padding-top: 0;
  min-height: 100vh;
}

/* 过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.return-to-meeting {
    position: fixed;
    bottom: 20px;
    right: 20px;
  background-color: #007bff;
  color: white;
    padding: 10px 15px;
     border-radius: 5px;
    cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.return-to-meeting:hover {
  background-color: #0056b3; /* 悬停时颜色加深 */
}
</style>
