<template>
  <div class="right-card" ref="cardRef">
    <m-card title="销售全流程介绍" :height="height">
      <div class="sales-intro">
        <div class="step">
          <div class="step-left">
            <div class="name">冷链仓储</div>
            <div class="arrow"><img src="~@/assets/images/icon_slices/icon15.png"/></div>
          </div>
          <div class="step-right">
            <div class="dots">...</div>
            <div class="info">立即入库恒温保存</div>
            <div class="state">即时</div>
          </div>
        </div>
        <div class="step">
          <div class="step-left">
            <div class="name">包装加工</div>
            <div class="arrow"><img src="~@/assets/images/icon_slices/icon15.png"/></div>
          </div>
          <div class="step-right">
            <div class="dots">...</div>
            <div class="info">按渠道需求定制包装</div>
            <div class="state">1小时</div>
          </div>
        </div>
        <div class="step">
          <div class="step-left">
            <div class="name">品质监测</div>
            <div class="arrow"><img src="~@/assets/images/icon_slices/icon15.png"/></div>
          </div>
          <div class="step-right">
            <div class="dots">...</div>
            <div class="info">第三方检测农残水分出具报告</div>
            <div class="state">1小时</div>
          </div>
        </div>
        <div class="step">
          <div class="step-left">
            <div class="name">产地分拣</div>
            <div class="arrow"><img src="~@/assets/images/icon_slices/icon15.png"/></div>
          </div>
          <div class="step-right">
            <div class="dots">...</div>
            <div class="info">采摘后2小时内分级分拣特一/特二级</div>
            <div class="state">1-2小时</div>
          </div>
        </div>
      </div>
    </m-card>
  </div>
</template>
<script setup>
import {ref, onMounted, onBeforeUnmount, nextTick} from "vue";
import * as echarts from "echarts";
import mCard from "@/components/mCard/index.vue";
import VChart from "vue-echarts";
import {Image} from "view-ui-plus";

const cardRef = ref(null);
const height = ref(844);


</script>
<style lang="scss">
.sales-intro {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
  justify-content: center;
  margin-top: 100px;

  .step {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    max-width: 800px;

    .step-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      min-width: 140px;

      .name {
        font-weight: 700;
        font-size: 28px;
        color: #FFFFFF;
        line-height: 28px;
        text-align: center;
        font-style: normal;
        text-transform: none;
        white-space: nowrap;
      }

      .arrow {
        font-weight: 400;
        font-size: 20px;
        color: #FFFFFF;
        line-height: 24px;
        text-align: center;
        font-style: normal;
        text-transform: none;
      }
    }

    .step-right {
      display: flex;
      flex-direction: row;
      flex: 1;

      .dots {
        font-size: 52px;
        color: #FFFFFF;
      }

      .info {
        flex: 1;
        width: 372px;
        height: 180px;
        font-weight: 400;
        font-size: 28px;
        color: #FFFFFF;
        text-align: center;
        font-style: normal;
        text-transform: none;
        background: url("~@/assets/images/icon_slices/icon12.png") no-repeat;
        background-size: 372px 202px;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow: hidden;
        border-radius: 8px;
      }
      .state {
        width: 284px;
        height: 180px;
        font-weight: 400;
        font-size: 28px;
        color: #FFFFFF;
        text-align: center;
        font-style: normal;
        text-transform: none;
        background: url("~@/assets/images/icon_slices/icon13.png") no-repeat;
        background-size: 284px 202px;
        background-position: center;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow: hidden;
        border-radius: 8px;
      }
    }
  }
}
</style>
