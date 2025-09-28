<template>
  <div class="m-card" :style="calcWidthHeightStyle">
    <div class="m-card-hd">
      <div class="m-card-hd-title">{{ title }}</div>
      <div class="m-card-hd-dot">
        <div class="dot dot1"></div>
        <div class="dot dot2"></div>
        <div class="dot dot3"></div>
      </div>
    </div>
    <div class="m-card-bd" :style="calcWidthHeightStyle">
      <div class="m-card-bd-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script setup>
import {computed, ref, getCurrentInstance, onMounted} from "vue";

const props = defineProps({
  width: {
    type: Number,
    default: 900,
  },
  height: {
    type: Number,
    default: 200,
  },
  title: {
    type: String,
    default: "标题",
  },
});

const calcWidthHeightStyle = computed(() => {
  return `width:${props.width}px;height:${props.height}px;`;
});

</script>
<style lang="scss">
.m-card {
  position: relative;
  pointer-events: all;
  margin-bottom: 30px;
  &-hd {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 80px;
    z-index: 2;
    background: url('~@/assets/images/border_slices/card-title-bg.png') no-repeat;
    background-size: 100% 100%;
    &-title {
      position: absolute;
      left: 42px;
      color: #fff;
      font-size: 60px;
      letter-spacing: 1.6px;
      height: 84px;
      line-height: 84px;
      font-family: '优设标题黑';
      background: -webkit-linear-gradient(rgb(234 247 255), rgb(121 191 249));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &-dot {
      position: absolute;
      left: 400px;
      top: 18px;
      display: flex;

      .dot {
        width: 4px;
        height: 4px;
        background: #04EEF0;
        margin-right: 10px;
        box-shadow: 0 0 20px #04EEF0;
      }

      .dot1 {
        animation: dotAnima 1s infinite;
      }

      .dot2 {
        animation: dotAnima 1s 0.3s infinite;
      }

      .dot3 {
        animation: dotAnima 1s 0.6s infinite;
      }
    }

  }

  &-bd {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    width: 100%;
    height: calc(100% - 84px);
    background: url('~@/assets/images/border_slices/product-content-bg.png') no-repeat;
    background-size: 100% 100%;

    &-content {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      pointer-events: all;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }
}

@keyframes dotAnima {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
