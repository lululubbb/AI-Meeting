<template>
    <div class="data-summary">
      <div class="chart-container">
        <h3>最近会议统计</h3>
        <div ref="meetingsChart" class="chart"></div>
      </div>
      <div class="chart-container">
        <h3>会议时长分布</h3>
        <div ref="durationChart" class="chart"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, nextTick } from 'vue';
  import * as echarts from 'echarts';  // 如果体积重要, 使用按需引入
  import { useRouter } from 'vue-router'; // 导入 useRouter
  import { useStore } from 'vuex';
  import FirestoreService from '../services/FirestoreService';
  
  const meetingsChart = ref(null);
  const durationChart = ref(null);
  let meetingsChartInstance = null;
  let durationChartInstance = null;
  const store = useStore();
    const router = useRouter(); // 获取 router 实例
  const userId = store.getters.getUser?.uid;
  
  onMounted(() => {
    if (userId) {
      fetchData();
    }
  });
  // 辅助函数：格式化日期为 YYYY-MM-DD (DataSummary.vue 和 HistoryMeeting.vue 都要用)
function formatDateForComparison(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  async function fetchData() {
    try {
      const meetings = await FirestoreService.getAllMeetingHistory(userId);
      nextTick(() => {
        initMeetingsChart(meetings);
        initDurationChart(meetings);
      });
    }
    catch (error) {
      console.error("获取数据失败", error);
    }
  }
  
  function initMeetingsChart(meetings) {
    if (!meetingsChart.value) return;
  
    meetingsChartInstance = echarts.init(meetingsChart.value, 'light');  // 'light' 主题, 或 'dark'
  
    // 数据处理：按日期统计会议数量
    const dateCounts = {};
    meetings.forEach(meeting => {
      if (!meeting || !meeting.startTime) {
            //console.warn('Invalid meeting data:', meeting);
            return;
        }
        const timestamp = meeting.startTime;
        if (typeof timestamp.toDate !== 'function') {
            console.warn('startTime 类型错误', timestamp, meeting);
            return;
        }
        const date = formatDateForComparison(timestamp.toDate());
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
  
    // 对日期进行排序（正序，最早的在左边）
    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    const daysToShow = 7;
    const recentDates = sortedDates.slice(-daysToShow); // 取最后7天
  
    // 构建 ECharts series 数据
    const seriesData = recentDates.map(date => dateCounts[date] || 0);
    const visualMapColor = ['#2E9EE3', '#34D39A', '#FFD56B', '#FF8C6B']; // 渐变
  
    const option = {
      title: {  text: '', left: 'center', textStyle: { color: '#333', fontSize: 18 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 14 },
      },
      legend: {
        data: ['会议数', '趋势'],
        top: 'bottom',
        textStyle: { color: '#555', fontSize: 12 } // 使用全局变量更好, 这里先写死
      },
      toolbox: {
        feature: {
          dataView: { show: false, readOnly: false },
          magicType: { show: true, type: ['line', 'bar'] }, //  注释掉这行, 一直显示两种
          restore: { show: true }, // 添加还原按钮
          saveAsImage: { show: true, title: '下载' }
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: recentDates,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: {
          rotate: 45,
          interval: 0,
          color: '#555',
          fontSize: 12,
          formatter: function (value) {
            const [year, month, day] = value.split('-');
            return `${month}/${day}`;
          }
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '会议数',
        minInterval: 1,
        axisLine: { show: true, lineStyle: { color: '#ccc' } },
        axisLabel: { color: '#555', fontSize: 12 },
        splitLine: { lineStyle: { color: '#eee' } }
      },
      visualMap: { show: false, type: 'continuous', min: 0, max: Math.max(...seriesData), color: visualMapColor },
      series: [
        {
          name: '会议数',
          data: seriesData,
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.7)' }
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            scale: 1.05,
            label: { 
            show: true, 
            fontSize: '12', 
            fontWeight: 'bold' 
          },
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          },
          label: { show: false, position: 'top', color: '#333', fontSize: 12 },
          barWidth: '60%',
        },
        {
          name: '趋势',
          data: seriesData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#FF6B81', width: 3, type: 'solid', },
          itemStyle: { color: '#FF6B81', borderWidth: 2, borderColor: '#fff', },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 129, 0.5)' },
              { offset: 1, color: 'rgba(255, 107, 129, 0)' }
            ])
          },
          emphasis: {
            itemStyle: { color: 'rgba(242,98,128)', borderColor: '#fff', borderWidth: 4, },
            lineStyle: { width: 4 }
          },
        }
      ]
    };
    meetingsChartInstance.setOption(option);
  
    // 点击事件
    meetingsChartInstance.on('click', function (params) {
      if (params.componentType === 'series') {
        const date = params.name;
          router.push(`/history?date=${date}`); 
      }
    });
}
  function initDurationChart(meetings) {
      if (!durationChart.value) return;
  
      durationChartInstance = echarts.init(durationChart.value, 'light'); // 或 'dark'
  
      const durationRanges = {
          '0-30 分钟': 0,
          '30-60 分钟': 0,
          '60-120 分钟': 0,
          '120 分钟以上': 0,
      };
  
      meetings.forEach(meeting => {
        if (!meeting || !meeting.startTime || !meeting.endTime) {
            return;
          }
          const startTimestamp = meeting.startTime;
  
          if (typeof startTimestamp.toDate !== 'function') {
            console.warn('Invalid startTime:', startTimestamp, 'in meeting:', meeting);
            return;
        }
        if (typeof meeting.endTime.toDate !== 'function') {
          console.warn('Invalid endTime:', meeting.endTime, 'in meeting:', meeting);
          return;
        }
  
          const durationMs = meeting.endTime.toDate() - startTimestamp.toDate();
          const durationMin = durationMs / (1000 * 60);
  
          if (durationMin <= 30) {
              durationRanges['0-30 分钟']++;
          } else if (durationMin <= 60) {
              durationRanges['30-60 分钟']++;
          } else if (durationMin <= 120) {
              durationRanges['60-120 分钟']++;
          } else {
              durationRanges['120 分钟以上']++;
          }
      });
      const visualMapColor = ['#2E9EE3', '#34D39A', '#FFD56B', '#FF8C6B']; // 渐变
  
      const seriesData = Object.entries(durationRanges).map(([name, value]) => ({ name, value }));
  
      const option = {
        title: { // 增加标题
            text: '', // 会议持续时间分布
            left: 'center',
            textStyle: { color: '#333', fontSize: 18}
        },
        tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 14 } // 使用全局变量/CSS变量更好
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        textStyle: { color: '#555', fontSize: 12 }, // 使用全局变量/CSS变量更好
        icon: 'circle',
      },
      toolbox: {
        show: true,
        feature: {
          //  dataView: { show: true, readOnly: false }, //  数据视图 (通常不需要)
          saveAsImage: { show: true, title: '下载图片'}
        }
      },
      series: [
        {
          name: '会议时长',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
          show: true,
          formatter: '{b}: {d}%',
          // 使用富文本设置行高
          // formatter: function (params) {
          //   return `{name|${params.name}}\n{percent|${params.percent}%}`;
          // },
          // rich: {
          //   name: { lineHeight: 20 }, // 第一行高度
          //   percent: { lineHeight: 20 } // 第二行高度
          // },
          position: 'outside',
          fontSize: 12,
          color: '#333',
        },
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 5,
            shadowOffsetX: 0,
            shadowOffsetY: 2
          },
          emphasis: {
          label: { show: true, fontSize: '14', fontWeight: 'bold' },
          //   label: {
          //   show: true,
          //   // 重新定义悬浮时的 rich 样式
          //   formatter: function (params) {
          //     return `{name|${params.name}}\n{percent|${params.percent}%}`;
          //   },
          //   rich: {
          //     name: { 
          //       lineHeight: 20, 
          //       fontSize: 15, 
          //       fontWeight: 'bold' 
          //     }, // 悬浮时字体变大
          //     percent: { 
          //       lineHeight: 20, 
          //       fontSize: 15, 
          //       fontWeight: 'bold' 
          //     }
          //   }
          // },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
          },
          data: seriesData
            .sort((a, b) => b.value - a.value)
            .map((item, index) => {
              return {
                value: item.value,
                name: item.name,
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: visualMapColor[index % visualMapColor.length] },
                    { offset: 1, color: echarts.color.modifyHSL(visualMapColor[index % visualMapColor.length], null, null, 0.5) }
                  ])
                }
              }
            })
        }
      ],
      color: visualMapColor,
      graphic: [
        {
          type: 'group',
          left: 'center',
          top: 'center',
          children: [
            {
              type: 'text',
              silent: true,
              z: 100,
              style: {
                fill: 'rgba(0,0,0,0.25)',  // 使用 CSS 变量更好
                font: 'bold 24px sans-serif'
              }
            }
          ]
        }
      ]
    };
  
    durationChartInstance.setOption(option);
  }
  
  window.addEventListener('resize', () => {
    nextTick(() => {
      if (meetingsChartInstance) {
        meetingsChartInstance.resize();
      }
      if (durationChartInstance) {
        durationChartInstance.resize();
      }
    });
  });
  </script>
  
  <style scoped>
  /* 使用全局的 CSS 变量 */
  .data-summary {
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: var(--global-box-shadow);
    border-radius: 8px;
    padding: 15px;
    background-color: var(--background-color);  /* 全局背景 */
    height: 100%;
    margin:5px;
  }
  
  .chart-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    background-color: var(--background-color); /* 或一个更浅的背景 */
  }
  
  .chart-container h3 {
    margin-bottom: 10px;
    font-size: 20px;
    background: var(--text-gradient); /* 1. 应用渐变作为背景 */
  -webkit-background-clip: text;    /* 2. (兼容性) 将背景裁剪到文字形状 */
  background-clip: text;            /* 2. (标准) 将背景裁剪到文字形状 */
  -webkit-text-fill-color: transparent; /* 3. (兼容性) 使文字填充色透明，显示背景 */
  color: transparent;
    text-align: center;
    font-weight: 600;
  }
  
  .chart {
    width: 100%;
    height: 260px; /* 增加高度 */
  }
  
  /* 响应式设计 */
  @media (max-width: 640px) {
    .page-content-container {
        /* 微调容器内边距，给卡片更多空间感 */
        padding-left: 15px;
        padding-right: 15px;
        padding-top: 25px;
        padding-bottom: 25px;
    }
    .guide-page {
        /* 手机端页面边距也可微调 */
        padding: 20px 10px;
    }

    .activity-flex-container {
        justify-content: space-between;
        gap: 18px; /* 可以稍微调整卡片间距 */
    }

    .activity-item-wrapper {
        /* 根据上面的 gap 重新计算宽度 */
        width: calc(50% - 9px); /* 50% - (18px / 2) */
        border-radius: 8px; /* 移动端圆角可以稍小 */
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05); /* 调整阴影 */
        /* 移除 min-height，让内容自然撑高，或设置一个更合适的 min-height */
        /* min-height: 260px; */ /* 示例：根据实际内容调整 */
    }

    /* 微调图片容器和文字区域 */
    .activity-image-container {
         height: 130px; /* 调整图片高度 */
         border-radius: 8px 8px 0 0; /* 确保上面圆角 */
    }
    .activity-text-content {
         padding: 12px 15px 15px 15px; /* 调整文字区域内边距 */
    }

    /* 调整字体大小和行高，提升可读性 */
     .activity-title {
         font-size: 14px; /* 标题字号 */
         line-height: 1.4;
         -webkit-line-clamp: 2; /* 确保标题不超过2行 */
         min-height: calc(1.4em * 2); /* 保留2行空间 */
         margin-bottom: 6px; /* 减少标题和描述间距 */
     }
    .activity-description {
         font-size: 12px; /* 描述字号 */
         line-height: 1.55; /* 稍微增加行高 */
         color: #888; /* 描述文字颜色稍浅 */
         -webkit-line-clamp: 2; /* 移动端描述限制2行 */
         margin-bottom: 10px; /* 描述和日期时间距 */
     }
     .activity-datetime {
         font-size: 11px; /* 日期字号 */
         color: #b0b0b0; /* 日期文字更浅 */
     }
     .activity-datetime .el-icon {
         font-size: 13px;
         margin-right: 4px;
     }

    /* 保留 Dialog 的移动端样式调整 */
    :deep(.el-dialog.activity-dialog) { width: 95% !important; top: 3vh; }
    :deep(.activity-dialog .el-dialog__body) { padding: 20px 15px; max-height: 80vh; }
    .dialog-main-title { font-size: 18px; }
    .dialog-datetime { font-size: 13px;}
    .dialog-html-content { font-size: 14px; }
}

  </style>
