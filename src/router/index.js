import { createRouter, createWebHashHistory } from "vue-router";

const chinaMap = () => import("@/views/chinaMap/index.vue");
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/chinaMap",
      component: chinaMap,
    },
    {
      path: "/chinaMap",
      component: chinaMap,
    },
   

    {
      path: "/:pathMatch(.*)",
      redirect: "/",
    },
  ],
});

export default router;
