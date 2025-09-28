<script setup>
import {ref, onMounted, onUnmounted, computed} from "vue";
import mCard from "@/components/mCard/index.vue";
import {Table} from "view-ui-plus";
import {useTempHumidityStore} from "@/stores";
import emitter from "@/utils/emitter.js";

const cardRef = ref(null);
const height = ref(600);
const filteredParams = ref({
  dateRange: "",
  base: null
});
// 使用 Pinia store
const tempHumidityStore = useTempHumidityStore();
// 从 store 获取数据
const content = computed(() => tempHumidityStore.currentDeviceData);
const hasAlarmData = computed(() => tempHumidityStore.hasAlarmData);
const alarmData = computed(() => tempHumidityStore.allAlarmData);
// 自定义表格列配置，为预警等级列和预警值列添加自定义渲染
const columns = computed(() => {
  const baseColumns = tempHumidityStore.columns;
  return baseColumns.map(column => {
    if (column.key === 'alarmLevel') {
      return {
        ...column,
        render: (h, params) => {
          const value = params.row.alarmLevel;
          return h('span', {
            style: {
              color: '#ff4d4f' // 所有预警等级都显示为红色
            }
          }, value);
        }
      };
    }
    return column;
  });
});
// 初始化默认日期范围（最近7天）
const initDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  // 开始日期设置为00:00:00，结束日期设置为23:59:59
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return [startDate, endDate];
};
// 格式化日期范围
const formatDateRange = (dates) => {
  if (!dates || dates.length !== 2) return '';

  const startDate = dates[0];
  const endDate = dates[1];

  const formatDateTime = (date, isEndDate = false) => {
    // 确保传入的是Date对象
    if (!date || typeof date.getFullYear !== 'function') {
      console.warn('Invalid date object:', date);
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // 如果是结束日期，设置为23:59:59，否则设置为00:00:00
    const time = isEndDate ? '23:59:59' : '00:00:00';

    return `${year}-${month}-${day} ${time}`;
  };

  const startFormatted = formatDateTime(startDate, false);
  const endFormatted = formatDateTime(endDate, true);

  if (!startFormatted || !endFormatted) {
    return '';
  }

  return `${startFormatted};${endFormatted}`;
};
//标记点点击事件
const handleMarkerSelected=async (data) => {
  if (data.type !== "base") return;
  if (!data.id || !data.name) {
    console.warn("Marker 数据不完整:", data);
    return;
  }
  const baseParam = JSON.stringify([{
    id: data.id,
    name: data.name,
    unitType: 1
  }]);
  filteredParams.value.base = baseParam;
  
  // 更新 store 的过滤参数
  tempHumidityStore.updateFilterParams({
    base: baseParam
  });
}
const handleTypeSelected = (data) => {
  if (data.type !== "") return;
  filteredParams.value.base =null;
  // 更新 store 的过滤参数
  tempHumidityStore.updateFilterParams({
    base: null
  });
}
const handleDateRangeSelected = (data) => {
  filteredParams.value.dateRange = data;
  
  // 更新 store 的过滤参数
  tempHumidityStore.updateFilterParams({
    dateRange: data
  });
}
// 初始化加载
onMounted(async () => {
  try {
    await tempHumidityStore.init();
    const initDate = initDateRange();
    filteredParams.value.dateRange = formatDateRange(initDate);
    
    // 初始化时设置默认的过滤参数
    tempHumidityStore.updateFilterParams(filteredParams.value);
    
    emitter.$on("pointSelected", handleMarkerSelected);
    emitter.$on("dateRangeSelected", handleDateRangeSelected);
    emitter.$on("typeSelected", handleTypeSelected);
  } catch (err) {
    console.error('初始化温湿度数据失败:', err);
  }
});

// 组件卸载时清理
onUnmounted(() => {
  tempHumidityStore.destroy();
  emitter.$off("pointSelected", handleMarkerSelected);
  emitter.$off("dateRangeSelected", handleDateRangeSelected);
  emitter.$off("typeSelected", handleTypeSelected);
});

</script>
<template>
  <div class="right-card" ref="cardRef">
    <m-card title="温湿度" :height="height">
      <div class="temp-stand">
        <!-- 基地名称 - 右上角 -->
        <!--        <div class="base-name">{{ content.base_name || '-' }}</div>-->
        <!-- 温度 & 湿度 -->
        <div class="stats">
          <div class="stat-item">
            <img src="@/assets/images/icon_slices/icon27.png" alt="温度" class="icon"/>
            <div>
              <div class="value1">{{ content.temperature }}</div>
              <div class="label">{{ content.base_name }}实时温度</div>
            </div>

          </div>
          <div class="stat-item">
            <img src="@/assets/images/icon_slices/icon28.png" alt="湿度" class="icon"/>
            <div>
              <div class="value2">{{ content.humidity }}</div>
              <div class="label">{{ content.base_name }}实时湿度</div>
            </div>

          </div>
        </div>
        <!-- 预警表格 -->
        <div class="table-box" v-if="hasAlarmData">
          <Table height="480" :columns="columns" :data="alarmData"></Table>
        </div>
        <div class="empty-tip" v-else>暂无预警数据</div>
      </div>

    </m-card>
  </div>
</template>
<style scoped>
.temp-stand {
  display: flex;
  color: #FFFFFF;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 20px;
  padding: 20px 15px;
  min-height: 500px;
  position: relative;
  animation: fadeInUp 0.8s ease-out;

  .base-name {
    position: absolute;
    top: -10px;
    right: 20px;
    font-size: 28px;
    font-weight: 700;
    color: #FFE32B;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    z-index: 10;
    white-space: nowrap;
    animation: fadeInRight 0.8s ease-out;
  }

  .empty-tip {
    height: 300px;
    line-height: 300px;
    text-align: center;
    color: #7ca0c7;
    font-style: italic;
    font-size: 24px;
  }

  .stats {
    height: 100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 50px;
    margin-bottom: 20px;
    gap: 15px;
    padding: 0;

    .stat-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      text-align: center;
      flex: 1;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(139, 208, 240, 0.2) 0%, rgba(139, 208, 240, 0.05) 100%);
      border-radius: 16px;
      justify-content: center;
      padding: 15px;
      position: relative;
      border: 1px solid rgba(139, 208, 240, 0.3);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      animation: slideInLeft 0.6s ease-out;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
        border-color: rgba(139, 208, 240, 0.5);
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        pointer-events: none;
      }

      .icon {
        width: 60px;
        height: 60px;
        margin-right: 15px;
        filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.4));
      }

      .value1 {
        font-family: 'Alibaba PuHuiTi', sans-serif;
        font-weight: 700;
        font-size: 28px;
        color: #FFE32B;
        line-height: 1;
        text-shadow: 0 0 15px rgba(255, 227, 43, 0.6), 0 0 30px rgba(255, 227, 43, 0.3);
        text-align: center;
        font-style: normal;
        text-transform: none;
        background: linear-gradient(90deg, #FFE32B 0%, #FFD700 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 5px;
      }

      .value2 {
        font-family: 'Alibaba PuHuiTi', sans-serif;
        font-weight: 700;
        font-size: 28px;
        color: #27FFE2;
        line-height: 1;
        text-shadow: 0 0 15px rgba(39, 255, 226, 0.6), 0 0 30px rgba(39, 255, 226, 0.3);
        text-align: center;
        font-style: normal;
        text-transform: none;
        background: linear-gradient(90deg, #27FFE2 0%, #00D4AA 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 5px;
      }

      .label {
        font-weight: 400;
        font-size: 22px;
        color: #B8D4FF;
        line-height: 1.2;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }
  }


  .table-box {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    height: 480px;
    background: transparent;
    position: relative;
  }

  :deep(.ivu-table) {
    background: transparent !important;
    color: #ffffff;
    border-radius: 12px;
  }

  :deep(.ivu-table tr) {
    height: 55px;
  }

  :deep(.ivu-table th) {
    background: linear-gradient(135deg, rgba(77, 136, 225, 0.6) 0%, rgba(77, 136, 225, 0.3) 100%) !important;
    font-weight: 600;
    font-size: 28px;
    color: #E8F4FF;
    line-height: 1.3;
    text-align: center;
    border-bottom: 1px solid rgba(77, 136, 225, 0.5);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  :deep(.ivu-table td) {
    background: transparent !important;
    font-weight: 400;
    font-size: 27px;
    color: #FFFFFF;
    line-height: 1.3;
    text-align: center;
    border-bottom: 1px solid rgba(29, 71, 119, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  :deep(.ivu-table tbody tr:hover td) {
    background: rgba(139, 208, 240, 0.2) !important;
    transition: all 0.3s ease;
  }

  :deep(.ivu-table-wrapper) {
    border: none !important;
    box-shadow: none !important;
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.ivu-table-empty td) {
    background: transparent !important;
    color: #7ca0c7;
    font-style: italic;
  }

  :deep(.ivu-table-row-even td) {
    background: rgba(0, 51, 102, 0.2) !important;
  }

  :deep(.ivu-table-body) {
    overflow-x: hidden !important;
    overflow-y: auto !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(77, 136, 225, 0.6) transparent;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar {
    width: 8px;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(77, 136, 225, 0.8) 0%, rgba(77, 136, 225, 0.4) 100%);
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  :deep(.ivu-table-body)::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(77, 136, 225, 1) 0%, rgba(77, 136, 225, 0.6) 100%);
  }
}

/* 动画关键帧 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 227, 43, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 227, 43, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 227, 43, 0);
  }
}

/* 为温度和湿度值添加脉冲动画 */
.value1, .value2 {
  animation: pulse 2s infinite;
}

</style>
