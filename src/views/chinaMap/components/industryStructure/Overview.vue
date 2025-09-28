<script setup>
import {ref, onMounted, onUnmounted} from "vue";
import mCard from "@/components/mCard/index.vue";
import {commonFetchYs} from "@/api/api.js";

const cardRef = ref(null);
const contentRef = ref(null);
const height = ref(600);
const data = ref("");
const loading = ref(false);
const error = ref("");
const scrollInterval = ref(null);
const isScrolling = ref(false);
const isManualScrolling = ref(false);

// 自动滚动函数
const startAutoScroll = () => {
  if (!contentRef.value || isScrolling.value || isManualScrolling.value) return;
  
  isScrolling.value = true;
  const container = contentRef.value;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  
  // 如果内容不需要滚动，则不启动自动滚动
  if (scrollHeight <= clientHeight) {
    isScrolling.value = false;
    return;
  }
  
  let scrollTop = 0;
  const scrollStep = 1; // 每次滚动的像素
  const scrollDelay = 50; // 滚动间隔（毫秒）
  const pauseDelay = 2000; // 到达顶部或底部时的暂停时间（毫秒）
  
  const scroll = () => {
    if (!isScrolling.value || isManualScrolling.value) return;
    
    container.scrollTop = scrollTop;
    scrollTop += scrollStep;
    
    // 到达底部时暂停，然后回到顶部
    if (scrollTop >= scrollHeight - clientHeight) {
      setTimeout(() => {
        scrollTop = 0;
        container.scrollTop = 0;
        setTimeout(scroll, pauseDelay);
      }, pauseDelay);
    } else {
      setTimeout(scroll, scrollDelay);
    }
  };
  
  scroll();
};

// 停止自动滚动
const stopAutoScroll = () => {
  isScrolling.value = false;
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value);
    scrollInterval.value = null;
  }
};

// 检测手动滚动
const handleManualScroll = () => {
  isManualScrolling.value = true;
  stopAutoScroll();
};

// 重新启动自动滚动（延迟启动）
const restartAutoScroll = () => {
  setTimeout(() => {
    isManualScrolling.value = false;
    startAutoScroll();
  }, 3000); // 3秒后重新启动自动滚动
};

// 添加事件监听器
const addScrollListeners = () => {
  if (!contentRef.value) return;
  
  const container = contentRef.value;
  
  // 鼠标事件
  container.addEventListener('mousedown', handleManualScroll);
  container.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) { // 左键按下
      handleManualScroll();
    }
  });
  container.addEventListener('mouseup', restartAutoScroll);
  container.addEventListener('mouseleave', restartAutoScroll);
  
  // 触摸事件
  container.addEventListener('touchstart', handleManualScroll);
  container.addEventListener('touchmove', handleManualScroll);
  container.addEventListener('touchend', restartAutoScroll);
  
  // 滚轮事件
  container.addEventListener('wheel', handleManualScroll);
  
  // 键盘事件（方向键等）
  container.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      handleManualScroll();
    }
  });
};

// 移除事件监听器
const removeScrollListeners = () => {
  if (!contentRef.value) return;
  
  const container = contentRef.value;
  
  container.removeEventListener('mousedown', handleManualScroll);
  container.removeEventListener('mousemove', handleManualScroll);
  container.removeEventListener('mouseup', restartAutoScroll);
  container.removeEventListener('mouseleave', restartAutoScroll);
  container.removeEventListener('touchstart', handleManualScroll);
  container.removeEventListener('touchmove', handleManualScroll);
  container.removeEventListener('touchend', restartAutoScroll);
  container.removeEventListener('wheel', handleManualScroll);
  container.removeEventListener('keydown', handleManualScroll);
};

onMounted(async () => {
  const res = await commonFetchYs("evelopment_ideas", "evelopment_ideas", 1, [[[]]]);
  if (res.code === 0 && res.data && res.data.length > 0) {
    const content = res.data[0]?.LongText1756808237398;
    if (content) {
      // 移除字符限制，让文本可以完整显示并滚动
      data.value = content;
    }
  }
  
  // 延迟启动自动滚动和添加事件监听器，确保DOM已渲染
  setTimeout(() => {
    addScrollListeners();
    startAutoScroll();
  }, 1000);
});

onUnmounted(() => {
  stopAutoScroll();
  removeScrollListeners();
});
</script>
<template>
  <div class="left-card" ref="cardRef">
    <m-card title="产业概况" :height="height">
      <div class="overview-container">
        <div class="section-title">
          <img src="@/assets/images/icon_slices/icon11.png" alt="icon" class="icon"/>
          <span class="title-text">壤塘县食用菌产业概况</span>
        </div>
        <div class="section-content" ref="contentRef">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <div v-else class="scrollable-text">{{ data }}</div>
        </div>
      </div>
    </m-card>
  </div>
</template>
<style lang="scss">
.overview-container {
  color: #FFFFFF;
  height: 500px;
  padding: 0 24px;
  margin-top: 60px;
  .section-title {
    display: flex;
    flex-wrap: nowrap;
    font-size: 28px;
    color: #FFFFFF;
    height: 80px;
    line-height: 80px;

    .icon {
      width: 80px;
      height: 80px;
    }

    .title-text {
      font-size: 28px;
      color: #FFFFFF;
    }
  }

  .section-content {
    height: 430px;
    font-weight: 400;
    font-size: 28px;
    color: #CEE5FF;
    line-height: 40px;
    text-align: left;
    font-style: normal;
    text-transform: none;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    
    /* 自定义滚动条样式 */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: rgba(255, 227, 43, 0.6) transparent; /* Firefox */
    
    &::-webkit-scrollbar {
      width: 8px; /* 滚动条宽度 */
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1); /* 滚动条轨道背景 */
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 227, 43, 0.6) !important;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 227, 43, 0.8) !important;
    }

    .scrollable-text {
      padding-right: 10px; /* 为滚动条留出空间 */
      word-wrap: break-word;
      white-space: pre-wrap; /* 保持换行和空格 */
    }

    .loading, .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 24px;
    }

    .error {
      color: #ff6b6b;
    }
  }
}
</style>