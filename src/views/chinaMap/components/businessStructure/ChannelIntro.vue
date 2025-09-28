<script setup>
import {ref, onMounted, onBeforeUnmount, nextTick} from "vue";
import * as echarts from "echarts";
import mCard from "@/components/mCard/index.vue";
import VChart from "vue-echarts";
import {Image} from "view-ui-plus";
import {supplyChainList} from "@/api/api.js";

const cardRef = ref(null);
const height = ref(1144);
const fit = ref("fill");
const supplyChains = ref([]);
onMounted(() => {
  supplyChainList().then(res => {
    supplyChains.value = res[0];
  });
});
</script>
<template>
  <div class="left-card" ref="cardRef">
    <m-card title="拓展渠道介绍" :height="height">
      <div class="channel-intro">
        <div class="item1">
          <div class="info"><span>销售渠道：</span><span>{{ supplyChains.channel_type || "-"}}</span></div>
          <div class="info"><span>渠道介绍：</span><span>{{ supplyChains.channel_intro || "-"}}</span></div>
        </div>
        <div class="item2">
          <span>线上电商平台</span>
          <span>社区团购平台</span>
        </div>
        <div class="item3">
          <div>
            <span class="left">天猫、京东、“净土阿里旗舰店”</span>
            <span class="title">平台入住</span>
            <span class="right">美团优选、多多买菜</span>
          </div>
          <div>
            <span class="left">产地直供、顺丰包邮</span>
            <span class="title">合作模式</span>
            <span class="right">家庭装菌菇套餐</span>
          </div>
          <div>
            <span class="left">全国300+城市</span>
            <span class="title">覆盖范围</span>
            <span class="right">平台量级区域</span>
          </div>
          <div>
            <span class="left">频直保障、物流快、覆盖广</span>
            <span class="title">优势亮点</span>
            <span class="right">次日达、便捷实惠、贴近消费</span>
          </div>
        </div>
      </div>
    </m-card>
  </div>
</template>
<style lang="scss">
.channel-intro {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  justify-content: center;

  .item1 {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    padding: 12px;

    .info {
      text-align: left;

      span:first-child {
        font-weight: 500;
        font-size: 28px;
        color: #FFE32B;
        line-height: 32px;
        text-align: center;
        font-style: normal;
        text-transform: none;
      }

      span:last-child {
        font-weight: 400;
        font-size: 28px;
        color: #CEE5FF;
        line-height: 32px;
        text-align: center;
        font-style: normal;
        text-transform: none;
        margin-bottom: 8px;
      }
    }
  }

  .item2 {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    margin: 16px 0;
    width: 100%;
    align-items: center;

    span {
      font-weight: 500;
      font-size: 32px;
      color: #FFFFFF;
      line-height: 44px;
      text-align: center;
      font-style: normal;
      text-transform: none;
      background: url("~@/assets/images/icon_slices/icon16.png") no-repeat;
      background-size: 404px 80px;
      background-position: center;
      background-repeat: no-repeat;
      padding: 12px 24px;
      width: 404px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .item3 {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%; // 占满宽度
    align-items: center; // 内容居中

    div {
      display: flex;
      flex-direction: row;
      align-items: center; // 垂直居中对齐
      background: url("~@/assets/images/icon_slices/icon17.png") no-repeat;
      background-size: 816px 208px; // 设置背景图大小
      background-position: center; // 背景图居中
      padding: 20px; // 添加内边距
      border-radius: 8px; // 添加圆角
      min-height: 80px; // 设置最小高度
      width: 816px; // 设置固定宽度
      justify-content: center; // 水平居中

      .title {
        width: 112px;
        height: 32px;
        font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
        font-weight: 500;
        font-size: 28px;
        color: #FFFFFF;
        line-height: 32px;
        text-align: center; // 改为居中对齐
        font-style: normal;
        text-transform: none;
        margin: 0 16px; // 添加左右间距
      }

      .left {
        width: 280px;
        height: 68px;
        font-weight: 700;
        font-size: 28px;
        color: #FFFFFF;
        line-height: 34px;
        text-align: center;
        font-style: normal;
        text-transform: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .right {
        width: 280px;
        height: 68px;
        font-family: Alimama ShuHeiTi, Alimama ShuHeiTi;
        font-weight: 700;
        font-size: 28px;
        color: #FFFFFF;
        line-height: 34px;
        text-align: center;
        font-style: normal;
        text-transform: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}


</style>
