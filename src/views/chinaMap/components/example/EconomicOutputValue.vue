<template>
  <div class="right-card" ref="cardRef">
    <m-card title="各经济产值" :height="height">
      <div class="earth-label">
        <mEarthLabel></mEarthLabel>
      </div>
    </m-card>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from "vue";

import mCard from "@/components/mCard/index.vue";
import mEarthLabel from "@/components/mEarthLabel/index.vue";

const cardRef = ref(null);
const height = ref(280);
const state = reactive({});

onMounted(() => {});
onBeforeUnmount(() => {});
</script>
<style lang="scss">
.earth-label {
  display: flex;
  height: 100%;
}
</style>
