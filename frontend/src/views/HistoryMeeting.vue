<!-- src/views/HistoryMeeting.vue -->
<template>
  <div class="history-container">
    <h2>会议历史记录</h2>
    <div v-if="meetings.length === 0">
      <p>没有会议历史记录</p>
    </div>
    <ul v-else>
      <li v-for="meeting in meetings" :key="meeting.id">
        <strong>会议名称:</strong> {{ meeting.meetingName }} <br />
        <strong>创建时间:</strong> {{ formatDate(meeting.createdAt) }} <br />
        <strong>状态:</strong> {{ meeting.status }}<br />
        <strong>结束时间:</strong> {{ meeting.endedAt ? formatDate(meeting.endedAt) : '正在进行中' }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'HistoryMeeting',
  computed: {
    meetings() {
      return this.$store.getters.getMeetings
    }
  },
  methods: {
    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return ''
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate()
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }
  },
  created() {
    if (this.$store.state.user) {
      this.$store.dispatch('listenToMeetings')
    }
  }
}
</script>

<style scoped>
.history-container {
  padding: 20px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.history-container h2 {
  text-align: center;
  color: #ffffff;
  margin-bottom: 20px;
}
.history-container ul {
  list-style-type: none;
  padding: 0;
}
.history-container li {
  background-color: #2e2e2e;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  transition: background-color 0.3s;
}
.history-container li:hover {
  background-color: #3e3e3e;
}
.history-container strong {
  color: #22c55e;
}
.history-container p {
  color: #a0a0a0;
  text-align: center;
}
</style>
