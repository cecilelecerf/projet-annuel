import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/fonts.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/meeting.scss'
import './styles/layout.scss'
import router from './router/index'
import { useAuthStore } from './stores/authStore'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'

import 'leaflet/dist/leaflet.css'

const app = createApp(App)
app.use(createPinia())
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
const { init } = useAuthStore()
await init()

app.use(router)
app.use(Toast, {
  position: 'bottom-center',
  timeout: 4000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: true,
  maxToasts: 5,
  newestOnTop: true,
})

app.mount('#app')
