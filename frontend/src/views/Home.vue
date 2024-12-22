<!-- src/views/Home.vue -->
<template>
  <div class="home-container">
    <header>
      <h1>Meet & Chat</h1>
      <button @click="logout" class="logout-btn">登出</button>
    </header>
    <main>
      <div class="meeting-buttons">
        <CustomButton text="创建会议" :onPressed="navigateToCreateMeeting" />
        <CustomButton text="加入会议" :onPressed="navigateToJoinMeeting" />
      </div>
    </main>
    <footer>
      <nav>
        <router-link to="/home">主页</router-link>
        <router-link to="/history">会议历史</router-link>
      </nav>
    </footer>
  </div>
</template>

<script>
import CustomButton from '../components/CustomButton.vue'

export default {
  name: 'Home',
  components: {
    CustomButton
  },
  methods: {
    // 导航到创建会议
    navigateToCreateMeeting() {
      this.$router.push({ 
        name: 'VideoCall', 
        query: { mode: 'create' }
      })
    },
    // 导航到加入会议
    navigateToJoinMeeting() {
      this.$router.push({ 
        name: 'VideoCall', 
        query: { mode: 'join' }
      })
    },
    // 用户登出
    async logout() {
      await this.$store.dispatch('signOutUser')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #1a1a1a;
  border-bottom: 2px solid #333;
}
.logout-btn {
  padding: 8px 16px;
  background-color: #ef4444;
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}
.logout-btn:hover {
  background-color: #dc2626;
}
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.meeting-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}
footer {
  background-color: #141414;
  padding: 10px;
  text-align: center;
}
footer nav a {
  margin: 0 10px;
  color: #1a73e8;
  text-decoration: none;
  font-weight: bold;
}
footer nav a:hover {
  text-decoration: underline;
}
</style>
