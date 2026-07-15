import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/fonts.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/meeting.scss'
// ElMessageBox est appelé de façon impérative (JS), donc jamais détecté par le résolveur
// d'auto-import de composants — son style doit être importé manuellement.
import 'element-plus/theme-chalk/src/message-box.scss'
import './styles/layout.scss'
import router from './router/index'
import { useAuthStore } from './stores/authStore'
import { initMatomo } from './lib/matomo'
import { initSentry } from './lib/sentry'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { clickOutside } from './directives/clickOutside'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'

import 'leaflet/dist/leaflet.css'

initMatomo()

const app = createApp(App)
initSentry(app, router)
app.use(createPinia())
app.directive('click-outside', clickOutside)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
const { init } = useAuthStore()
await init()

app.use(router)
app.use(Toast, {
  position: 'top-center',
  timeout: 4000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: true,
  maxToasts: 5,
  newestOnTop: true,
})

app.mount('#app')
