<template>
    <div class="function-buttons">
      <button @click="activeSection = 'record'">会议记录</button>
      <button @click="setActiveSection('keywords')">关键提取</button>
      <button @click="activeSection = 'sentiment'">情感分析&词云图</button>
      <button @click="activeSection = 'statistics'">参会统计</button>
    </div>
  
    <div v-if="activeSection === 'record'" class="section-content">
      <div v-if="selectedMeeting.status === 'finished'">
        <p>{{ meetingTranscriptions }}</p>
      </div>
      <div v-else>
        <p>会议未结束，无法查看记录。</p>
      </div>
    </div>
  
    <div v-if="activeSection === 'keywords'" class="section-content">
      <div v-if="selectedMeeting.status === 'finished'">
        <div v-if="isLoadingSummary">
          <p>AI 正在生成摘要...</p>
        </div>
        <div v-else>
          <p v-if="summary">{{ summary }}</p>
          <p v-else>摘要内容为空。</p>
        </div>
      </div>
      <div v-else>
        <p>会议未结束，无法生成摘要。</p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { generateSummaryAPI } from '@/api/chat';
  
  export default {
    props: {
      meetingTranscriptions: {
        type: String,
        required: true,
      },
      selectedMeeting: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const activeSection = ref('record'); // 当前选中的功能模块
      const isLoadingSummary = ref(false); // 摘要生成的加载状态
      const summary = ref(''); // 生成的摘要内容
  
      // 切换到“关键提取”时调用生成摘要方法
      const setActiveSection = async (section) => {
        activeSection.value = section;
        if (section === 'keywords' && props.selectedMeeting.status === 'finished') {
          await generateSummary();
        }
      };
  
      // 调用大模型生成摘要
      const generateSummary = async () => {
        if (!props.meetingTranscriptions) {
          summary.value = '会议记录为空，无法生成摘要。';
          return;
        }
        isLoadingSummary.value = true;
        summary.value = '';
  
        try {
          const result = await generateSummaryAPI(props.meetingTranscriptions);
          summary.value = result;
        } catch (error) {
          console.error('生成摘要失败:', error);
          summary.value = '抱歉，生成摘要失败，请稍后重试。';
        } finally {
          isLoadingSummary.value = false;
        }
      };
  
      return {
        activeSection,
        isLoadingSummary,
        summary,
        setActiveSection,
      };
    },
  };
  </script>
  
  <style scoped>
  /* 样式可根据需求自定义 */
  .function-buttons {
    display: flex;
    gap: 10px;
  }
  .section-content {
    margin-top: 20px;
  }
  </style>
  