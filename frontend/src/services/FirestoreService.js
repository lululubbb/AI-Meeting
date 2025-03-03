import { db } from './FirebaseService.js';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, getDoc, getDocs, setDoc, where, deleteDoc } from 'firebase/firestore';
// import { showSnackBar } from '../utils/utils.js'; // 移除
import { ElMessage } from 'element-plus'; // 导入 ElMessage

class FirestoreService {

     // 获取用户信息
       async getUserInfo(userId) {
         try {
           const userDocRef = doc(db, 'users', userId);
           const userDoc = await getDoc(userDocRef);
           if (userDoc.exists()) {
             return userDoc.data(); // 返回 Firestore 中的用户数据
           } else {
             return null; // 用户不存在
           }
         } catch (error) {
           console.error('获取用户信息失败:', error);
           throw error;
         }
       }
      // 更新用户状态
     async updateUserStatus(userId, status){
      const userDocRef = doc(db,'users',userId);
      await updateDoc(userDocRef,{
        status:status,
      })
     }
      // 更新用户工作位置
     async updateUserWorkLocation(userId, workLocation){
         const userDocRef = doc(db,'users',userId);
      await updateDoc(userDocRef,{
       workLocation:workLocation,
      })
     }
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

  // 添加会议历史记录，返回 meetingId (仅主持人创建会议时调用)
  async addToMeetingHistory(userId, sessionName, meetingData) {
    try {
      const meetingRef = await addDoc(collection(db, 'users', userId, 'meetings'), {
        sessionName: sessionName,
        ...meetingData,
        createdAt: Timestamp.now(),
      });
      console.log('会议文档已创建，ID:', meetingRef.id);
      ElMessage.success('会议已在 Firestore 中创建'); // 使用 ElMessage
      return meetingRef.id;
    } catch (error) {
      console.error('添加到会议历史记录失败:', error);
      ElMessage.error('添加到会议历史记录失败:' + error.message); // 使用 ElMessage
      throw error;
    }
  }

  // 新增：参与者加入会议时，在自己的 meetings 集合下添加一个指向主持人会议文档的引用
  async addParticipantMeeting(participantId, hostId, meetingId, joinTime) {
    try {
      const participantMeetingRef = doc(db, 'users', participantId, 'meetings', meetingId); // 使用 meetingId 作为文档ID
      await setDoc(participantMeetingRef, {
        hostId: hostId,         // 主持人ID
        // meetingId: meetingId,  // 因为文档ID就是meetingId, 所以这里不需要重复存储
        isParticipant: true,    // 标志这是一个参与者记录
        joinTime: joinTime,      // 参与者加入时间
        //  leaveTime, hasVideo, isSharing 等字段在 leaveSession 或 user-removed 事件中更新
      });
      console.log(`参与者 ${participantId} 加入会议 ${meetingId}`);
    } catch (error) {
        console.error('添加参与者会议记录失败:', error);
        ElMessage.error('添加参与者会议记录失败：' + error.message); // 使用 ElMessage
        throw error; // 或返回 false, 根据你的错误处理策略
    }
  }

  // 更新会议历史记录 (主持人更新主会议文档)
  async updateMeetingHistory(userId, meetingId, data) {
    try {
      const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
      await updateDoc(meetingDocRef, data);
      console.log('会议历史记录已更新，ID:', meetingId);
    } catch (error) {
      console.error('更新会议历史记录失败:', error);
      ElMessage.error('更新会议历史记录失败：' + error.message);  // 使用 ElMessage
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
        ElMessage.error('获取转录文本失败：' + error.message); // 使用 ElMessage
        throw error;
    }
}
  async saveTranscriptions(userId, meetingId, transcriptions) {
    try {
    const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
    await updateDoc(meetingDocRef, {
        transcriptions: transcriptions
    });
    console.log('转录文本已保存');
    } catch (error) {
     console.error('保存转录文本失败:', error);
     ElMessage.error('保存转录文本失败：' + error.message);  // 使用 ElMessage
     throw error;
    }
}



  async deleteMeetingHistory(userId, meetingId) {
   try {
     const meetingRef = doc(db, 'users', userId, 'meetings', meetingId);
     await deleteDoc(meetingRef);
     console.log('会议记录已删除:', meetingId);
   } catch (error) {
     console.error('删除会议记录失败:', error);
     ElMessage.error('删除会议记录失败：' + error.message); // 使用 ElMessage
     throw error; // 抛出错误
   }
 }

  // 获取单个会议的详细信息
  async getMeetingHistory(userId, meetingId) {
    try {
      // 1. 尝试直接获取 (假设 userId 是主持人)
      const meetingDocRef = doc(db, 'users', userId, 'meetings', meetingId);
      let meetingDoc = await getDoc(meetingDocRef);

      if (meetingDoc.exists() && !meetingDoc.data().isParticipant) {
        // 是主持人, 且不是参与者记录
        return { meetingId: meetingDoc.id, ...meetingDoc.data() };
      }

      // 2. 如果不是主持人, 或获取到的是参与者记录, 则先获取参与者记录
      const participantMeetingRef = doc(db, 'users', userId, 'meetings', meetingId);
      const participantMeetingDoc = await getDoc(participantMeetingRef);

      if (participantMeetingDoc.exists() && participantMeetingDoc.data().isParticipant) {
        // 是参与者
        const hostId = participantMeetingDoc.data().hostId;
        // 根据 hostId 和 meetingId 获取 *主* 会议文档
        const hostMeetingRef = doc(db, 'users', hostId, 'meetings', meetingId);
        const hostMeetingDoc = await getDoc(hostMeetingRef);

        if (hostMeetingDoc.exists()) {
          return { meetingId: hostMeetingDoc.id, ...hostMeetingDoc.data(), isParticipant: true }; //添加一个标记
        }
      }
      return null; // 或抛出错误, 根据你的需求
    } catch (error) {
        console.error('获取会议历史记录失败:', error);
        ElMessage.error('获取会议历史记录失败：' + error.message); // 使用 ElMessage
        throw error;
    }
  }

  // 获取用户的所有会议, 包括主持的和参与的
    async getAllMeetingHistory(userId) {
        try {
            const meetingsColRef = collection(db, 'users', userId, 'meetings');
            const q = query(meetingsColRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const meetings = [];
            for (const docSnap of querySnapshot.docs) { // 使用 for...of 循环
                const data = docSnap.data();
              if(data.isParticipant){ //如果是参与者
                const hostMeetingRef = doc(db, 'users', data.hostId, 'meetings', docSnap.id); //这里的docSnap.id就是meetingId
                const hostDocSnap = await getDoc(hostMeetingRef);
                if(hostDocSnap.exists()){ //如果主会议存在
                    meetings.push({
                        meetingId: hostDocSnap.id,
                        ...hostDocSnap.data(), // 使用主会议的数据
                        isParticipant: true,  // 标记为参与的会议
                        joinTime: data.joinTime,          // 参与者加入时间
                        leaveTime: data.leaveTime, //和video-active-change事件
                    })
                }
              }
              else{ //如果是主持人
                meetings.push({
                        meetingId: docSnap.id,
                       ...data
                    });
              }

            }
            return meetings;
        } catch (error) {
           console.error('获取所有会议历史记录失败:', error);
           ElMessage.error('获取所有会议历史记录失败：' + error.message); // 使用 ElMessage
           throw error;
        }
    }
     // 新增：添加待办事项
  async addTodoItem(userId, todo) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentTodoList = userDoc.data().todolist || [];
      const updatedTodoList = [...currentTodoList, todo];
      await updateDoc(userDocRef, { todolist: updatedTodoList });
    } else {
      // 处理用户文档不存在的情况（可选）
      console.warn(`User document not found for ID: ${userId}`);
      // 可以选择创建用户文档，或者抛出错误
      throw new Error("User document not found");
    }
  }

  // 新增：更新待办事项
  async updateTodoItem(userId, updatedTodo) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentTodoList = userDoc.data().todolist || [];
      const updatedTodoList = currentTodoList.map(todo =>
        todo.id === updatedTodo.id ? updatedTodo : todo
      );
      await updateDoc(userDocRef, { todolist: updatedTodoList });
    } else {
      console.warn(`User document not found for ID: ${userId}`);
       throw new Error("User document not found");
    }
  }

  // 新增：删除待办事项
  async deleteTodoItem(userId, todoId) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentTodoList = userDoc.data().todolist || [];
      const updatedTodoList = currentTodoList.filter(todo => todo.id !== todoId);
      await updateDoc(userDocRef, { todolist: updatedTodoList });
    } else {
       console.warn(`User document not found for ID: ${userId}`);
       throw new Error("User document not found");
    }
  }

   // 新增：获取用户的活动列表
    async getUserActivities(userId) {
        try {
        const activitiesRef = collection(db, 'users', userId, 'activities');
        const q = query(activitiesRef, orderBy('date', 'desc')); // 按日期降序排列
        const querySnapshot = await getDocs(q);
        const activities = [];
        querySnapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        return activities;
        } catch (error) {
            console.error("Error fetching user activities:", error);
            ElMessage.error('获取用户活动记录失败：' + error.message); // 使用 ElMessage
            throw error; // 或返回空数组, 根据你的错误处理策略
        }
    }

    // 新增：添加活动到 Firestore
   async addActivity(userId, activity) {
    try {
        const activitiesRef = collection(db, 'users', userId, 'activities');
         const result = await addDoc(activitiesRef, activity);
        return result; // 返回promise
    } catch (error) {
        console.error("Error adding activity:", error);
        ElMessage.error('添加活动失败：' + error.message); // 使用 ElMessage
        throw error;
    }
}
}

export default new FirestoreService();
