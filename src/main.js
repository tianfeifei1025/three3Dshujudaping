import { createApp } from "vue"
import router from "./router"
import App from "./App.vue"
import Toast, { POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";
import "normalize.css"
import "./style.css"
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import { createPinia } from 'pinia'

const pinia = createPinia()
let app = createApp(App)
app.use(pinia).use(ViewUIPlus).use(router).use(Toast, {
    position: POSITION.TOP_CENTER,
    hideProgressBar: true,
  }).mount("#app")
