<script setup>
import {ref, onMounted, onBeforeUnmount, reactive, computed} from "vue";
import mCard from "@/components/mCard/index.vue";
import emitter from "@/utils/emitter.js";
import {commonFetchYs} from "@/api/api.js";

// 常量定义
const CONSTANTS = {
  SHOW_ITEMS_COUNT: 4,
  CHART_HEIGHT:568,
  ANIMATION_INTERVAL: 20000,
  YEAR_RANGE: 1// 显示当前年份前后2年
};

const cardRef = ref(null);
const height = ref(CONSTANTS.CHART_HEIGHT);
let intervalId = null;
const isManualSwitch = ref(false); // 标记是否进行了手动切换

// 投资类型配置
const investmentTypes = [
  {
    name: "总投资",
    key: "total_investment",
    rank: 1,
    color: "#FFD700", // 金色
    gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
  },
  {
    name: "企业投资", 
    key: "enterprise_investment",
    rank: 2,
    color: "#4169E1", // 蓝色
    gradient: "linear-gradient(135deg, #4169E1 0%, #87CEEB 100%)"
  },
  {
    name: "政府投入",
    key: "linkage_funds", 
    rank: 3,
    color: "#FF8C00", // 橙色
    gradient: "linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)"
  },
  {
    name: "农户自筹",
    key: "farmer_self_raised",
    rank: 4, 
    color: "#708090", // 灰色
    gradient: "linear-gradient(135deg, #708090 0%, #A9A9A9 100%)"
  }
];
const values = reactive([]);
const percentages = reactive([]);

// 年份相关状态
const currentYear = ref(new Date().getFullYear());
const allYearData = reactive({});

// 动态生成年份列表
const availableYears = computed(() => {
  const current = new Date().getFullYear();
  const years = [];
  
  // 添加过去年份
  for (let i = CONSTANTS.YEAR_RANGE; i > 0; i--) {
    years.push(current - i);
  }
  
  // 添加当前年份
  years.push(current);
  
  // 添加未来年份
  for (let i = 1; i <= CONSTANTS.YEAR_RANGE; i++) {
    years.push(current + i);
  }
  
  return years;
});

// 判断是否为未来年份
const isFutureYear = (year) => {
  return year > new Date().getFullYear();
};

// 统一的数值验证函数
const isValidValue = (value) => {
  return !isNaN(value) && value !== null && value !== undefined && value > 0;
};

// 获取安全的数值
const getSafeValue = (value, defaultValue = 0) => {
  return isValidValue(value) ? value : defaultValue;
};

// 格式化数值显示
const formatValue = (value) => {
  return getSafeValue(value).toFixed(0);
};

// 计算百分比
const calculateItemPercentage = (item, totalValues) => {
  if (!isValidValue(item)) return '0.0';
  const total = totalValues.reduce((sum, val) => sum + getSafeValue(val), 0);
  return total > 0 ? ((item / total) * 100).toFixed(1) : '0.0';
};

// 计算进度条宽度
const calculateProgressWidth = (item, maxValue) => {
  if (!isValidValue(item)) return 0;
  return maxValue > 0 ? (item / maxValue) * 100 : 0;
};

// 计算最大值的函数
const calculateMaxValue = () => {
  if (values.length === 0) return 0;
  const validValues = values.filter(isValidValue);
  return validValues.length > 0 ? Math.max(...validValues) : 0;
};

// 计算百分比
const calculatePercentages = (data) => {
  const validData = data.filter(isValidValue);
  const total = validData.reduce((sum, val) => sum + val, 0);
  return data.map(val => {
    if (!isValidValue(val)) return 0;
    return total > 0 ? ((val / total) * 100).toFixed(1) : 0;
  });
};

// 获取当前显示的数据 - 按值降序排序
const getCurrentData = computed(() => {
  // 创建包含索引和值的数组用于排序
  const dataWithIndex = values.map((value, index) => ({
    value: value || 0,
    index: index,
    type: investmentTypes[index]
  }));
  
  // 按值降序排序
  dataWithIndex.sort((a, b) => b.value - a.value);
  
  // 提取排序后的数据
  const currentValues = dataWithIndex.map(item => item.value);
  const currentNames = dataWithIndex.map(item => item.type.name);
  const currentRanks = dataWithIndex.map((item, newIndex) => newIndex + 1); // 重新分配排名
  const currentColors = dataWithIndex.map(item => item.type.color);
  const currentGradients = dataWithIndex.map(item => item.type.gradient);
  
  return {
    values: currentValues,
    names: currentNames,
    ranks: currentRanks,
    colors: currentColors,
    gradients: currentGradients
  };
});

// 计算进度条相关数据的计算属性
const progressData = computed(() => {
  const maxValue = calculateMaxValue();
  return getCurrentData.value.values.map((item, idx) => ({
    width: calculateProgressWidth(item, maxValue),
    background: isValidValue(item) ? getCurrentData.value.gradients[idx] : 'transparent',
    displayValue: formatValue(item),
    percentage: calculateItemPercentage(item, getCurrentData.value.values)
  }));
});

async function handleMarkerSelected(payload) {
  const {id, name} = payload;
  const year = currentYear.value;
  const base = JSON.stringify([{"id": id, "unitType": 1, "name": name}]);
  const data = await fetchData(year, null, base);
  updateValues(data);
}

async function handleTypeSelected(payload) {
  let type = payload.type;
  const year = currentYear.value;
  const data = await fetchData(year, type, null);
  updateValues(data);
}

const getValues = (data) => {
  const totalInvestment = data.reduce((sum, item) => sum + (parseFloat(item.total_investment) || 0), 0);
  const enterpriseInvestment = data.reduce((sum, item) => sum + (parseFloat(item.enterprise_investment) || 0), 0);
  const linkageFunds = data.reduce((sum, item) => sum + (parseFloat(item.linkage_funds) || 0), 0);
  const farmerSelfRaised = data.reduce((sum, item) => sum + (parseFloat(item.farmer_self_raised) || 0), 0);
  return [totalInvestment, enterpriseInvestment, linkageFunds, farmerSelfRaised];
}

// 获取指定年份的数据
const fetchData = async (year, type = null, base = null) => {
  try {
    const queryFilters = [
      {
        "queryFilterType": "Between",
        "propertyCode": "year",
        "propertyType": 3,
        "propertyValue": `${year};${year}`
      }
    ];

    // 如果指定了base，添加基地过滤条件
    if (base) {
      queryFilters.push({
        "queryFilterType": "Eq",
        "propertyCode": "home_base",
        "propertyType": 60,
        "propertyValue": base
      });
    }

    // 如果指定了type，添加类型过滤条件
    if (type) {
      queryFilters.push({
        "queryFilterType": "Eq",
        "propertyCode": "type",
        "propertyType": 14,
        "propertyValue": type
      });
    }

    const res = await commonFetchYs("benefit_analysis", "benefit_analysis", 1000, [[queryFilters]]);
    if (res.code === 0 && res.data.length > 0) {
      const result = getValues(res.data);
      const baseKey = base ? JSON.parse(base)[0]?.id || 'default' : 'all';
      const cacheKey = `${year}_${type || 'all'}_${baseKey}`;
      allYearData[cacheKey] = result;
      return result;
    }
    return [0, 0, 0, 0];
  } catch (error) {
    console.error(`获取${year}年${type || '全部'}类型数据失败:`, error);
    return [0, 0, 0, 0];
  }
}

// 更新values数据的辅助函数
const updateValues = (newData) => {
  values.splice(0, values.length, ...newData);
  // 计算百分比
  const newPercentages = calculatePercentages(newData);
  percentages.splice(0, percentages.length, ...newPercentages);
};

// 重新启动自动切换
const restartAutoSwitch = () => {
  isManualSwitch.value = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  
  intervalId = setInterval(() => {
    const currentYearIndex = availableYears.value.indexOf(currentYear.value);
    let nextYearIndex = (currentYearIndex + 1) % availableYears.value.length;
    
    handleYearChange(availableYears.value[nextYearIndex]);
  }, CONSTANTS.ANIMATION_INTERVAL);
};

// 年份切换处理
const handleYearChange = async (year, isManual = false) => {
  // 如果是手动切换，设置标记并清除定时器
  if (isManual) {
    isManualSwitch.value = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
  
  currentYear.value = year;
  const cacheKey = `${year}_all`;
  if (allYearData[cacheKey]) {
    updateValues(allYearData[cacheKey]);
  } else {
    // 否则获取新数据
    const yearData = await fetchData(year, null, null);
    updateValues(yearData);
  }
}

onMounted(async () => {
  emitter.$on("barSelected", handleMarkerSelected);
  emitter.$on("pointSelected", handleMarkerSelected);
  emitter.$on("typeSelected", handleTypeSelected);

  // 初始化当前年份数据
  await handleYearChange(currentYear.value);

  // 启动定时器并保存ID - 年份按钮循环切换
  restartAutoSwitch();
});

onBeforeUnmount(() => {
  emitter.$off("barSelected", handleMarkerSelected);
  emitter.$off("pointSelected", handleMarkerSelected);
  emitter.$off("typeSelected", handleTypeSelected);
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});
</script>
<template>
  <div class="left-card" ref="cardRef">
    <m-card title="产业投入" :height="height">
      <div class="input-container">
        <!-- 年份按钮组 -->
        <div class="year-buttons">
          <button
              v-for="year in availableYears"
              :key="year"
              :class="[
                'year-btn', 
                { 
                  active: currentYear === year,
                  'future-year': isFutureYear(year),
                  'future-active': currentYear === year && isFutureYear(year)
                }
              ]"
              @click="handleYearChange(year, true)"
          >
            {{ year }}年
          </button>
        </div>
        
        <!-- 投资数据展示区域 -->
        <div class="investment-list">
          <div 
            v-for="(item, idx) in getCurrentData.values" 
            :key="idx"
            class="investment-item"
          >
            <!-- 排名标签 -->
            <div 
              class="rank-badge"
              :style="{ background: getCurrentData.gradients[idx] }"
            >
              NO.{{ getCurrentData.ranks[idx] }}
            </div>
            
            <!-- 内容区域 -->
            <div class="content-area">
              <!-- 标题和数值 -->
              <div class="title-value">
                <span class="title">{{ getCurrentData.names[idx] }}</span>
                <span class="value">{{ progressData[idx].displayValue }}万元</span>
              </div>
              
              <!-- 百分比 -->
              <div class="percentage">
                ({{ progressData[idx].percentage }}%)
              </div>
            </div>
            
            <!-- 进度条 -->
            <div class="progress-container">
              <div 
                class="progress-bar"
                :style="{ 
                  width: `${progressData[idx].width}%`,
                  background: progressData[idx].background
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </m-card>
  </div>
</template>
<style lang="scss" scoped>
.left-card {
  .input-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
  }

  .year-buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 90px;
    margin-bottom: 20px;
    padding: 0 20px;
    z-index: 20;
  }

  .year-btn {
    padding: 8px 20px;
    border: 1px solid #407A80;
    background: rgba(64, 122, 128, 0.1);
    color: #ABCCFF;
    font-size: 24px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    &:hover:not(.disabled) {
      background: rgba(64, 122, 128, 0.3);
      border-color: #5A9BA0;
      transform: translateY(-2px);
    }

    &.active {
      background: linear-gradient(135deg, #034180 0%, #73D0FF 100%);
      border-color: #73D0FF;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(115, 208, 255, 0.4);
      transform: translateY(-2px);
    }

    &.future-year {
      background: rgba(128, 128, 128, 0.1);
      border-color: #666666;
      color: #FFFFFF;
      opacity: 0.5;

      &:hover {
        background: rgba(128, 128, 128, 0.2);
        border-color: #777777;
        transform: translateY(-1px);
      }
    }

    &.future-active {
      background: linear-gradient(135deg, #666666 0%, #888888 100%);
      border-color: #999999;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(136, 136, 136, 0.4);
      transform: translateY(-2px);
      opacity: 0.8;
    }
  }

  .investment-list {
    flex: 1;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }

  .investment-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.2);

      &::before {
        opacity: 1;
      }
    }
  }

  .rank-badge {
    min-width: 60px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 20px;
    font-weight: bold;
    color: #FFFFFF;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 2;
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    z-index: 2;
  }

  .title-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    color: #FFFFFF;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .value {
    font-size:32px;
    font-weight: bold;
    color: #73D0FF;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .percentage {
    font-size: 25px;
    color: #ABCCFF;
    text-align: right;
    opacity: 0.8;
  }

  .progress-container {
    width: 200px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    z-index: 2;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .progress-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s ease;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
      animation: shimmer 2s infinite;
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
}
</style>
