<template>
  <div class="login-wrapper">
    <!-- 登录和注册区域 -->
    <div class="login-section">
      <div class="brand-area">
        <h1 class="title">
          <span class="title-icon">🚀</span>
          慧议先锋
        </h1>
        <h2 class="subtitle">AI Meeting</h2>
        <p class="welcome-text">欢迎回来！请登录您的账号</p>
      </div>

      <div class="form-container">
        <div class="input-group">
          <label for="email" class="label">邮箱地址</label>
          <input v-model="email" type="email" id="email" placeholder="请输入您的邮箱地址" class="input" @keyup.enter="handleEnter" />
          <span v-if="email && !isValidEmail(email)" class="input-error">邮箱格式不正确</span>
        </div>

        <div class="input-group">
          <label for="password" class="label">密码</label>
          <div class="password-container">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" class="input password-input" placeholder="请输入您的密码" @keyup.enter="handleEnter" />
            <svg @click="toggleShow" :class="{ 'eye-icon': true, 'active': showPassword }" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path :d="showPassword ? openEyePath : closedEyePath" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span v-if="password && password.length < 8" class="input-error">密码长度至少8位</span>
        </div>

        <div class="button-section">
          <button @click="handleAuth" class="action-button" :disabled="!isFormValid">
            <span v-if="isSubmitting" class="loader"></span>
            {{ isLoginMode ? "邮箱登录" : "邮箱注册" }}
          </button>
          <button @click="toggleMode" class="toggle-button">
            {{ isLoginMode ? "没有账号？注册" : "已有账号？登录" }}
          </button>
        </div>

        <div class="social-login">
          <p class="social-login-text">或使用以下方式登录</p>
          <button @click="loginWithGoogle" class="social-button">
            <img src="@/assets/Google.png" alt="Google" class="social-icon" />
            <span class="social-button-text">Google 登录</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 介绍区域 (仅在较大屏幕上显示) -->
    <div class="intro-section" v-if="!isMobile">
      <img src="@/assets/intro3.png" alt="Illustration of modern meeting" class="intro-image animate-subtle-slide" />
      <div class="intro-text">
        <h3 class="intro-title">智能化会议，尽在慧议先锋</h3>
        <p class="intro-description">实时转录、智能摘要、多语言支持，开启高效协作新篇章。</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AuthService from '@/services/AuthService.js';
import { useRouter } from 'vue-router';
import { ElNotification } from 'element-plus';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const isLoginMode = ref(true);
    const showPassword = ref(false);
    const router = useRouter();
    const isSubmitting = ref(false);
    const isMobile = ref(false); // 新增：是否为移动设备

       // 检查是否是移动设备的函数
    const checkIfMobile = () => {
      isMobile.value = window.innerWidth <= 768;
       console.log("isMobile.value:", isMobile.value);
    };


    // 切换模式（登录/注册）
    const toggleMode = () => {
      isLoginMode.value = !isLoginMode.value;
      email.value = '';
      password.value = '';
    };

    // 切换密码可见性
    const toggleShow = () => {
      showPassword.value = !showPassword.value;
    };

    // SVG 路径 (闭眼)
    const closedEyePath = "M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15ZM12 15C9.64749 15 7.58732 13.8299 6.17513 12C7.58732 10.1701 9.64749 9 12 9C14.3525 9 16.4127 10.1701 17.8249 12C16.4127 13.8299 14.3525 15 12 15ZM1 9C1.97275 6.35728 3.35523 4.31419 5.74658 3.34173C8.63918 2.19982 12 2.25 12 2.25C12 2.25 15.3608 2.19982 18.2534 3.34173C20.6448 4.31419 22.0273 6.35728 23 9C21.938 11.8752 20.3538 14.0947 18.2534 15.6583C15.3608 16.8002 12 16.75 12 16.75C12 16.75 8.63918 16.8002 5.74658 15.6583C3.64621 14.0947 2.06204 11.8752 1 9Z";
    // SVG 路径 (睁眼)
    const openEyePath = "M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z";

    // 验证邮箱格式
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // 计算表单是否有效
    const isFormValid = computed(() => {
      return isValidEmail(email.value) && password.value.length >= 8;
    });

    // 处理回车键
    const handleEnter = () => {
      if (isFormValid.value) {
        handleAuth();
      }
    };

    // 处理认证 (登录/注册)
    const handleAuth = async () => {
      if (!isFormValid.value) {
        return;
      }
      isSubmitting.value = true;

      let res;
      try {
        if (isLoginMode.value) {
          console.log("尝试登录:", email.value);
          res = await AuthService.signInWithEmailAndPassword(email.value, password.value);
        } else {
          console.log("尝试注册:", email.value);
          res = await AuthService.registerWithEmailAndPassword(email.value, password.value);
        }
      } finally {
        isSubmitting.value = false;
      }

      if (res) {
        document.body.classList.add('light');
        ElNotification({
          title: '成功',
          message: isLoginMode.value ? "登录成功" : "注册成功",
          type: 'success'
        });
        router.push('/home');
      } else {
        let errorMessage = '操作失败，请重试。';
        if (!isLoginMode.value) {
          errorMessage = "注册失败，该邮箱可能已经被注册，请更换邮箱或直接登录。"
        }
        ElNotification({ title: '错误', message: errorMessage, type: 'error' });
      }
    };

    // 使用 Google 登录
    const loginWithGoogle = async () => {
      isSubmitting.value = true;
      const res = await AuthService.signInWithGoogle();
      isSubmitting.value = false;

      if (res) {
        ElNotification({ title: '成功', message: 'Google 登录成功', type: 'success' });
        document.body.classList.add('light');
        router.push('/home');
      } else {
        ElNotification({ title: '错误', message: 'Google 登录失败', type: 'error' });
      }
    };

    onMounted(() => {
      checkIfMobile(); // 组件挂载时检查
      window.addEventListener('resize', checkIfMobile); // 监听窗口大小变化
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkIfMobile); // 组件卸载时移除监听
    });
    return {
      email,
      password,
      isLoginMode,
      showPassword,
      closedEyePath,
      openEyePath,
      router,
      toggleMode,
      toggleShow,
      handleAuth,
      loginWithGoogle,
      isValidEmail,
      isFormValid,
      handleEnter,
      isSubmitting,
      isMobile
    };
  },
};
</script>

<style scoped>
/* 关键动画 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes subtle-slide {
  0% { transform: translateX(50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.animate-subtle-slide {
  animation: subtle-slide 1.5s ease-out forwards;
}

/* 整体布局 */
.login-wrapper {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #d8e7ff 100%);
  font-family: 'SourceSansPro', sans-serif;
}

/* 登录区域 */
.login-section {
  flex: 1 0 50%; /* 占据一半宽度，允许收缩 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 2rem;
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 10px 25px rgba(92, 99, 105, .2);
  margin: 2rem;
    max-width: 500px; /* 添加最大宽度限制 */
  box-sizing: border-box; /* 包含 padding 和 border */
}

.brand-area {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem; /* 调整标题大小 */
  font-weight: 800;
  color: #2c3e50;
  letter-spacing: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon {
  margin-right: 0.5rem;
  font-size: 3rem; /* 图标大小 */
}

.subtitle {
  font-size: 1.25rem; /* 副标题大小 */
  font-weight: 600;
  color: #3498db;
  margin-top: 0.5rem;
}

.welcome-text {
  font-size: 1rem;
  font-weight: 500;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

/* 表单容器 */
.form-container {
  width: 100%;
}

/* 输入框组 */
.input-group {
  margin-bottom: 1.25rem; /* 减小间距 */
}

/* 标签 */
.label {
  display: block;
  font-size: 0.875rem; /* 标签字号 */
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.375rem; /* 减小间距 */
}

/* 输入框 */
.input {
  width: 100%;
  padding: 0.875rem; /* 调整内边距 */
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem; /* 输入框字号 */
  color: #495057;
  background-color: #f8f9fa;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-sizing: border-box; /* 包含 padding */
}

.input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.25);
}

/* 密码相关 */
.password-container {
  position: relative;

}
.password-input {
   padding-right: 2.5rem;
}
.eye-icon {
  position: absolute;
  top: 50%;
  right: 0.75rem; /* 图标位置 */
  transform: translateY(-50%);
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.2s;
}

.eye-icon.active {
  color: #3498db;
}

.input-error {
  color: #e74c3c;
  font-size: 0.75rem; /* 错误提示字号 */
  margin-top: 0.25rem;
  display: block;
}

/* 按钮区域 */
.button-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1rem; /* 减小间距 */
}

/* 操作按钮 */
.action-button {
  width: 100%;
  padding: 0.875rem; /* 调整内边距 */
  background: linear-gradient(to right, #3498db, #2980b9);
  color: white;
  font-size: 1rem; /* 按钮字号 */
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(50, 50, 93, 0.15), 0 3px 6px rgba(0, 0, 0, 0.12);
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #bdc3c7;
  box-shadow: none;
  transform: none;
}

/* 加载动画 */
.loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.loader::after {
  content: "";
  width: 24px; /* 调整大小 */
  height: 24px; /* 调整大小 */
  border: 3px solid #3498db; /* 调整粗细 */
  border-top: 3px solid transparent; /* 调整粗细 */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 切换按钮 */
.toggle-button {
  background: none;
  border: none;
  color: #3498db;
  font-size: 0.875rem; /* 按钮字号 */
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.625rem; /* 减小间距 */
  transition: color 0.2s;
}

.toggle-button:hover {
  color: #2980b9;
}

/* 社交登录 */
.social-login {
  text-align: center;
  margin-top: 1.5rem; /* 减小间距 */
}

.social-login-text {
  color: #7f8c8d;
  font-size: 0.875rem; /* 文字字号 */
  margin-bottom: 0.75rem; /* 减小间距 */
}

.social-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem; /* 调整内边距 */
  background-color: white;
  color: #34495e;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem; /* 按钮字号 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.social-button:hover {
  background-color: #f7f9fa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: scale(1.03);
}

.social-icon {
  width: 1.5rem; /* 调整图标大小 */
  height: 1.5rem; /* 调整图标大小 */
  margin-right: 0.625rem; /* 调整间距 */
  vertical-align: middle;
}

.social-button-text {
  vertical-align: middle;
}

/* 介绍区域 */
.intro-section {
  flex: 1 0 50%; /* 占据一半宽度，允许收缩 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  /* border-left: 1px solid #ecf0f1; */
}

.intro-image {
    max-width: 90%;
    max-height: 80%;
    border-radius: 1rem;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    animation: float 5s ease-in-out infinite;
}
.intro-text{
    text-align: center;
    margin-top: 1rem;
}
.intro-title{
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: .5rem;
}
.intro-description{
    font-size: .875;
    color:#7f8d8d;
}

/* 响应式设计 */
@media (max-width: 768px) {
   .login-wrapper {
        overflow-y: auto;  /* 添加滚动 */
        -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
    }
  .login-section {
    flex: 1 1 100%; /* 移动端占满全宽 */
    margin: 1rem;
    padding: 1.5rem;
    border-radius: 1rem;
     max-width: none; /* 移除最大宽度限制 */
  }

  /* 隐藏介绍区域 */
  .intro-section {
    display: none;
  }
}
</style>
