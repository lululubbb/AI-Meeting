<template>
  <div class="map-container">
    <div class="search-bar">
      <div class="search-input-container">
        <input v-model="destination" placeholder="输入目的地" class="destination-input" />
      </div>

      <div class="button-group">
        <button @click="searchRoute">搜索路线</button>
        <select v-model="transportMode">
          <option value="driving">驾车</option>
          <option value="walking">步行</option>
          <option value="transit">公交</option>
          <option value="subway">地铁</option>
        </select>
        <button @click="returnToCurrentLocation">当前位置</button>
      </div>
    </div>

    <div v-if="userPoint" class="location-info">
      <p>当前位置: {{ locationName }}</p>
    </div>

    <div id="map-container"></div>

    <div v-if="routeDuration || routeDetails.length" class="route-info">
      <p v-if="routeDuration" class="duration">
        预计时间：{{ routeDuration }} | 预计费用：{{ routeCost }}
      </p>
      <!-- 显示主要途经点 -->
      <div v-if="waypoints && waypoints.length" class="waypoints">
        <h3>主要途经点</h3>
        <ul>
          <li v-for="(point, index) in waypoints" :key="'waypoint-' + index">
            {{ index + 1 }}. {{ point.name }} ({{ point.action }})
          </li>
        </ul>
      </div>

      <div v-if="routeDetails && routeDetails.length" class="route-details">
        <h3>路线详情</h3>
        <ul>
          <li v-for="(detail, index) in routeDetails" :key="index">{{ detail }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MapComponent",
  data() {
    return {
      map: null,
      userPoint: null,
      cityName: "",
      destination: "",
      transportMode: "driving",
      routeDuration: "",
      locationName: "",
      currentRoute: null,
      mapLoaded: false,
      routeDetails: [],
      routeCost: "", // 新增字段，用于存储预计费用
      routeDetails: [], // 初始化为空数组
      waypoints: [], // 初始化为空数组
      geocodeCache: {}, // 地理编码缓存
    };
  },
  methods: {
    loadBaiduMap() {
      if (window.BMap) {
        this.initMap();
      } else {
        window.initBaiduMap = () => this.initMap();
        const script = document.createElement("script");
        script.src =
          "https://api.map.baidu.com/api?v=3.0&ak=0gjEeXP5jRZqxg6U88MvpvCe3lMMms1J&callback=initBaiduMap";
        script.async = true;
        script.onerror = () => console.error("百度地图脚本加载失败");
        document.body.appendChild(script);
      }
    },
    initMap() {
      this.mapLoaded = true;
      this.map = new BMap.Map("map-container", {
        enableMapClick: false,
        enableDragging: true,
        enablePinchToZoom: true,
      });
      // 启用鼠标滚轮缩放功能
      this.map.enableScrollWheelZoom(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            this.userPoint = new BMap.Point(lng, lat);
            const zoomLevel = position.coords.accuracy < 100 ? 18 : 15; // 根据精度调整缩放层级
            this.map.centerAndZoom(this.userPoint, zoomLevel);
            this.reverseGeocode();
            this.addCurrentLocationMarker(this.userPoint); // 添加当前位置标记
          },
          () => this.setDefaultLocation(),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        this.setDefaultLocation();
      }
    },

    // 新增方法：添加当前位置图标
    addCurrentLocationMarker(point) {
      // 使用百度地图提供的默认图标
      const currentLocationIcon = new BMap.Icon(
        "https://api.map.baidu.com/img/markers.png", // 百度地图提供的默认图标
        new BMap.Size(23, 25), // 图标大小
        {
          offset: new BMap.Size(10, 25), // 偏移量
          imageOffset: new BMap.Size(0, 0), // 图标偏移
        }
      );

      // 创建标记
      const marker = new BMap.Marker(point, { icon: currentLocationIcon });
      this.map.addOverlay(marker); // 添加到地图
    },
    setDefaultLocation() {
      const localCity = new BMap.LocalCity();
      localCity.get((result) => {
        const cityName = result.name || "杭州";
        const point = result.center || new BMap.Point(120.1934, 30.2674); // 默认为杭州
        this.userPoint = point;
        this.map.centerAndZoom(point, 15);
        this.cityName = cityName;
        this.locationName = cityName;
        this.addCurrentLocationMarker(point); // 添加默认位置图标
      });
    },

    reverseGeocode() {
      const geocoder = new BMap.Geocoder();
      geocoder.getLocation(
        this.userPoint,
        (result) => {
          if (result) {
            this.locationName = result.addressComponents.city;
            this.cityName = result.addressComponents.city || "未知";
          } else {
            this.locationName = "无法获取地址";
          }
        },
        { poiRadius: 1000, numPois: 10 } // 增加 POI 范围和数量以提高精度
      );
    },
    searchRoute() {
      // 重置之前的数据
      this.routeDetails = [];
      this.waypoints = [];
      this.routeDuration = "";
      this.routeCost = "";

      if (!this.destination) {
        alert("请输入目的地");
        return;
      }
      if (!this.mapLoaded) {
        alert("地图未加载完成");
        return;
      }
      const geocoder = new BMap.Geocoder();
      geocoder.getPoint(
        this.destination,
        (destPoint) => {
          if (!destPoint) {
            alert("无法解析目的地地址");
            return;
          }
          this.map.clearOverlays();
          this.map.addOverlay(new BMap.Marker(destPoint));
          this.map.centerAndZoom(destPoint, 15);
          if (this.currentRoute) this.currentRoute.clearResults();
          let route;
          const commonConfig = {
            renderOptions: { map: this.map, autoViewport: true },
            onSearchComplete: (results) => {
              if (!results || results.getNumPlans() === 0) {
                console.error("路径规划失败：未找到有效路线");
                return;
              }
              // 正常处理结果
              this.displayRouteInfo(results);
              this.routeDetails = this.parseRouteDetails(results);
              this.calculateRouteCost(results);
            },
          };

          switch (this.transportMode) {
            case "driving":
              route = new BMap.DrivingRoute(this.map, {
                renderOptions: {
                  map: this.map,
                  autoViewport: true,
                  enableDragging: true,
                },
                policy: BMAP_DRIVING_POLICY_DEFAULT, // 可以改为BMAP_DRIVING_POLICY_LEAST_TIME等
                // 修改后的 onSearchComplete 回调
                onSearchComplete: async (results) => {
                  console.group("驾车路线规划完整结果");
                  console.log("原始结果对象:", results);

                  if (results && results.Yl && results.Yl[0]) {
                    const plan = results.Yl[0];
                    console.log("方案详情:", {
                      distance: plan.Zj,
                      time: plan.If,
                      routes: plan.ai,
                    });
                  }
                  console.groupEnd();

                  // 显示路线信息
                  this.displayRouteInfo(results);
                  this.routeDetails = await this.parseDrivingDetails(results);
                  this.calculateRouteCost(results);
                },
                onMarkersSet: (markers) => {
                  console.log("起点终点标记:", markers);
                },
                onPolylinesSet: (routes) => {
                  console.log("绘制的路线:", routes);
                },
                onInfoHtmlSet: (html, marker) => {
                  console.log("信息窗口内容:", html);
                },
              });
              break;
            case "walking":
              route = new BMap.WalkingRoute(this.map, {
                renderOptions: { map: this.map, autoViewport: true },
                onSearchComplete: (results) => {
                  this.displayRouteInfo(results);
                  this.routeDetails = this.parseRouteDetails(results);
                },
              });
              break;
            case "transit": // 公交
              route = new BMap.TransitRoute(this.map, {
                renderOptions: { map: this.map, autoViewport: true },
                policy: window.BMAP_TRANSIT_POLICY_RECOMMEND, // 推荐路线
                onSearchComplete: (results) => {
                  if (!results || results.getNumPlans() === 0) {
                    console.error("未找到公交路线");
                    return;
                  }
                  console.log("公交路线结果:", results);
                  this.displayRouteInfo(results);
                  this.routeDetails = this.parseRouteDetails(results);
                  this.calculateRouteCost(results);
                },
              });
              break;

            case "subway": // 地铁
              route = new BMap.TransitRoute(this.map, {
                renderOptions: { map: this.map, autoViewport: true },
                policy: window.BMAP_TRANSIT_POLICY_SUBWAY_FIRST, // 地铁优先
                onSearchComplete: (results) => {
                  if (!results || results.getNumPlans() === 0) {
                    console.error("未找到地铁路线");
                    return;
                  }
                  console.log("地铁路线结果:", results);
                  this.displayRouteInfo(results);
                  this.routeDetails = this.parseRouteDetails(results);
                  this.calculateRouteCost(results);
                },
              });
              break;
            default:
              console.error("未知的交通方式");
          }

          /*
          switch (this.transportMode) {
            case "driving":
              route = new BMap.DrivingRoute(this.map, {
                ...commonConfig,
                onSearchComplete: (results) => {
                  this.displayRouteInfo(results);
                  this.routeDetails = this.parseDrivingDetails(results);
                },
              });
              break;
            case "walking":
              route = new BMap.WalkingRoute(this.map, commonConfig);
              break;
            default:
              route = new BMap.TransitRoute(this.map, {
                ...commonConfig,
                policy: this.transportMode === "subway" ? 3 : 0,
              });
          }
              */

          this.currentRoute = route;
          route.search(this.userPoint, destPoint);
        },
        this.cityName || "全国"
      );
    },

    // 新增方法：根据坐标获取地点名称
    // 更新后的 getLocationName 方法
    async getLocationName(point) {
      if (!point || !point.lat || !point.lng) return null;

      // 简单缓存机制
      const cacheKey = `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`;
      if (this.geocodeCache && this.geocodeCache[cacheKey]) {
        return this.geocodeCache[cacheKey];
      }

      return new Promise((resolve) => {
        const geocoder = new BMap.Geocoder();
        geocoder.getLocation(
          new BMap.Point(point.lng, point.lat),
          (result) => {
            let name = null;

            if (result) {
              // 优先使用POI名称，如果没有则使用道路+门牌号，最后使用区县名称
              if (result.surroundingPois && result.surroundingPois.length > 0) {
                name = result.surroundingPois[0].title;
              } else if (result.address) {
                const addr = result.addressComponents;
                name = addr.street || addr.district || addr.city;
                if (addr.streetNumber) name += addr.streetNumber;
              }
            }

            // 初始化缓存
            if (!this.geocodeCache) this.geocodeCache = {};
            this.geocodeCache[cacheKey] = name;

            resolve(name);
          },
          {
            poiRadius: 50, // 搜索50米范围内的POI
            extensions_poi: 1, // 返回周边POI信息
          }
        );
      });
    },
    // 修改后的 parseDrivingDetails 方法
    // 修改后的 parseDrivingDetails 方法
    async parseDrivingDetails(results) {
      if (!results || !results.Yl || !Array.isArray(results.Yl)) {
        console.error("无效的驾车路线结果", results);
        return ["无法获取驾车路线详情"];
      }

      const details = [];
      const plan = results.Yl[0]; // 获取第一个方案
      if (!plan) {
        return ["无法获取路线方案"];
      }

      try {
        // 1. 添加总体信息
        const totalDistance = (plan.Zj / 1000).toFixed(1);
        const totalTime = Math.ceil(plan.If / 60);
        details.push(`🚗 驾车路线总距离: ${totalDistance}公里 `);

        // 2. 解析详细导航指令
        if (plan.ai && plan.ai.length > 0) {
          const route = plan.ai[0];

          if (route.ds && route.ds.length > 0) {
            let previousPoint = null;

            for (let i = 0; i < route.ds.length; i++) {
              try {
                const step = route.ds[i];
                const nextStep = i < route.ds.length - 1 ? route.ds[i + 1] : null;
                const instruction = await this.parseDrivingStep(
                  step,
                  previousPoint,
                  nextStep
                );
                if (instruction) {
                  details.push(instruction);
                }
                previousPoint = step.Zh;
              } catch (stepError) {
                console.error(`解析步骤${i}时出错:`, stepError);
                continue;
              }
            }
          } else if (route.Or && route.Or.length > 0) {
            details.push("🗺 基础路线指引:");
            await this.generateEnhancedInstructions(route.Or, details);
          }
        }
      } catch (e) {
        console.error("解析驾车路线时出错:", e);
        return ["路线解析出错，请查看地图显示"];
      }

      return details;
    },
    // 解析单个驾驶步骤
    // 修改后的 parseDrivingStep 方法
    // 修改后的 parseDrivingStep 方法
    async parseDrivingStep(step, previousPoint, nextStep) {
      if (!step) return null;

      const distance = step.If ? step.If : 0;
      const point = step.Zh || {};
      const actionType = step.hk; // 百度地图的动作类型代码
      const roadName = step.Yg || ""; // 道路名称

      // 获取方向信息
      const direction = previousPoint ? this.getDirection(previousPoint, point) : "";

      // 根据动作类型生成对应的导航指令
      let action = "";
      switch (actionType) {
        case 0:
          action = `从起点向${direction}方向出发`;
          if (roadName) action += `,沿${roadName}`;
          break;
        case 1:
          action = `沿${roadName || "当前道路"}`;
          break;
        case 2:
          action = "右转";
          break;
        case 3:
          action = "左转";
          break;
        case 4:
          action = "向右前方转";
          break;
        case 5:
          action = "向左前方转";
          break;
        case 6:
          action = "向右后方转";
          break;
        case 7:
          action = "向左后方转";
          break;
        case 8:
          action = "到达终点";
          if (roadName) action += `[${roadName}]`;
          break;
        case 9:
          action = "左转掉头";
          break;
        case 10:
          action = "右转掉头";
          break;
        default:
          action = "继续前行";
      }

      // 处理特殊路况
      let specialInfo = "";
      if (step.gU === 1) specialInfo = ",过天桥";
      if (step.gU === 2) specialInfo = ",过地下通道";
      if (step.gU === 3) specialInfo = ",过扶梯";
      if (step.jB === 1) specialInfo = ",到路口斜对面";

      // 获取地点名称
      let locationInfo = "";
      if (point.lat && point.lng) {
        try {
          const locationName = await this.getLocationName(point);
          if (locationName && locationName !== "未知位置") {
            if (actionType === 0) {
              locationInfo = `[起点: ${locationName}]`;
            } else if (actionType === 8) {
              locationInfo = `[终点: ${locationName}]`;
            } else {
              locationInfo = `[${locationName}]`;
            }
          }
        } catch (e) {
          console.error("获取地点名称失败:", e);
        }
      }

      // 构造完整的导航指令
      let instruction = `▸ ${action}`;
      if (distance > 0) {
        instruction += `走${
          distance >= 1000 ? (distance / 1000).toFixed(1) + "公里" : distance + "米"
        }`;
      }
      if (specialInfo) instruction += specialInfo;
      if (nextStep && nextStep.Yg && nextStep.Yg !== roadName) {
        instruction += `,${actionType >= 2 && actionType <= 7 ? "进入" : ""}${
          nextStep.Yg
        }`;
      }
      if (locationInfo) instruction += ` 到达${locationInfo}`;

      return instruction;
    },

    // 新增方法：计算两点之间的方向
    // 修复后的 getDirection 方法
    getDirection(fromPoint, toPoint) {
      if (!fromPoint || !toPoint) return "";

      // 计算经度和纬度差
      const lngDiff = toPoint.lng - fromPoint.lng;
      const latDiff = toPoint.lat - fromPoint.lat;

      // 计算角度（0-360度）
      let angle = (Math.atan2(lngDiff, latDiff) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      // 定义16个基本方向
      const directions = [
        "北",
        "北北东",
        "东北",
        "东北东",
        "东",
        "东南东",
        "东南",
        "东南南",
        "南",
        "西南南",
        "西南",
        "西南西",
        "西",
        "西北西",
        "西北",
        "西北北",
      ];

      // 将角度映射到16个方向
      const index = Math.round(angle / 22.5) % 16;
      return directions[index];
    },
    // 新增方法：提取主要途经点
    async extractWaypoints(results) {
      if (!results || !results.Yl || results.Yl.length === 0) return [];

      const waypoints = [];
      const plan = results.Yl[0];

      if (plan.ai && plan.ai.length > 0) {
        const route = plan.ai[0];

        // 提取关键转向点
        if (route.ds && route.ds.length > 0) {
          for (const step of route.ds) {
            if (step.hk > 1 && step.hk < 8) {
              // 只提取转向点
              const name = await this.getLocationName(step.Zh);
              waypoints.push({
                name: name,
                point: step.Zh,
                action: this.getActionDescription(step.hk),
                distance: step.If,
              });
            }
          }
        }
      }

      return waypoints;
    },

    // 新增方法：获取转向动作描述
    getActionDescription(actionType) {
      switch (actionType) {
        case 2:
          return "左转";
        case 3:
          return "右转";
        case 4:
          return "左前方转弯";
        case 5:
          return "右前方转弯";
        case 6:
          return "左后方转弯";
        case 7:
          return "右后方转弯";
        case 9:
          return "左转掉头";
        case 10:
          return "右转掉头";
        default:
          return "继续前行";
      }
    },
    // 生成基础路线指引（当无法获取详细步骤时）
    // 修改后的 generateBasicInstructions 方法
    async generateBasicInstructions(points, details) {
      if (!points || points.length < 2) return;

      // 计算总距离
      const totalDistance = this.calculatePathDistance(points);
      details.push(`▸ 总距离: ${(totalDistance / 1000).toFixed(1)}公里`);

      // 获取起点名称
      const startName = await this.getLocationName(points[0]);
      details.push(`▸ 起点: ${startName}`);

      // 分析路线方向变化
      let lastBearing = null;
      let straightDistance = 0;
      let straightStart = points[0];
      let straightStartIndex = 0;

      for (let i = 1; i < points.length; i++) {
        const bearing = this.calculateBearing(points[i - 1], points[i]);
        const distance = this.getDistance(points[i - 1], points[i]);

        // 如果方向变化大于15度，认为是转向点
        if (lastBearing !== null && Math.abs(bearing - lastBearing) > 15) {
          const locationName = await this.getLocationName(points[i - 1]);
          details.push(
            `▸ 从 ${await this.getLocationName(
              straightStart
            )} 直行 ${straightDistance.toFixed(0)}米`
          );
          details.push(
            `▸ 在 ${locationName} 处转向 ${bearing > lastBearing ? "右" : "左"}`
          );
          straightDistance = 0;
          straightStart = points[i - 1];
          straightStartIndex = i - 1;
        }

        straightDistance += distance;
        lastBearing = bearing;
      }

      // 添加最后一段
      const endName = await this.getLocationName(points[points.length - 1]);
      details.push(
        `▸ 从 ${await this.getLocationName(
          straightStart
        )} 直行 ${straightDistance.toFixed(0)}米`
      );
      details.push(`▸ 到达终点: ${endName}`);
    },

    // 计算两点之间的方位角（0-360度）
    calculateBearing(start, end) {
      const startLat = (start.lat * Math.PI) / 180;
      const startLng = (start.lng * Math.PI) / 180;
      const endLat = (end.lat * Math.PI) / 180;
      const endLng = (end.lng * Math.PI) / 180;

      const y = Math.sin(endLng - startLng) * Math.cos(endLat);
      const x =
        Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
      let bearing = (Math.atan2(y, x) * 180) / Math.PI;
      return (bearing + 360) % 360;
    },
    // 计算路径总距离（简化版）
    calculatePathDistance(points) {
      let distance = 0;
      for (let i = 1; i < points.length; i++) {
        distance += this.getDistance(points[i - 1], points[i]);
      }
      return distance;
    },

    // 计算两点间距离（简化的球面距离公式）
    getDistance(point1, point2) {
      const rad = (d) => (d * Math.PI) / 180.0;
      const lat1 = point1.lat;
      const lng1 = point1.lng;
      const lat2 = point2.lat;
      const lng2 = point2.lng;

      const radLat1 = rad(lat1);
      const radLat2 = rad(lat2);
      const a = radLat1 - radLat2;
      const b = rad(lng1) - rad(lng2);

      return (
        2 *
        6378137 *
        Math.asin(
          Math.sqrt(
            Math.pow(Math.sin(a / 2), 2) +
              Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
          )
        )
      );
    },

    // 获取路径中的关键点
    getKeyPoints(points) {
      if (!points || points.length <= 5) return points || [];

      const interval = Math.floor(points.length / 5);
      return [
        points[0],
        points[interval],
        points[interval * 2],
        points[interval * 3],
        points[points.length - 1],
      ];
    },
    calculateRouteCost(results) {
      if (!results || results.getNumPlans() === 0) {
        this.routeCost = "无法获取费用";
        return;
      }
      const plan = results.getPlan(0);
      let cost = 0;

      switch (this.transportMode) {
        case "driving":
          //const distance = plan.getDistance(false); // 获取距离（单位：米）
          //cost = (distance / 1000) * 1; // 假设每公里 1 元
          //this.routeCost = `约 ${cost.toFixed(2)} 元`;
          this.routeCost = "免费";
          break;
        case "walking":
          this.routeCost = "免费";
          break;
        case "transit": // 公交
        case "subway": // 地铁
          let totalFare = 0;
          for (let i = 0; i < plan.getNumLines(); i++) {
            const line = plan.getLine(i);
            if (line && line.fare) {
              totalFare += parseFloat(line.fare); // 累加票价
            } else {
              totalFare += 2; // 默认票价 2 元
            }
          }
          this.routeCost = `约 ${totalFare.toFixed(2)} 元`;
          break;
        default:
          this.routeCost = "无法计算费用";
      }
    },

    parseRouteDetails(results) {
      if (!results || results.getNumPlans() === 0) return [];
      const plan = results.getPlan(0);
      const details = [];
      if (this.transportMode === "transit" || this.transportMode === "subway") {
        for (let i = 0; i < plan.getNumLines(); i++) {
          const line = plan.getLine(i);
          if (!line) continue;
          const getStopTitle = (stop) => (stop && stop.title) || "未知站点";
          try {
            const routeInfo = [
              `上车：${getStopTitle(line.getGetOnStop())}`,
              ...(line.viaStops || []).map((stop) => `中转：${getStopTitle(stop)}`),
              `下车：${getStopTitle(line.getGetOffStop())}`,
            ].join(" → ");
            details.push(`🚌 ${line.title || "未知线路"}：${routeInfo}`);
          } catch (e) {
            console.warn("线路解析异常:", e);
          }
        }
      } else if (this.transportMode === "walking") {
        details.push("🚶♂️ 步行路线：");
        for (let i = 0; i < plan.getNumRoutes(); i++) {
          const route = plan.getRoute(i);
          for (let j = 0; j < route.getNumSteps(); j++) {
            const step = route.getStep(j);
            if (step) {
              const desc = this.cleanStepDescription(step.getDescription());
              const keyMatch = desc.match(/出发|到达|进入|拐入|经过|换乘/);
              if (keyMatch) {
                details.push(`▸ ${desc}`);
              }
            }
          }
        }
      }
      return details;
    },
    cleanStepDescription(desc) {
      return (desc || "")
        .replace(/<\/?b>/g, "")
        .replace(/<\/?[^>]+>/g, "")
        .replace(/继续向前/g, "直行")
        .replace(/<[^>]+>/g, "");
    },
    displayRouteInfo(results) {
      if (!results || results.getNumPlans() === 0) {
        this.routeDuration = "无法获取路线信息";
        return;
      }
      this.routeDuration = results.getPlan(0).getDuration(true);
    },
    displayDrivingRouteInfo(results) {
      if (!results || !results.Yl || results.Yl.length === 0) {
        this.routeDuration = "无法获取路线信息";
        return;
      }

      const plan = results.Yl[0];
      if (plan.If) {
        const minutes = Math.ceil(plan.If / 60);
        this.routeDuration = `${minutes}分钟`;
      } else {
        this.routeDuration = "时间未知";
      }
    },
    returnToCurrentLocation() {
      if (this.userPoint && this.map) {
        this.map.panTo(this.userPoint);
        alert("已回到当前位置");
      } else {
        alert("当前位置未获取到");
      }
    },
  },

  mounted() {
    this.loadBaiduMap();
    document.getElementById("map-container").addEventListener("touchstart", () => {
      console.log("Touch event detected on map container");
    });
  },
};
</script>

<style scoped>
.route-details {
  background: #f8f8f8;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}
.route-details h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}
.route-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.route-details li {
  padding: 8px 0;
  line-height: 1.6;
  border-bottom: 1px dashed #eee;
}
.route-details li:last-child {
  border-bottom: none;
}
#map-container {
  width: 100%;
  height: 500px; /* 确保高度足够 */
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: visible; /* 确保溢出内容可见 */
  position: relative; /* 确保定位正确 */
  touch-action: auto; /* 确保触摸事件正常工作 */
}
.map-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.search-bar {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  justify-content: center; /* 水平居中对齐 */
  gap: 10px; /* 设置组件之间的间距 */
  margin-bottom: 20px;
  flex-wrap: wrap; /* 允许换行 */
}
.search-input-container {
  flex: 1; /* 输入框占据剩余空间 */
  max-width: 400px; /* 最大宽度限制 */
  min-width: 200px; /* 最小宽度限制 */
}
.destination-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.button-group {
  display: flex;
  gap: 10px; /* 按钮之间的间距 */
  align-items: center; /* 垂直居中对齐 */
}
.search-bar button,
.search-bar select {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}
.search-bar button:hover,
.search-bar select:hover {
  background: #0d77d9;
}
.location-info {
  text-align: center;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}
.duration {
  font-weight: bold;
  color: #f60;
  text-align: center;
  margin-bottom: 10px;
}
.route-info {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.route-info h3 {
  margin-top: 0;
  font-size: 20px;
  color: #333;
}
.route-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.route-info li {
  margin: 10px 0;
  padding-left: 20px;
  position: relative;
  font-size: 14px;
  color: #555;
}
.route-info li:before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: #1890ff;
  border-radius: 50%;
}

/* 响应式设计：手机端 */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column; /* 将搜索栏从横向改为纵向 */
    align-items: stretch; /* 让子元素铺满宽度 */
  }
  .search-bar input {
    width: 100%; /* 输入框占满父容器宽度 */
    margin-bottom: 10px; /* 增加输入框与按钮之间的间距 */
  }
  .button-group {
    flex-direction: row; /* 按钮水平排列 */
    justify-content: space-between; /* 按钮均匀分布 */
  }
  .search-bar button,
  .search-bar select {
    width: auto; /* 按钮宽度自适应内容 */
    flex: 1; /* 每个按钮或下拉框均分宽度 */
    margin-right: 5px; /* 按钮之间留出间距 */
    padding: 10px; /* 统一按钮内边距 */
  }
  .search-bar button:last-child,
  .search-bar select:last-child {
    margin-right: 0; /* 最后一个按钮不需要右边距 */
  }
}
</style>
