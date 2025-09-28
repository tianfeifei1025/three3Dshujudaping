<script setup>
import {ref, onMounted, onBeforeUnmount, reactive, computed} from "vue";
import mCard from "@/components/mCard/index.vue";
import {commonFetchYs, statTownshipSummary} from "@/api/api.js";
import VChart from "vue-echarts";
import * as echarts from "echarts";

const height = ref(570);
const width = ref(1800);
const content = ref("");
const chartData = reactive({
  xAxisData: [],
  courtyardData: [],
  collectiveIncomeData: [],
  perHouseholdData: []
});
// 计算总数
const totalCourtyard = ref(0);
const totalPerHousehold = ref(0);
const totalCollectiveIncome = ref(0);

const option = computed(() => ({
  title: {
    text: "万元/户",
    left: "5%",
    top: "8%",
    textStyle: {
      color: "#ABCCFF",
      fontSize: 25,
    },
  },
  grid: {
    left: "12%",
    top: "25%",
    width: "82%",
    height: "55%",
  },
  legend: {
    top: "4%",
    right: "5%",
    icon: "rect",
    itemWidth: 12,
    itemHeight: 12,
    textStyle: {
      color: "#ABCCFF",
      fontSize: 28,
    },
    data: ["集体经济", "庭院种植户"],
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
      shadowStyle: {opacity: 0},
    },
    backgroundColor: "rgba(0,0,0,1)",
    borderWidth: 1,
    borderColor: "#999999",
    textStyle: {
      color: "#ffffff",
      fontSize: 25,
    },
  },
  xAxis: [
    {
      type: "category",
      interval: 0,
      axisLine: {
        show: false,
        lineStyle: {
          color: "#435459",
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
      data: chartData.xAxisData,
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

    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: "#ABCCFF",
        type: "dashed",
        opacity: 0.4,
      },
    },
    axisLabel: {
      color: "#ABCCFF",
      fontSize: 28,
    },
  },
  series: [
    // {
    //   name: "户均金额",
    //   data:chartData.perHouseholdData,
    //   type: "bar",
    //   barWidth: 8,
    //   z: 5,
    //   label: {
    //     show: false,
    //   },
    //   itemStyle: {
    //     borderRadius: 0,
    //     color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    //       { offset: 0, color: "#79EBCF" },
    //       { offset: 1, color: "#0B6360" },
    //     ]),
    //   },
    // },
    {
      name: "集体经济",
      data: chartData.collectiveIncomeData,
      type: "bar",
      barWidth: 12,
      barGap: 1,
      z: 5,
      label: {
        show: true,
        position: "top",
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "bold",
        formatter: function (params) {
          return params.value.toFixed(2);
        }
      },
      itemStyle: {
        borderRadius: 0,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {offset: 0, color: "#40AEFE"},
          {offset: 1, color: "#25567A"},
        ]),
      },
    },
    {
      name: "庭院种植户",
      data: chartData.courtyardData,
      type: "line",
      z: 6,
      lineStyle: {
        color: "#00FFFF",
        width: 5,
      },
      itemStyle: {
        color: "#00FFFF",
      },
      label: {
        show: true,
        position: "top",
        color: "#00FFFF",
        fontSize: 22,
        fontWeight: "bold",
        formatter: function (params) {
          return params.value;
        }
      },
      areaStyle: {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: "rgb(0, 255, 255)",
          },
          {
            offset: 1,
            color: "rgb(0, 100, 255)",
          },
        ]),
      },
    },
  ],
}));
onMounted(async () => {
  try {
    const res = await commonFetchYs("poverty_alleviation", "poverty_alleviation", 100, [[[]]]);
    if (res.code === 0 && res.data && res.data.length > 0) {
      content.value = res.data[0];
    }
    const res1 = await statTownshipSummary();
    if (res1.length > 0) {
      res1.forEach((item) => {
        chartData.xAxisData.push(item.townshipName);
        chartData.courtyardData.push(item.courtyardCount);
        chartData.collectiveIncomeData.push(item.collectiveIncome);
        chartData.perHouseholdData.push(item.perHousehold);
      })
      // 计算总数
      totalCourtyard.value = chartData.courtyardData.reduce((sum, val) => sum + (val || 0), 0);
      totalPerHousehold.value = chartData.perHouseholdData.reduce((sum, val) => sum + (val || 0), 0);
      // totalPerHousehold.value = perHouseholds / totalCourtyard.value;
      totalCollectiveIncome.value = chartData.collectiveIncomeData.reduce((sum, val) => sum + (val || 0), 0);
    }
  } catch (error) {
    console.error('请求或处理 anti_return_measures 时出错:', error);
    content.value = '数据加载失败';
  }
});
</script>

<template>
  <div class="left-card" ref="cardRef">
    <m-card title="联农带农" :height="height" :width="width">
      <div class="agriculture-container">
        <div class="section1">
          <table class="table">
            <thead>
            <tr>
              <th rowspan="2" class="employment-header">就业人数</th>
              <th colspan="4" class="title-gradient">固定就业人数</th>
            </tr>
            <tr>
              <td colspan="4" class="fixed-employment-data">{{ content.fixed_employment || 0 }}</td>
            </tr>
            </thead>
            <tbody>
            <!-- 分类列头 -->
            <tr class="category-row">
              <td></td>
              <th class="category-header">上寨</th>
              <th class="category-header">基地</th>
              <th class="category-header">繁育中心</th>
              <th class="category-header">含大学生</th>
            </tr>
            <!-- 数据行 -->
            <tr class="detail-data-row">
              <td class="data-cell">{{ content.employed_persons || 0 }}人次</td>
              <td class="data-cell">{{ content.shangzhai || 0 }}</td>
              <td class="data-cell">{{ content.base || 0 }}</td>
              <td class="data-cell">{{ content.breeding_center || 0 }}</td>
              <td class="data-cell">{{ content.university_student || 0 }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="section2">
          <div class="stats">
            <div class="stat-item">
              <img src="@/assets/images/icon_slices/icon56.png" alt="庭院种植户" class="icon"/>
              <div>
                <div class="value1">{{ totalCourtyard }}</div>
                <div class="label">庭院种植户(户)</div>
              </div>
            </div>
            <div class="stat-item">
              <img src="@/assets/images/icon_slices/icon57.png" alt="户均金额" class="icon"/>
              <div>
                <div class="value2">{{ totalPerHousehold.toFixed(2) }}</div>
                <div class="label">庭院总收入(万元)</div>
              </div>
            </div>
            <div class="stat-item">
              <img src="@/assets/images/icon_slices/icon61.png" alt="集体经济" class="icon"/>
              <div>
                <div class="value3">{{ totalCollectiveIncome.toFixed(2) }}</div>
                <div class="label">集体经济(万元)</div>
              </div>
            </div>
          </div>

          <v-chart ref="vChart" :option="option" :autoresize="true"/>
        </div>
      </div>
    </m-card>
  </div>
</template>

<style lang="scss" scoped>
.agriculture-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 60px;
  padding: 20px;

  .section1 {
    width: 700px;
    height: 450px;
    background: url("~@/assets/images/border_slices/border6.png") no-repeat;
    background-size: 700px 470px;

    .table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      position: relative;
      z-index: 2;
    }

    .table th,
    .table td {
      padding: 20px 25px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 32px;
      color: white;
      vertical-align: middle;
      height: 25%;
    }

    /* 就业人数标题样式 */
    .employment-header {
      background: linear-gradient(90deg, #FFFFFF 0%, #E78F25 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      font-size: 32px;
      font-weight: 700;
      text-align: center;
      vertical-align: middle;
    }

    /* 固定就业人数标题样式 */
    .title-gradient {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(90deg, #FFFFFF 0%, #E78F25 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }

    /* 主要数据行样式 */
    .main-data-row {
      .employment-data {
        background: linear-gradient(180deg, rgba(51, 132, 255, 0.3) 0%, rgba(51, 132, 255, 0.1) 100%);
        font-size: 20px;
        font-weight: bold;
        color: #FFFFFF;
      }

      .fixed-employment-data {
        background: linear-gradient(180deg, rgba(51, 132, 255, 0.3) 0%, rgba(51, 132, 255, 0.1) 100%);
        font-size: 20px;
        font-weight: bold;
        color: #FFFFFF;
      }
    }

    /* 分类标题样式 */
    .category-header {
      background: linear-gradient(90deg, #FFFFFF 0%, #E78F25 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      font-weight: 700;
      font-size: 32px;
      text-align: center;
    }

    /* 数据单元格样式 */
    .data-cell {
      background: linear-gradient(180deg, rgba(51, 132, 255, 0.25) 0%, rgba(51, 132, 255, 0.05) 100%);
      box-shadow: inset 0px 0px 15px 0px rgba(160, 181, 233, 0.1);
      font-weight: 400;
      font-size: 28px;
      color: #FFFFFF;
    }

    /* 空单元格样式 */
    .category-row td:first-child {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* 确保数据单元格样式不被覆盖 */
    .detail-data-row .data-cell {
      background: linear-gradient(180deg, rgba(51, 132, 255, 0.25) 0%, rgba(51, 132, 255, 0.05) 100%) !important;
      box-shadow: inset 0px 0px 15px 0px rgba(160, 181, 233, 0.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
  }

  .section2 {
    width: 1100px;
    height: 470px;
    margin-left: 20px;
    display: flex;
    flex-direction: column;

    .stats {
      height: 80px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
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

        .value3 {
          font-family: 'Alibaba PuHuiTi', sans-serif;
          font-weight: 700;
          font-size: 28px;
          color: #FFFFFF;
          line-height: 1;
          text-shadow: 0px 6px 20px rgba(53,143,255,0.4), 0px 8px 20px rgba(53,143,255,0.29);
          text-align: center;
          font-style: normal;
          text-transform: none;
          background: linear-gradient(90deg, #358FFF 0%, #358FFF 30%, rgba(53,143,255,0) 76%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 5px;
        }

        .label {
          font-weight: 400;
          font-size: 24px;
          color: #B8D4FF;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}
</style>