<script setup>
import {ref, computed, onMounted, onBeforeUnmount, watch} from "vue";
import mCard from "@/components/mCard/index.vue";
import {Image} from "view-ui-plus";
import {useBasicInfoStore} from "@/stores/basicInfo.js";
import emitter from "@/utils/emitter.js";

const cardRef = ref(null);
const height = ref(568);
const iconHeight = ref(65);
const iconWidth = ref(65);

// 使用 Pinia store
const basicInfoStore = useBasicInfoStore();
// 原始数据
const rawData = computed(() => basicInfoStore.getBasicInfos);
//展示数据
const displayData = ref([]);
// 初始化 displayData
watch(rawData, (newVal) => {
  displayData.value = newVal;
}, {immediate: true});


const totalView = computed(() => {
  return getStatsData(displayData.value);
});


const getStatsData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  const filteredBasicInfos = data.filter(item => item.type === "基地");

  const totalArea = filteredBasicInfos.reduce(
      (sum, item) => sum + (parseFloat(item.area) || 0),
      0
  );

  const totalOutputValue = filteredBasicInfos.reduce((sum, item) => {
    const economic = item.economic || {};
    return sum + (parseFloat(economic.output_value) || 0);
  }, 0);

  const totalOutput = filteredBasicInfos.reduce((sum, item) => {
    const economic = item.economic || {};
    return sum + (parseFloat(economic.output) || 0);
  }, 0);

  const totalFungiBag = filteredBasicInfos.reduce((sum, item) => {
    const economic = item.economic || {};
    return sum + (parseFloat(economic.bacterial_number) || 0);
  }, 0);

  return [
    {
      field: 'totalArea',
      value: totalArea.toFixed(2),
      icon: '1',
      zh: '占地面积',
      unit: '亩'
    },
    {
      field: 'totalFungiBag',
      value: Math.round(totalFungiBag),
      icon: '3',
      zh: '配置菌包',
      unit: '万包'
    },
    {
      field: 'totalOutput',
      value: totalOutput.toFixed(2),
      icon: '4',
      zh: '对应产量',
      unit: '吨'
    },
    {
      field: 'totalOutputValue',
      value: totalOutputValue.toFixed(2),
      icon: '2',
      zh: '年产值',
      unit: '万元'
    },
    {
      field: 'employmentIncome',
      value: 300,
      icon: '65',
      zh: '就业增收',
      unit: '万元',
      isYellow: true
    },
    {
      field: 'ovComprehensive',
      value: 100,
      icon: '62',
      zh: '集体经济',
      unit: '万以上',
      isYellow: true
    },
    {
      field: 'ovComprehensive',
      value: 1.5,
      icon: '63',
      zh: '户均',
      unit: '万以上',
      isYellow: true
    },
    {
      field: 'ovComprehensive',
      value: 5000,
      icon: '64',
      zh: '综合产值',
      unit: '万以上',
      isYellow: true
    }
  ];
};

const getIconSrc = (index) => {
  return new URL(`/src/assets/images/icon_slices/icon${index}.png`, import.meta.url).href;
};


function handleMarkerSelected(payload) {
  if (!payload || !payload.id) return;

  const filtered = rawData.value.filter(item => {
    const homeBaseId = item?.home_base?.[0]?.id;
    const townshipId = item?.township?.[0]?.id;
    return homeBaseId === payload.id || townshipId === payload.id;
  });

  displayData.value = filtered;
}


function handleTypeSelected(payload) {
  if (!payload || !payload.type) return;
  const filtered = rawData.value.filter(item => item.type === payload.type);
  displayData.value = filtered;
}

// 组件挂载
onMounted(async () => {
  try {
    emitter.$on("barSelected", handleMarkerSelected);
    emitter.$on("pointSelected", handleMarkerSelected);
    emitter.$on("typeSelected", handleTypeSelected);
    await basicInfoStore.fetchBasicInfos();
  } catch (error) {
    console.error("获取基本信息数据失败:", error);
  }
});

// 组件卸载清理
onBeforeUnmount(() => {
  emitter.$off("barSelected", handleMarkerSelected);
  emitter.$off("pointSelected", handleMarkerSelected);
  emitter.$off("typeSelected", handleTypeSelected);
});


</script>
<template>
  <div class="left-card" ref="cardRef">
    <m-card title="效益评估" :height="height">
      <div class="poverty-container" v-if="totalView.length > 0">
        <!-- 动态渲染卡片 -->
        <div
            v-if="totalView.length > 0"
            v-for="(item, index) in totalView"
            :key="index"
            class="card"
        >
          <div class="icon">
            <Image
                :src="getIconSrc(item.icon)"
                :width="iconWidth"
                :height="iconHeight"
            />
          </div>

          <div class="content">
            <div class="title" :class="{ 'yellow-text': item.isYellow }">{{ item.zh }}</div>
            <div class="value" :class="{ 'yellow-text': item.isYellow }">{{ item.value }}{{ item.unit }}</div>
          </div>
        </div>

      </div>
      <p v-else style="text-align: center;" class="no-data">暂无效益评估数据</p>
    </m-card>
  </div>
</template>
<style lang="scss">
.poverty-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 20px;
  margin-top: 65px;
  padding: 0 25px;
  justify-items: center;
  align-items: center;
  .card {
    width: 100%;
    height: 102px;
    display: flex;
    flex-direction: row;
    align-items: center;
    background: url("~@/assets/images/border_slices/poverty-bg.png") no-repeat;
    background-size: 392px 102px;
    position: relative;
    overflow: hidden;

    .icon {
      width: 80px;
      height: 80px;
      flex: 0 0 auto;
      margin-right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 50%;
      border: 2px solid rgba(59, 130, 246, 0.2);
      transition: all 0.3s ease;
      margin-left: 50px;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
    }

    .title {
      font-family: 'Alibaba PuHuiTi', sans-serif;
      font-weight: 400;
      font-size: 24px;
      line-height: 1.4;
      color: #93c5fd;
      text-align: left;
      margin: 0;
    }

    .value {
      font-family: 'Alibaba PuHuiTi', sans-serif;
      font-weight: 700;
      font-size: 32px;
      color: #ffffff;
      line-height: 1.2;
      text-align: left;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

}
.no-data{
  color: #7ca0c7;
  font-style: italic;
}

.yellow-text {
  color: #FFE32B !important;
}
</style>
