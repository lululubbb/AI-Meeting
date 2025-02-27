import { createI18n } from 'vue-i18n';

// 中文语言包
const zhCN = {
  settings: {
    title: '设置页面',
    description: '在这里可以调整你的应用设置',
    theme: '选择主题',
    lightTheme: '浅色主题',
    darkTheme: '深色主题',
    language: '选择语言',
    chinese: '中文',
    english: '英文',
    notifications: '开启通知',
    notificationsChanged: '通知已 {status}',
    enabled: '开启',
    disabled: '关闭',
  },
  message: {
    themeChanged: '主题已切换为 {theme}',
    languageChanged: '语言已切换为 {language}',
  }
};

// 英文语言包
const enUS = {
  settings: {
    title: 'Settings',
    description: 'Adjust your application settings here',
    theme: 'Select Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    language: 'Select Language',
    chinese: 'Chinese',
    english: 'English',
    notifications: 'Enable Notifications',
    notificationsChanged: 'Notifications {status}',
    enabled: 'enabled',
    disabled: 'disabled',
  },
  message: {
    themeChanged: 'Theme changed to {theme}',
    languageChanged: 'Language changed to {language}',
  }
};

const i18n = createI18n({
  locale: 'zh-CN', // 默认语言
  fallbackLocale: 'zh-CN', // 回退语言
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  }
});

export default i18n;