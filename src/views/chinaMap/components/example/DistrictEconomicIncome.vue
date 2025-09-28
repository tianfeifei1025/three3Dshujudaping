<template>
  <div class="right-card" ref="cardRef">
    <!-- 各区经济收益 -->
    <m-card title="各省经济收益" :height="height">
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
        fontSize: 12,
        interval: 0,
        padding: [0, 0, 0, 0],
      },
      data: ["广东省", "四川省", "山东省", "陕西省", "湖南省"],
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
  legend: {
    itemWidth: 10,
    itemHeight: 10,
    textStyle: {
      color: "#ABCCFF",
      fontSize: 12,
    },
    right: "5%",
    top: 10,
    data: ["指标一", "指标二"],
  },
  series: [
    //
    {
      name: "指标一",
      type: "pictorialBar",
      symbol: "path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C4.5,5 4.5,10 0,10 z",
      label: {
        show: false,
        position: "top",
        distance: 10,
        color: "rgba(171,204,255,0.6)",
        fontSize: 10,
      },

      data: [
        {
          value: 8000,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 175, 255, 1)" },
              { offset: 1, color: "rgba(64, 175, 255, 0.10)" },
            ]),
          },
        },
        {
          value: 7500,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(25, 255, 198, 1)" },
              { offset: 1, color: "rgba(0, 204, 187, 0.10)" },
            ]),
          },
        },
        {
          value: 6000,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 175, 255, 1)" },
              { offset: 1, color: "rgba(64, 175, 255, 0.10)" },
            ]),
          },
        },
        {
          value: 5800,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(25, 255, 198, 1)" },
              { offset: 1, color: "rgba(0, 204, 187, 0.10)" },
            ]),
          },
        },
        {
          value: 5000,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 175, 255, 1)" },
              { offset: 1, color: "rgba(64, 175, 255, 0.10)" },
            ]),
          },
        },
      ],
    },
    //
    {
      name: "指标一",
      type: "custom",
      z: 3,
      xAxisIndex: 1,
      renderItem: (params, api) => {
        const categoryIndex = api.value(0);

        const categoryData = api.value(1);

        const basicsCoord = api.coord([categoryIndex, categoryData]);

        const topBasicsYAxis = basicsCoord[1];

        const basicsXAxis = basicsCoord[0];
        return {
          type: "image",
          style: {
            x: basicsXAxis - 7,
            y: topBasicsYAxis - 7,
            width: 14,
            height: 14,
            image:
              "data:image/png;base64,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",
          },
        };
      },
      data: [8000, 7500, 6000, 5800, 5000],
    },
    //
    {
      name: "指标二",
      data: [2000, 6030, 2204, 3108, 1325],
      type: "line",
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
      name: "指标二",
      type: "lines",
      coordinateSystem: "cartesian2d",
      polyline: true,
      zlevel: 2,
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
            [0, 2000],
            [1, 6030],
            [2, 2204],
            [3, 3108],
            [4, 1325],
          ], // 跟随折线图的坐标轨迹
        },
      ],
    },
  ],
});


</script>
<style lang="scss"></style>
