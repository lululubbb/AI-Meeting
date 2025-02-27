<template>
  <div class="settings-container">
    <h1 class="setting-title">{{ $t('settings.title') }}</h1>
    <p>{{ $t('settings.description') }}</p>

    <!-- 主题选择 -->
    <div class="setting-item">
      <label for="theme">{{ $t('settings.theme') }}</label>
      <el-select v-model="selectedTheme" placeholder="请选择主题" @change="handleThemeChange">
        <el-option :label="$t('settings.lightTheme')" value="light"></el-option>
        <el-option :label="$t('settings.darkTheme')" value="dark"></el-option>
      </el-select>
    </div>

    <!-- 语言选择 -->
    <div class="setting-item">
      <label for="language">{{ $t('settings.language') }}</label>
      <el-select v-model="selectedLanguage" placeholder="请选择语言" @change="handleLanguageChange">
        <el-option :label="$t('settings.chinese')" value="zh-CN"></el-option>
        <el-option :label="$t('settings.english')" value="en-US"></el-option>
      </el-select>
    </div>

    <!-- 通知开关 -->
    <div class="setting-item">
      <label for="notifications">{{ $t('settings.notifications') }}</label>
      <el-switch v-model="notificationsEnabled" @change="handleNotificationsChange"></el-switch>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

// 获取 store 和 i18n 实例
const store = useStore();
const { locale, t } = useI18n();

// 主题选择
const selectedTheme = computed({
  get() {
    return store.state.theme;
  },
  set(value) {
    store.dispatch('changeTheme', value);
  },
});
const handleThemeChange = (value) => {
  ElMessage.success(t('message.themeChanged', { theme: value === 'light' ? t('settings.lightTheme') : t('settings.darkTheme') }));
};

// 语言选择
const selectedLanguage = computed({
  get() {
    return locale.value;
  },
  set(value) {
    locale.value = value;
    store.dispatch('changeLanguage', value);
  },
});
const handleLanguageChange = (value) => {
  ElMessage.success(t('message.languageChanged', { language: value === 'zh-CN' ? t('settings.chinese') : t('settings.english') }));
};

// 通知开关
const notificationsEnabled = ref(true);
const handleNotificationsChange = (value) => {
  ElMessage.success(t('settings.notificationsChanged', { status: value ? t('settings.enabled') : t('settings.disabled') }));
};
</script>

<style scoped>
.settings-container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}

.setting-title {
  text-align: center;
  color: var(--text-color);
  margin-bottom: 20px;
}

.setting-item {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: var(--text-color);
}
</style>