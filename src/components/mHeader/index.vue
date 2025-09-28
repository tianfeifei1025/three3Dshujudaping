<template>
  <div class="m-header">
    <div class="m-header-left">
      <slot name="left">
        <!-- 天气显示 -->
        <div class="m-header-weather">
          <div class="weather-info" v-if="weatherData">
            <div class="weather-icon">
              <span class="weather-emoji">{{ weatherData.icon }}</span>
            </div>
            <div class="weather-details">
              <div class="temperature">{{ weatherData.temperature }}°C {{ weatherData.description }}</div>
              <div class="location">{{ weatherData.location }}</div>
            </div>
          </div>
          <div class="weather-loading" v-else-if="!weatherError">
            <div class="loading-text">获取天气中...</div>
          </div>
          <div class="weather-error" v-else>
            <div class="error-text">{{ weatherError }}</div>
          </div>
        </div>

        <!-- 默认左侧内容 -->
        <div v-if="leftMenuItems && leftMenuItems.length > 0" class="m-header-menu">
          <div
              v-for="(item, index) in leftMenuItems"
              :key="index"
              class="h-menu-item"
              :class="{ 'is-active': item.isActive }"
              @click="handleMenuClick(item, index)"
          >
            <img :src="getImageSrc(item)" :alt="item.label">
            <span>{{ item.label }}</span>
          </div>
        </div>
      </slot>
    </div>
    <div class="m-header-wrap">
      <div class="m-header-title">{{ title }}</div>
      <!--      <div class="m-header-bottom-line"></div>-->
    </div>
    <div class="m-header-right">
      <slot name="right">
        <!-- 默认右侧内容 -->
        <div v-if="rightMenuItems && rightMenuItems.length > 0" class="m-header-menu">
          <div
              v-for="(item, index) in rightMenuItems"
              :key="index"
              class="h-menu-item"
              :class="{ 'is-active': item.isActive }"
              @click="handleMenuClick(item, index)"
          >
            <img :src="getImageSrc(item)" :alt="item.label">
            <span>{{ item.label }}</span>
          </div>
        </div>
        <!-- 功能按钮组 -->
        <div class="m-header-actions">
          <div class="action-button" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '进入全屏'">
            <Icon :type="isFullscreen ? 'md-contract' : 'md-expand'" class="action-icon" />
            <span>{{ isFullscreen ? '退出全屏' : '进入全屏' }}</span>
          </div>
          <div class="action-button" @click="refreshPage" title="刷新页面">
            <Icon type="md-refresh" class="action-icon" />
            <span>刷新</span>
          </div>
        </div>
        <!-- 时间显示 -->
        <div v-if="showDateTime" class="m-header-date">
          <span style="font-size: 42px;font-weight: bolder">{{ currentDateTime.time }}</span>
          <span style="font-size: 32px;">{{ currentDateTime.date }}</span>
          <!--          <span style="font-size: 32px">{{ currentDateTime.weekday }}</span>-->
        </div>
      </slot>
    </div>
  </div>
</template>
<script setup>
import {ref, onMounted, onBeforeUnmount} from 'vue';
import {getWeatherData} from "@/api/api.js";
import {Icon} from 'view-ui-plus';

const props = defineProps({
  title: {
    type: String,
    default: "可视化数据大屏",
  },
  leftMenuItems: {
    type: Array,
    default: () => []
  },
  rightMenuItems: {
    type: Array,
    default: () => []
  },
  showDateTime: {
    type: Boolean,
    default: false
  },
  autoUpdateTime: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['menu-click']);

const currentDateTime = ref({
  date: '',
  weekday: '',
  time: ''
});

const weatherData = ref(null);
const weatherError = ref(null);
const isFullscreen = ref(false);

let timeInterval = null;

// 格式化时间函数
function formatTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const time = `${hours}:${minutes}:${seconds}`;
  currentDateTime.value = {date, weekday, time};
}

// 获取图片路径
function getImageSrc(item) {
  if (item.img && item.imgSelected) {
    const imageName = item.isActive ? item.imgSelected : item.img;
    return new URL(`/src/assets/images/tab_slices/${imageName}.png`, import.meta.url).href;
  }
  return new URL('/src/assets/images/tab_slices/chanyetx.png', import.meta.url).href;
}

// 处理菜单点击
function handleMenuClick(item, index) {
  emit('menu-click', {item, index});
}

// 切换全屏状态
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // 进入全屏
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(err => {
      console.error('进入全屏失败:', err);
    });
  } else {
    // 退出全屏
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch(err => {
      console.error('退出全屏失败:', err);
    });
  }
}

// 刷新页面
async function refreshPage() {
  try {
    // 清除Service Worker缓存（如果存在）
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker缓存已清除');
      } catch (error) {
        console.warn('清除Service Worker缓存失败:', error);
      }
    }
    
    // 清除本地存储（可选，根据需要启用）
    // localStorage.clear();
    // sessionStorage.clear();
    
    // 清除浏览器缓存并强制刷新
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now().toString());
    url.searchParams.set('_cache', 'clear'); // 额外的缓存清除标识
    
    // 使用replace而不是href，避免在历史记录中留下痕迹
    window.location.replace(url.toString());
  } catch (error) {
    // 如果URL构造失败，使用传统方法
    console.warn('URL构造失败，使用传统刷新方法:', error);
    const timestamp = Date.now();
    const separator = window.location.search ? '&' : '?';
    const newUrl = window.location.href + separator + '_t=' + timestamp + '&_cache=clear';
    window.location.replace(newUrl);
  }
}


// 处理全屏状态变化
function handleFullscreenChange() {
  isFullscreen.value = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

// 根据天气类型获取对应的图标
function getWeatherIcon(weather) {
  const weatherIconMap = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌦️',
    '中雨': '🌧️',
    '大雨': '⛈️',
    '暴雨': '⛈️',
    '雷阵雨': '⛈️',
    '雪': '❄️',
    '小雪': '🌨️',
    '中雪': '🌨️',
    '大雪': '🌨️',
    '雾': '🌫️',
    '霾': '🌫️',
    '沙尘': '🌪️',
    '浮尘': '🌪️',
    '扬沙': '🌪️',
    '强沙尘暴': '🌪️',
    '热': '🔥',
    '冷': '❄️',
    '风': '💨'
  };
  for (const [key, icon] of Object.entries(weatherIconMap)) {
    if (weather.includes(key)) {
      return icon;
    }
  }
  return '☀️';
}

onMounted(async () => {
  if (props.showDateTime && props.autoUpdateTime) {
    formatTime();
    timeInterval = setInterval(formatTime, 1000);
  }
  
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // 初始化天气数据
  try {
    const res = await getWeatherData();
    if (res.status === "1" && res.lives && res.lives.length > 0) {
      const lives = res.lives[0];
      weatherData.value = {
        icon: getWeatherIcon(lives.weather),
        location: lives.city,
        temperature: lives.temperature,
        description: lives.weather
      };
    } else {
      weatherError.value = "获取天气失败";
      console.warn("天气数据获取失败:", res);
    }
  } catch (error) {
    weatherError.value = "获取天气失败";
    console.error("获取天气数据异常:", error);
  }
});

onBeforeUnmount(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  
  // 移除全屏状态监听器
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});
</script>
<style lang="scss">
.m-header {
  //position: absolute;
  left: 0;
  top: 0;
  right: 0;
  width: 3840px;
  height: 276px;
  z-index: 10;
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
  background: url("~@/assets/images/border_slices/header-top-bg.png") center no-repeat;

  &-wrap {
    flex: 2;
    height: 256px;
    //background: url("~@/assets/images/header-top-bg.png") center no-repeat;
    //background-size: contain;
    text-align: center;
    box-sizing: border-box;
    position: relative;
    z-index: 2;
    margin-top: -80px;
  }

  &-title {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 276px;
    line-height: 276px;
    color: #fff;
    font-size: 80px;
    letter-spacing: 10px;
    font-family: "优设标题黑";
    background: -webkit-linear-gradient(rgb(255, 255, 255), rgb(104 200 246));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &-bottom-line {
    position: absolute;
    left: 50%;
    margin-left: -103px;
    width: 207px;
    height: 4px;
    border-radius: 20px;
    background: #FFDF7B;
    animation: colorAnimate 1s linear infinite;
  }

  &-left {
    flex: 1;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 20px;
    position: relative;
    z-index: 999;
    margin-top: -160px;
  }

  &-right {
    flex: 1;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 20px;
    position: relative;
    z-index: 999;
    margin-top: -160px;
  }

  &-menu {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
    gap: 10px;
    position: relative;
    z-index: 999;
  }

  &-date {
    margin-left: 20px;
    display: flex;
    flex-direction: column;

    span {
      padding-right: 10px;
      color: #c4f3fe;
      font-size: 32px;
    }
  }

  &-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-right: 20px;
  }

  &-weather {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 20px;
    min-width: 450px;

    .weather-info {
      display: flex;
      align-items: center;
      gap: 15px;

      .weather-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;

        .weather-emoji {
          font-size: 80px;
          line-height: 1;
          display: block;
        }
      }

      .weather-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-left: 10px;

        .temperature {
          color: #FFE32B;
          font-size: 28px;
          font-weight: bold;
          text-shadow: 0px 2px 4px rgba(255, 227, 43, 0.3);
        }

        .description {
          color: #CEE5FF;
          font-size: 28px;
          font-weight: 400;
        }

        .location {
          color: #8BB8E8;
          font-size: 30px;
          font-weight: 300;
        }
      }
    }

    .weather-loading {
      display: flex;
      align-items: center;
      justify-content: center;

      .loading-text {
        color: #8BB8E8;
        font-size: 18px;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    .weather-error {
      display: flex;
      align-items: center;
      justify-content: center;

      .error-text {
        color: #FF6B6B;
        font-size: 18px;
        text-align: center;
      }
    }
  }
}

@keyframes colorAnimate {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.1, 5);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 菜单项样式
.h-menu-item {
  width: 350px;
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 9999;

  span {
    padding-right: 30px;
    color: #CEE5FF;
    font-size: 35px;
    font-weight: 500;
    margin-left: 20px;
  }

  img {
    width: 64px;
    height: 70px;
  }

  &.is-active {
    color: #FFE32B;
    text-shadow: 0px 2px 6px #FFE32B;
  }
}

// 功能按钮样式
.action-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 9999;
  min-width: 140px;
  justify-content: center;
  backdrop-filter: blur(10px);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 227, 43, 0.2);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .action-icon {
    font-size: 20px;
    color: #CEE5FF;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    
    // view-ui-plus Icon 组件样式优化
    .ivu-icon {
      font-size: 20px;
      color: inherit;
    }
  }

  span {
    color: #CEE5FF;
    font-size: 16px;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.3s ease;
  }

  &:hover {
    .action-icon {
      color: #FFE32B;
      transform: scale(1.1);
      text-shadow: 0 0 10px rgba(255, 227, 43, 0.5);
    }

    span {
      color: #FFE32B;
      text-shadow: 0px 1px 3px rgba(255, 227, 43, 0.3);
    }
  }
}

// 刷新图标动画
.action-button:hover .action-icon .ivu-icon[class*="md-refresh"] {
  animation: rotate 0.6s ease-in-out;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
