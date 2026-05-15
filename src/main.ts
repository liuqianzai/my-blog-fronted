import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElPagination } from 'element-plus'
import 'element-plus/theme-chalk/el-pagination.css'
import './assets/styles/main.css' // 引入刚写的 Tailwind 样式
import App from './App.vue'
import router from './router'
const app = createApp(App)

app.use(createPinia())
app.use(ElPagination)
app.use(router)
app.mount('#app')
