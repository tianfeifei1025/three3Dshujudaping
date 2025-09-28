<script setup>
import mCard from "@/components/mCard/index.vue";
import {onMounted, onUnmounted, ref} from "vue";
import {harvestStandardList, managementStandardList} from "@/api/api.js";
import {Carousel, CarouselItem, Image, TabPane, Tabs} from "view-ui-plus";

const height = ref(600);
const standardList = ref([]);

onMounted(() => {
  harvestStandardList().then(res => {
    // console.log("采收标准数据:",res);
    standardList.value = Object.keys(res).map(type => ({
      name: type,
      standards: res[type] || []
    }));
  }).catch(err => {
    console.error("获取采收标准失败:", err);
  })
});

onUnmounted(() => {
});


</script>

<template>
  <div class="left-card" ref="cardRef">
    <m-card title="采收标准" :height="height">
      <div class="harvest-stand">
        <Tabs v-if="standardList.length > 0">
          <TabPane
              v-if="standardList.length > 0"
              :label="item.name"
              :name="item.name"
              v-for="(item, index) in standardList"
              :key="index"
              class="tab-pane"
          >
            <Carousel
                v-if="item.standards.length > 0"
                loop
                autoplay
                :autoplay-speed="20000"
                class="harvest-carousel"
            >
              <CarouselItem v-for="(c, cIndex) in item.standards" :key="c.id || cIndex" class="carousel-item">
                <div class="c-img">
                  <img
                      :src="c.url"
                      alt="采收标准图"
                      class="standard-img"
                  />
                </div>
                <div 
                  class="c-info"
                  :data-key="`${index}-${cIndex}`"
                  @scroll="handleUserScroll(index, cIndex)"
                >
                  <div class="info1"><span class="standard-title">产品类型:</span><span>{{ c.type || '-'  }}</span><span class="standard-title" style="margin-left: 10px;">产品等级:</span><span>{{ c.grade || '-' }}</span></div>
<!--                  <div class="info1"><span class="standard-title">产品等级:</span><span>{{ c.grade || '-' }}</span></div>-->
                  <div class="info2"><span class="standard-title">外形形状:</span><div class="standard-intro">{{ c.intro || '-' }}</div></div>
                </div>
              </CarouselItem>
            </Carousel>
            <div v-else class="empty-tip">
              暂无采收标准数据
            </div>
          </TabPane>
        </Tabs>
        <div v-else class="empty-tip">
          暂无采收标准数据
        </div>
      </div>
    </m-card>
  </div>
</template>

<style scoped>
.harvest-stand {
  margin-top: 100px;
  :deep(.ivu-tabs) {
    height: 496px;
  }

  :deep(.ivu-tabs-tab) {
    font-weight: 400;
    font-size: 28px;
    color: #B4D8FF;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(34, 122, 255, 0.102);
    border: 2px solid #507CAC;
    border-radius: 0;
  }

  :deep(.ivu-tabs-tab-active) {
    font-weight: 700;
    color: #FFFFFF !important;
    background-color: rgba(77, 136, 225, 0.4);
  }
  .empty-tip {
    height: 496px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7ca0c7;
    font-style: italic;
  }
  .tab-pane {
    width: 100%;
    height: 400px;
    .harvest-carousel {
      height: 100%;
      .carousel-item {
        width: 100%;
        height: 400px !important;
        display: flex;
        justify-content: space-around;
        align-items: center;
        .c-img {
          width: 300px;
          height: 320px;
          border-radius: 8px 8px 0px 0px;
          border: 0px solid #CEE5FF;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        .c-info {
          width: 480px;
          height: 336px;
          display: flex;
          flex-direction: column;
          font-weight: 400;
          font-size: 28px;
          color: #CEE5FF;
          overflow: hidden;
          .standard-title {
            font-weight: 500;
            color: #FFE32B;
            line-height: 55px;
            display: inline-block;
            margin-right: 8px;
          }
          .info1 {
            margin-bottom: 15px;
            line-height: 1.6;
            word-wrap: break-word;
            white-space: pre-wrap;
          }

          .info2 {
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            overflow: hidden;
            .standard-intro {
              height:200px;
              overflow-y: auto;
              overflow-x: hidden;
              scrollbar-width: thin;
              scrollbar-color: #4A90E2 #1E3A5F;
              padding: 5px;
              border-radius: 4px;
              background: rgba(30, 58, 95, 0.3);
              border: 1px solid rgba(74, 144, 226, 0.3);
            }

            .standard-intro::-webkit-scrollbar {
              width: 6px;
            }

            .standard-intro::-webkit-scrollbar-track {
              background: #1E3A5F;
              border-radius: 3px;
            }

            .standard-intro::-webkit-scrollbar-thumb {
              background: #4A90E2;
              border-radius: 3px;
            }

            .standard-intro::-webkit-scrollbar-thumb:hover {
              background: #5BA0F2;
            }
          }

        }
      }
    }
  }
}

</style>