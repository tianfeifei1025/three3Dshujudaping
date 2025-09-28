<script setup>
import {ref, onMounted, onBeforeUnmount} from "vue";
import {getPersonOrgInfo, positionPersonList, specialClasses} from "@/api/api.js";

const cardRef = ref(null);
const orgData = ref([]);
const countyTeam = ref([]);
const townshipTeam = ref([]);
const selectedPosition = ref(null);
const selectedPositionInfo = ref({
    duty: [],
    personList: [],
});
const activeTab = ref('duties'); // 默认显示职责

// 处理组织架构数据
function processOrgData(data) {
  if (!data || !Array.isArray(data)) return;
  // 按类型分组
  countyTeam.value = data.filter(item => item.team_type === '县级专班');
  townshipTeam.value = data.filter(item => item.team_type === '乡镇专班');
  // 按职位层级排序
  countyTeam.value.sort((a, b) => {
    const positionOrder = {
      '书记': 1,
      '县长': 2,
      '县委分管领导': 3,
      '政府分管领导': 4,
      '综合协调组': 5,
      '项目推进组': 6,
      '园区运营组': 7
    };
    return (positionOrder[a.position] || 999) - (positionOrder[b.position] || 999);
  });

  orgData.value = data;
  
  // 默认选中书记
  const secretary = countyTeam.value.find(item => item.position === '书记');
  if (secretary) {
    selectedPosition.value = secretary.position;
    selectedPositionInfo.value.duty = secretary.main_duties;
  }
}

// 获取当前选中职位的职责列表
function getCurrentPositionDuties() {
  if (!selectedPositionInfo.value || !selectedPositionInfo.value.duty) {
    return [];
  }
  
  const duties = [];
  const dutyText = selectedPositionInfo.value.duty;
  
  // 按照数字序号分割职责
  // 匹配 "数字." 开头的文本
  const dutyMatches = dutyText.match(/\d+\.\s*[^]*?(?=\d+\.|$)/g);
  
  if (dutyMatches) {
    dutyMatches.forEach(duty => {
      // 清理职责文本，移除序号但保留内容
      const cleanDuty = duty.replace(/^\d+\.\s*/, '').trim();
      if (cleanDuty) {
        duties.push(cleanDuty);
      }
    });
  } else {
    // 如果没有找到序号格式，按换行符分割
    const dutyList = dutyText.split('\n').filter(duty => duty.trim());
    dutyList.forEach(duty => {
      const cleanDuty = duty.replace(/^\d+\./, '').trim();
      if (cleanDuty) {
        duties.push(cleanDuty);
      }
    });
  }
  
  return duties.slice(0, 10);
}
// 切换选中职位
function selectPosition(member) {
  if (member) {
    selectedPosition.value = member.position;
    selectedPositionInfo.value.duty = member.main_duties;
    //获取当前职位的职责列表
    positionPersonList(member.id).then(personList => {
      selectedPositionInfo.value.personList = personList;
    })
  }

}

// 切换标签页
function switchTab(tab) {
  activeTab.value = tab;
}

onMounted(async () => {
  try {
    const res = await getPersonOrgInfo();
    processOrgData(res);
  } catch (error) {
    console.error('获取组织架构数据失败:', error);
  }
});


onBeforeUnmount(() => {

});
</script>

<template>
  <div class="right-card" ref="cardRef">
    <div class="intro-container">
      <div class="title">
        <div>架构模式</div>
      </div>
      <!-- 数据展示 -->
      <div v-if="orgData.length>0" class="content">
        <div class="org-chart">
          <!-- 顶层：书记 -->
          <div class="org-level level-1" v-if="countyTeam.find(item => item.position === '书记')">
            <div class="org-node secretary" 
                 :class="{ selected: selectedPosition === '书记' }"
                 @click="selectPosition(countyTeam.find(item => item.position === '书记'))">
              <div class="info">
                <div class="position">书记</div>
                <div class="name">{{ countyTeam.find(item => item.position === '书记')?.member_name || '' }}</div>
              </div>
            </div>
            <div class="line-icon">
              <img src="@/assets/images/icon_slices/icon51.png" alt="连接线" class="connection-icon"/>
            </div>
          </div>

          <!-- 第二层：县长 -->
          <div class="org-level level-2" v-if="countyTeam.find(item => item.position === '县长')">
            <div class="org-node mayor" 
                 :class="{ selected: selectedPosition === '县长' }"
                 @click="selectPosition(countyTeam.find(item => item.position === '县长'))">
              <div class="info">
                <div class="position">县长</div>
                <div class="name">{{ countyTeam.find(item => item.position === '县长')?.member_name || '' }}</div>
              </div>
            </div>
            <div class="line-icon">
              <img src="@/assets/images/icon_slices/icon52.png" alt="连接线" class="connection-icon"/>
            </div>
          </div>

          <!-- 第三层：分管领导 -->
          <div class="org-level level-3">
            <div class="org-node leader left" v-if="countyTeam.find(item => item.position === '县委分管领导')">
              <div class="info" 
                   :class="{ selected: selectedPosition === '县委分管领导' }"
                   @click="selectPosition(countyTeam.find(item => item.position === '县委分管领导'))">
                <div class="position">县委分管领导</div>
                <div class="name">{{
                    countyTeam.find(item => item.position === '县委分管领导')?.member_name || ''
                  }}
                </div>

              </div>
              <div class="line-icon">
                <img src="@/assets/images/icon_slices/icon51.png" alt="连接线" class="connection-icon"/>
              </div>
            </div>
            <div class="org-node leader right" v-if="countyTeam.find(item => item.position === '政府分管领导')">
              <div class="info" 
                   :class="{ selected: selectedPosition === '政府分管领导' }"
                   @click="selectPosition(countyTeam.find(item => item.position === '政府分管领导'))">
                <div class="position">政府分管领导</div>
                <div class="name">{{
                    countyTeam.find(item => item.position === '政府分管领导')?.member_name || ''
                  }}
                </div>

              </div>
              <div class="line-icon">
                <img src="@/assets/images/icon_slices/icon52.png" alt="连接线" class="connection-icon"/>
              </div>
            </div>
          </div>

          <!-- 第四层：功能组 -->
          <div class="org-level level-4"
               v-if="countyTeam.filter(item => ['综合协调组', '项目推进组', '园区运营组'].includes(item.position)).length > 0">
            <div class="org-node-group">
               <div class="org-node group coordination"
                    v-for="item in countyTeam.filter(item => item.position === '综合协调组')"
                    :key="item.id"
                    :class="{ selected: selectedPosition === item.position }"
                    @click="selectPosition(item)">
                <div class="info">
                  <div class="position">{{ item.position }}</div>
                  <div class="name">{{ item.member_name }}</div>
                </div>
              </div>
               <div class="org-node group project"
                    v-for="item in countyTeam.filter(item => item.position === '项目推进组')"
                    :key="item.id"
                    :class="{ selected: selectedPosition === item.position }"
                    @click="selectPosition(item)">
                <div class="info">
                  <div class="position">{{ item.position }}</div>
                  <div class="name">{{ item.member_name }}</div>
                </div>
              </div>
               <div class="org-node group park"
                    v-for="item in countyTeam.filter(item => item.position === '园区运营组')"
                    :key="item.id"
                    :class="{ selected: selectedPosition === item.position }"
                    @click="selectPosition(item)">
                <div class="info">
                  <div class="position">{{ item.position }}</div>
                  <div class="name">{{ item.member_name }}</div>
                </div>
              </div>
            </div>
            <div class="line-icon">
              <img src="@/assets/images/icon_slices/icon50.png" alt="连接线" class="connection-icon"/>
            </div>
          </div>

          <!-- 第五层：乡镇 -->
          <div class="org-level level-5" v-if="townshipTeam.length > 0">
             <div class="org-node township"
                  v-for="town in townshipTeam"
                  :key="town.id"
                  :class="{ selected: selectedPosition === town.position }"
                  @click="selectPosition(town)">
              <div class="info">
                <div class="member-names" v-if="town.member_name">{{ town.member_name }}</div>
                <div class="name">{{ town.position }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="org-chart-desc">
          <!-- 标签页切换 -->
          <div class="tab-container">
            <div class="tab-buttons">
              <div class="tab-button" 
                   :class="{ active: activeTab === 'duties' }"
                   @click="switchTab('duties')">
                <span>职责介绍</span>
              </div>
              <div class="tab-button"  v-if="selectedPositionInfo?.personList?.length > 0"
                   :class="{ active: activeTab === 'personnel' }"
                   @click="switchTab('personnel')">
                <span>组成人员</span>
              </div>
            </div>
          </div>

          <!-- 职责介绍部分 -->
          <div class="responsibilities-section" v-show="activeTab === 'duties'">
            <div class="section-title">
              <div class="title-icon"></div>
              <span>{{ selectedPosition  }} - 职责介绍</span>
            </div>
            <div class="responsibilities-list scroll-container">
              <div class="responsibility-item"
                   v-for="(duty, index) in getCurrentPositionDuties()"
                   :key="index">
                <span class="item-number">{{ index + 1 }}.</span>
                <span class="item-text">{{ duty }}</span>
              </div>
              <div v-if="getCurrentPositionDuties().length === 0" class="no-duties">
                <span>暂无职责信息</span>
              </div>
            </div>
          </div>

          <!-- 组成人员部分 -->
          <div class="personnel-section" v-show="activeTab === 'personnel'">
            <div class="section-title">
              <div class="title-icon"></div>
              <span>{{ selectedPosition }} - 组成人员</span>
            </div>
            <div class="personnel-cards scroll-container">
              <div class="personnel-card" 
                    v-for="member in selectedPositionInfo?.personList"
                   :key="member.id">
                <div class="card-info">
                  <div class="info-item">
                    <div class="info-icon person-icon"></div>
                    <span class="info-label">姓名</span>
                    <span class="info-value">{{ member.name }}</span>
                  </div>
                  <div class="info-item">
                    <div class="info-icon position-icon"></div>
                    <span class="info-label">职务</span>
                    <span class="info-value">{{ member.position || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  background: url('~@/assets/images/border_slices/border1.png') no-repeat;
  background-size: 100% 100%;
  width: 100%;
  height: 1820px;
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
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  // 组织架构图样式
  .content {
    padding: 20px;
    height: calc(100% - 100px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .org-chart {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .org-level {
    position: relative;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .org-node {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 8px;
    text-align: center;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    &.selected {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4);
      border: 3px solid #3b82f6;
      transform: scale(1.05);
      position: relative;
      
      // 添加脉冲动画
      &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid #60a5fa;
        border-radius: 12px;
        animation: pulse-border 2s infinite;
        z-index: -1;
      }
      
      // 添加内发光效果
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
        border-radius: 8px;
        z-index: -1;
      }
    }

    .info {
      display: flex;
      flex-direction: column;
      align-items: center;

      .name {
        color: #b8d4f0;
        font-size: 26px;
        font-weight: 500;
        line-height: 1.2;
        margin-top: 2px;
        transition: all 0.3s ease;
      }

      .position {
        color: #fff;
        font-size: 28px;
        transition: all 0.3s ease;
      }

      .member-names {
        color: #a0c4e8;
        font-size: 22px;
        margin-top: 4px;
        text-align: center;
        line-height: 1.3;
      }
    }
  }

  // 不同层级的样式
  .level-1 {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .org-node {
      background: url("~@/assets/images/border_slices/border6.png") no-repeat;
      background-size: 296px 120px;
      width: 296px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;

      .position {
        width: 112px;
        height: 40px;
        background: url("~@/assets/images/border_slices/border9.png") no-repeat;
        background-size: 112px 40px;
      }
    }
  }

  .level-2 {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .org-node {
      background: url("~@/assets/images/border_slices/border6.png") no-repeat;
      background-size: 296px 120px;
      width: 296px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;

      .position {
        width: 112px;
        height: 40px;
        background: url("~@/assets/images/border_slices/border9.png") no-repeat;
        background-size: 112px 40px;
      }
    }
  }

  .level-3 {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    .left, .right {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .info {
        background: url("~@/assets/images/border_slices/border6.png") no-repeat;
        background-size: 296px 120px;
        width: 296px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        &.selected {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4);
          border: 3px solid #3b82f6;
          transform: scale(1.05);
          position: relative;
          
          // 添加脉冲动画
          &::before {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border: 2px solid #60a5fa;
            border-radius: 12px;
            animation: pulse-border 2s infinite;
            z-index: -1;
          }
          
          // 添加内发光效果
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
            border-radius: 8px;
            z-index: -1;
          }
          
          // 选中状态下的文字样式
          .info {
            .position {
              color: #60a5fa;
              font-weight: 700;
              text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
              font-size: 30px;
            }
            
            .name {
              color: #fff;
              font-weight: 600;
              text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
              font-size: 28px;
            }
            
            .member-names {
              color: #e0f2fe;
              font-weight: 600;
              text-shadow: 0 0 6px rgba(224, 242, 254, 0.4);
              font-size: 24px;
            }
          }
        }
      }
    }
  }

  .level-4 {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    .org-node-group {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .org-node {
      background: url("~@/assets/images/border_slices/border6.png") no-repeat;
      background-size: 296px 120px;
      width: 296px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .level-5 {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 20px;

    .org-node {
      background: url("~@/assets/images/border_slices/border7.png") no-repeat;
      background-size: 80px 224px;
      width: 80px;
      height: 224px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      .info {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        writing-mode: vertical-rl;
        text-orientation: upright;
      }

      .info .name {
        font-size: 26px;
        color: #fff;
        font-weight: 500;
        line-height: 1.2;
        letter-spacing: 2px;
        transition: all 0.3s ease;
      }
      
      // 乡镇层级选中状态
      &.selected {
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4);
        border: 3px solid #3b82f6;
        transform: scale(1.05);
        position: relative;
        
        // 添加脉冲动画
        &::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid #60a5fa;
          border-radius: 12px;
          animation: pulse-border 2s infinite;
          z-index: -1;
        }
        
        // 添加内发光效果
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
          border-radius: 8px;
          z-index: -1;
        }
        
        .info {
          .name {
            color: #60a5fa;
            font-weight: 700;
            text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
            font-size: 28px;
          }
          
          .member-names {
            color: #e0f2fe;
            font-weight: 600;
            text-shadow: 0 0 6px rgba(224, 242, 254, 0.4);
            font-size: 24px;
          }
        }
      }
    }
  }
  .org-chart-desc {
    flex: 1;
    margin-top: 30px;
    padding: 25px;
    //background: linear-gradient(135deg, #1e3a8a, #1e40af);
    border-radius: 12px;
    //border: 1px solid #3b82f6;
    //box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    width: 100%;
    max-width: 1000px;

    // 标签页容器样式
    .tab-container {
      margin-bottom: 25px;
      
      .tab-buttons {
        display: flex;
        gap: 8px;
        background: rgba(255, 255, 255, 0.02);
        padding: 6px;
        border-radius: 12px;
        border: 1px solid rgba(59, 130, 246, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        
        .tab-button {
          flex: 1;
          padding: 16px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          
          // 背景渐变效果
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: 8px;
          }
          
          span {
            position: relative;
            z-index: 2;
            color: #b8d4f0;
            font-size: 26px;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            
            // 添加图标效果
            &::before {
              content: '';
              width: 6px;
              height: 6px;
              background: currentColor;
              border-radius: 50%;
              opacity: 0.6;
              transition: all 0.3s ease;
            }
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
            
            &::before {
              opacity: 1;
            }
            
            span {
              color: #fff;
              transform: scale(1.05);
              
              &::before {
                opacity: 1;
                transform: scale(1.2);
              }
            }
          }
          
          &.active {
            background: linear-gradient(135deg, #034180 0%, #73D0FF 100%);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
            transform: translateY(-3px);
            
            &::before {
              opacity: 0;
            }
            
            span {
              color: #fff;
              font-weight: 600;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              
              &::before {
                background: #fff;
                opacity: 1;
                transform: scale(1.3);
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
              }
            }
            
            // 添加发光效果
            &::after {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(135deg, #034180 0%, #73D0FF 100%);
              border-radius: 10px;
              z-index: -1;
              opacity: 0.6;
              animation: pulse 2s infinite;
            }
          }
        }
      }
    }
    
    // 脉冲动画
    @keyframes pulse {
      0%, 100% {
        opacity: 0.6;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.02);
      }
    }
    
    // 边框脉冲动画
    @keyframes pulse-border {
      0%, 100% {
        opacity: 0.6;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
    }

    // 背景装饰
    &::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      z-index: 0;
    }

    // 职责介绍部分
    .responsibilities-section {
      margin-bottom: 15px;
      position: relative;
      z-index: 1;

      .section-title {
        display: flex;
        align-items: center;
        margin-bottom: 18px;

        .title-icon {
          width: 12px;
          height: 12px;
          background: #fbbf24;
          margin-right: 10px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        span {
          color: #fff;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      }

      .responsibilities-list {
        &.scroll-container {
          max-height: 480px;
          overflow-y: auto;
          padding-right: 8px;
          margin-right: -8px;
          
          // 自定义滚动条样式
          &::-webkit-scrollbar {
            width: 8px;
          }
          
          &::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          
          &::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 4px;
            transition: background 0.3s ease;
            
            &:hover {
              background: linear-gradient(135deg, #2563eb, #1e40af);
            }
          }
          
          &::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #2563eb, #1e40af);
          }
        }
        
        .responsibility-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 12px;
          padding: 10px 0;

          .item-number {
            color: #fff;
            font-weight: 600;
            margin-right: 10px;
            min-width: 25px;
            font-size: 28px;
          }

          .item-text {
            color: #fff;
            font-size: 28px;
            line-height: 1.5;
            flex: 1;
          }
        }

        .no-duties {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: #7ca0c7;
          font-style: italic;
          font-size: 24px;
        }
      }
    }

    // 综合协调组人员部分
    .personnel-section {
      position: relative;
      z-index: 1;

      .section-title {
        display: flex;
        align-items: center;
        margin-bottom: 18px;

        .title-icon {
          width: 12px;
          height: 12px;
          background: #fbbf24;
          margin-right: 10px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        span {
          color: #fff;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      }

      .personnel-cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        
        &.scroll-container {
          max-height: 480px;
          overflow-y: auto;
          padding-right: 8px;
          margin-right: -8px;
          
          // 自定义滚动条样式
          &::-webkit-scrollbar {
            width: 8px;
          }
          
          &::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          
          &::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 4px;
            transition: background 0.3s ease;
            
            &:hover {
              background: linear-gradient(135deg, #2563eb, #1e40af);
            }
          }
          
          &::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #2563eb, #1e40af);
          }
        }

        .personnel-card {
          width: 100%;
          min-width: 0;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(59, 130, 246, 0.4);
          border-radius: 10px;
          padding: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          position: relative;

          &:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(59, 130, 246, 0.6);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }

          .card-info {
            .info-item {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              padding: 6px 0;

              &:last-child {
                margin-bottom: 0;
              }

              .info-icon {
                width: 18px;
                height: 18px;
                margin-right: 10px;
                border-radius: 3px;
                flex-shrink: 0;

                &.person-icon {
                  background: #60a5fa;
                }

                &.position-icon {
                  background: #60a5fa;
                }

                &.phone-icon {
                  background: #60a5fa;
                }

                &.time-icon {
                  background: #60a5fa;
                }
              }

              .info-label {
                color: #b8d4f0;
                font-size: 28px;
                margin-right: 10px;
                min-width: 70px;
              }

              .info-value {
                color: #fff;
                font-size: 28px;
                font-weight: 500;
                flex: 1;
              }
            }
          }
        }
      }
    }
  }
}

</style>
