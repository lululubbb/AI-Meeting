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
    avatarUpdated: "头像更新成功"
  },
  errors: {
    avatarUploadFailed: "头像上传失败"
  },
  serviceQuality: {
    title: '服务质量',
    realTimeStats: '实时统计信息',
    videoEncode: '视频编码',
    videoDecode: '视频解码',
    audioEncode: '音频编码',
    audioDecode: '音频解码',
    shareEncode: '共享编码',
    shareDecode: '共享解码',
    fps: '帧率',
    bitrate: '码率',
    avgLoss: '平均丢包率',
    rtt: 'RTT',
    sampleRate: '采样率',
    widthHeight: '分辨率'
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
    avatarUpdated: "Avatar updated successfully",
  },
  errors: {
    "avatarUploadFailed": "Avatar upload failed"
  },
  serviceQuality: {
    title: 'Service Quality',
    realTimeStats: 'Real-time Statistics',
    videoEncode: 'Video Encode',
    videoDecode: 'Video Decode',
    audioEncode: 'Audio Encode',
    audioDecode: 'Audio Decode',
    shareEncode: 'Share Encode',
    shareDecode: 'Share Decode',
    fps: 'FPS',
    bitrate: 'Bitrate',
    avgLoss: 'Avg Loss',
    rtt: 'RTT',
    sampleRate: 'Sample Rate',
    widthHeight: 'Resolution'
  }
};

const i18n = createI18n({
  locale: 'zh-CN', // 默认语言
  fallbackLocale: 'zh-CN', // 回退语言
  globalInjection: true, // 关键配置
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  }
});

export default i18n;