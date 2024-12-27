// ParticipantStatistics.js

class ParticipantStatistics {
    constructor(client) {
      // 假设传入的 client 已经是一个初始化好的 Zoom 客户端实例
      this.client = client;
      console.log('Zoom 客户端:', this.client);
      this.videoStats = {}; // 用于存储视频统计
      this.audioStats = {}; // 用于存储音频统计
    }
  
    initializeEventListeners() {
      // 监听视频状态变化
      this.client.on('video-active-change', (payload) => {
        console.log('视频状态变化:', payload);  
        const { userId, state } = payload;
        const currentTime = new Date().getTime();
  
        // 初始化用户的视频统计
        if (!this.videoStats[userId]) {
          this.videoStats[userId] = {
            openCount: 0,
            totalDuration: 0,
            lastStartTime: null,
            openTimes: [],
          };
        }
  
        // 视频开启状态
        if (state === 'Active') {
          this.videoStats[userId].openCount++;
          this.videoStats[userId].lastStartTime = currentTime;
          this.videoStats[userId].openTimes.push(new Date().toISOString());
          console.log('用户', userId, '视频开启次数:', this.videoStats[userId].openCount);
          console.log('用户', userId, '视频开始时间:', this.videoStats[userId].openTimes);
        }
        // 视频关闭状态
        else if (state === 'Inactive' && this.videoStats[userId].lastStartTime) {
          const duration = (currentTime - this.videoStats[userId].lastStartTime) / 1000; // 转换为秒
          this.videoStats[userId].totalDuration += duration;
          this.videoStats[userId].lastStartTime = null;
          console.log('用户', userId, '视频持续时间:', duration, '秒');
          console.log('用户', userId, '视频持续总时间:', this.videoStats[userId].totalDuration, '秒');
        }
      });
  
      // 监听音频状态变化
      this.client.on('audio-active-change', (payload) => {
        console.log('音频状态变化:', payload);  
        const { userId, state } = payload;
        const currentTime = new Date().getTime();
  
        // 初始化用户的音频统计
        if (!this.audioStats[userId]) {
          this.audioStats[userId] = {
            openCount: 0,
            totalDuration: 0,
            lastStartTime: null,
            openTimes: [],
          };
        }
  
        // 音频开启状态
        if (state === 'Active') {
          this.audioStats[userId].openCount++;
          this.audioStats[userId].lastStartTime = currentTime;
          this.audioStats[userId].openTimes.push(new Date().toISOString());
          console.log('用户', userId, '音频开启次数:', this.audioStats[userId].openCount);
          console.log('用户', userId, '音频开始时间:', this.audioStats[userId].openTimes);
        }
        // 音频关闭状态
        else if (state === 'Inactive' && this.audioStats[userId].lastStartTime) {
          const duration = (currentTime - this.audioStats[userId].lastStartTime) / 1000; // 转换为秒
          this.audioStats[userId].totalDuration += duration;
          this.audioStats[userId].lastStartTime = null;
          console.log('用户', userId, '音频持续时间:', duration, '秒');
          console.log('用户', userId, '音频持续总时间:', this.audioStats[userId].totalDuration, '秒');
        }
      });
    }
  
    // 每分钟打印一次统计数据
    startPeriodicSave(userId, meetingId) {
      setInterval(() => {
        console.log('用户', userId, '视频统计数据:', this.videoStats[userId] || {});
        console.log('用户', userId, '音频统计数据:', this.audioStats[userId] || {});
      }, 6000); // 每分钟打印一次
    }
  }
  
  export default ParticipantStatistics;
  