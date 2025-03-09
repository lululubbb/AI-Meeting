import { createStore } from 'vuex';
import { auth, onAuthStateChanged } from '../services/FirebaseService.js';
import FirestoreService from '../services/FirestoreService.js';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/FirebaseService.js';
import { ElMessage } from 'element-plus'; // 导入 ElMessage
import defaultAvatar from '../assets/柴犬.png';

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
  },
  mutations: {
    SET_USER(state, user) {
      state.user = { ...state.user, ...user };
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
  },
  actions: {
     // 修改initAuth action
  async initAuth({ commit, dispatch }) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await FirestoreService.getUserInfo(user.uid);
        const userActivities = await FirestoreService.getUserActivities(user.uid);
        commit('SET_USER', { ...userData, uid: user.uid, email: user.email });
        await dispatch('listenToMeetings');
        await dispatch('listenToTodos'); // 新增监听
        commit('SET_ACTIVITIES', userActivities);
      } else {
        commit('SET_USER', null);
        commit('SET_MEETINGS', []);
        commit('SET_ACTIVITIES', []); 
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
});
