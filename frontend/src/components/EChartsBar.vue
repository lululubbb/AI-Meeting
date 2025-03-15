<template>
    <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch, nextTick } from 'vue';
  import * as echarts from 'echarts';
  
  const props = defineProps({
    chartData: Object,
  });
  
  const chartContainer = ref(null);
  let myChart = null;
  
  onMounted(() => {
    nextTick(() => {
      initChart();
    });
  });
  
  watch(
    () => props.chartData,
    (newData) => {
      if (myChart && newData) {
        updateChart(newData);
      }
    },
    { deep: true }
  );
  
  function initChart() {
    if (chartContainer.value) {
      myChart = echarts.init(chartContainer.value);
      if (props.chartData) {
        updateChart(props.chartData);
      }
    }
  }
  
  function updateChart(data) {
    const option = {
      title: {
        text: '各时间段发言字数统计',
        left: 'center',
        textStyle: {
          color: '#343a40',
        },
      },
      tooltip: {
        trigger: 'axis', // 触发类型：坐标轴触发
        formatter: function (params) {
          let tooltipContent = `<strong>${params[0].name}</strong><br/>`; //x轴的名称
          params.forEach(param => {
            tooltipContent += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>${param.seriesName}: ${param.value}<br/>`;
          });
          return tooltipContent;
        }
      },
      legend: {
        data: data.legendData,
        top: 'bottom',
        textStyle: {
          color: '#343a40',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false, // X 轴从 0 开始
        data: data.xAxisData,
        axisLabel: {
          color: '#343a40',
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#343a40',
        },
      },
      series: data.seriesData,
    };
  
    myChart.setOption(option);
  }
  </script>
  