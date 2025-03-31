<template>
    <div class="forum-page">
      <!-- 顶部导航 -->
      <el-menu mode="horizontal" :default-active="activeTopic.toString()" @select="handleTopicSelect">
            <el-menu-item v-for="topic in topics" :key="topic.id" :index="topic.id.toString()">
                {{ topic.name }}
            </el-menu-item>
            <el-menu-item index="hot">
                <el-icon><HotWater /></el-icon> 热门帖子
             </el-menu-item>
        </el-menu>

  
      <!-- 主要内容区域 -->
      <div class="main-content">     
        <!-- 左侧帖子列表 -->
        <div class="post-list">
    <template v-if="isMobile && activeTopic === 'hot'">
    <div class="hot-posts" >
    <el-card class="hot-card">
      <template #header>
        <div class="hot-header">
          <el-icon size="20" color="#F56C6C"><HotWater /></el-icon>
          <h3>热门帖子 TOP 10</h3>
        </div>
      </template>
      
      <div class="hot-list">
        <div 
          v-for="(post, index) in hotPosts" 
          :key="post.id"
          class="hot-item"
          @click="viewDetail(post)"
        >
          <div class="hot-index">
            <el-tag :type="index < 3 ? 'danger' : 'info'" size="small">
              {{ index + 1 }}
            </el-tag>
          </div>
          <div class="hot-content">
            <div class="hot-title">{{ post.title }}</div>
            <div class="hot-stats">
              <span class="stat-item">
                <el-icon><ChatLineRound /></el-icon>
                {{ post.comments?.length || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ post.viewCount || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>
    
<template v-else-if="!isMobile && activeTopic === 'hot'">
    <div class="hot-posts" >
    <el-card class="hot-card2">
      <template #header>
        <div class="hot-header">
          <el-icon size="20" color="#F56C6C"><HotWater /></el-icon>
          <h3>热门帖子 TOP 10</h3>
        </div>
      </template>
      
      <div class="hot-list">
        <div 
          v-for="(post, index) in hotPosts" 
          :key="post.id"
          class="hot-item"
          @click="viewDetail(post)"
        >
          <div class="hot-index">
            <el-tag :type="index < 3 ? 'danger' : 'info'" size="small">
              {{ index + 1 }}
            </el-tag>
          </div>
          <div class="hot-content">
            <div class="hot-title">{{ post.title }}</div>
            <div class="hot-stats">
              <span class="stat-item">
                <el-icon><ChatLineRound /></el-icon>
                {{ post.comments?.length || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ post.viewCount || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<template v-else>
    <div class="list-header">
        <h2>{{ currentTopic?.name }} 讨论区</h2>
        <div class="controls">
        <div class="search-box">
    <el-input
      v-model="searchKeyword"
      placeholder="搜索帖子（支持标题、内容、作者）"
      clearable
      style="width: 300px; margin-right: 20px;"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <div class="sort-controls">
      <el-select 
        v-model="sortType" 
        placeholder="排序方式" 
        style="width: 120px; margin-right: 10px;"
      >
        <el-option label="最新发布" value="time" />
        <el-option label="最多评论" value="comments" />
      </el-select>
      <el-radio-group v-model="sortOrder">
    <el-radio-button :label="'desc'">
      <el-tooltip content="降序排列" placement="top">
        <el-icon><ArrowDown /></el-icon>
      </el-tooltip>
    </el-radio-button>
    <el-radio-button :label="'asc'">
      <el-tooltip content="升序排列" placement="top">
        <el-icon><ArrowUp /></el-icon>
      </el-tooltip>
    </el-radio-button>
  </el-radio-group>
    </div>
    <el-button  @click="showCreateDialog" >
        <el-icon><Plus /></el-icon>
    </el-button>
  </div>
  </div>
</div>

    <!-- 帖子列表 -->
    <div class="post-list-content-wrapper"> 
      <div v-if="loadingPosts" class="loading-state">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <span>加载论坛信息中...</span>
      </div>
      <el-alert v-else-if="error" :title="'加载论坛帖子失败: ' + error" type="error" show-icon :closable="false" class="full-width-alert"/>

      <div v-else class="post-list-container">
            <el-empty 
            v-if="!allFilteredAndSortedPosts || allFilteredAndSortedPosts.length === 0" 
            description="当前分类下没有相关帖子"
            style="margin-top: 20px;"
            />
            <div v-else>
        <el-card 
            v-for="post in filteredPosts" 
            :key="post.id + (post.isAgendaPost ? '_agenda' : '')"
            class="post-card"
            @click="viewDetail(post)" 
            style="cursor: pointer;"
            >            
            <template #header>
              <div class="post-header">
                <el-avatar :size="35" :src="post.author?.avatar || defaultAvatar" />
                <div class="post-info">
                  <h3 class="post-title">{{ post.title }}
                    <el-tag v-if="post.isAgendaPost" type="info" size="mini">议程帖子</el-tag>
                </h3>
                  <div class="author-info">
                    <el-tag size="small">{{ post.author?.name || '用户' }}</el-tag>
                    <span class="post-time">{{ formatTime(post.createTime) }}</span>
                  </div>
                </div>
              </div>
            </template>
  
            <div class="post-content" >
              {{ post.content }}
            </div>
  
            <div class="post-actions">
                <span class="view-count">
                    <el-icon class="view-icon"><View /></el-icon>
                    {{ post.viewCount || 0  }}
                    </span>
             <span class="view-count">
                    <el-icon class="view-icon"><ChatLineRound /></el-icon>
                    {{  post.commentCount || 0  }}
            </span>
            <div class="author-actions"  v-if="!post.isAgendaPost && isAuthor(post)">
            <el-tooltip content="编辑" placement="top">
                <el-button
                            @click.stop="showEditDialog(post)" 
                            :icon="Edit"
                            size="small"
                            circle
                        />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
                <el-button
                            @click.stop="handleDeletePost(post.id)" 
                            type="danger"
                            :icon="Delete"
                            size="small"
                            circle
                        />
            </el-tooltip>
            </div>
          </div>
          </el-card>
        </div>
        </div> 
        <el-pagination
                v-if="!loadingPosts && !error && totalPosts > 0" 
                background
                layout="prev, pager, next"
                :total="totalPosts"
                :page-size="dynamicPageSize"
                :current-page="currentPage"
                :pager-count="isMobile ? 3 : 4" 
                @current-change="handlePageChange"
                class="pagination-container"
             />
        </div>
    </template>
    </div>

          <!-- 右侧热门帖子 -->
<div class="hot-posts desktop-sidebar" v-if="!isMobile  && activeTopic !== 'hot'">
  <div class="hot-posts" >
    <el-card class="hot-card">
      <template #header>
        <div class="hot-header">
          <el-icon size="20" color="#F56C6C"><HotWater /></el-icon>
          <h3>热门帖子 TOP 10</h3>
        </div>
      </template>
      
      <div class="hot-list">
        <div 
          v-for="(post, index) in hotPosts" 
          :key="post.id"
          class="hot-item"
          @click="viewDetail(post)"
        >
          <div class="hot-index">
            <el-tag :type="index < 3 ? 'danger' : 'info'" size="small">
              {{ index + 1 }}
            </el-tag>
          </div>
          <div class="hot-content">
            <div class="hot-title">{{ post.title }}</div>
            <div class="hot-stats">
              <span class="stat-item">
                <el-icon><ChatLineRound /></el-icon>
                {{ post.comments?.length || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ post.viewCount || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</div>
      </div>  
      <!-- 发帖对话框 -->
      <el-dialog v-model="createDialogVisible" title="发布新贴" width="90%">
        <el-form :model="newPost" label-width="40px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="newPost.title" placeholder="请输入帖子标题" />
          </el-form-item>
          <el-form-item label="内容" prop="content">
            <el-input
              v-model="newPost.content"
              type="textarea"
              :rows="5"
              placeholder="请输入帖子内容"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPost">提交</el-button>
        </template>
      </el-dialog>
  
      <!-- 帖子详情弹窗 -->
      <el-dialog v-model="detailDialogVisible" :title="currentPost?.title" width="70%">
        <el-timeline>
          <!-- 主帖内容 -->
          <el-timeline-item
            :timestamp="formatTime(currentPost?.createTime)"
            placement="top"
          >
            <el-card>
            <div class="post-header">
            <el-avatar :size="30" :src="currentPost?.author.avatar" />
            <div class="comment-info">
              <el-tag size="mini">{{ currentPost?.author.name }}</el-tag>
              <span class="comment-time">{{ formatTime(currentPost?.createTime) }}</span>
            </div>
          </div>
              <div class="post-content">
                {{ currentPost?.content }}
              </div>
            </el-card>
          </el-timeline-item>
  
          <!-- 回复列表 -->
          <el-timeline-item
            v-for="comment in currentPost?.comments"
            :key="comment.id"
            :timestamp="formatTime(comment.time)"
            placement="top"
          >
          <el-card class="comment-card" :style="{ marginLeft: (isMobile ? (comment.depth * 10) : (comment.depth * 40)) + 'px' }">
          <div class="comment-header">
            <el-avatar :size="30" :src="comment.author?.avatar || defaultAvatar" />
        <div class="comment-info">
          <el-tag size="mini">{{ comment.author?.name || '用户' }}</el-tag>
          <span class="comment-time">{{ formatTime(comment.time) }}</span>
          <span v-if="comment.replyTo" class="reply-to">
             回复 @{{ comment.replyTo?.name || '用户' }}
          </span>
            </div>
          </div>
          <div class="comment-content"> {{ comment.content }} </div>
          <div class="comment-actions">
            <el-tooltip content="回复" placement="top" :disabled="isMobile"> 
                    <el-button
                        v-if="!currentPost?.isAgendaPost" 
                        size="small"
                        text       
                        :icon="ChatLineRound"
                        @click="showReplyForm(comment)"
                        :disabled="!currentUser"
                        class="action-button reply-button" 
                    >
                       {{ isMobile ? '' : '回复' }}
                    </el-button>
                </el-tooltip>

                <el-tooltip content="删除" placement="top" :disabled="isMobile">
                    <el-button
                        v-if="currentUser && comment.authorId === currentUser.uid"
                        :icon="Delete"
                        size="small"
                        type="danger"
                        text  
                        @click="handleDeleteComment(comment)"
                        class="action-button delete-button"
                    />
                </el-tooltip>
            </div>

  
              <!-- 回复表单 -->
              <div v-if="activeReply === comment.id" class="reply-form">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入回复内容"
                />
                <div class="form-actions">
                  <el-button size="small" @click="cancelReply">取消</el-button>
                  <el-button type="primary" size="small" @click="submitReply(comment)">
                    提交
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-timeline-item>

           <!-- 主帖回复按钮 -->
      <el-timeline-item>
        <div class="main-reply">
          <el-button
            type="primary"
            @click="showMainReplyForm"
            v-if="!showMainReply"
          >
            评论主帖
          </el-button>
          <div v-if="showMainReply" class="main-reply-form">
            <el-input
              v-model="mainReplyContent"
              type="textarea"
              :rows="3"
              placeholder="输入对主帖的回复..."
            />
            <div class="form-actions">
              <el-button @click="cancelMainReply">取消</el-button>
              <el-button type="primary" @click="submitMainReply">提交</el-button>
            </div>
          </div>
        </div>
      </el-timeline-item>

    </el-timeline>
      </el-dialog>

      <el-dialog v-model="editDialogVisible" title="编辑帖子" :width="isMobile ? '95%' : '60%'">
        <el-form v-if="editingPost" :model="editingPost" label-width="40px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="editingPost.title" placeholder="请输入帖子标题" />
          </el-form-item>
          <el-form-item label="内容" prop="content">
            <el-input
              v-model="editingPost.content"
              type="textarea"
              :rows="5"
              placeholder="请输入帖子内容"
            />
          </el-form-item>
        </el-form>
         <div v-else>加载中...</div>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">保存修改</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed,onUnmounted,onBeforeUnmount ,onMounted,watch } from 'vue'
  import { ElNotification, ElMessageBox} from 'element-plus'
  import dayjs from 'dayjs'
  import FirestoreService from "../services/FirestoreService.js";
import { Timestamp } from 'firebase/firestore';
import { Search,ArrowUp, ArrowDown, View ,Loading, HotWater, ChatLineRound,Plus,Delete,Edit  } from '@element-plus/icons-vue'
import defaultAvatar from '../assets/柴犬.png';
import { useStore } from 'vuex';
const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)

const store = useStore();
const topics = ref([
  { id: 1, name: '主论坛' },
  { id: 2, name: '新品发布' },
  { id: 3, name: '平行会议' },
  { id: 4, name: '生态合作' },
  { id: 5, name: '数据安全' },
  { id: 6, name: 'AI与数字安全' },
  { id: 7, name: '信创密码' },
  { id: 8, name: '产教融合' }
])
  
  const posts = ref([])
  
  // 状态管理
  const activeTopic = ref(1)
  const createDialogVisible = ref(false)
  const detailDialogVisible = ref(false)
  const currentPost = ref(null)
  const activeReply = ref(null)
  const replyContent = ref('')
  const newPost = ref({
    title: '',
    content: '',
    topicId: 1
  })
  const currentPage = ref(1)
  const showMainReply = ref(false)
const mainReplyContent = ref('')
const editDialogVisible = ref(false);
const editingPost = ref(null);
const loadingPosts = ref(true); 
const error = ref(null);      
let unsubscribePosts = null;
const agendaData = ref(null);
let postIdCounter = 10; 
const searchKeyword = ref('');
const sortType = ref('time') // 默认按时间排序
const sortOrder = ref('desc') // 默认降序
const dynamicPageSize = computed(() => isMobile.value ? 4 :3)
const generatedPosts = ref([]);
const firestorePosts = ref([]);

// 合并后的帖子数据
const allPosts = computed(() => {
    const agendaPosts = generatedPosts.value.map(p => ({ ...p, isAgendaPost: true }));
    const dbPosts = firestorePosts.value.map(p => ({ ...p, isAgendaPost: false }));
    return [...agendaPosts, ...dbPosts];
});

const findTopicIdByName = (forumName) => {
    const topic = topics.value.find(t => t.name === forumName);
    if (forumName === "生态合作论坛") return topics.value.find(t => t.name === "生态合作")?.id || 1;
    if (forumName === "AI引领数字安全新浪潮专题会议") return topics.value.find(t => t.name === "AI与数字安全")?.id || 1; // Example mapping
    if (forumName === "数据要素安全与新质生产力高端对话") return topics.value.find(t => t.name === "数据安全")?.id || 1; // Example mapping

    return topic ? topic.id : 1; 
};

const fetchAgendaAndGeneratePosts = async () => {
    console.log("Starting fetch agenda...");
    try {
        const response = await fetch('/data/agenda.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const fetchedData = await response.json();

        if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
            console.warn("Fetched agenda data is empty or not an array.");
            generatedPosts.value = []; 
            return;
        }

        const tempGenerated = [];
        let localPostIdCounter = 1000000;

        fetchedData.forEach(day => {
            day.sessions.forEach(session => {
                let postContent = `会议时间: ${session.time_or_status || '待定'}\n地点: ${session.location || '待定'}\n`;
                 if(session.content && session.content.length > 0) {
                     postContent += `主要议程见会议日程\n`;
                     session.content.slice(0, 3).forEach(item => {
                         postContent += `- ${item.title} (${item.time})\n`;
                     });
                 } else {
                     postContent += "具体议程请关注官方发布。";
                 }

                 let startTimePart = session.time_or_status?.split(' - ')[0].trim() || '09:00';
                    if (!/^\d{2}:\d{2}$/.test(startTimePart)) {
                        console.warn(`Invalid time format "${startTimePart}" for session "${session.title}", using 09:00`);
                        startTimePart = '09:00';
                    }
                 let createDateTime;
                 try {
                     const year = new Date().getFullYear();
                     const dateParts = day.date.match(/(\d+)月(\d+)日/);
                     if (dateParts) {
                         const month = dateParts[1].padStart(2, '0');
                         const dayOfMonth = dateParts[2].padStart(2, '0');
                         createDateTime = `${year}-${month}-${dayOfMonth}T${startTimePart}:00`; // ISO format
                     } else {
                        console.warn(`Could not parse date "${day.date}", using today.`);
                         const today = new Date();
                         createDateTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T${startTimePart}:00`;
                     }
                 } catch (e) {
                    console.error("Error parsing date/time:", day.date, session.time_or_status, e);
                    createDateTime = new Date().toISOString(); // Fallback
                 }

                 let topicId = findTopicIdByName(session.forum);

                tempGenerated.push({
                    id: `agenda_${localPostIdCounter++}`, 
                    topicId: topicId,
                    title: session.title,
                    content: postContent,
                    author: { id: 'system_agenda', name: '会议主办方', avatar: defaultAvatar }, // Use default avatar or a specific one
                    createTime: dayjs(createDateTime).isValid() ? dayjs(createDateTime).toISOString() : new Date().toISOString(),
                    viewCount: Math.floor(Math.random() * 50) + 5, 
                    comments: [], 
                    commentCount: 0, 
                    isAgendaPost: true 
                });
            });
        });

        generatedPosts.value = tempGenerated; 
        console.log(`Generated ${generatedPosts.value.length} agenda posts.`);

    } catch (err) {
        console.error("Failed to fetch or process agenda data:", err);
        error.value = `日程加载失败: ${err.message}`; 
        generatedPosts.value = []; 
    }
};

const handlePageChange = (page) => {
    currentPage.value = page
    const container = document.querySelector('.post-list-container');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Fallback
    }
}
const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
}

watch(activeTopic, () => {
  currentPage.value = 1
})
watch(detailDialogVisible, (newValue) => {
    if (!newValue && unsubscribeComments) {
        unsubscribeComments();
        unsubscribeComments = null;
    }
});
const handleScroll = () => {
  if (!isMobile.value) return
  
  const container = document.documentElement
  const { scrollTop, clientHeight, scrollHeight } = container
  if (scrollHeight - (scrollTop + clientHeight) < 200) {
    if (currentPage.value * dynamicPageSize.value < totalPosts.value) {
      currentPage.value++
    }
  }
}
const authorCache = ref({}); 

const currentUser = computed(() => {
    const userFromStore = store.getters.getUser; 
    if (userFromStore && userFromStore.uid) {
        return {
            uid: userFromStore.uid,
            name: userFromStore.name || '用户',
            avatar: userFromStore.avatarUrl || defaultAvatar,
        };
    }
    return null;
});


const getAuthorDisplayInfo = async (authorId) => {
    if (!authorId) return { name: '访客', avatar: defaultAvatar };
    if (authorCache.value[authorId]) return authorCache.value[authorId];

    if (authorId === 'system_agenda') {
        const sysInfo = { name: '会议主办方', avatar: defaultAvatar };
        authorCache.value[authorId] = sysInfo; // Cache it
        return sysInfo;
    }

    try {
        console.log(`Fetching profile for authorId (UID): ${authorId}`);
        const userInfo = await FirestoreService.getUserProfile(authorId);

        if (userInfo) {
            const displayInfo = {
                name: userInfo.name || '用户', 
                avatar: userInfo.avatarUrl || defaultAvatar 
            };
            authorCache.value[authorId] = displayInfo; 
            return displayInfo;
        } else {
             console.warn(`getUserProfile returned null/undefined for UID: ${authorId}`);
             const fallbackInfo = { name: '未知用户', avatar: defaultAvatar };
             authorCache.value[authorId] = fallbackInfo; 
            return fallbackInfo;
        }
    } catch (err) {
        console.error("Error in getAuthorDisplayInfo for UID:", authorId, err);
         const errorFallback = { name: '加载出错', avatar: defaultAvatar };
         authorCache.value[authorId] = errorFallback; // Cache error fallback
        return errorFallback;
    }
 };

 const fetchAuthorsForItems = async (items, idField = 'authorId') => {
    if (!Array.isArray(items)) {
        console.warn("fetchAuthorsForItems received non-array:", items);
        return [];
    }
    const authorIds = [...new Set(items.map(item => item[idField]).filter(id => id && id !== 'system_agenda'))];
    const authorsToFetch = authorIds.filter(id => !authorCache.value[id]);

    if (authorsToFetch.length > 0) {
        console.log("Fetching profiles for UIDs:", authorsToFetch);
        try {
            await Promise.all(authorsToFetch.map(id => getAuthorDisplayInfo(id)));
        } catch (fetchErr) {
             console.error("Error during batch author fetching:", fetchErr);
        }
    }

    return items.map(item => {
         const authorInfo = authorCache.value[item[idField]] || { name: (item[idField] === 'system_agenda' ? '会议主办方' : '未知'), avatar: defaultAvatar };
        return {
            ...item,
            author: authorInfo
        };
    });
 };


 const setupPostsListener = () => {
    if (unsubscribePosts) {
        unsubscribePosts();
        unsubscribePosts = null;
    }
    loadingPosts.value = true;
    error.value = null;

    const firestoreSortField = sortType.value === 'comments' ? 'commentCount' : 'createdAt';

    unsubscribePosts = FirestoreService.listenToPosts(
        activeTopic.value,
        firestoreSortField,
        sortOrder.value,
        async (fetchedDbPosts) => { 
            console.log(`Listener update: Received ${fetchedDbPosts.length} Firestore posts for topic ${activeTopic.value}.`);
            try {
                const postsWithTime = fetchedDbPosts.map(p => ({
                    ...p,
                    createTime: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : new Date(0).toISOString(),
                    updatedTime: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : null,
                    isAgendaPost: false,
                    commentCount: p.commentCount || 0
                }));

                const postsWithAuthors = await fetchAuthorsForItems(postsWithTime, 'authorId');

                firestorePosts.value = postsWithAuthors;
                console.log(`Processed ${firestorePosts.value.length} Firestore posts with authors.`);
                error.value = null; 

            } catch (fetchError) {
                console.error("Error processing Firestore posts or fetching authors:", fetchError);
                firestorePosts.value = fetchedDbPosts.map(p => ({
                    ...p,
                    createTime: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : new Date(0).toISOString(),
                    author: { name: '加载失败', avatar: defaultAvatar },
                    isAgendaPost: false,
                    commentCount: p.commentCount || 0
                }));
                error.value = `帖子作者信息加载失败: ${fetchError.message}`;
            } finally {
                loadingPosts.value = false;
            }
        },
        (listenerError) => { 
            error.value = `数据库帖子监听失败: ${listenerError.message}`;
            firestorePosts.value = []; 
            loadingPosts.value = false;
            console.error("Firestore listener error:", listenerError);
        }
    );
 };


const showEditDialog = (post) => {
    if (post.isAgendaPost) {
        ElNotification.warning('官方议程帖子不可编辑');
        return;
    }
    if (!currentUser.value || currentUser.value.uid !== post.authorId) {
        ElNotification.error('无权编辑此帖子');
        return;
    }
    const rawPostData = firestorePosts.value.find(p => p.id === post.id);
    if (!rawPostData) {
        ElNotification.error('无法找到原始帖子数据进行编辑');
        return;
    }
    editingPost.value = {
        id: rawPostData.id,
        title: rawPostData.title,
        content: rawPostData.content,
    };
    editDialogVisible.value = true;
};

const submitEdit = async () => {
    if (!editingPost.value) return;
    if (!editingPost.value.title || !editingPost.value.content) {
        ElNotification({ title: '错误', message: '标题和内容不能为空', type: 'error' });
        return;
    }
    try {
        await FirestoreService.updatePost(editingPost.value.id, {
            title: editingPost.value.title,
            content: editingPost.value.content
        });
        editDialogVisible.value = false;
    } catch (err) {
        console.error('Submit edit failed:', err);
    }
};

const handleDeletePost = async (postId) => {
    const postToDelete = allPosts.value.find(p => p.id === postId);

    if (postToDelete?.isAgendaPost) {
        ElNotification.error('官方议程帖子不可删除');
        return;
    }

    if (!currentUser.value || !postToDelete || currentUser.value.uid !== postToDelete.authorId) {
        ElNotification.error('无权删除此帖子');
        return; //
    }

    try {
        await ElMessageBox.confirm(
            '确定要删除这篇帖子吗？此操作无法撤销（评论也会丢失）。',
            '确认删除',
            { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        );

        await FirestoreService.deletePost(postId);

        if (currentPost.value && currentPost.value.id === postId) {
            detailDialogVisible.value = false;
        }
    } catch (action) {
        if (action === 'cancel') {
            ElNotification({ type: 'info', message: '删除已取消' });
        } else {
            console.error('Delete post failed:', action);
        }
    }
};

const isAuthor = (post) => {
    if (!post || post.isAgendaPost) return false;
    return currentUser.value && post.authorId === currentUser.value.uid;
};

onMounted(async () => {
    loadingPosts.value = true; 
    error.value = null;
    generatedPosts.value = []; 
    firestorePosts.value = []; 

    await fetchAgendaAndGeneratePosts();

    setupPostsListener();

    window.addEventListener('resize', updateScreenWidth);
    window.addEventListener('scroll', handleScroll);
});

watch([activeTopic, sortType, sortOrder], () => {
    if (typeof activeTopic.value === 'number') {
       console.log("Topic or sort changed, re-fetching Firestore posts for topic:", activeTopic.value);
       currentPage.value = 1;
       setupPostsListener();
    } else {
        console.log("Active selection is not a topic ID, skipping post fetch:", activeTopic.value);
        loadingPosts.value = false; 
        error.value = null;
    }
}, { immediate: true });

watch(detailDialogVisible, (newValue) => {
    if (!newValue && unsubscribeComments) {
        unsubscribeComments();
        unsubscribeComments = null;
        currentPost.value = null;
        comments.value = [];
    }
});

watch(allPosts, (newVal) => {
  console.log('合并后的帖子数据:', newVal);
}, { deep: true });

const handleTopicSelect = (selectedIndex) => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  activeTopic.value = /^\d+$/.test(selectedIndex) ? parseInt(selectedIndex) : 'hot';

currentPage.value = 1; // Reset pagination
console.log("Selected view:", activeTopic.value);
};

const allFilteredAndSortedPosts = computed(() => {
    let filtered = allPosts.value.filter(p => p.topicId === activeTopic.value);

    const keyword = searchKeyword.value.trim().toLowerCase();
    if (keyword) {
        filtered = filtered.filter(post =>
            (post.title && post.title.toLowerCase().includes(keyword)) ||
            (post.content && post.content.toLowerCase().includes(keyword)) ||
            (post.author?.name && post.author.name.toLowerCase().includes(keyword))
        );
    }

    filtered.sort((a, b) => {
        let compareResult = 0;
        if (sortType.value === 'time') {
            const timeA = a.createTime ? Date.parse(a.createTime) : 0;
            const timeB = b.createTime ? Date.parse(b.createTime) : 0;
            compareResult = timeB - timeA;
        } else if (sortType.value === 'comments') {
            const aCount = a.commentCount ?? (a.comments?.length || 0);
            const bCount = b.commentCount ?? (b.comments?.length || 0);
            compareResult = bCount - aCount;
        }
        return sortOrder.value === 'desc' ? compareResult : -compareResult;
    });

    return filtered;
});


const filteredPosts = computed(() => {
    const start = (currentPage.value - 1) * dynamicPageSize.value;
    const end = start + dynamicPageSize.value;
    const paginated = allFilteredAndSortedPosts.value.slice(start, end);
    console.log(`Displaying posts ${start + 1} to ${end} of ${allFilteredAndSortedPosts.value.length}`);
    return paginated;
});

const totalPosts = computed(() => allFilteredAndSortedPosts.value.length);

const currentTopic = computed(() => {
    if (typeof activeTopic.value === 'number') {
        return topics.value.find(t => t.id === activeTopic.value);
    }
    return null; 
});
  // 方法
  const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
  
  const showCreateDialog = () => {
    if (!currentUser.value) {    ElNotification({ title: '错误', message: '请先登录', type: 'error' }); return; }
    newPost.value = { title: '', content: '', topicId: activeTopic.value }; 
    createDialogVisible.value = true
}

const submitPost = async () => {
    if (!currentUser.value) {
        ElNotification({ title: '错误', message: '请先登录', type: 'error' });
        return;
    }
    if (!newPost.value.title || !newPost.value.content) {
        ElNotification({ title: '错误', message: '请填写完整信息', type: 'error' });
        return;
    }
        try {
        await FirestoreService.createPost({
            ...newPost.value,
            topicId: activeTopic.value,
            authorId: currentUser.value.uid, // 添加authorId
            createdAt: Timestamp.now(),
            viewCount: 0,
            commentCount: 0
        });
        createDialogVisible.value = false;
        newPost.value = { title: '', content: '', topicId: activeTopic.value }; 
    } catch (err) {
        console.error('发帖失败:', err);
    }
}
  
  
const showReplyForm = (comment) => {
    if (!currentUser.value) {
        ElNotification({ title: '警告', message: '请先登录后再回复', type: 'warning', duration: 2000 });
        return;
    }
    if (currentPost.value?.isAgendaPost) {
        ElNotification({ title: '警告', message: '议程帖子不支持评论交互', type: 'warning', duration: 2000 });

        return;
    }
    activeReply.value = comment.id;
    currentParentComment.value = comment;
    replyContent.value = '';
};
  
  const cancelReply = () => {
    activeReply.value = null
    replyContent.value = ''
    currentParentComment.value = null;
  }
  
  const showMainReplyForm = () => {
    if (!currentUser.value) { ElNotification.warning('请先登录'); return; }
    if (currentPost.value?.isAgendaPost) {
        ElNotification.info('议程帖子当前不支持评论交互');
        return;
    }
    showMainReply.value = true;
    mainReplyContent.value = '';
};

const cancelMainReply = () => {
    showMainReply.value = false;
    mainReplyContent.value = '';
};


const submitReply = async () => { 
    if (!currentUser.value) { ElNotification.error('请重新登录'); return; }
    if (!currentPost.value || !currentParentComment.value) { ElNotification.error('无法确定回复目标'); return; }
    if (!replyContent.value.trim()) { ElNotification({ title: '错误', message: '请输入回复内容', type: 'error' }); return; }

    try {
        await FirestoreService.createComment(currentPost.value.id, {
            content: replyContent.value,
            parentId: currentParentComment.value.id, // ID of the comment being replied to
            depth: (currentParentComment.value.depth || 0) + 1,
            replyToAuthorId: currentParentComment.value.authorId // ID of the author being replied to
        });
        resetReplyForm(); 
    } catch (err) {
        console.error("Submit reply failed:", err);
    }
};

// 新增状态管理
const currentParentComment = ref(null)

// 重置表单方法
const resetReplyForm = () => {
  replyContent.value = ''
  activeReply.value = null
  currentParentComment.value = null
}

const submitMainReply = async () => {
    if (!currentUser.value) { ElNotification({ title: '错误', message: '请重新登陆', type: 'error' }); return; }
    if (!currentPost.value) { ElNotification({ title: '错误', message: '无法确定评论目标', type: 'error' }); return;  }
    if (!mainReplyContent.value.trim()) { ElNotification({ title: '错误', message: '请输入评论内容', type: 'error' }); return; }

    try {
        await FirestoreService.createComment(currentPost.value.id, {
            content: mainReplyContent.value,
            parentId: null, 
            depth: 0,
            replyToAuthorId: null 
        });
        cancelMainReply(); 
    } catch (err) {
        console.error("Submit main reply failed:", err);
    }
};

const handleDeleteComment = async (comment) => {
    if (!currentUser.value || !comment || currentUser.value.uid !== comment.authorId) {
        ElNotification({ title: '错误', message: '无权删除此评论', type: 'error' });
        return;
    }
     if (!currentPost.value || !currentPost.value.id) {
         ElNotification({ title: '错误', message: '无法确定帖子信息', type: 'error' });
        return;
    }

    try {
        await ElMessageBox.confirm(
            '确定要删除这条评论吗？', '确认删除',
            { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        );
        await FirestoreService.deleteComment(currentPost.value.id, comment.id);
    } catch (action) {
         if (action === 'cancel') {
            ElNotification({ type: 'info', message: '删除已取消' });
        } else {
            console.error('Delete comment failed:', action);
        }
    }
};


let unsubscribeComments = null;
const comments = ref([]);
const loadingComments = ref(false);
const commentError = ref(null);

const viewDetail = async (post) => {
    if (!post || !post.id) {return; }
    console.log("Viewing detail for post:", post.id, "Is Agenda:", post.isAgendaPost);

     const postWithAuthor = Array.isArray(await fetchAuthorsForItems([post])) ? (await fetchAuthorsForItems([post]))[0] : post;


    currentPost.value = {
        ...postWithAuthor, 
        comments: [] 
    };
    detailDialogVisible.value = true;
    loadingComments.value = true;
    commentError.value = null;

    if (unsubscribeComments) {
        unsubscribeComments();
        unsubscribeComments = null;
    }

    if (post.isAgendaPost) {
        console.log(`Agenda post ${post.id}: Handling view count locally.`);
        const index = generatedPosts.value.findIndex(p => p.id === post.id);
        if (index > -1) {
             generatedPosts.value[index].viewCount = (generatedPosts.value[index].viewCount || 0) + 1;
             if (currentPost.value && currentPost.value.id === post.id) {
                 currentPost.value.viewCount = generatedPosts.value[index].viewCount;
             }
        }
        currentPost.value.comments = post.comments || []; // Use comments from JSON
        loadingComments.value = false;
        console.log("Agenda post - Comments loaded from JSON (if any).");

    } else {
        console.log(`Firestore post ${post.id}: Incrementing view count & listening for comments.`);
        FirestoreService.incrementViewCount(post.id).catch(err => console.warn(`Failed increment view count: ${err.message}`));
        console.log(`Setting up comments listener for post ID: ${post.id}`);
        unsubscribeComments = FirestoreService.listenToComments(
            post.id,
            async (fetchedComments) => { 
                console.log(`Listener update: Received ${fetchedComments.length} comments for post ${post.id}.`);
                if (!currentPost.value || currentPost.value.id !== post.id) {
                     console.warn(`Comment listener update skipped: currentPost changed or missing. Target post ID: ${post.id}`);
                     if (unsubscribeComments) unsubscribeComments(); 
                    return;
                }
                try {
                    const commentsWithTime = fetchedComments.map(c => ({
                        ...c,
                        time: c.createdAt?.toDate ? c.createdAt.toDate().toISOString() : new Date(0).toISOString(),
                        replyToAuthorId: c.replyToAuthorId || null
                    }));

                    const commentsWithAuthors = await fetchAuthorsForItems(commentsWithTime, 'authorId');

                    const processedComments = await Promise.all(commentsWithAuthors.map(async (comment) => {
                         let replyToInfo = null;
                         if (comment.replyToAuthorId) {
                             replyToInfo = await getAuthorDisplayInfo(comment.replyToAuthorId);
                         }
                         return {
                             ...comment,
                             replyTo: replyToInfo
                         };
                    }));

                    currentPost.value.comments = processedComments;
                    console.log(`Updated comments for currentPost ${post.id}`, currentPost.value.comments);

                    commentError.value = null;

                } catch (err) {
                    console.error(`Error processing comments or fetching authors for post ${post.id}:`, err);
                    commentError.value = `评论信息加载出错: ${err.message}`;
                     currentPost.value.comments = [];
                } finally {
                    loadingComments.value = false;
                }
            },
            (listenerError) => { f
                console.error(`Comment listener error for post ${post.id}:`, listenerError);
                commentError.value = `评论监听失败: ${listenerError.message}`;
                 if (currentPost.value && currentPost.value.id === post.id) {
                     currentPost.value.comments = []; // Clear comments
                 }
                loadingComments.value = false;
            }
        );
    }
 };

const hotPosts = computed(() => {
    return [...allPosts.value] 
      .map(post => ({
        ...post,
        hotScore: (post.commentCount ?? (post.comments?.length || 0)) * 2 + (post.viewCount || 0)
      }))
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 10);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScreenWidth);
    window.removeEventListener('scroll', handleScroll);
    if (unsubscribePosts) unsubscribePosts();
    if (unsubscribeComments) unsubscribeComments();
});

onUnmounted(() => {
  currentPost.value = null;
});

</script>
  <style scoped>
  .forum-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    height: 110vh;
    border: none;
  }

.el-menu-item {
  font-size: 17px; 
  font-weight: 500; 
}

  .search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0; /* 防止搜索框缩小 */
  min-width: 300px;
}
  .main-content {
    display: flex;
    margin-top: 20px;
    gap: 20px;
    align-items: flex-start; 
  }
  
  .post-list {
    flex: 1;
    min-width: 0;
  display: flex;
  flex-direction: column;
  }

  .post-list > :not(.list-header) {
  flex: 1;
  overflow-y: auto;
   min-height: 0; 
}

  .list-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 20px;
    gap: 15px; 
  }
  h2{
    font-size: 17px;
  }
  h3{
    font-size: 15px;
    margin:0px;
    padding: 0;;
  }

  .post-list-container {
    flex-grow: 1; 
  overflow-y: auto;
  margin-bottom: 20px;
}

  .post-card {
  transition: all 0.3s;
  margin-bottom: 15px;
  width: 99.5%;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
  .controls {
  display: flex;
  align-items: center;
  gap: 10px; 
  flex-grow: 1;
}
el-select {
  min-width: 120px; /* 确保下拉框有最小宽度 */
}
.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-radio-group {
  white-space: nowrap; /* 防止单选按钮换行 */
}

  .post-header {
    align-items: center;
    gap: 10px;
    display: flex;
  }
  .post-header .el-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
}
  .post-info {
    flex: 1;
  }
  post-time{
    white-space: normal;
    word-wrap: break-word;
    max-width: 100%;
    font-size: 10px;
  }
  .post-title {
    margin: 0;
    font-size: 16px;
  }
  
  .author-info {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #666;
    font-size: 12px;
    margin-top: 5px;
    margin-bottom: -5px;
  }
  
  .post-content {
    color: #555;
    line-height: 1.5; 
    margin: 10px 0; 
     display: -webkit-box;
     -webkit-line-clamp: 3; 
     -webkit-box-orient: vertical;
     overflow: hidden;
     text-overflow: ellipsis;
     max-height: calc(1.5em * 3); 
     white-space: pre-line; 
  }
  
  .post-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
  border-top: 1px solid #eee;
  margin-top: 12px;
  flex-wrap: nowrap; /* 关键修改 */
}
  
  .hot-topics {
    margin-bottom: 20px;
  }
  
  .hot-tag {
    margin: 5px;
  }
  
  .reply-to {
  color: #409eff;
  margin-left: 10px;
  font-size: 12px;
}

.comment-card {
  margin-bottom: 16px;
  transition: all 0.3s;
  position: relative;
}

.comment-card::before {
  content: "";
  position: absolute;
  left: -20px;
  top: 0;
  height: 100%;
  border-left: 2px solid #eee;
}
.view-count {
  white-space: nowrap; /* 防止数字换行 */
  display: flex;
  align-items: center;
  gap: 4px;
}
.view-icon {
  width: 30px;
  height: 30px;
  font-size: 16px;
  margin-right:0px;
  color: #909399;
  vertical-align: middle;
}
.pagination-container {
  /* position: sticky; */
  bottom: 0;
  background: transparent;
  z-index: 1000;
  padding: 8px 0;
  border: none;
}
.main-reply {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.main-reply-form {
  margin-top: 10px;
}
  .comment-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .comment-header .el-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
}
.comment-actions {
    margin-top: 10px;
   display: flex;   
   align-items: center; 
   justify-content: flex-end;
   gap: 10px; 
}

.comment-actions .el-button {
    white-space: nowrap;
    border: none !important;
    font-size: 12px;
}
  .comment-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 12px;
    flex-wrap: wrap; 
  }
  
  .reply-form {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  position: relative;
}

.reply-form::before {
  content: "";
  position: absolute;
  left: -30px;
  top: 20px;
  width: 20px;
  height: 2px;
  background: #eee;
}
  
  .form-actions {
    margin-top: 10px;
    display: flex;           
  justify-content: flex-end;
  align-items: center; 
  gap: 8px;  
  }
  
  .reply-btn {
    margin-top: 10px;
  }

  .hot-card {
  width: 330px;
  margin-left: 0px;
  position: static !important; 
  height: fit-content; 
  max-height: 105vh;
  overflow-y: auto;
}
.hot-card2 {
  width:auto; 
  margin:10px 20px; 
  position: static !important; 
  height: fit-content; 
  max-height: 105vh;
  overflow-y: auto;
}
.hot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hot-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.hot-index {
  display: flex;
  align-items: center;
}

.hot-content {
  flex: 1;
}
.hot-posts.desktop-sidebar {
    width: 300px;
    flex-shrink: 0; 
    position: static !important;
    margin-left: 0;
}
.hot-posts.desktop-sidebar .hot-card {
    margin-left: 0; 
}
.author-actions {
   margin-left: auto;
   display: flex;
   gap: 8px; 
}

.author-actions .el-button {
  white-space: nowrap; 
  border: none !important;
  font-size: 16px;
}

.hot-title {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hot-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15x;
}

.el-pagination {
  margin-top: auto;
  padding: 16px 0;
  background: transparent;
  position: sticky;
  bottom: 15px;
  z-index: 100;
}

.post-list-content-wrapper {
    flex-grow: 1; /* Allow content area to grow */
    display: flex;
    flex-direction: column;
    min-height: 0; /* Important for flex-grow with potential overflow */
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: #666;
  font-size: 14px;
}

.loading-state .el-icon {
  margin-bottom: 10px;
  color: var(--el-color-primary); 
}

.full-width-alert {
    margin: 20px 0; 
}
.el-dialog__footer {
    display: flex !important;            
    justify-content: space-between !important; 
    padding: 10px !important;           
  }

  /* 按钮样式 */
  .el-dialog__footer .el-button {
    flex: 1;                           
    margin: 2px 4px !important;        
    padding: 10px 12px;               
  }
@media (max-width: 768px) {
  /* 小屏幕（如手机） */
  .forum-page {
    padding: 12px;
  }

  /* 顶部导航 */
  .el-menu {
    overflow-x: auto;
    padding: 0 8px;
  }

  .el-menu-item {
    font-size: 14px;
    padding: 0 10px;
    white-space: nowrap;
  }

  /* 搜索栏和控件 */
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .controls {
    width: 100%;
    flex-wrap: wrap;
    gap: 10px;
  }

  .main-content {
    flex-direction: column;
    gap: 15px;
  }

  /* 搜索框区域优化 */
  .search-box {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .sort-controls {
    flex-direction: row !important;
    flex-wrap: nowrap;
    gap: 5px;
    width: 100%;
  }

  .author-actions .el-button {
        padding: 5px; 
    }

  .el-select {
    width: 100% !important;
    margin-right: 0 ;
  }

  .el-radio-group {
    width: 10%;
  }

  .el-button {
    width: 100%;
    margin-top: 5px;
  }
  .comment-actions {
    margin-top: 5px;
    gap: 0px;
    justify-content: flex-end;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 15x;
}

.comment-actions .el-button {
    white-space: nowrap;
    border: none !important;
    font-size: 10px;
}
  /* 帖子列表 */
  .post-card .post-content {
        font-size: 13px !important;
        color: #555 !important; 
        margin: 6px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        max-height: calc(1.4em * 2); 
    }
  .post-header {
    align-items: flex-start;
    gap: 5px;
  }

  .el-avatar {
    --el-avatar-size: 30px !important;
  }
  .post-title {
    font-size: 15px !important;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .author-info {
    font-size: 11px !important;
    gap: 6px;
    flex-wrap: wrap;
  }

  .el-dialog .post-content { 
        display: block !important; 
        -webkit-line-clamp: unset !important;
        max-height: none !important;
        overflow: visible !important; 
        white-space: pre-line; 
    }
    .el-dialog .comment-content {
         white-space: pre-line;
    }
  .post-actions {
    border: none;
    padding: 6px 0 0;
    font-size: 12px;
  }
  /* 分页 */
  .el-pagination {
    padding: 8px 0;
    position: sticky;
    z-index: 1;
    bottom: 0;
    left: 0;
    right: 0;
    background: transparent;
    border:none;
  }

  .el-dialog {
    width: 100% !important;
    margin: 0 !important;
    max-width: 100%;
    border-radius: 10px;
  }
  .pagination-container {
    padding: 8px 5px;
    border: none;
  }
  
  .form-actions .el-button {
        width: auto;      
        flex-grow: 0;     
        margin-top: 0;    
        padding: 6px 12px;
    }

  :deep(.el-pagination__total) {
    display: none;
  }
  :deep(.btn-prev),
  :deep(.btn-next),
  :deep(.el-pager li) {
    min-width: 28px !important;
    height: 28px;
    margin: 0 2px;
  }

  :deep(.el-pager li:not(.is-active)) {
    display: none; /* 隐藏非当前页码 */
  }
  :deep(.el-dialog__footer) { /* Use :deep() */
      display: flex !important;
      justify-content: space-between !important;
      padding: 10px !important;
    }

    :deep(.el-dialog__footer .el-button) { /* Use :deep() */
      flex: 1;
      margin: 2px 4px !important;
      padding: 10px 12px;
    }
  .el-dialog__header {
    padding: 12px 16px;
  }
  .el-dialog__body {
    padding: 15px 8px !important; /* 左右减少内边距 */
  }

  .el-form-item {
    margin-right: 0 !important;
    margin-left: 0 !important;
    padding: 0 8px; /* 保留最小安全边距 */
  }

  /* 输入框字号优化 */
  .el-input,
  .el-textarea {
    font-size: 14px !important;
  }

  .el-timeline {
    padding-left: 6px;
  }

  /* 时间线项目靠左对齐 */
  .el-timeline-item {
    padding-left: 0;
    text-align: left;
  }

  /* 时间戳位置调整 */
  .el-timeline-item__timestamp {
    left: 0;
    text-align: left;
  }

  .comment-time {
    white-space: normal;
    word-wrap: break-word;
    max-width: 100%;
    font-size: 10px;
  }

  /* 评论信息容器调整 */
  .comment-info {
    flex-wrap: wrap;
    gap: 4px;
  }

  /* 详情弹窗 */
  .el-dialog {
    width: 90%;
  }
  .hot-posts {
    order: 0;
    margin-bottom: 2px;
    padding: 2px 8px;
  }

  .hot-card {
    padding: 3px; /* 减少卡片内边距 */
    border-radius: 8px; /* 保持卡片圆角 */
  }
  .hot-list {
    gap: 0 !important; /* 完全消除列表项间距 */
    margin: 2px 0; /* 反向补偿可能的外边距 */
  }

  .hot-item {
    padding: 1px !important; /* 清除所有内边距 */
    margin: 0 !important;  /* 清除所有外边距 */
    min-height: auto !important; /* 取消固定高度 */
  }

   /* 序号标签 */
   .hot-index .el-tag {
    margin: 0 5px 0 0 !important;
    transform: scale(0.85) translateY(1px); /* 双重尺寸压缩 */
    border-radius: 3px !important;
  }
  .hot-content {
    padding: 2px 0; /* 仅保留必要内边距 */
  }
  /* 压缩标题行高 */
  .hot-title {
    line-height: 1.4 !important;  /* 最小行高 */
    font-size: 13px !important;
    margin: 0 2px; /* 反向补偿可能缩进 */
    padding: 2px 0; /* 最小内边距 */
    letter-spacing: 0.2px; /* 略微紧缩字符间距 */
  }
  .hot-header {
    padding: 0 0 8px; /* 仅底部留间距 */
  }
  .hot-index {
    margin-top: 0px;
  }
  .hot-posts.desktop-sidebar {
        display: none;
    }

    .mobile-hot-posts-container { 
      padding: 0 5px;
      margin-bottom: 15px; 
    }
    .hot-list.mobile-list {
      gap: 10px;
    }
    .hot-item.mobile-item {
      padding: 10px 8px;
      border: 1px solid #eee;
      background-color: #fff;
      transform: none !important;
      flex-direction: row;
      align-items: center;
    }
    .hot-item.mobile-item:hover {
      background-color: #f9f9f9;
    }
    .hot-title.mobile-title {
      font-size: 14px !important;
      -webkit-line-clamp: 3;
       white-space: normal;
       margin-bottom: 6px;
    }
    .hot-stats.mobile-stats {
       display: flex !important; 
       gap: 15px;
       font-size: 11px;
       margin-top: 4px;
     }

  .el-menu {
    padding: 0 8px;
  }

  .el-menu-item {
    font-size: 14px;
    padding: 0 10px;
  }

  /* 搜索框区域 */
  .search-box {
    gap: 8px;
  }

  .sort-controls {
    flex-direction: column;
  }

  .el-select,
  .el-radio-group {
    width: 100%;
  }
  .hot-stats {
    display: none; /* 隐藏浏览量和评论数 */
  }
  .post-list {
    width: 100%;
    max-height: calc(100vh - 100px); /* 移动端调整 */
  }
  .post-list-container {
    width: 100%; /* 确保帖子列表内容区域占满容器 */
  }

  
  :deep(.btn-prev),
  :deep(.btn-next) {
    min-width: 28px !important;
  }
  
  :deep(.el-pager li) {
    min-width: 28px !important;
  }
}

  </style>