<script setup>
import mCard from "@/components/mCard/index.vue";
import {onMounted, onUnmounted, ref} from "vue";
import {facilityStandardList, managementStandardList} from "@/api/api.js";
import {Carousel, CarouselItem} from "view-ui-plus";

const height = ref(560);
const standardList = ref([])
const carouselRef = ref(null)
const scrollInterval = ref(null)
const isScrolling = ref(false)
const isManualScrolling = ref(false)

onMounted(() => {
  facilityStandardList().then(res => {
    standardList.value = res;
    // 数据加载完成后，等待DOM更新，然后启动自动滚动
    setTimeout(() => {
      const introElement = document.querySelector('.standard-intro')
      if (introElement) {
        addScrollListeners(introElement)
        startAutoScroll(introElement)
      }
    }, 1000)
  })
})

// 自动滚动功能
const startAutoScroll = (element) => {
  if (!element || isScrolling.value || isManualScrolling.value) return;

  isScrolling.value = true;
  const container = element;
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
const restartAutoScroll = (element) => {
  setTimeout(() => {
    isManualScrolling.value = false;
    startAutoScroll(element);
  }, 3000); // 3秒后重新启动自动滚动
};

// 添加事件监听器
const addScrollListeners = (element) => {
  if (!element) return;

  // 鼠标事件
  element.addEventListener('mousedown', handleManualScroll);
  element.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) { // 左键按下
      handleManualScroll();
    }
  });
  element.addEventListener('mouseup', () => restartAutoScroll(element));
  element.addEventListener('mouseleave', () => restartAutoScroll(element));

  // 触摸事件
  element.addEventListener('touchstart', handleManualScroll);
  element.addEventListener('touchmove', handleManualScroll);
  element.addEventListener('touchend', () => restartAutoScroll(element));

  // 滚轮事件
  element.addEventListener('wheel', handleManualScroll);

  // 键盘事件（方向键等）
  element.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      handleManualScroll();
    }
  });
};

// 移除事件监听器
const removeScrollListeners = (element) => {
  if (!element) return;

  element.removeEventListener('mousedown', handleManualScroll);
  element.removeEventListener('mousemove', handleManualScroll);
  element.removeEventListener('mouseup', () => restartAutoScroll(element));
  element.removeEventListener('mouseleave', () => restartAutoScroll(element));
  element.removeEventListener('touchstart', handleManualScroll);
  element.removeEventListener('touchmove', handleManualScroll);
  element.removeEventListener('touchend', () => restartAutoScroll(element));
  element.removeEventListener('wheel', handleManualScroll);
  element.removeEventListener('keydown', handleManualScroll);
};

// 处理轮播切换
const handleCarouselChange = (index) => {
  stopAutoScroll()
  // 等待轮播动画完成后开始自动滚动
  setTimeout(() => {
    const carouselItems = document.querySelectorAll('.carousel-item')
    if (carouselItems[index]) {
      const introElement = carouselItems[index].querySelector('.standard-intro')
      if (introElement) {
        addScrollListeners(introElement)
        startAutoScroll(introElement)
      }
    }
  }, 500)
}

// 组件卸载时清理所有定时器和事件监听器
onUnmounted(() => {
  stopAutoScroll()
  // 清理所有轮播项的事件监听器
  const carouselItems = document.querySelectorAll('.carousel-item')
  carouselItems.forEach(item => {
    const introElement = item.querySelector('.standard-intro')
    if (introElement) {
      removeScrollListeners(introElement)
    }
  })
})

</script>

<template>
  <div class="left-card" ref="cardRef">
    <m-card title="设备标准" :height="height">
      <div class="facility-stand">
        <Carousel
            v-if="standardList.length > 0"
            ref="carouselRef"
            loop
            autoplay
            :autoplay-speed="20000"
            class="facility-carousel"
            @on-change="handleCarouselChange"
        >
          <CarouselItem v-for="item in standardList" :key="item.id" class="carousel-item">
            <div class="c-img">
              <img
                  :src="item.url"
                  alt="设备标准图"
                  class="standard-img"
              />
            </div>
            <div class="c-info">
              <div class="info1"><span class="standard-title">名称:</span><span>{{ item.name || '暂无名称' }}</span></div>
              <div class="info2">
                <span class="standard-title">简介:</span>
                <div class="standard-intro">{{ item.intro || '暂无简介' }}</div>
              </div>
            </div>
          </CarouselItem>
        </Carousel>

        <div v-else class="empty-tip">
          暂无设备标准数据
        </div>
      </div>
    </m-card>
  </div>
</template>

<style scoped>
.facility-stand {
  .facility-carousel {
    height: 496px;
    margin: 10px;

    .carousel-item {
      width: 100%;
      height: 450px !important;
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin-top: 30px;

      .c-img {
        width: 300px;
        height: 320px;
        border-radius: 8px 8px 0px 0px;
        border: 0px solid #CEE5FF;
        overflow: hidden;

        .standard-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .c-info {
        width: 480px;
        height: 430px;
        display: flex;
        flex-direction: column;
        font-weight: 400;
        font-size: 28px;
        color: #CEE5FF;
        overflow: hidden;
        /* 内容样式 */
        .standard-title {
          font-weight: 500;
          color: #FFE32B;
          line-height: 55px;
          display: inline-block;
          margin-right: 8px;
        }
        .info1 {
          margin-bottom: 15px;
          line-height: 1.6;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .info2 {
          display: flex;
          flex-direction: column;
          flex-wrap: wrap;
          overflow: hidden;
          .standard-intro {
            height:300px;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: #4A90E2 #1E3A5F;
            padding: 5px;
            border-radius: 4px;
            background: rgba(30, 58, 95, 0.3);
            border: 1px solid rgba(74, 144, 226, 0.3);
          }

          .standard-intro::-webkit-scrollbar {
            width: 6px;
          }

          .standard-intro::-webkit-scrollbar-track {
            background: #1E3A5F;
            border-radius: 3px;
          }

          .standard-intro::-webkit-scrollbar-thumb {
            background: #4A90E2;
            border-radius: 3px;
          }

          .standard-intro::-webkit-scrollbar-thumb:hover {
            background: #5BA0F2;
          }
        }

      }
    }
  }

  .empty-tip {
    height: 496px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7ca0c7;
    font-style: italic;
  }
}

</style>