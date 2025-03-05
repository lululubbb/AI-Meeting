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

  import { useStore } from 'vuex';
  import FirestoreService from '../services/FirestoreService';
  
  const meetingsChart = ref(null);
  const durationChart = ref(null);
  let meetingsChartInstance = null;
  let durationChartInstance = null;
  const store = useStore();
  
  const userId = store.getters.getUser?.uid;
  
  onMounted(() => {
    if (userId) {
      fetchData();
    }
  });
  
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
      if (!meeting || (!meeting.startTime && !meeting.joinTime)) {
        console.warn('Invalid meeting data:', meeting);
        return;
      }
      const timestamp = meeting.joinTime || meeting.startTime;
      if (typeof timestamp.toDate !== 'function') {
        console.warn('startTime 或 joinTime 类型错误', timestamp);
        return;
      }
      const date = timestamp.toDate().toLocaleDateString();
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
            const [year, month, day] = value.split('/');
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
        const formattedDate = date.split('/').join('-');
        try {
          window.open(`/history?date=${formattedDate}`, '_blank');
        } catch (error) {
          console.error("跳转到历史记录页面失败:", error);
          // ElMessage.error('跳转失败') // 如果有 ElMessage
        }
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
          if (!meeting || (!meeting.startTime && !meeting.joinTime) || !meeting.endTime) {
              console.warn('Invalid meeting data for duration calculation:', meeting);
              return;
          }
          const startTimestamp = meeting.joinTime || meeting.startTime;
  
          // 检查 timestamp 是否是有效的 Firestore Timestamp 对象
          if (!startTimestamp || typeof startTimestamp.toDate !== 'function') {
              console.warn('Invalid timestamp:', startTimestamp, 'in meeting:', meeting);
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
        left: 'left',
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
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
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
    font-size: 16px;
    color: var(--text-color); /* 全局文本颜色 */
    text-align: center;
    font-weight: 600;
  }
  
  .chart {
    width: 100%;
    height: 250px; /* 增加高度 */
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .data-summary {
      padding: 10px;
    }
  
    .chart-container h3 {
      font-size: 14px;
    }
  
    .chart {
      height: 200px;
    }
  }
  
  @media (max-width: 480px) {
    .data-summary {
      padding: 5px;
      margin-right: -10px;
  
    }
    .chart {
      height: 180px;
    }
  }
  </style>
  