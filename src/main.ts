import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'highlight.js/styles/github-dark.css'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'
import { initTheme } from './utils/theme'

const app = createApp(App)
const head = createHead()

initTheme()

app.use(createPinia())
app.use(ElementPlus)
app.use(router)
app.use(head)
app.mount('#app')
