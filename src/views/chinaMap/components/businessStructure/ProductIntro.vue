<script setup>
import {ref, onMounted, onBeforeUnmount, nextTick} from "vue";
import * as echarts from "echarts";
import mCard from "@/components/mCard/index.vue";
import VChart from "vue-echarts";
import {Image} from "view-ui-plus";
import {supplyChainList} from "@/api/api.js";

const cardRef = ref(null);
const item2Ref = ref(null);
const height = ref(544);
const fit = ref("fill");
const supplyChains = ref([]);

// 自动滚动相关状态
const isAutoScrolling = ref(true);
const isUserScrolling = ref(false);
const scrollTimer = ref(null);
const autoScrollTimer = ref(null);

// 自动滚动函数
const startAutoScroll = () => {
  if (!item2Ref.value || !isAutoScrolling.value) return;
  
  autoScrollTimer.value = setInterval(() => {
    if (!isUserScrolling.value && isAutoScrolling.value) {
      item2Ref.value.scrollTop += 1;
      
      // 检查是否滚动到底部
      if (item2Ref.value.scrollTop >= item2Ref.value.scrollHeight - item2Ref.value.clientHeight) {
        // 滚动到底部时，重置到顶部
        setTimeout(() => {
          if (item2Ref.value) {
            item2Ref.value.scrollTop = 0;
          }
        }, 1000);
      }
    }
  }, 50);
};

// 停止自动滚动
const stopAutoScroll = () => {
  if (autoScrollTimer.value) {
    clearInterval(autoScrollTimer.value);
    autoScrollTimer.value = null;
  }
};

// 处理手动滚动
const handleScroll = () => {
  isUserScrolling.value = true;
  isAutoScrolling.value = false;
  
  // 清除之前的定时器
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value);
  }
  
  // 3秒后恢复自动滚动
  scrollTimer.value = setTimeout(() => {
    isUserScrolling.value = false;
    isAutoScrolling.value = true;
    startAutoScroll();
  }, 3000);
};

// 处理鼠标进入
const handleMouseEnter = () => {
  stopAutoScroll();
  isAutoScrolling.value = false;
};

// 处理鼠标离开
const handleMouseLeave = () => {
  if (!isUserScrolling.value) {
    isAutoScrolling.value = true;
    startAutoScroll();
  }
};

onMounted(() => {
  supplyChainList().then(res => {
    supplyChains.value = res[0];
    // 数据加载完成后启动自动滚动
    nextTick(() => {
      startAutoScroll();
    });
  });
});

onBeforeUnmount(() => {
  stopAutoScroll();
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value);
  }
});

</script>
<template>
  <div class="left-card" ref="cardRef">
    <m-card title="产品介绍" :height="height">
      <div class="product-intro">
        <div class="item1">
          <Image :src="supplyChains.url" :fit="fit" width="320px" height="400px" :alt="fit"/>
        </div>
        <div 
          class="item2" 
          ref="item2Ref"
          @scroll="handleScroll"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div class="scroll-content">
            <p>{{ supplyChains.system_name ||"-" }} </p>
            <div class="info"><span>产品名称:</span><span>{{ supplyChains.product_name || "-" }}</span></div>
            <div class="info"><span>产品简介:</span><span>{{ supplyChains.product_intro || "-" }}</span></div>
          </div>
        </div>
      </div>
    </m-card>
  </div>
</template>
<style lang="scss">
.product-intro{
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items:center;
  justify-content: space-between;
  gap: 40px;
  padding: 20px;
  margin-top: 70px;
  .item1 {
    width: 320px;
    height: 400px;
    flex-shrink: 0;
    
    img {
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .item2 {
    flex: 1;
    height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 227, 43, 0.6) rgba(255, 227, 43, 0.2);
    padding: 10px;
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(255, 227, 43, 0.2);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 227, 43, 0.6);
      border-radius: 4px;
      border: 1px solid rgba(255, 227, 43, 0.3);
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 227, 43, 0.8);
    }
    
    .scroll-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-right: 10px;

      
      p {
        font-weight: 600;
        font-size: 32px;
        color: #FFE32B;
        margin: 0 0 16px 0;
        text-align: left;
      }
      
      .info{
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        span:first-child{
          font-weight: 500;
          font-size: 28px;
          color: #FFE32B;
          line-height: 32px;
          text-align: left;
          font-style: normal;
          text-transform: none;
        }
        span:last-child{
          font-weight: 400;
          font-size: 28px;
          color: #CEE5FF;
          line-height: 32px;
          text-align: left;
          font-style: normal;
          text-transform: none;
          margin-bottom: 8px;
        }
      }
    }
  }
}
</style>
