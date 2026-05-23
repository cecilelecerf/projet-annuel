import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/fonts.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/meeting.scss'
import router from './router/index'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
app.use(createPinia())
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
const { init } = useAuthStore()
await init()

app.use(router)

app.mount('#app')
