import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/fonts.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/meeting.scss'
// ElMessageBox est appelé de façon impérative (JS), donc jamais détecté par le résolveur
// d'auto-import de composants — son style doit être importé manuellement.
import 'element-plus/theme-chalk/src/message-box.scss'
import router from './router/index'
import { useAuthStore } from './stores/authStore'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { clickOutside } from './directives/clickOutside'

const app = createApp(App)
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
