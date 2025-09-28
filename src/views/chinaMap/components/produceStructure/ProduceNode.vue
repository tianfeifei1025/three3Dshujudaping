<script setup>
import {onMounted, ref, nextTick, onUnmounted, computed} from "vue";
import {produceNodeList} from "@/api/api.js";

const nodes = ref([]);
const currentNode = ref({});
const activeStep = ref(1);
const showModal = ref(false);
const modalData = ref({});

// 显示详情
const showDetail = (stepIndex) => {
  const nodeData = nodes.value.find(item => item.sort_id === stepIndex.toString());
  if (nodeData) {
    modalData.value = nodeData;
    showModal.value = true;
  }
};

// 关闭弹窗
const closeModal = () => {
  showModal.value = false;
  modalData.value = {};
};
const linkTo = (stepIndex) => {
  currentNode.value = nodes.value.find(item => item.sort_id === stepIndex.toString());
  activeStep.value = stepIndex;
};
// 启动流程动画
const startFlowAnimation = () => {
  let step = 1;
  const maxSteps = 7;

  const animateStep = () => {
    activeStep.value = step;
    step = step % maxSteps + 1;
    currentNode.value = nodes.value.find(item => item.sort_id === activeStep.value.toString());

    setTimeout(animateStep, 10000); // 每10秒切换一个步骤
  };

  animateStep();
};

onMounted(() => {
  produceNodeList().then(res => {
    nodes.value = res;
    if (res.length > 0) {
      currentNode.value = res[0];
    }
    // 启动流程动画
    startFlowAnimation();
  }).catch(error => {
    console.error('获取生产节点数据失败:', error);
  });
});

onUnmounted(() => {
  console.log('组件销毁');
});

</script>
<template>
  <div class="right-card" ref="cardRef">
    <div class="node-container">
      <div class="title">
        <div>生产节点信息</div>
      </div>
      <div class="node-stand">
        <div v-if="nodes.length > 0" class="node-content">
          <!-- 视频区域 -->
          <div class="node-video">
            <iframe
                :src="currentNode.stream_address"
                width="100%"
                height="450px"
                allowfullscreen
                allow="microphone; compute-pressure"
            ></iframe>
          </div>
          <!-- 基地信息区域 -->
          <div class="base-info-section">
            <div class="base-info-item">
              <span class="label">所属基地：</span>
              <span class="value">{{ currentNode.base_name || "-"}}</span>
            </div>
            <div class="base-info-item">
              <span class="label">监控安装位置：</span>
              <span class="value">{{ currentNode.position  || "-"}}</span>
            </div>
          </div>

          <!-- 生产流程图 -->
          <div class="production-flow custom-scrollbar" ref="productionFlowRef" v-show="!showModal">
            <div class="flow-step" :class="{ 'active': activeStep === 1 }">
              <div class="step-content" @click="linkTo(1)">
                <div class="step-text">菌袋生产</div>
                <button class="detail-btn" @click="showDetail(1)">描述</button>
              </div>
            </div>

            <div class="flow-arrow-right">
              <img src="@/assets/images/icon_slices/icon58.png" alt="连接线" class="connection-icon"/>
            </div>

            <div class="flow-step" :class="{ 'active': activeStep === 2 }">
              <div class="step-content" @click="linkTo(2)">
                <div class="step-text">高温灭菌</div>
                <button class="detail-btn" @click="showDetail(2)">描述</button>
              </div>
            </div>

            <div class="flow-arrow-right">
              <img src="@/assets/images/icon_slices/icon58.png" alt="连接线" class="connection-icon"/>
            </div>

            <div class="flow-step" :class="{ 'active': activeStep === 3 }">
              <div class="step-content" @click="linkTo(3)">
                <div class="step-text">无菌接种</div>
                <button class="detail-btn" @click="showDetail(3)">描述</button>
              </div>
            </div>
            <div class="flow-arrow-down">
              <img src="@/assets/images/icon_slices/icon59.png" alt="连接线" class="connection-icon"/>
            </div>
            <div class="flow-step" :class="{ 'active': activeStep === 4 }">
              <div class="step-content" @click="linkTo(4)">
                <div class="step-text">发菌管理</div>
                <button class="detail-btn" @click="showDetail(4)">描述</button>
              </div>
            </div>


            <div class="flow-arrow-left">
              <img src="@/assets/images/icon_slices/icon60.png" alt="连接线" class="connection-icon"/>
            </div>

            <div class="flow-step" :class="{ 'active': activeStep === 5 }">
              <div class="step-content" @click="linkTo(5)">
                <div class="step-text">养菌转色</div>
                <button class="detail-btn" @click="showDetail(5)">描述</button>
              </div>
            </div>

            <div class="flow-arrow-left">
              <img src="@/assets/images/icon_slices/icon60.png" alt="连接线" class="connection-icon"/>
            </div>



            <div class="flow-step" :class="{ 'active': activeStep === 6 }">
              <div class="step-content" @click="linkTo(6)">
                <div class="step-text">出菇管理</div>
                <button class="detail-btn" @click="showDetail(6)">描述</button>
              </div>
            </div>


            <div class="flow-arrow-down">
              <img src="@/assets/images/icon_slices/icon59.png" alt="连接线" class="connection-icon"/>
            </div>


            <div class="flow-step final-step" :class="{ 'active': activeStep === 7 }">
              <div class="step-content" @click="linkTo(7)">
                <div class="step-text">储存加工</div>
                <button class="detail-btn" @click="showDetail(7)">描述</button>
              </div>
            </div>
          </div>

          <!-- 详情弹窗 -->
          <div v-if="showModal" class="detail-modal-overlay" @click="closeModal">
            <div class="detail-modal" @click.stop>
              <div class="modal-header">
                <h3 class="modal-title">{{ modalData.node_type || '节点描述' }}</h3>
                <button class="close-btn" @click="closeModal">×</button>
              </div>
              <div class="modal-content custom-scrollbar">
                <div class="modal-desc-section">
                  <div class="desc-content">{{ modalData.node_desc || '暂无描述信息' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">
          暂无生产节点数据
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .node-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background: url('~@/assets/images/border_slices/border5.png') no-repeat;
    background-size: 100% 100%;
    width: 100%;
    height: 1152px;
    margin-bottom: 30px;
    pointer-events: all;

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

  .empty-tip {
    height: 496px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7ca0c7;
    font-style: italic;
    text-align: center;
  }

  .node-content {
    padding: 20px;
    height: calc(100% - 120px);
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .node-video {
    flex: 1;
    border: 1px solid rgba(121, 191, 249, 0.3);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  .base-info-section {
    background: linear-gradient(135deg, rgba(0, 50, 100, 0.8), rgba(0, 30, 60, 0.9));
    border: 1px solid rgba(121, 191, 249, 0.3);
    border-radius: 8px;
    padding: 10px;
    backdrop-filter: blur(10px);
  }

  .base-info-item {
    display: flex;
    margin-bottom: 10px;
    align-items: center;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .label {
    color: #7ca0c7;
    font-size: 28px;
    min-width: 200px;
    font-weight: 500;
  }

  .value {
    color: #eaf7ff;
    font-size: 28px;
    font-weight: 400;
  }

  .production-flow {
    flex: 1;
    max-height: 430px;
    min-height: 430px;
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    grid-template-rows: auto auto auto auto auto;
    gap: 2px;
    align-items: center;
    justify-items: center;
    padding: 25px;
    background: linear-gradient(135deg, rgba(0, 50, 100, 0.6), rgba(0, 30, 60, 0.8));
    border: 1px solid rgba(121, 191, 249, 0.2);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    
    /* 自定义滚动条样式 */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: rgba(121, 191, 249, 0.6) rgba(0, 30, 60, 0.3); /* Firefox */
    
    &::-webkit-scrollbar {
      width: 8px; /* 滚动条宽度 */
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 30, 60, 0.3); /* 滚动条轨道背景 */
      border-radius: 4px;
      margin: 4px 0;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(121, 191, 249, 0.6), rgba(121, 191, 249, 0.8));
      border-radius: 4px;
      border: 1px solid rgba(121, 191, 249, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, rgba(121, 191, 249, 0.8), rgba(121, 191, 249, 1));
        border-color: rgba(121, 191, 249, 0.5);
        box-shadow: 0 0 8px rgba(121, 191, 249, 0.4);
      }
      
      &:active {
        background: linear-gradient(135deg, rgba(121, 191, 249, 0.9), rgba(121, 191, 249, 1));
      }
    }
    
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
  }

  .flow-step {
    background: linear-gradient(135deg, rgba(0, 50, 100, 0.9), rgba(0, 30, 60, 0.95));
    border: 2px solid rgba(121, 191, 249, 0.3);
    border-radius: 12px;
    padding: 18px 24px;
    min-width: 200px;
    min-height: 80px;
    text-align: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;

    &.active {
      border: 3px solid #79bff9;
      background: linear-gradient(135deg, rgba(121, 191, 249, 0.3), rgba(0, 50, 100, 0.95));
      box-shadow: 
        0 0 30px rgba(121, 191, 249, 0.6),
        0 0 60px rgba(121, 191, 249, 0.3),
        inset 0 0 20px rgba(121, 191, 249, 0.1);
      transform: scale(1.08);
      animation: activePulse 2s ease-in-out infinite;
      
      &::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        background: linear-gradient(45deg, 
          rgba(121, 191, 249, 0.8), 
          rgba(121, 191, 249, 0.4), 
          rgba(121, 191, 249, 0.8));
        border-radius: 15px;
        z-index: -1;
        animation: borderGlow 3s linear infinite;
      }
      
      .step-text {
        color: #ffffff;
        text-shadow: 0 0 10px rgba(121, 191, 249, 0.8);
        font-weight: 600;
      }
      
      .detail-btn {
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        box-shadow: 
          0 0 15px rgba(255, 107, 53, 0.6),
          0 4px 12px rgba(255, 107, 53, 0.4);
        transform: scale(1.1);
      }
    }

    &.final-step {
      grid-column: 3;
      grid-row: 5;
    }
  }

  .step-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .step-text {
    color: #eaf7ff;
    font-size: 28px;
    font-weight: 500;
    line-height: 1.4;
    text-align: center;
  }

  .detail-btn {
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 20px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);

    &:hover {
      background: linear-gradient(135deg, #ff5722, #ff9800);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .flow-arrow-right {
    color: #79bff9;
    font-size: 28px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(121, 191, 249, 0.6);
    animation: arrowPulse 2s infinite;
    .connection-icon{
      width: 50px;
      height: 36px;
      object-fit: contain;
    }
  }

  .flow-arrow-down {
    width: 52px;
    height: 70px;
    color: #79bff9;
    font-size: 28px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(121, 191, 249, 0.6);
    animation: arrowPulse 2s infinite;
    grid-column: 5;
    .connection-icon{
      width: 52px;
      height: 70px;
      object-fit: contain;
    }
  }

  .flow-arrow-left {
    width: 50px;
    height: 36px;
    color: #79bff9;
    font-size: 28px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(121, 191, 249, 0.6);
    animation: arrowPulse 2s infinite;
    .connection-icon{
      width: 50px;
      height: 36px;
      object-fit: contain;
    }
  }


  /* 网格布局定位 */

  .flow-step:nth-child(1) {
    grid-column: 1;
    grid-row: 1;
  }

  .flow-step:nth-child(3) {
    grid-column: 3;
    grid-row: 1;
  }

  .flow-step:nth-child(5) {
    grid-column: 5;
    grid-row: 1;
  }

  .flow-step:nth-child(7) {
    grid-column: 5;
    grid-row: 3;
  }

  .flow-step:nth-child(9) {
    grid-column: 3;
    grid-row: 3;
  }

  .flow-step:nth-child(11) {
    grid-column: 1;
    grid-row: 3;
  }

  .flow-step:nth-child(13) {
    grid-column: 1;
    grid-row: 5;
  }

  .flow-arrow:nth-child(2) {
    grid-column: 2;
    grid-row: 1;
  }

  .flow-arrow:nth-child(4) {
    grid-column: 4;
    grid-row: 1;
  }

  .flow-arrow-down:nth-child(6) {
    grid-column: 5;
    grid-row: 2;
  }

  .flow-arrow-left:nth-child(8) {
    grid-column: 2;
    grid-row: 3;
  }

  .flow-arrow-left:nth-child(10) {
    grid-column: 4;
    grid-row: 3;
  }

  .flow-arrow-down:nth-child(12) {
    grid-column: 1;
    grid-row: 4;
  }


  @keyframes arrowPulse {
    0%, 100% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  @keyframes activePulse {
    0%, 100% {
      box-shadow: 
        0 0 30px rgba(121, 191, 249, 0.6),
        0 0 60px rgba(121, 191, 249, 0.3),
        inset 0 0 20px rgba(121, 191, 249, 0.1);
    }
    50% {
      box-shadow: 
        0 0 40px rgba(121, 191, 249, 0.8),
        0 0 80px rgba(121, 191, 249, 0.5),
        inset 0 0 30px rgba(121, 191, 249, 0.2);
    }
  }

  @keyframes borderGlow {
    0% {
      background: linear-gradient(45deg, 
        rgba(121, 191, 249, 0.8), 
        rgba(121, 191, 249, 0.4), 
        rgba(121, 191, 249, 0.8));
    }
    25% {
      background: linear-gradient(45deg, 
        rgba(121, 191, 249, 0.4), 
        rgba(121, 191, 249, 0.8), 
        rgba(121, 191, 249, 0.4));
    }
    50% {
      background: linear-gradient(45deg, 
        rgba(121, 191, 249, 0.8), 
        rgba(121, 191, 249, 0.4), 
        rgba(121, 191, 249, 0.8));
    }
    75% {
      background: linear-gradient(45deg, 
        rgba(121, 191, 249, 0.4), 
        rgba(121, 191, 249, 0.8), 
        rgba(121, 191, 249, 0.4));
    }
    100% {
      background: linear-gradient(45deg, 
        rgba(121, 191, 249, 0.8), 
        rgba(121, 191, 249, 0.4), 
        rgba(121, 191, 249, 0.8));
    }
  }

  /* 详情弹窗样式 */
  .detail-modal-overlay {
    width: 100%;
    background: linear-gradient(135deg, rgba(0, 50, 100, 0.6), rgba(0, 30, 60, 0.8));
    border: 1px solid rgba(121, 191, 249, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .detail-modal {
    background: linear-gradient(135deg, rgba(0, 50, 100, 0.95), rgba(0, 30, 60, 0.98));
    border: 2px solid rgba(121, 191, 249, 0.4);
    border-radius: 12px;
    width: 100%;
    height: 100%;
    max-height: 420px;
    min-height: 400px;
    overflow: hidden;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s ease;
  }

  .modal-header {
    background: linear-gradient(135deg, rgba(121, 191, 249, 0.2), rgba(0, 50, 100, 0.8));
    border-bottom: 1px solid rgba(121, 191, 249, 0.3);
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title {
    color: #eaf7ff;
    font-size: 30px;
    font-weight: 600;
    margin: 0;
    font-family: '优设标题黑', sans-serif;
    background: -webkit-linear-gradient(rgb(234, 247, 255), rgb(121, 191, 249));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .close-btn {
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 25px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);

    &:hover {
      background: linear-gradient(135deg, #ff5722, #ff9800);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
    }
  }

  .modal-content {
    padding: 25px;
    height: calc(100% - 80px);
    overflow-y: auto;
    overflow-x: hidden;
    
    /* 自定义滚动条样式 */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: rgba(121, 191, 249, 0.6) rgba(0, 30, 60, 0.3); /* Firefox */
    
    &::-webkit-scrollbar {
      width: 8px; /* 滚动条宽度 */
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 30, 60, 0.3); /* 滚动条轨道背景 */
      border-radius: 4px;
      margin: 4px 0;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(121, 191, 249, 0.6), rgba(121, 191, 249, 0.8));
      border-radius: 4px;
      border: 1px solid rgba(121, 191, 249, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, rgba(121, 191, 249, 0.8), rgba(121, 191, 249, 1));
        border-color: rgba(121, 191, 249, 0.5);
        box-shadow: 0 0 8px rgba(121, 191, 249, 0.4);
      }
      
      &:active {
        background: linear-gradient(135deg, rgba(121, 191, 249, 0.9), rgba(121, 191, 249, 1));
      }
    }
    
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
  }

  .modal-desc-section {
    margin: 0;
  }

  .desc-content {
    color: #eaf7ff;
    font-size: 28px;
    line-height: 1.9;
    background: rgba(0, 30, 60, 0.4);
    border: 1px solid rgba(121, 191, 249, 0.2);
    border-radius: 8px;
    padding: 25px;
    white-space: pre-wrap;
    text-align: left;
    min-height: 200px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* 通用滚动条样式优化 */
  .custom-scrollbar {
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: rgba(121, 191, 249, 0.6) rgba(0, 30, 60, 0.3); /* Firefox */
    
    &::-webkit-scrollbar {
      width: 8px; /* 滚动条宽度 */
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 30, 60, 0.3); /* 滚动条轨道背景 */
      border-radius: 4px;
      margin: 4px 0;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(121, 191, 249, 0.6), rgba(121, 191, 249, 0.8));
      border-radius: 4px;
      border: 1px solid rgba(121, 191, 249, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, rgba(121, 191, 249, 0.8), rgba(121, 191, 249, 1));
        border-color: rgba(121, 191, 249, 0.5);
        box-shadow: 0 0 8px rgba(121, 191, 249, 0.4);
      }
      
      &:active {
        background: linear-gradient(135deg, rgba(121, 191, 249, 0.9), rgba(121, 191, 249, 1));
      }
    }
    
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
  }
}

</style>