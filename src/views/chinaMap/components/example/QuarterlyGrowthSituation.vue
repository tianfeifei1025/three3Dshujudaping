<template>
  <div class="left-card" ref="cardRef">
    <m-card title="各季度增长情况" :height="height">
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
const option = ref({
  title: {
    text: "亿元",
    left: "5%",
    top: "8%",
    textStyle: {
      color: "#ABCCFF",
      fontSize: 10,
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
    itemWidth: 8,
    itemHeight: 8,
    textStyle: {
      color: "#ABCCFF",
      fontSize: 12,
    },
    data: ["类型1", "类型2",'类型3'],
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
      shadowStyle: { opacity: 0 },
    },
    backgroundColor: "rgba(0,0,0,1)",
    borderWidth: 1,
    borderColor: "#999999",
    textStyle: {
      color: "#ffffff",
      fontSize: 10,
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
        fontSize: 12,
        interval: 0,
        padding: [0, 0, 0, 0],
      },
      data: ["一季度", "二季度", "三季度", "四季度"],
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
      fontSize: 12,
    },
  },
  series: [
    {
      name: "类型1",
      data: [100, 120, 130, 110],
      type: "bar",
      barWidth: 6,
      z: 5,
      label: {
        show: false,
      },
      itemStyle: {
        borderRadius: 0,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#79EBCF" },
          { offset: 1, color: "#0B6360" },
        ]),
      },
    },
    {
      name: "类型2",
      data: [60, 100, 150, 90],
      type: "bar",
      barWidth: 6,
      barGap: 1,
      z: 5,
      label: {
        show: false,
      },
      itemStyle: {
        borderRadius: 0,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "#40AEFE" },
          { offset: 1, color: "#25567A" },
        ]),
      },
    },
    {
      name: "",
      type: "bar",
      xAxisIndex: 1,
      z: 4,
      data: [150, 150, 150, 150],
      // 设置高亮样式
      emphasis: {
        focus: "none",
        itemStyle: { color: "rgba(255,255,255,0.8)" },
      },
      itemStyle: {
        color: "rgba(122,140,153,0.6)",
        opacity: 0.1,
      },
    },
    //
    {
      name: "类型3",
      data: [50, 20, 100, 31],
      type: "line",
      z: 6,
      areaStyle: {
        opacity: 0.2,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: "rgb(0, 221, 255)",
          },
          {
            offset: 1,
            color: "rgb(0, 0, 0)",
          },
        ]),
      },
    },
    {
      name: "类型3",
      type: "lines",
      coordinateSystem: "cartesian2d",
      polyline: true,
      zlevel: 7,
      effect: {
        show: true,
        constantSpeed: 80, // 较低速度让移动更平滑
        trailLength: 0.9, // 较长拖尾以增加流动感
        symbol: "circle", // 使用圆形光点
        symbolSize: 2, // 光点的大小
        color: "rgba(255, 255, 255, 0.8)", // 光点的颜色
        shadowBlur: 0, //光条背景轨迹宽度
        shadowColor: "rgba(255, 255, 255, 0.1)", //光条背景轨迹颜色
      },
      symbolSize: 1,
      lineStyle: {
        opacity: 0, // 隐藏 `lines` 的线，只显示光点效果
      },
      data: [
        {
          coords: [
            [0, 50],
            [1, 20],
            [2, 100],
            [3, 31]
          ], // 跟随折线图的坐标轨迹
        },
      ],
    },
  
  ],
});


</script>
<style lang="scss"></style>
