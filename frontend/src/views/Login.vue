<!-- src/views/Login.vue -->
<template>
  <div class="login-wrapper">
    <!-- 登录和注册区域 -->
    <div class="login-section">
      <h1>慧议先锋</h1>
      <h2>Artificial➕meeting!</h2>
      <p>欢迎回来！请登录您的账号</p>
      <div class="email-section">
        <label for="email">邮箱地址</label>
        <input v-model="email" type="email" id="email" placeholder="请输入您的邮箱地址" />
        <label for="password"> 密码 </label>
        <div class="password-container">
          <input :type="showPassword ? 'text' : 'password'" v-model="password"  class="password-input" placeholder="请输入您的密码" />
          <img :src="showPassword ? showIcon : hideIcon" alt="toggle" @click="toggleShow" class="hide" />
        </div>

        <div class="button-section">
          <button @click="toggleMode" class="toggle-btn"> 
            {{ isLoginMode ? "没有账号？注册" : "已有账号？登录" }}
          </button>
          <button @click="handleAuth" class="login-btn"> 
            {{ isLoginMode ? "邮箱登录": "邮箱注册"}}
          </button>
        </div>
        <div class="social-login">
          <!-- <p class="oruse">或者使用</p> -->
          <button @click="loginWithGoogle">
            <img src="@/assets/Google.png" alt="Google" />Google
          </button>
        </div>
      </div>
    </div>
    <!-- 介绍区域 -->
    <div class="intro-section">
      <img src="@/assets/intro.png" alt="meeting" />
    </div>
  </div>
</template>



<script>
import { ref } from 'vue';
import showIcon from '@/assets/show.png';
import hideIcon from '@/assets/hide.png';
import AuthService from '../services/AuthService.js';
import { useRouter } from 'vue-router';
export default {
  name: 'Login',
  components: {},
  setup() {
    const email = ref('');
    const password = ref('');
    const isLoginMode = ref(true);
    const showPassword = ref(false);
    const router = useRouter();

    const toggleMode = () => {
      isLoginMode.value = !isLoginMode.value;
    };

    const toggleShow = () => {
      showPassword.value = !showPassword.value;
    };

    // const handleAuth = async () => {
    //   if (!email.value.trim() || !password.value.trim()) {
    //     alert("邮箱或密码不能为空");
    //     return;
    //   }
    //   if (isLoginMode.value) {
    //     const res = await AuthService.signInWithEmailAndPassword(email.value, password.value);
    //     if (res) this.$router.push('/home');
    //   } else {
    //     const res = await AuthService.registerWithEmailAndPassword(email.value, password.value);
    //     if (res) this.$router.push('/home');
    //   }
    // };

    const handleAuth = async () => {
      // console.log("router:", router);  // 调试 router 是否存在
      if (email.value.trim() === '' || password.value.trim() === '') {
        alert("邮箱或密码不能为空");
        return;
      }
      let res;
      if (isLoginMode.value) {
        console.log("尝试登录:", email.value);
        res = await AuthService.signInWithEmailAndPassword(email.value, password.value);
      } else {
        console.log("尝试注册:", email.value);
        res = await AuthService.registerWithEmailAndPassword(email.value, password.value);
      }

      if (res) {
        console.log(isLoginMode.value ? "登录成功" : "注册成功");
        router.push('/home');  // 跳转到 /home 页面
      }
    };

    const loginWithGoogle = async () => {
      const res = await AuthService.signInWithGoogle();
      if (res){
        console.log("google登录成功" );
        router.push('/home');  // 跳转到 /home 页面router.push('/home');
      }
    };

    return {
      email,
      password,
      isLoginMode,
      showPassword,
      showIcon,
      hideIcon,
      router,
      toggleMode,
      toggleShow,
      handleAuth,
      loginWithGoogle,
    };
  },
};
</script>

<style scoped>
.toggle-btn {
  padding: 10px;
  margin-bottom: 15px;
  background-color: transparent;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  text-decoration: underline;
  font-size: 16px;
}
.toggle-btn:hover {
  color: #1669c1;
}

.login-wrapper {
  display: flex;
  height: 100vh;
  background: linear-gradient(to bottom right, #f8f7fa, #c8dbff);
  
}
.login-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  margin: 40px;
  border-radius: 20px;
  background: linear-gradient(to bottom right, #f6f6f6c0, #b9d1ff);

}
.intro-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  margin-top: 40px;
  margin-bottom: 40px;
  margin-right: 40px;
  border-color: #acc3fc;
  border-style: solid; 
}
.intro-section img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 20px;
}
h1 {
  font-size: 28px;
  color: #3867ff;
}
h2 {
  font-size: 24px;
  color: #3867ff;
}
p {
  margin-bottom: 22px;
  color: #747474;
  font-size: 18px;
}
.email-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  color: #5b5b5c;
  margin-bottom: 22px;
}
.email-section label {
  margin-bottom: 5px;
}
.email-section input {
  padding: 12px;
  margin-bottom: 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
}
.password-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.password-input {
  width: 100%; 
  padding-right: 40px; 
  height: 40px;
  box-sizing: border-box; 
}

.hide {
  position: absolute;
  top: 40%; 
  right: 10px; 
  transform: translateY(-50%); 
  cursor: pointer;
  width: 25px;
  height: 25px; 
}

.button-section {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.login-btn
{
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.login-btn {
  background-color: #002affd3;
  color: white;
}

.oruse{
  margin-bottom: 22px;
  color: #747474;
  font-size: 16px;
}
.social-login {
display: flex;
flex-direction: row;
align-items: center;
margin-top: 10px;
justify-content: center;
}
.social-login p {
margin-bottom: 10px;
height: 35px;
}
.social-login button img{
  width: 25px;
  height: 25px;
  object-fit: contain;
  margin-right: 10px;
}
.social-login button {
margin: auto; 
border-radius: 10px;
border-color:#c8dbff;
cursor: pointer;
color: #3867ff;
height: 35px;
display: flex;
align-items: center;
background-color: transparent;
font-size: 16px;
padding-top: 5px;
padding-bottom: 5px;
}
.social-login button:hover {
color: #0845fe;
}
</style>
