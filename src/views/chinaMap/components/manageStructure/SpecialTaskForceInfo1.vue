<script setup>
import {ref, onMounted, onBeforeUnmount} from "vue";
import {Carousel, CarouselItem, Table} from "view-ui-plus";
import {specialClasses} from "@/api/api.js";

const cardRef = ref(null);
const specialClassList = ref([])
const columns = ref([
  {
    title: '姓名',
    key: 'name'
  },
  {
    title: '职务',
    key: 'position'
  },
  {
    title: '职责',
    key: 'responsibilities'
  }
]);

onMounted(async () => {
  specialClasses().then((res) => {
    specialClassList.value = res;
  }).catch((error) => {
    console.error("获取专班信息失败:", error);
  })
});

onBeforeUnmount(() => {

});
</script>

<template>
  <div class="right-card" ref="cardRef">
    <div class="intro-container">
      <div class="title">
        <div> 架构模式</div>
      </div>
      <!-- 数据展示 -->
      <Carousel v-if="specialClassList.length>0" :height="1700" loop autoplay :autoplay-speed="20000"
                class="carousel-container">
        <CarouselItem v-for="(item, index) in specialClassList" :key="index"
                      class="carousel-item">
          <div class="part-one">
            <div class="title-panel">
              <img src="@/assets/images/icon_slices/left-icon.png" alt="icon" class="icon"/>
              <span>{{ item.name }}</span>
              <img src="@/assets/images/icon_slices/right-icon.png" alt="icon" class="icon"/>
            </div>
            <div class="info-panel">
              <div class="info-item"><span class="name">专班类型：</span><span>{{ item.type }}</span></div>
              <div class="info-item"><span class="name">成立时间：</span><span>{{ item.time }}</span></div>
              <div class="info-item"><span class="name">管辖范围：</span><span>{{ item.range }}</span></div>
              <div class="info-item"><span class="name">工作职责：</span><span>{{ item.worker }}</span></div>
            </div>
          </div>
          <div class="part-two" style="margin-top: 20px">
            <div class="title-panel">
              <img src="@/assets/images/icon_slices/icon11.png" alt="icon" class="icon"/>
              <span class="title">组成人员</span>
            </div>
            <div class="table-panel">
              <Table :columns="columns" :data="item.persons" :height="680" v-if="item.persons.length>0"></Table>
              <div v-else class="empty-container">
                <p>暂无数据</p>
              </div>
            </div>
          </div>
        </CarouselItem>
      </Carousel>
      <!-- 空数据状态 -->
      <div v-else class="empty-container">
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.intro-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: url('~@/assets/images/border_slices/border1.png') no-repeat;
  background-size: 100% 100%;
  width: 100%;
  height: 1800px;
  pointer-events: all;
  // 空数据状态
  .empty-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100% - 100px);
    p {
      color: #7ca0c7;
      font-style: italic;
    }
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
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .carousel-container {
    height: 1700px;

    .carousel-item {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 20px;
      overflow: hidden;

      .part-one, .part-two {
        flex: 1;
      }

      .part-one {
        .title-panel {
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
          line-height: 40px;

          .icon {
            width: 80px;
            height: 80px;
            margin: 0 10px;
          }

          span {
            font-size: 28px;
            font-weight: 600;
            color: #ffffff;
            text-align: center;
          }
        }

        .info-panel {
          overflow: hidden;
          color: #fff;
          font-size: 28px;
          line-height: 36px;
        }

        .name {
          font-weight: 500;
          font-size: 28px;
          color: #FFE32B;
        }
      }

      .part-two {
        .title-panel {
          display: flex;
          flex-wrap: nowrap;
          font-size: 28px;
          color: #FFFFFF;
          height: 80px;
          line-height: 80px;

          .icon {
            width: 80px;
            height: 80px;
          }
        }

        .table-panel {
          height: 700px;
        }
      }
    }
  }

  :deep(.ivu-table) {
    background: transparent !important;
    color: #ffffff;
  }

  :deep(.ivu-table th) {
    background: rgba(77, 136, 225, 0.4) !important;
    font-weight: 500;
    font-size: 28px;
    color: #CEE5FF;
    line-height: 40px;
    text-align: center;
    border-bottom: 1px solid #4d88e1;
  }

  :deep(.ivu-table td) {
    background: transparent !important;
    font-weight: 400;
    font-size: 28px;
    color: #FFFFFF;
    line-height: 40px;
    text-align: center;
    border-bottom: 1px solid #1d4777;
  }

  :deep(.ivu-table tbody tr:hover td) {
    background: rgb(175, 230, 248, 0.39) !important; /* 可选：用半透明高亮 */
  }

  // 自定义滚动条样式
  :deep(.ivu-table-body) {
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(29, 71, 119, 0.3);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #4d88e1 0%, #2a5ba8 100%);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      &:hover {
        background: linear-gradient(180deg, #5a9ae8 0%, #3a6bb8 100%);
      }
      
      &:active {
        background: linear-gradient(180deg, #3d7bc8 0%, #1e4a88 100%);
      }
    }

    &::-webkit-scrollbar-corner {
      background: rgba(29, 71, 119, 0.3);
    }
  }

  // 表格容器滚动条样式
  .table-panel {
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(29, 71, 119, 0.3);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #4d88e1 0%, #2a5ba8 100%);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      &:hover {
        background: linear-gradient(180deg, #5a9ae8 0%, #3a6bb8 100%);
      }
      
      &:active {
        background: linear-gradient(180deg, #3d7bc8 0%, #1e4a88 100%);
      }
    }

    &::-webkit-scrollbar-corner {
      background: rgba(29, 71, 119, 0.3);
    }
  }
}

</style>
