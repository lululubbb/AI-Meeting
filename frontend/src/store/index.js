// src/store/index.js

import { createStore } from 'vuex'
import { auth, onAuthStateChanged } from '../services/FirebaseService.js'
import FirestoreService from '../services/FirestoreService.js'

export default createStore({
  state: {
    user: null,
    meetings: []
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
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
          // 设置用户信息
          commit('SET_USER', user)
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
    // 处理用户登出
    async signOutUser({ commit }) {
      const AuthService = await import('../services/AuthService.js')
      const res = await AuthService.default.signOutUser()
      if (res) {
        commit('SET_USER', null)
        commit('SET_MEETINGS', [])
      }
    }
  },
  getters: {
    isLoggedIn: state => !!state.user,
    getUser: state => state.user,
    getMeetings: state => state.meetings
  },
  modules: {}
})
