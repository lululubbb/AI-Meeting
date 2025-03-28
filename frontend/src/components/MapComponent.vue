<template>
  <div class="map-container">
    <div class="search-bar">
      <input v-model="destination" placeholder="输入目的地" />
      <button @click="searchRoute">搜索路线</button>
      <select v-model="transportMode">
        <option value="driving">驾车</option>
        <option value="walking">步行</option>
        <option value="transit">公交</option>
        <option value="subway">地铁</option>
      </select>
      <button @click="returnToCurrentLocation">回到当前位置</button>
    </div>

    <div v-if="userPoint" class="location-info">
      <p>当前位置: {{ locationName }}</p>
    </div>

    <div id="map-container"></div>

    <div v-if="routeDuration || routeDetails.length" class="route-info">
      <p v-if="routeDuration" class="duration">
        预计时间：{{ routeDuration }} | 预计费用：{{ routeCost }}
      </p>
      <div v-if="routeDetails.length" class="route-details">
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
      this.map = new BMap.Map("map-container", { enableMapClick: false });
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
                //...commonConfig,
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

    parseDrivingDetails(results) {
      if (!results || results.getNumPlans() === 0) return [];
      const plan = results.getPlan(0);
      const details = ["🚗 驾车路线：起点"];
      for (let i = 0; i < plan.getNumRoutes(); i++) {
        const route = plan.getRoute(i);
        for (let j = 0; j < route.getNumSteps(); j++) {
          const step = route.getStep(j);
          if (step) {
            const desc = this.cleanStepDescription(step.getDescription());
            const keyMatch = desc.match(/出发|到达|进入|拐入|经过|换乘|下高速|上高速/);
            if (keyMatch) {
              details.push(`▸ ${desc}`);
            }
          }
        }
      }
      details.push("→ 终点");
      return details;
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
  },
};
</script>

<style scoped>
#map-container {
  width: 100%;
  height: 500px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  position: relative; /* 确保图标定位正确 */
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
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.search-bar input {
  width: 300px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
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

#map-container {
  width: 100%;
  height: 500px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
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
</style>
