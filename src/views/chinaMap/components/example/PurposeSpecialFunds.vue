<template>
  <div class="left-card" ref="cardRef">
    <m-card title="专项资金用途" :height="height">
      <v-chart ref="vChart" :option="option" :autoresize="true" />
    </m-card>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import mCard from "@/components/mCard/index.vue";
import VChart from "vue-echarts";
const cardRef = ref(null);
const height = ref(280);
let index = 0;
const show = 4;
const names = [
  "扶贫资金",
  "学校教育",
  "医疗卫生",
  "社区改造",
  "环境工程",
  "渔业资金",
];
const values = [100, 80, 60, 50, 30, 10];
const maxValue = values.reduce((prev, next) => Math.max(prev, next), 0);
const maxData = new Array(show).fill(maxValue);

let startName = names.slice(index, show);
const dataStyle = [
  {
    value: 0,
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
        { offset: 0, color: "rgba(3,65,128,1)" },
        { offset: 1, color: "rgba(115,208,255,1)" },
      ]),
    },
  },
  {
    value: 0,
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
        { offset: 0, color: "rgba(11, 77, 44, 1)" },
        { offset: 1, color: "rgba(77, 255, 181, 1)" },
      ]),
    },
  },
  {
    value: 0,
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
        { offset: 0, color: "rgba(117, 117, 117, 1)" },
        { offset: 1, color: "rgba(230, 230, 230, 1)" },
      ]),
    },
  },
  {
    value: 0,
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
        { offset: 0, color: "rgba(153, 105, 38, 1)" },
        { offset: 1, color: "rgba(255, 200, 89, 1)" },
      ]),
    },
  },
];
const option = ref({
  grid: {
    left: "5%",
    top: "10%",
    width: "90%",
    height: "86%",
  },
  legend: {
    top: "8%",
    icon: "circle",
    itemWidth: 8,
    itemHeight: 8,
    textStyle: {
      color: "#90979c",
      fontSize: 12,
      lineHeight: 20,
    },
  },

  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
      shadowStyle: { opacity: 0.2 },
    },
    backgroundColor: "rgba(0,0,0,1)",
    borderWidth: 1,
    borderColor: "#999999",
    textStyle: {
      color: "#ffffff",
      fontSize: 10,
      lineHeight: 156,
    },
  },
  color: ["#6BC7F6", "#44E6A2"],
  xAxis: [
    {
      type: "value",
      interval: 0,

      axisLine: {
        show: false,
        lineStyle: {
          color: "#407A80",
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        color: "#ABCCFF",
        fontSize: 10,
        interval: 0,
      },
    },
  ],

  yAxis: [
    {
      type: "category",
      inverse: true,
      axisLabel: {
        color: "#ABCCFF",
        fontSize: 12,
        interval: 0,
        show: false,
        verticalAlign: "top",
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      data: startName,
    },
    {
      inverse: true,
      axisLine: {
        show: false,
        lineStyle: {
          color: "rgba(0,0,0,0)",
        },
      },
      data: [],
    },
  ],
  color: [
    "rgba(115,208,255,1)",
    "rgba(77, 255, 181, 1)",
    "rgba(230, 230, 230, 1)",
    "rgba(255, 200, 89, 1)",
  ],
  series: [
    {
      data: [],
      type: "bar",
      barWidth: 7,
      yAxisIndex: 0,
      showBackground: false,
      z: 2,
      label: {
        show: true,
        position: "middle",
        padding: [-18, 0, 0, 0],
        color: "#16C1A6",
        fontSize: 12,
        formatter: "{title|{b}}  {value|{c}}  {unit|亿元}",
        rich: {
          title: {
            color: "#FFFFFF",
            fontSize: 12,
            padding: [0, 288, 0, 0],
          },
          value: {
            fontSize: 14,
            width: 50,
            align: "right",
            padding: [0, 0, 0, 0],
          },
          unit: {
            color: "#ABCCFF",
            fontSize: 12,
            align: "right",
          },
        },
      },
      itemStyle: {
        borderRadius: 0,
        borderWidth: 2,
        borderColor: "rgba(26, 57, 77,1)",
      },
    },
    {
      name: "",
      type: "bar",
      yAxisIndex: 1,
      barGap: "-100%",
      data: maxData,
      barWidth: 10,
      z: 0,
      itemStyle: {
        color: "none",
        borderColor: "rgba(172,191,188,0.4)",
        borderWidth: 1,
        borderRadius: 0,
      },
    },
  ],
});
function getData(data, index, length) {
  const result = [];
  const dataLength = data.length;
  for (let i = 0; i < length; i++) {
    const currentIndex = (index + i) % dataLength;
    result.push(data[currentIndex]);
  }

  return result;
}

// 获取Series数据
function getSeriesData() {
  let currentValues = getData(values, index, show);
  let data = [];
  dataStyle.forEach((item, index) => {
    item.value = currentValues[index];
    data.push(item);
  });
  return data;
}
// 设置图表数据
function setOptionsData() {
  let currentNames = getData(names, index, show);
  option.value.yAxis[0].data = currentNames;
  option.value.series[0].data = getSeriesData();
}

onMounted(() => {
  setOptionsData();
  setInterval(() => {
    index++;
    if (index >= names.length) {
      index = 0;
    }
    setOptionsData();
  }, 3000);
});
onBeforeUnmount(() => {});
</script>

<style lang="scss"></style>
