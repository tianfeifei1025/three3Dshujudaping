<template>
  <div v-if="visible" class="monitor-popup-overlay" @click="closePopup">
    <div class="monitor-popup" @click.stop :class="{ 'closing': isClosing }">
      <div class="popup-header">
        <h3 class="popup-title">{{ pointData.name }} - 监控列表</h3>
        <button class="close-btn" @click="closePopup">
          <img src="@/assets/images/icon_slices/icon13.png" alt="关闭" class="close-icon"/>
        </button>
      </div>
      
      <div class="popup-content">
        <div class="monitor-stats">
          <div class="stat-item">
            <span class="stat-label">总监控数:</span>
            <span class="stat-value">{{ monitorStats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">在线:</span>
            <span class="stat-value online">{{ monitorStats.online }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">离线:</span>
            <span class="stat-value offline">{{ monitorStats.offline }}</span>
          </div>
        </div>
        
        <div class="monitor-list">
          <div class="list-header">
            <div class="search-box">
              <input 
                v-model="searchKeyword" 
                type="text" 
                placeholder="搜索监控设备..."
                class="search-input"
                @input="handleSearch"
              />
              <button class="clear-btn" @click="clearSearch" v-if="searchKeyword">
                <img src="@/assets/images/icon_slices/icon13.png" alt="清除" class="clear-icon"/>
              </button>
            </div>
            <div class="filter-tabs">
              <button 
                class="filter-tab" 
                :class="{ active: filterType === 'all' }"
                @click="setFilterType('all')"
              >
                全部
              </button>
              <button 
                class="filter-tab" 
                :class="{ active: filterType === 'online' }"
                @click="setFilterType('online')"
              >
                在线
              </button>
              <button 
                class="filter-tab" 
                :class="{ active: filterType === 'offline' }"
                @click="setFilterType('offline')"
              >
                离线
              </button>
            </div>
          </div>
          
          <div class="monitor-table">
            <div class="table-header">
              <div class="col-index">序号</div>
              <div class="col-name">监控名称</div>
              <div class="col-status">状态</div>
              <div class="col-audio">对讲</div>
              <div class="col-action">操作</div>
            </div>
            
            <div class="table-body" v-if="!loading">
              <div 
                v-for="(item, index) in currentData" 
                :key="item.id || index"
                class="table-row"
              >
                <div class="col-index">{{ index + 1 }}</div>
                <div class="col-name">{{ item.name }}</div>
                <div class="col-status">
                  <span 
                    class="status-badge" 
                    :class="{ 'online': item.onLine, 'offline': !item.onLine }"
                  >
                    {{ item.onLine ? '在线' : '离线' }}
                  </span>
                </div>
                <div class="col-audio">
                  <span 
                    class="audio-badge" 
                    :class="{ 'has-audio': item.hasAudio }"
                  >
                    {{ item.hasAudio ? '支持' : '不支持' }}
                  </span>
                </div>
                <div class="col-action">
                  <button 
                    class="view-btn" 
                    @click="viewVideo(item)"
                    :disabled="!item.onLine"
                  >
                    全屏播放
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <span>加载中...</span>
            </div>
            
            <div v-if="!loading && currentData.length === 0" class="empty-state">
              <div class="empty-icon">📹</div>
              <span>暂无监控设备</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMonitorStore } from '@/stores/monitor.js'
import { storeToRefs } from 'pinia'
import { getDeviceChannelIdList } from '@/api/api.js'
import emitter from "@/utils/emitter.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  pointData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

// 关闭动画状态
const isClosing = ref(false)

// 使用监控store
const monitorStore = useMonitorStore()
const { 
  data, 
  filteredData, 
  searchKeyword, 
  monitorStats, 
  loading,
  filterType
} = storeToRefs(monitorStore)

// 计算当前显示的数据 - 直接使用store中的currentData getter
const currentData = computed(() => {
  return monitorStore.currentData
})

// 搜索功能
const handleSearch = () => {
  monitorStore.handleSearch()
}

// 清空搜索
const clearSearch = () => {
  monitorStore.clearSearch()
}

// 设置筛选类型
const setFilterType = (type) => {
  monitorStore.setFilterType(type)
}

// 查看视频
const viewVideo = async (monitorItem) => {
  console.log("查看视频:", monitorItem)
  try {
    // 获取播放地址 - 等待Promise解析
    const stream_address = await monitorStore.viewVideo(monitorItem)
    
    if (stream_address) {
      const fullscreenData = {
        stream_address: stream_address,
        name: monitorItem.name || '-',
      }
      emitter.$emit("openFullscreen", fullscreenData)
    } else {
      console.warn('无法获取视频流地址')
    }
  } catch (error) {
    console.error('查看视频失败:', error)
  }
}

// 关闭弹窗
const closePopup = () => {
  isClosing.value = true
  // 延迟关闭，让动画完成
  setTimeout(() => {
    emit('close')
    isClosing.value = false
  }, 300)
}

// 监听搜索关键词变化
watch(searchKeyword, () => {
  handleSearch()
})

// 组件挂载时获取数据
onMounted(async () => {
  if (props.visible) {
    try {
      await fetchMonitorDataForBase()
    } catch (error) {
      console.error('获取监控数据失败:', error)
    }
  }
})

// 监听弹窗显示状态
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    try {
      await fetchMonitorDataForBase()
    } catch (error) {
      console.error('获取监控数据失败:', error)
    }
  }
})

// 监听点位数据变化 - 关键修复
watch(() => props.pointData, async (newPointData, oldPointData) => {
  // 当点位数据发生变化且弹窗可见时，重新获取监控数据
  if (props.visible && newPointData && newPointData.id && 
      (!oldPointData || newPointData.id !== oldPointData.id)) {
    console.log('点位数据变化，重新获取监控数据:', newPointData)
    
    // 清空当前数据，显示加载状态
    monitorStore.clearCache()
    
    try {
      await fetchMonitorDataForBase()
    } catch (error) {
      console.error('根据新点位获取监控数据失败:', error)
    }
  }
}, { deep: true })

// 根据基地信息获取监控数据
const fetchMonitorDataForBase = async () => {
  if (!props.pointData || !props.pointData.id) {
    console.warn('基地信息不完整，无法获取监控数据')
    return
  }
  try {
    const channelList = await getDeviceChannelIdList(props.pointData.id, props.pointData.name)
    console.log('获取到的设备通道列表:', channelList)
    // 根据通道列表过滤监控数据
    await monitorStore.fetchMonitorDataByChannelList(channelList)
  } catch (error) {
    console.error('根据基地获取监控数据失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.monitor-popup-overlay {
  position: fixed;
  top: 0;
  left: 1%;
  z-index: 10000;
  display: flex;
  align-items:center;
  justify-content: center;
  padding-top: 80px;
  backdrop-filter: blur(5px);
  .monitor-popup {
    width: 1000px;
    height: 800px;
    background: linear-gradient(135deg, rgba(13, 32, 64, 0.95) 0%, rgba(25, 50, 100, 0.95) 100%);
    border: 2px solid #40AFFD;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideDown 0.3s ease-out;
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 30px;
      background: rgba(64, 175, 253, 0.1);
      border-bottom: 1px solid rgba(64, 175, 253, 0.3);

      .popup-title {
        color: #FFFFFF;
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        background: -webkit-linear-gradient(rgb(234, 247, 255), rgb(121, 191, 249));
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        // 响应式字体大小
        @media (max-width: 768px) {
          font-size: 28px;
        }
      }

      .close-btn {
        background: rgba(255, 77, 77, 0.2);
        border: 2px solid #FF4D4D;
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(255, 77, 77, 0.4);
          transform: scale(1.1);
        }

        .close-icon {
          width: 20px;
          height: 20px;
        }
      }
    }

    .popup-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 20px;
      .monitor-stats {
        display: flex;
        gap: 30px;
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(64, 175, 253, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(64, 175, 253, 0.2);

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .stat-label {
            color: #ABCCFF;
            font-size: 28px;
          }

          .stat-value {
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 700;

            &.online {
              color: #00FF88;
            }

            &.offline {
              color: #FF6B6B;
            }
          }
        }
      }

      .monitor-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          gap: 20px;
          .search-box {
            position: relative;
            flex: 1;
            max-width: 300px;

            .search-input {
              width: 100%;
              padding: 10px 40px 10px 15px;
              background: rgba(64, 175, 253, 0.1);
              border: 1px solid rgba(64, 175, 253, 0.3);
              border-radius: 6px;
              color: #FFFFFF;
              font-size: 28px;

              &::placeholder {
                color: #ABCCFF;
              }

              &:focus {
                outline: none;
                border-color: #40AFFD;
                box-shadow: 0 0 10px rgba(64, 175, 253, 0.3);
              }
            }

            .clear-btn {
              position: absolute;
              right: 10px;
              top: 50%;
              transform: translateY(-50%);
              background: none;
              border: none;
              cursor: pointer;
              padding: 5px;

              .clear-icon {
                width: 16px;
                height: 16px;
                opacity: 0.7;
              }
            }
          }

          .filter-tabs {
            display: flex;
            gap: 10px;

            .filter-tab {
              padding: 8px 16px;
              background: rgba(64, 175, 253, 0.1);
              border: 1px solid rgba(64, 175, 253, 0.3);
              border-radius: 6px;
              color: #ABCCFF;
              cursor: pointer;
              transition: all 0.3s ease;
              font-size:28px;

              &:hover {
                background: rgba(64, 175, 253, 0.2);
              }

              &.active {
                background: rgba(64, 175, 253, 0.3);
                color: #FFFFFF;
                border-color: #40AFFD;
              }
            }
          }
        }
        .monitor-table {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(64, 175, 253, 0.2);

          .table-header {
            display: grid;
            grid-template-columns: 60px 1fr 100px 100px 100px;
            gap: 15px;
            padding: 15px 20px;
            background: rgba(64, 175, 253, 0.1);
            border-bottom: 1px solid rgba(64, 175, 253, 0.3);
            font-weight: 700;
            color: #FFFFFF;
            font-size: 28px;
          }

          .table-body {
            flex: 1;
            overflow-y: auto;

            .table-row {
              display: grid;
              grid-template-columns: 60px 1fr 100px 100px 100px;
              gap: 15px;
              padding: 15px 20px;
              border-bottom: 1px solid rgba(64, 175, 253, 0.1);
              transition: background 0.3s ease;

              &:hover {
                background: rgba(64, 175, 253, 0.05);
              }

              &:last-child {
                border-bottom: none;
              }
            }
          }
          .col-index {
            color: #ABCCFF;
            font-size: 28px;
          }

          .col-name {
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 500;
          }

          .col-status, .col-audio {
            display: flex;
            align-items: center;
          }

          .status-badge, .audio-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 28px;
            font-weight: 500;

            &.online {
              background: rgba(0, 255, 136, 0.2);
              color: #00FF88;
              border: 1px solid rgba(0, 255, 136, 0.3);
            }

            &.offline {
              background: rgba(255, 107, 107, 0.2);
              color: #FF6B6B;
              border: 1px solid rgba(255, 107, 107, 0.3);
            }

            &.has-audio {
              background: rgba(64, 175, 253, 0.2);
              color: #40AFFD;
              border: 1px solid rgba(64, 175, 253, 0.3);
            }
          }

          .col-action {
            display: flex;
            align-items: center;
          }

          .view-btn {
            padding: 6px 12px;
            background: rgba(64, 175, 253, 0.2);
            border: 1px solid #40AFFD;
            border-radius: 4px;
            color: #40AFFD;
            cursor: pointer;
            font-size:28px;
            transition: all 0.3s ease;

            &:hover:not(:disabled) {
              background: rgba(64, 175, 253, 0.3);
              transform: translateY(-1px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              background: rgba(128, 128, 128, 0.2);
              border-color: #808080;
              color: #808080;
            }
          }

          .loading-state, .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            color: #ABCCFF;

            .loading-spinner {
              width: 30px;
              height: 30px;
              border: 3px solid rgba(64, 175, 253, 0.3);
              border-top: 3px solid #40AFFD;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 10px;
            }

            .empty-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes slideDown {
            0% {
              transform: translateY(-100px);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideUp {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            100% {
              transform: translateY(-100px);
              opacity: 0;
            }
          }

          // 滚动条样式
          .table-body::-webkit-scrollbar {
            width: 6px;
          }

          .table-body::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }

          .table-body::-webkit-scrollbar-thumb {
            background: rgba(64, 175, 253, 0.3);
            border-radius: 3px;

            &:hover {
              background: rgba(64, 175, 253, 0.5);
            }
          }
        }
      }
    }
    // 关闭动画
    &.closing {
      animation: slideUp 0.3s ease-in forwards;
    }

  }

}










</style>
