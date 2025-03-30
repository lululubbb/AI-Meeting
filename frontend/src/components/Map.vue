<template>
  <div class="map-navigation-container-mobile" :class="{ navigating: isNavigating }">
    <!-- 顶部输入面板 -->
    <div class="top-input-panel">
      <!-- 起点行 -->
      <div class="input-row">
        <!-- 修改：使用SVG图标替换span -->
        <span class="input-icon start-icon" v-html="startPointSvg"></span>
        <input
          id="start-input-mobile"
          ref="startInputRef"
          v-model="startAddress"
          placeholder="输入起点或使用当前位置"
          @focus="inputFocus('start')"
          @change="commitStartAddress"
          autocomplete="off"
        />
        <button @click="useCurrentLocationAsStart" title="使用当前位置" class="icon-btn location-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg>
        </button>
      </div>
      <!-- 终点行 -->
      <div class="input-row">
        <!-- 修改：使用SVG图标替换span -->
        <span class="input-icon end-icon" v-html="endPointSvg"></span>
        <input
          id="end-input-mobile"
          ref="endInputRef"
          v-model="endAddress"
          placeholder="输入终点"
          @focus="inputFocus('end')"
          @change="commitEndAddress"
          autocomplete="off"
        />
         <button @click="swapStartEnd" title="交换起终点" class="icon-btn swap-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4v3zM9 3l-3.99 4V3H3v7h2V7h2.01L11 11l4-4.01V11h2V4h-2v3.01L9 3z"/></svg>
         </button>
      </div>
      <!-- 连接线 (可选，根据视觉效果决定是否保留或修改样式) -->
      <div class="input-connector-line"></div>
      <!-- 交通方式 Tab 和规划按钮 -->
      <div class="transport-options">
          <div class="mode-tabs">
              <button :class="{ active: transportMode === 'driving' }" @click="changeTransportMode('driving')">
                  <span v-html="drivingSvg"></span> 驾车
              </button>
              <button :class="{ active: transportMode === 'transit' }" @click="changeTransportMode('transit')">
                  <span v-html="transitSvg"></span> 公交
              </button>
              <button :class="{ active: transportMode === 'walking' }" @click="changeTransportMode('walking')">
                  <span v-html="walkingSvg"></span> 步行
              </button>
              <button :class="{ active: transportMode === 'riding' }" @click="changeTransportMode('riding')">
                  <span v-html="ridingSvg"></span> 骑行
              </button>
          </div>
          <!-- 查路线按钮移到右侧 -->
          <button class="plan-btn-right" @click="handlePlanRoute" :disabled="isLoadingRoute || !endAddress">
              <span v-if="isLoadingRoute"><span class="spinner small"></span></span>
              <span v-else>查询</span>
          </button>
      </div>
    </div>

    <!-- 地图容器 -->
    <div id="baidu-map-container-mobile" ref="mapContainerRef" class="map-display-mobile"></div>

    <!-- 地图上的浮动按钮 -->
    <div class="map-float-buttons">
        <!-- 新增：指北针/重置方向按钮 -->
        <button @click="resetMapRotation" class="float-btn reset-north-btn" title="恢复指北">
            <div class="float-btn-content">
                <!-- 指北针 SVG 图标 -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2L6 22l6-4 6 4z"/></svg>
                <span class="float-btn-label">指北</span>
            </div>
        </button>

        <!-- 新增：全屏切换按钮 -->
        <button @click="toggleFullScreen" class="float-btn fullscreen-btn" :title="isFullscreen ? '退出全屏' : '全屏'">
             <div class="float-btn-content">
                <!-- 根据 isFullscreen 状态切换图标 -->
                <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                <span class="float-btn-label">{{ isFullscreen ? '退出' : '全屏' }}</span>
             </div>
        </button>

        <!-- 地图类型切换 -->
       <button @click="toggleMapType" class="float-btn map-type-btn" title="切换地图类型">
           <div class="float-btn-content"> {/* 包裹图标和文字 */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-12zM11 6h9v5h-9V6zm-2 0v5H4V6h5zm0 7v5H4v-5h5zm2 0h9v5h-9v-5z"/></svg>
               <span class="float-btn-label">图层</span> {/* 添加文字标签 */}
           </div>
       </button>
        <!-- 路况按钮 -->
       <button @click="toggleTraffic" class="float-btn traffic-btn" :class="{ active: isTrafficLayerOn }" title="实时路况">
           <div class="float-btn-content"> {/* 包裹图标和文字 */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18 4h-2V2h-4v2H8V2H6v2H4v18h16V4h-2zM6 8h2v2H6V8zm4 0h4v2h-4V8zm6 0h2v2h-2V8zM6 12h2v2H6v-2zm4 0h4v2h-4v-2zm6 0h2v2h-2v-2zm-6 4h4v2h-4v-2z"/></svg>
               <span class="float-btn-label">路况</span> {/* 添加文字标签 */}
           </div>
       </button>
       <!-- 定位按钮 -->
       <button @click="panToCurrentLocation" class="float-btn locate-btn" title="回到当前位置" :disabled="isLocating || !userLocation?.point || !mapInstance">
            <div class="float-btn-content"> {/* 包裹图标和文字 */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                <span class="float-btn-label">定位</span> {/* 添加文字标签 */}
            </div>
       </button>
    </div>

    <!-- 底部结果面板 (BottomSheet) -->
    <div class="bottom-sheet" :class="{ 'sheet-visible': isResultPanelVisible }">
      <!-- 面板控制器 -->
      <div class="sheet-header" @click="toggleResultPanel">
        <span class="drag-handle"></span>
        <button class="close-sheet-btn" @click.stop="toggleResultPanel" v-if="isResultPanelVisible">×</button>
      </div>

      <!-- 面板内容 -->
      <div class="sheet-content">
        <!-- 加载与错误状态 -->
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
            <button
              v-for="(route, index) in routeResults"
              :key="'plan-mob-' + index"
              :class="{ active: selectedPlanIndex === index }"
              @click="selectPlan(index)"
            >
              方案 {{ index + 1 }}
              <span v-if="route.duration !== null && route.duration !== undefined"> ({{ formatDurationForTab(route.duration) }})</span>
            </button>
          </div>

          <!-- 当前方案概要 -->
          <div v-if="selectedRouteSummary" class="route-summary-mobile">
             <div v-if="isLoadingRoute && routeResults?.length > 0" class="summary-loading">
                <span class="spinner small"></span> 更新概要...
             </div>
             <div v-else>
                <p>
                    <span>总览: {{ selectedRouteSummary.duration }}</span>
                    <span> / {{ selectedRouteSummary.distance }}</span>
                    <!-- 费用显示 (JS API无法精确获取) -->
                    <span v-if="selectedRouteSummary.costEstimate" class="cost-estimate">
                       <!-- 替换为合适的钱袋图标 SVG -->
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 3px;"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.75-2.7 1.75-2.11 0-3.14-.91-3.24-2.4H5.23c.16 2.28 1.65 3.99 4.27 4.41V21h3v-2.15c2.13-.46 3.5-1.78 3.5-3.97 0-2.02-1.31-3.18-4.2-3.98z"/></svg>
                       {{ selectedRouteSummary.costEstimate }}
                    </span>
                </p>
                <!-- 公交线路的起止站信息 -->
                <p v-if="transportMode === 'transit' && transitRouteDescription" class="transit-desc">
                    {{ transitRouteDescription }}
                </p>
             </div>
          </div>

           <!-- 新增：开始/结束导航按钮 -->
           <div class="navigation-controls">
               <button v-if="!isNavigating" @click="startNavigation" class="start-nav-btn" :disabled="!selectedRoute">
                  <!-- 开始导航图标 SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                  开始导航
               </button>
               <button v-else @click="stopNavigation" class="stop-nav-btn">
                   <!-- 停止/删除图标 SVG -->
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                   结束导航
               </button>
           </div>

          <!-- 详细步骤 -->
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

    <!-- SDK 加载提示 -->
    <div v-if="!isMapSdkLoaded" class="sdk-loading-overlay">
      <div class="spinner"></div>
      <div>正在加载地图组件...</div>
    </div>
    <!-- 定位加载提示 -->
    <div v-if="isLocating" class="locating-overlay">
      <div class="spinner"></div>
      <div>正在定位...</div>
    </div>
     <!-- 新增：导航模式下的地图覆盖层（可选） -->
    <div v-if="isNavigating" class="navigation-overlay">
        <button @click="stopNavigation" class="nav-exit-btn">退出导航</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import * as mapUtils from '../utils/baiduMapUtils.js'; // 确认路径正确

const store = useStore();

// --- Refs ---
const mapContainerRef = ref(null);
const startInputRef = ref(null);
const endInputRef = ref(null);

// --- Local State (mirrors Vuex for v-model) ---
const startAddress = ref(store.state.map.startAddress);
const endAddress = ref(store.state.map.endAddress);
const transportMode = ref(store.state.map.transportMode || 'driving'); // 默认驾车

// --- UI State ---
const isResultPanelVisible = ref(false); // 底部结果面板默认隐藏
const routeSearched = ref(false); // 标记是否执行过路线搜索
const currentMapType = ref('BMAP_NORMAL_MAP'); // 地图类型状态
const isFullscreen = ref(false); // 新增：全屏状态
// --- 新增：导航状态 ---
const isNavigating = ref(false); // 是否处于导航模式
const navigationWatchId = ref(null); // Geolocation watch id
const userMarker = ref(null); // 用户位置标记的引用
// 新增：用于存储路线规划返回的 Polyline 对象引用 (如果需要手动高亮或操作)
// 注意：JS API 的自动渲染通常不直接返回路线的 Polyline 对象引用
// let routePolyline = null; // 暂时不用，因为依赖 API 自动渲染

// --- 输入框图标 SVG ---
const startPointSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 11.5A2.5 2.5 0 0 1 14.5 14 2.5 2.5 0 0 1 12 16.5 2.5 2.5 0 0 1 9.5 14 2.5 2.5 0 0 1 12 11.5ZM12 2C17.523 2 22 6.477 22 12s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/></svg>`; // 一个带中心点的圆圈
const endPointSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2c-4.418 0-8 3.582-8 8 0 1.427.465 2.768 1.288 3.89l6.084 8.82a1 1 0 0 0 1.62-.023l6.096-8.833C20.53 12.732 21 11.398 21 10c0-4.418-3.582-8-9-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>`; // 地图标记图标

// --- Computed Properties from Vuex Store ---
const isLoadingRoute = computed(() => store.state.map.isLoadingRoute);
const routeError = computed(() => store.state.map.routeError);
const routeResults = computed(() => store.state.map.routeResults);
const selectedPlanIndex = computed(() => store.state.map.selectedPlanIndex);
const isMapSdkLoaded = computed(() => store.state.map.isMapSdkLoaded);
const userLocation = computed(() => store.state.map.userLocation);
const mapInstance = computed(() => store.state.map.mapInstance);
const isLocating = computed(() => store.state.map.isLocating);
const locationError = computed(() => store.state.map.locationError);
const isTrafficLayerOn = computed(() => store.state.map.isTrafficLayerOn); // 从 store 获取路况状态

const selectedRoute = computed(() => store.getters['map/selectedRoute']);
const selectedRouteSummary = computed(() => store.getters['map/selectedRouteSummary']);
const routeSteps = computed(() => store.getters['map/routeSteps']);

// 公交路线概要描述
const transitRouteDescription = computed(() => {
    if (transportMode.value !== 'transit' || !selectedRoute.value?.steps) {
        return '';
    }
    // 尝试生成类似 "地铁亦庄线 -> 地铁10号线 -> 300路内环" 的描述
    const segments = selectedRoute.value.steps
        .filter(step => step.type === 1 || step.type === 2) // 1: 地铁, 2: 公交
        .map(step => step.vehicle?.name || '未知线路');
    return segments.join(' → ');
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
// 新增：全屏变化监听器引用
let fullscreenChangeListener = null;
onMounted(async () => {
setupResizeObserver();
  // 新增：监听全屏变化事件
  setupFullscreenListener();

try {
  await mapUtils.loadBaiduMapScript(store.state.map.ak, async () => {
    store.commit('map/SET_SDK_LOADED', true);
    await nextTick();
    if (mapContainerRef.value) {
      mapUtils.initializeMap('baidu-map-container-mobile', store);

      // 监控地图实例，一旦可用就设置自动完成
      const unwatchMap = watch(mapInstance, (newMap) => {
        if (newMap) {
           nextTick().then(setupAutocompletes);
           // 恢复路况状态
           if (isTrafficLayerOn.value) {
               mapUtils.toggleTrafficLayer(newMap, true);
           }
           // 如果 Vuex 中有已选路线，尝试在地图上绘制 (可能由JS API自动完成)
           // if (selectedRoute.value) {
           //    mapUtils.drawRouteOnMap(selectedRoute.value, newMap, store);
           // }
           // 获取地图当前类型 (如果之前设置过)
           const mapType = newMap.getMapType();
           if (mapType === window.BMAP_SATELLITE_MAP) {
               currentMapType.value = 'BMAP_SATELLITE_MAP';
           } else {
               currentMapType.value = 'BMAP_NORMAL_MAP';
           }
           // 停止监控
           unwatchMap();
        }
      }, { immediate: true });

      } else {
        console.error("地图容器元素 'baidu-map-container-mobile' 未在 DOM 中找到。");
        store.commit('map/SET_ROUTE_ERROR', "地图容器渲染失败");
      }
    });
  } catch (error) {
    console.error("加载百度地图 SDK 失败:", error);
    store.commit('map/SET_SDK_LOADED', false);
    store.commit('map/SET_ROUTE_ERROR', `地图SDK加载失败: ${error.message || '未知错误'}`);
  }
});

onUnmounted(() => {
  stopNavigation(); // 确保停止导航监听
  const currentMap = mapInstance.value;
  if (currentMap) {
    console.log("正在销毁地图实例...");
    try {
       mapUtils.clearMapOverlays(currentMap); // 清理覆盖物
       // 关闭路况图层
       mapUtils.toggleTrafficLayer(currentMap, false);
       store.commit('map/SET_TRAFFIC_LAYER_STATUS', false);
       if (typeof currentMap.destroy === 'function') {
           currentMap.destroy();
       }
    } catch (e) { console.error("销毁地图实例时出错:", e); }
    store.commit('map/SET_MAP_INSTANCE', null);
  }
  if (resizeObserver && mapContainerRef.value) {
    resizeObserver.unobserve(mapContainerRef.value);
  }
  resizeObserver = null;
  clearTimeout(resizeTimeout);
    // 新增：移除全屏变化监听
    removeFullscreenListener();
});

// --- Watchers ---
watch(selectedRoute, (newRoute, oldRoute) => {
  // 依赖 JS API 自动渲染，这里通常不需要做太多事
  // 或许可以在这里更新 UI 状态，但不需要手动绘制地图
  console.log(`Selected route plan changed to index: ${selectedPlanIndex.value}`);
   if (!newRoute && mapInstance.value) {
       // 如果结果被清空，确保地图也被清除
       mapUtils.clearMapOverlays(mapInstance.value);
   }
   // 停止导航如果路线变了
   if (isNavigating.value && newRoute !== oldRoute) {
        stopNavigation();
   }
}, { deep: false });

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
        mapInstanceToResize.checkResize();
        // 移动端通常不需要复杂的 margins 调整 viewport，autoViewport 基本够用
      } catch (e) { console.error("执行 map.checkResize() 出错:", e); }
    }
  }, 250);
}

// 设置输入框的自动完成提示
function setupAutocompletes() {
    const currentMap = mapInstance.value;
    if (!currentMap) {
        console.warn("尝试设置 Autocomplete 时地图实例尚未准备好。");
        return;
    }
    // 注意这里使用了新的 input ID
    if (startInputRef.value?.id) {
        mapUtils.setupAutocomplete('start-input-mobile', (address) => {
            startAddress.value = address;
            // 选择后可以考虑自动触发规划或聚焦到终点框
            nextTick(() => endInputRef.value?.focus());
        }, currentMap); // 传入 map 实例限制范围
    } else {
        console.warn("未能找到起点输入框元素 (ref='startInputRef') 或其 ID。");
    }
     if (endInputRef.value?.id) {
        mapUtils.setupAutocomplete('end-input-mobile', (address) => {
            endAddress.value = address;
            // 选择终点后自动规划
             nextTick(() => handlePlanRoute());
             endInputRef.value?.blur(); // 关闭键盘
        }, currentMap);
    } else {
        console.warn("未能找到终点输入框元素 (ref='endInputRef') 或其 ID。");
    }
}

// 输入框获取焦点时的处理 (例如：滚动页面确保输入框可见)
function inputFocus(inputType) {
    console.log(`${inputType} input focused`);
    // 可以在这里添加逻辑，例如向上滚动页面以避免键盘遮挡输入框
    // window.scrollTo(0, 0); // 简单示例：滚动到顶部
    // 获取焦点时如果面板是展开的，可以先收起
     if (isResultPanelVisible.value) {
         isResultPanelVisible.value = false;
     }
}

// 提交起点/终点 (在 change 事件或失焦时)
function commitStartAddress() {
    store.commit('map/SET_START_ADDRESS', startAddress.value);
}
function commitEndAddress() {
    store.commit('map/SET_END_ADDRESS', endAddress.value);
}

// 交换起终点
function swapStartEnd() {
   const tempStart = startAddress.value;
   startAddress.value = endAddress.value;
   endAddress.value = tempStart;
   // 如果正在显示路线，需要重新规划
   if (routeResults.value?.length > 0) {
       handlePlanRoute();
   }
}

// --- 修改：处理交通方式 Tab 按钮点击 ---
function changeTransportMode(newMode) {
  if (transportMode.value !== newMode) {
      transportMode.value = newMode; // 更新本地状态，触发 watcher 同步 store
       // 如果已有结果，自动重新规划
      if (routeResults.value?.length > 0 && startAddress.value && endAddress.value) {
           handlePlanRoute();
       }
  }
}

// --- 修改：移除旧的 handleTransportModeChange ---
// function handleTransportModeChange() { ... }

// 触发路线规划 (使用 JS API)
async function handlePlanRoute() {
  // 停止当前可能正在进行的导航
  if (isNavigating.value) {
      stopNavigation();
  }

  let start = startAddress.value;
  let end = endAddress.value;
  const mode = transportMode.value;
  const currentMap = mapInstance.value;

  if (!currentMap) {
      alert('地图尚未准备好，请稍候。');
      return;
  }
  if (!end) {
    alert('请输入终点');
    return;
  }
  // 如果起点为空，尝试使用当前位置
  if (!start && userLocation.value?.point) {
      console.log("起点为空，使用当前位置。");
      start = userLocation.value.point; // 直接使用坐标点
      // 可选：更新输入框为“当前位置”
      startAddress.value = userLocation.value.address || '当前位置';
  } else if (!start) {
       alert('请输入起点或等待定位成功');
       return;
  }

  // 收起键盘
  startInputRef.value?.blur();
  endInputRef.value?.blur();
  routeSearched.value = true; // 标记已执行搜索

  try {
    // 调用 JS API 路线规划 (baiduMapUtils.planRoute 已改为使用 JS API)
    const results = await mapUtils.planRoute(start, end, mode, store, currentMap);

    // 规划成功后显示底部面板
    if (results && results.length > 0) {
        isResultPanelVisible.value = true;
        // JS API 的 renderOptions 会自动绘制
    } else {
        // 规划成功但无结果
        isResultPanelVisible.value = true; // 仍然显示面板，提示无结果
    }
  } catch (error) {
    // 错误已在 planRoute 内部提交到 store.state.map.routeError
    console.error("路线规划失败:", error);
    isResultPanelVisible.value = true; // 显示面板以展示错误信息
  }
}

// 使用当前位置作为起点
function useCurrentLocationAsStart() {
    const loc = userLocation.value;
    const currentMap = mapInstance.value;

    if (loc?.point && currentMap) {
        startAddress.value = loc.address || '当前位置';
        store.commit('map/SET_START_ADDRESS', startAddress.value); // 同步 store
        mapUtils.panTo(loc.point, currentMap); // 平移到当前位置
        // 如果终点已填，可以考虑自动规划
        if (endAddress.value) {
             handlePlanRoute();
        } else {
             // 聚焦到终点输入框
             nextTick(() => endInputRef.value?.focus());
        }
    } else if (isLocating.value) {
        alert("正在定位中，请稍候...");
    } else {
        alert(locationError.value || "无法获取当前位置。请检查定位权限或网络，然后重试。");
        if (currentMap) {
             mapUtils.getCurrentLocation(store, currentMap); // 尝试重新定位
        }
    }
}

// 平移地图到当前用户位置
function panToCurrentLocation() {
    const loc = userLocation.value;
    const currentMap = mapInstance.value;
    if (loc?.point && currentMap) {
        mapUtils.panTo(loc.point, currentMap, 16); // 平移并设置缩放级别
    } else if (isLocating.value) {
         alert("正在定位中，请稍候...");
    } else {
         alert(locationError.value || "当前位置无效或地图未准备好");
         if (currentMap) {
            mapUtils.getCurrentLocation(store, currentMap);
         }
    }
}

// 切换选中的路线方案
function selectPlan(index) {
  if (selectedPlanIndex.value !== index) {
      store.commit('map/SET_SELECTED_PLAN_INDEX', index);
      const planner = mapUtils.getLastPlanner();
      if (planner && typeof planner.selectPlan === 'function') {
           try {
               planner.selectPlan(index); // 让 JS API 处理高亮和可能的视图调整
               console.log(`JS API: Switched to plan ${index}`);
           } catch (e) {
               console.error("调用 planner.selectPlan 出错:", e);
               // 如果 selectPlan 失败，可以尝试手动调整视野
               const newRoute = store.state.map.routeResults?.[index];
               if (newRoute?.steps?.length > 0) {
                   const pointsToFit = newRoute.steps.flatMap(step => step.pathPoints || []);
                   if (pointsToFit.length > 0 && mapInstance.value) {
                       mapUtils.setMapView(pointsToFit, mapInstance.value);
                   }
               }
           }
      } else {
           console.warn("无法自动高亮方案，planner 不可用或不支持 selectPlan");
           // 手动调整视野作为后备
           const newRoute = store.state.map.routeResults?.[index];
           if (newRoute?.steps?.length > 0) {
               const pointsToFit = newRoute.steps.flatMap(step => step.pathPoints || []);
                if (pointsToFit.length > 0 && mapInstance.value) {
                    mapUtils.setMapView(pointsToFit, mapInstance.value);
                }
           }
      }
  }
}

// 点击路线步骤时，在地图上高亮（平移到）该步骤起点
function highlightStepOnMap(step) {
 console.log("点击步骤:", step.instruction);
 const currentMap = mapInstance.value;
 const planner = mapUtils.getLastPlanner();
 let highlightedByPlanner = false;

 // 尝试使用 planner 高亮 (需要 step 对象包含 routeIndex 和 stepIndex)
 if (planner && typeof planner.highlightStep === 'function' && step.originalStep && step.routeIndex !== undefined && step.stepIndex !== undefined && step.stepIndex >= 0) {
      try {
          // 注意: highlightStep 可能不存在或参数不同，需查文档确认
          // planner.highlightStep(step.routeIndex, step.stepIndex);
          console.log(`尝试调用 planner.highlightStep (route:${step.routeIndex}, step:${step.stepIndex}) - API 可能不支持`);
      } catch(e) {
          console.error("调用 planner.highlightStep 失败 (可能不支持):", e);
      }
 } else if (planner && typeof planner.highlightRoute === 'function' && step.originalStep && step.routeIndex !== undefined && step.stepIndex === -1) {
       try {
           // planner.highlightRoute(step.routeIndex); // API 可能不同
           console.log(`尝试高亮整个公交/地铁段 (route:${step.routeIndex}) - API 可能不支持`);
       } catch(e) {
           console.error("调用 planner.highlightRoute 失败 (可能不支持):", e);
       }
 }

 // 平移地图到步骤起点作为保底或补充操作
 const position = step.position || step.pathPoints?.[0]; // 获取步骤位置
 if (currentMap && position) {
     const targetZoom = currentMap.getZoom() < 16 ? 16 : currentMap.getZoom();
     mapUtils.panTo(position, currentMap, targetZoom); // 平移并可能缩放
     console.log("Panned to step location.");
 } else {
     console.warn("无法获取步骤的地理位置信息进行平移:", step);
 }
}

// 切换底部结果面板显隐
function toggleResultPanel() {
    isResultPanelVisible.value = !isResultPanelVisible.value;
}

// 切换实时路况图层
function toggleTraffic() {
    const currentMap = mapInstance.value;
    if (!currentMap) return;
    const newState = !isTrafficLayerOn.value;
    mapUtils.toggleTrafficLayer(currentMap, newState);
    store.commit('map/SET_TRAFFIC_LAYER_STATUS', newState);
}

// 格式化方案 Tab 上显示的时间
function formatDurationForTab(seconds) {
    if (seconds === null || seconds === undefined) return '?';
    if (seconds < 60) return '<1分钟';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    let durationStr = '';
    if (hours > 0) durationStr += `${hours}小时`;
    if (minutes > 0 && (hours === 0 || (seconds % 3600) / 60 >= 1)) {
         durationStr += `${minutes}分钟`;
    }
    return durationStr || '<1分钟';
}

// 获取步骤图标 (使用 SVG)
const drivingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
const transitSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M21 11.18V9c0-2.76-2.24-5-5-5H8C5.24 4 3 6.24 3 9v2.18C4.13 11.59 5 12.69 5 14v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4c0-1.31.87-2.41 2-2.82zM8.5 18c-.83 0-1.5-.67-1.5-1.5S7.67 15 8.5 15s1.5.67 1.5 1.5S9.33 18 8.5 18zm6.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 9H5V7h14v2z"/></svg>`;
const walkingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 11.7V17h2v-5l3.1-3.1c.2-.2.3-.5.3-.7s-.1-.5-.3-.7c-.4-.4-1-.4-1.4 0L9.8 8.9zM18.8 13.3l-2.6 2.6V22h-2v-7.5l2.6-2.6c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4z"/></svg>`;
const ridingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M15.5 6.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-2.12 4.14L11.83 9.1c-.94-.94-2.46-.94-3.4 0L7.3 10.23c-.93.94-.93 2.46 0 3.4l1.58 1.58c.75.75 1.85 1 2.99.81l2.64-2.64c.94-.94.94-2.46 0-3.4zm-4.13 8.99L7.8 18.18c-.59-.59-.59-1.54 0-2.12l1.41-1.41c.59-.59 1.54-.59 2.12 0l1.45 1.45c.31.31.72.45 1.12.45.36 0 .7-.11 1-.34l1.41-1.41c.59-.59.59-1.54 0-2.12l-4.24-4.24c-.59-.59-1.54-.59-2.12 0L7.8 13.62c-1.17 1.17-1.17 3.07 0 4.24l1.45 1.45c.59.59 1.54.59 2.12 0z"/></svg>`;
const subwaySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2c-4.42 0-8 .5-8 4v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V6c0-3.5-3.58-4-8-4zm0 2c3.47 0 6 .39 6 2H6c0-1.61 2.53-2 6-2zm-4 7h8v2H8v-2zm8 4H8v-2h8v2z"/></svg>'; // 地铁图标示例
const defaultSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>'; // 箭头图标示例

function getStepIcon(step) {
    switch (step.type) {
        case 4: return `<span class="svg-icon walk-icon">${walkingSvg}</span>`;
        case 1: return `<span class="svg-icon subway-icon">${subwaySvg}</span>`; // 使用地铁图标
        case 2: return `<span class="svg-icon bus-icon">${transitSvg}</span>`; // 使用公交图标
        case 3: return `<span class="svg-icon drive-icon">${drivingSvg}</span>`;
        case 5: return `<span class="svg-icon ride-icon">${ridingSvg}</span>`;
        default: return `<span class="svg-icon default-icon">${defaultSvg}</span>`;
    }
}

// --- 新增：开始导航 ---
function startNavigation() {
    const currentMap = mapInstance.value;
    const currentLoc = userLocation.value;
    const currentSelectedRoute = selectedRoute.value; // 获取当前选中的路线

    if (!currentMap || !currentLoc?.point) {
        alert('无法开始导航：地图未准备好或当前位置未知。');
        return;
    }
    // 检查是否有路线结果，导航需要基于已规划的路线
    if (!currentSelectedRoute || !currentSelectedRoute.steps || currentSelectedRoute.steps.length === 0) {
        alert('请先规划路线后再开始导航。');
        return;
    }

    isNavigating.value = true;
    isResultPanelVisible.value = false; // 隐藏结果面板
    console.log("开始导航...");

    // 停止之前的监听 (如果存在)
    if (navigationWatchId.value !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(navigationWatchId.value);
        navigationWatchId.value = null;
        console.log("已清除旧的位置监听。");
    }

    // 清除可能存在的旧用户标记 (确保 clearExistingUserMarker 已修正)
    clearExistingUserMarker();

    // 添加初始用户位置标记
    const startNavPoint = currentLoc.point; // {lng, lat}
    const bmapStartPoint = new BMapGL.Point(startNavPoint.lng, startNavPoint.lat);
    try {
        const navIcon = createNavigationIcon(); // 使用你之前定义的图标
        const marker = mapUtils.addMarker(
            bmapStartPoint, // 使用 BMapGL.Point
            currentMap,
            {
                icon: navIcon,
                title: '我的位置',
                zIndex: 101, // 确保在路线之上
                enableDragging: false, // 导航图标不应能被拖拽
                enableMassClear: false, // 避免被 map.clearOverlays 清除
                _isUserMarker: true // 自定义属性，标记为导航用户标记
            }
        );
        if (marker) {
            userMarker.value = marker; // 保存引用
            console.log("导航用户标记已添加");
        } else {
            console.error("创建导航用户标记失败");
            isNavigating.value = false; // 无法创建标记，退出导航状态
            return;
        }
    } catch (e) {
        console.error("添加导航用户标记时出错:", e);
        isNavigating.value = false; // 出错则退出导航状态
        return;
    }

    // --- 关键：设置导航时的地图初始视角 ---
    console.log("设置初始导航视角...");
    currentMap.setZoom(18);             // 设置较高的缩放级别
    currentMap.setTilt(60);             // 设置较大的倾斜角度，获得3D效果
    // 初始时不设置中心点和朝向，等待第一次定位回调来设置，确保视角和方向一致

    // 监听位置变化 (请求高精度)
    if ('geolocation' in navigator && typeof navigator.geolocation.watchPosition === 'function') {
        const watchOptions = {
             enableHighAccuracy: true, // 请求高精度位置
             timeout: 8000,            // 超时时间8秒
             maximumAge: 0             // 不使用缓存，总是获取最新位置
         };
        console.log("开始监听位置变化 (高精度)...");

        navigationWatchId.value = navigator.geolocation.watchPosition(
            (position) => {
                const coords = position.coords;
                const currentGeoPoint = { lng: coords.longitude, lat: coords.latitude };
                 // heading 是设备相对于正北方向顺时针的角度 (0-359.99)
                 // 如果设备静止或无法确定方向，可能为 null
                const heading = coords.heading;
                 // speed 是设备移动速度 (米/秒)，可能为 null
                const speed = coords.speed;

                console.log(`导航中 - 位置: ${currentGeoPoint.lat.toFixed(6)}, ${currentGeoPoint.lng.toFixed(6)} | 方向(heading): ${heading?.toFixed(1)} | 速度: ${speed?.toFixed(1)} m/s | 精度: ${coords.accuracy?.toFixed(0)} m`);

                const bmapPoint = new BMapGL.Point(currentGeoPoint.lng, currentGeoPoint.lat);

                // --- 更新用户标记 ---
                if (userMarker.value) {
                    userMarker.value.setPosition(bmapPoint);
                    // 只有当 heading 有效时 (非 null 且是数字) 才设置旋转角度
                    if (heading !== null && !isNaN(heading)) {
                        // BMapGL Marker 的 rotation 是顺时针角度，0度指向上方（北方）
                        // Geolocation API 的 heading 也是相对于正北方的顺时针角度
                        userMarker.value.setRotation(heading);
                    }
                    // else {
                        // 如果没有方向信息，可以让图标保持上一次的方向或默认朝北
                        // userMarker.value.setRotation(0); // 例如，强制朝北
                    // }
                }

                // --- 关键：更新地图视角以跟随用户 ---
                if (currentMap) {
                    // 方案一：简单跟随（地图中心=用户位置，地图旋转=用户方向）
                    // currentMap.setCenter(bmapPoint);
                    // if (heading !== null && !isNaN(heading)) {
                    //     currentMap.setHeading(heading);
                    // }
                    // currentMap.setTilt(60); // 保持倾斜角

                    // 方案二：模拟第一人称视角（将用户图标“推”到屏幕下方）
                    // 这个方案更复杂，需要计算偏移后的中心点
                    if (heading !== null && !isNaN(heading)) {
                        // 1. 计算偏移量：需要将用户位置从屏幕中心向下移动一段距离。
                        //    这个距离依赖于地图容器的高度和当前的缩放级别。
                        //    可以估算一个像素值，例如屏幕高度的1/4或1/3。
                        const mapHeight = currentMap.getSize().height;
                        const offsetYPixels = mapHeight * 0.25; // 向上偏移屏幕高度的25% (用户就会显示在下方)

                        // 2. 将像素偏移转换为地理坐标偏移（这是难点）
                        //    简单的做法是获取当前中心点的像素坐标，计算偏移后的像素坐标，再转回地理坐标。
                        //    但这在地图旋转和倾斜时可能不精确。
                        //    更精确的方法是用三角函数计算基于heading的地理坐标偏移，但这需要考虑地图投影。

                        // 尝试简化计算：获取当前地图中心点，计算其对应的屏幕像素，
                        // 加上基于 heading 和 offsetYPixels 的屏幕像素偏移，
                        // 然后将这个新的屏幕像素点转换回地理坐标作为新的中心点。

                        try {
                            const userPixel = currentMap.pointToPixel(bmapPoint);
                            // 计算屏幕上新的中心点像素位置
                            // theta 是 heading 对应的弧度（注意JS三角函数用弧度）
                            const theta = (heading * Math.PI) / 180;
                            // 向上偏移，所以是 y - offset * cos(theta), x + offset * sin(theta)
                            // 但因为我们想让用户在下方，所以地图中心点应该在用户位置的“前方”
                            const targetPixelX = userPixel.x - offsetYPixels * Math.sin(theta);
                            const targetPixelY = userPixel.y - offsetYPixels * Math.cos(theta);

                            const targetCenterPoint = currentMap.pixelToPoint(new BMapGL.Pixel(targetPixelX, targetPixelY));

                            // 使用 flyTo 平滑移动到新的中心点，同时设置方向
                            currentMap.flyTo(targetCenterPoint, currentMap.getZoom(), {
                                duration: 300, // 动画持续时间
                                // 直接在 flyTo 中可能无法同时设置 heading 和 tilt，需要分开设置
                            });
                             // flyTo 可能需要时间完成，之后再设置 heading 和 tilt
                             setTimeout(() => {
                                if (isNavigating.value) { // 确保还在导航状态
                                    currentMap.setHeading(heading);
                                    currentMap.setTilt(60); // 保持倾斜
                                }
                             }, 150); // 稍作延迟

                        } catch (pixelError) {
                            console.warn("计算像素偏移或转换时出错，回退到简单跟随:", pixelError);
                            // 出错时回退到简单跟随
                             currentMap.flyTo(bmapPoint, currentMap.getZoom(), { duration: 300 });
                             setTimeout(() => {
                                if (isNavigating.value) {
                                    currentMap.setHeading(heading);
                                    currentMap.setTilt(60);
                                }
                             }, 150);
                        }

                    } else {
                         // 没有方向信息，只能简单地将地图中心移到用户位置
                         console.log("无有效方向信息，仅居中地图");
                         currentMap.flyTo(bmapPoint, currentMap.getZoom(), { duration: 300 });
                         // 可以选择将地图朝向北方
                          setTimeout(() => {
                            if (isNavigating.value) {
                                currentMap.setHeading(0);
                                currentMap.setTilt(60);
                            }
                          }, 150);
                    }
                }

                // --- 未来可扩展的导航逻辑 ---
                // matchRouteAndStep(bmapPoint); // 匹配路线和步骤
                // updateNavigationUI();         // 更新导航信息UI
                // checkOffRoute(bmapPoint);     // 检查是否偏航
                // ---

            },
            (error) => {
                console.error("导航中 - 定位错误:", error.code, error.message);
                if (error.code === error.PERMISSION_DENIED) {
                    alert("导航功能需要您授权位置信息权限。");
                    stopNavigation();
                } else if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
                    console.warn("暂时无法获取准确位置，请检查GPS信号和网络。");
                    // 定位信号弱或超时，通常不直接停止导航，但可以给用户提示
                } else {
                    alert(`导航定位时发生错误: ${error.message}`);
                    stopNavigation();
                }
            },
            watchOptions
        );
    } else {
        alert("您的浏览器不支持或未开启地理位置服务，无法进行导航。");
        stopNavigation(); // 停止导航
    }
}

// --- 停止导航 ---
function stopNavigation() {
    // 仅在确实处于导航状态时执行停止逻辑
    if (!isNavigating.value) {
        // console.log("已处于非导航状态，无需再次停止。");
        return;
    }

     console.log("正在停止导航...");

    // 停止位置监听
    if (navigationWatchId.value !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(navigationWatchId.value);
        navigationWatchId.value = null;
        console.log("已清除位置监听。");
    }

    isNavigating.value = false; // 首先更新状态

    // 恢复地图状态
    const currentMap = mapInstance.value;
    if (currentMap) {
         console.log("正在恢复地图状态...");
         try {
             currentMap.setHeading(0); // 恢复地图朝向正北
             currentMap.setTilt(0);     // 恢复地图为2D俯视
             console.log("地图朝向和倾斜已恢复。");

             // 尝试恢复视野到路线全览
             const route = selectedRoute.value;
             const routePoints = route?.steps?.flatMap(step => step.pathPoints || []).filter(p => p); // 提取有效点

             if (routePoints && routePoints.length > 0) {
                 console.log("尝试恢复地图视野至路线全览...");
                 // 使用 mapUtils 提供的 setMapView，它内部有延迟和边距处理
                 mapUtils.setMapView(routePoints, currentMap, { margins: [80, 20, 70, 20] }); // 使用默认边距
             } else {
                  // 如果没有路线信息或有效点，则回到用户当前位置（如果可用）
                  const loc = userLocation.value;
                  if(loc?.point) {
                      console.log("无路线信息，恢复视野至用户当前位置...");
                      currentMap.centerAndZoom(new BMapGL.Point(loc.point.lng, loc.point.lat), 15);
                  } else {
                      console.log("无路线和用户位置信息，无法自动调整视野。");
                  }
             }
         } catch (mapStateError) {
              console.error("恢复地图状态时出错:", mapStateError);
         }
    } else {
        console.warn("停止导航时地图实例无效。");
    }

    // 清除导航时的用户标记
    clearExistingUserMarker();

     // 可以考虑重新显示底部面板（如果需要）
     // if (routeResults.value?.length > 0) {
     //     isResultPanelVisible.value = true;
     // }

    console.log("导航已停止。");
}

// --- 清除已存在的用户导航标记 ---
function clearExistingUserMarker() {
    const currentMap = mapInstance.value;
    const markerToRemove = userMarker.value; // 获取当前存储的标记引用

    if (currentMap && markerToRemove) {
        console.log("准备清除导航用户标记...");
        try {
            currentMap.removeOverlay(markerToRemove);
            console.log("导航用户标记已成功移除。");
        } catch (e) {
             console.error("移除导航用户标记时失败:", e);
        }
        userMarker.value = null; // 清除引用，无论是否移除成功
    } else {
        // 如果 Map.vue 的 userMarker ref 为空，说明没有需要清除的标记
        console.log("无需清除导航标记（引用不存在）。");
    }
}

// --- 新增：创建导航图标 ---
function createNavigationIcon() {
    if (!window.BMapGL) return null;
    const svg = `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                   <path d="M512 49.152l460.8 925.696-460.8-184.32-460.8 184.32z" fill="#1677FF" stroke="#FFFFFF" stroke-width="30"/>
                 </svg>`;
    return new BMapGL.Icon(
        "data:image/svg+xml;base64," + btoa(svg),
        new BMapGL.Size(30, 30),
        {
            anchor: new BMapGL.Size(15, 15), // 锚点在中心，图标会围绕中心旋转
            // 注意：WebGL API 的 Icon 似乎没有 imageOffset 选项，如果图标本身不是正方向朝上，可能需要调整 SVG 或使用 Marker 的 rotation
        }
    );
}

 // --- 新增：切换地图类型 ---
 function toggleMapType() {
    const currentMap = mapInstance.value;
    if (!currentMap || !window.BMapGL) return;

    const currentBMapType = currentMap.getMapType();
    const normalType = window.BMAP_NORMAL_MAP;
    const satelliteType = window.BMAP_SATELLITE_MAP;

    const nextTypeConstant = currentBMapType === normalType ? satelliteType : normalType;
    const nextTypeId = currentBMapType === normalType ? 'BMAP_SATELLITE_MAP' : 'BMAP_NORMAL_MAP';

    try {
        mapUtils.setMapType(currentMap, nextTypeId); // 使用工具函数切换
        currentMapType.value = nextTypeId; // 更新本地状态
        // store.commit('map/SET_MAP_TYPE', nextTypeId); // 更新 Vuex 状态
        console.log(`Map type switched to: ${nextTypeId}`);
    } catch (e) {
        console.error("切换地图类型失败:", e);
        alert("切换地图类型失败");
    }
}
// --- 新增：重置地图方向和倾角 ---
function resetMapRotation() {
    const currentMap = mapInstance.value;
    if (currentMap) {
        console.log("重置地图方向和倾角...");
        try {
             // 使用 flyTo 提供平滑过渡效果
            currentMap.flyTo(currentMap.getCenter(), currentMap.getZoom(), {
                 tilt: 0,       // 目标倾角
                 heading: 0,    // 目标朝向
                 duration: 500 // 动画时间
            });
            // 或者直接设置（无动画）
            // currentMap.setHeading(0);
            // currentMap.setTilt(0);
        } catch (e) {
             console.error("重置地图方向失败:", e);
        }
    }
}

// --- 新增：全屏切换 ---
function toggleFullScreen() {
  if (!document.fullscreenElement &&    // 标准
      !document.webkitFullscreenElement && // WebKit (Chrome, Safari)
      !document.mozFullScreenElement &&    // Firefox
      !document.msFullscreenElement) {   // IE/Edge
    // 进入全屏
    const element = document.documentElement; // 或 mapContainerRef.value
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { /* Safari */
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) { /* Firefox */
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) { /* IE/Edge */
      element.msRequestFullscreen();
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  }
}

// --- 新增：监听全屏状态变化 ---
function handleFullscreenChange() {
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  console.log("全屏状态改变:", isFullscreen.value);
   // 全屏变化后可能需要手动触发地图的 checkResize
  nextTick(() => {
      mapInstance.value?.checkResize();
  });
}
function setupFullscreenListener() {
    removeFullscreenListener(); // 先移除旧的，防止重复添加
    fullscreenChangeListener = handleFullscreenChange; // 保存引用
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
/* 引入 Font Awesome (如果需要，但现在用SVG了) */
/* @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'); */

/* --- 基础布局 (移动端优先) --- */
.map-navigation-container-mobile {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 改为视口高度 */
  width: 100vw; /* 改为视口宽度 */
  overflow: hidden;
  position: relative;
  background-color: #f4f4f4;
}

/* --- 顶部输入面板 --- */
.top-input-panel {
position: absolute;
top: 10px;
left: 10px;
right: 10px;
background-color: rgba(255, 255, 255, 0.95);
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
padding: 10px 12px;
z-index: 10; /* 低于 suggestion */
display: flex;
flex-direction: column;
gap: 8px;
}

.input-row {
  display: flex;
  align-items: center;
  position: relative;
}
.input-icon {
  flex-shrink: 0;
  width: 20px; /* 图标容器宽度 */
  height: 20px; /* 图标容器高度 */
  margin-right: 8px;
  display: inline-flex; /* 使用 flex 布局方便居中 */
  align-items: center;
  justify-content: center;
}
/* 为SVG设置颜色 */
.input-icon.start-icon svg { color: #3385ff; /* 蓝色 */}
.input-icon.end-icon svg { color: #ff5a5a; /* 红色 */}

/* 连接线样式调整 (可选) */
.input-connector-line {
    position: absolute;
    left: 10px; /* 大致对齐图标中心 */
    top: 28px; /* 第一个输入框图标下方 */
    height: 22px; /* 连接线高度，覆盖两个输入框之间的间隙 */
    width: 1px;
    background-color: #ccc;
    z-index: -1; /* 确保在输入框下方 */
}
.input-label {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 8px;
  position: relative;
}
.input-label.start-label { background-color: #3385ff; }
.input-label.end-label { background-color: #ff5a5a; }
/* 连接线 */
.input-row:first-child .input-label::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    height: 18px;
    width: 1px;
    background-color: #ccc;
    transform: translateX(-50%);
    z-index: -1;
}


.top-input-panel input {
  flex-grow: 1;
  padding: 10px 8px;
  border: none;
  border-bottom: 1px solid #eee;
  font-size: 15px;
  outline: none;
  background: transparent;
}
.top-input-panel input:focus {
  border-bottom-color: #007bff;
}

.icon-btn {
  background: none;
  border: none;
  padding: 5px;
  margin-left: 5px;
  cursor: pointer;
  color: #666;
  line-height: 1;
}
.icon-btn:hover { color: #007bff; }
.location-btn { color: #3385ff; }
.swap-btn { color: #888; padding: 8px 5px; }

/* 新的交通方式和规划按钮容器 */
.transport-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #eee;
}

/* 交通方式 Tab 按钮组 */
.mode-tabs {
    display: flex;
    gap: 5px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;
     /* 隐藏滚动条 (通用) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE 10+ */
}
 /* 隐藏滚动条 (Webkit) */
.mode-tabs::-webkit-scrollbar {
    display: none;
}

.mode-tabs button {
    padding: 6px 10px;
    border: 1px solid #ccc;
    border-radius: 15px;
    background-color: #fff;
    color: #555;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}
/* 修正 v-html 包裹的 span */
.mode-tabs button span[data-v-html] {
   display: inline-flex; /* 让 SVG 和文字基线对齐 */
   align-items: center;
}
.mode-tabs button span[data-v-html] svg {
    fill: #777;
    transition: fill 0.2s;
    width: 16px; /* 统一图标大小 */
    height: 16px;
    margin-right: 3px; /* 图标和文字间距 */
}

.mode-tabs button:hover {
    background-color: #f0f0f0;
    border-color: #bbb;
}

.mode-tabs button.active {
    background-color: #e6f7ff;
    border-color: #91d5ff;
    color: #096dd9;
    font-weight: 500;
}
.mode-tabs button.active span[data-v-html] svg {
    fill: #096dd9;
}

/* 靠右的查询按钮 */
.plan-btn-right {
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 18px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
    flex-shrink: 0;
}
.plan-btn-right:hover { background-color: #0056b3; }
.plan-btn-right:disabled { background-color: #a0cfff; cursor: not-allowed; }
.plan-btn-right .spinner.small { margin-right: 0; border-left-color: #fff; } /* 调整loading样式 */
.plan-btn-right span:not(.spinner) { line-height: 1; } /* 避免文字换行 */

/* --- 地图显示区域 --- */
.map-display-mobile {
  flex-grow: 1;
  width: 100%;
  position: relative;
  min-height: 0; /* 防止 flex 布局问题 */
}
#baidu-map-container-mobile {
  width: 100%;
  height: 100%;
}
:deep(#baidu-map-container-mobile .BMap_cpyCtrl),
:deep(#baidu-map-container-mobile .anchorBL) {
  z-index: 1;
  bottom: 10px !important; /* 稍微抬高一点 */
  left: 10px !important;
  right: auto !important;
}

/* --- 地图浮动按钮 --- */
.map-float-buttons {
    position: absolute;
    /* bottom: 20px; */ /* 移除 bottom 定位 */
    top: 190px; /* 新增：设置顶部距离，需要根据你的输入面板实际高度调整 */
    right: 15px; /* 保持在右侧 */
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 15px; /* 按钮间距 */
}
.float-btn {
    width: 48px; /* 稍微增大按钮尺寸以容纳文字 */
    height: 48px;
    background-color: rgba(255, 255, 255, 0.95);
    border: none; /* 去掉边框，现代感 */
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); /* 加深阴影 */
    cursor: pointer;
    display: flex; /* 使用 flex 布局 */
    justify-content: center;
    align-items: center;
    padding: 0;
    color: #555;
    transition: background-color 0.2s, color 0.2s;
    overflow: hidden; /* 防止内容溢出 */
}
.float-btn:hover {
    background-color: #f0f0f0;
}
.float-btn:disabled {
    background-color: #e9ecef;
    color: #adb5bd;
    cursor: not-allowed;
    opacity: 0.7;
}
/* 新增：按钮内容容器 */
.float-btn-content {
    display: flex;
    flex-direction: column; /* 图标在上，文字在下 */
    align-items: center;
    justify-content: center;
    gap: 2px; /* 图标和文字间距 */
}
.float-btn-content svg {
    width: 22px; /* 保持图标大小 */
    height: 22px;
    fill: currentColor; /* 让图标颜色随按钮状态变化 */
}
/* 新增：按钮文字标签 */
.float-btn-label {
    font-size: 10px; /* 较小的字体 */
    line-height: 1.1;
    color: #666; /* 标签颜色 */
    white-space: nowrap; /* 防止文字换行 */
}

/* 特定按钮激活/悬停颜色 */
.locate-btn:hover .float-btn-content svg,
.reset-north-btn:hover .float-btn-content svg,
.fullscreen-btn:hover .float-btn-content svg,
.map-type-btn:hover .float-btn-content svg {
    color: #007bff; /* 悬停时图标变蓝 */
}
.traffic-btn.active {
    background-color: #e0f3ff;
    border-color: #91d5ff;
}
.traffic-btn.active .float-btn-content svg {
    color: #1677ff; /* 激活时图标变蓝 */
}
.traffic-btn.active .float-btn-label {
    color: #1677ff; /* 激活时文字也变蓝 */
}
.locate-btn:hover { color: #007bff; }
.traffic-btn.active { background-color: #e0f3ff; color: #1677ff; border-color: #91d5ff; } /* 激活时蓝色调 */
.map-type-btn:hover { color: #6f42c1; } /* 地图类型按钮悬浮色 */


/* --- 底部结果面板 (BottomSheet) --- */
.bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.1);
  z-index: 20;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.bottom-sheet.sheet-visible {
  transform: translateY(0);
}

.sheet-header {
  padding: 8px 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  position: relative;
  flex-shrink: 0; /* 防止头部被压缩 */
}
.drag-handle {
  display: inline-block;
  width: 40px;
  height: 5px;
  background-color: #ccc;
  border-radius: 3px;
}
.close-sheet-btn {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 24px;
    color: #aaa;
    cursor: pointer;
    padding: 5px;
    line-height: 1;
}

.sheet-content {
  overflow-y: auto;
  flex-grow: 1;
  padding: 0px 15px 15px 15px;
  -webkit-overflow-scrolling: touch; /* iOS 滚动优化 */
    &::-webkit-scrollbar { width: 5px; }
    &::-webkit-scrollbar-track { background: #f1f1f1; }
    &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px;}
    &::-webkit-scrollbar-thumb:hover { background: #aaa; }
}

.sheet-loading, .sheet-error, .sheet-empty {
  padding: 40px 15px;
  text-align: center;
  color: #888;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px; /* 保证内容区域有最小高度 */
}
.sheet-error { color: #dc3545; font-weight: bold; }
.sheet-loading .spinner { margin-bottom: 10px; }

/* 结果容器 */
.route-results-container {
    padding-top: 10px;
}

/* 方案 Tabs (移动端样式) */
.plan-tabs-mobile {
    display: flex;
    margin-bottom: 12px;
    border-bottom: 1px solid #dee2e6;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE 10+ */
}
.plan-tabs-mobile::-webkit-scrollbar {
    display: none;
}
.plan-tabs-mobile button {
    flex: 1 0 auto;
    padding: 10px 12px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: #6c757d;
    border-bottom: 3px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    text-align: center;
    white-space: nowrap;
}
.plan-tabs-mobile button:hover { color: #0056b3; }
.plan-tabs-mobile button.active {
    color: #007bff;
    font-weight: bold;
    border-bottom-color: #007bff;
}
.plan-tabs-mobile button span {
    font-size: 0.85em;
    color: #6c757d;
    margin-left: 4px;
    font-weight: normal;
}

/* 路线概要 (移动端样式) */
.route-summary-mobile {
  padding: 8px 0;
  color: #333;
  border-bottom: 1px dashed #eee;
  margin-bottom: 10px;
  font-size: 15px;
}
.route-summary-mobile p { margin: 3px 0; }
.route-summary-mobile span { margin-right: 8px; }
.cost-estimate { font-size: 0.9em; color: #555; }
.cost-estimate svg { color: #f39c12; margin-right: 3px; vertical-align: -2px; } /* 调整图标颜色和对齐 */
.transit-desc { font-size: 0.9em; color: #666; margin-top: 5px; }
.summary-loading { display: flex; align-items: center; color: #555; padding: 5px 0; }

/* 导航按钮 */
.navigation-controls {
    padding: 12px 0; /* 增加上下 padding */
    display: flex;
    justify-content: center;
    border-top: 1px solid #eee;
    margin-top: 12px;
}
.start-nav-btn, .stop-nav-btn {
    padding: 10px 25px;
    font-size: 16px;
    font-weight: bold;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
}
.start-nav-btn svg, .stop-nav-btn svg { /* 图标颜色 */
   fill: currentColor;
}
.start-nav-btn { background-color: #1677ff; color: white; }
.start-nav-btn:hover { background-color: #0056b3; }
.start-nav-btn:disabled { background-color: #a0cfff; cursor: not-allowed; }
.stop-nav-btn { background-color: #dc3545; color: white; }
.stop-nav-btn:hover { background-color: #c82333; }

/* 路线步骤 (移动端样式) */
.route-steps-mobile { margin-top: 10px; }
.route-steps-mobile ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
.route-steps-mobile li {
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    transition: background-color 0.2s;
}
.route-steps-mobile li:last-child { border-bottom: none; }
.route-steps-mobile li:hover { background-color: #f8f9fa; }

.step-icon {
    flex-shrink: 0;
    width: 28px;
    text-align: center;
    margin-right: 10px;
    padding-top: 2px;
    color: #666;
    line-height: 1; /* 保证 SVG 基线对齐 */
}
.step-icon .svg-icon svg { /* 控制 SVG 图标大小和对齐 */
    width: 20px;
    height: 20px;
    vertical-align: middle;
}
/* 特定图标颜色 */
.step-icon .walk-icon svg path { fill: #2E8B57; }
.step-icon .subway-icon svg path { fill: #FF4500; }
.step-icon .bus-icon svg path { fill: #4169E1; }
.step-icon .drive-icon svg path { fill: #1890ff; }
.step-icon .ride-icon svg path { fill: #DA70D6; }
.step-icon .default-icon svg path { fill: #666; }

.step-details {
    flex-grow: 1;
    overflow: hidden; /* 防止长文本溢出 */
}
.step-instruction {
    display: block;
    font-size: 15px;
    line-height: 1.5;
    color: #333;
    word-break: break-word; /* 允许长单词换行 */
    :deep(b), :deep(strong) { color: #0056b3; font-weight: 600; }
    :deep(font[color="#00B050"]) { color: #28a745 !important; }
    :deep(font[color="#FF0000"]) { color: #dc3545 !important; }
}
.step-meta {
  display: block;
  color: #888;
  font-size: 0.85em;
  margin-top: 4px;
}
.no-steps { color: #888; font-size: 14px; padding: 15px 0; }
.steps-loading { display: flex; align-items: center; color: #555; padding: 10px 0; }


/* --- 加载提示 --- */
.sdk-loading-overlay, .locating-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 1.1em;
    font-weight: 500;
    color: #444;
    z-index: 100;
}
.locating-overlay .spinner { border-left-color: #28a745; }
.sdk-loading-overlay > div, .locating-overlay > div { margin-top: 12px; }

/* Spinner 动画 */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}
.spinner.small {
  border-width: 3px;
  width: 16px;
  height: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 百度地图输入提示样式调整 */
:deep(.tangram-suggestion-main) {
    z-index: 2000 !important; /* 确保在顶部面板之上 */
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* 添加阴影 */
}
:deep(.tangram-suggestion-container) {
    max-height: 300px; /* 限制最大高度 */
    overflow-y: auto;
}

/* 导航模式下的覆盖层样式 */
.navigation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.05); /* 非常淡的遮罩 */
  z-index: 30;
  display: flex;
  justify-content: flex-end; /* 按钮放右上角 */
  align-items: flex-start;
  padding: 15px;
  pointer-events: none; /* 允许地图交互 */
}

.nav-exit-btn {
    background-color: rgba(255, 255, 255, 0.9);
    color: #333;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 8px 15px;
    cursor: pointer;
    font-size: 14px;
    pointer-events: auto;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.nav-exit-btn:hover {
    background-color: #f5f5f5;
}

/* 导航模式下，隐藏或淡化非导航 UI */
.map-navigation-container-mobile.navigating .top-input-panel,
.map-navigation-container-mobile.navigating .bottom-sheet {
   pointer-events: none;
   opacity: 0.3; /* 大幅降低透明度使其不显眼 */
   transition: opacity 0.3s ease;
}
/* 导航时地图浮动按钮也隐藏 */
 .map-navigation-container-mobile.navigating .map-float-buttons {
    display: none;
 }

</style>