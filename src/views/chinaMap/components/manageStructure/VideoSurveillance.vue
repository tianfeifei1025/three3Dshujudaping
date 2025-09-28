<script setup>
import mCard from "@/components/mCard/index.vue";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {Button, Col, Icon, Input, Page, Row, Table} from "view-ui-plus";
import {useMonitorStore} from "@/stores/monitor.js";
import {storeToRefs} from "pinia";
import emitter from "@/utils/emitter.js";

// 使用Pinia store
const monitorStore = useMonitorStore();
const height = ref(570);
const width = ref(1800);
const columns = ref([
  {
    title: '序号',
    slot: 'index'
  },
  {
    title: '监控名称',
    key: 'name'
  },
  {
    title: '状态',
    slot: 'status'
  },
  {
    title: '对讲',
    slot: 'hasAudio'
  },
  {
    title: '操作',
    slot: 'action',
    width: 150,
    align: 'center'
  }
]);

const { 
  data, 
  filteredData, 
  searchKeyword, 
  playUrl, 
  monitorStats, 
  loading,
  error,
  filterType
} = storeToRefs(monitorStore);

// 搜索功能
const handleSearch = () => {
  monitorStore.handleSearch();
};

// 清空搜索
const clearSearch = () => {
  monitorStore.clearSearch();
};

// 监听搜索关键词变化
watch(searchKeyword, () => {
  handleSearch();
});

// 查看视频
const viewVideo = (row) => {
  monitorStore.viewVideo(row);
};

// 筛选监控
const filterMonitors = (type) => {
  monitorStore.setFilterType(type);
};

// 全屏播放功能
const isFullscreen = ref(false);
const videoElement = ref(null);

const toggleFullscreen = () => {
  if (playUrl.value) {
    const fullscreenData = {
      stream_address: playUrl.value,
      name: '视频监控',
    };
    emitter.$emit("openFullscreen", fullscreenData);
  }
};

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);
});

onMounted(async () => {
  try {
    await monitorStore.fetchMonitorData();
    await nextTick();
    await monitorStore.initFirstMonitor();
  } catch (error) {
    console.error('初始化监控数据失败:', error);
  }
})
</script>

<template>
  <div class="right-card" ref="cardRef">
    <m-card title="视频监控" :height="height" :width="width">
      <div class="video-container">
        <div class="item-left">
          <div class="video-wrapper">
            <iframe ref="videoElement" class="video" :src="playUrl" allow="microphone; compute-pressure" allowfullscreen> </iframe>
            <Button 
              class="fullscreen-btn"
              title="全屏播放"
              @click="toggleFullscreen"

            >
              <img src="@/assets/images/icon_slices/icon12.png" alt="全屏" class="fullscreen-icon"/>
            </Button>
          </div>
          <div class="stats">
            <div 
              class="stat-card monitor-card" 
              :class="{ 'active': filterType === 'all' }"
              data-type="monitor-all"
              @click="filterMonitors('all')"
            >
              <span class="stat-name">总监控数</span>
              <span class="stat-num">{{ monitorStats.total }}</span>
            </div>
            <div 
              class="stat-card monitor-card" 
              :class="{ 'active': filterType === 'online' }"
              data-type="online"
              @click="filterMonitors('online')"
            >
              <span class="stat-name">在线</span>
              <span class="stat-num">{{ monitorStats.online }}</span>
            </div>
            <div 
              class="stat-card monitor-card" 
              :class="{ 'active': filterType === 'offline' }"
              data-type="offline"
              @click="filterMonitors('offline')"
            >
              <span class="stat-name">离线</span>
              <span class="stat-num">{{ monitorStats.offline }}</span>
            </div>
          </div>
        </div>
        <div class="item-right">
          <div class="search-container">
            <Input
                v-model="searchKeyword"
                placeholder="请输入监控名称"
                style="width: auto"
                @on-change="handleSearch"
                clearable
            >
              <template #suffix>
                <Icon type="ios-search"/>
              </template>
            </Input>
            <Button 
                v-if="searchKeyword" 
                type="text" 
                size="small" 
                @click="clearSearch"
                class="clear-btn"
            >
              清空
            </Button>
          </div>
          <Table border :columns="columns" :data="monitorStore.currentData" :height="350" :width="964" :loading="loading">
            <template #index="{ row, index }">
              <strong>{{ index + 1 }}</strong>
            </template>
            <template #status="{ row }">
              <div :class="['status-btn', row.onLine ? 'status-online' : 'status-offline']">
                {{ row.onLine ? '在线' : '离线' }}
              </div>
            </template>
            <template #hasAudio="{ row }">
              <div :class="['audio-btn', row.hasAudio ? 'audio-supported' : 'audio-not-supported']">
                {{ row.hasAudio ? '支持' : '不支持' }}
              </div>
            </template>
            <template #action="{ row, index }">
              <div class="action-btn" @click="viewVideo(row)">
                播放
              </div>
            </template>
            <template #empty>
              <div style="text-align: center; padding: 20px;  color: #7ca0c7;font-style: italic;">
                暂无监控列表数据
              </div>
            </template>
          </Table>
        </div>
      </div>
    </m-card>
  </div>
</template>

<style scoped>
.video-container {
  width: 100%;
  height: 550px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  .item-left, .item-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    margin-top: 40px;
  }

  .item-right {
    margin-right: 10px;
  }

  .item-left {
    width: 528px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 10px;
    margin-top: 60px;

    .video-wrapper {
      position: relative;
      width: 100%;
      height: 296px;
      
      .video {
        width: 100%;
        height: 100%;
        border-radius: 8px 8px 8px 8px;
        background: black;
      }
      .fullscreen-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(64, 175, 253, 0.2);
        border: 2px solid #40AFFD;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;

        &:hover {
          background: rgba(64, 175, 253, 0.4);
          border-color: #40AFFD;
          transform: scale(1.05);
        }

        .fullscreen-icon {
          width: 24px;
          height: 24px;
        }
      }


    }

    .stats {
      height: 96px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      margin-top: 40px;

      .stat-card {
        width: 164px;
        height: 96px;
        background: linear-gradient(360deg, rgba(139, 208, 240, 0.4) 0%, rgba(139, 208, 240, 0.04) 100%);
        border-radius: 16px 16px 16px 16px;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;

        &:hover {
          background: linear-gradient(360deg, rgba(139, 208, 240, 0.6) 0%, rgba(139, 208, 240, 0.1) 100%);
          border-color: rgba(39, 255, 226, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(39, 255, 226, 0.3);
        }

        &.active {
          background: linear-gradient(360deg, rgba(39, 255, 226, 0.3) 0%, rgba(39, 255, 226, 0.1) 100%);
          border-color: #27FFE2;
          box-shadow: 0 0 20px rgba(39, 255, 226, 0.4);
        }

        .stat-name {
          width: auto;
          height: 32px;
          font-weight: 400;
          font-size: 24px;
          color: #CEE5FF;
          line-height: 33px;
          font-style: normal;
          text-transform: none;
          border-left: 8px solid #27FFE2;
          margin-bottom: 20px;
        }

        .stat-num {
          font-weight: 700;
          font-size: 28px;
          color: #FFFFFF;
          line-height: 40px;
          font-style: normal;
          text-transform: none;
        }
      }
    }

  }

  /* 搜索框优化 */
  .search-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  :deep(.ivu-input-wrapper) {
    width: 320px !important;
  }

  .clear-btn {
    color: #7ca0d1 !important;
    font-size: 24px !important;
    padding: 8px 12px !important;
    height: auto !important;
    min-width: auto !important;
  }

  .clear-btn:hover {
    color: #ffffff !important;
    background-color: rgba(77, 136, 225, 0.2) !important;
  }

  :deep(.ivu-input) {
    height: 48px;
    font-size: 26px;
    padding: 0 14px;
    background-color: rgba(26, 58, 92, 0.8);
    color: #ffffff;
    border: 1px solid #4d88e1;
    border-radius: 8px;
  }

  :deep(.ivu-input::placeholder) {
    color: #7ca0d1;
    font-size: 28px;
  }

  :deep(.ivu-input-suffix i) {
    font-size: 28px;
    color: #909bb5;
  }

  /* 表格样式 */

  :deep(.ivu-table) {
    background: transparent !important;
    color: #ffffff;
    font-size: 28px;
  }

  :deep(.ivu-table th) {
    background: rgba(26, 58, 92, 0.9) !important;
    font-weight: 600;
    font-size: 28px;
    color: #ffffff;
    text-align: left;
    border-bottom: 2px solid #4d88e1 !important;
    height: 56px;
  }

  :deep(.ivu-table td) {
    background: transparent !important;
    font-size: 26px;
    color: #e6f2ff;
    line-height: 1.6;
    border-bottom: 1px dashed rgba(77, 136, 225, 0.3);
    padding: 10px 12px;
    height: 52px;
  }

  :deep(.ivu-table-row-hover td) {
    background: rgba(77, 136, 225, 0.15) !important;
  }

  :deep(.ivu-table-body) {
    scrollbar-width: thin;
    scrollbar-color: #4d88e1 transparent;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar {
    width: 10px;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar-track {
    background: rgba(26, 58, 92, 0.4);
    border-radius: 5px;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar-thumb {
    background: rgba(77, 136, 225, 0.7);
    border-radius: 5px;
  }

  /* 操作按钮 */

  :deep(.ivu-btn-primary) {
    width: 88px;
    height: 44px;
    font-size: 26px;
    padding: 0;
    background-color: #2d8cf0;
    border-color: #2d8cf0;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  :deep(.ivu-btn-primary:hover) {
    background-color: #1b7de8 !important;
    border-color: #1b7de8 !important;
    transform: scale(1.05);
  }

  /* 分页样式 */

  :deep(.ivu-page) {
    text-align: right;
    margin-top: 12px;
  }

  :deep(.ivu-page .ivu-page-prev),
  :deep(.ivu-page .ivu-page-next),
  :deep(.ivu-page .ivu-page-item) {
    width: 48px;
    height: 48px;
    min-width: 48px;
    line-height: 48px;
    font-size: 24px;
    border-color: #4d88e1;
  }

  :deep(.ivu-page .ivu-page-item-active) {
    background: #2d8cf0 !important;
    border-color: #2d8cf0 !important;
  }

  :deep(.ivu-page .ivu-page-prev),
  :deep(.ivu-page .ivu-page-next) {
    background: rgba(26, 58, 92, 0.8) !important;
    color: #ffffff !important;
  }

  :deep(.ivu-page .ivu-page-total) {
    font-size: 24px;
    color: #c5d9f1;
  }

  :deep(.ivu-page-simple .ivu-input) {
    height: 48px;
    font-size: 24px;
    text-align: center;
  }

  /* 状态样式 */
  .status-btn {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    min-width: 80px;
    border: 2px solid;
  }

  .status-online {
    background: rgba(0, 255, 136, 0.2);
    color: #00FF88;
    border: 1px solid rgba(0, 255, 136, 0.3);
  }

  .status-offline {
    background: rgba(255, 107, 107, 0.2);
    color: #FF6B6B;
    border: 1px solid rgba(255, 107, 107, 0.3);
  }

  /* 对讲样式 */
  .audio-btn {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    min-width: 80px;
    border: 2px solid;
  }

  .audio-supported {
    background: rgba(64, 175, 253, 0.2);
    color: #40AFFD;
    border: 1px solid rgba(64, 175, 253, 0.3);
  }

  .audio-not-supported {
    background: rgba(128, 142, 155, 0.2);
    color: #808e9b;
    border: 1px solid rgba(128, 142, 155, 0.3);
  }

  /* 操作按钮样式 */
  .action-btn {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(64, 158, 255, 0.2);
    color: #40AFFD;
    border: 1px solid rgba(64, 158, 255, 0.3);
    border-radius: 8px;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 80px;

    &:hover {
      background: rgba(64, 158, 255, 0.4);
      border-color: #40AFFD;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }

    &:active {
      transform: scale(0.98);
    }
  }

}

/* 全屏样式 - 针对iframe元素 */
:fullscreen iframe.video,
:-webkit-full-screen iframe.video,
:-moz-full-screen iframe.video,
:-ms-fullscreen iframe.video {
  width: 100vw !important;
  height: 100vh !important;
  border: none !important;
  border-radius: 0 !important;
  background: #000 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 9999 !important;
}

/* 全屏时隐藏其他元素 */
:fullscreen .video-wrapper,
:-webkit-full-screen .video-wrapper,
:-moz-full-screen .video-wrapper,
:-ms-fullscreen .video-wrapper {
  position: relative;
  
  .fullscreen-btn {
    display: none !important;
  }
}

/* 全屏时关闭按钮样式 */
:fullscreen .close-fullscreen-btn,
:-webkit-full-screen .close-fullscreen-btn,
:-moz-full-screen .close-fullscreen-btn,
:-ms-fullscreen .close-fullscreen-btn {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  width: 56px !important;
  height: 56px !important;
  z-index: 10000 !important;
  background: rgba(237, 64, 20, 0.9) !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(4px) !important;
  display: block !important;

  &:hover {
    background: rgba(237, 64, 20, 1) !important;
    border-color: #ff6b6b !important;
    transform: scale(1.1) !important;
    box-shadow: 0 4px 12px rgba(237, 64, 20, 0.6) !important;
  }

  :deep(.ivu-icon) {
    color: #ffffff;
    font-size: 24px;
  }
}

</style>