<script setup>
import mCard from "@/components/mCard/index.vue";
import {onMounted, ref} from "vue";
import {fetchTeachVideoList} from "@/api/api.js";

const height = ref(655);
const teachVideoList = ref([]);
const currentIndex = ref(0);

onMounted(() => {
  fetchTeachVideoList().then(res => {
    // console.log(res[0]?.title, res[0]?.videoUrl);
    teachVideoList.value = res;
  }).catch(err => {
    console.error("获取教学视频失败：", err);
  });
});

// 切换到上一个视频
const prevVideo = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

// 切换到下一个视频
const nextVideo = () => {
  if (currentIndex.value < teachVideoList.value.length - 1) {
    currentIndex.value++;
  }
};

// 计算当前显示的标题（可选，比如显示视频标题）
const currentTitle = () => {
  return teachVideoList.value[currentIndex.value]?.title || '视频加载中...';
};

// 获取当前视频 URL
const currentVideoUrl = () => {
  return teachVideoList.value[currentIndex.value]?.videoUrl || '';
};
</script>

<template>
  <div class="left-card">
    <m-card title="教学视频" :height="height">
      <div class="video-container" v-if="teachVideoList.length > 0">
        <div class="title-panel">
          <img
              src="@/assets/images/icon_slices/left-icon.png"
              alt="上一个"
              class="icon"
              @click="prevVideo"
              :style="{ opacity: currentIndex === 0 ? 0.3 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }"
          />
          <span>{{ currentIndex + 1 }} / {{ teachVideoList.length }}</span>
          <img
              src="@/assets/images/icon_slices/right-icon.png"
              alt="下一个"
              class="icon"
              @click="nextVideo"
              :style="{ opacity: currentIndex === teachVideoList.length - 1 ? 0.3 : 1, cursor: currentIndex === teachVideoList.length - 1 ? 'not-allowed' : 'pointer' }"
          />
        </div>
        <div class="video-panel">
          <video
              :src="currentVideoUrl()"
              controls
              class="video-player"
              @loadeddata="console.log('视频加载完成')"
              @error="console.error('视频加载失败')"
          ></video>
        </div>
      </div>
      <div v-else class="empty-tip">
        暂无教学视频
      </div>
    </m-card>
  </div>
</template>

<style scoped>
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  pointer-events: all;



  .title-panel {
    width: 820px;
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
  }

  .title-panel .icon {
    width: 80px;
    height: 80px;
    margin: 0 10px;
    transition: opacity 0.3s;
  }

  .title-panel span {
    font-size: 28px;
    font-weight: 600;
    color: #ffffff;
    text-align: center;
  }

  .video-panel {
    width: 820px;
    height: 400px;
  }

  .video-panel .video-player {
    width: 100%;
    height: 100%;
    background-color: #000;
  }
}
.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: all;
  color: #7ca0c7;
  font-style: italic;
}
</style>