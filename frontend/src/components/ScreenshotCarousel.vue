<template>
    <div class="screenshot-carousel">
      <div class="screenshot-wrapper" ref="screenshotWrapper">
        <img
          :src="screenshot"
          alt="产品截图"
          class="screenshot"
          v-for="(screenshot, index) in screenshots"
          :key="index"
        />
      </div>
      <!-- 指示器 -->
      <div class="carousel-indicators">
        <span
          v-for="(screenshot, index) in screenshots"
          :key="index"
          :class="['indicator', { active: currentIndex === index }]"
          @click="goToSlide(index)"
        ></span>
      </div>
      <!-- 导航按钮 -->
      <div class="carousel-buttons">
        <button @click="prevSlide" :disabled="currentIndex === 0">
          <span class="arrow">&#10094;</span>
        </button>
        <button @click="nextSlide" :disabled="currentIndex === screenshots.length - 1">
          <span class="arrow">&#10095;</span>
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  
  const props = defineProps({
    screenshots: {
      type: Array,
      required: true
    }
  })
  
  const screenshotWrapper = ref(null)
  const currentIndex = ref(0)
  const intervalId = ref(null)
  
  const nextSlide = () => {
    currentIndex.value = (currentIndex.value + 1) % props.screenshots.length
    updateScreenshotPosition()
  }
  
  const prevSlide = () => {
    currentIndex.value = (currentIndex.value - 1 + props.screenshots.length) % props.screenshots.length
    updateScreenshotPosition()
  }
  
  const goToSlide = (index) => {
    currentIndex.value = index
    updateScreenshotPosition()
  }
  
  const updateScreenshotPosition = () => {
    const wrapper = screenshotWrapper.value
    if (wrapper) {
      wrapper.style.transform = `translateX(-${currentIndex.value * 100}%)`
    }
  }
  
  const startAutoSlide = () => {
    intervalId.value = setInterval(() => {
      nextSlide()
    }, 3000) // 每 3 秒切换一次图片
  }
  
  const stopAutoSlide = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }
  
  onMounted(() => {
    updateScreenshotPosition()
    startAutoSlide()
  })
  
  onUnmounted(() => {
    stopAutoSlide()
  })
  </script>
  
  <style scoped>
  .screenshot-carousel {
    overflow: hidden;
    position: relative;
    width: 100%;
    max-width: 1000px;
    height: auto;
    margin: 0 auto;
    border-radius: 15px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  .screenshot-wrapper {
    display: flex;
    transition: transform 0.5s ease-in-out;
    width: calc(100% * var(--screenshot-count));
  }
  
  .screenshot {
    width: 100%;
    height: auto;
    border-radius: 15px;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .carousel-buttons {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    transform: translateY(-50%);
    padding: 0 20px;
  }
  
  .carousel-buttons button {
    background-color: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
  
  .carousel-buttons button:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }
  
  .carousel-buttons button:disabled {
    background-color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    transform: none;
  }
  
  .carousel-buttons button .arrow {
    font-size: 24px;
    color: #333;
  }
  
  .carousel-indicators {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
  }
  
  .carousel-indicators .indicator {
    width: 10px;
    height: 10px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease;
  }
  
  .carousel-indicators .indicator.active {
    background-color: rgba(255, 255, 255, 1);
    transform: scale(1.2);
  }
  
  .carousel-indicators .indicator:hover {
    background-color: rgba(255, 255, 255, 0.8);
  }

  /* 手机端样式（屏幕宽度小于 768px） */
@media (max-width: 768px) {
  .screenshot-carousel {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
  }

  .carousel-buttons {
    padding: 0 10px;
  }

  .carousel-buttons button {
    width: 30px;
    height: 30px;
  }

  .carousel-buttons button .arrow {
    font-size: 18px;
  }

  .carousel-indicators {
    bottom: 10px;
    gap: 8px;
  }

  .carousel-indicators .indicator {
    width: 8px;
    height: 8px;
  }
}

/* 更小屏幕手机端样式（屏幕宽度小于 480px） */
@media (max-width: 480px) {
  .carousel-buttons {
    padding: 0 5px;
  }

  .carousel-buttons button {
    width: 25px;
    height: 25px;
  }

  .carousel-buttons button .arrow {
    font-size: 14px;
  }

  .carousel-indicators {
    bottom: 8px;
    gap: 6px;
  }

  .carousel-indicators .indicator {
    width: 6px;
    height: 6px;
  }
}
  </style>