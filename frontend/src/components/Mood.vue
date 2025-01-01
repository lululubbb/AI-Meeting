<!-- src/components/Mood.vue -->
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

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import happyImage from '@/assets/happy.png';
import meiziziImage from '@/assets/meizizi.png';
import sadImage from '@/assets/sad.png';
import sosoImage from '@/assets/soso.png';
import disappointedImage from '@/assets/disappointed.png';
import crylaughImage from '@/assets/crylaugh.png';
import cryImage from '@/assets/cry.png';
import painfulImage from '@/assets/painful.png';
import angryImage from '@/assets/angry.png';
import AuthService from '../services/AuthService'; // 导入 AuthService

// 使用 Vuex store
const store = useStore();

// 定义心情及对应图片
const moods = [
  { name: '开心', image: happyImage },
  { name: '美滋滋', image: meiziziImage },
  { name: '难过', image: sadImage },
  { name: '麻木', image: sosoImage },
  { name: '失望', image: disappointedImage },
  { name: '笑哭', image: crylaughImage },
  { name: '哭哭', image: cryImage },
  { name: '痛苦', image: painfulImage },
  { name: '愤怒', image: angryImage }
];

// 从 Vuex 中获取当前用户的信息
const user = ref(store.state.user);
console.log("用户信息", user.value); // 打印整个用户对象

console.log("userMood",user.value.mood)
// 设置心情
const selectedMood = ref(user.value.mood); 
const selectedMoodImage = ref(happyImage);

// 根据选中的心情更新图片
watch(selectedMood, (newMood) => {
  const selected = moods.find(mood => mood.name === newMood);
  if (selected) {
    selectedMoodImage.value = selected.image;
    updateSelectBackground(selected.image);
  }
});

// 页面加载时触发选中的心情更新逻辑
onMounted(() => {
  updateMood();
});

// 更新心情
const updateMood = async () => {
  console.log('当前选中的心情:', selectedMood.value);
  const selected = moods.find(mood => mood.name === selectedMood.value);
  if (selected) {
    selectedMoodImage.value = selected.image;
    updateSelectBackground(selected.image);
  }
  
  // 更新 Firestore 中的 mood 字段
  const updatedInfo = { mood: selectedMood.value };
  try {
    await AuthService.updateUserStatus(updatedInfo);
    // 更新 Vuex 中的状态
    store.commit('SET_USER', { ...store.state.user, ...updatedInfo });
  } catch (error) {
    console.error("更新用户心情失败:", error);
  }

  // 隐藏选择框文本
  const moodSelect = document.querySelector('.mood-select');
  if (moodSelect) moodSelect.blur();
};

// 聚焦时恢复文本显示
const onSelectFocus = () => {
  const select = document.querySelector('.mood-select');
  if (select) select.style.fontSize = '16px';
};

// 失焦时隐藏文本
const onSelectBlur = () => {
  const select = document.querySelector('.mood-select');
  if (select) select.style.fontSize = '0';
};

// 更新下拉框背景图片
const updateSelectBackground = (imageSrc) => {
  const select = document.querySelector('.mood-select');
  const img = new Image();
  img.src = imageSrc;
  img.onload = () => {
    if (select) {
      select.style.width = img.width / 3 + 'px';
      select.style.height = img.height / 3 + 'px';
      select.style.backgroundImage = `url(${imageSrc})`;
      select.style.backgroundRepeat = 'no-repeat';
      select.style.backgroundPosition = 'center';
      select.style.backgroundSize = 'contain';
      select.style.padding = '0';
      select.style.fontSize = '0'; // 隐藏文本
    }
  };
};
</script>

<style scoped>
.mood-select {
  display: inline-block;
  padding: 8px;
  font-size: 18px;
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
