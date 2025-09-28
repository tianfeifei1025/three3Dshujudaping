<script setup>
import {ref, onMounted, onBeforeUnmount, computed, nextTick, watch} from "vue";
import {useBasicInfoStore} from "@/stores/basicInfo.js";
import {Carousel, CarouselItem} from "view-ui-plus";
import emitter from "@/utils/emitter.js";

const cardRef = ref(null);
const displayData = ref([]);
const forceUpdate = ref(0); // 用于强制更新
// 使用 Pinia store
const basicInfoStore = useBasicInfoStore();
// 原始数据
const filteredData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  return data.filter(item => item.type !== "庭院" && item.status !== "待建");
}

function handleMarkerSelected(payload) {
  if (!payload?.id) return;
  const targetId = payload.id.toString();
  const targetName = payload.name;
  const candidates = basicInfoStore.getBasicInfos.filter(item => {
    const homeBaseId = item?.home_base?.[0]?.id?.toString?.();
    const homeBaseName = item?.home_base?.[0]?.name?.toString?.();
    const type = item?.type?.toString?.();
    const townshipId = item?.township?.[0]?.id?.toString?.();
    const townshipName = item?.township?.[0]?.name?.toString?.();
    const isHomeBaseMatch = homeBaseId === targetId && homeBaseName === targetName;
    const isTownshipMatch = townshipId === targetId && townshipName === targetName;
    const isTypeValid = type !== "庭院";
    return (isHomeBaseMatch || isTownshipMatch) && isTypeValid;
  });
  displayData.value = [...candidates];
  forceUpdate.value++;
}

function handleTypeSelected(payload) {
  if (!payload?.type) {
    // 当没有指定类型时，展示所有已过滤的数据
    const filterData = filteredData(basicInfoStore.getBasicInfos);
    displayData.value = filterData;
    forceUpdate.value++;
    console.log('展示所有数据:', displayData.value);
    return;
  }
  const candidates = basicInfoStore.getBasicInfos.filter(item => item.type === payload.type && item.status !== "待建");
  displayData.value = [...candidates];
  forceUpdate.value++;
  console.log('类型筛选后的 displayData:', displayData.value);
}

// 打开全屏
function openFullscreen(item) {
  const fullscreenData = {
    stream_address: `https://source.alink.link:48888/video/stream-media/player.html?url=${item.stream_address}`,
    name: item.home_base?.[0]?.name || '未知',
  };
  emitter.$emit("openFullscreen", fullscreenData);
}

watch(displayData, (newVal, oldVal) => {
}, {deep: true});

onMounted(async () => {
  emitter.$on("barSelected", handleMarkerSelected);
  emitter.$on("pointSelected", handleMarkerSelected);
  emitter.$on("typeSelected", handleTypeSelected);
  try {
    await basicInfoStore.fetchBasicInfos();
    const filterData = filteredData(basicInfoStore.getBasicInfos);
    displayData.value = filterData
  } catch (error) {
    console.error("获取基本信息失败:", error);
  }
});

// 组件卸载时可以选择是否清除缓存
onBeforeUnmount(() => {
  emitter.$off("barSelected", handleMarkerSelected);
  emitter.$off("pointSelected", handleMarkerSelected);
  emitter.$off("typeSelected", handleTypeSelected);
});
</script>

<template>
  <div class="right-card" ref="cardRef">
    <div class="intro-container">
      <div class="title">
        <div> 基本信息</div>
      </div>
      <!-- 多条数据时使用轮播 -->
      <Carousel v-if="displayData.length > 1" :key="forceUpdate" loop autoplay :autoplay-speed="20000" :height="1720"
      >
        <CarouselItem v-for="(item, index) in displayData"
                      :key="`${item.official_name}-${item.type}-${index}-${forceUpdate}`">
          <div class="base-info">
            <!-- 标题 -->
            <div class="title-section">
              <img src="@/assets/images/icon_slices/left-icon.png" alt="icon" class="icon"/>
              <span>{{ item.home_base?.[0]?.name || '未知' }}</span>
              <img src="@/assets/images/icon_slices/right-icon.png" alt="icon" class="icon"/>
            </div>
            <!-- 全景 -->
            <div class="video-section">
              <div class="section-title">
                <div class="sub-title">
                  <img src="@/assets/images/icon_slices/icon11.png" alt="icon" class="icon"/>
                  <span>全景</span>
                </div>

                <button
                    v-if="item.stream_address"
                    class="fullscreen-btn"
                    @click="openFullscreen(item)"
                    title="全屏查看"
                >
                  <img src="@/assets/images/icon_slices/icon12.png" alt="全屏" class="fullscreen-icon"/>
                </button>
              </div>
              <iframe
                  v-if="item.stream_address"
                  :src="`https://source.alink.link:48888/video/stream-media/player.html?url=${item.stream_address}`"
                  width="100%"
                  height="500"
              ></iframe>
              <p v-else style="text-align: center;">暂无全景视图</p>
            </div>
            <!-- 简介 -->
            <div class="description-section">
              <div class="sub-title">
                <img src="@/assets/images/icon_slices/icon11.png" alt="icon" class="icon"/>
                <span>简介</span>
              </div>
              <div class="bd-text"
                   v-if="item.official_name && item.location && item.area && item.mushroom_varieties">
               位于{{ item.location || '...' }}，占地面积{{ item.area || '?' }}亩，主要产{{ item.mushroom_varieties }}等。
              </div>
              <p v-else style="text-align: center;">暂无简介信息</p>
              <div class="bd-text" v-if="item.features">
                <span>规模特色</span>
                <div>{{ item.features }}</div>
              </div>
              <div class="bd-text" v-if="item.facilities">
                <span>配套设施</span>
                <div>{{ item.facilities }}</div>
              </div>
            </div>
            <!-- 人员信息 -->
            <div class="person-section">
              <div>
                <p>县联系人</p>
                <p>{{ item.contact_name || '无' }}</p>
                <p>职务</p>
                <p>{{ item.contact_title || '无' }}</p>
                <p>电话</p>
                <p>{{ item.phone || '无' }}</p>
              </div>
              <div>
                <p>乡镇联系人</p>
                <p>{{ item.contact_name || '无' }}</p>
                <p>职务</p>
                <p>{{ item.contact_title || '无' }}</p>
                <p>电话</p>
                <p>{{ item.phone || '无' }}</p>
              </div>
              <div>
                <p>村联系人</p>
                <p>{{ item.c_contact_name || '无' }}</p>
                <p>职务</p>
                <p>{{ item.c_contact_title || '无' }}</p>
                <p>电话</p>
                <p>{{ item.c_phone || '无' }}</p>
              </div>
              <div>
                <p>基地负责人</p>
                <p>{{ item.j_contact_name || '无' }}</p>
                <p>职务</p>
                <p>{{ item.j_contact_title || '无' }}</p>
                <p>电话</p>
                <p>{{ item.j_phone || '无' }}</p>
              </div>
            </div>
          </div>
        </CarouselItem>
      </Carousel>
      <!-- 单条数据时直接显示，不使用轮播 -->
      <div v-else-if="displayData.length === 1" class="single-item">
        <div class="base-info">
          <!-- 标题 -->
          <div class="title-section">
            <img src="@/assets/images/icon_slices/left-icon.png" alt="icon" class="icon"/>
            <span>{{ displayData[0].home_base?.[0]?.name || '未知' }}</span>
            <img src="@/assets/images/icon_slices/right-icon.png" alt="icon" class="icon"/>
          </div>
          <!-- 全景 -->
          <div class="video-section">
            <div class="section-title">
              <div class="sub-title">
                <img src="@/assets/images/icon_slices/icon11.png" alt="icon" class="icon"/>
                <span>全景</span>
              </div>

              <button
                  v-if="displayData[0].stream_address"
                  class="fullscreen-btn"
                  @click="openFullscreen(displayData[0])"
                  title="全屏查看"
              >
                <img src="@/assets/images/icon_slices/icon12.png" alt="全屏" class="fullscreen-icon"/>
              </button>
            </div>
            <iframe
                v-if="displayData[0].stream_address"
                :src="`https://source.alink.link:48888/video/stream-media/player.html?url=${displayData[0].stream_address}`"
                width="100%"
                height="500"
            ></iframe>
            <p v-else style="text-align: center;">暂无全景视图</p>
          </div>
          <!-- 简介 -->
          <div class="description-section">
            <div class="sub-title">
              <img src="@/assets/images/icon_slices/icon11.png" alt="icon" class="icon"/>
              <span>简介</span>
            </div>
            <div class="bd-text"
                 v-if="displayData[0].location && displayData[0].area && displayData[0].mushroom_varieties">
              位于{{ displayData[0].location || '...' }}，占地面积{{ displayData[0].area || '?' }}亩，主要产{{ displayData[0].mushroom_varieties }}等。
            </div>
            <p v-else style="text-align: center;">暂无简介信息</p>
            <div class="bd-text" v-if="displayData[0].features">
              <span>规模特色</span>
              <div>{{ displayData[0].features }}</div>
            </div>
            <div class="bd-text" v-if="displayData[0].facilities">
              <span>配套设施</span>
              <div>{{ displayData[0].facilities }}</div>
            </div>
          </div>
          <!-- 人员信息 -->
          <div class="person-section">
            <div>
              <p>县联系人</p>
              <p>{{ displayData[0].contact_name || '无' }}</p>
              <p>职务</p>
              <p>{{ displayData[0].contact_title || '无' }}</p>
              <p>电话</p>
              <p>{{ displayData[0].phone || '无' }}</p>
            </div>
            <div>
              <p>乡镇联系人</p>
              <p>{{ displayData[0].contact_name || '无' }}</p>
              <p>职务</p>
              <p>{{ displayData[0].contact_title || '无' }}</p>
              <p>电话</p>
              <p>{{ displayData[0].phone || '无' }}</p>
            </div>
            <div>
              <p>村联系人</p>
              <p>{{ displayData[0].c_contact_name || '无' }}</p>
              <p>职务</p>
              <p>{{ displayData[0].c_contact_title || '无' }}</p>
              <p>电话</p>
              <p>{{ displayData[0].c_phone || '无' }}</p>
            </div>
            <div>
              <p>基地负责人</p>
              <p>{{ displayData[0].j_contact_name || '无' }}</p>
              <p>职务</p>
              <p>{{ displayData[0].j_contact_title || '无' }}</p>
              <p>电话</p>
              <p>{{ displayData[0].j_phone || '无' }}</p>
            </div>

          </div>
        </div>
      </div>

      <!-- 空数据状态 -->
      <div v-else class="empty-tip">
        暂无数据
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.intro-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: url('~@/assets/images/border_slices/border1.png') no-repeat;
  background-size: 100% 100%;
  width: 100%;
  height: 1815px;
  pointer-events: all;


  .empty-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100% - 100px);
    color: #7ca0c7;
    font-style: italic;
  }

  .title {
    background: url('~@/assets/images/border_slices/card-title-bg.png') no-repeat;
    background-size: 100% 100%;
    height: 80px;
    div {
      margin-left: 40px;
      color: #fff;
      font-size: 60px;
      letter-spacing: 1.6px;
      font-family: '优设标题黑', sans-serif;
      background: -webkit-linear-gradient(rgb(234, 247, 255), rgb(121, 191, 249));
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  // 基础信息区域
  .base-info {
    padding: 16px;
    color: #ABCCFF;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 1700px;

    .title-section {
      height: 103px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      background: url('~@/assets/images/icon_slices/icon29.png') no-repeat center;
      background-size: contain;
      font-weight: 700;
      font-size: 32px;
      color: #FFFFFF;
      .icon {
        width: 80px;
        height: 80px;
        margin: 0 30px;
      }

      span {
        font-size: 45px;
        font-weight: 600;
        color: #FFE32B;
        text-align: center;
      }
    }
    .video-section {
      height: 600px;
      margin-bottom: 20px;

      .section-title {
        display: flex;
        flex-wrap: nowrap;
        font-size: 28px;
        color: #FFFFFF;
        height: 80px;
        line-height: 80px;
        justify-content: space-between;
        align-items: center;

        .sub-title {
          display: flex;
          align-items: center;
          font-size: 28px;
          color: #FFFFFF;
          height: 80px;
          line-height: 80px;

          .icon {
            width: 80px;
            height: 80px;
          }
        }

        .fullscreen-btn {
          background: rgba(64, 175, 253, 0.2);
          border: 2px solid #40AFFD;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;

          &:hover {
            background: rgba(64, 175, 253, 0.4);
            border-color: #40AFFD;
            transform: scale(1.05);
          }

          .fullscreen-icon {
            width: 24px;
            height: 24px;
          }
        }
      }

      &iframe {
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      p:empty {
        color: #7ca0c7;
        font-style: italic;
      }
    }
    .description-section {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
      gap: 12px;
      height: 600px;
      overflow-y: auto;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 227, 43, 0.6) rgba(171, 204, 255, 0.2);
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(171, 204, 255, 0.1);
        border-radius: 4px;
        margin: 4px 0;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 227, 43, 0.6);
        border-radius: 4px;
        border: 1px solid rgba(255, 227, 43, 0.3);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 227, 43, 0.8);
          border-color: rgba(255, 227, 43, 0.5);
        }

        &:active {
          background: rgba(255, 227, 43, 0.8);
        }
      }

      &::-webkit-scrollbar-corner {
        background: transparent;
      }
      .sub-title {
        display: flex;
        align-items: center;
        font-size: 28px;
        color: #FFFFFF;
        height: 80px;
        line-height: 80px;

        .icon {
          width: 80px;
          height: 80px;
        }
      }
      .bd-text {
        font-weight: 400;
        font-size: 28px;
        color: #CEE5FF;
        margin-bottom: 20px;
        padding: 0 20px;
        span {
          font-weight: 700;
          font-size: 28px;
          color: #FFE32B;
        }

        div {
          margin-top: 4px;
          color: #ABCCFF;
        }
      }
    }
    .person-section {
      display: flex;
      flex-wrap: nowrap;
      gap: 32px;
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 227, 43, 0.6) rgba(171, 204, 255, 0.2);
      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(171, 204, 255, 0.1);
        border-radius: 4px;
        margin: 0 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 227, 43, 0.6);
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 227, 43, 0.8);
        }

        &:active {
          background: linear-gradient(90deg, rgba(64, 175, 253, 1) 0%, rgba(64, 175, 253, 0.8) 100%);
        }
      }

      &::-webkit-scrollbar-corner {
        background: transparent;
      }

      > div {
        flex: 1;
        min-width: 200px;
        padding: 12px;
        border-radius: 6px;
        font-size: 24px;
        line-height: 1.8;
        background: url('~@/assets/images/border_slices/border2.png') no-repeat;
        background-size: 100% 100%;

        p:nth-child(odd) {
          font-weight: 700;
          color: #FFE32B;
        }

        p:nth-child(even) {
          font-weight: 700;

          color: #FFFFFF;
        }
      }
    }

    :deep(.ivu-carousel) {
      height: 1600px !important;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
    }

    :deep(.ivu-carousel-item) {
      height: 1600px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }

    :deep(.ivu-carousel-dots) {
      bottom: 10px;

      button {
        width: 16px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.4);
      }

      button.ivu-carousel-dot-active {
        background: #40AFFD;
      }
    }

  }
}
</style>
