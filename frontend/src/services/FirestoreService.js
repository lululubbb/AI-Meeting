// FirestoreService.js
import { db } from './FirebaseService.js';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, getDoc, getDocs, setDoc, limit, where, startAfter } from 'firebase/firestore';
class FirestoreService {
    // ... (listenToMeetings, getTranscriptions, getMeetingHistory, getAllMeetingHistory 等函数保持不变) ...
      // 监听用户的会议历史记录
  listenToMeetings(userId, callback) {
    if (typeof userId !== 'string') {
      console.error("userId 必须是字符串");
      return;
    }
    const q = query(collection(db, 'users', userId, 'meetings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const meetings = [];
      querySnapshot.forEach((docSnapshot) => {
        meetings.push({
          meetingId: docSnapshot.id, // 使用 meetingId 代替 id
          ...docSnapshot.data()
        });
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
      // await updateDoc(meetingDocRef, {
      //   status: status
      // });
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
        return ''; // 返回空字符串而不是空数组
      }
    } catch (error) {
      console.error('获取转录文本失败:', error);
      throw error;
    }
  }

  // 新增: 获取单个会议的详细信息
  async getMeetingHistory(userId, meetingId) {
    try {
      const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingDocRef);
      if (meetingDoc.exists()) {
        return {
          meetingId: meetingDoc.id,
          ...meetingDoc.data()
        };
      } else {
        return null; // 或抛出错误, 根据你的需求
      }
    } catch (error) {
      console.error('获取会议历史记录失败:', error);
      throw error;
    }
  }

  // 新增: 获取用户的所有会议
  async getAllMeetingHistory(userId) {
    try {
      const meetingsColRef = collection(db, 'users', userId, 'meetings');
      const q = query(meetingsColRef, orderBy('createdAt', 'desc')); // 按创建时间降序排列
      const querySnapshot = await getDocs(q);
      const meetings = [];
      querySnapshot.forEach(doc => {
        meetings.push({
          meetingId: doc.id,
          ...doc.data()
        });
      });
      return meetings;
    } catch (error) {
      console.error('获取所有会议历史记录失败:', error);
      throw error;
    }
  }
  // 添加/更新会议历史记录
    async updateOrCreateMeetingHistory(userId, meetingId, data) {
     try {
        const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
        const meetingDoc = await getDoc(meetingDocRef);

      if (meetingDoc.exists()) {
          // 更新现有记录
        const cleanedData = {};
        for (const key in data) {
          if (data.hasOwnProperty(key) && data[key] !== undefined) {
            cleanedData[key] = data[key];
          }
        }
        await updateDoc(meetingDocRef, cleanedData);
        console.log('会议历史记录已更新，ID:', meetingId);
      } else {
        // 创建新记录, 这里是关键修改
        await setDoc(meetingDocRef,{  createdAt: new Date(), ...data });

        console.log('会议历史记录已创建，ID:', meetingId);
        }
        return meetingId;
     }
     catch(err){
          console.error('添加/更新会议历史记录失败:', err);
      throw err;
     }
    }

    // 新增分页查询方法
    async getPaginatedMeetings(userId, page = 1, pageSize = 10, search = '') {
      if (!userId) throw new Error('用户未登录');
    
      try {
        let q = query(
          collection(db, 'users', userId, 'meetings'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
    
        if (page > 1) {
          const lastDoc = await this.getLastDoc(userId, page, pageSize);
          q = query(q, startAfter(lastDoc));
        }
    
        if (search) {
          q = query(q, where('sessionName', '>=', search));
        }
        console.log('查询参数:', { userId, page, pageSize, search }); // 调试参数
        // ...原有逻辑
        console.log('查询结果:', querySnapshot.docs.map(d => d.data())); // 调试返回数据
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          meetingId: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('分页查询失败:', error);
        throw error;
      }
    }
    
    async getLastDoc(userId, page, pageSize) {
      const q = query(
        collection(db, 'users', userId, 'meetings'),
        orderBy('createdAt', 'desc'),
        limit((page - 1) * pageSize)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs[querySnapshot.docs.length - 1];
    }

}

export default new FirestoreService();
