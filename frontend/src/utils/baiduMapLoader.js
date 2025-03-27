export function loadBaiduMapScript(callback) {
    if (window.BMap) {
      callback();
      return;
    }
  
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=0gjEeXP5jRZqxg6U88MvpvCe3lMMms1J&callback=initBaiduMap`;
    script.onerror = () => console.error("百度地图 API 加载失败");
  
    window.initBaiduMap = () => {
      callback();
    };
  
    document.body.appendChild(script);
  }
  