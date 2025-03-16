<template>
  <div ref="wordCloud" class="my-wordcloud" :style="{ width: '100%', height: chartHeight + 'px' }"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import * as echarts from 'echarts';
import 'echarts-wordcloud';

const props = defineProps({
  wordData: {
    type: Array,
    required: true,
  },
  colorPalette: {
    type: Array,
    default: () => [
      '#2196f3', '#4caf50', '#ff9800', '#9c27b0',
      '#f44336', '#00bcd4', '#8bc34a', '#ff5722',
      '#e91e63', '#009688', '#cddc39', '#795548',
    ],
  },
  fontFamily: {
    type: String,
    default: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
  shape:{
    type:String,
    default:'circle'
  }
});

const wordCloud = ref(null);
let myChart = null;

// Calculate chart height based on width, maintaining a 3:2 aspect ratio
const chartHeight = computed(() => {
  if (wordCloud.value) {
    return Math.round(wordCloud.value.offsetWidth * 0.66); // 2/3 of the width
  }
  return 400; // Default height
});

const option = {
  // Tooltip configuration
  tooltip: {
    show: true,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: '#ddd',
    borderWidth: 1,
    textStyle: {
      color: '#333',
      fontSize: 14,
    },
    formatter: function (params) {
      return `<strong>${params.name}</strong>: ${params.value.toFixed(2)}`;
    },
  },
  series: [{
    type: 'wordCloud',
    // Spacing between words
    gridSize: 2,
    // Minimum and maximum font size
    sizeRange: [12, 55],
    // Word rotation range (-90 to 90 degrees)
    rotationRange: [-45, 45],
    // Rotation step in degree
    rotationStep: 45,
    // Shape of the cloud ('circle', 'cardioid', 'diamond', 'square', 'triangle-forward', 'triangle', 'pentagon', 'star')
    shape: props.shape,
    // Whether to draw the words outside the container (can cause clipping)
    drawOutOfBound: false,
    // Keep aspect ratio of the word cloud shape
    keepAspect: true,
    textStyle: {
      fontFamily: props.fontFamily,
      fontWeight: 'bold',
      // Color of the words (dynamically generated)
      color: (params) => params.data.color,  // Use the assigned color
      emphasis: {
        // shadow effect when hovering
        shadowBlur: 10,
        shadowColor: '#333',
      },
    },
    // Animation configuration
    animationDurationUpdate: 800,  // Transition duration
    animationEasingUpdate: 'cubicInOut', // Transition easing
    data: [], // Data will be populated dynamically
  }],
};

const renderChart = () => {
  if (!wordCloud.value) {
    console.warn("Word cloud container element not found.");
    return;
  }

  // Dispose of the previous chart instance, if it exists
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }

  try {
      myChart = echarts.init(wordCloud.value);
  } catch(err) {
      console.warn("Echarts word cloud initialization failed.", err);
      return;
  }

  // Assign colors to each data item
  const formattedData = props.wordData.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: props.colorPalette[index % props.colorPalette.length], // Cycle through the palette
  }));

  myChart.setOption({
    ...option,
    series: [{
      ...option.series[0],
      data: formattedData,
    }],
  });
};

// Watch for changes in wordData and re-render the chart
watch(() => props.wordData, renderChart, { deep: true });

onMounted(() => {
  window.addEventListener('resize', resizeChart);
  renderChart(); // Initial render
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});

const resizeChart = () => {
  myChart && myChart.resize();
};
</script>

<style scoped>
.my-wordcloud {
  width: 100%; /* Use 100% width for responsiveness */
  /* Height is controlled dynamically by chartHeight */
}
</style>
