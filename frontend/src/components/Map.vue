<template>
  <!-- 容器 -->
  <div class="map-navigation-container-mobile">
    <!-- 顶部输入面板 -->
    <div class="top-input-panel">
       <!-- 起点行 -->
       <div class="input-row">
          <span class="input-icon start-icon" v-html="startPointSvg"></span>
          <input id="start-input-mobile" ref="startInputRef" v-model="startAddress" placeholder="输入起点或使用当前位置" @focus="inputFocus('start')" @change="commitStartAddress" autocomplete="off"/>
          <button @click="useCurrentLocationAsStart" title="使用当前位置" class="icon-btn location-btn">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg>
          </button>
       </div>
       <!-- 终点行 -->
       <div class="input-row">
         <span class="input-icon end-icon" v-html="endPointSvg"></span>
         <input id="end-input-mobile" ref="endInputRef" v-model="endAddress" placeholder="输入终点" @focus="inputFocus('end')" @change="commitEndAddress" autocomplete="off"/>
         <button @click="swapStartEnd" title="交换起终点" class="icon-btn swap-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4v3zM9 3l-3.99 4V3H3v7h2V7h2.01L11 11l4-4.01V11h2V4h-2v3.01L9 3z"/></svg>
         </button>
       </div>
       <!-- 连接线 -->
       <div class="input-connector-line"></div>
       <!-- 交通方式 Tab 和 内部规划按钮 -->
       <div class="transport-options">
         <div class="mode-tabs">
            <button :class="{ active: transportMode === 'driving' }" @click="changeTransportMode('driving')"><span v-html="drivingSvg"></span> 驾车</button>
            <button :class="{ active: transportMode === 'transit' }" @click="changeTransportMode('transit')"><span v-html="transitSvg"></span> 公交</button>
            <button :class="{ active: transportMode === 'walking' }" @click="changeTransportMode('walking')"><span v-html="walkingSvg"></span> 步行</button>
            <button :class="{ active: transportMode === 'riding' }" @click="changeTransportMode('riding')"><span v-html="ridingSvg"></span> 骑行</button>
         </div>
         <!-- 此按钮触发应用内部的百度地图路线规划 -->
         <button class="plan-btn-right" @click="handlePlanRoute" :disabled="isLoadingRoute || !endAddress">
             <span v-if="isLoadingRoute"><span class="spinner small"></span></span><span v-else>查询</span>
         </button>
       </div>
    </div>

    <!-- 地图容器 (显示百度地图) -->
    <div id="baidu-map-container-mobile" ref="mapContainerRef" class="map-display-mobile"></div>

    <!-- 地图上的浮动按钮 (控制百度地图) -->
    <div class="map-float-buttons">
       <button @click="resetMapRotation" class="float-btn reset-north-btn" title="恢复指北">
          <div class="float-btn-content">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2L6 22l6-4 6 4z"/></svg>
             <span class="float-btn-label">指北</span>
          </div>
       </button>
       <button @click="toggleFullScreen" class="float-btn fullscreen-btn" :title="isFullscreen ? '退出全屏' : '全屏'">
          <div class="float-btn-content">
             <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
             <span class="float-btn-label">{{ isFullscreen ? '退出' : '全屏' }}</span>
          </div>
       </button>
       <button @click="toggleMapType" class="float-btn map-type-btn" title="切换地图类型">
          <div class="float-btn-content">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-12zM11 6h9v5h-9V6zm-2 0v5H4V6h5zm0 7v5H4v-5h5zm2 0h9v5h-9v-5z"/></svg>
             <span class="float-btn-label">图层</span>
          </div>
       </button>
       <button @click="toggleTraffic" class="float-btn traffic-btn" :class="{ active: isTrafficLayerOn }" title="实时路况">
          <div class="float-btn-content">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18 4h-2V2h-4v2H8V2H6v2H4v18h16V4h-2zM6 8h2v2H6V8zm4 0h4v2h-4V8zm6 0h2v2h-2V8zM6 12h2v2H6v-2zm4 0h4v2h-4v-2zm6 0h2v2h-2v-2zm-6 4h4v2h-4v-2z"/></svg>
             <span class="float-btn-label">路况</span>
          </div>
       </button>
       <button @click="panToCurrentLocation" class="float-btn locate-btn" title="回到当前位置" :disabled="isLocating || !userLocation?.point || !mapInstance">
          <div class="float-btn-content">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
             <span class="float-btn-label">定位</span>
          </div>
       </button>
    </div>

    <!-- 底部结果面板 (显示百度规划结果) -->
    <div class="bottom-sheet" :class="{ 'sheet-visible': isResultPanelVisible }">
      <div class="sheet-header" @click="toggleResultPanel">
         <span class="drag-handle"></span>
         <button class="close-sheet-btn" @click.stop="toggleResultPanel" v-if="isResultPanelVisible">×</button>
      </div>
      <div class="sheet-content">
        <!-- 加载、错误、空状态 -->
        <div v-if="isLoadingRoute && !routeResults?.length" class="sheet-loading">
          <div class="spinner"></div>
          路线规划中...
        </div>
        <div v-if="routeError" class="sheet-error">
          ⚠️ {{ routeError }}
        </div>
        <div v-if="!isLoadingRoute && !routeResults?.length && !routeError && routeSearched" class="sheet-empty">
          未找到合适的路线。
        </div>

        <!-- 路线结果 -->
        <div v-if="routeResults && routeResults.length > 0" class="route-results-container">
          <!-- 方案切换 -->
          <div v-if="routeResults.length > 1" class="plan-tabs-mobile">
             <button v-for="(route, index) in routeResults" :key="'plan-mob-' + index" :class="{ active: selectedPlanIndex === index }" @click="selectPlan(index)">
               方案 {{ index + 1 }}
               <span v-if="route.duration !== null && route.duration !== undefined"> ({{ formatDurationForTab(route.duration) }})</span>
             </button>
          </div>
          <!-- 概要 -->
          <div v-if="selectedRouteSummary" class="route-summary-mobile">
             <div v-if="isLoadingRoute && routeResults?.length > 0" class="summary-loading">
                <span class="spinner small"></span> 更新概要...
             </div>
             <div v-else>
                <p>
                   <span>总览: {{ selectedRouteSummary.duration }}</span>
                   <span> / {{ selectedRouteSummary.distance }}</span>
                   <span v-if="selectedRouteSummary.costEstimate" class="cost-estimate">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 3px;"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.75-2.7 1.75-2.11 0-3.14-.91-3.24-2.4H5.23c.16 2.28 1.65 3.99 4.27 4.41V21h3v-2.15c2.13-.46 3.5-1.78 3.5-3.97 0-2.02-1.31-3.18-4.2-3.98z"/></svg>
                       {{ selectedRouteSummary.costEstimate }}
                   </span>
                </p>
                <p v-if="transportMode === 'transit' && transitRouteDescription" class="transit-desc">
                   {{ transitRouteDescription }}
                </p>
             </div>
          </div>

           <!-- 【修改】导航按钮调用高德地图 -->
           <div class="navigation-controls">
               <button @click="startAmapNavigation" class="start-nav-btn" :disabled="!startAddress || !endAddress">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                  开始导航 (高德)
               </button>
           </div>

          <!-- 详细步骤 (百度规划结果) -->
          <div v-if="isLoadingRoute && routeResults?.length > 0" class="steps-loading">
             <span class="spinner small"></span> 更新步骤...
          </div>
          <div v-else class="route-steps-mobile">
            <ul v-if="routeSteps.length > 0">
              <li v-for="(step, index) in routeSteps" :key="'step-mob-' + index" @click="highlightStepOnMap(step)" tabindex="0">
                <span class="step-icon" v-html="getStepIcon(step)"></span>
                <div class="step-details">
                  <span class="step-instruction" v-html="step.rawInstruction || step.instruction"></span>
                   <span class="step-meta"> ({{ step.formattedDistance }}{{ step.formattedDuration && step.formattedDuration !== '0秒' ? ', ' + step.formattedDuration : '' }})</span>
                </div>
              </li>
            </ul>
             <p v-else-if="!isLoadingRoute" class="no-steps">当前方案无详细步骤信息。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SDK 加载提示 & 定位加载提示 -->
    <div v-if="!isMapSdkLoaded" class="sdk-loading-overlay">
      <div class="spinner"></div>
      <div>正在加载地图组件...</div>
    </div>
    <div v-if="isLocating" class="locating-overlay">
      <div class="spinner"></div>
      <div>正在定位...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
// 引入 baiduMapUtils 用于内部地图操作和坐标转换
import * as mapUtils from '../utils/baiduMapUtils.js';

const store = useStore();

// --- Refs, Local State, UI State ---
const mapContainerRef = ref(null);
const startInputRef = ref(null);
const endInputRef = ref(null);
const startAddress = ref(store.state.map.startAddress);
const endAddress = ref(store.state.map.endAddress);
const transportMode = ref(store.state.map.transportMode || 'driving');
const isResultPanelVisible = ref(false);
const routeSearched = ref(false);
const currentMapType = ref('BMAP_NORMAL_MAP');
const isFullscreen = ref(false);

// --- 输入框图标 SVG ---
const startPointSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 11.5A2.5 2.5 0 0 1 14.5 14 2.5 2.5 0 0 1 12 16.5 2.5 2.5 0 0 1 9.5 14 2.5 2.5 0 0 1 12 11.5ZM12 2C17.523 2 22 6.477 22 12s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/></svg>`;
const endPointSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2c-4.418 0-8 3.582-8 8 0 1.427.465 2.768 1.288 3.89l6.084 8.82a1 1 0 0 0 1.62-.023l6.096-8.833C20.53 12.732 21 11.398 21 10c0-4.418-3.582-8-9-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>`;

// --- Computed Properties ---
const isLoadingRoute = computed(() => store.state.map.isLoadingRoute);
const routeError = computed(() => store.state.map.routeError);
const routeResults = computed(() => store.state.map.routeResults); // 百度规划结果
const selectedPlanIndex = computed(() => store.state.map.selectedPlanIndex);
const isMapSdkLoaded = computed(() => store.state.map.isMapSdkLoaded);
const userLocation = computed(() => store.state.map.userLocation); // 百度定位结果 BD09LL
const mapInstance = computed(() => store.state.map.mapInstance); // 百度地图实例
const isLocating = computed(() => store.state.map.isLocating);
const locationError = computed(() => store.state.map.locationError);
const isTrafficLayerOn = computed(() => store.state.map.isTrafficLayerOn);
const selectedRoute = computed(() => store.getters['map/selectedRoute']); // 百度规划结果
const selectedRouteSummary = computed(() => store.getters['map/selectedRouteSummary']);
const routeSteps = computed(() => store.getters['map/routeSteps']);
const transitRouteDescription = computed(() => {
    if (transportMode.value !== 'transit' || !selectedRoute.value?.steps) return '';
    const segments = selectedRoute.value.steps
        .filter(step => step.type === 1 || step.type === 2 || step.vehicle?.name)
        .map(step => step.vehicle?.name || '未知线路');
    return segments.filter(name => name && name !== '未知线路').join(' → ');
});

// --- Sync local state with Vuex ---
watch(startAddress, (newValue) => { if (store.state.map.startAddress !== newValue) store.commit('map/SET_START_ADDRESS', newValue); });
watch(endAddress, (newValue) => { if (store.state.map.endAddress !== newValue) store.commit('map/SET_END_ADDRESS', newValue); });
watch(transportMode, (newValue) => { if (store.state.map.transportMode !== newValue) store.commit('map/SET_TRANSPORT_MODE', newValue); });
watch(() => store.state.map.startAddress, (newVal) => { if (startAddress.value !== newVal) startAddress.value = newVal; });
watch(() => store.state.map.endAddress, (newVal) => { if (endAddress.value !== newVal) endAddress.value = newVal; });
watch(() => store.state.map.transportMode, (newVal) => { if (transportMode.value !== newVal) transportMode.value = newVal; });

// --- Lifecycle Hooks ---
let resizeObserver = null;
let resizeTimeout = null;
let fullscreenChangeListener = null;

onMounted(async () => {
  setupResizeObserver();
  setupFullscreenListener();
  try {
    const baiduMapAK = store.state.map.ak || 'YOUR_BAIDU_MAP_AK'; // 确保传入 AK
    if (!baiduMapAK || baiduMapAK === 'YOUR_BAIDU_MAP_AK') {
        console.error("错误：未配置百度地图 AK！");
        store.commit('map/SET_ROUTE_ERROR', "未配置百度地图 AK！请在Vuex或配置中设置ak。");
        store.commit('map/SET_SDK_LOADED', false);
        return; // 阻止继续执行
    }
    // 加载百度地图 SDK
    await mapUtils.loadBaiduMapScript(baiduMapAK, async () => {
      store.commit('map/SET_SDK_LOADED', true);
      await nextTick(); // 等待 DOM 更新
      if (mapContainerRef.value) {
        // 初始化百度地图
        mapUtils.initializeMap('baidu-map-container-mobile', store);
        // 监听地图实例创建成功
        const unwatchMap = watch(mapInstance, (newMap) => {
          if (newMap) {
             // 延迟确保 Autocomplete 类可用
             setTimeout(() => nextTick().then(setupAutocompletes), 150); // 稍长延迟
             // 应用交通图层状态
             if (isTrafficLayerOn.value) {
                 mapUtils.toggleTrafficLayer(newMap, true);
             }
             // 获取当前地图类型
             const mapType = newMap.getMapType();
             currentMapType.value = (mapType === window.BMAP_SATELLITE_MAP) ? 'BMAP_SATELLITE_MAP' : 'BMAP_NORMAL_MAP';
             // 取消监听
             unwatchMap();
          }
        }, { immediate: true }); // 立即执行一次检查
      } else {
        console.error("地图容器元素 'baidu-map-container-mobile' 未在 DOM 中找到。");
        store.commit('map/SET_ROUTE_ERROR', "地图容器渲染失败");
      }
    });
  } catch (error) {
    console.error("加载百度地图 SDK 或初始化过程中发生错误:", error);
    store.commit('map/SET_SDK_LOADED', false);
    store.commit('map/SET_ROUTE_ERROR', `地图初始化失败: ${error.message || '未知错误'}`);
  }
});

onUnmounted(() => {
  const currentMap = mapInstance.value;
  if (currentMap) {
    console.log("正在销毁百度地图实例...");
    try {
       mapUtils.clearMapOverlays(currentMap); // 清除覆盖物
       mapUtils.toggleTrafficLayer(currentMap, false); // 关闭交通图层
       store.commit('map/SET_TRAFFIC_LAYER_STATUS', false);
       if (typeof currentMap.destroy === 'function') {
           currentMap.destroy(); // 销毁地图实例
       }
    } catch (e) { console.error("销毁百度地图实例时出错:", e); }
    store.commit('map/SET_MAP_INSTANCE', null); // 清理 store
  }
  // 清理 ResizeObserver
  if (resizeObserver && mapContainerRef.value) {
    resizeObserver.unobserve(mapContainerRef.value);
  }
  resizeObserver = null;
  clearTimeout(resizeTimeout);
  // 清理全屏监听
  removeFullscreenListener();
});

// --- Watchers ---
watch(selectedRoute, (newRoute) => {
  // 当内部选择的百度路线方案变化时
  console.log(`内部查看的路线方案已更改为索引: ${selectedPlanIndex.value}`);
   if (!newRoute && mapInstance.value) {
       // 如果清空了路线结果，也清除地图上的覆盖物
       mapUtils.clearMapOverlays(mapInstance.value);
   }
}, { deep: false }); // 使用 shallow watch 可能更高效

// --- Methods ---

function setupResizeObserver() {
  if (typeof ResizeObserver === 'undefined' || !mapContainerRef.value) return;
  resizeObserver = new ResizeObserver(entries => {
    const currentMap = mapInstance.value;
    if (currentMap && entries.length > 0) {
      debounceCheckResize(currentMap);
    }
  });
  resizeObserver.observe(mapContainerRef.value);
}

function debounceCheckResize(mapInstanceToResize) {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (mapInstanceToResize && typeof mapInstanceToResize.checkResize === 'function') {
      try {
        mapInstanceToResize.checkResize(); // 通知百度地图容器尺寸变化
        console.log("百度地图 checkResize 调用完毕。");
      } catch (e) { console.error("执行 map.checkResize() 出错:", e); }
    }
  }, 250);
}

function setupAutocompletes() {
    const currentMap = mapInstance.value; // 百度地图实例
    if (!currentMap) { console.warn("尝试设置 Autocomplete 时百度地图实例尚未准备好。"); return; }
    // 确保 Autocomplete 类已加载
    if (!window.BMapGL?.Autocomplete) { console.warn("尝试设置 Autocomplete 时 BMapGL.Autocomplete 未定义。"); return; }

    // 起点自动完成
    if (startInputRef.value?.id) {
        try {
          mapUtils.setupAutocomplete('start-input-mobile', (address) => {
              startAddress.value = address; // 更新本地 v-model
              // store.commit('map/SET_START_ADDRESS', address); // watch 会同步
              nextTick(() => endInputRef.value?.focus()); // 聚焦终点输入框
          }, currentMap); // 使用百度地图实例
        } catch(e) { console.error("设置起点 Autocomplete 失败:", e); }
    } else { console.warn("未能找到起点输入框元素 (ref='startInputRef') 或其 ID。"); }

    // 终点自动完成
    if (endInputRef.value?.id) {
        try {
          mapUtils.setupAutocomplete('end-input-mobile', (address) => {
              endAddress.value = address; // 更新本地 v-model
              // store.commit('map/SET_END_ADDRESS', address); // watch 会同步
              nextTick(() => handlePlanRoute()); // 选中后立即进行内部百度路线规划
              endInputRef.value?.blur(); // 收起键盘
          }, currentMap); // 使用百度地图实例
        } catch(e) { console.error("设置终点 Autocomplete 失败:", e); }
    } else { console.warn("未能找到终点输入框元素 (ref='endInputRef') 或其 ID。"); }
}

function inputFocus(inputType) {
    console.log(`${inputType} input focused`);
     // 输入框获得焦点时，隐藏结果面板
     if (isResultPanelVisible.value) {
         isResultPanelVisible.value = false;
     }
}

function commitStartAddress() {
    // 当输入框失焦或回车时，显式更新 Vuex 状态
    store.commit('map/SET_START_ADDRESS', startAddress.value);
}
function commitEndAddress() {
    store.commit('map/SET_END_ADDRESS', endAddress.value);
}

function swapStartEnd() {
   const tempStart = startAddress.value;
   startAddress.value = endAddress.value;
   endAddress.value = tempStart;
   // 如果已有路线结果，并且交换后起终点都有效，则重新进行内部规划
   if (routeResults.value?.length > 0 && startAddress.value && endAddress.value) {
       handlePlanRoute();
   }
}

function changeTransportMode(newMode) {
  if (transportMode.value !== newMode) {
      transportMode.value = newMode;
      // 如果已有路线结果，并且起终点有效，则切换模式后重新进行内部规划
      if (routeResults.value?.length > 0 && startAddress.value && endAddress.value) {
           handlePlanRoute();
       }
  }
}

// 内部路线规划函数（点击“查询”按钮） - 使用百度地图 JS API
async function handlePlanRoute() {
    let start = startAddress.value;
    let end = endAddress.value;
    const mode = transportMode.value;
    const currentMap = mapInstance.value; // 百度地图实例

    if (!currentMap) { alert('内部地图尚未准备好，请稍候。'); return; }
    if (!end) { alert('请输入终点'); return; }

    // 处理起点：如果为空，尝试用当前位置
    if (!start && userLocation.value?.point) {
        console.log("内部规划：起点为空，使用当前位置 (百度坐标)。");
        start = userLocation.value.point; // 使用 BD09LL 坐标
        startAddress.value = userLocation.value.address || '当前位置'; // 更新输入框显示
    } else if (!start) {
         alert('请输入起点或等待定位成功');
         return;
    }

    startInputRef.value?.blur(); // 收起键盘
    endInputRef.value?.blur();
    routeSearched.value = true; // 标记已搜索

    try {
        // 调用 baiduMapUtils 中的 planRoute 进行内部规划
        console.log("开始内部路线规划 (百度 JS API)...");
        await mapUtils.planRoute(start, end, mode, store, currentMap);
        console.log("内部路线规划完成。");
        isResultPanelVisible.value = true; // 显示结果面板
    } catch (error) {
        console.error("内部路线规划 (百度 JS API) 失败:", error);
        store.commit('map/SET_ROUTE_ERROR', `路线规划失败: ${error.message || '未知错误'}`);
        isResultPanelVisible.value = true; // 显示错误面板
    }
}

// 使用当前位置（百度定位）作为起点
function useCurrentLocationAsStart() {
    const loc = userLocation.value; // 百度定位结果 (BD09LL)
    const currentMap = mapInstance.value; // 百度地图实例

    if (loc?.point && currentMap) {
        startAddress.value = loc.address || '当前位置';
        store.commit('map/SET_START_ADDRESS', startAddress.value); // 更新 Vuex
        mapUtils.panTo(loc.point, currentMap, 16); // 在百度地图上移动
        // 如果终点已填，自动触发内部规划
        if (endAddress.value) {
             handlePlanRoute();
        } else {
             nextTick(() => endInputRef.value?.focus()); // 否则聚焦终点
        }
    } else if (isLocating.value) {
        alert("正在定位中，请稍候...");
    } else {
        alert(locationError.value || "无法获取当前位置。请检查定位权限或网络，然后重试。");
        // 尝试重新定位
        if (currentMap) {
             mapUtils.getCurrentLocation(store, currentMap);
        }
    }
}

// 平移到当前位置（百度定位点）
function panToCurrentLocation() {
    const loc = userLocation.value; // 百度定位结果 (BD09LL)
    const currentMap = mapInstance.value; // 百度地图实例
    if (loc?.point && currentMap) {
        mapUtils.panTo(loc.point, currentMap, 16); // 在百度地图上移动并放大
    } else if (isLocating.value) {
         alert("正在定位中，请稍候...");
    } else {
         alert(locationError.value || "当前位置无效或地图未准备好");
         if (currentMap) {
            mapUtils.getCurrentLocation(store, currentMap); // 尝试重新定位
         }
    }
}

// 选择内部规划的方案（百度路线结果）
function selectPlan(index) {
  if (selectedPlanIndex.value !== index) {
      store.commit('map/SET_SELECTED_PLAN_INDEX', index);
      const planner = mapUtils.getLastPlanner(); // 获取百度 JS API 的 planner
      if (planner && typeof planner.selectPlan === 'function') {
           try {
               planner.selectPlan(index); // 让百度 JS API 高亮地图上的路线
               console.log(`百度 JS API: 已切换到方案 ${index}`);
           } catch (e) {
               console.error("调用百度 planner.selectPlan 出错:", e);
               // 尝试手动调整视野作为后备
               const newRoute = store.state.map.routeResults?.[index];
               if (newRoute?.steps?.length > 0) {
                   const pointsToFit = newRoute.steps.flatMap(step => step.pathPoints || []).filter(p => p); // 需要 BD09LL points
                   if (pointsToFit.length > 0 && mapInstance.value) {
                       // 确保 pointsToFit 包含 BMapGL.Point 对象，如果不是需要转换
                       // 如果 extractStepsFromJsPlan 返回的是 {lng, lat}，需要转换回 BMapGL.Point
                       // const bmapPoints = pointsToFit.map(p => new window.BMapGL.Point(p.lng, p.lat));
                       // mapUtils.setMapView(bmapPoints, mapInstance.value);
                       // 如果已经是 BMapGL.Point 数组，则直接使用
                       mapUtils.setMapView(pointsToFit, mapInstance.value);
                   }
               }
           }
      } else {
           console.warn("无法自动高亮方案，百度 planner 不可用或不支持 selectPlan。尝试手动调整视野。");
           // 手动调整视野
           const newRoute = store.state.map.routeResults?.[index];
           if (newRoute?.steps?.length > 0) {
               const pointsToFit = newRoute.steps.flatMap(step => step.pathPoints || []).filter(p => p);
               if (pointsToFit.length > 0 && mapInstance.value) {
                    // 同上，确保是 BMapGL.Point 数组
                    mapUtils.setMapView(pointsToFit, mapInstance.value);
               }
           }
      }
  }
}

// 点击内部规划的步骤时，在百度地图上高亮
function highlightStepOnMap(step) {
 console.log("点击百度路线步骤:", step.instruction);
 const currentMap = mapInstance.value; // 百度地图实例
 // 获取步骤的 BD09LL 坐标
 const position = step.position || step.pathPoints?.[0]; // 假设是 {lng, lat} 或 BMapGL.Point

 if (currentMap && position?.lng && position?.lat) {
     const targetZoom = currentMap.getZoom() < 17 ? 17 : currentMap.getZoom(); // 放大到更详细级别
     mapUtils.panTo(position, currentMap, targetZoom); // 在百度地图上平移
     console.log("已平移到百度路线步骤位置:", position);
     // 可选：添加临时标记
 } else {
     console.warn("无法获取百度步骤的有效地理位置信息进行平移:", step);
 }
}

function toggleResultPanel() {
    isResultPanelVisible.value = !isResultPanelVisible.value;
}

// 切换百度地图的交通图层
function toggleTraffic() {
    const currentMap = mapInstance.value; // 百度地图实例
    if (!currentMap) return;
    const newState = !isTrafficLayerOn.value;
    mapUtils.toggleTrafficLayer(currentMap, newState);
    store.commit('map/SET_TRAFFIC_LAYER_STATUS', newState);
}

// 格式化时长（用于Tab显示）
function formatDurationForTab(seconds) {
    if (seconds === null || seconds === undefined) return '?';
    if (seconds < 60) return '<1分钟';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    let durationStr = '';
    if (hours > 0) durationStr += `${hours}小时`;
    if (minutes > 0 && (hours === 0 || (seconds % 3600) / 60 >= 1)) {
        // 避免显示 1小时60分钟
        if (!(hours > 0 && minutes === 60)) {
           durationStr += `${minutes}分钟`;
        } else if (hours > 0 && minutes === 60) {
           // 如果刚好是 1小时60分钟，修正为 2小时
           durationStr = `${hours + 1}小时`;
        }
    }
    // 如果计算后为空（例如刚好 1 小时），确保返回小时数
    return durationStr || (hours === 1 ? '1小时' : '<1分钟');
}

// --- 图标 SVG ---
const drivingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
const transitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M21 11.18V9c0-2.76-2.24-5-5-5H8C5.24 4 3 6.24 3 9v2.18C4.13 11.59 5 12.69 5 14v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4c0-1.31.87-2.41 2-2.82zM8.5 18c-.83 0-1.5-.67-1.5-1.5S7.67 15 8.5 15s1.5.67 1.5 1.5S9.33 18 8.5 18zm6.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 9H5V7h14v2z"/></svg>`;
const walkingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 11.7V17h2v-5l3.1-3.1c.2-.2.3-.5.3-.7s-.1-.5-.3-.7c-.4-.4-1-.4-1.4 0L9.8 8.9zM18.8 13.3l-2.6 2.6V22h-2v-7.5l2.6-2.6c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4z"/></svg>`;
const ridingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 6.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-2.12 4.14L11.83 9.1c-.94-.94-2.46-.94-3.4 0L7.3 10.23c-.93.94-.93 2.46 0 3.4l1.58 1.58c.75.75 1.85 1 2.99.81l2.64-2.64c.94-.94.94-2.46 0-3.4zm-4.13 8.99L7.8 18.18c-.59-.59-.59-1.54 0-2.12l1.41-1.41c.59-.59 1.54-.59 2.12 0l1.45 1.45c.31.31.72.45 1.12.45.36 0 .7-.11 1-.34l1.41-1.41c.59-.59.59-1.54 0-2.12l-4.24-4.24c-.59-.59-1.54-.59-2.12 0L7.8 13.62c-1.17 1.17-1.17 3.07 0 4.24l1.45 1.45c.59.59 1.54.59 2.12 0z"/></svg>`;
const subwaySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2c-4.42 0-8 .5-8 4v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V6c0-3.5-3.58-4-8-4zm0 2c3.47 0 6 .39 6 2H6c0-1.61 2.53-2 6-2zm-4 7h8v2H8v-2zm8 4H8v-2h8v2z"/></svg>';
const defaultSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';

// 根据百度步骤类型获取图标
function getStepIcon(step) {
    let type = step.type; // 百度 JS API 的 type
    const instruction = step.instruction || "";
    switch (type) {
        case 4: return `<span class="svg-icon walk-icon">${walkingSvg}</span>`; // 步行
        case 1: return `<span class="svg-icon subway-icon">${subwaySvg}</span>`; // 地铁
        case 2: return `<span class="svg-icon bus-icon">${transitSvg}</span>`;   // 公交
        case 3: return `<span class="svg-icon drive-icon">${drivingSvg}</span>`; // 驾车
        case 5: return `<span class="svg-icon ride-icon">${ridingSvg}</span>`;  // 骑行
        default: // 尝试通过文本判断
            if (instruction.includes('步行')) return `<span class="svg-icon walk-icon">${walkingSvg}</span>`;
            if (instruction.includes('地铁') || instruction.includes('轨道')) return `<span class="svg-icon subway-icon">${subwaySvg}</span>`;
            if (instruction.includes('公交') || instruction.includes('乘坐')) return `<span class="svg-icon bus-icon">${transitSvg}</span>`;
            if (instruction.includes('驾车') || instruction.includes('行驶')) return `<span class="svg-icon drive-icon">${drivingSvg}</span>`;
            if (instruction.includes('骑行')) return `<span class="svg-icon ride-icon">${ridingSvg}</span>`;
            return `<span class="svg-icon default-icon">${defaultSvg}</span>`; // 默认
    }
}

// --- 【【【核心修改：调用高德地图 URI API 进行导航】】】 ---
/**
 * @description 尝试使用高德地图 URI API 调起外部地图应用或网页进行导航。
 */
async function startAmapNavigation() {
    const currentSelectedBaiduRoute = selectedRoute.value; // 内部百度规划结果
    const currentMode = transportMode.value;
    const currentBaiduLoc = userLocation.value; // 百度定位结果 (BD09LL)
    const startInputVal = startAddress.value?.trim();
    const endInputVal = endAddress.value?.trim();

    console.log("[AMap Nav] 开始导航 (高德)。状态:", { hasBaiduRoute: !!currentSelectedBaiduRoute, mode: currentMode, hasBaiduLocation: !!currentBaiduLoc?.point, startInput: startInputVal, endInput: endInputVal });

    // 1. 检查基本条件: 必须有起点和终点信息才能导航
    if (!startInputVal && !currentBaiduLoc?.point && !currentSelectedBaiduRoute?.origin) {
         alert('导航需要起点信息，请输入、使用当前位置或先进行路线查询。');
         console.warn("[AMap Nav] Aborted: Missing origin information.");
         return;
    }
    if (!endInputVal && !currentSelectedBaiduRoute?.destination) {
        alert('导航需要终点信息，请输入或先进行路线查询。');
        console.warn("[AMap Nav] Aborted: Missing destination information.");
        return;
    }

    let originBd09 = null; // {lng, lat} in BD09LL
    let destinationBd09 = null; // {lng, lat} in BD09LL
    let originName = '起点';
    let destinationName = endInputVal || '终点';

    try {
        // --- 2. 确定起点和终点的 BD09LL 坐标和名称 ---
        // 确定起点 BD09LL
        if (currentSelectedBaiduRoute?.origin?.point) {
            originBd09 = currentSelectedBaiduRoute.origin.point; // 结构是 {lng, lat}
            originName = currentSelectedBaiduRoute.origin.title || startInputVal || originName;
            console.log("[AMap Nav] 使用内部百度路线的起点坐标 (BD09LL):", originBd09);
        } else if ((!startInputVal || startInputVal.includes('当前位置') || startInputVal.includes('我的位置')) && currentBaiduLoc?.point) {
            originBd09 = currentBaiduLoc.point; // 结构是 {lng, lat}
            originName = currentBaiduLoc.address || '我的位置';
            console.log("[AMap Nav] 使用百度定位的坐标作为起点 (BD09LL):", originBd09);
        } else if (startInputVal) {
            originName = startInputVal;
            console.log("[AMap Nav] 尝试 Geocode 起点地址 (获取 BD09LL):", originName);
            originBd09 = await mapUtils.geocode(originName, store); // geocode 返回 {lng, lat} BD09LL
            console.log("[AMap Nav] Geocode 起点成功 (BD09LL):", originBd09);
        } else { throw new Error('无法确定导航起点坐标'); }

        // 确定终点 BD09LL
        if (currentSelectedBaiduRoute?.destination?.point) {
            destinationBd09 = currentSelectedBaiduRoute.destination.point;
            destinationName = currentSelectedBaiduRoute.destination.title || endInputVal || destinationName;
            console.log("[AMap Nav] 使用内部百度路线的终点坐标 (BD09LL):", destinationBd09);
        } else if (endInputVal) { // 终点输入框必须有值
            destinationName = endInputVal;
            console.log("[AMap Nav] 尝试 Geocode 终点地址 (获取 BD09LL):", destinationName);
            destinationBd09 = await mapUtils.geocode(destinationName, store); // geocode 返回 {lng, lat} BD09LL
            console.log("[AMap Nav] Geocode 终点成功 (BD09LL):", destinationBd09);
        } else { throw new Error('无法确定导航终点坐标'); } // 理论上不会执行

        // --- 3. 将 BD09LL 坐标转换为 GCJ02 坐标 ---
        if (!originBd09 || !destinationBd09) throw new Error("缺少有效的起点或终点 BD09LL 坐标");

        console.log("[AMap Nav] 准备将 BD09LL 转换为 GCJ02...");
        const [originGcj02, destinationGcj02] = await Promise.all([
            mapUtils.convertBd09ToGcj02(originBd09),
            mapUtils.convertBd09ToGcj02(destinationBd09)
        ]);
        console.log("[AMap Nav] 坐标转换完成 (GCJ02):", { originGcj02, destinationGcj02 });

        // --- 4. 构造高德地图导航 URI ---
        const aMapBaseUrl = 'https://uri.amap.com/navigation';
        let aMapMode = '0'; // 高德模式: 0驾车, 1公交, 2步行, 3骑行
        switch (currentMode) {
            case 'driving': aMapMode = '0'; break;
            case 'transit': aMapMode = '1'; break;
            case 'walking': aMapMode = '2'; break;
            case 'riding': aMapMode = '3'; break; // 高德支持骑行模式
        }
        // 高德参数格式: lon,lat,name (经度在前!)
        const fromParam = `${originGcj02.lng},${originGcj02.lat},${encodeURIComponent(originName)}`;
        const toParam = `${destinationGcj02.lng},${destinationGcj02.lat},${encodeURIComponent(destinationName)}`;
        // 应用来源标识 (替换为你自己的)
        const srcParam = 'mypage'; // 【【【请替换为你自己的高德应用来源标识】】】
        const callnativeParam = '1'; // 尝试调起 App

        // 组装 URL，明确指定坐标系为gcj02
        const navigationUrl = `${aMapBaseUrl}?from=${fromParam}&to=${toParam}&mode=${aMapMode}&coordinate=gcj02&src=${srcParam}&callnative=${callnativeParam}`;

        console.log("[AMap Nav] 生成的高德导航 URI:", navigationUrl);
        try { console.log("[AMap Nav] Decoded URI:", decodeURIComponent(navigationUrl)); } catch(e){}

        // --- 5. 打开高德地图 URI ---
        console.log("[AMap Nav] 尝试打开高德导航链接...");
        const mapWindow = window.open(navigationUrl, '_blank');
        if (!mapWindow) {
            console.error("[AMap Nav] window.open 返回 null 或 false, 可能被阻止。");
            throw new Error("无法打开导航页面，请检查浏览器是否阻止了弹出窗口。");
        }
        console.log("[AMap Nav] 高德导航链接已尝试打开。");
        isResultPanelVisible.value = false; // 隐藏结果面板

    } catch (error) {
        console.error("[AMap Nav] 启动高德导航过程中发生错误:", error);
        alert(`启动高德导航失败: ${error.message}`); // 向用户显示错误
    }
}


 // --- 地图类型、重置方向、全屏等功能 ---
 function toggleMapType() {
    const currentMap = mapInstance.value; // 百度地图实例
    if (!currentMap || !window.BMapGL) return;
    const currentBMapType = currentMap.getMapType();
    const normalType = window.BMAP_NORMAL_MAP;
    const satelliteType = window.BMAP_SATELLITE_MAP;
    const nextTypeId = currentBMapType === normalType ? 'BMAP_SATELLITE_MAP' : 'BMAP_NORMAL_MAP';
    try {
        mapUtils.setMapType(currentMap, nextTypeId); // 调用百度工具函数
        currentMapType.value = nextTypeId;
        console.log(`百度地图类型已切换为: ${nextTypeId}`);
    } catch (e) {
        console.error("切换百度地图类型失败:", e);
        alert("切换地图类型失败");
    }
}

function resetMapRotation() {
    const currentMap = mapInstance.value; // 百度地图实例
    if (currentMap) {
        console.log("重置百度地图方向和倾角...");
        try {
            currentMap.flyTo(currentMap.getCenter(), currentMap.getZoom(), {
                 tilt: 0, heading: 0, duration: 500
            });
        } catch (e) {
             console.error("重置百度地图方向失败 (flyTo):", e);
             try { currentMap.setHeading(0); currentMap.setTilt(0); } catch(e2){} // Fallback
        }
    }
}

function toggleFullScreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
    const element = document.documentElement; // 对整个页面全屏
    if (element.requestFullscreen) element.requestFullscreen();
    else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
    else if (element.msRequestFullscreen) element.msRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  console.log("全屏状态改变:", isFullscreen.value);
  // 全屏变化后，让百度地图检查尺寸
  nextTick(() => {
      mapInstance.value?.checkResize();
  });
}
function setupFullscreenListener() {
    removeFullscreenListener();
    fullscreenChangeListener = handleFullscreenChange;
    document.addEventListener('fullscreenchange', fullscreenChangeListener);
    document.addEventListener('webkitfullscreenchange', fullscreenChangeListener);
    document.addEventListener('mozfullscreenchange', fullscreenChangeListener);
    document.addEventListener('MSFullscreenChange', fullscreenChangeListener);
}
function removeFullscreenListener() {
    if (fullscreenChangeListener) {
        document.removeEventListener('fullscreenchange', fullscreenChangeListener);
        document.removeEventListener('webkitfullscreenchange', fullscreenChangeListener);
        document.removeEventListener('mozfullscreenchange', fullscreenChangeListener);
        document.removeEventListener('MSFullscreenChange', fullscreenChangeListener);
        fullscreenChangeListener = null;
    }
}

</script>

<style scoped>
/* --- CSS 样式 (保持不变) --- */
/* (此处省略与上一版本相同的 CSS 代码, 请确保你复制了完整的样式部分) */
/* 基础布局 */
.map-navigation-container-mobile { display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; position: relative; background-color: #f4f4f4; }
/* 顶部输入面板 */
.top-input-panel { position: absolute; top: 10px; left: 10px; right: 10px; background-color: rgba(255, 255, 255, 0.95); border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); padding: 10px 12px; z-index: 10; display: flex; flex-direction: column; gap: 8px; }
.input-row { display: flex; align-items: center; position: relative; }
.input-icon { flex-shrink: 0; width: 20px; height: 20px; margin-right: 8px; display: inline-flex; align-items: center; justify-content: center; }
.input-icon.start-icon svg { color: #3385ff; } .input-icon.end-icon svg { color: #ff5a5a; }
.input-connector-line { position: absolute; left: 10px; top: 28px; height: 22px; width: 1px; background-color: #ccc; z-index: -1; }
.top-input-panel input { flex-grow: 1; padding: 10px 8px; border: none; border-bottom: 1px solid #eee; font-size: 15px; outline: none; background: transparent; }
.top-input-panel input:focus { border-bottom-color: #007bff; }
.icon-btn { background: none; border: none; padding: 5px; margin-left: 5px; cursor: pointer; color: #666; line-height: 1; }
.icon-btn:hover { color: #007bff; } .location-btn { color: #3385ff; } .swap-btn { color: #888; padding: 8px 5px; }
/* 交通方式和规划按钮 */
.transport-options { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
.mode-tabs { display: flex; gap: 5px; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 2px; scrollbar-width: none; -ms-overflow-style: none; }
.mode-tabs::-webkit-scrollbar { display: none; }
.mode-tabs button { padding: 6px 10px; border: 1px solid #ccc; border-radius: 15px; background-color: #fff; color: #555; cursor: pointer; font-size: 13px; white-space: nowrap; transition: background-color 0.2s, color 0.2s, border-color 0.2s; display: flex; align-items: center; gap: 4px; }
.mode-tabs button span[data-v-html] { display: inline-flex; align-items: center; }
.mode-tabs button span[data-v-html] svg { fill: #777; transition: fill 0.2s; width: 16px; height: 16px; margin-right: 3px; }
.mode-tabs button:hover { background-color: #f0f0f0; border-color: #bbb; }
.mode-tabs button.active { background-color: #e6f7ff; border-color: #91d5ff; color: #096dd9; font-weight: 500; }
.mode-tabs button.active span[data-v-html] svg { fill: #096dd9; }
.plan-btn-right { padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 18px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s; display: flex; align-items: center; justify-content: center; margin-left: 10px; flex-shrink: 0; }
.plan-btn-right:hover { background-color: #0056b3; } .plan-btn-right:disabled { background-color: #a0cfff; cursor: not-allowed; }
.plan-btn-right .spinner.small { margin-right: 0; border-left-color: #fff; } .plan-btn-right span:not(.spinner) { line-height: 1; }
/* 地图显示区域 */
.map-display-mobile { flex-grow: 1; width: 100%; position: relative; min-height: 0; }
#baidu-map-container-mobile { width: 100%; height: 100%; }
:deep(#baidu-map-container-mobile .BMap_cpyCtrl), :deep(#baidu-map-container-mobile .anchorBL) { z-index: 1 !important; bottom: 10px !important; left: 10px !important; right: auto !important; top: auto !important; }
/* 地图浮动按钮 */
.map-float-buttons { position: absolute; top: 190px; right: 15px; z-index: 5; display: flex; flex-direction: column; gap: 15px; }
.float-btn { width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.95); border: none; border-radius: 50%; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); cursor: pointer; display: flex; justify-content: center; align-items: center; padding: 0; color: #555; transition: background-color 0.2s, color 0.2s; overflow: hidden; }
.float-btn:hover { background-color: #f0f0f0; } .float-btn:disabled { background-color: #e9ecef; color: #adb5bd; cursor: not-allowed; opacity: 0.7; }
.float-btn-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.float-btn-content svg { width: 22px; height: 22px; fill: currentColor; } .float-btn-label { font-size: 10px; line-height: 1.1; color: #666; white-space: nowrap; }
.locate-btn:hover .float-btn-content, .reset-north-btn:hover .float-btn-content, .fullscreen-btn:hover .float-btn-content, .map-type-btn:hover .float-btn-content, .traffic-btn:not(.active):hover .float-btn-content { color: #007bff; }
.traffic-btn.active { background-color: #e0f3ff; border: 1px solid #91d5ff; } .traffic-btn.active .float-btn-content { color: #1677ff; } .traffic-btn.active .float-btn-content svg { fill: #1677ff; }
/* 底部结果面板 */
.bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background-color: #ffffff; border-top-left-radius: 16px; border-top-right-radius: 16px; box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.1); z-index: 20; transform: translateY(100%); transition: transform 0.3s ease-out; max-height: 80vh; display: flex; flex-direction: column; }
.bottom-sheet.sheet-visible { transform: translateY(0); }
.sheet-header { padding: 8px 15px; text-align: center; border-bottom: 1px solid #eee; cursor: grab; position: relative; flex-shrink: 0; touch-action: none; }
.sheet-header:active { cursor: grabbing; }
.drag-handle { display: inline-block; width: 40px; height: 5px; background-color: #ccc; border-radius: 3px; }
.close-sheet-btn { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: none; border: none; font-size: 24px; color: #aaa; cursor: pointer; padding: 5px; line-height: 1; }
.sheet-content { overflow-y: auto; flex-grow: 1; padding: 0px 15px 15px 15px; -webkit-overflow-scrolling: touch; }
.sheet-content::-webkit-scrollbar { width: 5px; } .sheet-content::-webkit-scrollbar-track { background: #f1f1f1; } .sheet-content::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; } .sheet-content::-webkit-scrollbar-thumb:hover { background: #aaa; }
.sheet-loading, .sheet-error, .sheet-empty { padding: 40px 15px; text-align: center; color: #888; font-size: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 150px; }
.sheet-error { color: #dc3545; font-weight: bold; } .sheet-loading .spinner { margin-bottom: 10px; }
/* 结果容器 */
.route-results-container { padding-top: 10px; }
.plan-tabs-mobile { display: flex; margin-bottom: 12px; border-bottom: 1px solid #dee2e6; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; }
.plan-tabs-mobile::-webkit-scrollbar { display: none; }
.plan-tabs-mobile button { flex: 1 0 auto; padding: 10px 12px; border: none; background: none; cursor: pointer; font-size: 14px; color: #6c757d; border-bottom: 3px solid transparent; transition: color 0.2s, border-color 0.2s; text-align: center; white-space: nowrap; margin-right: 8px; }
.plan-tabs-mobile button:last-child { margin-right: 0; }
.plan-tabs-mobile button:hover { color: #0056b3; } .plan-tabs-mobile button.active { color: #007bff; font-weight: bold; border-bottom-color: #007bff; }
.plan-tabs-mobile button span { font-size: 0.85em; color: #6c757d; margin-left: 4px; font-weight: normal; }
/* 路线概要 */
.route-summary-mobile { padding: 8px 0; color: #333; border-bottom: 1px dashed #eee; margin-bottom: 10px; font-size: 15px; }
.route-summary-mobile p { margin: 3px 0; line-height: 1.5; } .route-summary-mobile span { margin-right: 8px; }
.cost-estimate { font-size: 0.9em; color: #555; } .cost-estimate svg { color: #f39c12; margin-right: 3px; vertical-align: -2px; }
.transit-desc { font-size: 0.9em; color: #666; margin-top: 5px; line-height: 1.4; }
.summary-loading { display: flex; align-items: center; color: #555; padding: 5px 0; }
.summary-loading .spinner.small { margin-right: 5px; }
/* 导航按钮 */
.navigation-controls { padding: 12px 0; display: flex; justify-content: center; margin-top: 0px; margin-bottom: 10px; }
.start-nav-btn { padding: 10px 25px; font-size: 16px; font-weight: bold; border: none; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background-color 0.2s; background-color: #1677ff; color: white; }
.start-nav-btn svg { fill: currentColor; } .start-nav-btn:hover { background-color: #0056b3; } .start-nav-btn:disabled { background-color: #a0cfff; cursor: not-allowed; }
/* 路线步骤 */
.route-steps-mobile { margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; }
.route-steps-mobile ul { list-style: none; padding: 0; margin: 0; }
.route-steps-mobile li { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; cursor: pointer; transition: background-color 0.2s; }
.route-steps-mobile li:last-child { border-bottom: none; } .route-steps-mobile li:hover { background-color: #f8f9fa; }
.step-icon { flex-shrink: 0; width: 28px; text-align: center; margin-right: 10px; padding-top: 2px; color: #666; line-height: 1; }
.step-icon .svg-icon svg { width: 20px; height: 20px; vertical-align: middle; }
.step-icon .walk-icon svg { fill: #2E8B57; } .step-icon .subway-icon svg { fill: #FF4500; } .step-icon .bus-icon svg { fill: #4169E1; } .step-icon .drive-icon svg { fill: #1890ff; } .step-icon .ride-icon svg { fill: #DA70D6; } .step-icon .default-icon svg { fill: #666; }
.step-details { flex-grow: 1; overflow: hidden; }
.step-instruction { display: block; font-size: 15px; line-height: 1.5; color: #333; word-break: break-word; }
.step-instruction :deep(b), .step-instruction :deep(strong) { color: #0056b3; font-weight: 600; }
.step-instruction :deep(font[color="#00B050"]) { color: #28a745 !important; } .step-instruction :deep(font[color="#FF0000"]) { color: #dc3545 !important; }
.step-meta { display: block; color: #888; font-size: 0.85em; margin-top: 4px; }
.no-steps { color: #888; font-size: 14px; padding: 15px 0; text-align: center; }
.steps-loading { display: flex; align-items: center; justify-content: center; color: #555; padding: 10px 0; font-size: 14px; }
.steps-loading .spinner.small { margin-right: 8px; }
/* 加载提示 */
.sdk-loading-overlay, .locating-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 1.1em; font-weight: 500; color: #444; z-index: 100; text-align: center; padding: 20px; box-sizing: border-box; }
.locating-overlay .spinner { border-left-color: #28a745; } .sdk-loading-overlay > div, .locating-overlay > div { margin-top: 12px; }
/* Spinner 动画 */
.spinner { border: 4px solid rgba(0, 0, 0, 0.1); border-left-color: #007bff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; display: inline-block; }
.spinner.small { border-width: 3px; width: 16px; height: 16px; } @keyframes spin { to { transform: rotate(360deg); } }
/* 百度地图输入提示 */
:deep(.tangram-suggestion-main) { z-index: 2000 !important; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; }
:deep(.tangram-suggestion-container) { max-height: 300px; overflow-y: auto; }
:deep(.tangram-suggestion-item) { padding: 8px 12px; }
:deep(.tangram-suggestion-item-selected) { background-color: #f0f0f0; }
</style>