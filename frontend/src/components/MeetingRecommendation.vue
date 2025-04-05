<template>
    <el-card class="recommendation-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>会议日程推荐</span>
          <el-tooltip content="根据您的历史会议记录推荐可能感兴趣的未开始议程" placement="top">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
  
      <div v-if="isLoading" class="loading-state">
         <el-skeleton :rows="3" animated />
      </div>
  
      <el-empty v-else-if="recommendations.length === 0" description="暂无相关会议日程推荐">
             <p v-if="Array.isArray(upcomingAgenda) && upcomingAgenda.length === 0" style="font-size: 12px; color: #999;">
                 （未获取到未来议程）
             </p>
             <p v-else-if="Array.isArray(historyMeetings) && historyMeetings.length === 0" style="font-size: 12px; color: #999;">
                 （无历史会议记录用于分析）
             </p>
             <p v-else-if="!upcomingAgenda" style="font-size: 12px; color: #999;">
                 （议程数据加载中或失败...）
             </p>
             <p v-else-if="!historyMeetings" style="font-size: 12px; color: #999;">
                  （历史记录加载中或失败...）
             </p>
        </el-empty>
  
      <div v-else class="recommendation-list">
        <el-card
          v-for="rec in recommendations"
          :key="rec.item.id || rec.item.title"
          class="recommendation-item"
          shadow="hover"
        >
          <div class="item-content">
              <div class="item-header">
                  <h4 class="item-title">{{ rec.item.title }}</h4>
                  <el-tag size="small" type="primary" effect="light">
                      匹配分: {{ rec.score }}
                  </el-tag>
              </div>
  
              <p class="item-time">
                  <el-icon><Clock /></el-icon> {{ formatAgendaTime(rec.item.time) || '时间待定' }}
              </p>
               <p v-if="rec.item.location" class="item-location">
                  <el-icon><Location /></el-icon> {{ rec.item.location }}
              </p>
             <div v-if="rec.matchedKeywords && rec.matchedKeywords.length > 0" class="matched-keywords">
                 <el-tag
                      v-for="keyword in rec.matchedKeywords.slice(0, 3)"
                      :key="keyword"
                      size="small"
                      type="info"
                      effect="plain"
                      style="margin-right: 4px; margin-top: 4px;"
                  >
                   {{ keyword }}
                 </el-tag>
                  <el-tag v-if="rec.matchedKeywords.length > 3" size="small" type="info" effect="plain" style="margin-top: 4px;">...</el-tag>
             </div>

          </div>
        </el-card>
      </div>
        <p v-if="!isLoading && recommendations.length > 0 && recommendations.length < 3" style="text-align: center; font-size: 12px; color: #aaa; margin-top: 15px;">
            （仅显示 Top {{ recommendations.length }} 推荐）
          </p>
  
    </el-card>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  import { ElCard, ElTag, ElIcon, ElEmpty, ElTooltip, ElSkeleton, ElButton } from 'element-plus';
  import { InfoFilled, Clock, Location } from '@element-plus/icons-vue';
  import dayjs from 'dayjs';
  import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // Import plugin
  dayjs.extend(isSameOrAfter); // Use plugin
  // 获取用户 ID
const getUserId = () => {
  const user = store.getters.getUser;
  return user?.uid;  //  user  null, ?
}

// 获取会议列表
const meetings = computed(() => store.getters.getMeetings);

  
  const props = defineProps({
    historyMeetings: {
      type: Array,
      required: true,
      default: () => [] // Default to empty array
    },
    upcomingAgenda: {
      type: Array,
      required: true,
      default: () => [] // Default to empty array
    },
     isLoading: { 
          type: Boolean,
          default: false,
      },
      maxRecommendations: { 
          type: Number,
          default: 3
      }
  });
  
  const STOP_WORDS = new Set([
      '的', '了', '和', '与', '或', '在', '于', '一个', '一些', '这个', '那个', '我们',
      '他们', '它们', '是', '不是', '有', '没有', '介绍', '关于', '会议', '论坛', '主题',
      '以及', '等', '问题', '探讨', '研究', '分享', '技术', '应用', '发展', '趋势',
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'and', 'or', 'of',
      'to', 'for', 'with', 'about', 'as', 'by', 'session', 'meeting', 'conference',
      'summit', 'forum', 'introduction'
  ]);
  

  const extractKeywords = (meetings) => {
    if (!meetings || meetings.length === 0) return new Set();
  
    const textCorpus = meetings.map(m => `${m.sessionName || ''} ${m.sessionIntro || ''}`).join(' ');
    const words = textCorpus
      .toLowerCase()
      .replace(/[.,!?;:()\[\]{}'"]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !STOP_WORDS.has(word)); 
  
    return new Set(words); 
  };
  
  const isUpcoming = (agendaItem) => {
      if (!agendaItem.time) return false;
      const agendaTime = dayjs(agendaItem.time);
      return agendaTime.isValid() && agendaTime.isSameOrAfter(dayjs());
  };
  
  
  const formatAgendaTime = (timeStr) => {
      if (!timeStr) return null;
      const time = dayjs(timeStr);
      return time.isValid() ? time.format('YYYY-MM-DD HH:mm') : timeStr;
  }
  
  const recommendations = computed(() => {
  console.log("Recalculating recommendations...");
  console.log("History Meetings:", props.historyMeetings?.length);
  console.log("Upcoming Agenda:", props.upcomingAgenda?.length);

  if (props.isLoading) {
    console.log("Returning empty: isLoading is true.");
    return []; 
  }
  if (!Array.isArray(props.historyMeetings) || props.historyMeetings.length === 0) {
    console.log("Returning empty: No valid history meetings.");
    return [];
  }
   if (!Array.isArray(props.upcomingAgenda) || props.upcomingAgenda.length === 0) {
    console.log("Returning empty: No valid upcoming agenda.");
    return [];
  }

  const historyKeywords = extractKeywords(props.historyMeetings);
  console.log("Extracted Keywords:", historyKeywords);

  if (historyKeywords.size === 0) {
    console.log("Returning empty: No keywords extracted from history.");
    return [];
  }


  const scoredAgenda = [];

  props.upcomingAgenda.forEach(item => {
    if (!item || !item.time || !item.title) return;

    if (!isUpcoming(item)) return; 

    const itemText = (`${item.title || ''} ${item.description || item.content || ''}`).toLowerCase();
    let score = 0;
    let matchedKeywordsList = []; 

    historyKeywords.forEach(keyword => {
      if (itemText.includes(keyword)) {
        score++;
        matchedKeywordsList.push(keyword); 
      }
    });

    if (score > 0) {
      scoredAgenda.push({
          item: item, 
          score: score,
          matchedKeywords: [...new Set(matchedKeywordsList)] 
      });
    }
  });
  console.log("Scored Agenda (unsorted):", scoredAgenda);

  const sortedRecommendations = scoredAgenda.sort((a, b) => b.score - a.score);

  const finalRecommendations = sortedRecommendations.slice(0, props.maxRecommendations);
  console.log("Final Recommendations (sorted and sliced):", finalRecommendations);
  return finalRecommendations; 

}); 

  watch(() => props.historyMeetings, (newVal, oldVal) => {
    console.log('MeetingRecommendation received historyMeetings prop update:', newVal);
    if (newVal) {
        console.log('Length:', newVal.length);
        if(newVal.length > 0) {
            console.log('First item:', JSON.stringify(newVal[0])); // Log first item structure
        }
    } else {
        console.log('Received null or undefined');
    }
}, { immediate: true, deep: true }); // immediate: run on mount, deep: check inside array

watch(() => props.upcomingAgenda, (newVal) => {
     console.log('MeetingRecommendation received upcomingAgenda prop update:'); // Removed newVal from first log
     console.log(`  Prop Type: ${Array.isArray(newVal) ? 'Array' : typeof newVal}`);
     if (Array.isArray(newVal)) {
        console.log(`  Prop Length: ${newVal.length}`); // <--- THIS IS KEY
        if (newVal.length > 0) {
            console.log(`  First Item Structure in Prop:`, JSON.stringify(newVal[0])); // See structure
        }
     } else {
        console.log('  Prop Value:', newVal); // Log if not array
     }
 }, { immediate: true, deep: true });

  </script>
  
  <style scoped>
  .recommendation-card {
    margin-top: 30px;
    border: 1px solid #8b8b8b;
    margin-bottom: 20px;
    min-height: 350px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;
  }
  
  .card-header .el-icon {
    color: #424242;
    cursor: help;
  }
  .loading-state {
      padding: 20px;
  }
  
  .recommendation-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .recommendation-item {
    border: 1px solid #cdcdcd;
      transition: box-shadow 0.3s ease;
  }

  
  .item-content {
      font-size: 14px;
  }
  .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start; 
      margin-bottom: 8px;
  }
  
  .item-title {
    margin: 0;
    font-size: 1.05em;
    font-weight: 600;
    color: #303133;
    flex-grow: 1; 
    padding-right: 10px; 
  }
  
  .item-time, .item-location {
    display: flex;
    align-items: center;
    color: #606266;
    font-size: 0.9em;
    margin-bottom: 5px;
  }
  
  .item-time .el-icon, .item-location .el-icon {
    margin-right: 5px;
    color: #909399;
  }
  
  .matched-keywords {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #e4e7ed;
  }
  
  .item-actions {
      margin-top: 10px;
      text-align: right;
  }
  
  </style>