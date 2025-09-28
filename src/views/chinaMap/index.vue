<template>
  <v-scale-screen width="3840" height="2160">
    <div class="large-screen">
      <!-- 地图 -->
      <mapScene ref="mapSceneRef"></mapScene>

      <!-- 内容 -->
      <div class="large-screen-wrap" id="large-screen">
        <!-- 顶部 header -->
        <m-header
            :title="headerConfig.title"
            :left-menu-items="headerConfig.leftMenuItems"
            :right-menu-items="headerConfig.rightMenuItems"
            :show-date-time="true"
            @menu-click="handleMenuSelect"
        />
        <!-- 左边布局 图表 -->
        <div class="left-wrap" v-show="true">
          <div class="left-wrap-3d">
            <component
                v-for="item in menuComponents[state.menuIndex].left"
                :key="item.key"
                :is="item.component"
            />
          </div>
        </div>
        <!-- 右边布局 图表 -->
        <div class="right-wrap" v-show="true">
          <div class="right-wrap-3d">
            <component
                v-for="item in menuComponents[state.menuIndex].right"
                :key="item.key"
                :is="item.component"
            />
          </div>
        </div>
        <!-- 底部布局 -->
        <div class="bottom-wrap" v-show="true">
          <component
              v-for="item in menuComponents[state.menuIndex].bottom"
              :key="item.key"
              :is="item.component"
          />
        </div>
        <!-- 功能菜单 -->
        <div class="tool-menu">
          <div
              class="tool-menu-item"
              :class="{ active: state.bottomMenuStatus.all }"
              @click="changeMenu('all')"
          >
            <img src="@/assets/images/icon_slices/icon43.png" alt="" class="btn-icon"/>
            <span>总览</span>
          </div>
          <div
              class="tool-menu-item"
              :class="{ active: state.bottomMenuStatus.park }"
              @click="changeMenu('park')"
          >
            <img src="@/assets/images/icon_slices/icon42.png" alt="" class="btn-icon"/>
            <span>一园区</span>
          </div>
          <div
              class="tool-menu-item"
              :class="{ active: state.bottomMenuStatus.center }"
              @click="changeMenu('center')"
          >
            <img src="@/assets/images/icon_slices/icon40.png" alt="" class="btn-icon"/>
            <span>二中心</span>
          </div>
          <div
              class="tool-menu-item"
              :class="{ active: state.bottomMenuStatus.base }"
              @click="changeMenu('base')"
          >
            <img src="@/assets/images/icon_slices/icon39.png" alt="" class="btn-icon"/>
            <span>八基地</span>
          </div>
          <div
              class="tool-menu-item"
              :class="{ active: state.bottomMenuStatus.kiloton }"
              @click="changeMenu('kiloton')"
          >
            <img src="@/assets/images/icon_slices/icon41.png" alt="" class="btn-icon"/>
            <span>千吨加工</span>
          </div>
          <div
              class="tool-menu-item"
              :class="{ active: state.bottomMenuStatus.courtyard }"
              @click="changeMenu('courtyard')"
          >
            <img src="@/assets/images/icon_slices/icon38.png" alt="" class="btn-icon"/>
            <span>N庭院</span>
          </div>
        </div>
        <!-- 顶部左右两侧边框 -->
        <div class="top-left-border"></div>
        <div class="top-right-border"></div>
        <!-- 左右装饰线 -->
        <div class="large-screen-left-zsline"></div>
        <div class="large-screen-right-zsline"></div>
        <!-- 底部边框 -->
        <div class="bottom-border"></div>
        <!-- 地图左右装饰圆弧 -->
        <div class="large-screen-map-left-zsline"></div>
        <div class="large-screen-map-right-zsline"></div>
      </div>

      <!-- loading动画 -->
      <div class="loading">
        <div class="loading-text">
          <span style="--index: 1">L</span>
          <span style="--index: 2">O</span>
          <span style="--index: 3">A</span>
          <span style="--index: 4">D</span>
          <span style="--index: 5">I</span>
          <span style="--index: 6">N</span>
          <span style="--index: 7">G</span>
        </div>
        <div class="loading-progress">
          <span class="value">{{ state.progress }}</span>
          <span class="unit">%</span>
        </div>
      </div>

      <!-- 全屏模态框 -->
      <div v-if="state.showFullscreen" class="fullscreen-modal" @click="closeFullscreen">
        <div class="fullscreen-content" @click.stop>
          <div class="fullscreen-header">
            <h2 class="fullscreen-title">{{ state.fullscreenData.name }}</h2>
            <button class="close-btn" @click="closeFullscreen">
              <img src="@/assets/images/icon_slices/icon13.png" alt="关闭" class="close-icon"/>
            </button>
          </div>
          <div class="fullscreen-body">
            <div class="fullscreen-iframe-container">
              <iframe
                  v-if="state.fullscreenData.stream_address"
                  :src="getVideoPlayerUrl(state.fullscreenData.stream_address)"
                  class="fullscreen-iframe"
                  frameborder="0"
                  allowfullscreen
                  allow="microphone; compute-pressure; autoplay; fullscreen"
              ></iframe>
              <div v-else class="no-video">暂无视频视图</div>
            </div>
          </div>
        </div>
      </div>
      <!-- 监控弹窗 -->
      <MonitorPopup
          :visible="state.showMonitorPopup"
          :point-data="state.monitorPopupData.pointData || {}"
          @close="closeMonitorPopup"
      />

    </div>
  </v-scale-screen>
</template>
<script setup>
import {shallowRef, ref, reactive, onMounted, onBeforeUnmount, nextTick} from "vue";
import VScaleScreen from "v-scale-screen";
import mapScene from "./map.vue";
import mHeader from "@/components/mHeader/index.vue";
import {Assets} from "./assets.js";
import emitter from "@/utils/emitter";
import gsap from "gsap";
import baseData from "./map/baseData.js";
import parkData from "./map/parkData.js";
import centerData from "./map/centerData.js";
import kilotonData from "./map/kilotonData.js";
import cityData from "./map/cityData.js";

import * as pathPointData from "./map/example/pathPointData.js";
import {sleep} from "@/utils";
import Benefit from "@/views/chinaMap/components/industryStructure/Benefit.vue";
import BasicInfo from "@/views/chinaMap/components/industryStructure/BasicInfo.vue";
import Agriculture
  from "@/views/chinaMap/components/industryStructure/Agriculture.vue";
import ProduceNode from "@/views/chinaMap/components/produceStructure/ProduceNode.vue";
import HarvestStand from "@/views/chinaMap/components/produceStructure/HarvestStand.vue";
import FacilityStandard from "@/views/chinaMap/components/produceStructure/FacilityStandard.vue";
import TempHumidityDisplay from "@/views/chinaMap/components/produceStructure/TempHumidityDisplay.vue";
import PerceptualSource from "@/views/chinaMap/components/produceStructure/PerceptualSource.vue";
import ExpertCourtyard from "@/views/chinaMap/components/manageStructure/ExpertCourtyard.vue";
import SpecialTaskForceInfo from "@/views/chinaMap/components/manageStructure/SpecialTaskForceInfo.vue";
import VideoSurveillance from "@/views/chinaMap/components/manageStructure/VideoSurveillance.vue";
import Overview from "@/views/chinaMap/components/industryStructure/Overview.vue";
import Input from "@/views/chinaMap/components/industryStructure/Input.vue";
import ProductIntro from "@/views/chinaMap/components/businessStructure/ProductIntro.vue";
import ChannelIntro from "@/views/chinaMap/components/businessStructure/ChannelIntro.vue";
import BrandIntro from "@/views/chinaMap/components/businessStructure/BrandIntro.vue";
import SalesProcess from "@/views/chinaMap/components/businessStructure/SalesProcess.vue";
import TeachVideo from "@/views/chinaMap/components/manageStructure/TeachVideo.vue";
import ManageStandard from "@/views/chinaMap/components/produceStructure/ManageStandard.vue";
import MonitorPopup from "@/views/chinaMap/components/MonitorPopup.vue";
import {getCourtyardCountByTownship} from "@/api/api.js";

const assets = shallowRef(null);
const mapSceneRef = ref(null);
const state = reactive({
  // 进度
  progress: 0,
  // 当前菜单索引
  menuIndex: 0,
  bottomMenuIndex: 0,
  bottomMenuStatus: {
    all: true,
    park: false,
    center: true,
    base: true,
    courtyard: false,
    kiloton: true,
  },
  // 全屏相关状态
  showFullscreen: false,
  fullscreenData: {},
  // 监控弹窗状态
  showMonitorPopup: false,
  monitorPopupData: {}
});

// Header配置
const headerConfig = reactive({
  title: "壤塘县高原食用菌数字平台",
  leftMenuItems: [
    {label: "产业体系", isActive: true, index: 0, img: "chanyetx", imgSelected: "chanyetx-s"},
    {label: "生产体系", isActive: false, index: 1, img: "shengchantx", imgSelected: "shengchantx-s"},
  ],
  rightMenuItems: [
    {label: "经营体系", isActive: false, index: 2, img: "yingxiaotx", imgSelected: "yingxiaotx-s"},
    {label: "发展愿景", isActive: false, index: 3, img: "guanlitx", imgSelected: "guanlitx-s"},
  ]
});
// 导航菜单配置
const menuComponents = {
  0: { // 产业体系
    left: [
      {component: Overview, key: 'output-overview'},//物理规模
      {component: Input, key: 'econ-overview'},//经济产值
      {component: Benefit, key: 'poverty-overview'},//巩固脱贫攻坚数据
    ],
    right: [
      {component: BasicInfo, key: 'industry-overview'},
    ],
    bottom: [
      {component: Agriculture, key: 'achievement-overview'},
    ],
    top: []

  },
  1: { // 生产体系
    left: [
      {component: FacilityStandard, key: 'fa-production'},
      {component: ManageStandard, key: 'man-production'},
      {component: HarvestStand, key: 'pro-production'},
    ],
    right: [
      {component: ProduceNode, key: 'node-production'},
      {component: TempHumidityDisplay, key: 'temp-production'},
    ],
    bottom: [{component: PerceptualSource, key: 'demo-production'},],
    top: []
  },
  2: { // 经营体系
    left: [
      {component: ProductIntro, key: 'product-business'},
      {component: ChannelIntro, key: 'channel-business'},

    ],
    right: [
      {component: SalesProcess, key: 'product-business'},
      {component: BrandIntro, key: 'channel-business'},
    ],
    bottom: [],
    top: []
  },
  3: { // 管理体系产
    left: [
      {component: SpecialTaskForceInfo, key: 'sptfi-manage'},
    ],
    right: [
      {component: ExpertCourtyard, key: 'expert-manage'},
      {component: TeachVideo, key: 'video-manage'},
    ],
    bottom: [
      {component: VideoSurveillance, key: 'video-manage'}
    ],
    top: []
  }
};


onMounted(async () => {
  // 监听地图播放完成，执行事件
  emitter.$on("mapPlayComplete", handleMapPlayComplete);
  // 监听全屏事件
  emitter.$on("openFullscreen", handleOpenFullscreen);
  // 监听监控弹窗事件
  emitter.$on("showMonitorPopup", handleShowMonitorPopup);
  await sleep(1000);
  const activeMenuItem = [...headerConfig.leftMenuItems, ...headerConfig.rightMenuItems]
      .find(item => item.isActive);
  state.menuIndex = activeMenuItem ? activeMenuItem.index : 0;
  // 初始化资源
  initAssets(async () => {
    // 加载地图
    emitter.$emit("loadMap", assets.value);
    //渲染标记点
    renderMarkersByStatus();

    // 隐藏loading
    await hideLoading();
    // 播放场景
    mapSceneRef.value.play();
  });
});

onBeforeUnmount(() => {
  emitter.$off("mapPlayComplete", handleMapPlayComplete);
  emitter.$off("openFullscreen", handleOpenFullscreen);
  emitter.$off("showMonitorPopup", handleShowMonitorPopup);
});

// 初始化加载资源
function initAssets(onLoadCallback) {
  assets.value = new Assets();
  // 资源加载进度
  let params = {
    progress: 0,
  };
  assets.value.instance.on("onProgress", (path, itemsLoaded, itemsTotal) => {
    let p = Math.floor((itemsLoaded / itemsTotal) * 100);
    gsap.to(params, {
      progress: p,
      onUpdate: () => {
        state.progress = Math.floor(params.progress);
      },
    });
  });
  // 资源加载完成
  assets.value.instance.on("onLoad", () => {
    onLoadCallback && onLoadCallback();
  });
}

// 隐藏loading
async function hideLoading() {
  return new Promise((resolve, reject) => {
    let tl = gsap.timeline();
    tl.to(".loading-text span", {
      y: "200%",
      opacity: 0,
      ease: "power4.inOut",
      duration: 2,
      stagger: 0.2,
    });
    tl.to(
        ".loading-progress",
        {opacity: 0, ease: "power4.inOut", duration: 2},
        "<"
    );
    tl.to(
        ".loading",
        {
          opacity: 0,
          ease: "power4.inOut",
          onComplete: () => {
            resolve();
          },
        },
        "-=1"
    );
  });
}

function handleMenuSelect({item, index}) {
  console.log('菜单切换:', item.label, '索引:', item.index);
  state.menuIndex = item.index;
  const menuConfig = [
    {key: "overview", label: "综合概览"},
    {key: "industry", label: "产业体系"},
    {key: "production", label: "生产体系"},
    {key: "operation", label: "经营体系"}
  ];
  // 更新所有菜单项的激活状态
  headerConfig.leftMenuItems.forEach(menuItem => {
    menuItem.isActive = menuItem.index === item.index;
  });
  headerConfig.rightMenuItems.forEach(menuItem => {
    menuItem.isActive = menuItem.index === item.index;
  });
  emitter.$emit("dashboard:menu-change", menuConfig[index]);
  nextTick(() => {
    animateMenuComponents();
  });
}

function animateMenuComponents() {
  // 延迟执行，确保DOM元素已经渲染
  setTimeout(() => {
    // 检查元素是否存在
    let leftCards = gsap.utils.toArray(".left-card");
    let rightCards = gsap.utils.toArray(".right-card");

    // 如果元素不存在，直接返回
    if (leftCards.length === 0 && rightCards.length === 0) {
      console.warn("No card elements found for animation");
      return;
    }

    // 重置组件位置和透明度
    if (leftCards.length > 0) {
      gsap.set(leftCards, {
        x: 0,
        opacity: 0
      });
    }

    if (rightCards.length > 0) {
      gsap.set(rightCards, {
        x: 0,
        opacity: 0
      });
    }

    // 延迟一帧后执行动画
    requestAnimationFrame(() => {
      // 左侧组件动画
      if (leftCards.length > 0) {
        gsap.to(leftCards, {
          x: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out"
        });
      }

      // 右侧组件动画
      if (rightCards.length > 0) {
        gsap.to(rightCards, {
          x: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out"
        });
      }
    });
  }, 100); // 延迟100ms确保DOM元素已渲染
}

// 地图开始动画播放完成
function handleMapPlayComplete() {
  let tl = gsap.timeline({paused: false});
  let leftCards = gsap.utils.toArray(".left-card");
  let rightCards = gsap.utils.toArray(".right-card");
  let countCards = gsap.utils.toArray(".count-card");
  let leftZsline = document.querySelector(".large-screen-map-left-zsline");
  let rightZsline = document.querySelector(".large-screen-map-right-zsline");
  tl.addLabel("start", 0.5);
  tl.addLabel("menu", 0.5);
  tl.addLabel("card", 1);
  tl.addLabel("countCard", 3);

  tl.fromTo(
      leftZsline,
      {x: 200, opacity: 0},
      {x: 0, opacity: 1, duration: 1, ease: "power4.out"},
      "start"
  );
  tl.fromTo(
      rightZsline,
      {x: -200, opacity: 0},
      {x: 0, opacity: 1, duration: 1, ease: "power4.out"},
      "start"
  );
  tl.to(
      ".m-header",
      {y: 0, opacity: 1, duration: 1.5, ease: "power4.out"},
      "start"
  );

  tl.to(
      leftCards,
      {x: 0, opacity: 1, stagger: 0.2, duration: 1.5, ease: "power4.out"},
      "card"
  );
  tl.to(
      rightCards,
      {x: 0, opacity: 1, stagger: 0.2, duration: 1.5, ease: "power4.out"},
      "card"
  );
  tl.to(
      countCards,
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 1.5,
        ease: "power4.out",
      },
      "card"
  );
}

// 创建柱状图（支持分类）
function createBar(data, type) {
  emitter.$emit("createBar", {data, type});
}

// 创建庭院双柱状图
function createCourtyardDualBar(data) {
  emitter.$emit("createCourtyardDualBar", data);
}

// 创建动态点位
function createPoint(data, type) {
  emitter.$emit("createPoint", data, type);
}

// 创建路径
function createPath() {
  // 请求路径，渲染线条
  let path1 = pathPointData.path1;
  let path2 = pathPointData.path2;
  // 创建路径
  emitter.$emit("createPath", path1);
  emitter.$emit("createPath", path2);
}

// 创建热力图
function createHeatmap() {
  emitter.$emit("createHeatmap");
}

// 创建庭院标签
function createCourtyardLabel() {
  emitter.$emit("createCourtyardLabel", cityData);
}

// 销毁庭院标签
function destroyCourtyardLabel() {
  emitter.$emit("destroyCourtyardLabel");
}

function renderMarkersByStatus() {
  const {park, center, base, courtyard, kiloton} = state.bottomMenuStatus;
  // console.log('renderMarkersByStatus 状态:', {park, center, base, courtyard, kiloton});

  if (park) {
    console.log('创建园区点位，数据:', parkData);
    createPoint(parkData, 'park');
  }
  if (center) {
    console.log('创建中心点位，数据:', centerData);
    createPoint(centerData, 'center');
  }
  if (base) {
    console.log('创建基地点位，数据:', baseData);
    createPoint(baseData, 'base');
  }
  if (courtyard) {
    console.log('创建庭院点位，数据:', cityData);
    createCourtyardLabel()
  }
  if (kiloton) {
    console.log('创建千吨加工点位，数据:', kilotonData);
    createPoint(kilotonData, 'kiloton');
  }
}

//操作菜单
function changeMenu(type) {
  const allTypes = ["park", "center", "base", "kiloton", "courtyard"];

  const destroyActions = {
    park: () => {
      emitter.$emit("destroyPoint", 'park');
    },
    center: () => {
      emitter.$emit("destroyPoint", 'center');
    },
    base: () => {
      emitter.$emit("destroyPoint", 'base');
    },
    courtyard: () => {
      emitter.$emit("destroyBar", 'courtyard');
    },
    kiloton: () => {
      emitter.$emit("destroyPoint", 'kiloton');
    },
  };
  const createActions = {
    park: () => {
      console.log("创建园区");
      createPoint(parkData, "park");
    },
    center: () => {
      console.log("创建中心");
      createPoint(centerData, "center");
    },
    base: () => {
      console.log("创建基地", "base");
      createPoint(baseData, "base");
    },
    courtyard: async () => {
      console.log("创建庭院");
      try {
        // 获取庭院数据（包含静态经纬度信息）
        const courtyardData = await getCourtyardCountByTownship();
        console.log("庭院数据:", courtyardData);
        createCourtyardDualBar(courtyardData);
      } catch (error) {
        console.error("获取庭院数据失败:", error);
      }
    },
    kiloton: () => {
      console.log("创建千吨加工");
      createPoint(kilotonData, "kiloton");
    },
  };
  const getCNType = (type) => {
    let zhType = null;
    switch (type) {
      case "center":
        zhType = "中心";
        break;
      case "park":
        zhType = "园区";
        break;
      case "base":
        zhType = "基地";
        break;
      case "kiloton":
        zhType = "千吨加工";
        break;
      default:
        zhType = null;
        break;
    }
    return zhType;
  }
  if (type === "all") {
    // 切换 all 状态,同步所有子项状态
    state.bottomMenuStatus.all = !state.bottomMenuStatus.all;
    allTypes.forEach(item => {
      if (item === "park") {
        state.bottomMenuStatus.park = false;
        emitter.$emit("destroyPoint", 'park');
        return;
      }
      state.bottomMenuStatus[item] = state.bottomMenuStatus.all;
      if (state.bottomMenuStatus.all) {
        emitter.$emit("typeSelected", {type: ""});
        createActions[item] && createActions[item]();
      } else {
        destroyActions[item] && destroyActions[item]();
      }
    });

  } else {
    // 1. 关闭 all
    state.bottomMenuStatus.all = false;
    // 2. 关闭并销毁其他所有项
    allTypes.forEach(item => {
      if (item !== type && state.bottomMenuStatus[item]) {
        state.bottomMenuStatus[item] = false;
        destroyActions[item] && destroyActions[item]();
      }
    });

    // 3. 切换当前项状态
    const wasActive = state.bottomMenuStatus[type];
    state.bottomMenuStatus[type] = !wasActive;
    if (state.bottomMenuStatus[type]) {
      const typeCN = getCNType(type);
      emitter.$emit("typeSelected", {type: typeCN});
      createActions[type] && createActions[type]();
    } else {
      destroyActions[type] && destroyActions[type]();
      const anyActive = allTypes.some(item => state.bottomMenuStatus[item]);
      if (!anyActive) {
        state.bottomMenuStatus[type] = true;
        createActions[type] && createActions[type]();
        const typeCN = getCNType(type);
        emitter.$emit("typeSelected", {type: typeCN});

      }
    }
  }
}

// 处理打开全屏
function handleOpenFullscreen(data) {
  console.log('打开全屏，接收到的数据:', data);
  state.fullscreenData = data;
  state.showFullscreen = true;
  // 阻止页面滚动
  document.body.style.overflow = 'hidden';
}

// 关闭全屏
function closeFullscreen() {
  state.showFullscreen = false;
  state.fullscreenData = {};
  // 恢复页面滚动
  document.body.style.overflow = 'auto';
}

// 处理显示监控弹窗
function handleShowMonitorPopup(data) {
  state.monitorPopupData = data;
  state.showMonitorPopup = data.visible;
  // 阻止页面滚动
  if (data.visible) {
    document.body.style.overflow = 'hidden';
  }
}

// 关闭监控弹窗
function closeMonitorPopup() {
  state.showMonitorPopup = false;
  state.monitorPopupData = {};
  // 恢复页面滚动
  document.body.style.overflow = 'auto';
}

// 获取视频播放器URL
function getVideoPlayerUrl(streamAddress) {
  console.log('处理视频流地址:', streamAddress);
  
  if (!streamAddress) {
    console.log('视频流地址为空');
    return '';
  }
  
  // 如果已经是完整的播放器URL，直接返回
  if (streamAddress.includes('player.html')) {
    console.log('使用现有播放器URL:', streamAddress);
    return streamAddress;
  }
  
  // 如果是包含复杂参数的完整播放URL（从监控store来的），直接返回
  if (streamAddress.includes('showIntercom') || streamAddress.includes('deviceId') || streamAddress.includes('token')) {
    console.log('使用复杂参数URL:', streamAddress);
    return streamAddress;
  }
  
  // 如果是原始流地址，包装成播放器URL
  const playerUrl = `https://source.alink.link:48888/video/stream-media/player.html?url=${encodeURIComponent(streamAddress)}`;
  console.log('包装后的播放器URL:', playerUrl);
  return playerUrl;
}

</script>

<style lang="scss">
@use "~@/assets/style/home.scss";

.m-header-weather,
.m-header-date {
  span {
    padding-right: 10px;
    color: #c4f3fe;
    font-size: 18px;
  }
}

.top-menu {
  position: absolute;
  left: 0px;
  right: 0px;
  top: 40px;
  z-index: 3;
  display: flex;
  justify-content: center;

  .top-menu-mid-space {
    width: 800px;
  }
}

.bottom-radar {
  position: absolute;
  right: 500px;
  bottom: 100px;
  z-index: 3;
}

.main-btn-group {
  display: flex;
  left: 50%;
  transform: translateX(-50%);
  bottom: 10px;
  z-index: 999;

  &.disabled {
    pointer-events: none;
  }

  .btn {
    margin-right: 10px;
  }
}

.bottom-svg-line-left,
.bottom-svg-line-right {
  position: absolute;
  right: 50%;
  width: 721px;
  height: 57px;
  margin-right: -5px;
  bottom: -21px;
}

.bottom-svg-line-right {
  transform: scaleX(-1);
  left: 50%;
  right: inherit;
  margin-right: inherit;
  margin-left: -5px;
}

/* 初始化动画开始位置 */
.m-header {
  transform: translateY(-100%);
  opacity: 0;
}

.top-menu {
  transform: translateY(-250%);
  opacity: 0;
}

.count-card {
  transform: translateY(150%);
  opacity: 0;
}

.left-card {
  transform: translateX(-150%);
  opacity: 0;
}

.right-card {
  transform: translateX(150%);
  opacity: 0;
}

.bottom-tray {
  transform: translateY(100%);
  opacity: 0;
}

.tool-menu {
  position: absolute;
  left: 220px;

  .btn-icon {
    width: 64px;
    height: 64px;
  }

  &-item {
    pointer-events: all;
    cursor: pointer;
    width: 200px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
    transition: all 0.3s;
    background: url("~@/assets/images/icon_slices/icon32.png") no-repeat;
    background-size: 100% 100%;

    img {
      width: 80px;
      height: 80px;
    }

    span {
      font-size: 28px;
      color: rgb(255, 255, 255, 0.5);
      transition: all 0.3s;
      font-family: "微软雅黑", Helvetica, sans-serif;
    }

    &.active {
      background: url("~@/assets/images/icon_slices/icon31.png") no-repeat;
      background-size: 100% 100%;

      span {
        color: rgb(255, 255, 255, 0.8);
      }
    }
  }
}

// 全屏模态框样式
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .fullscreen-content {
    width: 3840px;
    height: 2160px;
    background: linear-gradient(135deg, rgba(13, 32, 64, 0.95) 0%, rgba(25, 50, 100, 0.95) 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 2px solid #40AFFD;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    position: relative;
    transform-origin: center center;

    .fullscreen-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 40px 60px;
      background: rgba(64, 175, 253, 0.1);
      border-bottom: 1px solid rgba(64, 175, 253, 0.3);
      height: 120px;
      box-sizing: border-box;
      flex-shrink: 0;

      .fullscreen-title {
        color: #FFFFFF;
        font-size: 48px;
        font-weight: 700;
        margin: 0;
        background: -webkit-linear-gradient(rgb(234, 247, 255), rgb(121, 191, 249));
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .close-btn {
        background: rgba(255, 77, 77, 0.2);
        border: 2px solid #FF4D4D;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;

        &:hover {
          background: rgba(255, 77, 77, 0.4);
          transform: scale(1.1);
        }

        .close-icon {
          width: 40px;
          height: 40px;
        }
      }
    }

    .fullscreen-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: 100%;
      height: calc(100% - 120px); /* 减去header高度 */

      .fullscreen-iframe-container {
        flex: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3840px;
        height: 2160px;

        .fullscreen-iframe {
          width: 3840px;
          height: 2160px;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }

        .no-video {
          color: #ABCCFF;
          font-size: 36px;
          text-align: center;
          padding: 80px;
        }
      }
    }
  }
}

.fullscreen-modal * {
  box-sizing: border-box;
}

body:has(.fullscreen-modal) {
  overflow: hidden;
}
</style>

