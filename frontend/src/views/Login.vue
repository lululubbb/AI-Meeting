<template>
  <div class="login-wrapper">
    <!-- 登录和注册区域 -->
    <div class="login-section">
      <h1 class="title">慧议先锋</h1>
      <h2 class="subtitle">AI Meeting</h2>
      <p class="welcome-text">欢迎回来！请登录您的账号</p>
      <div class="email-section">
        <label for="email" class="label">邮箱地址</label>
        <input v-model="email" type="email" id="email" placeholder="请输入您的邮箱地址" class="input" />
        <label for="password" class="label"> 密码 </label>
        <div class="password-container">
          <input :type="showPassword? 'text' : 'password'" v-model="password" class="password-input" placeholder="请输入您的密码" />
          <img :src="showPassword? showIcon : hideIcon" alt="toggle" @click="toggleShow" class="hide" />
        </div>

        <div class="button-section">
          <button @click="toggleMode" class="toggle-btn"> 
            {{ isLoginMode? "没有账号？注册" : "已有账号？登录" }}
          </button>
          <button @click="handleAuth" class="login-btn"> 
            {{ isLoginMode? "邮箱登录": "邮箱注册"}}
          </button>
        </div>
        <div class="social-login">
          <!-- <p class="oruse">或者使用</p> -->
          <button @click="loginWithGoogle" class="social-btn">
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
import { ElMessage } from 'element-plus';

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

    const handleAuth = async () => {
      // console.log("router:", router);  // 调试 router 是否存在
      if (email.value.trim() === '' || password.value.trim() === '') {
        ElMessage.error("邮箱或密码不能为空");  
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
        document.body.classList.add('light');
        ElMessage.success(isLoginMode.value? "登录成功" : "注册成功");        router.push('/home');  // 跳转到 /home 页面
      }else {
        ElMessage.error("操作失败，请重试");  // 显示失败信息
      }
    };

    const loginWithGoogle = async () => {
      const res = await AuthService.signInWithGoogle();
      if (res){
        ElMessage.success("Google 登录成功"); 
        document.body.classList.add('light');
        router.push('/home');  // 跳转到 /home 页面router.push('/home');
      }else {
        ElMessage.error("Google 登录失败");  // 显示失败信息
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
  padding: 40px;
  margin: 40px;
  border-radius: 20px;
  background: linear-gradient(to bottom right, #f6f6f6c0, #b9d1ff);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
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
.title {
  font-size: 36px;
  color: #3867ff;
  margin-bottom: 10px;
  text-align: center;
  font-weight: bold;
  letter-spacing: 1px;
}
.subtitle {
  font-size: 28px;
  color: #3867ff;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}
.welcome-text {
  margin-bottom: 30px;
  color: #747474;
  font-size: 20px;
  text-align: center;
  line-height: 1.4;
}
.email-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  color: #5b5b5c;
  margin-bottom: 30px;
}
.label {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 500;
}
.input {
  padding: 14px;
  margin-bottom: 20px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 16px;
  transition: border-color 0.3s ease;
}
.input:focus {
  outline: none;
  border-color: #3867ff;
  box-shadow: 0 0 5px rgba(56, 103, 255, 0.2);
}
.password-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.password-input {
  width: 100%; 
  padding-right: 40px; 
  height: 45px;
  box-sizing: border-box; 
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 16px;
  transition: border-color 0.3s ease;
}
.password-input:focus {
  outline: none;
  border-color: #3867ff;
  box-shadow: 0 0 5px rgba(56, 103, 255, 0.2);
}

.hide {
  position: absolute;
  top: 50%; 
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
  padding: 14px;
  margin-bottom: 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: 500;
  transition: background-color 0.3s ease;
  background-color: #4763ff;
  color: white;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); 

}

.login-btn:hover {
  background-color: #203ad1;
  transform: translateY(-5px); /* 点击时上移 */
}

.social-login {
display: flex;
flex-direction: row;
align-items: center;
margin-top: 10px;
justify-content: center;
}
.social-btn {
  margin: 0 5px;
  border-radius: 10px;
  border: 1px solid #c8dbff;
  cursor: pointer;
  color: #3867ff;
  height: 50px;
  display: flex;
  align-items: center;
  background-color: transparent;
  font-size: 20px;
  padding: 0 15px;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15); /* 点击时阴影减弱 */
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}
.social-btn img{
  width: 30px;
  height: 30px;
  object-fit: contain;
  margin-right: 10px;
}
.social-btn:hover {
  background-color: #e6f2ff;
  border-color: #a0d0ff;
  color: #0845fe;
  transform: translateY(-5px); /* 点击时上移 */
}
</style>