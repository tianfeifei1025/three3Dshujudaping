<script setup>
import mCard from "@/components/mCard/index.vue";
import {onMounted, ref, nextTick, onUnmounted} from "vue";
import {Carousel, CarouselItem, Image} from "view-ui-plus";
import {produceNodeList} from "@/api/api.js";

const height = ref(1152);
const nodes = ref([]);
const infoRefs = ref([]);
const descriptionRefs = ref([]);
const autoScrollIntervals = ref([]);
const descriptionScrollIntervals = ref([]);
const isUserScrolling = ref(false);
const isDescriptionScrolling = ref(false);
const isManualDescriptionScrolling = ref(false);
const scrollTimeout = ref(null);
const scrollStatus = ref('auto'); // 'auto', 'paused', 'manual'

// 自动滚动函数
const startAutoScroll = (index) => {
  const infoElement = infoRefs.value[index];
  if (!infoElement) return;

  // 先停止之前的自动滚动
  stopAutoScroll(index);

  // 延迟执行，确保DOM完全渲染
  setTimeout(() => {
    const scrollHeight = infoElement.scrollHeight;
    const clientHeight = infoElement.clientHeight;

    if (scrollHeight <= clientHeight) {
      // console.log(`节点${index + 1}内容不需要滚动`);
      return; // 内容不需要滚动
    }

    // console.log(`启动节点${index + 1}的自动滚动`);
    scrollStatus.value = 'auto';
    let scrollTop = 0;
    const scrollStep = 1; // 每次滚动的像素
    const scrollSpeed = 50; // 滚动间隔(ms)
    let isScrollingToBottom = false;

    const interval = setInterval(() => {
      if (isUserScrolling.value) return; // 用户正在滚动时暂停

      // 重新计算高度，防止内容变化
      const currentScrollHeight = infoElement.scrollHeight;
      const currentClientHeight = infoElement.clientHeight;
      const maxScrollTop = currentScrollHeight - currentClientHeight;

      if (isScrollingToBottom) {
        // 正在滚动到底部，等待3秒后重新开始
        return;
      }

      scrollTop += scrollStep;

      if (scrollTop >= maxScrollTop) {
        // 滚动到底部，等待3秒后重新开始
        isScrollingToBottom = true;
        setTimeout(() => {
          scrollTop = 0;
          infoElement.scrollTop = 0;
          isScrollingToBottom = false;
        }, 3000);
      } else {
        infoElement.scrollTop = scrollTop;
      }
    }, scrollSpeed);

    autoScrollIntervals.value[index] = interval;
  }, 500); // 延迟500ms确保内容完全加载
};

// 停止自动滚动
const stopAutoScroll = (index) => {
  if (autoScrollIntervals.value[index]) {
    clearInterval(autoScrollIntervals.value[index]);
    autoScrollIntervals.value[index] = null;
  }
};

// 描述区域自动滚动函数
const startDescriptionAutoScroll = (index) => {
  const descriptionElement = descriptionRefs.value[index];
  if (!descriptionElement || isDescriptionScrolling.value || isManualDescriptionScrolling.value) return;
  
  isDescriptionScrolling.value = true;
  const container = descriptionElement;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  
  // 如果内容不需要滚动，则不启动自动滚动
  if (scrollHeight <= clientHeight) {
    isDescriptionScrolling.value = false;
    return;
  }
  
  let scrollTop = 0;
  const scrollStep = 1; // 每次滚动的像素
  const scrollDelay = 50; // 滚动间隔（毫秒）
  const pauseDelay = 2000; // 到达顶部或底部时的暂停时间（毫秒）
  
  const scroll = () => {
    if (!isDescriptionScrolling.value || isManualDescriptionScrolling.value) return;
    
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

// 停止描述区域自动滚动
const stopDescriptionAutoScroll = (index) => {
  isDescriptionScrolling.value = false;
  if (descriptionScrollIntervals.value[index]) {
    clearInterval(descriptionScrollIntervals.value[index]);
    descriptionScrollIntervals.value[index] = null;
  }
};

// 检测描述区域手动滚动
const handleDescriptionManualScroll = (index) => {
  isManualDescriptionScrolling.value = true;
  stopDescriptionAutoScroll(index);
};

// 重新启动描述区域自动滚动
const restartDescriptionAutoScroll = (index) => {
  setTimeout(() => {
    isManualDescriptionScrolling.value = false;
    startDescriptionAutoScroll(index);
  }, 3000); // 3秒后重新启动自动滚动
};

// 处理用户滚动
const handleUserScroll = (index) => {
  isUserScrolling.value = true;
  scrollStatus.value = 'manual';

  // 清除之前的定时器
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value);
  }

  // 3秒后恢复自动滚动
  scrollTimeout.value = setTimeout(() => {
    isUserScrolling.value = false;
    scrollStatus.value = 'auto';
  }, 3000);
};

// 添加描述区域事件监听器
const addDescriptionScrollListeners = (index) => {
  const descriptionElement = descriptionRefs.value[index];
  if (!descriptionElement) return;
  
  const container = descriptionElement;
  
  // 鼠标事件
  container.addEventListener('mousedown', () => handleDescriptionManualScroll(index));
  container.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) { // 左键按下
      handleDescriptionManualScroll(index);
    }
  });
  container.addEventListener('mouseup', () => restartDescriptionAutoScroll(index));
  container.addEventListener('mouseleave', () => restartDescriptionAutoScroll(index));
  
  // 触摸事件
  container.addEventListener('touchstart', () => handleDescriptionManualScroll(index));
  container.addEventListener('touchmove', () => handleDescriptionManualScroll(index));
  container.addEventListener('touchend', () => restartDescriptionAutoScroll(index));
  
  // 滚轮事件
  container.addEventListener('wheel', () => handleDescriptionManualScroll(index));
  
  // 键盘事件（方向键等）
  container.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      handleDescriptionManualScroll(index);
    }
  });
};

// 移除描述区域事件监听器
const removeDescriptionScrollListeners = (index) => {
  const descriptionElement = descriptionRefs.value[index];
  if (!descriptionElement) return;
  
  const container = descriptionElement;
  
  container.removeEventListener('mousedown', () => handleDescriptionManualScroll(index));
  container.removeEventListener('mousemove', () => handleDescriptionManualScroll(index));
  container.removeEventListener('mouseup', () => restartDescriptionAutoScroll(index));
  container.removeEventListener('mouseleave', () => restartDescriptionAutoScroll(index));
  container.removeEventListener('touchstart', () => handleDescriptionManualScroll(index));
  container.removeEventListener('touchmove', () => handleDescriptionManualScroll(index));
  container.removeEventListener('touchend', () => restartDescriptionAutoScroll(index));
  container.removeEventListener('wheel', () => handleDescriptionManualScroll(index));
  container.removeEventListener('keydown', () => handleDescriptionManualScroll(index));
};

// 轮播切换时重新启动自动滚动
const handleCarouselChange = (index) => {
  // 停止所有自动滚动
  autoScrollIntervals.value.forEach((interval, i) => {
    if (interval) {
      clearInterval(interval);
      autoScrollIntervals.value[i] = null;
    }
  });
  
  // 停止所有描述区域自动滚动
  descriptionScrollIntervals.value.forEach((interval, i) => {
    if (interval) {
      clearInterval(interval);
      descriptionScrollIntervals.value[i] = null;
    }
  });

  // 重新启动当前项的自动滚动
  nextTick(() => {
    startAutoScroll(index);
    startDescriptionAutoScroll(index);
  });
};

onMounted(() => {
  produceNodeList().then(res => {
    nodes.value = res;
    // 等待DOM完全渲染后再启动自动滚动
    nextTick(() => {
      // 再次延迟，确保所有内容都已渲染
      setTimeout(() => {
        if (nodes.value.length > 0) {
          startAutoScroll(0);
          startDescriptionAutoScroll(0);
          addDescriptionScrollListeners(0);
        }
      }, 1000);
    });
  }).catch(error => {
    console.error('获取生产节点数据失败:', error);
  });
});

onUnmounted(() => {
  // 清理所有定时器
  autoScrollIntervals.value.forEach(interval => {
    if (interval) {
      clearInterval(interval);
    }
  });
  
  // 清理所有描述区域定时器
  descriptionScrollIntervals.value.forEach(interval => {
    if (interval) {
      clearInterval(interval);
    }
  });
  
  // 移除所有描述区域事件监听器
  nodes.value.forEach((_, index) => {
    removeDescriptionScrollListeners(index);
  });
  
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value);
  }
});

</script>
<template>
  <div class="right-card" ref="cardRef">
    <div class="node-container">
      <div class="title">
        <div>生产节点信息</div>
      </div>
      <div class="node-stand">
        <Carousel autoplay loop :autoplay-speed="20000" :height="1050" @on-change="handleCarouselChange"
                  v-if="nodes.length > 0">
          <CarouselItem style="height: 1050px;" v-for="(item, index) in nodes" :key="index">
            <!-- 视频区域 -->
            <div class="item-media">
              <iframe
                  v-if="item.stream_address"
                  :src="`https://source.alink.link:48888/video/stream-media/player.html?url=${item.stream_address}`"
                  width="100%"
                  height="100%"
                  frameborder="0"
                  allowfullscreen
              ></iframe>
            </div>

            <!-- 信息区域 -->
            <div
                class="item-info"
                :ref="el => infoRefs[index] = el"
            >
              <div class="info-row">
                <span class="label">所属基地:</span>
                <span class="value">{{ item.base_name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">生产节点类型:</span>
                <span class="value">{{ item.node_type || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">监控摄像头安装位置:</span>
                <span class="value">{{ item.position || '-' }}</span>
              </div>
              <div class="info-row description-row">
                <div class="description-content">
                  <div class="label">节点描述:</div>
                  <div class="description-scroll-container" :ref="el => descriptionRefs[index] = el">
                    <div class="description-text">{{ item.node_desc || '-' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </CarouselItem>
        </Carousel>
        <div v-else class="empty-tip">
          暂无生产节点数据
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: url('~@/assets/images/border_slices/border5.png') no-repeat;
  background-size: 100% 100%;
  width: 100%;
  height: 1152px;
  margin-bottom: 30px;
  pointer-events: all;
  .title {
    background: url('~@/assets/images/border_slices/card-title-bg.png') no-repeat;
    background-size: 100% 100%;
    height: 80px;

    div {
      margin-left: 40px;
      color: #fff;
      font-size: 60px;
      letter-spacing: 1.6px;
      font-family: '优设标题黑', sans-serif;
      background: -webkit-linear-gradient(rgb(234, 247, 255), rgb(121, 191, 249));
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
  .node-stand {
    border-radius: 8px;
    overflow: hidden;
    color: #fff;
    position: relative;
    margin-top: 20px;

    .empty-tip {
      height: 496px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7ca0c7;
      font-style: italic;
      text-align: center;
    }

    .item-media {
      width: 100%;
      height: 300px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 2px solid #0055aa;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(0, 85, 170, 0.1) 0%, rgba(0, 85, 170, 0.05) 100%);
      border-radius: 8px 8px 0 0;
      box-shadow: inset 0 0 20px rgba(0, 85, 170, 0.3);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
        pointer-events: none;
      }

      iframe {
        border-radius: 6px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
          transform: scale(1.02);
        }
      }
    }

    .item-info {
      width: 100%;
      height: 680px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 26px;
      line-height: 1.4;
      color: #cee5ff;
      text-align: left;
      overflow: visible;
      position: relative;
      background: linear-gradient(135deg, rgba(0, 85, 170, 0.15) 0%, rgba(0, 85, 170, 0.08) 100%);
      border-radius: 0 0 8px 8px;
      box-shadow: inset 0 0 20px rgba(0, 85, 170, 0.2);
      border-top: 1px solid rgba(255, 227, 43, 0.3);
    }


    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 32px 16px;
      background: rgba(0, 85, 170, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 227, 43, 0.2);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 3px;
        height: 100%;
        background: linear-gradient(180deg, #ffe32b 0%, rgba(255, 227, 43, 0.6) 100%);
        border-radius: 0 2px 2px 0;
      }

      &:hover {
        background: rgba(0, 85, 170, 0.15);
        border-color: rgba(255, 227, 43, 0.4);
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(0, 85, 170, 0.3);
      }
    }

    .label {
      color: #ffe32b;
      font-weight: 600;
      min-width: 180px;
      text-align: left;
      flex-shrink: 0;
      font-size: 26px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .value {
      color: #ffffff;
      font-weight: 400;
      flex: 1;
      text-align: right;
      word-break: break-word;
      line-height: 1.4;
      white-space: normal;
      font-size: 26px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    /* 节点描述特殊样式 - 换行显示 */

    .description-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 0;
      padding: 12px 16px;
      background: rgba(0, 85, 170, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 227, 43, 0.2);
      position: relative;
      overflow: visible;
      
      .description-content {
        width: 100%;

        .label {
          color: #ffe32b !important;
          font-weight: 600 !important;
          font-size: 28px !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
          margin-bottom: 10px !important;
          text-align: left !important;
          min-width: auto !important;
          flex-shrink: 0 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .description-scroll-container {
          height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
          background: rgba(0, 85, 170, 0.1);
          border-radius: 8px;
          //border: 3px solid rgba(255, 227, 43, 0.6);
          margin-top: 8px;

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

          .description-text {
            padding: 20px 24px;
            color: #ffffff;
            font-weight: 400;
            font-size: 26px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            text-align: left;
            line-height: 1.8;
            word-break: break-word;
            white-space: pre-wrap; /* 保持换行和空格 */
            padding-right: 20px; /* 为滚动条留出空间 */
          }
        }
      }
    }

    :deep(.ivu-carousel-item) {
      display: flex !important;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      height: 1000px;
      margin: 0 !important;
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 85, 170, 0.3);
      background: linear-gradient(135deg, rgba(0, 85, 170, 0.05) 0%, rgba(0, 85, 170, 0.02) 100%);
      border: 1px solid rgba(255, 227, 43, 0.2);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 12px 40px rgba(0, 85, 170, 0.4);
        transform: translateY(-2px);
      }
    }
  }
}

</style>