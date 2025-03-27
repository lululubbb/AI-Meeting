<template>
    <div class="forum-page">
      <!-- 顶部导航 -->
      <el-menu mode="horizontal" :default-active="activeTopic" @select="handleTopicSelect">
        <el-menu-item v-for="topic in topics" :key="topic.id" :index="topic.id">
          {{ topic.name }}
        </el-menu-item>
      </el-menu>
  
      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧帖子列表 -->
        <div class="post-list">
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
          <div class="post-list-container">
            <el-empty 
            v-if="filteredPosts.length === 0" 
            description="没有相关帖子"
            style="margin-top: 20px;"
            />
            <div v-else>
        <el-card 
            v-for="post in filteredPosts" 
            :key="post.id" 
            class="post-card"
            @click="viewDetail(post)" 
            style="cursor: pointer;"
            >            
            <template #header>
              <div class="post-header">
                <el-avatar :size="35" :src="post.author.avatar" />
                <div class="post-info">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <div class="author-info">
                    <span class="author-name">{{ post.author.name }}</span>
                    <el-tag size="small">{{ post.author.role }}</el-tag>
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
                    {{  post.comments?.length || 0  }}
            </span>
            <div class="author-actions" v-if="isAuthor(post)">
            <el-tooltip content="编辑" placement="top">
                <el-button>
                    <el-icon><Edit /></el-icon>
                </el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
                <el-button>
                    <el-icon><Delete /></el-icon>
                </el-button>
            </el-tooltip>
            </div>
          </div>
          </el-card>
        </div>
        </div> 
          <el-pagination
            background
            layout="prev, pager, next"
            :total="totalPosts"
            :page-size="dynamicPageSize"
            :pager-count="isMobile ? 3 :4"
            @current-change="handlePageChange"
            class="pagination-container"
          />
        </div>
  
          <!-- 右侧热门帖子 -->
  <div class="hot-posts" v-if="!isMobile">
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
              <span class="author-name">{{ currentPost?.author.name }}</span>
              <el-tag size="mini">{{ currentPost?.author.role }}</el-tag>
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
          <el-card class="comment-card" :style="{ marginLeft: comment.depth * 40 + 'px' }">
          <div class="comment-header">
            <el-avatar :size="30" :src="comment.author.avatar" />
            <div class="comment-info">
              <span class="author-name">{{ comment.author.name }}</span>
              <el-tag size="mini">{{ comment.author.role }}</el-tag>
              <span class="comment-time">{{ formatTime(comment.time) }}</span>
              <span v-if="comment.replyTo" class="reply-to">
                回复 @{{ comment.replyTo.name }}
              </span>
            </div>
          </div>
          <div class="comment-content">
            {{ comment.content }}
          </div>
          <div class="comment-actions">
            <el-button
              size="small"
              class="reply-btn"
              @click="showReplyForm(comment)"
            >
              回复
            </el-button>
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
         <div v-else>加载中...</div> <!-- Optional: loading state -->
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">保存修改</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed,onUnmounted,onBeforeUnmount ,onMounted,watch } from 'vue'
  import { ElNotification, ElMessageBox } from 'element-plus'
  import dayjs from 'dayjs'
import { Search,ArrowUp, ArrowDown, View ,HotWater, ChatLineRound,Plus,Delete,Edit  } from '@element-plus/icons-vue'
const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)


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
  
  const posts = ref([
    {
      id: 1,
      topicId: 1,
      title: '关于网络安全人才培养的讨论',
      content: '当前网络安全人才缺口较大，如何建立有效的人才培养体系？',
      author: {
        id: 1,
        name: '王小明',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
        role: '专家'
      },
      createTime: '2023-07-20 09:00',
      viewCount: 0, 
      comments: [
        {
          id: 1,
          author: {
            id: 2,
            name: '李华',
            avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
            role: '参会者'
          },
          content: '非常赞同这个观点',
          time: '2023-07-20 10:30'
        }
      ]
    },
     // 新品发布
  {
    id: 2,
    topicId: 2, 
    title: '恒脑2.0技术解析',
    content: '新一代安全大脑的核心技术突破...',
    author: {
        id: 1,
        name: '王小明',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
        role: '专家'
      },
      createTime: '2023-07-20 09:00',
      viewCount: 0, 
      comments: [
        {
          id: 1,
          author: {
            id: 2,
            name: '李华',
            avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
            role: '参会者'
          },
          content: '非常赞同这个观点',
          time: '2023-07-20 10:30'
        }
      ]
  },

  // 平行会议
  {
    id: 3,
    topicId: 3,
    title: '教育系统数据安全实践',
    content: '浙江大学分享数智安全治理经验...',
    author: {
        id: 1,
        name: '王小明',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
        role: '专家'
      },
      createTime: '2023-07-20 09:00',
      viewCount: 0, 
      comments: [
        {
          id: 1,
          author: {
            id: 2,
            name: '李华',
            avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
            role: '参会者'
          },
          content: '非常赞同这个观点',
          time: '2023-07-20 10:30'
        }
      ]
  },

  // 数据安全
  {
    id: 4,
    topicId: 5,
    title: '数据跨境流动安全方案',
    content: '探讨企业出海数据合规实践...',
    author: {
        id: 1,
        name: '王小明',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
        role: '专家'
      },
      createTime: '2023-07-20 09:00',
      viewCount: 0, 
      comments: []
  }
  ])
  
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
  const searchKeyword = ref('')
  const showMainReply = ref(false)
const mainReplyContent = ref('')


const dynamicPageSize = computed(() => isMobile.value ? 3 :4)

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
}

watch(activeTopic, () => {
  currentPage.value = 1
})
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

const currentUser = ref({
    id: 100, // Assuming ID 100 is the logged-in user
    name: '当前用户',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
    role: '用户'
});

const editDialogVisible = ref(false);
const editingPost = ref(null); // To store the post data being edited

// Function to show the edit dialog
const showEditDialog = (post) => {
    // Create a deep copy to avoid modifying the original post directly in the form
    editingPost.value = JSON.parse(JSON.stringify(post));
    editDialogVisible.value = true;
};

// Function to submit the edited post
const submitEdit = () => {
    if (!editingPost.value || !editingPost.value.title || !editingPost.value.content) {
         ElNotification({
            title: '错误',
            message: '标题和内容不能为空',
            type: 'error',
            position: 'bottom-right'
        });
        return;
    }

    const index = posts.value.findIndex(p => p.id === editingPost.value.id);
    if (index !== -1) {
        // Update the original post in the array
        posts.value[index] = { ...posts.value[index], ...editingPost.value }; // Basic merge, adjust if needed
         ElNotification({
            title: '成功',
            message: '帖子修改成功',
            type: 'success',
            position: 'bottom-right',
            duration: 2000
        });
    } else {
         ElNotification({
            title: '错误',
            message: '未找到要修改的帖子',
            type: 'error',
            position: 'bottom-right'
        });
    }
    editDialogVisible.value = false;
    editingPost.value = null; // Clear the editing state
};

// Function to handle post deletion
const handleDeletePost = (postId) => {
    ElMessageBox.confirm(
        '确定要删除这篇帖子吗？此操作无法撤销。',
        '确认删除',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
    .then(() => {
        // Filter out the post to be deleted
        posts.value = posts.value.filter(p => p.id !== postId);
        ElNotification({
            title: '成功',
            message: '帖子已删除',
            type: 'success',
            position: 'bottom-right',
            duration: 2000
        });
         // If the deleted post was being viewed in detail, close the detail dialog
        if (currentPost.value && currentPost.value.id === postId) {
            detailDialogVisible.value = false;
            currentPost.value = null;
        }

    })
    .catch(() => {
        // User clicked cancel or closed the dialog
        ElNotification({
            type: 'info',
            message: '删除已取消',
            position: 'bottom-right',
            duration: 1500
        });
    });
};

const isAuthor = (post) => {
    // Ensure both post and post.author exist before comparing
    return post && post.author && post.author.id === currentUser.value.id;
};

onMounted(() => {
const container = document.querySelector('.post-list')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
  window.addEventListener('resize', updateScreenWidth)
  window.addEventListener('scroll', handleScroll)
})
const sortType = ref('time') // 默认按时间排序
const sortOrder = ref('desc') // 默认降序
const handleTopicSelect = (selectedTopicId) => {
  activeTopic.value = parseInt(selectedTopicId); // 将字符串转换为数字
  currentPage.value = 1; // 切换主题时重置页码
};
const filteredPosts = computed(() => {
  console.log('当前主题ID:', activeTopic.value);
  const filtered = posts.value
    .filter(p => p.topicId === activeTopic.value)
    .filter(post => {
      const keyword = searchKeyword.value.toLowerCase()
      return (
        post.title.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword) ||
        post.author.name.toLowerCase().includes(keyword)
      )
    })
    .sort((a, b) => {
      let compareResult = 0
      if (sortType.value === 'time') {
        compareResult = Date.parse(a.createTime) - Date.parse(b.createTime)
      } else if (sortType.value === 'comments') {
        const aCount = a.comments?.length || 0
        const bCount = b.comments?.length || 0
        compareResult = aCount - bCount
      }
      return sortOrder.value === 'desc' ? -compareResult : compareResult
    })
  
  console.log('过滤后的帖子数:', filtered.length);
  
  // 修改分页切片使用动态分页大小
  return filtered.slice(
    (currentPage.value - 1) * dynamicPageSize.value,
    currentPage.value * dynamicPageSize.value
  )
})

const currentTopic = computed(() => 
  topics.value.find(t => t.id === activeTopic.value)
)

const totalPosts = computed(() => {
  const count = posts.value.filter(p => p.topicId === activeTopic.value).length
  console.log('总帖子数:', count);
  return count
})
  

  // 方法
  const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
  
  const showCreateDialog = () => {
    createDialogVisible.value = true
  }
  
  const submitPost = () => {
    if (!newPost.value.title || !newPost.value.content) {
        ElNotification({
      title: '错误',
      message: '请填写完整信息',
      type: 'error',
      position: 'bottom-right'
    })      
    return
    }
    
    posts.value.unshift({
      ...newPost.value,
      id: Date.now(),
      author: {
        id: currentUser.value.id,
        name: currentUser.value.name,
        avatar: currentUser.value.avatar,
        role: currentUser.value.role
      },
      createTime: new Date().toISOString(),
      viewCount: 0, 
      comments: []
    })
    
    createDialogVisible.value = false
    ElNotification({
    title: '成功',
    message: '发帖成功',
    type: 'success',
    position: 'bottom-right',
    duration: 2000
  })    
  newPost.value = { title: '', content: '', topicId: activeTopic.value }
  }
  
  
  const showReplyForm = (currentComment) => {
  activeReply.value = currentComment.id
  // 存储当前父级评论
  currentParentComment.value = currentComment
}
  
  const cancelReply = () => {
    activeReply.value = null
    replyContent.value = ''
  }
  
 const showMainReplyForm = () => {
 showMainReply.value = true
}

const cancelMainReply = () => {
  showMainReply.value = false
  mainReplyContent.value = ''
}

  const submitReply = (comment) => {
  if (!replyContent.value) {
    ElNotification({
      title: '错误',
      message: '请输入回复内容',
      type: 'error',
      position: 'bottom-right'
    })
    return
  }

  // 创建新回复对象
  const newReply = {
    id: Date.now(),
    author: {
      id: 100,
      name: '当前用户',
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
      role: '用户'
    },
    content: replyContent.value,
    time: new Date().toISOString(),
    replyTo: currentParentComment.value.author,
    depth: currentParentComment.value.depth + 1,
    parentId: currentParentComment.value.id
  }

  currentPost.value.comments.push(newReply)
  resetReplyForm()
}

// 新增状态管理
const currentParentComment = ref(null)

// 重置表单方法
const resetReplyForm = () => {
  replyContent.value = ''
  activeReply.value = null
  currentParentComment.value = null
}

const submitMainReply = () => {
  if (!mainReplyContent.value) {
    ElNotification({
      title: '错误',
      message: '请输入回复内容',
      type: 'error',
      position: 'bottom-right'
    })
    return
  }

  const newReply = {
    id: Date.now(),
    author: {
      id: 100,
      name: '当前用户',
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beaf643a5d4ac49ca7e83c3dfpng.png',
      role: '用户'
    },
    content: mainReplyContent.value,
    time: new Date().toISOString(),
    depth: 0,
    replyTo: currentPost.value.author 
  }

  currentPost.value.comments.push(newReply)
  mainReplyContent.value = ''
  showMainReply.value = false
  ElNotification({
    title: '成功',
    message: '回复成功',
    type: 'success',
    position: 'bottom-right',
    duration: 2000
  })
}

const viewDetail = (post) => {
  // 找到原始数据中的帖子对象
  const originalPost = posts.value.find(p => p.id === post.id)
  if (originalPost) {
    originalPost.viewCount = (originalPost.viewCount || 0) + 1
  }
  currentPost.value = originalPost || post
  detailDialogVisible.value = true
}

const hotPosts = computed(() => {
  return posts.value
    .map(post => ({
      ...post,
      // 热度计算规则：评论数*2 + 浏览量
      hotScore: (post.comments?.length || 0) * 2 + (post.viewCount || 0)
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 10)
})





onBeforeUnmount(() => {
  // 清理可能的异步操作
  const container = document.querySelector('.post-list-container')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
  currentPost.value = null
  activeReply.value = null
  window.removeEventListener('resize', updateScreenWidth)
})

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
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

  .post-card {
  transition: all 0.3s;
  margin-bottom: 15px;
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
    color: #333;
    line-height: 1.6;
    margin-bottom: 5px;
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
  position: sticky;
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
  border-top: 1px solid #eee;
  padding-top: 10px;
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
    text-align: right;
  }
  
  .reply-btn {
    margin-top: 10px;
  }

  .hot-card {
    width: 280px; /* 固定侧边栏宽度 */
  margin-left: 20px; /* 增加间距 */
  position: static !important; /* 移除sticky定位 */
  height: fit-content; /* 高度自适应 */
  max-height: 80vh; /* 防止过高 */
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
}

.el-pagination {
  margin-top: auto; /* 使分页始终保持在底部 */
  padding: 16px 0;
  background: transparent;
  position: sticky;
  bottom: 0;
  z-index: 100;
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

  /* 帖子列表 */
  .post-card {
    margin: 0 -12px 8px;
    border-radius: 0;
    border: none;
    box-shadow: none;
    border-bottom: 1px solid #eee;
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

  .post-content {
    font-size: 13px !important;
    line-height: 1.4;
    color: #444 !important;
    margin: 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-actions {
    border-top: none;
    padding: 6px 0 0;
    font-size: 12px;
  }
  /* 分页 */
  .el-pagination {
    padding: 8px 0;
    position: fixed;
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
  /* 按钮容器修正 */
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
    margin-bottom: 1px;
    padding: 0 8px;
  }

  .hot-card {
    padding: 5px; /* 减少卡片内边距 */
    border-radius: 8px; /* 保持卡片圆角 */
  }
  .hot-list {
    gap: 0 !important; /* 完全消除列表项间距 */
    margin: -2px 0; /* 反向补偿可能的外边距 */
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
    transform: translateY(-1px); /* 微调垂直对齐 */
  }
  /* 压缩标题行高 */
  .hot-title {
    line-height: 1.1 !important;  /* 最小行高 */
    font-size: 13px !important;
    margin: 0 -2px; /* 反向补偿可能缩进 */
    padding: 1px 0; /* 最小内边距 */
    letter-spacing: -0.2px; /* 略微紧缩字符间距 */
  }
  .hot-header {
    padding: 0 0 8px; /* 仅底部留间距 */
  }
  .hot-index {
    margin-top: 0px;
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
    max-height: calc(100vh - 100px); /* 移动端调整 */
  }
  
  .el-pagination {
    position: sticky;
    bottom: 0;
    background: white;
    z-index: 1;
    padding: 8px 0;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
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