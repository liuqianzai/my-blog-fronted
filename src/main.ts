import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import { ElPagination } from 'element-plus'
import 'element-plus/theme-chalk/el-pagination.css'
import 'highlight.js/styles/github-dark.css'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(ElPagination)
app.use(router)
app.use(head)
app.mount('#app')
