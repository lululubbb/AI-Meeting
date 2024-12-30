<!-- src/views/HistoryMeeting.vue -->
<!-- 先当成历史会议，在考虑如果将其做成头部组件“会议”页面最中间的组件，然后点击“历史会议”按钮只弹出中间组件部分 -->
<!-- 因为头部组件“会议”页面最中间的组包括已结束、正在和未开始的所有会议 -->
<!-- 都是读取meetings数据库中的会议数据，如果后续加了日程就可以得到未开始的会议数据 -->
<!-- 然后再根据会议状态对于不同状态的会议给予不同颜色的标注吧 -->
<template>
  <div class="history-container">
    <h2>会议历史记录</h2>
<!-- 关闭按钮 -->
<div v-if="route.name === 'HistoryMeeting'" class="close-btn-wrapper">      
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
      <li v-for="meeting in filteredMeetings" :key="meeting.id"
      :class="{
      'ongoing': meeting.status === 'ongoing',
      'finished': meeting.status === 'finished',
      'not-started': meeting.status !== 'finished' && meeting.status !== 'ongoing'
    }"
    @click="showMeetingDetails(meeting)"
    >
        <!-- 这里存在的问题就是创建时间是按照插入数据库的时间算的，如果是日程安排的话怎么处理 -->
        <strong>会议名称: </strong> {{ meeting.meetingName }} <br />
        <strong>创建人员: </strong> {{ meeting.host}} <br />
        <strong>创建时间: </strong> {{ formatDate(meeting.createdAt) }} <br />
        <strong>会议状态: </strong> {{ meeting.status }}<br />
        <strong>结束时间: </strong> {{ meeting.endedAt ? formatDate(meeting.endedAt) : '正在进行中' }}
      </li>
    </ul>

     <!-- 会议详情 -->
     <div v-if="showModal" class="meeting-detail-modal">
      <div id="meetingDetails">
        <span class="closeBtn" @click="closeModal">×</span>
        <h3>会议详情</h3>
        <p><strong>会议名称:</strong> {{ selectedMeeting.meetingName }}</p>
        <p><strong>会议号:</strong> {{ selectedMeeting.meetingId }}</p>
        <p><strong>发起人:</strong> {{ selectedMeeting.host }}</p>
        <p><strong>开始时间:</strong> {{ formatDate(selectedMeeting.createdAt) }}</p>
        <p><strong>结束时间:</strong> {{ selectedMeeting.endedAt ? formatDate(selectedMeeting.endedAt) : '正在进行中' }}</p>
        <div class="meeting-actions">
        <p><strong>参会人员:</strong></p>
        <button @click="downloadData" class="download-btn">
          <img src="@/assets/download.png" alt="Download" />
        </button>
        </div>
        <div class="meeting-actions">
        <p><strong>参会度:</strong></p>
        <button @click="downloadData" class="download-btn">
          <img src="@/assets/download.png" alt="Download" />
        </button>
      </div>
    <!-- 添加四个功能按钮 -->
    <div class="function-buttons">
      <button @click="showSection('record')">会议记录</button>
      <button @click="showSection('keywords')">关键提取</button>
      <button @click="showSection('sentiment')">情感分析&词云图</button>
      <button @click="showSection('statistics')">参会统计</button>
    </div>

    <!-- 动态切换显示内容 -->
    <div v-if="activeSection === 'record'" class="section-content">
      <!-- 会议记录的内容 -->
      <!-- 判断会议状态是否为已结束 -->
      <p v-if="selectedMeeting.status === 'finished'">
        会议记录内容...
      </p>
    </div>

    <div v-if="activeSection === 'keywords'" class="section-content">
      <!-- 关键提取的内容 -->
      <!-- 判断会议状态是否为已结束 -->
      <p v-if="selectedMeeting.status === 'finished'">
        关键提取内容...
      </p>
    </div>

    <div v-if="activeSection === 'sentiment'" class="section-content">
      <!-- 情感分析&词云图的内容 -->
      <!-- 判断会议状态是否为已结束 -->
      <p v-if="selectedMeeting.status === 'finished'">
        情感分析&词云图内容...
      </p>
    </div>

    <div v-if="activeSection === 'statistics'" class="section-content">
      <!-- 参会统计的内容 -->
      <!-- 判断会议状态是否为已结束 -->
      <p v-if="selectedMeeting.status === 'finished'">
        参会统计内容...
      </p>
    </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter,useRoute  } from 'vue-router'; // 引入 useRouter
import { ElMessage } from 'element-plus';

// 获取 Vuex store
const store = useStore();
const router = useRouter();
const route = useRoute ();
// 获取会议列表
const meetings = computed(() => store.getters.getMeetings);

// 搜索框的绑定数据
const searchQuery = ref('');
// 选中的会议详情
const selectedMeeting = ref(null);
const showModal = ref(false);
const activeSection = ref(''); // 用于控制显示哪个区域

// 创建一个 ref 来控制是否显示关闭按钮
const showCloseButton = ref(false);

// 监听 route.path 变化
watch(() => route.path, (newPath) => {
  // 如果当前路径是 /history，则显示关闭按钮，否则隐藏
  showCloseButton.value = newPath === '/history';
});


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

// 显示会议详情
const showMeetingDetails = (meeting) => {
  selectedMeeting.value = meeting;
  showModal.value = true;
};

// 关闭详情弹窗
const closeModal = () => {
  showModal.value = false;
  selectedMeeting.value = null;
};

// 下载数据
const downloadData = () => {
  if (selectedMeeting.value) {
    // 这里模拟一个下载数据的功能，实际中可以根据需要生成数据并下载
    const data = {
      meetingId: selectedMeeting.value.meetingId,
      participants: selectedMeeting.value.participants,
      participationRate: selectedMeeting.value.participationRate,
    };

    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedMeeting.value.meetingName}-data.json`;
    link.click();
  }
};

// 切换功能区域
const showSection = (section) => {
   // 确保只有在会议已结束时才允许切换到具体功能部分
  if (selectedMeeting.value && selectedMeeting.value.status === 'finished') {
    activeSection.value = section;
  } else {
    ElMessage.warning("请等会议结束后再进行查看");  
  }
};

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
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  
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
  padding: 5px;
  padding-left: 20px;
  margin-bottom: 10px;
  border-radius: 8px;
  border-width: 1.5px ;
  border-style: solid; 
  border-color: #d2d2d2; 
  transition: background-color 0.3s;
  color: #000000;
}
.history-container li.ongoing {
  background-color: #ddefff; 
  border-color: #bdd8ff;
  color: #000000;  
}

.history-container li.finished {
  background-color: #f9f9f9;  
  border-color: #c8c8c8; 
  color: #000000; 
}

.history-container li.not-started {
  background-color: #ffe7de; 
  border-color: #ffcabc;  
  color: #000000;  
}
.history-container li:hover {
  /* background-color: #eeeeee56; */
  border-color: #000000;  
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
  width: 90% 
} 
.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  margin-left: 10px;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  pointer-events: none; 
}
div h3{
  font-size: 26px; 
  font-weight: bold;
  margin: 0px;
  margin-top: 10px;
  margin-bottom: 20px;
}

.meeting-detail-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  padding-top: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
  width: 1000px;
  max-height: 80%;
  overflow-y: auto;
  border-radius: 10px;
  box-sizing: border-box;
}

#meetingDetails {
  padding: 10px;
  background-color: #ffffff;
  border-radius: 8px;
}

#meetingDetails p {
  margin: 8px 0; /* 设置每个<p>的间距 */
  font-size: 16px;
  color: #333; /* 设置字体颜色 */
  text-align: left; /* 左对齐 */
}

#meetingDetails strong {
  font-weight: bold;
  color: #333;
}

.meeting-actions {
  display: flex;
  justify-content:flex-start; 
  align-items: center; 
  margin-top: 16px; 
}

.meeting-actions p {
  margin: 0;
  font-size: 14px;
  color: #000000; 
}

.closeBtn {
  position: absolute;
  top: 5px;
  right: 15px;
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
}
.closeBtn:hover {
  color: red;
}
.download-btn {
  background-color: #ffffff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.download-btn img {
  width: 20px;
  height: 20px;
}

.download-btn:hover {
  background-color: #f1f1f1;
}

.function-buttons {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.function-buttons button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 15px;
}

.function-buttons button:hover {
  background-color: #ddd;
}

.section-content {
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.section-content p {
  color: #333;
  font-size: 16px;
  margin: 10px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
