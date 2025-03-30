<template>
    <div class="search-panel-inner">
      <!-- 输入区域 (结构基本不变) -->
      <div class="input-area">
        <div class="input-group start-end-group">
          <!-- 起点输入 -->
          <div class="address-input">
            <el-input
              id="start-input-el"
              ref="startInputRef"
              :model-value="startAddress"
              @update:modelValue="emit('update:startAddress', $event)"
              placeholder="输入起点或使用当前位置"
              clearable
              size="large"
            >
              <template #prefix>
                <span class="input-label">起</span>
              </template>
              <template #append>
                <el-tooltip content="使用当前位置" placement="bottom">
                  <el-button :icon="Location" @click="emit('use-current-location')" :disabled="isLocating"></el-button>
                </el-tooltip>
              </template>
            </el-input>
          </div>
          <!-- 交换按钮 -->
          <el-tooltip content="交换起点终点" placement="bottom">
            <el-button circle :icon="EpSwitch" @click="emit('swap-addresses')" class="swap-btn"></el-button>
          </el-tooltip>
          <!-- 终点输入 -->
          <div class="address-input">
            <el-input
              id="end-input-el"
              ref="endInputRef"
              :model-value="endAddress"
              @update:modelValue="emit('update:endAddress', $event)"
              placeholder="输入终点"
              clearable
              size="large"
            >
              <template #prefix>
                <span class="input-label">终</span>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 模式与策略选择 -->
        <div class="input-group mode-policy-group">
          <el-select
            :model-value="transportMode"
            @update:modelValue="emit('update:transportMode', $event)"
            placeholder="出行方式"
            size="large" class="mode-select">
            <el-option label="驾车" value="driving"></el-option>
            <el-option label="步行" value="walking"></el-option>
            <el-option label="骑行" value="riding"></el-option>
            <el-option label="公交" value="transit"></el-option>
          </el-select>

          <!-- 策略选择 (根据模式显示) -->
          <el-select
            v-if="transportMode === 'driving'"
            :model-value="drivingPolicy"
            @update:modelValue="emit('update:drivingPolicy', $event)"
            placeholder="驾车策略" size="large" class="policy-select">
            <el-option v-for="policy in drivingPolicies" :key="'dr-' + policy.value" :label="policy.label" :value="policy.value"></el-option>
          </el-select>
          <el-select
            v-if="transportMode === 'transit'"
            :model-value="transitPolicy"
            @update:modelValue="emit('update:transitPolicy', $event)"
            placeholder="公交策略" size="large" class="policy-select">
            <el-option v-for="policy in transitPolicies" :key="'tr-' + policy.value" :label="policy.label" :value="policy.value"></el-option>
          </el-select>

          <!-- 规划按钮 -->
          <el-button
            type="primary"
            @click="emit('plan-route')"
            :loading="isLoadingRoute"
            :disabled="!isMapReady || isLoadingRoute || !endAddress || (!startAddress && !userLocation?.point)"
            size="large"
            class="plan-btn"
          >
            {{ isLoadingRoute ? '规划中...' : '规划路线' }}
          </el-button>
        </div>
      </div>

      <!-- 结果显示区域 (使用滚动条包裹) -->
      <el-scrollbar class="results-display-scrollbar" :always="true">
        <div class="results-display">
          <!-- 初始提示 -->
          <div v-if="!isLoadingRoute && !routeResults?.length && !routeError" class="initial-prompt">
            请输入起点终点，开始路线规划。
          </div>
          <!-- 加载中 -->
          <div v-if="isLoadingRoute && !routeResults?.length" class="loading">
            <el-icon class="is-loading" :size="20"><Loading /></el-icon>
            <span>路线规划中，请稍候...</span>
          </div>
          <!-- 错误提示 -->
          <el-alert v-if="routeError" :title="'规划失败: ' + routeError" type="error" show-icon :closable="false" class="error-alert"></el-alert>

          <!-- 路线结果 -->
          <div v-if="routeResults && routeResults.length > 0" class="route-results-container">
            <!-- 方案切换 Tabs -->
            <el-tabs
               v-if="routeResults.length > 1"
               :model-value="selectedPlanIndex"
               @update:modelValue="emit('select-plan', $event)"
               type="card" class="plan-tabs">
              <el-tab-pane
                v-for="(route, index) in routeResults"
                :key="'plan-tab-' + index"
                :label="`方案 ${index + 1} (${formatDurationForTab(route.duration)})`"
                :name="index"
              ></el-tab-pane>
            </el-tabs>
            <h3 v-else-if="routeResults.length === 1" class="single-plan-title">推荐方案</h3>

            <!-- 当前方案概要 -->
             <div v-if="selectedRouteSummaryComputed" class="route-summary">
              <p>
                <el-tooltip content="总距离" placement="top"><span class="summary-item"><el-icon><Location /></el-icon> {{ selectedRouteSummaryComputed.distance }}</span></el-tooltip>
                <el-tooltip content="预计时间" placement="top"><span class="summary-item"><el-icon><Clock /></el-icon> {{ selectedRouteSummaryComputed.duration }}</span></el-tooltip>
                <el-tooltip content="预估费用 (仅供参考)" placement="top"><span class="summary-item"><el-icon><Money /></el-icon> {{ selectedRouteSummaryComputed.cost }}</span></el-tooltip>
              </p>
            </div>

            <!-- 详细步骤 -->
            <div class="route-steps">
              <h4>路线详情</h4>
              <ul v-if="routeStepsComputed && routeStepsComputed.length > 0">
                <li v-for="(step, index) in routeStepsComputed" :key="'step-' + index" @click="emit('highlight-step', step)" tabindex="0" class="step-item" title="点击在地图上定位此步骤起点">
                  <div class="step-line">
                    <span class="step-dot"></span>
                    <span v-if="index < routeStepsComputed.length - 1" class="step-connector"></span>
                  </div>
                  <div class="step-content">
                    <span class="step-instruction" v-html="step.rawInstruction || step.instruction"></span>
                    <span class="step-vehicle-info" v-if="step.vehicleInfo">{{ step.vehicleInfo }}</span>
                    <span class="step-meta"> ({{ step.formattedDistance }}{{ step.formattedDuration !== '小于1分钟' ? ', 约 ' + step.formattedDuration : '' }})</span>
                  </div>
                </li>
              </ul>
              <p v-else class="no-steps">当前方案无详细步骤信息。</p>
            </div>
          </div> <!-- end v-if routeResults -->
        </div>
      </el-scrollbar> <!-- end results-display scrollbar -->
    </div>
  </template>

  <script setup>
  import { ref, computed, watch, nextTick } from 'vue';
  import { ElMessage, ElAlert, ElInput, ElSelect, ElOption, ElButton, ElTooltip, ElScrollbar, ElTabs, ElTabPane, ElIcon } from 'element-plus';
  import { Location, Switch as EpSwitch, Clock, Money, Loading } from '@element-plus/icons-vue';
  import * as mapUtils from '../utils/baiduMapUtils.js';

  // --- Props Definition (保持不变) ---
  const props = defineProps({
    isLoadingRoute: Boolean,
    routeError: String,
    routeResults: Array,
    selectedPlanIndex: Number,
    userLocation: Object,
    isLocating: Boolean,
    isMapReady: Boolean,
    startAddress: String,
    endAddress: String,
    transportMode: String,
    drivingPolicy: Number,
    transitPolicy: Number,
    drivingPolicies: Array,
    transitPolicies: Array,
    baiduMapInstance: Object // Map instance needed for Autocomplete
  });

  // --- Emits Definition (保持不变) ---
  const emit = defineEmits([
    'update:startAddress',
    'update:endAddress',
    'update:transportMode',
    'update:drivingPolicy',
    'update:transitPolicy',
    'plan-route',
    'use-current-location',
    'select-plan',
    'highlight-step',
    'swap-addresses',
  ]);

  // --- Refs for Input Elements (保持不变) ---
  const startInputRef = ref(null);
  const endInputRef = ref(null);

  // --- Computed Properties (保持不变, 确保依赖 props 的数据能正确计算) ---
  const selectedRoute = computed(() => props.routeResults?.[props.selectedPlanIndex] || null);

  // 格式化函数 (从 Vuex getter 逻辑复制或确保传入已格式化数据)
  const formatDuration = (seconds) => {
      if (seconds == null) return '未知';
      if (seconds < 60) return '小于1分钟';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      let durationStr = '';
      if (hours > 0) durationStr += `${hours}小时`;
      if (minutes > 0) { if (hours === 0 || (seconds % 3600) / 60 >= 1 ) durationStr += `${minutes}分钟`; }
      if (!durationStr && hours > 0) durationStr = `${hours}小时`;
      return durationStr || '小于1分钟';
  };
  const formatDistance = (meters) => {
      if (meters == null) return '未知';
      if (meters < 10) return '几米';
      if (meters < 1000) return `${Math.round(meters)}米`;
      return `${(meters / 1000).toFixed(1)}公里`;
  };
   const formatDurationForTab = (seconds) => { // Tab 的格式化
      if (seconds == null) return '?';
      if (seconds < 60) return '<1分';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60); // 用四舍五入可能更紧凑
      let durationStr = '';
      if (hours > 0) durationStr += `${hours}时`;
      if (minutes > 0 || hours === 0) { // 保证至少有分钟或小于1分
         if (minutes > 0 || (!durationStr && seconds < 3600) ) { // 仅当有分钟数，或总时间小于1小时且没显示小时时显示分钟
             durationStr += `${minutes}分`;
         }
      }
      return durationStr || '<1分'; // 最终兜底
  };
  const calculateCost = (route) => {
       if (!route) return '未知'; // 添加空检查
       if (props.transportMode === 'transit') return '费用未知'; // JS API 限制
       if (props.transportMode === 'driving') return '费用未知'; // JS API 限制
       return '免费'; // 步行/骑行
  };

  const selectedRouteSummaryComputed = computed(() => {
        const route = selectedRoute.value;
        if (!route) return null;
        return {
            distance: formatDistance(route.distance),
            duration: formatDuration(route.duration),
            cost: calculateCost(route),
        };
    });

   const routeStepsComputed = computed(() => {
        const steps = selectedRoute.value?.steps || [];
        return steps.map((step, index) => {
             let vehicleInfo = '';
             if (step.vehicle && props.transportMode === 'transit') {
                vehicleInfo = `乘坐 ${step.vehicle.name || '未知线路'}`;
                if (step.vehicle.start_name || step.vehicle.end_name) { vehicleInfo += ` (${step.vehicle.start_name || '?'} 上车 - ${step.vehicle.end_name || '?'} 下车)`; }
                if (step.vehicle.stop_num != null) { vehicleInfo += `, ${step.vehicle.stop_num} 站`; }
             }
            return {
                ...step,
                rawInstruction: step.rawInstruction || step.instruction,
                formattedDistance: formatDistance(step.distance),
                formattedDuration: formatDuration(step.duration),
                vehicleInfo: vehicleInfo,
                stepIndex: index + 1,
             };
       });
    });


  // --- Methods (setupAutocompletes 保持不变) ---
  function setupAutocompletes() {
    nextTick(() => {
      const currentMap = props.baiduMapInstance;
      if (!currentMap) {
        console.warn("SearchPanel Autocomplete: Map instance not ready.");
        return;
      }
      const startInputElement = startInputRef.value?.$refs?.input;
      const endInputElement = endInputRef.value?.$refs?.input;

      if (startInputElement) {
        startInputElement.id = startInputElement.id || 'start-input-el-native';
        try {
          mapUtils.setupAutocomplete(startInputElement.id, (address) => {
            emit('update:startAddress', address);
          }, currentMap);
        } catch (e) { console.error("Failed to setup start autocomplete:", e); }
      } else { console.warn("SearchPanel: Native start input element not found via ref."); }

      if (endInputElement) {
        endInputElement.id = endInputElement.id || 'end-input-el-native';
        try {
          mapUtils.setupAutocomplete(endInputElement.id, (address) => {
            emit('update:endAddress', address);
          }, currentMap);
        } catch (e) { console.error("Failed to setup end autocomplete:", e); }
      } else { console.warn("SearchPanel: Native end input element not found via ref."); }
    });
  }

  // --- Lifecycle and Watchers (保持不变) ---
  watch(() => props.baiduMapInstance, (newMapInstance) => {
      if (newMapInstance) {
          console.log("SearchPanel: Map instance available, setting up Autocomplete.");
          setupAutocompletes();
      }
  }, { immediate: true });

  </script>

  <style scoped>
  /* --- Panel Root --- */
  .search-panel-inner {
   height: 100%; /* 占满父容器 (mobile-search-panel) */
   display: flex;
   flex-direction: column;
   /* 移除 overflow，由父容器或内部滚动条处理 */
   background-color: #fff;
}

/* --- Input Area --- */
.input-area {
  padding: 15px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* 输入区域高度固定，不压缩 */
}
.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.start-end-group {
  align-items: stretch; /* 让输入框等高 */
}
.address-input {
  flex-grow: 1;
  display: flex;
}
.address-input .el-input {
    flex-grow: 1; /* 输入框占满空间 */
}
/* Input Labels ( 起 / 终 ) - 样式移到 Map.vue 的 :deep */
.input-label {
    /* 这里的样式可能不再需要，已由 Map.vue 的 :deep 控制 */
}

.swap-btn {
  margin: 0 8px;
  align-self: center; /* 垂直居中 */
}
.mode-policy-group {
  gap: 8px; /* 元素间距 */
  flex-wrap: wrap; /* 允许换行 */
}
.mode-select {
  width: 100px; /* 固定宽度 */
  flex-shrink: 0;
}
.policy-select {
  flex-grow: 1; /* 占据剩余空间 */
  min-width: 110px; /* 最小宽度 */
  flex-shrink: 1; /* 允许收缩 */
}
.plan-btn {
  flex-shrink: 0; /* 不收缩 */
}

/* --- Results Display Area --- */
.results-display-scrollbar {
    flex-grow: 1; /* 占据剩余垂直空间 */
    min-height: 0; /* 重要：允许 flex item 收缩 */
}
/* 为滚动内容添加内边距 */
/* 注意：:deep() 用于穿透 ElScrollbar 的内部结构 */
.results-display-scrollbar :deep(.el-scrollbar__wrap) {
    padding: 5px 15px 15px 15px; /* 顶部减少一点padding */
    box-sizing: border-box;
}
.results-display {
  /* 结果内容的样式 */
}
.initial-prompt { text-align: center; color: #909399; margin-top: 20px; font-size: 14px; }
.loading { display: flex; align-items: center; justify-content: center; color: #606266; padding: 20px 0; font-size: 14px; text-align: center; }
.loading .el-icon { margin-right: 8px; }
.error-alert { margin-bottom: 15px; }

.route-results-container { }
.plan-tabs { margin-bottom: 15px; }
.plan-tabs :deep(.el-tabs__item) {
    font-size: 14px;
    height: 36px; /* 减小 tab 高度 */
    line-height: 36px;
    padding: 0 12px; /* 减小 tab 内边距 */
}

.single-plan-title {
    font-size: 1.1em;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px; /* 减小间距 */
    padding-bottom: 8px; /* 减小间距 */
    border-bottom: 1px solid #eee;
}
/* Route Summary Box */
.route-summary {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #e9ecef;
}
.route-summary p {
  margin: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap; /* 允许换行 */
  gap: 8px 12px; /* 调整间距 */
}
.summary-item {
  display: inline-flex;
  align-items: center;
  font-size: 13px; /* 稍小字体 */
  color: #495057;
  white-space: nowrap;
}
.summary-item .el-icon {
  margin-right: 5px;
  color: #17a2b8;
  font-size: 15px;
}
/* Route Steps */
.route-steps { margin-top: 10px; }
.route-steps h4 {
    font-size: 1em;
    font-weight: 600;
    color: #343a40;
    margin-bottom: 10px;
}
.route-steps ul {
    list-style: none;
    padding: 0;
    margin: 0;
    position: relative;
}
/* Individual Step Item */
.step-item {
    display: flex;
    align-items: flex-start;
    padding: 8px 0 8px 28px; /* 调整左内边距 */
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 3px;
    margin-bottom: 4px; /* 减小间距 */
}
.step-item:hover,
.step-item:focus { /* 添加 focus 样式 */
    background-color: #e9ecef;
    outline: none; /* 移除默认轮廓 */
}

/* Step Timeline (Dot and Line) */
.step-line {
    position: absolute;
    left: 10px;
    top: 12px;  /* 调整以对齐文本 */
    bottom: -4px; /* 调整连接线底部 */
    display: flex;
    flex-direction: column;
    align-items: center;
}
.step-dot {
    width: 10px; /* 缩小点 */
    height: 10px;
    background-color: #adb5bd;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #adb5bd;
    z-index: 1;
    flex-shrink: 0;
}
.step-item:first-child .step-dot { background-color: #28a745; box-shadow: 0 0 0 1px #28a745; }
.step-item:last-child .step-dot { background-color: #dc3545; box-shadow: 0 0 0 1px #dc3545; }
.step-connector {
    width: 2px;
    background-color: #dee2e6;
    flex-grow: 1;
    margin-top: 3px; /* 调整点线下间距 */
}
.step-item:last-child .step-connector { display: none; }

/* Step Content Text */
.step-content {
    flex-grow: 1;
    font-size: 14px;
    line-height: 1.5; /* 调整行高 */
}
.step-instruction {
    display: block;
    color: #343a40;
    margin-bottom: 3px;
}
.step-instruction :deep(b),
.step-instruction :deep(strong) {
    color: #007bff;
    font-weight: 600;
}
.step-instruction :deep(font[color="#00B050"]) { color: #28a745 !important; }
.step-instruction :deep(font[color="#FF0000"]) { color: #dc3545 !important; }
.step-instruction :deep(font[color="#333333"]) { color: #495057 !important; }

/* Vehicle Info Box */
.step-vehicle-info {
    display: inline-block;
    color: #495057;
    font-size: 0.85em; /* 稍小 */
    margin: 3px 0;
    background-color: #e9ecef;
    padding: 2px 6px; /* 调整内边距 */
    border-radius: 3px;
    border-left: 3px solid #ffc107;
}
.step-meta {
    display: block;
    color: #6c757d;
    font-size: 0.8em; /* 更小 */
    margin-top: 2px;
}
.no-steps { color: #6c757d; font-size: 14px; padding: 15px 0; text-align: center; }

/* --- Mobile Adjustments --- */
@media (max-width: 768px) {
  .input-label {
      /* 移动端标签样式已在 Map.vue 中通过 :deep 控制 */
  }
  .mode-select {
      width: auto; /* 自适应宽度 */
      flex-basis: 90px; /* 基础宽度 */
      flex-grow: 0; /* 不增长 */
  }
  .policy-select {
      width: auto;
      flex-basis: 110px;
      flex-grow: 1; /* 允许增长 */
   }

   /* Button 换行显示 */
   .plan-btn {
    width: 100%; /* 占满整行 */
    margin-top: 10px; /* 与上方元素间距 */
    order: 3; /* 强制按钮排在最后 */
   }
    .mode-policy-group {
        justify-content: space-between; /* 分散对齐 */
    }
    /* 保证在小屏下select不会挤在一起 */
    .mode-policy-group > .el-select {
      min-width: 90px; /* 最小宽度保证能放下文字 */
    }

   /* 移动端结果列表字体可以小一点 */
   .summary-item { font-size: 12px; }
   .step-content { font-size: 13px; }
   .step-vehicle-info { font-size: 0.8em; }
   .step-meta { font-size: 0.75em; }
}

/* Scrollbar Styling (保持不变) */
.results-display-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
    width: 5px; /* 细一点 */
}
.results-display-scrollbar :deep(.el-scrollbar__thumb) {
    background: #ced4da;
    border-radius: 3px;
    transition: background-color 0.2s;
}
.results-display-scrollbar :deep(.el-scrollbar__thumb:hover) {
    background: #adb5bd;
}
  </style>
