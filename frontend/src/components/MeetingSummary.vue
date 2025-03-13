<template>
  <div class="function-buttons">
    <button @click="goToMeetingShow" style="background-color: red; color: white;">会议展示 (测试)</button>
    <button @click="activeSection = 'record'">会议记录</button>
    <button @click="setActiveSection('keywords')">关键提取</button>
    <button @click="activeSection = 'sentiment'">情感分析&词云图</button>
    <button @click="activeSection = 'statistics'">参会统计</button>
    <button @click="goToMeetingShow">会议展示</button>  <!-- 添加点击事件 -->
  </div>

  <div v-if="activeSection === 'record'" class="section-content">
  <!--  此处需要传入会议ID   -->
    <div v-if="selectedMeeting.status === 'finished'">
      <!-- <p>{{ meetingTranscriptions }}</p>  直接显示全部文本的方式 -->
       <!-- 使用 MeetingShow 组件显示 -->
      <MeetingShow :meeting-id="selectedMeeting.meetingId"/>
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
import { useRouter } from 'vue-router'; // 导入 useRouter
import MeetingShow from './MeetingShow.vue'; // 导入 MeetingShow 组件 (假设在同一目录下)

export default {
  components:{
      MeetingShow  //注册
  },
  props: {
    meetingTranscriptions: {
      type: String,
      // required: true, //  不再需要, 因为我们现在使用 MeetingShow 组件
       required: false,
        default: ''
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
    const router = useRouter(); // 获取 router 实例

    // 切换到“关键提取”时调用生成摘要方法
    const setActiveSection = async (section) => {
      activeSection.value = section;
      if (section === 'keywords' && props.selectedMeeting.status === 'finished') {
        await generateSummary();
      }
    };

    // 调用大模型生成摘要
    const generateSummary = async () => {
       if (!props.meetingTranscriptions) { //  这里仍然需要检查, 因为在 keywords 模块中会用到
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

     // 新增: 跳转到 MeetingShow 页面 的方法
     const goToMeetingShow = () => {
      if (props.selectedMeeting && props.selectedMeeting.meetingId) {
          router.push({ name: 'Transcription', params: { meetingId: props.selectedMeeting.meetingId } });
      }
       else {
          console.warn('缺少 meetingId，无法跳转'); //  或者使用 ElMessage 提示
      }

     };

    return {
      activeSection,
      isLoadingSummary,
      summary,
      setActiveSection,
      goToMeetingShow,  //  导出
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
