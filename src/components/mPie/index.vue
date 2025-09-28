<template>
  <div class="three-pie-wrap">
    <div class="three-pie" ref="pieDom">
      <canvas id="three-pie"></canvas>
    </div>
    <div class="three-pie-slot">
      <slot v-bind:data="currentData"></slot>
    </div>
  </div>
</template>

<script setup>
import { onMounted,onBeforeUnmount,nextTick, computed, reactive, watch } from "vue";
import { App } from "./index.js";
const props = defineProps({
  data: {
    type:Array,
    default:()=>[]
  },
  delay:{
    type:Number,
    default:5000,
  },
  colors:{
    type:Array,
    default:()=>[]
  },
  opacity:{
    type:Number,
    default:1,
  },
})

const state = reactive({
  activeIndex:0,
  ready:0,
})
let app = null;
// 当前数据
const currentData = computed(()=>{
  return {
        ...props.data[state.activeIndex],
        count: props.data.map((item) => item.value).reduce((prev, current) => prev + current, 0),
      }
})
watch(()=>props.data,(val)=>{
  if(val.length){
    state.ready++
    if(state.ready>1){
      app.createPie(val)
    }
   
  }
},{immediate:true})
onMounted(()=>{
  nextTick(() => {
    
    app = new App(document.querySelector("#three-pie"),{
      opacity:props.opacity,
      delay:props.delay,
      colors:props.colors
    });
    app.on('pieRingIndex',(index)=>{
      state.activeIndex = index
      
    })
    state.ready++
    if(state.ready>1){
      app.createPie(props.data)
    }
    
  });
})
onBeforeUnmount(() => {
  app && app.destroy();
});
</script>

<style>
.three-pie-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
  font-size: 34px;
}
.three-pie {
  width: 100%;
  height: 100%;
}
.three-pie-slot {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
