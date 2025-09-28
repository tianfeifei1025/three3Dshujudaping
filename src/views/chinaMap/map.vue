<template>
  <div class="map">
    <canvas id="canvasMap"></canvas>
  </div>
</template>
<script setup>
import { onMounted, shallowRef, onBeforeUnmount } from "vue";
import { World } from "./map.js";
import emitter from "@/utils/emitter";
import baseData from "./map/baseData.js";
import parkData from "./map/parkData.js";
import centerData from "./map/centerData.js";
function sortByValue(data) {
  data.sort((a, b) => b.value - a.value);
  return data;
}
const canvasMap = shallowRef(null);
// 飞线中心
const flyLineCenter = [100.976715,32.269592];
onMounted(() => {
  emitter.$on("loadMap", loadMap);
  emitter.$on("mapPlayComplete", handleMapPlayComplete);
  emitter.$on("createBar", createBar);
  emitter.$on("createCourtyardDualBar", createCourtyardDualBar);
  emitter.$on("destroyBar", destroyBar);
  emitter.$on("createPoint", createPoint);
  emitter.$on("destroyPoint", destroyPoint);
  emitter.$on("createPath", createPath);
  emitter.$on("destroyPath", destroyPath);
  emitter.$on("createHeatmap", createHeatmap);
  emitter.$on("destroyHeatmap", destroyHeatmap);
  emitter.$on("createCourtyardLabel", createCourtyardLabel);
  emitter.$on("destroyCourtyardLabel", destroyCourtyardLabel);
});
onBeforeUnmount(() => {
  canvasMap.value && canvasMap.value.destroy();
  emitter.$off("loadMap", loadMap);
  emitter.$off("loadMap", loadMap);
  emitter.$off("createBar", createBar);
  emitter.$off("createCourtyardDualBar", createCourtyardDualBar);
  emitter.$off("destroyBar", destroyBar);
  emitter.$off("createPoint", createPoint);
  emitter.$off("destroyPoint", destroyPoint);
  emitter.$off("createPath", createPath);
  emitter.$off("destroyPath", destroyPath);
  emitter.$off("destroyHeatmap", destroyHeatmap);
  emitter.$off("createCourtyardLabel", createCourtyardLabel);
  emitter.$off("destroyCourtyardLabel", destroyCourtyardLabel);
});
function loadMap(assets) {
  canvasMap.value = new World(document.getElementById("canvasMap"), assets, {
    // 中心坐标
    geoProjectionCenter: [101.124344,31.814271],
    geoProjectionScale: 650,
    // 飞线中心
    flyLineCenter: flyLineCenter,
    // 地图拉伸高度
    depth: 0.15,
    // 开启debug
    debug: false,
  });
  canvasMap.value.time.pause();
}
async function play() {
  if (canvasMap.value) {
    canvasMap.value.time.resume();
    canvasMap.value.animateTl.timeScale(1); // 设置播放速度正常
    canvasMap.value.animateTl.play();
  }
}
function handleMapPlayComplete() {
  // 请求柱状图数据，
  // let data = parkData;
  // 创建柱状图
  // 创建
  // canvasMap.value.createBar(parkData);
  // canvasMap.value.createBar(centerData);
  // canvasMap.value.createPoint(baseData);
  // 创建飞线
  // canvasMap.value.createFlyLine({ centroid: flyLineCenter }, data);
  // 描边
  canvasMap.value.mapLine.lineGroup.traverse((obj) => {
    if (obj.isMesh) {
      canvasMap.value.outlineEffect &&
        canvasMap.value.outlineEffect.selection.add(obj);
    }
  });
}
// 创建柱状图（按类型）
function createBar(payload) {
  if (!canvasMap.value) return;
  const { data, type } = payload || {};
  canvasMap.value.createBar(data, type);
}

// 创建庭院双柱状图
function createCourtyardDualBar(data) {
  if (!canvasMap.value) return;
  canvasMap.value.createCourtyardDualBar(data);
}
// 销毁柱状图
function destroyBar(type) {
  if (!canvasMap.value) return;
  canvasMap.value.clearBar(type);
}
// 创建点位
function createPoint(data, type) {
  canvasMap.value && canvasMap.value.createPoint(data, type);
}
// 销毁点位
function destroyPoint(type) {
  canvasMap.value && canvasMap.value.destroyPoint(type);
}

// 创建路径
function createPath(data) {
  canvasMap.value && canvasMap.value.createPath(data);
}

// 销毁路径
function destroyPath() {
  canvasMap.value && canvasMap.value.destroyPath();
}
// 创建热力图
function createHeatmap() {
  canvasMap.value && canvasMap.value.createHeatmap();
}
// 销毁热力图
function destroyHeatmap() {
  canvasMap.value && canvasMap.value.destroyHeatmap();
}

// 创建庭院标签
function createCourtyardLabel(data) {
  canvasMap.value && canvasMap.value.createCourtyardLabel(data);
}

// 销毁庭院标签
function destroyCourtyardLabel() {
  canvasMap.value && canvasMap.value.destroyCourtyardLabel();
}
defineExpose({
  loadMap,
  play,
  canvasMap,
});
</script>

<style lang="scss">
.map {
  position: absolute;
  z-index: 1;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: #05234e;
  .info-point {
    background: rgba(0, 0, 0, 0.5);
    color: #a3dcde;
    font-size: 14px;
    width: 170px;
    height: 106px;
    padding: 16px 12px 0;
    margin-bottom: 30px;
    will-change: transform;
    &-wrap {
      &:after,
      &:before {
        display: block;
        content: "";
        position: absolute;
        top: 0;
        width: 15px;
        height: 15px;
        border-top: 1px solid #4b87a6;
      }
      &:before {
        left: 0;
        border-left: 1px solid #4b87a6;
      }
      &:after {
        right: 0;
        border-right: 1px solid #4b87a6;
      }
      &-inner {
        &:after,
        &:before {
          display: block;
          content: "";
          position: absolute;
          bottom: 0;
          width: 15px;
          height: 15px;
          border-bottom: 1px solid #4b87a6;
        }
        &:before {
          left: 0;
          border-left: 1px solid #4b87a6;
        }
        &:after {
          right: 0;
          border-right: 1px solid #4b87a6;
        }
      }
    }
    &-line {
      position: absolute;
      top: 7px;
      right: 12px;
      display: flex;
      .line {
        width: 5px;
        height: 2px;
        margin-right: 5px;
        background: #17e5c3;
      }
    }
    &-content {
      .content-item {
        display: flex;
        height: 28px;
        line-height: 28px;
        background: rgba(35, 47, 58, 0.6);
        margin-bottom: 5px;
        .label {
          width: 60px;
          padding-left: 10px;
        }
        .value {
          color: #ffffff;
        }
      }
    }
  }

  .province-label {
    will-change: transform;
    .name {
      font-size: 18px;
      color: #98c2ec;
      font-weight: bold;
      transform-origin: center;
      text-shadow: 2px 2px #064381, -2px -2px #064381, -2px 2px #064381,
        2px -2px #064381;
      will-change: transform;
    }
  }
  .bar-label {
    &-wrap {
      display: flex;
      position: relative;
      align-items: center;
      opacity: 0;
      transform: translateY(200%);
      height: 180px;
      &.cyan {
        .bar-label-number {
          background: rgba(14, 131, 204, 0.7);
        }
      }
      &.gray {
        .bar-label-number {
          background: rgba(102, 102, 102, 0.7);
          color: #cccccc;
          border-color: #999999;
        }
        .bar-label-icon img {
          filter: grayscale(100%) brightness(0.7);
        }
      }
    }
    &-icon {
      // position: absolute;
      // left: 0;
      // top: -20px;
      width: 50px;
      height: 50px;
      // margin-left: -20px;
      img {
        width: 100%;
        height: 100%;
      }
    }
    &-number {
      // position: absolute;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 40px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 28px;
      line-height: 1.2;
      border: 1px solid #fff;
      background: rgba(14, 131, 204, 0.7);
      .unit {
        font-size: 28px;
        padding-left: 5px;
        color: #fff;
      }
    }
  }

  .point-name-label {
    will-change: transform;
    
    &-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      // 园区类型
      &.park {
        width: 320px;
        height: 150px;
        background: url("~@/assets/images/icon_slices/icon48.png") no-repeat;
        background-size: 100% 100%;
      }
      
      // 中心类型
      &.center {
        width: 320px;
        height: 150px;
        background: url("~@/assets/images/icon_slices/icon45.png") no-repeat;
        background-size: 100% 100%;
      }
      
      // 基地类型
      &.base {
        width: 350px;
        height: 150px;
        background: url("~@/assets/images/icon_slices/icon44.png") no-repeat;
        background-size: 100% 100%;
      }
      
      // 庭院类型
      &.courtyard {
        width: 320px;
        height: 150px;
        background: url("~@/assets/images/icon_slices/icon46.png") no-repeat;
        background-size: 100% 100%;
      }
      
      // 千吨加工类型
      &.kiloton {
        width: 320px;
        height: 150px;
        background: url("~@/assets/images/icon_slices/icon47.png") no-repeat;
        background-size: 100% 100%;
      }
      
      // 待建状态 - 灰色样式
      &.待建 {
        filter: grayscale(100%) brightness(0.6);
        opacity: 0.7;
      }
    }
    
    &-icon {
      width: 34px;
      height: 34px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        width: 100%;
        height: 100%;
        filter: brightness(0) invert(1);
      }
    }
    
    &-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    &-text {
      color: #FFFFFF;
      font-size: 30px;
      font-weight: 500;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      margin-top: -12px;
    }
  }
  // 路径点位弹窗
  .path-point-label {
    z-index: 999 !important;
    &-icon {
      width: 75px;
      height: 90px;
      pointer-events: all;
      &-start {
        background: url("~@/assets/texture/icon-qidian.png") no-repeat;
        background-size: cover;
      }
      &-end {
        background: url("~@/assets/texture/icon-zhongdian.png") no-repeat;
        background-size: cover;
      }
    }
    &-wrap {
      position: relative;
      width: 75px;
      height: 90px;
      margin-bottom: 30px;
    }
    &-info {
      pointer-events: none;
      position: absolute;
      left: 50%;
      bottom: 90px;
      margin-left: -132px;
      width: 264px;
      height: 275px;
      box-sizing: border-box;
      padding: 0px 15px 10px;
      border-top: 5px solid #009fff;
      background: #0063a9 url("~@/assets/images/huoche.png") 200px 200px
        no-repeat;
      box-shadow: 0 2px 10px #004773;
      background-size: 20% 20%;
      transform-origin: center bottom;
      transform: scale(0);
      opacity: 0;
      transition: all 0.3s;
      &.show {
        opacity: 1;
        transform: scale(1);
      }
    }
    .name {
      font-size: 16px;
      color: #63c0ff;
      line-height: 40px;
    }
    .thumb {
      width: 234px;
      height: 80px;
      border: 4px solid #63c0ff;
      background: #63c0ff;
      img {
        width: 100%;
        height: 100%;
      }
    }
    .info {
      padding-top: 10px;
    }

    .info-item {
      display: flex;
      align-items: center;
      font-size: 12px;
      line-height: 24px;
      color: #63c0ff;
      &:before {
        content: "";
        display: inline-block;
        width: 4px;
        height: 4px;
        background: #04eef0;
        margin-right: 10px;
        box-shadow: 0 0 20px #04eef0;
      }
    }
  }

  // 庭院标签样式
  .courtyard-label {
    will-change: transform;
    
    &-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 200px;
      height: 80px;
      background: url("~@/assets/images/icon_slices/icon46.png") no-repeat;
      background-size: 100% 100%;
      padding: 8px 12px;
      box-sizing: border-box;
    }
    
    &-icon {
      width: 24px;
      height: 24px;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        width: 100%;
        height: 100%;
        filter: brightness(0) invert(1);
      }
    }
    
    &-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
    
    &-name {
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 500;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      margin-bottom: 2px;
    }
    
    &-data {
      color: #ABCCFF;
      font-size: 12px;
      font-weight: 400;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      white-space: nowrap;
    }
  }
}
</style>
