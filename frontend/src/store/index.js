// src/store/index.js

import { createStore } from 'vuex'
import { auth, onAuthStateChanged } from '../services/FirebaseService.js'
import FirestoreService from '../services/FirestoreService.js'

export default createStore({
  state: {
    user:{
      uid: null,
      email: null,
      name: null,
      status: '在线',  // 你的自定义字段
      workLocation: 'Unknown',  // 你的自定义字段
      avatarUrl:'https://randomuser.me/api/portraits/men/32.jpg',
      mood:'开心',
      todolist: []  
    },
    meetings: []
  },
  mutations: {
    SET_USER(state, user) {
      state.user = { ...state.user, ...user } 
    },
    SET_MEETINGS(state, meetings) {
      state.meetings = meetings
    }
  },
  actions: {
    // 初始化认证监听
    initAuth({ commit, dispatch }) {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // 获取并更新用户信息
          const userData = await FirestoreService.getUserInfo(user.uid)
          commit('SET_USER', { ...userData, uid: user.uid, email: user.email }) // 合并 Firestore 和 Firebase 用户信息
          await dispatch('listenToMeetings')
          // 监听会议历史记录
          await dispatch('listenToMeetings')
        } else {
          commit('SET_USER', null)
          commit('SET_MEETINGS', [])
        }
      })
    },
    // 监听会议历史记录
    listenToMeetings({ commit, state }) {
      if (state.user) {
        FirestoreService.listenToMeetings(state.user.uid, (meetings) => {
          commit('SET_MEETINGS', meetings)
        })
      }
    }, 
    // 更新用户状态
    updateUserStatus({ commit }, status) {
      commit('SET_USER_STATUS', status)
      // 更新 Firestore 中的状态
      FirestoreService.updateUserStatus(status)
    },

    // 更新用户工作位置
    updateUserWorkLocation({ commit }, workLocation) {
      commit('SET_USER_WORKLOCATION', workLocation)
      // 更新 Firestore 中的工作位置
      FirestoreService.updateUserWorkLocation(workLocation)
    },
    // 处理用户登出
    async signOutUser({ commit }) {
      const AuthService = await import('../services/AuthService.js')
      const res = await AuthService.default.signOutUser()
      if (res) {
        commit('SET_USER', null)
        commit('SET_MEETINGS', [])
      }
    },
    async updateTodoList({ commit, state }, todolist) {
      try {
        await FirestoreService.updateUserTodoList(state.user.uid, todolist);
        commit('SET_TODOLIST', todolist);  // Commit the updated to-do list to the store
      } catch (error) {
        console.error("Failed to update to-do list:", error);
        showSnackBar(error.message);
      }
    }
  },
  getters: {
    isLoggedIn: state => !!state.user,
    getUser: state => state.user,
    getMeetings: state => state.meetings,
    getTodoList: state => state.user.todolist
  },
  modules: {}
})
