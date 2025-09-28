<script setup>
import {ref, onMounted, onBeforeUnmount, nextTick, computed} from "vue";

import mCard from "@/components/mCard/index.vue";

const cardRef = ref(null);
const height = ref(844);
const fit = ref("contain");



</script>
<template>
  <div class="right-card" ref="cardRef">
    <m-card title="品牌介绍" :height="height">
      <div class="brand-intro">
        <div class="item">
          <div class="circle"><img src="~@/assets/images/icon_slices/icon24.png"/></div>
          <div class="modules">
            <div class="module">品种优选</div>
            <div class="module">品质提升</div>
            <div class="module">品牌建设</div>
            <div class="module">标准化生产</div>
          </div>
        </div>

        <div class="item">
          <div class="circle"><img src="~@/assets/images/icon_slices/icon25.png"/></div>
          <div class="modules">
            <div class="module1">品种优选</div>
            <div class="module1">品质提升</div>
            <div class="module1">品牌建设</div>
            <div class="module1">标准化生产</div>
          </div>
        </div>

        <div class="item">
          <div class="circle"><img src="~@/assets/images/icon_slices/icon26.png"/></div>
          <div class="modules">
            <div class="module2">品种优选</div>
            <div class="module2">品质提升</div>
            <div class="module2">品牌建设</div>
            <div class="module2">标准化生产</div>
          </div>
        </div>
      </div>
    </m-card>
  </div>
</template>
<style lang="scss">
.brand-intro {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  justify-content: center;
  margin-top: 80px;
  .item{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 816px;
    height: 212px;
    .circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    }
    
    .modules {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      gap: 24px;

      .module {
        width: 192px;
        height: 64px;
        flex: 1;
        text-align: center;
        background: url("~@/assets/images/icon_slices/icon20.png") no-repeat;
        background-size: 372px 202px;
        background-position: center;
        font-weight: 700;
        font-size: 28px;
        line-height:44px;
        font-style: normal;
        text-transform: none;
        color: #FFFFFF;
      }

      .module1 {
        width: 192px;
        height: 64px;
        background: url("~@/assets/images/icon_slices/icon18.png") no-repeat;
        background-size: 372px 202px;
        background-position: center;
        font-weight: 700;
        font-size: 28px;
        line-height:44px;
        text-align: center;
        font-style: normal;
        text-transform: none;
        color: #FFFFFF;
      }

      .module2 {
        width: 192px;
        height: 64px;
        background: url("~@/assets/images/icon_slices/icon19.png") no-repeat;
        background-size: 372px 202px;
        background-position: center;
        font-weight: 700;
        font-size: 28px;
        line-height:44px;
        text-align: center;
        font-style: normal;
        text-transform: none;
        color: #FFFFFF;
      }
    }
  }
}

</style>
