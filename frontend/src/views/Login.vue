<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <h1>欢迎使用会议应用</h1>
    <div class="form-container">
      <input v-model="email" type="email" placeholder="邮箱" />
      <input v-model="password" type="password" placeholder="密码" />
      
      <button @click="toggleMode" class="toggle-btn">
        {{ isLoginMode ? "没有账号？注册" : "已有账号？登录" }}
      </button>
      
      <CustomButton :text="isLoginMode ? '邮箱登录' : '邮箱注册'" :onPressed="handleAuth" />
      <CustomButton text="Google 登录" :onPressed="loginWithGoogle" />
    </div>
  </div>
</template>

<script>
import CustomButton from '../components/CustomButton.vue'
import AuthService from '../services/AuthService.js'

export default {
  name: 'Login',
  components: {
    CustomButton
  },
  data() {
    return {
      email: '',
      password: '',
      isLoginMode: true
    }
  },
  methods: {
    // 切换登录和注册模式
    toggleMode() {
      this.isLoginMode = !this.isLoginMode
    },
    // 处理邮箱登录或注册
    async handleAuth() {
      if (this.email.trim() === '' || this.password.trim() === '') {
        alert("邮箱或密码不能为空")
        return
      }
      if (this.isLoginMode) {
        console.log("尝试登录:", this.email)
        const res = await AuthService.signInWithEmailAndPassword(this.email, this.password)
        if (res) {
          console.log("登录成功，导航到 /home")
          this.$router.push('/home')
        }
      } else {
        console.log("尝试注册:", this.email)
        const res = await AuthService.registerWithEmailAndPassword(this.email, this.password)
        if (res) {
          console.log("注册成功，导航到 /home")
          this.$router.push('/home')
        }
      }
    },
    // 处理 Google 登录
    async loginWithGoogle() {
      console.log("尝试通过 Google 登录")
      const res = await AuthService.signInWithGoogle()
      if (res) {
        console.log("Google 登录成功，导航到 /home")
        this.$router.push('/home')
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
  padding: 20px;
}
.form-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  background-color: #2e2e2e;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.form-container h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #ffffff;
}
.form-container input {
  padding: 12px;
  margin: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}
.form-container input::placeholder {
  color: #a0a0a0;
}
.toggle-btn {
  padding: 10px;
  margin-bottom: 15px;
  background-color: transparent;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;
}
.toggle-btn:hover {
  color: #1669c1;
}
</style>
