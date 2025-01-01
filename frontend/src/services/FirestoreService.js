// src/services/FirestoreService.js

import { db } from './FirebaseService.js';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFirestore, getDoc } from "firebase/firestore";

class FirestoreService {
  // 监听用户的会议历史记录
  listenToMeetings(userId, callback) {
    if (typeof userId !== 'string') {
      console.error("userId 必须是字符串");
      return;
    }
    const q = query(collection(db, 'users', userId, 'meetings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const meetings = [];
      querySnapshot.forEach((doc) => {
        meetings.push({ id: doc.id, ...doc.data() });
      });
      callback(meetings);
    });
  }

  // 添加会议历史记录，返回 meetingId
  async addToMeetingHistory(userId, sessionName, data) {
    try {
      const meetingsCollectionRef = collection(db, 'users', userId, 'meetings');
      const docRef = await addDoc(meetingsCollectionRef, {
        sessionName: sessionName,
        createdAt: new Date(),
        ...data
      });
      console.log('会议历史记录已添加，ID:', docRef.id);
      return docRef.id; // 返回生成的文档 ID
    } catch (error) {
      console.error('添加会议历史记录失败:', error);
      throw error;
    }
  }

  // 更新会议历史记录
  async updateMeetingHistory(userId, meetingId, data) {
    try {
      const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
      await updateDoc(meetingDocRef, data);
      console.log('会议历史记录已更新，ID:', meetingId);
    } catch (error) {
      console.error('更新会议历史记录失败:', error);
      throw error;
    }
  }

  // 保存会议的转录文本
  async saveTranscriptions(userId, meetingId, transcriptions) {
    try {
      const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
      await updateDoc(meetingDocRef, {
        transcriptions: transcriptions
      });
      console.log('转录文本已保存');
    } catch (error) {
      console.error('保存转录文本失败:', error);
      throw error;
    }
  }

  // 获取会议的转录文本
  async getTranscriptions(userId, meetingId) {
    try {
      const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingDocRef);
      if (meetingDoc.exists() && meetingDoc.data().transcriptions) {
        return meetingDoc.data().transcriptions;
      } else {
        return [];
      }
    } catch (error) {
      console.error('获取转录文本失败:', error);
      throw error;
    }
  }
}

export default new FirestoreService();
