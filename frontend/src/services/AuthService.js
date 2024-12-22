// src/services/AuthService.js

import axios from 'axios';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, 
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from './FirebaseService.js'
import { showSnackBar } from '../utils/utils.js'
import store from '../store'
import FirestoreService from './FirestoreService.js'
import ZoomVideoService from './ZoomVideoService.js' // 引入 ZoomVideoService.js
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './FirebaseService.js'

class AuthService {
  // 使用邮箱和密码登录
  async signInWithEmailAndPassword(email, password) {
    try {
      console.log(`尝试使用邮箱登录: ${email}`)
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log(`登录成功，用户 ID: ${user.uid}`)
      
      // 检查用户文档是否存在，如果不存在则创建
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      if (!userDoc.exists()) {
        // 创建基本用户信息
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || 'User'
        }, { merge: true })
        console.log('用户文档已创建')
      }
      
      // 获取 JWT，使用 user.email 作为 userIdentity
      const videoSDKJWT = await ZoomVideoService.getVideoSDKJWT(`Session_${user.uid}`, 1, user.email)
      
      if (videoSDKJWT) {
        // 将用户信息和 JWT 存储在 Vuex Store 中
        store.commit('SET_USER', { ...user, videoSDKJWT })
        return true
      } else {
        // 获取 JWT 失败，登出用户
        await this.signOutUser()
        return false
      }
    } catch (error) {
      console.error("登录错误:", error)
      showSnackBar(error.message)
      return false
    }
  }

  // 使用邮箱和密码注册
  async registerWithEmailAndPassword(email, password, name) {
    try {
      const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // 在 Firestore 中创建用户文档
      const userDocRef = doc(db, 'users', user.uid)
      await setDoc(userDocRef, {
        email: user.email,
        name: name
      }, { merge: true }) // 使用 setDoc 代替 addToMeetingHistory

      console.log('用户文档已创建，ID:', userDocRef.id)
      
      // 获取 JWT，使用 user.email 作为 userIdentity
      const videoSDKJWT = await ZoomVideoService.getVideoSDKJWT(`Session_${user.uid}`, 1, user.email)
      
      if (videoSDKJWT) {
        // 将用户信息和 JWT 存储在 Vuex Store 中
        store.commit('SET_USER', { ...user, videoSDKJWT })
        return true
      } else {
        // 获取 JWT 失败，登出用户
        await this.signOutUser()
        return false
      }
    } catch (error) {
      console.error("注册错误:", error)
      showSnackBar(error.message)
      return false
    }
  }

  // 使用 Google 登录
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      console.log(`Google 登录成功，用户 ID: ${user.uid}`)

      // 如果是新用户，添加到 Firestore
      if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
        const userDocRef = doc(db, 'users', user.uid)
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || 'User'
        }, { merge: true })
        console.log('新用户文档已创建')
      }

      // 获取 JWT，使用 user.email 作为 userIdentity
      const videoSDKJWT = await ZoomVideoService.getVideoSDKJWT(`Session_${user.uid}`, 1, user.email)
      
      if (videoSDKJWT) {
        // 将用户信息和 JWT 存储在 Vuex Store 中
        store.commit('SET_USER', { ...user, videoSDKJWT })
        return true
      } else {
        // 获取 JWT 失败，登出用户
        await this.signOutUser()
        return false
      }
    } catch (error) {
      console.error("Google 登录错误:", error)
      showSnackBar(error.message)
      return false
    }
  }

  // 用户登出
  async signOutUser() {
    try {
      await firebaseSignOut(auth)
      store.commit('SET_USER', null)  // 清除 Vuex Store 中的用户信息
      return true
    } catch (error) {
      showSnackBar(error.message)
      return false
    }
  }

  // 获取 Zoom Video SDK 的 JWT
  async getVideoSDKJWT(sessionName, role, userIdentity) {
    try {
      const response = await axios.post(import.meta.env.VITE_ZOOM_VIDEO_SDK_AUTH_ENDPOINT, {
        sessionName: sessionName,
        role: role,
        userIdentity: userIdentity
      });
      return response.data.signature;
    } catch (error) {
      showSnackBar("获取 JWT 失败: " + error.message);
      return null;
    }
  }
}

export default new AuthService()
