<!-- src/components/Mood.vue-->
<template>
    <div>
      <h2>当前心情：</h2>
  
      <!-- 下拉框选择心情，显示心情汉字 -->
      <select 
      v-model="selectedMood" 
      @change="updateMood" 
      @focus="onSelectFocus" 
      @blur="onSelectBlur"
      class="mood-select" 
      ref="moodSelect"
    >        
    <option v-for="(mood, index) in moods" :key="index" :value="mood.name">
          {{ mood.name }}
        </option>
      </select>
  
    </div>
  </template>
  
  <script>
  import happyImage from '@/assets/happy.png';
  import meiziziImage from '@/assets/meizizi.png';
  import sadImage from '@/assets/sad.png';
  import sosoImage from '@/assets/soso.png';
  import disappointedImage from '@/assets/disappointed.png';
  import crylaughImage from '@/assets/crylaugh.png';
  import cryImage from '@/assets/cry.png';
  import painfulImage from '@/assets/painful.png';
  import angryImage from '@/assets/angry.png';
  
  export default {
    data() {
      return {
        moods: [
          { name: '开心', image: happyImage },
          { name: '美滋滋', image: meiziziImage },
          { name: '难过', image: sadImage },
          { name: '麻木', image: sosoImage },
          { name: '失望', image: disappointedImage },
          { name: '笑哭', image: crylaughImage },
          { name: '哭哭', image: cryImage },
          { name: '痛苦', image: painfulImage },
          { name: '愤怒', image: angryImage }
        ],
        selectedMood: '开心', // 默认选中的心情
        selectedMoodImage: happyImage // 默认显示的图片
      };
    },
    watch: {
      selectedMood(newMood) {
        // 根据选中的心情更新图片
        const selected = this.moods.find(mood => mood.name === newMood);
        if (selected) {
          this.selectedMoodImage = selected.image;
          this.updateSelectBackground(selected.image);
        }
      }
    },
    methods: {
      updateMood() {
        console.log('当前选中的心情:', this.selectedMood);
        this.$refs.moodSelect.blur();
      },
      onSelectFocus() {
      // 恢复文本显示
      const select = this.$refs.moodSelect;
      select.style.fontSize = '16px';  // 恢复字体大小
    },
    onSelectBlur() {
      // 隐藏文本
      const select = this.$refs.moodSelect;
      select.style.fontSize = '0';  // 隐藏文本
    },
      updateSelectBackground(imageSrc) {
        const select = this.$refs.moodSelect;
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          // 设置下拉框的宽度和高度以适应图片
          select.style.width = img.width/3 + 'px';
          select.style.height = img.height/3 + 'px';
          // 设置下拉框的背景图片为选中的心情图片
          select.style.backgroundImage = `url(${imageSrc})`;
          select.style.backgroundRepeat = 'no-repeat';
          select.style.backgroundPosition = 'center';
          select.style.backgroundSize = 'contain';
          select.style.padding = '0';
          select.style.fontSize = '0'; // 隐藏文本
        };
      }
    }
  };
  </script>
  
  <style scoped>
 .mood-select {
    display: inline-block;
    padding: 8px;
    font-size: 16px;
    margin-left: 5px;
    border: none;
    background-color: #fff;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  
 .mood-image-container {
    margin-top: 20px;
  }
  
 .mood-image {
    width: 50px;  /* 小一点的图片尺寸 */
    height: 50px;
    object-fit: contain;
  }
  
  h2 {
    display: inline;
    margin-right: 10px;
  }
  </style>