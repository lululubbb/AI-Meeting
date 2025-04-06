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
          @click="emitViewDetail(rec.item)"
        >
          <div class="item-content">
              <div class="item-header">
                  <h4 class="item-title">{{ rec.item.title }}</h4>
                  <el-tag size="small" type="primary" effect="light">
                    可能感兴趣程度: {{ rec.score.toFixed(3) }} 
                  </el-tag>
              </div>
  
              <p class="item-time">
                  <el-icon><Clock /></el-icon> {{ formatAgendaTime(rec.item.time) || '时间待定' }}
              </p>
               <p v-if="rec.item.location" class="item-location">
                  <el-icon><Location /></el-icon> {{ rec.item.location }}
              </p>
              <!-- <div v-if="rec.contributingKeywords && rec.contributingKeywords.length > 0" class="matched-keywords">
               <el-tag
                    v-for="keyword in rec.contributingKeywords.slice(0, 3)"
                    :key="keyword"
                    size="small"
                    type="info"
                    effect="plain"
                    style="margin-right: 4px; margin-top: 4px;"
                >
                 {{ keyword }}
               </el-tag>
                <el-tag v-if="rec.contributingKeywords.length > 3" size="small" type="info" effect="plain" style="margin-top: 4px;">...</el-tag>
             </div> -->

          </div>
        </el-card>
      </div>
      <p v-if="!isLoading && recommendations.length > 0 && recommendations.length < props.maxRecommendations" style="text-align: center; font-size: 12px; color: #aaa; margin-top: 15px;">
        （仅显示 Top {{ recommendations.length }} 推荐）
      </p>
  
    </el-card>
  </template>
  
  <script setup>
  import { ref, computed, watch, defineEmits  } from 'vue';
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
const emit = defineEmits(['view-agenda-detail']); 
  
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
    '的', '了', '和', '与', '或', '在', '于', '是', '不', '有', '没', '个', '们', '这', '那',
    '我', '你', '他', '她', '它', '及', '暨', '等', '问题', '探讨', '研究', '分享', '技术',
    '应用', '发展', '趋势', '合作', '安全', '数字', '智能', '平台', '峰会', '网络',
    '创新', '实践', '建设', '数据', '服务', 
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'and', 'or', 'of', 'ai',
    'to', 'for', 'with', 'about', 'as', 'by', 'session', 'meeting', 'conference', 'based',
    'summit', 'forum', 'introduction', 'new', 'how', 'use', 'using', 'from', 'will', 'be',
    'it', 'its', 'can', 'what', 'when', 'where', 'who', 'why', 'digital', 'security', 'data'
]);
  
// 1. Text Preprocessing
const preprocessText = (text) => {
  if (!text) return [];
  const cleanedText = text.replace(/[.,!?;:()\[\]{}'"]/g, ' ').replace(/\s+/g, ''); // Remove punctuation and whitespace
  return cleanedText
    .split('')
    .filter(char => char.trim() !== '' && !STOP_WORDS.has(char)); // Filter empty strings and potential single-character stop words
};
// 2. Cosine Similarity
const calculateCosineSimilarity = (vecA, vecB) => {
  const vocabulary = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const term of vocabulary) {
    const valA = vecA[term] || 0;
    const valB = vecB[term] || 0;
    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

// 3. Check if agenda item is upcoming
const isUpcoming = (agendaItem) => {
    if (!agendaItem || !agendaItem.fullDateTime) return false; // Check item exists
     // Try parsing different potential date/time formats if needed, this assumes ISO or parsable
    const agendaStartTime = dayjs(agendaItem.fullDateTime);
    return agendaStartTime.isValid() && agendaStartTime.isSameOrAfter(dayjs());
};

// 4. Format time
// const formatAgendaTime = (timeStr) => {
//     if (!timeStr) return null;
//     const time = dayjs(timeStr);
//     return time.isValid() ? time.format('YYYY-MM-DD HH:mm') : timeStr; 
// }
  
const formatAgendaTime = (timeStr, agendaItem) => { // 为上下文传递 agendaItem
    if (!timeStr) return null;

    const match = timeStr.match(/^(\d{2}:\d{2})/);
    const timeToParse = match ? match[1] : timeStr;

    // 如果有 fullDateTime 则使用它来获取日期部分
    const baseDate = agendaItem?.fullDateTime ? dayjs(agendaItem.fullDateTime) : dayjs(); // 如果没有 fullDateTime 则使用今天

    // 将 fullDateTime（或今天）的日期部分与提取的时间部分组合
    const combinedDateTimeStr = `${baseDate.format('YYYY-MM-DD')} ${timeToParse}`;
    const time = dayjs(combinedDateTimeStr); // 尝试解析组合后的字符串

    // 如果解析失败则回退到原始字符串
    // 格式化为 MM-DD HH:mm
    return time.isValid() ? time.format('MM-DD HH:mm') : timeStr;
  };


  const recommendations = computed(() => {
  console.log("[Rec] History Meetings:", props.historyMeetings?.length);
  console.log("[Rec] Upcoming Agenda:", props.upcomingAgenda?.length);


  if (props.isLoading ||
      !Array.isArray(props.historyMeetings) || props.historyMeetings.length === 0 ||
      !Array.isArray(props.upcomingAgenda) || props.upcomingAgenda.length === 0) {
       return [];
  }
  if (props.historyMeetings.length > 0) {
      const sampleHistoryText = `${props.historyMeetings[0].sessionName || props.historyMeetings[0].title || ''} ${props.historyMeetings[0].sessionIntro || props.historyMeetings[0].description || props.historyMeetings[0].content || ''}`;
  }
  // --- TF-IDF Calculation ---

  // 1. Combine all documents (history + upcoming) for IDF calculation
  const allDocsText = [
      ...props.historyMeetings.map(m => `${m.sessionName || m.title || ''} ${m.sessionIntro || m.description || m.content || ''}`),
      ...props.upcomingAgenda.map(item => `${item.title || ''} ${item.description || item.content || ''}`)
  ];
  const processedDocs = allDocsText.map(preprocessText);
  const totalDocuments = processedDocs.length;

  // 2. Calculate IDF
  const idfMap = new Map();
  const termDocCounts = new Map();
  const vocabulary = new Set();

  processedDocs.forEach(docTokens => {
      const uniqueTokensInDoc = new Set(docTokens);
      uniqueTokensInDoc.forEach(token => {
          termDocCounts.set(token, (termDocCounts.get(token) || 0) + 1);
          vocabulary.add(token); // Build vocabulary
      });
  });

  vocabulary.forEach(term => {
      // IDF formula with smoothing: log( (N+1) / (df+1) ) + 1
      const idf = Math.log((totalDocuments + 1) / (termDocCounts.get(term) + 1)) + 1;
      idfMap.set(term, idf);
  });


  // 3. Calculate TF-IDF Vector for a document
  const calculateTfidfVector = (docTokens) => {
      const vector = {};
      const termCounts = new Map();
      let maxFreq = 0;

      // Calculate TF
      docTokens.forEach(token => {
          if (vocabulary.has(token)) { // Only consider words in our vocabulary
              const count = (termCounts.get(token) || 0) + 1;
              termCounts.set(token, count);
              if (count > maxFreq) {
                  maxFreq = count;
              }
          }
      });

      if (maxFreq === 0) return {}; // Empty document or no vocab words

      // Calculate TF-IDF
      termCounts.forEach((count, term) => {
           // Augmented TF: 0.5 + 0.5 * (freq / maxFreq) to prevent bias towards long docs
          const tf = 0.5 + 0.5 * (count / maxFreq);
          const idf = idfMap.get(term) || 0; // Get IDF, default to 0 if somehow missing
          vector[term] = tf * idf;
      });
      return vector;
  };

        // 4. 计算历史会议的 TF-IDF 向量
        const historyVectors = props.historyMeetings.map(m => {
             const text = `${m.sessionName || m.title || ''} ${m.sessionIntro || m.description || m.content || ''}`;
             const tokens = preprocessText(text);
             return calculateTfidfVector(tokens);
         });

        // 5. 将历史向量聚合为用户资料向量（求平均值）
        const userProfileVector = {};
        if (historyVectors.length > 0) {
          vocabulary.forEach(term => {
            let sumTfidf = 0;
            historyVectors.forEach(vec => {
              sumTfidf += (vec[term] || 0);
            });
            if (sumTfidf > 0) {
                userProfileVector[term] = sumTfidf / historyVectors.length;
            }
          });
        }

// --- 对即将到来的议程进行评分 ---
        // 6. 计算即将到来的议程的 TF-IDF 向量和余弦相似度
        const scoredAgenda = [];
        props.upcomingAgenda.forEach((item, index) => {

          if (!item || !item.time || !item.title) return;
          if (!isUpcoming(item)) return;

          const itemText = `${item.title || ''} ${item.description || item.content || ''}`;
          const itemTokens = preprocessText(itemText);
          const itemVector = calculateTfidfVector(itemTokens);

          if (Object.keys(itemVector).length === 0 || Object.keys(userProfileVector).length === 0) return;

          const score = calculateCosineSimilarity(userProfileVector, itemVector);
          // console.log(`[Rec Score] Item: "${item.title}", Score: ${score.toFixed(5)}`);

          let contributingKeywords = [];
          if (score > 0.05) {
              const userTerms = Object.entries(userProfileVector).sort(([,a],[,b]) => b-a).slice(0, 15).map(([term]) => term);
              contributingKeywords = userTerms.filter(term => itemTokens.includes(term));
          }

          if (score > 0.01) { // 使用一个小的正阈值
              scoredAgenda.push({ item, score, contributingKeywords });
          }
        });

        // 7. 排序并截取
        const sortedRecommendations = scoredAgenda.sort((a, b) => b.score - a.score);
        const finalRecommendations = sortedRecommendations.slice(0, props.maxRecommendations);
        return finalRecommendations;

  }); // 计算属性 recommendations 结束

  const emitViewDetail = (agendaItem) => {
      console.log("Recommendation clicked:", agendaItem);
      emit('view-detail', agendaItem); // 发出带有项目数据的事件
  };

// watch(() => props.historyMeetings, (newVal) => {
// }, { deep: true });

// watch(() => props.upcomingAgenda, (newVal) => {
//  }, { deep: true });

  </script>
  
  <style scoped>
  .recommendation-card {
    margin-top: 20px;
    border: 1px solid #8b8b8b;
    margin-bottom: 5px;
    min-height: 300px;
    min-width: 30ch;
    display: flex; 
  flex-direction: column;
  box-shadow: var(--global-box-shadow);
  color:var(--text-color);
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
    flex-grow: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  }
  .el-skeleton {
  width: 100%; 
  }
  .recommendation-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .recommendation-item {
    border: 1px solid #cdcdcd;
      transition: box-shadow 0.3s ease;
      background-color: var(--background-color);
  }
  .recommendation-item:hover {
    box-shadow: var(--global-box-shadow);
}
  
  .item-content {
      font-size: 14px;
      color: #606266;
  }
  .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start; 
      margin-bottom: 6px;
  }
  
  .item-title {
    margin: 0;
  font-size: 1em;
  font-weight: 600;
  color: #303133;
  flex-grow: 1;
  padding-right: 8px;
  line-height: 1.4;
  flex-grow: 1; 
  word-break: break-word;
  }
  .similarity-tag {
    flex-shrink: 0;
}
  .item-time, .item-location {
    display: flex;
    align-items: center;
    color:  #909399;
    font-size: 0.85em;
    margin-bottom: 4px;
    line-height: 1.4;
  }
  
  .item-time .el-icon, .item-location .el-icon {
    margin-right: 4px;
    color: #909399;
    font-size: 1.1em;
    flex-shrink: 0;
  }
    
  .item-actions {
      margin-top: 10px;
      text-align: right;
  }

  :deep(.el-tag--small), /* Target generated class */
.el-tag.el-tag--small { /* Target direct class usage */
    height: 20px;
    padding: 0 6px;
    line-height: 19px;
    font-size: 11px;
}

  .el-tag--small {
    height: 20px;
    padding: 0 6px;
    line-height: 19px;
    font-size: 11px;
}

.el-empty {
    padding: 20px 0; 
}

.el-empty .el-empty__description p {
     font-size: 13px !important; /* Ensure description text is readable */
     color: #909399 !important;
}

@media (max-width: 767px) {
  .recommendation-card {
    margin-top: 15px;
    margin-bottom: 15px;
    min-height: 250px; /* Adjust min-height for mobile */
    box-shadow: none; /* Simpler look on mobile */
    /* border: none; */

    border-radius: 0; /* Full width */
  }

  :deep(.el-card__header) {
    padding: 12px 15px !important;
  }
  .card-header {
    font-size: 1.0rem; 
    font-weight: 600;
    padding-bottom: 8px;
  }
  .card-header .el-icon {
     font-size: 1.1em; 
  }

  .recommendation-list {
    gap: 0;
     padding-top: 0;
  }

  .recommendation-item {
    border: none; 
    border-bottom: 1px solid #f5f5f5; 
    border-radius: 0;
    box-shadow: none;
    background: none;
  }
   .recommendation-item:last-child {
       border-bottom: none; 
   }
    .recommendation-item:hover {
        background-color: #fafafa; 
        box-shadow: none;
    }

  .item-content {
     padding: 10px 15px; /* Adjust padding */
  }

  .item-header {
     margin-bottom: 4px;
     gap: 6px;
  }

  .item-title {
    font-size: 0.95em; 
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: calc(1.4em * 2);
  }

  .item-time, .item-location {
     font-size: 0.8em; 
  }

  .matched-keywords {
     margin-top: 6px;
     padding-top: 6px;
     gap: 3px; 
  }

    :deep(.el-tag--small),
    .el-tag.el-tag--small {
      height: 18px;
      padding: 0 5px;
      line-height: 17px;
      font-size: 10px;
   }

  .el-empty {
    padding: 20px 0;
  }
   .el-empty .el-empty__description p {
     font-size: 12px !important;
  }

  .top-n-message {
    font-size: 10px;
    margin-top: 10px;
    padding-bottom: 10px;
  }

}

  </style>