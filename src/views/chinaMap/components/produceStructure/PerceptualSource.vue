<script setup>
import {onMounted, onUnmounted, reactive, ref, computed, nextTick, onBeforeUnmount} from "vue";
import VChart from "vue-echarts";
import * as echarts from "echarts";
import {useMonitorStore} from "@/stores/monitor.js";
import {useTempHumidityStore} from "@/stores/tempHumidity.js";
import {DatePicker} from 'view-ui-plus';
import emitter from "@/utils/emitter.js";
// 初始化 store
const monitorStore = useMonitorStore();
const tempHumidityStore = useTempHumidityStore();
// 响应式数据
const loading = ref(false);
const filteredParams = ref({
  dateRange: "",
  base:null
});

// 日期范围选择器相关
const dateRange = ref([]);

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

// 确定按钮点击处理
const onConfirmDateRange = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    const formattedRange = formatDateRange(dateRange.value);
    if (formattedRange) {
      console.log('选择的日期范围:', formattedRange);
      filteredParams.value.dateRange = formattedRange;
      emitter.$emit("dateRangeSelected", formattedRange);
      // 通过 store 更新过滤参数，会自动获取图表数据
      tempHumidityStore.updateFilterParams({
        dateRange: formattedRange
      });
    }
  } else {
    console.log('请先选择日期范围');
  }
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
  // 通过 store 更新过滤参数，会自动获取图表数据
  tempHumidityStore.updateFilterParams({
    base: baseParam
  });
}
const handleTypeSelected = async (data) => {
  if (data.type !== "") return;
  filteredParams.value.base = null;
  // 通过 store 更新过滤参数，会自动获取图表数据
  tempHumidityStore.updateFilterParams({
    base: null
  });
};
// 使用计算属性来确保图表配置的响应式更新
const option = computed(() => ({
  title: {
    text: "数量（次）",
    left: "5%",
    top: "8%",
    textStyle: {
      color: "#ABCCFF",
      fontSize: 28,
    },
  },
  grid: {
    left: "12%",
    top: "25%",
    width: "82%",
    height: "55%",
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
      shadowStyle: {opacity: 0.2},
    },
    backgroundColor: "rgba(0,0,0,1)",
    borderWidth: 1,
    borderColor: "#999999",
    textStyle: {
      color: "#ffffff",
      fontSize: 28,
    },
  },
  color: ["#6BC7F6"],
  xAxis: [
    {
      type: "category",

      axisLine: {
        show: true,
        lineStyle: {
          color: "rgba(171,204,255,0.4)",
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        color: "rgba(171,204,255,0.8)",
        fontSize: 28,
        interval: 0,
        padding: [0, 0, 0, 0],
      },
      data: ["温度(高)", "温度(低)", "湿度(高)", "湿度(低)"],
    },
    {
      axisLine: {
        show: false,
        lineStyle: {
          color: "rgba(0,0,0,0)",
        },
      },
      data: [],
    },
  ],
  yAxis: {
    type: "value",
    show: true,
    axisLine: {
      show: true,
      lineStyle: {
        color: "rgba(171,204,255,0.4)",
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: "rgba(171,204,255,0.4)",
      },
    },
    splitLine: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: "rgba(171,204,255,0.8)",
      fontSize: 25,
    },
  },
  legend: {
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      color: "#ABCCFF",
      fontSize: 28,
    },
    right: "5%",
    top: 10,
    data: [],
  },
  series: [
    {
      name: "预警数量",
      type: "pictorialBar",
      symbol: "path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z",
      label: {
        show: true,
        position: "top",
        distance: 10,
        color: "#FF0000",
        fontSize: 28,
        fontWeight: "bold",
        formatter: function (params) {
          return params.value;
        }
      },

      data: [
        {
          value: tempHumidityStore.chartData.temHigh,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: "rgba(64, 175, 255, 1)"},
              {offset: 1, color: "rgba(64, 175, 255, 0.10)"},
            ]),
          },
        },
        {
          value: tempHumidityStore.chartData.temLow,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: "rgba(25, 255, 198, 1)"},
              {offset: 1, color: "rgba(0, 204, 187, 0.10)"},
            ]),
          },
        },
        {
          value: tempHumidityStore.chartData.humHigh,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: "rgba(64, 175, 255, 1)"},
              {offset: 1, color: "rgba(64, 175, 255, 0.10)"},
            ]),
          },
        },
        {
          value: tempHumidityStore.chartData.humLow,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {offset: 0, color: "rgba(25, 255, 198, 1)"},
              {offset: 1, color: "rgba(0, 204, 187, 0.10)"},
            ]),
          },
        },
      ],
    },
  ],
}));

// 获取所有数据
const fetchAllData = async () => {
  try {
    loading.value = true;
    await tempHumidityStore.init();
  } catch (error) {
    console.error('获取数据失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await fetchAllData();
    dateRange.value =  initDateRange();
    filteredParams.value.dateRange = formatDateRange(dateRange.value);
    // 初始化时设置默认的过滤参数
    tempHumidityStore.updateFilterParams(filteredParams.value);
    emitter.$on("pointSelected", handleMarkerSelected);
    emitter.$on("typeSelected", handleTypeSelected);
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
})
onBeforeUnmount(() => {
  emitter.$off("pointSelected", handleMarkerSelected);
  emitter.$off("typeSelected", handleTypeSelected);
});
</script>

<template>
  <div class="right-card" ref="cardRef">
    <div class="source-stand">
      <!--标题-->
      <div class="title">
        <div> 感知源</div>
      </div>
      <!-- 日期范围选择器 -->
      <div class="date-picker-container">
        <DatePicker
            type="daterange"
            placeholder="请选择日期范围"
            v-model="dateRange"
            @on-ok="onConfirmDateRange"
            style="width:400px;"
            :clearable="false"
            :editable="false"
            :show-week-numbers="false"
            :confirm="true"
            format="yyyy-MM-dd"
            :options="{
            shortcuts: [
              {
                text: '最近7天',
                value: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                  // 开始日期设置为00:00:00，结束日期设置为23:59:59
                  start.setHours(0, 0, 0, 0);
                  end.setHours(23, 59, 59, 999);
                  return [start, end];
                }
              },
              {
                text: '最近30天',
                value: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                  // 开始日期设置为00:00:00，结束日期设置为23:59:59
                  start.setHours(0, 0, 0, 0);
                  end.setHours(23, 59, 59, 999);
                  return [start, end];
                }
              }
            ]
          }"
        />
      </div>
      <div class="source-container">
        <div class="item-left">
          <div class="state">
            <img src="@/assets/images/icon_slices/icon27.png" alt="温度" class="icon"/>
            <div>
              <div class="value1">{{ loading ? '--' : tempHumidityStore.monitorTotal }}</div>
              <div class="label">监控总数</div>
            </div>

          </div>
          <div class="state">
            <img src="@/assets/images/icon_slices/icon28.png" alt="湿度" class="icon"/>
            <div>
              <div class="value2">{{ loading ? '--' : tempHumidityStore.deviceTotal }}</div>
              <div class="label">环境监控设备</div>
            </div>

          </div>
        </div>
        <div class="item-right">
          <v-chart ref="vChart" :option="option" :autoresize="true"/>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.source-stand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: url('~@/assets/images/border_slices/border1.png') no-repeat;
  background-size: 100% 100%;
  width: 1800px;
  height: 560px;
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

  .date-picker-container {
    height: 50px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-right: 40px;
    position: relative;

    :deep(.ivu-input) {
      font-size: 28px !important;
      height: 60px !important;
      background: rgba(34, 122, 255, 0.102);
      border: 1px solid rgba(121, 191, 249, 0.3);
      color: #ffffff !important;
    }

    :deep(.ivu-input-prefix, .ivu-input-suffix) {
      top: 8px !important;
    }

    :deep(.ivu-input-prefix i, .ivu-input-suffix i) {
      font-size: 30px !important;
    }

    :deep(.ivu-select-dropdown) {
      position: fixed !important;
      transform: none !important;
      top: -320px !important;
      left: auto !important;
      right: 0 !important;
      bottom: auto !important;
      background: linear-gradient(135deg, rgba(0, 50, 100, 0.6), rgba(0, 30, 60, 0.8));
    }

    :deep(.ivu-picker-panel-sidebar) {
      width: 180px !important;
      background: linear-gradient(135deg, rgba(0, 50, 100, 0.6), rgba(0, 30, 60, 0.8));
    }

    :deep(.ivu-picker-panel-body) {
      margin-left: 100px !important;
    }

    :deep(.ivu-picker-panel-body) {
      font-size: 28px !important;
    }

    :deep(.ivu-btn-text span) {
      font-size: 28px !important;
    }

    :deep(.ivu-picker-panel-icon-btn i) {
      font-size: 25px !important;
    }

    :deep(.ivu-btn-small) {
      height: 50px !important;
    }

    :deep(.ivu-btn-primary) {
      background: #0E60AD;
    }

    :deep(.ivu-btn-small span) {
      font-size: 28px !important;
    }

    :deep(.ivu-picker-panel-shortcut) {
      color: #B4D8FF !important;
    }

    :deep(.ivu-date-picker-header-label) {
      color: #B4D8FF !important;
      font-size: 30px
    }


  }

  .source-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 450px;
    overflow: hidden;

    .item-right {
      flex: 3;
    }

    .item-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;

      .state {
        display: flex;
        flex-direction: row;
        align-items: center;
        text-align: center;
        width: 360px;
        height: 180px;
        background: linear-gradient(360deg, rgba(139, 208, 240, 0.16) 0%, rgba(139, 208, 240, 0.04) 100%);
        border-radius: 16px 16px 16px 16px;

        .icon {
          width: 96px;
          height: 96px;
        }

        .value1 {
          font-weight: 700;
          font-size: 40px;
          color: #FFFFFF;
          line-height: 32px;
          text-shadow: 0px 6px 20px rgba(255, 227, 43, 0.4), 0px 8px 20px rgba(255, 227, 43, 0.29);
          text-align: center;
          font-style: normal;
          text-transform: none;
          background: linear-gradient(90deg, #FFE32B 0%, #FFE32B 29%, rgba(255, 227, 43, 0) 76%);
        }

        .value2 {
          font-weight: 700;
          font-size: 40px;
          color: #FFFFFF;
          line-height: 32px;
          text-shadow: 0px 6px 20px rgba(39, 255, 226, 0.4), 0px 8px 20px rgba(39, 255, 226, 0.29);
          text-align: center;
          font-style: normal;
          text-transform: none;
          background: linear-gradient(90deg, #27FFE2 0%, #27FFE2 30%, rgba(39, 255, 226, 0) 76%);
        }

        .label {
          font-weight: 400;
          font-size: 28px;
          color: #CEE5FF;
          line-height: 38px;
          margin-top: 20px;
        }

      }
    }
  }
}
</style>