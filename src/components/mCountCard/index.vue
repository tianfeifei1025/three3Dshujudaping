<template>
  <div class="count-card">
    <div class="count-card-left">
      <div class="count-card-icon" :class="'icon-' + info.icon"></div>
    </div>
    <div class="count-card-right">
      <div class="title-zh">{{ info.zh }}</div>
      <div class="value">
        <mCountTo
            :startVal="0"
            :endVal="info.value"
            :decimals="info.decimals"
            :duration="2000"
            separator=""
            :autoplay="true"
        ></mCountTo>{{ info.unit }}
      </div>
    </div>
  </div>
</template>
<script setup>
import mCountTo from "@/components/mCountTo/index.js"
defineProps({
  info: {
    type: Object,
    default: () => {
      return {
        icon: "xiaoshoujine",
        zh: "2023年销售金额",
        en: "Sales amount in 2023",
        value: 9500,
        unit: "万元",
        decimals: 0,
      }
    },
  },
})
function toUpper(text) {
  return text.toUpperCase()
}
</script>
<style lang="scss">
.count-card {
  display: flex;
  align-items: center;
  &-left {
    display: flex;
    align-items: center;
  }
  &-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: 20px;
    .title-zh {
      font-weight: bold;
      font-size: 28px;
      color: #ffffff;
      white-space: nowrap;
      opacity: 0.6;
    }
    .value {
      font-family: D-DIN;
      font-weight: bold;
      font-size: 28px;
      color: #ffffff;
      letter-spacing: 1px;
      margin-right: 10px;
      text-shadow: 0px 0px 18px rgba(255, 255, 255, 0.7);
      white-space: nowrap;
    }
    .unit {
      font-weight: 500;
      font-size:25px;
      color: #ffffff;
      padding-top: 15px;
      opacity: 0.5;
      white-space: nowrap;
    }
  }
  &-icon {
    width: 88px;
    height: 88px;
    margin-right: 10px;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 100%;
    // 2023销售金额
    &.icon-xiaoshoujine {
      background-image: url("~@/assets/images/icon1.png");
    }
    // 2023总销量
    &.icon-zongxiaoliang {
      background-image: url("~@/assets/images/icon2.png");
    }
  }
}
</style>
