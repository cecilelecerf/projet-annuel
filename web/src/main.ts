import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/element/index.scss'
import './styles/fonts.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
app.use(createPinia())
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
