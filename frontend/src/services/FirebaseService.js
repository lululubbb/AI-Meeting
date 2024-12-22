// src/services/FirebaseService.js

import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider,
  onAuthStateChanged, // 导入 onAuthStateChanged
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth'
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore'

// Firebase 配置，使用 Vite 管理的环境变量
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

// 导出必要的 Firebase 功能，包括 onAuthStateChanged
export { 
  auth, 
  db, 
  googleProvider,
  onAuthStateChanged, // 导出 onAuthStateChanged
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
}
