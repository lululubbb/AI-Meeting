import { db,auth } from './FirebaseService.js';
import {
  collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc,
  updateDoc, getDoc, getDocs, setDoc, where, deleteDoc,
  writeBatch, // Needed for deleting subcollections potentially
  increment, // For atomic increments
  limit, // For pagination
  startAfter // For pagination
} from 'firebase/firestore';
import { ElMessage } from 'element-plus'; // 导入 ElMessage

class FirestoreService {

     // 获取用户信息
     async getUserInfo(userId) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('zoomUserId', '==', userId)); // 使用 Zoom 的 userId, 字段名改为 zoomUserId
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          return userDoc.data();
        } else {
          console.log('No user found with userId:', userId);
          return null;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        throw error;
      }
    }
        // 新增: 更新/创建 用户的 Zoom userId (新增)
  async updateUserZoomId(firebaseUid, zoomUserId) {
    try {
      const userDocRef = doc(db, 'users', firebaseUid);
      await setDoc(userDocRef, { zoomUserId: zoomUserId }, { merge: true });
      console.log('Zoom userId 已更新/创建');
    } catch (error) {
      console.error('更新/创建 Zoom userId 失败:', error);
      throw error; // 或根据需要处理
    }
  }
      // 更新用户状态
      async updateUserStatus(userData){
        const userDocRef = doc(db,'users',userData.uid);
        await updateDoc(userDocRef,{
          name:userData.name,
          status:userData.status,
          workLocation: userData.workLocation,
          mood: userData.mood,
          avatarUrl: userData.avatarUrl,
          zoomUserId: userData.zoomUserId, // 确保 zoomUserId 也被更新
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

  // FirestoreService.js 新增方法 - 监听用户的待办事项
listenToTodos(userId, callback) {
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(userDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const todolist = docSnapshot.data().todolist || [];
      callback(todolist);
    }
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
      ElMessage.error('添加到会议历史记录失败'); // 使用 ElMessage
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
        ElMessage.error('添加参与者会议记录失败'); // 使用 ElMessage
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
      ElMessage.error('更新会议历史记录失败');  // 使用 ElMessage
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
        ElMessage.error('获取转录文本失败' ); // 使用 ElMessage
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
     ElMessage.error('保存转录文本失败');  // 使用 ElMessage
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
     ElMessage.error('删除会议记录失败'); // 使用 ElMessage
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
        ElMessage.error('获取会议历史记录失败'); // 使用 ElMessage
        throw error;
    }
  }

  // 获取用户的所有会议, 包括主持的和参与的
  async getAllMeetingHistory(userId) {
    if (!userId) { // 添加 userId 判空
         console.error("User ID is required to get meeting history.");
        return []; // 或者抛出错误,  根据你的需求
     }
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
           ElMessage.error('获取所有会议历史记录失败'); // 使用 ElMessage
           throw error;
        }
    }
  // 新增：添加待办事项
  async addTodoItem(userId, todo) {
    try {
      console.log("即将添加待办事项:", todo); // 调试日志
      if (!todo.text  || !todo.date) {
        throw new Error("待办事项缺少 text  或 date");
      }

      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // 获取当前待办事项列表
        const currentTodoList = userDoc.data().todolist || [];
        const updatedTodoList = [...currentTodoList, todo];

        // 更新 Firestore
        await updateDoc(userDocRef, { todolist: updatedTodoList });
        console.log("待办事项更新成功！");
      } else {
        // 用户文档不存在，创建新文档
        console.warn(`用户 ${userId} 文档不存在，创建新文档`);
        await setDoc(userDocRef, { todolist: [todo] });
        console.log("新用户文档创建成功！");
      }
    } catch (error) {
      console.error("添加待办事项失败:", error);
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
            ElMessage.error('获取用户活动记录失败'); // 使用 ElMessage
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
        ElMessage.error('添加活动失败'); // 使用 ElMessage
        throw error;
    }
}
 // 删除活动
 async deleteActivity(userId, activityId) {
  try {
      const activityRef = doc(db, 'users', userId, 'activities', activityId);
      await deleteDoc(activityRef);
      console.log('活动已删除:', activityId);
      ElMessage.success('活动已删除');
      return true; // 返回删除成功标志
  } catch (error) {
      console.error('删除活动失败:', error);
      ElMessage.error('删除活动失败');
      throw error;
  }
}

// 更新活动
async updateActivity(userId, activity) {
  try {
      const activityRef = doc(db, 'users', userId, 'activities', activity.id);
      await updateDoc(activityRef, activity);
      console.log('活动已更新:', activity.id);
      ElMessage.success('活动已编辑');
      return true; // 返回更新成功标志
  } catch (error) {
      console.error('更新活动失败:', error);
      ElMessage.error('编辑活动失败');
      throw error;
  }
}

async createPost(postData) {
  const user = auth.currentUser;
  if (!user) {
      ElMessage.error('用户未登录，无法发帖');
      throw new Error('User not authenticated');
  }
  try {
      const postToAdd = {
          topicId: postData.topicId,
          title: postData.title,
          content: postData.content,
          authorId: user.uid, 
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          viewCount: 0,
          commentCount: 0,
      };
      const docRef = await addDoc(collection(db, 'forum_posts'), postToAdd);
      console.log('Post created with ID:', docRef.id);
      ElMessage.success('发帖成功');
      return { id: docRef.id, ...postToAdd }; // Return the created post with ID
  } catch (error) {
      console.error('创建帖子失败:', error);
      ElMessage.error('发帖失败，请稍后重试');
      throw error;
  }
}

listenToPosts(topicId, sortBy, sortOrder, callback) {
  try {
      const postsRef = collection(db, 'forum_posts');
      let q = query(postsRef, where('topicId', '==', topicId));

      let sortField = 'createdAt'; 
      if (sortBy === 'comments') {
          sortField = 'commentCount';
      }

      q = query(q, orderBy(sortField, sortOrder));
      console.log(`Listening to posts for topic ${topicId}, sort: ${sortField} ${sortOrder}`);

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const posts = [];
          querySnapshot.forEach((doc) => {
              posts.push({
                  id: doc.id,
                  ...doc.data(),
              });
          });
          console.log(`Fetched ${posts.length} posts`);
          callback(posts);
      }, (error) => {
          console.error("监听帖子失败:", error);
          ElMessage.error('加载帖子列表失败');
          callback([]); 
      });

      return unsubscribe; 
  } catch (error) {
      console.error("设置帖子监听失败:", error);
      ElMessage.error('无法设置帖子监听');
      return () => {};
  }
}

async getPostById(postId) {
    try {
        const postRef = doc(db, 'forum_posts', postId);
        const docSnap = await getDoc(postRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.warn('Post not found:', postId);
            return null;
        }
    } catch (error) {
        console.error('获取帖子失败:', postId, error);
        ElMessage.error('加载帖子详情失败');
        throw error;
    }
}

async updatePost(postId, updatedData) {
    const user = auth.currentUser;
    if (!user) {
        ElMessage.error('用户未登录，无法编辑');
        throw new Error('User not authenticated');
    }
    try {
        const postRef = doc(db, 'forum_posts', postId);
        await updateDoc(postRef, {
            ...updatedData, 
            updatedAt: Timestamp.now(),
        });
        console.log('Post updated:', postId);
        ElMessage.success('帖子更新成功');
    } catch (error) {
        console.error('更新帖子失败:', postId, error);
        ElMessage.error('更新帖子失败');
        throw error;
    }
}

async deletePost(postId) {
    const user = auth.currentUser;
    if (!user) {
         ElMessage.error('用户未登录，无法删除');
         throw new Error('User not authenticated');
    }
    try {
        const postRef = doc(db, 'forum_posts', postId);
        await deleteDoc(postRef);
        console.log('Post deleted (document only):', postId);
        ElMessage.success('帖子已删除');
    } catch (error) {
        console.error('删除帖子失败:', postId, error);
        ElMessage.error('删除帖子失败');
        throw error;
    }
}

async incrementViewCount(postId) {
    try {
        const postRef = doc(db, 'forum_posts', postId);
        await updateDoc(postRef, {
            viewCount: increment(1)
        });
        console.log('View count incremented for post:', postId);
    } catch (error) {
        console.warn('Failed to increment view count for post:', postId, error);
    }
}

async createComment(postId, commentData) {
    const user = auth.currentUser;
    if (!user) {
        ElMessage.error('用户未登录，无法评论');
        throw new Error('User not authenticated');
    }
    try {
        const commentToAdd = {
            postId: postId,
            content: commentData.content,
            authorId: user.uid,
            createdAt: Timestamp.now(),
            parentId: commentData.parentId || null,
            depth: commentData.depth || 0,
            replyToAuthorId: commentData.replyToAuthorId || null,
        };
        const commentsRef = collection(db, 'forum_posts', postId, 'comments');
        const docRef = await addDoc(commentsRef, commentToAdd);
        console.log('Comment created with ID:', docRef.id, 'for post:', postId);

        const postRef = doc(db, 'forum_posts', postId);
        await updateDoc(postRef, {
            commentCount: increment(1)
        });

        ElMessage.success('评论成功');
        return { id: docRef.id, ...commentToAdd };
    } catch (error) {
        console.error('创建评论失败:', error);
        ElMessage.error('评论失败，请稍后重试');
        throw error;
    }
}

listenToComments(postId, callback) {
   try {
       const commentsRef = collection(db, 'forum_posts', postId, 'comments');
       const q = query(commentsRef, orderBy('createdAt', 'asc'));

       const unsubscribe = onSnapshot(q, (querySnapshot) => {
           const comments = [];
           querySnapshot.forEach((doc) => {
               comments.push({
                   id: doc.id,
                   ...doc.data(),
               });
           });
           console.log(`Fetched ${comments.length} comments for post ${postId}`);
           callback(comments);
       }, (error) => {
           console.error(`监听评论失败 (post ${postId}):`, error);
           ElMessage.error('加载评论失败');
           callback([]);
       });

       return unsubscribe;
   } catch (error) {
       console.error(`设置评论监听失败 (post ${postId}):`, error);
       ElMessage.error('无法设置评论监听');
       return () => {};
   }
}

async deleteComment(postId, commentId) {
   const user = auth.currentUser;
   if (!user) {
       ElMessage.error('用户未登录，无法删除评论');
       throw new Error('User not authenticated');
   }
   try {
       const commentRef = doc(db, 'forum_posts', postId, 'comments', commentId);
       await deleteDoc(commentRef);
       console.log('Comment deleted:', commentId, 'from post:', postId);

       const postRef = doc(db, 'forum_posts', postId);
       await updateDoc(postRef, {
           commentCount: increment(-1)
       });

       ElMessage.success('评论已删除');
   } catch (error) {
       console.error('删除评论失败:', commentId, error);
       ElMessage.error('删除评论失败');
       throw error;
   }
}
async getUserProfile(uid) {
  if (!uid) {
      console.warn("getUserProfile called with invalid UID:", uid);
      return { id: uid, name: '访客', avatarUrl: defaultAvatar }; 
  }
  try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
           const userData = userDocSnap.data();
          return {
              id: userDocSnap.id,
              name: userData.name || '用户',
              avatarUrl: userData.avatarUrl || defaultAvatar, 
          };
      } else {
          console.log('No user profile found for UID:', uid);
          return { id: uid, name: '未知用户', avatarUrl: defaultAvatar }; 
      }
  } catch (error) {
      console.error('获取用户资料失败 (by UID):', uid, error);
      return { id: uid, name: '加载出错', avatarUrl: defaultAvatar };
  }
}



}

export default new FirestoreService();
