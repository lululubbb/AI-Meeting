// index.js
import { createStore } from 'vuex';
import { auth, onAuthStateChanged } from '../services/FirebaseService.js';
import FirestoreService from '../services/FirestoreService.js';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/FirebaseService.js';
import { ElMessage } from 'element-plus'; // 导入 ElMessage
import defaultAvatar from '../assets/柴犬.png';

// --- 地图相关的辅助函数 (针对 JS API 调整) ---
function formatDuration(seconds) {
  // (保持不变)
  if (!seconds && seconds !== 0) return '未知';
  if (seconds < 60) return '小于1分钟';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  let durationStr = '';
  if (hours > 0) durationStr += `${hours}小时`;
  if (minutes > 0 && (hours === 0 || (seconds % 3600) / 60 >= 1)) {
      durationStr += `${minutes}分钟`;
  }
  if (!durationStr && hours > 0) durationStr = `${hours}小时`;
  return durationStr || '小于1分钟';
}

function formatDistance(meters) {
  // (保持不变)
  if (!meters && meters !== 0) return '未知';
  if (meters < 1000) return `${Math.round(meters)}米`;
  return `${(meters / 1000).toFixed(1)}公里`;
}

// JS API 不直接返回费用，这里提供一个非常粗略的估算函数（可选）
// 或者直接移除费用显示
function estimateRouteCost(route, transportMode) {
    if (!route?.distance) return null; // 没有距离无法估算

    const distanceInKm = route.distance / 1000;
    let costEstimate = null;

    if (transportMode === 'driving') {
        // 极简油费估算 (非常不准，未考虑路况、车型、过路费)
        const fuelConsumptionPer100Km = 8; // L/100km
        const fuelPricePerLiter = 7.8; // 元/L
        const fuelCost = (distanceInKm / 100) * fuelConsumptionPer100Km * fuelPricePerLiter;
        // 简单估算过路费 (例如：每公里0.5元，仅在超过一定距离时考虑)
        const tollCost = distanceInKm > 30 ? distanceInKm * 0.3 : 0;
        costEstimate = `约 ${(fuelCost + tollCost).toFixed(0)} 元 (估算)`;
    } else if (transportMode === 'transit') {
        // 公交费用极难估算，取决于城市、线路、换乘次数
        // 可以根据路线中有多少公交/地铁段估算一个大概范围
        const transitSegments = route.steps?.filter(step => step.type === 1 || step.type === 2).length || 0;
        if (transitSegments > 0) {
            const minCost = transitSegments * 2; // 假设最低2元/次
            const maxCost = transitSegments * 6; // 假设最高6元/次
             costEstimate = `约 ${minCost}-${maxCost} 元 (估算)`;
        } else {
             costEstimate = "费用按实际计算";
        }
    }
    // 步行和骑行通常免费
    else if (transportMode === 'walking' || transportMode === 'riding') {
       costEstimate = "免费";
    }

    return costEstimate;
}


// --- 地图模块定义 ---
const mapModule = {
  namespaced: true,
  state: () => ({
      mapInstance: null,
      isMapSdkLoaded: false,
      ak: 'oC1YoeWw5KHGtsZpj2QEA4kcgjLGPluD', // 你的 AK
      userLocation: null,
      isLocating: false,
      locationError: null,
      startAddress: '',
      endAddress: '',
      transportMode: 'driving', // 默认驾车
      // JS API 路线规划策略常量需要在 BMapGL 加载后使用，这里用数值
      // Driving Policy (JS API)
      // BMAP_DRIVING_POLICY_LEAST_TIME = 0, // 最少时间
      // BMAP_DRIVING_POLICY_AVOID_HIGHWAYS = 2, // 避开高速
      // BMAP_DRIVING_POLICY_LEAST_DISTANCE = 1, // 最短距离（注意：JS API文档中此常量可能不准确或与LEAST_TIME效果相同，需测试）
      // BMAP_DRIVING_POLICY_AVOID_CONGESTION // 避开拥堵（JS API 文档未明确列出此常量，但可尝试）
      drivingPolicy: 0, // 默认时间最短
      // Transit Policy (JS API)
      // BMAP_TRANSIT_POLICY_RECOMMEND = 0, // 推荐
      // BMAP_TRANSIT_POLICY_LEAST_TIME = 2, // 最少时间
      // BMAP_TRANSIT_POLICY_LEAST_TRANSFER = 1, // 最少换乘
      // BMAP_TRANSIT_POLICY_LEAST_WALKING = 3, // 最少步行
      // BMAP_TRANSIT_POLICY_AVOID_SUBWAYS = 4, // 不乘地铁
      // BMAP_TRANSIT_POLICY_FIRST_SUBWAYS = 5, // 优先地铁
      transitPolicy: 1, // 默认少换乘
      // ridingPolicy: N/A (JS API 无策略选项)
      routeResults: [], // 路线规划结果数组 (存储从 JS API 提取的数据)
      selectedPlanIndex: 0,
      isLoadingRoute: false,
      routeError: null,
      isTrafficLayerOn: false, // 路况图层状态
      // currentMapType: 'BMAP_NORMAL_MAP', // 地图类型 (如果需要切换)
      highlightedStep: null, // 当前高亮的路线步骤对象 (JS API Step)
  }),
  mutations: {
      SET_MAP_INSTANCE(state, map) { state.mapInstance = map; },
      SET_SDK_LOADED(state, loaded) { state.isMapSdkLoaded = loaded; },
      SET_USER_LOCATION(state, location) { state.userLocation = location; },
      SET_IS_LOCATING(state, loading) { state.isLocating = loading; },
      SET_LOCATION_ERROR(state, error) { state.locationError = error; },
      SET_START_ADDRESS(state, address) { state.startAddress = address; },
      SET_END_ADDRESS(state, address) { state.endAddress = address; },
      // SWAP_ADDRESSES mutation (可以保留，虽然组件内已实现)
      SWAP_ADDRESSES(state) {
          const temp = state.startAddress;
          state.startAddress = state.endAddress;
          state.endAddress = temp;
      },
      SET_TRANSPORT_MODE(state, mode) { state.transportMode = mode; },
      SET_DRIVING_POLICY(state, policy) { state.drivingPolicy = policy; },
      SET_TRANSIT_POLICY(state, policy) { state.transitPolicy = policy; },
      SET_ROUTE_RESULTS(state, results) {
          state.routeResults = results || [];
          state.selectedPlanIndex = 0;
          state.routeError = null;
          state.highlightedStep = null;
      },
      SET_IS_LOADING_ROUTE(state, loading) { state.isLoadingRoute = loading; },
      SET_ROUTE_ERROR(state, error) {
          state.routeError = error;
          state.routeResults = [];
          state.isLoadingRoute = false;
      },
      SET_SELECTED_PLAN_INDEX(state, index) {
          if (state.routeResults && index >= 0 && index < state.routeResults.length) {
              state.selectedPlanIndex = index;
              state.highlightedStep = null;
          }
      },
      SET_TRAFFIC_LAYER_STATUS(state, isOn) { state.isTrafficLayerOn = isOn; },
      // SET_MAP_TYPE(state, mapTypeId) { state.currentMapType = mapTypeId; },
      SET_HIGHLIGHTED_STEP(state, step) { state.highlightedStep = step; }
  },
  actions: {
      // 可以添加选择不同驾车/公交策略的 action
      updateDrivingPolicy({ commit, dispatch, state }, policy) {
         commit('SET_DRIVING_POLICY', policy);
         // 如果当前是驾车模式且已有结果，重新规划
         if (state.transportMode === 'driving' && state.routeResults.length > 0) {
             dispatch('planCurrentRoute'); // 需要一个辅助 action
         }
      },
      updateTransitPolicy({ commit, dispatch, state }, policy) {
          commit('SET_TRANSIT_POLICY', policy);
          if (state.transportMode === 'transit' && state.routeResults.length > 0) {
             dispatch('planCurrentRoute');
         }
      },
      // 辅助 action：使用当前起点终点和模式重新规划路线
      planCurrentRoute({ state, rootState }) { // 假设 mapUtils.planRoute 可全局访问
          if (state.startAddress && state.endAddress && state.mapInstance && typeof mapUtils?.planRoute === 'function') {
              let start = state.startAddress;
              if (!start && state.userLocation?.point) start = state.userLocation.point;

              if(start && state.endAddress) {
                    // 注意: planRoute 现在需要 mapInstance 作为参数
                    mapUtils.planRoute(start, state.endAddress, state.transportMode, rootState, state.mapInstance, { // 传递 store 的 rootState
                        policy: state.transportMode === 'driving' ? state.drivingPolicy : (state.transportMode === 'transit' ? state.transitPolicy : undefined)
                    }).catch(err => console.error("重新规划路线失败:", err));
              }
          }
      }
  },
  getters: {
      // 当前选中的路线方案 (从提取的数据中获取)
      selectedRoute: (state) => state.routeResults?.[state.selectedPlanIndex] || null,

      // 当前选中路线的概要信息 (基于提取的数据)
      selectedRouteSummary: (state, getters) => {
          const route = getters.selectedRoute;
          if (!route) return null;

          // 使用估算函数
          const costEstimate = estimateRouteCost(route, state.transportMode);

          return {
              distance: formatDistance(route.distance),
              duration: formatDuration(route.duration),
              // JS API driving route 不包含 traffic_condition
              // 费用为估算值
              costEstimate: costEstimate,
          };
      },

      // 当前选中路线的详细步骤 (已格式化)
      routeSteps: (state, getters) => {
        const rawSteps = getters.selectedRoute?.steps || [];
        // 在 getter 中进行格式化
        return rawSteps.map(step => ({
            ...step, // 保留原始 step 数据 (包含 originalStep, instruction, rawInstruction, distance, duration 等)
            formattedDistance: formatDistance(step.distance), // 在这里格式化距离
            formattedDuration: formatDuration(step.duration), // 在这里格式化时间
        }));
    },

      // 获取地图实例 (保持不变)
      getMapInstance: (state) => state.mapInstance,

      // 地图是否准备就绪 (保持不变)
      isMapReady: (state) => state.isMapSdkLoaded && !!state.mapInstance,

      // 驾车策略选项 (使用 JS API 的值)
       drivingPolicyOptions: () => [
          { label: '最少时间', value: 0 }, // BMAP_DRIVING_POLICY_LEAST_TIME
          { label: '最短距离', value: 1 }, // BMAP_DRIVING_POLICY_LEAST_DISTANCE (需测试效果)
          { label: '避开高速', value: 2 }, // BMAP_DRIVING_POLICY_AVOID_HIGHWAYS
          // { label: '避开拥堵', value: ??? }, // JS API 常量不确定
      ],
      // 公交策略选项 (使用 JS API 的值)
      transitPolicyOptions: () => [
          { label: '推荐', value: 0 },   // BMAP_TRANSIT_POLICY_RECOMMEND
          { label: '少换乘', value: 1 }, // BMAP_TRANSIT_POLICY_LEAST_TRANSFER (移动端常用)
          { label: '少步行', value: 3 }, // BMAP_TRANSIT_POLICY_LEAST_WALKING (移动端常用)
          { label: '不乘地铁', value: 4 }, // BMAP_TRANSIT_POLICY_AVOID_SUBWAYS
          { label: '时间短', value: 2 }, // BMAP_TRANSIT_POLICY_LEAST_TIME
          { label: '优先地铁', value: 5 }, // BMAP_TRANSIT_POLICY_FIRST_SUBWAYS
      ],

  }
};

export default createStore({
  state: {
    user: {
      uid: null,
      email: null,
      name: null,
      status: '在线',
      workLocation: '未知',
      avatarUrl: defaultAvatar,
      mood: '开心',
      todolist: [],
    },
    meetings: [],
    activities: [], // 新增：活动列表
    theme: 'light',
    language: 'zh-CN',
    isVideoCallActive: false, // 新增的状态
    meetingConfig: { //新增
    },
    isMaximized: true,
    usersInMeeting: [], // 新增：存储会议中的用户
  },
  mutations: {
    SET_USER(state, user) {
      state.user = { ...state.user, ...user};
    },
    SET_MEETINGS(state, meetings) {
      state.meetings = meetings;
    },
    SET_THEME(state, theme) {
      state.theme = theme;
      document.body.className = theme;
      document.documentElement.setAttribute('data-theme', theme);
    },
    SET_LANGUAGE(state, language) {
      state.language = language;
    },
    SET_TODOLIST(state, todolist) {
      state.user.todolist = todolist;
    },
    // UPDATE_USER_AVATAR(state, { userId, avatar }) {
    //   const user = state.users.find(u => u.userId === userId);
    //   if (user) {
    //     user.avatarUrl = avatar;
    //   }
    // },
    SET_ACTIVITIES(state, activities) { // 新增：设置活动列表
      state.activities = activities;
    },
    SET_VIDEOCALL_ACTIVE(state, isActive) {
      state.isVideoCallActive = isActive;
    },
     //存储会议信息
    SET_MEETING_CONFIG(state, config){
      state.meetingConfig = config;
    },
    SET_VIDEOCALL_MAXIMIZED(state, isMaximized) { // 新增
      state.isMaximized = isMaximized;
  },
    SET_MEETINGS(state, meetings) {
      state.meetings = meetings;
    },
    SET_USERS_IN_MEETING(state, users) {
      state.usersInMeeting = users;
   },
   UPDATE_USER_AVATAR_IN_MEETING(state, { userId, avatarUrl }) {
    const userIndex = state.usersInMeeting.findIndex(u => u.userId === userId);
    if (userIndex > -1) {
        // 使用 splice 来确保 Vue 能够检测到数组变化, 并触发响应式更新
        state.usersInMeeting.splice(userIndex, 1, {
            ...state.usersInMeeting[userIndex],
            avatarUrl
        });
    }
},
},
  actions: {

  initAuth({ commit, dispatch }) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await FirestoreService.getUserInfo(user.uid);
          // 获取用户活动
        const userActivities = await FirestoreService.getUserActivities(user.uid);
        commit('SET_USER', { ...userData, uid: user.uid, email: user.email });
        await dispatch('listenToMeetings');
        await dispatch('listenToTodos'); 
          // 设置活动到 Vuex
        commit('SET_ACTIVITIES', userActivities);
      } else {
        commit('SET_USER', null);
        commit('SET_MEETINGS', []);
        commit('SET_ACTIVITIES', []); // 未登录时清空活动
      }
    });
  },
    listenToMeetings({ commit, state }) {
      if (state.user) {
        FirestoreService.listenToMeetings(state.user.uid, (meetings) => {
          commit('SET_MEETINGS', meetings);
        });
      }
    },
    // 新增监听待办事项的action
  listenToTodos({ commit, state }) {
    if (state.user) {
      return FirestoreService.listenToTodos(state.user.uid, (todolist) => {
        commit('SET_TODOLIST', todolist);
      });
    }
  },

    updateUserStatus({ commit }, status) {
      commit('SET_USER_STATUS', status);
      FirestoreService.updateUserStatus(status);
    },
    updateUserWorkLocation({ commit }, workLocation) {
      commit('SET_USER_WORKLOCATION', workLocation);
      FirestoreService.updateUserWorkLocation(workLocation);
    },
    async addMeeting({ commit, dispatch, state }, meetingData) {
      if (!state.user || !state.user.uid) {
        console.warning('用户未登录，无法添加会议。');
        return;
      }
  
      try {
        const newMeeting = {
          ...meetingData,
          id: Date.now().toString(),
          userId: state.user.uid,
        };
  
        await FirestoreService.addMeeting(state.user.uid, newMeeting);
        dispatch('listenToMeetings'); // 重新获取会议列表
        console.log('会议已添加');
      } catch (error) {
        console.error('添加会议失败:', error);
        console.error('添加会议失败');
      }
    },
    async signOutUser({ commit }) {
      const AuthService = await import('../services/AuthService.js');
      const res = await AuthService.default.signOutUser();
      if (res) {
        commit('SET_USER', null);
        commit('SET_MEETINGS', []);
      }
    },
    async addTodo({ commit, state }, newTodo) {
      if (!state.user || !state.user.uid) {
        console.warning('用户未登录，无法添加待办事项。');
        return;
      }
      try {
        const updatedTodoList = [...(state.user.todolist || []), newTodo];
        await FirestoreService.addTodoItem(state.user.uid, newTodo);
        commit('SET_USER', { ...state.user, todolist: updatedTodoList });
        console.log('待办事项已添加')
      } catch (error) {
        console.error('添加待办事项失败:', error);
        console.error('添加待办事项失败');

      }
    },
   async updateTodoItem({ commit, state }, updatedTodo) {
      if (!state.user || !state.user.uid) {
        console.warning('用户未登录，无法更新待办事项。');
        return;
      }
      try {
        const updatedTodoList = state.user.todolist.map(todo =>
          todo.id === updatedTodo.id ? updatedTodo : todo
        );
        await FirestoreService.updateTodoItem(state.user.uid, updatedTodo);
        commit('SET_USER', { ...state.user, todolist: updatedTodoList });
        console.log('待办事项已更新');
      } catch (error) {
        console.error('更新待办事项失败:', error);
        console.error('更新待办事项失败');
      }
    },
    async deleteTodoItem({ commit, state }, todoId) {
      if (!state.user || !state.user.uid) {
        console.warning('用户未登录，无法删除待办事项');
        return;
      }
      try {
        const updatedTodoList = state.user.todolist.filter(todo => todo.id !== todoId);
        await FirestoreService.deleteTodoItem(state.user.uid, todoId);
        commit('SET_USER', { ...state.user, todolist: updatedTodoList });
        console.log('待办事项已删除');

      } catch (error) {
        console.error('删除待办事项失败:', error);
        console.error('删除待办事项失败');

      }
    },
    changeTheme({ commit }, theme) {
      commit('SET_THEME', theme);
      localStorage.setItem('theme', theme)
      document.body.className = theme
    },
    changeLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language);
    },

    // 新增：从 Firestore 获取用户活动
    async fetchActivities({ commit, state }) {
      if (state.user && state.user.uid) {
        try {
          const activities = await FirestoreService.getUserActivities(state.user.uid);
          commit('SET_ACTIVITIES', activities);
        } catch (error) {
          console.error('获取活动失败:', error);
          ElMessage.error('获取活动失败');
        }
      }
    },

    // 新增：将活动添加到 Firestore
    async addActivity({ commit, state, dispatch }, newActivity) {
      if (!state.user || !state.user.uid) {
        ElMessage.warning('用户未登录，无法添加活动。');
        return;
      }
      try {
        // 确保 newActivity 包含所有必要字段, 且有一个唯一的 ID
        const activityToAdd = {
          ...newActivity,
          // id: Date.now().toString(), // 使用时间戳作为 ID
          userId: state.user.uid,  // 添加 userId 字段
        };
         // 调用 FirestoreService 的 addActivity 方法
         const result = await FirestoreService.addActivity(state.user.uid, activityToAdd);

         // 获取 Firestore 自动生成的文档 ID
         const activityId = result.id;

         // 将文档 ID 作为 id 字段更新到文档中
         const activityRef = doc(db, 'users', state.user.uid, 'activities', activityId);
         await updateDoc(activityRef, { id: activityId });
      // await FirestoreService.addActivity(state.user.uid, activityToAdd);
 
      //  更新 Vuex store (可选，如果使用实时监听则不需要)
       dispatch('fetchActivities'); // 重新获取活动列表

        ElMessage.success('活动已添加');
      } catch (error) {
        console.error('添加活动失败:', error);
        ElMessage.error('添加活动失败');
      }
    },
    async deleteActivity({ commit, state, dispatch }, activityId) {
      if (!state.user ||!state.user.uid) {
          ElMessage.warning('用户未登录，无法删除活动。');
          return;
      }
      try {
          const success = await FirestoreService.deleteActivity(state.user.uid, activityId);
          if (success) {
              await dispatch('fetchActivities'); // 刷新活动列表
          }
      } catch (error) {
          console.error('删除活动失败:', error);
          ElMessage.error('删除活动失败');
      }
  },

  async updateActivity({ commit, state, dispatch }, activity) {
      if (!state.user ||!state.user.uid) {
          ElMessage.warning('用户未登录，无法更新活动。');
          return;
      }
      try {
          const success = await FirestoreService.updateActivity(state.user.uid, activity);
          if (success) {
              await dispatch('fetchActivities'); // 刷新活动列表
          }
      } catch (error) {
          console.error('更新活动失败:', error);
          ElMessage.error('更新活动失败');
      }
  },
  initializeUsersInMeeting({ commit }, users) {
    commit('SET_USERS_IN_MEETING', users);
    },
      updateUserAvatarInMeeting({ commit }, { userId, avatarUrl }) {
          commit('UPDATE_USER_AVATAR_IN_MEETING', { userId, avatarUrl });
    }
  },
    getters: {
    isLoggedIn: (state) => !!state.user,
    getUser: (state) => state.user,
    getMeetings: (state) => state.meetings,
    getTodoList: (state) => state.user.todolist,
    theme: (state) => state.theme,
    language: (state) => state.language,
    getActivities: (state) => state.activities, // 新增：获取活动列表
    getMeetingsForDate: (state) => (date) => {
      return state.meetings.filter(meeting => 
        new Date(meeting.startTime).toDateString() === new Date(date).toDateString()
      );
    },
    getMeetingConfig: (state) => state.meetingConfig,
  },
  modules: {
    // --- 注册地图模块 ---
    map: mapModule, // 使用 'map' 作为模块名
  }
});
