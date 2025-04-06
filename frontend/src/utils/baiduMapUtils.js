// src/utils/baiduMapUtils.js
// 注意: 此文件现在只使用百度地图 JavaScript API (BMapGL)

// --- 全局变量 ---
let BMapGL = null; // 存储 BMapGL 命名空间
let isSdkLoading = false; // 标记 SDK 是否正在加载中
// 保存最后一次使用的路线规划实例，方便控制 (例如高亮步骤, 清除结果)
let lastRoutePlanner = null;
// 保存当前手动添加的路线覆盖物引用 (如果选择手动绘制路线)
let currentRouteOverlays = [];
// 保存当前的用户位置标记引用
let currentUserMarker = null;


// --- SDK 加载 ---

/**
 * 加载百度地图 JavaScript API (WebGL 版本)。
 * @param {string} ak 你的百度地图开发者 AK.
 * @param {function} [callback] SDK 加载成功后的回调函数.
 * @returns {Promise<void>} SDK 加载完成后 resolve.
 */
export function loadBaiduMapScript(ak, callback) {
    // 检查 BMapGL 是否已存在 (SDK 已加载)
    if (window.BMapGL) {
        console.log('Baidu Map SDK (BMapGL) already loaded.');
        BMapGL = window.BMapGL;
        // 如果提供了回调，执行回调
        if (callback) {
            try {
                callback();
            } catch (e) {
                console.error("SDK load callback error (already loaded):", e);
            }
        }
        return Promise.resolve(); // 直接返回 resolved Promise
    }

    // 如果正在加载中，则等待加载完成
    if (isSdkLoading) {
        console.log('Baidu Map SDK is currently loading...');
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxCheck = 150; // 最多等待约 15 秒
            const checkInterval = setInterval(() => {
                checkCount++;
                if (window.BMapGL) { // 轮询检查 BMapGL 是否可用
                    clearInterval(checkInterval);
                    BMapGL = window.BMapGL;
                    console.log('SDK loaded while waiting.');
                    if (callback) {
                        try {
                            callback();
                        } catch (e) {
                            console.error("SDK load callback error (waited):", e);
                            reject(e); // 如果回调出错，reject Promise
                            return;
                        }
                    }
                    resolve();
                } else if (checkCount >= maxCheck) {
                    clearInterval(checkInterval);
                    console.error('Waiting for Baidu Map SDK load timed out.');
                    isSdkLoading = false; // 重置加载状态
                    reject(new Error('等待地图SDK加载超时'));
                }
            }, 100); // 每 100 毫秒检查一次
        });
    }

    // --- 开始加载 SDK ---
    isSdkLoading = true;
    console.log('Loading Baidu Map SDK (WebGL)...');
    return new Promise((resolve, reject) => {
        // 定义全局回调函数，百度地图脚本加载完后会调用这个函数
        window.initBaiduMap = () => {
            console.log('Baidu Map SDK loaded successfully via callback.');
            isSdkLoading = false;
            BMapGL = window.BMapGL; // 确认获取 BMapGL 对象

            // 再次检查 BMapGL 是否真的可用
            if (!BMapGL) {
                const errorMsg = "SDK callback triggered, but window.BMapGL is undefined.";
                console.error(errorMsg);
                reject(new Error(errorMsg));
                return;
            }

            // 执行传入的回调函数
            if (callback) {
                try {
                    callback();
                } catch (e) {
                    console.error("SDK load callback error (init):", e);
                    reject(e); // 如果回调出错，reject Promise
                    return;
                }
            }
            resolve(); // SDK 加载成功，resolve Promise
            // 可以删除或保留全局回调函数，保留可能有助于调试
            // delete window.initBaiduMap;
        };

        // 创建 script 标签来加载 API
        const script = document.createElement('script');
        script.type = 'text/javascript';
        // 使用 WebGL 版本，并指定全局回调函数名
        script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${ak}&callback=initBaiduMap&s=1`; // 添加 s=1 推荐用于 HTTPS
        script.async = true;
        // 处理脚本加载失败的情况
        script.onerror = (e) => {
            console.error('Failed to load Baidu Map SDK script:', e);
            isSdkLoading = false;
            window.initBaiduMap = null; // 清理回调函数
            reject(new Error('地图核心脚本加载失败，请检查网络或AK'));
        };
        // 将脚本添加到 body 中
        document.body.appendChild(script);
    });
}

// --- 地图初始化与操作 (JS API) ---

/**
 * 初始化地图实例并存储在 Vuex store 中。
 * @param {string} containerId 地图容器元素的 ID.
 * @param {object} store Vuex store 实例.
 */
export function initializeMap(containerId, store) {
    // 检查 SDK 是否已加载
    if (!BMapGL) {
        const errorMsg = "地图 SDK (BMapGL) 未加载";
        console.error(errorMsg);
        store.commit('map/SET_ROUTE_ERROR', errorMsg);
        return;
    }
    // 检查地图容器元素是否存在
    const container = document.getElementById(containerId);
    if (!container) {
       const errorMsg = `地图容器 #${containerId} 未找到`;
       console.error(errorMsg);
       store.commit('map/SET_ROUTE_ERROR', errorMsg);
       return;
    }
    console.log(`Initializing map for container: #${containerId}`);

    try {
        // 清理可能存在的旧地图实例 (防御性编程)
        const existingMap = store.state.map.mapInstance;
        if (existingMap && typeof existingMap.destroy === 'function') {
             console.warn("销毁旧地图实例...");
             try {
                 // 移除所有控件和监听器 (更彻底的清理)
                 const controls = existingMap.getControls();
                 if (controls) {
                    for (let i = controls.length - 1; i >= 0; i--) {
                        existingMap.removeControl(controls[i]);
                    }
                 }
                 existingMap.clearOverlays(); // 清除覆盖物
                 // 注意: JS API 没有标准的 removeAllEventListeners 方法，需要手动管理
                 // 简单移除 tilesloaded 和 load 作为示例
                 try { existingMap.removeEventListener('tilesloaded'); } catch (e) {}
                 try { existingMap.removeEventListener('load'); } catch (e) {}
                 // ... 其他可能需要移除的事件监听 ...
                 existingMap.destroy();
                 console.log("旧地图实例已销毁。");
             } catch(destroyError) { console.error("销毁旧地图实例失败:", destroyError); }
             store.commit('map/SET_MAP_INSTANCE', null);
        }

        // 创建新的地图实例
        const map = new BMapGL.Map(containerId, {
            enableMapClick: false, // 禁用地图默认点击弹窗
             // 移动端默认禁用双击缩放，使用双指缩放
            enableDoubleClickZoom: false,
             // 可以根据需要配置其他选项
             // displayOptions: {
             //     poi: false // 默认隐藏 POI 点
             // }
        });
        console.log("Map instance created.");

        // 设置初始中心点和缩放级别
        const initialCenter = new BMapGL.Point(116.404, 39.915); // 默认北京
        const initialZoom = 12;
        map.centerAndZoom(initialCenter, initialZoom);
        console.log(`Map centered and zoomed initially to: ${initialCenter.lng}, ${initialCenter.lat}, zoom: ${initialZoom}`);

        // 开启地图常用功能
        map.enableScrollWheelZoom(true); // 桌面端滚轮缩放
        map.enableDragging();            // 拖拽
        map.enableInertialDragging();    // 惯性拖拽
        map.enablePinchToZoom();         // 移动端双指缩放

        // 将新地图实例存储到 Vuex
        store.commit('map/SET_MAP_INSTANCE', map);
        console.log("Map instance stored in Vuex.");

        // 添加地图控件 (适配移动端)
        // 比例尺控件 (左下角)
        map.addControl(new BMapGL.ScaleControl({
            anchor: BMAP_ANCHOR_BOTTOM_LEFT,
            offset: new BMapGL.Size(15, 10) // 调整边距
        }));
                // *** 新增：添加缩放控件 (右上角或右下角) ***
        map.addControl(new BMapGL.ZoomControl({
            anchor: BMAP_ANCHOR_BOTTOM_RIGHT, // 放置在右下角
            offset: new BMapGL.Size(20, 150) // 调整偏移量，放在自定义按钮组的上方
        }));
        console.log("Zoom control added.");
        // 定位控件 (可以自定义样式或使用自己的按钮)
        // const locationCtrl = new BMapGL.LocationControl({
        //     anchor: BMAP_ANCHOR_BOTTOM_RIGHT,
        //     offset: new BMapGL.Size(10, 40) // 放在右下角，比比例尺高一点
        // });
        // map.addControl(locationCtrl);

        // 地图瓦片加载完成事件
        map.addEventListener('tilesloaded', () => {
            console.log('地图瓦片已加载完成 (tilesloaded event).');
        });

        // 地图完全加载（包括核心资源和初始瓦片）后尝试定位
        console.log("尝试获取当前位置...");
        getCurrentLocation(store, map);

    } catch (error) {
        console.error("初始化百度地图失败:", error);
        store.commit('map/SET_ROUTE_ERROR', `地图初始化失败: ${error.message}`);
        store.commit('map/SET_MAP_INSTANCE', null);
    }
}

/**
 * 使用 Geolocation API 获取用户当前位置。
 * @param {object} store Vuex store 实例.
 * @param {object} currentMapInstance 当前地图实例.
 * @returns {Promise<object|null>} 成功时 resolve 用户位置信息对象，失败时 reject.
 */
export function getCurrentLocation(store, currentMapInstance) {
    // 检查依赖项
    if (!BMapGL || !currentMapInstance) {
        const errorMsg = "getCurrentLocation: 地图 SDK 或实例未准备好";
        console.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }

    const geolocation = new BMapGL.Geolocation();
    store.commit('map/SET_IS_LOCATING', true);
    store.commit('map/SET_LOCATION_ERROR', null);

    console.log("Requesting current location...");

    return new Promise((resolve, reject) => {
        geolocation.getCurrentPosition(function(result) { // 注意这里的 this 指向 geolocation 实例
            store.commit('map/SET_IS_LOCATING', false);
            const BMAP_STATUS_SUCCESS = window.BMAP_STATUS_SUCCESS ?? 0; // 兼容旧版或未定义情况

            if (this.getStatus() === BMAP_STATUS_SUCCESS && result?.point) {
                console.log('定位成功:', result);
                // 提取并格式化位置信息
                const userLoc = {
                    point: { lng: result.point.lng, lat: result.point.lat },
                    address: result.address ? (result.address.province + result.address.city + result.address.district + result.address.street + result.address.street_number) : '未知地点',
                    city: result.address?.city || '未知城市',
                    accuracy: result.accuracy // 定位精度
                };
                store.commit('map/SET_USER_LOCATION', userLoc);

                const targetPoint = new BMapGL.Point(userLoc.point.lng, userLoc.point.lat);
                const targetZoom = 16; // 定位成功后设置一个较详细的级别

                console.log(`定位成功，准备将地图视图移至: ${targetPoint.lng}, ${targetPoint.lat}, zoom: ${targetZoom}`);
                // 使用 setTimeout 确保在 UI 更新后执行地图操作，避免潜在的渲染问题
                setTimeout(() => {
                    console.log("Executing map view update inside setTimeout...");
                    try {
                        // 使用 flyTo 提供更平滑的过渡效果
                        currentMapInstance.flyTo(targetPoint, targetZoom, { duration: 500 }); // 500ms 动画
                        console.log("flyTo executed successfully.");

                        // 清除旧用户标记并添加新标记
                        clearUserMarker(currentMapInstance); // 先清除
                        addMarker(targetPoint, currentMapInstance, {
                             title: '我的位置',
                             icon: createLocationIcon(), // 使用自定义定位图标
                             zIndex: 100, // 确保在路线之上
                             _isUserMarker: true // 标记为用户位置标记
                         });
                         console.log("用户位置标记已添加/更新。");

                    } catch(e) {
                        console.error("调用 flyTo 或添加 Marker 时出错:", e);
                    }
                }, 100); // 100ms 延迟

                resolve(userLoc); // 定位成功，resolve 用户信息
            } else {
                // 处理定位失败
                let errorMsg = '定位失败';
                const statusCode = this.getStatus();
                switch(statusCode) {
                    case window.BMAP_STATUS_UNKNOWN_LOCATION: errorMsg = '定位失败: 位置结果未知'; break; // 2
                    case window.BMAP_STATUS_PERMISSION_DENIED: errorMsg = '定位失败: 请允许应用获取位置信息'; break; // 6
                    case window.BMAP_STATUS_TIMEOUT: errorMsg = '定位失败: 请求超时'; break; // 8
                    // 其他可能的状态码...
                    default: errorMsg = `定位失败 (代码: ${statusCode})`;
                }
                console.error('定位失败:', errorMsg, '原始结果:', result);
                store.commit('map/SET_LOCATION_ERROR', errorMsg);

                // 定位失败时，尝试 IP 定位或设置默认城市
                setDefaultLocation(store, currentMapInstance);
                reject(new Error(errorMsg)); // 定位失败，reject Promise
            }
        }, {
            enableHighAccuracy: true, // 尝试获取高精度位置
            timeout: 8000,            // 超时时间 8 秒
            maximumAge: 0             // 不使用缓存的位置结果
        });
    });
}

/**
 * 清除地图上的用户位置标记 (带 _isUserMarker 属性的 Marker)。
 * @param {object} currentMapInstance 地图实例.
 */
function clearUserMarker(currentMapInstance) {
    if (!currentMapInstance) return;
    // console.log("Clearing user marker...");
    const overlays = currentMapInstance.getOverlays();
    const userMarkersToRemove = [];
    overlays.forEach(overlay => {
        if (overlay instanceof BMapGL.Marker && overlay._isUserMarker) {
            userMarkersToRemove.push(overlay);
        }
    });
    userMarkersToRemove.forEach(marker => {
         try {
             currentMapInstance.removeOverlay(marker);
         } catch (e) { console.error("Removing user marker failed:", e); }
    });
     currentUserMarker = null; // 清除全局引用
}

/**
 * 创建一个蓝色圆点带白色内圈的 SVG 图标作为定位标记。
 * @returns {BMapGL.Icon | null}
 */
function createLocationIcon() {
    if (!BMapGL) return null;
    // 稍作修改，增加一点视觉效果
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                   <circle cx="50" cy="50" r="45" fill="#1677FF" fill-opacity="0.3"/>
                   <circle cx="50" cy="50" r="30" fill="#1677FF" stroke="#FFFFFF" stroke-width="5"/>
                 </svg>`;
    return new BMapGL.Icon(
        "data:image/svg+xml;base64," + btoa(svg), // 使用 base64 编码的 SVG
        new BMapGL.Size(30, 30), // 图标尺寸
        {
            anchor: new BMapGL.Size(15, 15), // 锚点在中心
        }
    );
}

/**
 * 设置默认地图中心 (IP 定位或默认城市)。
 * 在定位失败或初始加载时调用。
 * @param {object} store Vuex store 实例.
 * @param {object} currentMapInstance 当前地图实例.
 */
function setDefaultLocation(store, currentMapInstance) {
    if (!BMapGL || !currentMapInstance) return;
    console.warn("尝试 IP 定位或设置默认地图中心...");

    const localCity = new BMapGL.LocalCity();
    localCity.get((result) => {
        let centerPoint, zoomLevel, cityName;
        if (result && result.center && result.name) {
            centerPoint = result.center;
            zoomLevel = result.level || 12;
            cityName = result.name;
            console.log(`根据 IP 定位到城市: ${cityName}`);
        } else {
            cityName = "北京市";
            centerPoint = new BMapGL.Point(116.404, 39.915);
            zoomLevel = 12;
            console.warn(`IP 定位失败，使用默认中心: ${cityName}`);
        }

        // 延迟执行地图视图设置
        console.log(`Setting default map center and zoom: ${centerPoint.lng}, ${centerPoint.lat}, zoom: ${zoomLevel}`);
        setTimeout(() => {
            console.log("Executing default centerAndZoom inside setTimeout...");
             try {
                 currentMapInstance.centerAndZoom(centerPoint, zoomLevel);
                 console.log("Default centerAndZoom executed.");
             } catch (e) {
                 console.error("设置默认视图 centerAndZoom 时出错:", e);
             }
        }, 100); // 延迟 100ms
    });
}

/**
 * 设置输入框的 Autocomplete 功能 (JS API)。
 * @param {string} inputId 输入框元素的 ID.
 * @param {function} onConfirmCallback 用户选择建议项后的回调函数, 参数为选中的地址字符串.
 * @param {object} currentMapInstance 当前地图实例，用于限制搜索范围.
 */
export function setupAutocomplete(inputId, onConfirmCallback, currentMapInstance) {
    if (!BMapGL || !currentMapInstance) { console.warn(`Autocomplete: 地图 SDK 或实例未准备好 (input: #${inputId}).`); return; }

    const inputElement = document.getElementById(inputId);
    if (!inputElement) { console.warn(`Autocomplete: 输入框 #${inputId} 未找到.`); return; }

    try {
        const autocomplete = new BMapGL.Autocomplete({
            input: inputElement,
            location: currentMapInstance, // 使用地图实例限制范围
            // types: ['city', 'district', 'street', 'poi'] // 可以更精细地控制类型
        });

        autocomplete.addEventListener("onconfirm", (e) => {
            const selectedItem = e.item.value;
            // 组合更完整的地址
            const fullAddress = (selectedItem.province || '') +
                                (selectedItem.city || '') +
                                (selectedItem.district || '') +
                                (selectedItem.street || '') +
                                (selectedItem.streetNumber || '') +
                                (selectedItem.business || ''); // business 通常是 POI 名称

            console.log(`Autocomplete confirmed for #${inputId}:`, fullAddress, selectedItem);
            inputElement.blur(); // 失去焦点，收起键盘

            if (onConfirmCallback) {
                // 优先返回拼接的地址，如果为空则返回 POI 名称
                onConfirmCallback(fullAddress.trim() || selectedItem.business);
            }
        });
        // 可以按需监听 onhighlight 事件
        // autocomplete.addEventListener("onhighlight", (e) => { ... });

    } catch (error) {
        console.error(`初始化 Autocomplete for #${inputId} 失败:`, error);
    }
}

// --- 地址解析 (使用 JS API Geocoder) ---

/**
 * 地理编码：将地址字符串转换为坐标点 (JS API)。
 * @param {string} address 地址字符串.
 * @param {object} store Vuex store 实例 (主要用于获取城市信息，减少错误提交).
 * @param {string} [city] 地址所在城市 (可选, 推荐提供以提高精度).
 * @returns {Promise<{lng: number, lat: number}>} 成功时 resolve 坐标对象, 失败时 reject Error.
 */
export function geocode(address, store, city = '') {
    return new Promise((resolve, reject) => {
        if (!BMapGL) { return reject(new Error("geocode: 地图 SDK 未加载")); }
        if (!address || typeof address !== 'string' || !address.trim()) {
            return reject(new Error('geocode: 地址不能为空'));
        }

        const trimmedAddress = address.trim();
        const geocoder = new BMapGL.Geocoder();
        // 优先使用传入的 city，其次尝试从 store 获取当前定位城市
        const searchCity = city || store.state.map.userLocation?.city || undefined;

        console.log(`[JS Geocode] 解析地址: '${trimmedAddress}' in city: '${searchCity || '自动'}'`);

        geocoder.getPoint(trimmedAddress, (point) => {
            if (point) {
                console.log(`[JS Geocode] 解析成功:`, point);
                resolve({ lng: point.lng, lat: point.lat });
            } else {
                const errorMsg = `无法解析地址: '${trimmedAddress}'${searchCity ? ' in ' + searchCity : ''}`;
                console.warn(`[JS Geocode] ${errorMsg}`);
                reject(new Error(errorMsg)); // 直接 reject，让调用方处理错误显示
            }
        }, searchCity); // 传入城市参数
    });
}

/**
 * 逆地理编码：将坐标点转换为地址信息 (JS API)。
 * @param {{lng: number, lat: number}} point 坐标对象.
 * @param {object} store Vuex store 实例 (可选，仅用于潜在的错误记录).
 * @returns {Promise<object>} 成功时 resolve 百度地图 GeocoderResult 对象, 失败时 reject Error.
 */
export function reverseGeocode(point, store) {
    return new Promise((resolve, reject) => {
        if (!BMapGL) { return reject(new Error("reverseGeocode: 地图 SDK 未加载")); }
        if (!point?.lat || !point?.lng) {
            return reject(new Error('reverseGeocode: 无效的坐标点'));
        }

        const geocoder = new BMapGL.Geocoder();
        const bmapPoint = new BMapGL.Point(point.lng, point.lat);

        console.log(`[JS ReverseGeocode] 解析坐标:`, bmapPoint);

        geocoder.getLocation(bmapPoint, (result) => {
            if (result) {
                console.log(`[JS ReverseGeocode] 逆解析成功:`, result.address, result);
                resolve(result); // 返回完整的 GeocoderResult 对象
            } else {
                const errorMsg = `无法逆解析坐标 ${point.lat},${point.lng}`;
                console.warn(`[JS ReverseGeocode] ${errorMsg}`, result);
                reject(new Error(errorMsg)); // 直接 reject
            }
        });
    });
}


// --- 路线规划 (使用 JS API) ---

/**
 * 统一的路线规划函数，使用百度地图 JS API，并依赖其自动渲染。
 * @param {string|{lng: number, lat: number}|BMapGL.Point} start 起点 (地址字符串, {lng, lat} 对象或 BMapGL.Point).
 * @param {string|{lng: number, lat: number}|BMapGL.Point} end 终点.
 * @param {'driving'|'walking'|'riding'|'transit'} mode 交通方式.
 * @param {object} store Vuex store 实例 (用于获取状态和提交结果/错误).
 * @param {object} currentMapInstance 当前地图实例.
 * @param {object} [options={}] 额外的 API 参数 (如 policy).
 * @returns {Promise<Array<object>>} 成功时 resolve 提取的路线方案数组.
 */
export function planRoute(start, end, mode, store, currentMapInstance, options = {}) {
    return new Promise(async (resolve, reject) => {
        if (!BMapGL || !currentMapInstance) {
            const errorMsg = "planRoute: 地图 SDK 或实例未准备好";
            store.commit('map/SET_ROUTE_ERROR', errorMsg);
            return reject(new Error(errorMsg));
        }

        store.commit('map/SET_IS_LOADING_ROUTE', true);
        store.commit('map/SET_ROUTE_ERROR', null);
        store.commit('map/SET_ROUTE_RESULTS', []);
        lastRoutePlanner = null; // 清除旧引用

        let startInput = start;
        let endInput = end;
        let startPoint, endPoint; // BMapGL.Point

        try {
            // --- 1. 解析起点 ---
            if (startInput instanceof BMapGL.Point) {
                startPoint = startInput;
            } else if (typeof startInput === 'string' && startInput.trim()) {
                const startCoords = await geocode(startInput, store); // geocode 返回 {lng, lat}
                startPoint = new BMapGL.Point(startCoords.lng, startCoords.lat);
            } else if (startInput?.lat && startInput?.lng) {
                startPoint = new BMapGL.Point(startInput.lng, startInput.lat);
            } else { throw new Error('起点无效'); }

            // --- 2. 解析终点 ---
            if (endInput instanceof BMapGL.Point) {
                endPoint = endInput;
            } else if (typeof endInput === 'string' && endInput.trim()) {
                const endCoords = await geocode(endInput, store);
                endPoint = new BMapGL.Point(endCoords.lng, endCoords.lat);
            } else if (endInput?.lat && endInput?.lng) {
                endPoint = new BMapGL.Point(endInput.lng, endInput.lat);
            } else { throw new Error('终点无效'); }

            // --- 3. 获取策略 ---
            let policy = options.policy;
            if (policy === undefined) {
                 if (mode === 'driving' && window.BMAP_DRIVING_POLICY_LEAST_TIME !== undefined) policy = store.state.map.drivingPolicy ?? window.BMAP_DRIVING_POLICY_LEAST_TIME;
                 else if (mode === 'transit' && window.BMAP_TRANSIT_POLICY_LEAST_TRANSFER !== undefined) policy = store.state.map.transitPolicy ?? window.BMAP_TRANSIT_POLICY_LEAST_TRANSFER;
                 // 骑行和步行通常没有策略
            }

            // --- 4. 配置渲染选项 (让 JS API 自动绘制) ---
            const renderOptions = {
                map: currentMapInstance,
                autoViewport: true,      // 自动调整视野
                selectFirstResult: true, // 自动选中第一个方案并在地图上高亮
                // panel: 'results-panel-id' // 如果需要 JS API 渲染结果列表
            };

            // --- 5. 创建路线规划实例并设置回调 ---
            let routePlanner;
            const searchCompleteCallback = (results) => {
                store.commit('map/SET_IS_LOADING_ROUTE', false);
                const BMAP_STATUS_SUCCESS = window.BMAP_STATUS_SUCCESS ?? 0;

                // 确保 results 对象存在且 getStatus 方法可用
                if (!results || typeof routePlanner.getStatus !== 'function') {
                     const errorMsg = `路线规划失败: 返回结果无效或状态方法不可用`;
                     console.error(`[JS Route] ${errorMsg}`, results);
                     store.commit('map/SET_ROUTE_ERROR', errorMsg);
                     reject(new Error(errorMsg));
                     return;
                }

                if (routePlanner.getStatus() === BMAP_STATUS_SUCCESS) {
                    console.log(`[JS Route] ${mode} 路线规划成功:`, results);
                    // 从 results 中提取数据
                    const extractedPlans = extractPlansFromJsResult(results, mode); // 移除 store
                    store.commit('map/SET_ROUTE_RESULTS', extractedPlans);
                    resolve(extractedPlans);
                } else {
                    let errorMsg = `路线规划失败`;
                    const status = routePlanner.getStatus();
                    // 根据状态码提供更具体的错误信息
                    if (status === (window.BMAP_STATUS_INVALID_KEY ?? 7)) errorMsg += ': 服务未授权或AK无效';
                    else if (status === (window.BMAP_STATUS_UNKNOWN_ROUTE ?? 5)) errorMsg += ': 未找到符合条件的路线';
                    else if (status === (window.BMAP_STATUS_TIMEOUT ?? 4)) errorMsg += ': 请求超时';
                    else if (status === (window.BMAP_STATUS_INVALID_REQUEST ?? 3)) errorMsg += ': 请求参数非法';
                     else errorMsg += ` (代码: ${status})`;

                    console.error(`[JS Route] ${errorMsg}`, 'Status:', status, 'Results:', results);
                    store.commit('map/SET_ROUTE_ERROR', errorMsg);
                    reject(new Error(errorMsg));
                }
            };

            // --- 创建对应交通方式的规划实例 ---
            switch (mode) {
                case 'driving':
                    routePlanner = new BMapGL.DrivingRoute(currentMapInstance, { // 第一个参数可以是 map 或城市名
                        renderOptions: renderOptions,
                        policy: policy,
                        onSearchComplete: searchCompleteCallback
                    });
                    break;
                case 'walking':
                    routePlanner = new BMapGL.WalkingRoute(currentMapInstance, {
                        renderOptions: renderOptions,
                        onSearchComplete: searchCompleteCallback
                    });
                    break;
                case 'riding':
                    routePlanner = new BMapGL.RidingRoute(currentMapInstance, {
                        renderOptions: renderOptions,
                        onSearchComplete: searchCompleteCallback
                    });
                    break;
                case 'transit':
                    routePlanner = new BMapGL.TransitRoute(currentMapInstance, {
                        renderOptions: renderOptions,
                        policy: policy,
                        pageCapacity: 5, // 最多返回5个方案
                        onSearchComplete: searchCompleteCallback
                    });
                    break;
                default:
                    store.commit('map/SET_IS_LOADING_ROUTE', false);
                    const unsupportedModeMsg = `不支持的交通方式: ${mode}`;
                    store.commit('map/SET_ROUTE_ERROR', unsupportedModeMsg);
                    return reject(new Error(unsupportedModeMsg));
            }

            lastRoutePlanner = routePlanner; // 保存实例引用

            // --- 6. 发起搜索 ---
            console.log(`[JS Route] 开始 ${mode} 搜索:`, startPoint, '->', endPoint, `(Policy: ${policy})`);
            routePlanner.search(startPoint, endPoint);

        } catch (error) {
            // 捕获 geocode 或其他同步错误
            console.error(`[JS Route] 路线规划准备阶段失败 (${mode}):`, error);
            store.commit('map/SET_ROUTE_ERROR', error.message || '路线规划请求失败');
            store.commit('map/SET_IS_LOADING_ROUTE', false);
            reject(error);
        }
    });
}

/**
 * 辅助函数：从 JS API 的路线规划结果中提取方案和步骤信息。
 * @param {DrivingRouteResult | WalkingRouteResult | RidingRouteResult | TransitRouteResult} results JS API 返回的结果对象.
 * @param {'driving'|'walking'|'riding'|'transit'} mode 交通方式.
 * @returns {Array<object>} 提取后的路线方案数组.
 */
function extractPlansFromJsResult(results, mode) {
    const plans = [];
    // 确保 results 和 getNumPlans 方法存在
    const numPlans = results?.getNumPlans ? results.getNumPlans() : 0;

    for (let i = 0; i < numPlans; i++) {
        const plan = results.getPlan(i);
        if (!plan) continue;

        // 获取距离和时间 (处理可能不存在的情况)
        const distance = plan.getDistance ? plan.getDistance(false) : 0; // false 返回数值(米)
        const duration = plan.getDuration ? plan.getDuration(false) : 0; // false 返回数值(秒)

        const startPoi = results.getStart();
        const endPoi = results.getEnd();

        // 提取步骤原始信息
        const rawSteps = extractStepsFromJsPlan(plan, mode);

        plans.push({
            distance: distance,
            duration: duration,
            origin: startPoi ? {
                title: startPoi.title,
                point: startPoi.point, // BMapGL.Point
                address: startPoi.address,
                city: startPoi.city
             } : null,
            destination: endPoi ? {
                title: endPoi.title,
                point: endPoi.point,
                address: endPoi.address,
                city: endPoi.city
            } : null,
            steps: rawSteps,
            mode: mode,
            // 可以尝试获取出租车信息 (仅驾车)
            // taxiFare: (mode === 'driving' && plan.taxiFare) ? plan.taxiFare : null,
            // 可以选择性保留原始 plan 引用，但要注意内存
            // originalPlan: plan
        });
    }
    return plans;
}

/**
 * 辅助函数：从 JS API 的 Plan 对象中提取步骤信息（仅原始数据）。
 * @param {BMapGL.RoutePlan | BMapGL.TransitRoutePlan} plan JS API 的方案对象.
 * @param {'driving'|'walking'|'riding'|'transit'} mode 交通方式.
 * @returns {Array<object>} 包含步骤原始信息的数组.
 */
function extractStepsFromJsPlan(plan, mode) {
    if (!plan) return [];
    const rawSteps = [];

    // 确保 BMapGL 和相关常量可用
    if (!window.BMapGL) {
        console.error("BMapGL is not defined in extractStepsFromJsPlan");
        return [];
    }
    // 动态获取常量值，增加兼容性
    const BMAP_ROUTE_TYPE_WALKING = window.BMAP_ROUTE_TYPE_WALKING ?? 0; // 假设步行常量值为0 (需要验证)
    const BMAP_LINE_TYPE_BUS = window.BMAP_LINE_TYPE_BUS ?? 0; // 假设公交常量值为0 (需要验证)
    const BMAP_LINE_TYPE_SUBWAY = window.BMAP_LINE_TYPE_SUBWAY ?? 1; // 假设地铁常量值为1 (需要验证)
    // ... 其他常量

    try {
        // --- 处理公交路线 ---
        if (mode === 'transit' && typeof plan.getNumTotal === 'function') {
            const numSegments = plan.getNumTotal();
            for (let i = 0; i < numSegments; i++) {
                const segment = plan.getTotal(i);
                const segmentType = plan.getTotalType(i); // 获取常量

                if (!segment) continue;

                if (segmentType === BMAP_ROUTE_TYPE_WALKING && typeof segment.getNumSteps === 'function') { // 步行段
                    const numSteps = segment.getNumSteps();
                    for (let j = 0; j < numSteps; j++) {
                        const step = segment.getStep(j);
                        if (!step) continue;
                        rawSteps.push({
                            originalStep: step,
                            instruction: step.getDescription ? step.getDescription(false) : '步行',
                            rawInstruction: step.getDescription ? step.getDescription(true) : '步行',
                            distance: step.getDistance ? step.getDistance(false) : 0,
                            duration: step.getDuration ? step.getDuration(false) : 0,
                            pathPoints: step.getPath ? step.getPath() : [],
                            position: step.getPosition ? step.getPosition() : null,
                            type: 4, // 步行
                            vehicleInfo: null,
                            routeIndex: i,
                            stepIndex: j,
                        });
                    }
                } else if ((segmentType === BMAP_LINE_TYPE_BUS || segmentType === BMAP_LINE_TYPE_SUBWAY) && typeof segment.getGetOnStop === 'function') { // 公交或地铁段
                    const onStop = segment.getGetOnStop();
                    const offStop = segment.getGetOffStop();
                    const stopNum = segment.getNumViaStops ? segment.getNumViaStops() : 0;
                    const vehicleInfo = `乘坐 ${segment.title || '未知线路'} (${onStop?.title || '未知站'} 上车 - ${offStop?.title || '未知站'} 下车, ${stopNum + 1}站)`;

                    rawSteps.push({
                        originalStep: segment,
                        instruction: vehicleInfo,
                        rawInstruction: vehicleInfo,
                        distance: segment.getDistance ? segment.getDistance(false) : 0,
                        duration: 0,
                        pathPoints: segment.getPath ? segment.getPath() : [],
                        position: onStop?.point,
                        type: segmentType === BMAP_LINE_TYPE_SUBWAY ? 1 : 2, // 地铁或公交
                        vehicleInfo: vehicleInfo,
                        vehicle: {
                            name: segment.title,
                            start_name: onStop?.title,
                            end_name: offStop?.title,
                            stop_num: stopNum + 1
                        },
                        routeIndex: i,
                        stepIndex: -1, // 整个公交段视为一步
                    });
                } else { // 其他类型段落
                     console.warn("未明确处理的公交段落类型:", segmentType, segment);
                     rawSteps.push({
                        originalStep: segment,
                        instruction: segment.title || '未知路段',
                        rawInstruction: segment.title || '未知路段',
                        distance: segment.getDistance ? segment.getDistance(false) : 0,
                        duration: 0,
                        pathPoints: segment.getPath ? segment.getPath() : [],
                        position: segment.getGetOnStop ? segment.getGetOnStop()?.point : (segment.getPosition ? segment.getPosition() : null),
                        type: 0, // 其他
                        vehicleInfo: segment.title,
                        routeIndex: i,
                        stepIndex: -1,
                     });
                }
            }
        }
        // --- 处理驾车、步行、骑行路线 ---
        else if ((mode === 'walking' || mode === 'driving' || mode === 'riding') && typeof plan.getNumRoutes === 'function') {
            const numRoutes = plan.getNumRoutes();
            for (let i = 0; i < numRoutes; i++) {
                const route = plan.getRoute(i);
                if (!route || !route.getNumSteps) continue;
                const numSteps = route.getNumSteps();
                for (let j = 0; j < numSteps; j++) {
                    const step = route.getStep(j);
                    if (!step) continue;
                    rawSteps.push({
                        originalStep: step,
                        instruction: step.getDescription ? step.getDescription(false) : '导航信息',
                        rawInstruction: step.getDescription ? step.getDescription(true) : '导航信息',
                        distance: step.getDistance ? step.getDistance(false) : 0,
                        duration: step.getDuration ? step.getDuration(false) : 0,
                        pathPoints: step.getPath ? step.getPath() : [],
                        position: step.getPosition ? step.getPosition() : null,
                        type: mode === 'walking' ? 4 : (mode === 'driving' ? 3 : 5), // 假设骑行是 5
                        vehicleInfo: null,
                        routeIndex: i,
                        stepIndex: j,
                    });
                }
            }
        }
    } catch (error) {
        console.error(`提取步骤时出错 (Mode: ${mode}):`, error, "Plan:", plan);
        // 可以在这里返回空数组或部分提取的结果
    }
    return rawSteps;
}


// --- 覆盖物绘制与管理 (JS API 自动渲染优先) ---

// 保存当前手动添加的覆盖物引用 (主要用于非路线相关的覆盖物)
// let currentManualOverlays = []; // 如果有需要

/**
 * 在地图上添加一个标记 (Marker)。
 * @param {BMapGL.Point | {lng: number, lat: number}} point 标记的位置.
 * @param {object} currentMapInstance 地图实例.
 * @param {object} [options={}] Marker 选项 (icon, title, zIndex, _isUserMarker, _isRouteMarker 等).
 * @returns {BMapGL.Marker|null} 创建的 Marker 实例或 null.
 */
export function addMarker(point, currentMapInstance, options = {}) {
    if (!BMapGL || !currentMapInstance || !point) {
         console.error("addMarker: Invalid parameters", { point, currentMapInstance });
         return null;
    }
    try {
        const markerPoint = (point instanceof BMapGL.Point) ? point : new BMapGL.Point(point.lng, point.lat);

        const defaultOptions = { enableClicking: true };
        const finalOptions = { ...defaultOptions, ...options };

        // 提供一个更通用的默认图标 (如果未指定)
        if (!finalOptions.icon) {
             finalOptions.icon = new BMapGL.Icon(
                 "data:image/svg+xml;base64," + btoa('<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="#FF5733" d="M512 960C264.576 960 64 759.424 64 512S264.576 64 512 64s448 200.576 448 448-200.576 448-448 448z m0-128c176.736 0 320-143.264 320-320S688.736 192 512 192 192 335.264 192 512s143.264 320 320 320z"></path></svg>'), // 橙色圆点
                 new BMapGL.Size(24, 24),
                 { anchor: new BMapGL.Size(12, 12) }
             );
        }

        const marker = new BMapGL.Marker(markerPoint, finalOptions);
        currentMapInstance.addOverlay(marker);

        // 如果是用户标记，保存引用以便单独清除
        if (options._isUserMarker) {
            currentUserMarker = marker;
        }

        return marker;
    } catch (e) {
        console.error("添加 Marker 出错:", e, { point, options });
        return null;
    }
}

/**
 * 清除地图上所有路线相关的覆盖物和用户标记。
 * @param {object} currentMapInstance 地图实例.
 */
export function clearMapOverlays(currentMapInstance) {
    if (!currentMapInstance) return;
    console.log("Clearing route and user overlays...");

    // 1. 清除 JS API 自动渲染的路线结果
    if (lastRoutePlanner && typeof lastRoutePlanner.clearResults === 'function') {
        try {
            console.log("Clearing JS API auto-rendered results...");
            lastRoutePlanner.clearResults();
        } catch (e) { console.error("Clearing JS API results failed:", e); }
    } else {
        // console.warn("lastRoutePlanner is not available or clearResults is not a function.");
    }

    // 2. 清除手动添加的用户定位标记
    if (currentUserMarker) {
        console.log("Clearing manual user marker...");
        try {
            currentMapInstance.removeOverlay(currentUserMarker);
        } catch (e) { console.error("Removing user marker failed:", e); }
        currentUserMarker = null; // 清除引用
    }

    // 3. (可选) 清除其他手动添加的覆盖物 (如果 drawRouteOnMap 被使用)
    if (currentRouteOverlays.length > 0) {
         console.warn(`Clearing ${currentRouteOverlays.length} manually drawn route overlays...`);
         currentRouteOverlays.forEach(overlay => {
             try { currentMapInstance.removeOverlay(overlay); } catch (e) {}
         });
         currentRouteOverlays = [];
    }

    console.log("Map overlays cleared.");
}

// --- 地图视图控制 ---

/**
 * 调整地图视野以适应给定的点或范围。
 * @param {Array<BMapGL.Point> | BMapGL.Bounds} pointsOrBounds 地理点数组或地理范围对象.
 * @param {object} currentMapInstance 地图实例.
 * @param {object} [options={}] BMapGL.Map.setViewport 的可选参数, 如 margins, enableAnimation.
 */
export function setMapView(pointsOrBounds, currentMapInstance, options = {}) {
    if (!currentMapInstance || !pointsOrBounds || (Array.isArray(pointsOrBounds) && pointsOrBounds.length === 0)) {
         console.warn("setMapView: Invalid parameters or empty points array.");
         return;
     }
    // 移动端默认边距，为顶部和底部 UI 留出空间
    const defaultOptions = {
        margins: [80, 20, 70, 20], // 上、右、下、左
        enableAnimation: true,     // 默认开启动画
        zoomFactor: -0.5           // 稍微缩小一点，避免标记贴边
    };
    const finalOptions = { ...defaultOptions, ...options };

    // 延迟执行，确保地图渲染稳定
    setTimeout(() => {
        try {
            console.log("Setting map viewport with options:", finalOptions);
            currentMapInstance.setViewport(pointsOrBounds, finalOptions);
        } catch (e) { console.error("Set viewport failed:", e); }
    }, 150); // 150ms 延迟
}

/**
 * 平移地图中心点，并可选择设置缩放级别。
 * @param {BMapGL.Point | {lng: number, lat: number}} point 目标中心点.
 * @param {object} currentMapInstance 地图实例.
 * @param {number} [zoomLevel] 可选，平移后设置的目标缩放级别.
 */
export function panTo(point, currentMapInstance, zoomLevel) {
   if (!BMapGL || !currentMapInstance || !point) return;
   try {
       const targetPoint = (point instanceof BMapGL.Point) ? point : new BMapGL.Point(point.lng, point.lat);
       // 使用 panTo 进行平滑移动
       currentMapInstance.panTo(targetPoint, { noAnimation: false });

       // 如果提供了有效的缩放级别，在平移后设置
       if (typeof zoomLevel === 'number' && zoomLevel >= currentMapInstance.getMinZoom() && zoomLevel <= currentMapInstance.getMaxZoom()) {
           // 延迟设置缩放，等待 panTo 动画大致完成
           setTimeout(() => {
               currentMapInstance.setZoom(zoomLevel);
           }, 300); // 300ms 延迟
       }
   } catch (e) { console.error("执行 map.panTo() 或 setZoom() 出错:", e); }
}

// --- 实时路况 ---

/**
 * 切换地图的实时路况图层。
 * @param {object} currentMapInstance 地图实例.
 * @param {boolean} enable true 开启, false 关闭.
 */
export function toggleTrafficLayer(currentMapInstance, enable) {
   if (!currentMapInstance) return;
   try {
       if (enable) {
           console.log("开启实时路况图层");
           currentMapInstance.setTrafficOn();
       } else {
           console.log("关闭实时路况图层");
           currentMapInstance.setTrafficOff();
       }
   } catch (e) {
       console.error("切换路况图层失败:", e);
   }
}

// --- 地图类型切换 ---

/**
 * 切换地图类型（普通图与卫星图之间切换）。
 * @param {object} currentMapInstance 地图实例.
 * @param {'BMAP_NORMAL_MAP' | 'BMAP_SATELLITE_MAP'} typeId 目标地图类型常量字符串.
 */
export function setMapType(currentMapInstance, typeId) {
    if (!BMapGL || !currentMapInstance) {
        console.error("setMapType: Map SDK or instance not ready.");
        return;
    }

    // 从 window 对象获取百度地图 API 定义的常量值
    const mapTypeConstant = window[typeId];

    if (mapTypeConstant !== undefined) {
        try {
            currentMapInstance.setMapType(mapTypeConstant);
            console.log(`Map type set to: ${typeId}`);
        } catch (e) {
            console.error(`设置地图类型 (${typeId}) 失败:`, e);
            throw e; // 重新抛出错误，通知调用者
        }
    } else {
        const errorMsg = `无效的地图类型常量: ${typeId}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}
// --- 【【新增】】坐标转换函数 ---
/**
 * 将 BD09LL 坐标转换为 GCJ02 坐标。
 * @param {{lng: number, lat: number}} point BD09LL 坐标对象.
 * @returns {Promise<{lng: number, lat: number}>} 成功时 resolve GCJ02 坐标对象, 失败时 reject Error.
 */
export function convertBd09ToGcj02(point) {
    return new Promise((resolve, reject) => {
      // 确保 BMapGL 和 Convertor 可用
      if (!window.BMapGL || !window.BMapGL.Convertor) {
        console.error("[Coord Convert] BMapGL or BMapGL.Convertor is not available.");
        return reject(new Error("坐标转换器 BMapGL.Convertor 不可用或 SDK 未加载"));
      }
      if (!point?.lng || !point?.lat) {
        console.error("[Coord Convert] Invalid point for conversion:", point);
        return reject(new Error("无效的 BD09LL 坐标点，无法进行转换"));
      }
  
      const convertor = new BMapGL.Convertor();
      const pointArr = [new BMapGL.Point(point.lng, point.lat)];
  
      // 使用百度地图 JS API 的坐标转换功能
      // coordType 参数定义: 1(WGS84), 2(WGS84_MC), 3(GCJ02), 4(GCJ02_MC), 5(BD09LL), 6(BD09MC)
      // 从 BD09LL (5) 转换为 GCJ02 (3)
      console.log(`[Coord Convert] 开始转换: BD09LL (${point.lng}, ${point.lat}) to GCJ02...`);
      convertor.translate(pointArr, 5, 3, (result) => {
        if (result.status === 0 && result.points && result.points.length > 0) {
          const gcj02Point = {
            lng: result.points[0].lng,
            lat: result.points[0].lat
          };
          console.log(`[Coord Convert] 转换成功: GCJ02 (${gcj02Point.lng}, ${gcj02Point.lat})`);
          resolve(gcj02Point);
        } else {
          console.error("[Coord Convert] BD09LL 转 GCJ02 失败. Status:", result.status, "Result:", result);
          reject(new Error(`坐标转换失败 (状态码: ${result.status})`));
        }
      });
    });
  }

// --- 其他辅助函数 ---

/**
 * 获取最后一次使用的路线规划实例引用。
 * @returns {object | null} BMapGL 路线规划实例或 null.
 */
export function getLastPlanner() {
    return lastRoutePlanner;
}

// 注意: drawRouteOnMap 函数已移除，因为推荐使用 JS API 的 renderOptions 自动渲染。
// 如果确实需要手动绘制，可以将之前的 drawRouteOnMap 代码加回来，
// 但需要确保在 planRoute 中不使用 renderOptions.map，
// 并在路线规划成功的回调中调用 drawRouteOnMap。