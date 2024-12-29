<!-- src/views/HistoryMeeting.vue -->
<!-- 先当成历史会议，在考虑如果将其做成头部组件“会议”页面最中间的组件，然后点击“历史会议”按钮只弹出中间组件部分 -->
<!-- 因为头部组件“会议”页面最中间的组包括已结束、正在和未开始的所有会议 -->
<!-- 都是读取meetings数据库中的会议数据，如果后续加了日程就可以得到未开始的会议数据 -->
<!-- 然后再根据会议状态对于不同状态的会议给予不同颜色的标注吧 -->
<template>
  <div class="history-container">
    <h2>会议历史记录</h2>
<!-- 关闭按钮 -->
<div class="close-btn-wrapper">
      <button @click="goHome" class="close-btn">
      <img src="@/assets/exit.png"  alt="exit"/>
      </button>
    </div>

  <!-- 搜索框 -->
  <div class="search-container">
      <div class="input-wrapper">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索会议相关信息"
          class="search-input"
        />
        <img
          src="@/assets/search.png"
          alt="Search"
          class="search-icon"
        />
      </div>
    </div>

    <div v-if="filteredMeetings.length === 0">
      <p>没有找到符合条件的会议记录</p>
    </div>

    <ul v-else>
      <li v-for="meeting in filteredMeetings" :key="meeting.id">
        <!-- 这里存在的问题就是创建时间是按照插入数据库的时间算的，如果是日程安排的话怎么处理 -->
        <strong>会议名称: </strong> {{ meeting.meetingName }} <br />
        <strong>创建人员: </strong> {{ meeting.host}} <br />
        <strong>创建时间: </strong> {{ formatDate(meeting.createdAt) }} <br />
        <strong>会议状态: </strong> {{ meeting.status }}<br />
        <strong>结束时间: </strong> {{ meeting.endedAt ? formatDate(meeting.endedAt) : '正在进行中' }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // 引入 useRouter

// 获取 Vuex store
const store = useStore();
const router = useRouter();
// 获取会议列表
const meetings = computed(() => store.getters.getMeetings);

// 搜索框的绑定数据
const searchQuery = ref('');

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// 获取会议数据
onMounted(() => {
  if (store.state.user) {
    store.dispatch('listenToMeetings');
  }
});
// 根据搜索条件过滤会议列表
const filteredMeetings = computed(() => {
  if (!searchQuery.value) return meetings.value;

  const query = searchQuery.value;
  return meetings.value.filter((meeting) => {
    const meetingNameMatch = meeting.meetingName && meeting.meetingName.includes(query);
    const statusMatch = meeting.status && meeting.status.includes(query);
    const createdAtMatch = meeting.createdAt && formatDate(meeting.createdAt).includes(query);
    const endedAtMatch = meeting.endedAt && formatDate(meeting.endedAt).includes(query);

    return meetingNameMatch || statusMatch || createdAtMatch || endedAtMatch;
  });
});

const goHome = () => {
  router.push({ name: 'Home' });
};

</script>

<style scoped>
.close-btn-wrapper {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
}
.close-btn img{
  width: 30px;
  height: 30px;
}
.close-btn:hover {
  background-color: #f0f0f0;
}
.history-container {
  padding: 20px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  
  /* 限制最大高度并启用垂直滚动条 */
  max-height: 100%;  
  overflow-y: auto;  
}

.history-container h2 {
  text-align: center;
  color: #000000;
  margin-bottom: 20px;
}
.history-container ul {
  list-style-type: none;
  padding: 0;

}
.history-container li {
  background-color: #ffffff;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  border-width: 2px ;
  border-style: solid; 
  border-color: #d2d2d2; 
  transition: background-color 0.3s;
  color: #000000;
}

.history-container li:hover {
  background-color: #eeeeee56;
}
.history-container strong {
  color: #000000;
}
.history-container p {
  color: #000000;
  text-align: center;
}
strong{
  margin-right: 5px;
}

/* 搜索框样式 */
.search-container {
  position: relative;
  margin-bottom: 20px;
}
.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border-radius: 25px;
  border-width: 2px;
  font-size: 16px;
  outline: none;
  border-color: #d7d7d7;

}

.search-input:focus {
  border-color: #b1b1b1;
}

.search-input::placeholder {
  color: #bbb;
  font-style: italic;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  width: 600px; 
} 
.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  margin-left: 10px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  pointer-events: none; /* 防止点击图标时输入框失效 */
}
</style>
