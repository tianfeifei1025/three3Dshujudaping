<script setup>
import mCard from "@/components/mCard/index.vue";
import {onMounted, ref} from "vue";
import {Carousel, CarouselItem, Col, Icon, Image, Row, TabPane, Tabs} from "view-ui-plus";
import {expertYard} from "@/api/api.js";

const height = ref(1124);
const expertList = ref([]);
const expertTeamList = ref([]);

// 弹框相关状态
const showModal = ref(false);
const modalType = ref(''); // 'expert' 或 'team'
const currentDetail = ref({});

const showExpertDetail = (item) => {
  currentDetail.value = item;
  modalType.value = 'expert';
  showModal.value = true;
}

const showExpertTeamDetail = (item) => {
  currentDetail.value = item;
  modalType.value = 'team';
  showModal.value = true;
}

const closeModal = () => {
  showModal.value = false;
  currentDetail.value = {};
  modalType.value = '';
}

onMounted(() => {
  expertYard().then(res => {
    expertList.value = res.experts;
    expertTeamList.value = res.techs;
  });
});

</script>

<template>
  <div class="right-card">
    <m-card title="专家小院" :height="height">
      <div class="yard-container">
        <Tabs value="name1" class="intro-info" >
          <TabPane label="专家" name="name1">
            <div class="expert-list" v-if="expertList.length>0">
              <div class="expert-item" v-for="(item, index) in expertList" :key="index">
                <div class="part-one">
                  <div class="part-one-img">
                    <img
                        :src="item.avatar"
                        alt="专家头像"
                    />
                  </div>
                  <div class="part-one-info">
                    <p>姓名：<strong>{{ item.name }}</strong></p>
                    <p>职称：<strong>{{ item.professional }}</strong></p>

                  </div>
                  <div class="part-one-btn" @click="showExpertDetail(item)">
                    查看详情
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tip">
              暂无专家数据
            </div>
          </TabPane>
          <TabPane label="技术人员" name="name2">
            <div class="expert-team" v-if="expertTeamList.length>0">
              <div class="expert-item" v-for="(item, index) in expertTeamList" :key="index">
                <div class="part-one">
                  <div class="part-one-img">
                    <img
                        :src="item.avatar"
                        alt="团队头像"
                    />
                  </div>
                  <div class="part-one-info">
                    <p>姓名：<strong>{{ item.name }}</strong></p>
                    <p>单位：<strong>{{ item.education }}</strong></p>
                  </div>
                  <div class="part-one-btn" @click="showExpertTeamDetail(item)">
                    查看详情
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-tip">
              暂无专家团队数据
            </div>
          </TabPane>
        </Tabs>

      </div>
    </m-card>

    <!-- 详情弹框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalType === 'expert' ? '专家详情' : '专家团队详情' }}</h3>
          <div class="close-btn" @click="closeModal">×</div>
        </div>

        <div class="modal-body">
          <!-- 专家详情 -->
          <div v-if="modalType === 'expert'" class="expert-detail">
            <!-- 基本信息区域 -->
            <div class="basic-info-section">
              <div class="detail-avatar">
                <img :src="currentDetail.avatar" alt="专家头像" />
              </div>
              <div class="basic-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">姓名：</span>
                    <span class="value">{{ currentDetail.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">职称：</span>
                    <span class="value">{{ currentDetail.professional }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">性别：</span>
                    <span class="value">{{ currentDetail.gender }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">工作单位：</span>
                    <span class="value">{{ currentDetail.education }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 研究擅长方向 -->
            <div class="section-block">
              <h4 class="section-title">研究擅长方向</h4>
              <div class="section-content">
                {{ currentDetail.major }}
              </div>
            </div>

            <!-- 主要成就及荣誉 -->
            <div class="section-block">
              <h4 class="section-title">主要成就及荣誉</h4>
              <div class="section-content">
                {{ currentDetail.achievements }}
              </div>
            </div>

            <!-- 服务信息 -->
            <div class="section-block">
              <h4 class="section-title">服务信息</h4>
              <div class="service-info">
                <div class="service-count">
                  <span class="label">服务次数：</span>
                  <span class="value">{{ currentDetail.serviceNum || 0 }}次</span>
                </div>
                <div class="service-content">
                  <span class="label">服务内容：</span>
                  <div class="value">{{ currentDetail.serviceCon || "暂无" }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 专家团队详情 -->
          <div v-if="modalType === 'team'" class="team-detail">
            <!-- 基本信息区域 -->
            <div class="basic-info-section">
              <div class="detail-avatar">
                <img :src="currentDetail.avatar" alt="技术人员头像" />
              </div>
              <div class="basic-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">姓名：</span>
                    <span class="value">{{ currentDetail.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">工作单位：</span>
                    <span class="value">{{ currentDetail.education }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">联系方式：</span>
                    <span class="value">{{ currentDetail.phone }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 研究擅长方向 -->
            <div class="section-block">
              <h4 class="section-title">研究擅长方向</h4>
              <div class="section-content">
                {{ currentDetail.major || "暂无信息" }}
              </div>
            </div>

            <!-- 主要成就及荣誉 -->
            <div class="section-block">
              <h4 class="section-title">主要成就及荣誉</h4>
              <div class="section-content">
                {{ currentDetail.achievements  || "暂无信息" }}
              </div>
            </div>

            <!-- 服务信息 -->
            <div class="section-block">
              <h4 class="section-title">服务信息</h4>
              <div class="service-info">
                <div class="service-count">
                  <span class="label">服务次数：</span>
                  <span class="value">{{ currentDetail.serviceNum || 0 }}次</span>
                </div>
                <div class="service-content">
                  <span class="label">服务内容：</span>
                  <div class="value">{{ currentDetail.serviceCon || "暂无内容" }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yard-container {
  .intro-info {
    width: 100%;
    height: 1100px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin-top:100px;
    .expert-list, .expert-team {
      height: 950px;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 10px 0;
        
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: rgba(77, 136, 225, 0.1);
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(77, 136, 225, 0.6);
        border-radius: 4px;
        transition: background 0.3s ease;
      }
      
      &::-webkit-scrollbar-thumb:hover {
        background: rgba(77, 136, 225, 0.8);
      }
      
      .expert-item {
        margin-bottom: 20px;
        
        .part-one {
        height: 160px;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        gap: 20px;
        padding: 20px;
        background: url("~@/assets/images/border_slices/border4.png") no-repeat center;
        background-size: contain;

        .part-one-img {
          width: 160px;
          height: 160px;
          flex: 1;
          margin-left: 10px;

          & img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .part-one-info {
          flex: 2;
          height: 100%;
          font-weight: 400;
          font-size: 28px;
          color: #FFFFFF;
          line-height: 60px;
        }

        .part-one-btn {
          flex: 1;
          width: 200px;
          height: 116px;
          background: url("~@/assets/images/border_slices/border3.png") no-repeat center;
          background-size: contain;
          color: #FFFFFF;
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          line-height: 86px;
          margin-right: 20px;
        }
        .part-one-btn:hover {
          color: #1d4777;
        }
        }
      }


    }
  }

  :deep(.ivu-tabs-bar) {
    background: transparent;
    display: flex;
    justify-content: right;
    align-items: center;
  }

  :deep(.ivu-tabs-tab) {
    font-weight: 400;
    font-size: 28px;
    color: #B4D8FF;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(34, 122, 255, 0.102);
    text-align: center;
    white-space: nowrap;
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
}

/* 弹框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
  pointer-events: all;
}

.modal-content {
  background: linear-gradient(135deg, rgba(20, 40, 80, 0.95), rgba(40, 80, 120, 0.95));
  border: 2px solid rgba(77, 136, 225, 0.6);
  border-radius: 12px;
  width: 85%;
  max-width: 1000px;
  max-height: 95vh;
  height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(77, 136, 225, 0.2);
  border-bottom: 1px solid rgba(77, 136, 225, 0.3);
}

.modal-header h3 {
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  color: #B4D8FF;
  font-size: 40px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.expert-detail, .team-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 基本信息区域 */
.basic-info-section {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.detail-avatar {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(77, 136, 225, 0.4);
}

.detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.basic-info {
  flex: 1;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 区块样式 */
.section-block {
  background: rgba(77, 136, 225, 0.08);
  border: 1px solid rgba(77, 136, 225, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-weight: 500;
  font-size: 28px;
  color: #FFE32B;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(77, 136, 225, 0.3);
}

.section-content {
  font-weight: 400;
  font-size: 28px;
  color: #CEE5FF;
  line-height: 1.6;
  word-break: break-all;
}

/* 服务信息样式 */
.service-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: #B4D8FF;
  font-size: 28px;
  font-weight: 400;
  flex-shrink: 0;
}

.value {
  color: #FFFFFF;
  font-size: 28px;
  font-weight:700;
  line-height: 1.5;
  word-break: break-all;
}

.service-content .value {
  background: rgba(77, 136, 225, 0.1);
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid rgba(77, 136, 225, 0.6);
  margin-top: 4px;
}

/* 滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(77, 136, 225, 0.1);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(77, 136, 225, 0.6);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(77, 136, 225, 0.8);
}

/* 动画效果 */
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
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .basic-info-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .detail-avatar {
    width: 100px;
    height: 100px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .modal-header h3 {
    font-size: 28px;
  }

  .section-title {
    font-size: 18px;
  }

  .section-content {
    font-size: 16px;
  }

  .label, .value {
    font-size: 16px;
  }
}
</style>