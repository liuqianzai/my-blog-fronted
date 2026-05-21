# 博客前端功能完善设计文档

> 日期：2026-05-21
> 项目：my-blog-frontend
> 作者：AI Assistant

## 概述

基于现有 Vue 3 + TypeScript + Vite 5 博客前端项目，完善 6 个核心功能模块，使其能够完整对接后端 API，提供良好的用户体验。

## 功能清单

| 序号 | 功能 | 优先级 | 依赖 |
|------|------|--------|------|
| ① | Markdown 渲染 | 高 | 无 |
| ② | 路由守卫 + 权限 | 高 | 无 |
| ③ | 错误处理 + 用户体验 | 高 | ② |
| ④ | Markdown 编辑器 | 中 | ①⑤ |
| ⑤ | 文件上传 | 中 | 无 |
| ⑥ | SEO + 性能优化 | 低 | 无 |

---

## ① Markdown 渲染

### 技术选型

- **解析器**：markdown-it（功能丰富，插件生态强大）
- **代码高亮**：highlight.js（支持 200+ 语言）
- **XSS 防护**：dompurify（防止 XSS 攻击）

### 实现方案

1. **安装依赖**
   ```bash
   npm install markdown-it highlight.js dompurify
   npm install -D @types/markdown-it @types/dompurify
   ```

2. **创建工具函数** `src/utils/markdown.ts`
   ```typescript
   import MarkdownIt from 'markdown-it'
   import hljs from 'highlight.js'
   import DOMPurify from 'dompurify'
   
   const md = new MarkdownIt({
     highlight: (str, lang) => {
       if (lang && hljs.getLanguage(lang)) {
         return hljs.highlight(str, { language: lang }).value
       }
       return ''
     }
   })
   
   export function renderMarkdown(content: string): string {
     return DOMPurify.sanitize(md.render(content))
   }
   ```

3. **修改文章详情页** `src/views/article/ArticleDetail.vue`
   - 导入 `renderMarkdown` 函数
   - 使用 `v-html="renderMarkdown(article.content)"` 渲染正文
   - 图片添加 `loading="lazy"` 属性

4. **样式支持**
   - 引入 highlight.js 主题 CSS（如 github-dark）
   - 为代码块添加行号、复制按钮

### 文件变更

- 新增：`src/utils/markdown.ts`
- 修改：`src/views/article/ArticleDetail.vue`
- 修改：`src/main.ts`（引入 highlight.js CSS）

---

## ② 路由守卫 + 权限

### 技术选型

- **方案**：全局前置守卫（router.beforeEach）
- **存储**：Pinia store + localStorage 持久化

### 实现方案

1. **修改路由配置** `src/router/index.ts`
   ```typescript
   router.beforeEach((to, from, next) => {
     const auth = useAuthStore()
     
     // 前台页面无需认证
     if (!to.path.startsWith('/admin') && to.path !== '/login') {
       return next()
     }
     
     // 已登录禁止访问 /login
     if (to.path === '/login' && auth.isAuthenticated) {
       return next('/admin')
     }
     
     // /admin/** 需要登录
     if (to.path.startsWith('/admin') && !auth.isAuthenticated) {
       return next('/login')
     }
     
     next()
   })
   ```

2. **移除 AdminLayout 中的认证检查**
   - 删除 `if (!auth.isAuthenticated)` 判断（已由路由守卫处理）

### 文件变更

- 修改：`src/router/index.ts`
- 修改：`src/views/admin/AdminLayout.vue`

---

## ③ 错误处理 + 用户体验

### 技术选型

- **错误提示**：Element Plus ElMessage
- **骨架屏**：自定义 CSS 骨架屏组件
- **404 页面**：Vue Router 通配符路由
- **网络重试**：Axios 拦截器 + 重试逻辑

### 实现方案

1. **增强 Axios 拦截器** `src/utils/request.ts`
   ```typescript
   // 响应拦截器增强
   request.interceptors.response.use(
     (res) => { /* 现有逻辑 */ },
     (err) => {
       if (err.response) {
         const { status } = err.response
         switch (status) {
           case 401: ElMessage.error('登录已过期，请重新登录'); break
           case 403: ElMessage.error('没有权限访问'); break
           case 404: ElMessage.error('请求的资源不存在'); break
           case 500: ElMessage.error('服务器内部错误'); break
         }
       } else {
         ElMessage.error('网络连接失败，请检查网络')
       }
       return Promise.reject(err)
     }
   )
   ```

2. **创建骨架屏组件** `src/components/Skeleton.vue`
   - 接受 `lines` 和 `avatar` props
   - 使用 CSS 动画实现闪烁效果

3. **创建 404 页面** `src/views/NotFound.vue`
   - 友好的 404 提示
   - 返回首页按钮

4. **添加 404 路由**
   ```typescript
   { path: '/:pathMatch(.*)*', component: () => import('../views/NotFound.vue') }
   ```

5. **全局 Loading 状态**
   - 在 Axios 拦截器中管理 loading 计数
   - 使用 Element Plus ElLoading 服务

### 文件变更

- 修改：`src/utils/request.ts`
- 新增：`src/components/Skeleton.vue`
- 新增：`src/views/NotFound.vue`
- 修改：`src/router/index.ts`

---

## ④ Markdown 编辑器

### 技术选型

- **编辑器**：md-editor-v3（Vue 3 专用）
- **功能**：工具栏、实时预览、快捷键、图片粘贴上传

### 实现方案

1. **安装依赖**
   ```bash
   npm install md-editor-v3
   ```

2. **创建编辑器组件** `src/components/MarkdownEditor.vue`
   ```vue
   <template>
     <MdEditor
       v-model="content"
       :theme="theme"
       @onUploadImg="handleUploadImg"
     />
   </template>
   
   <script setup lang="ts">
   import { ref } from 'vue'
   import { MdEditor } from 'md-editor-v3'
   import 'md-editor-v3/lib/style.css'
   import { uploadImage } from '../api/file'
   
   const props = defineProps<{ modelValue: string }>()
   const emit = defineEmits(['update:modelValue'])
   const content = ref(props.modelValue)
   const theme = ref<'light' | 'dark'>('light')
   
   async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
     const urls = await Promise.all(files.map(f => uploadImage(f)))
     callback(urls.map(u => u.url))
   }
   </script>
   ```

3. **修改文章创建/编辑表单** `src/views/admin/AdminArticleForm.vue`
   - 替换 textarea 为 MarkdownEditor 组件
   - 使用 v-model 双向绑定

### 文件变更

- 新增：`src/components/MarkdownEditor.vue`
- 修改：`src/views/admin/AdminArticleForm.vue`
- 修改：`src/main.ts`（引入 md-editor-v3 CSS）

---

## ⑤ 文件上传

### 技术选型

- **组件**：Element Plus el-upload
- **接口**：POST /files/images

### 实现方案

1. **创建上传 API** `src/api/file.ts`
   ```typescript
   export const uploadImage = async (file: File) => {
     const formData = new FormData()
     formData.append('file', file)
     return request.post<any, { url: string; filename: string }>('/files/images', formData)
   }
   ```

2. **创建封面上传组件** `src/components/CoverUpload.vue`
   ```vue
   <template>
     <el-upload
       :action="''"
       :http-request="handleUpload"
       :show-file-list="false"
       :before-upload="beforeUpload"
     >
       <img v-if="modelValue" :src="modelValue" class="cover-preview" />
       <el-icon v-else class="upload-icon"><Plus /></el-icon>
     </el-upload>
   </template>
   ```

3. **修改文章表单**
   - 添加封面上传组件
   - 支持拖拽上传、进度条、预览

### 文件变更

- 新增：`src/api/file.ts`
- 新增：`src/components/CoverUpload.vue`
- 修改：`src/views/admin/AdminArticleForm.vue`

---

## ⑥ SEO + 性能优化

### 技术选型

- **SEO**：@vueuse/head（组合式 API）
- **性能**：路由懒加载、图片懒加载、API 缓存、Gzip 压缩

### 实现方案

1. **安装依赖**
   ```bash
   npm install @vueuse/head
   ```

2. **配置 head 管理** `src/main.ts`
   ```typescript
   import { createHead } from '@vueuse/head'
   const head = createHead()
   app.use(head)
   ```

3. **页面级 SEO 配置**
   ```typescript
   // 文章详情页
   useHead({
     title: () => article.value?.title || '文章详情',
     meta: [
       { name: 'description', content: () => article.value?.summary || '' },
       { name: 'keywords', content: () => article.value?.tags?.map(t => t.name).join(',') || '' }
     ]
   })
   ```

4. **路由懒加载**（已实现）
   - 所有路由组件已使用 `() => import()` 动态导入

5. **图片懒加载**
   - 文章列表和详情页的图片添加 `loading="lazy"`

6. **API 缓存**
   - 分类、标签数据使用 Pinia store 缓存
   - 首次加载后不再重复请求

7. **Gzip 压缩** `vite.config.ts`
   ```typescript
   import viteCompression from 'vite-plugin-compression'
   
   export default defineConfig({
     plugins: [vue(), viteCompression()]
   })
   ```

### 文件变更

- 修改：`src/main.ts`
- 修改：`src/views/article/ArticleDetail.vue`
- 修改：`src/views/home/Home.vue`
- 修改：`vite.config.ts`
- 新增：`src/store/category.ts`（缓存分类数据）
- 新增：`src/store/tag.ts`（缓存标签数据）

---

## 实现顺序

```
① Markdown 渲染
   ↓
② 路由守卫
   ↓
③ 错误处理 + 用户体验
   ↓
⑤ 文件上传
   ↓
④ Markdown 编辑器（依赖 ①⑤）
   ↓
⑥ SEO + 性能优化
```

## 依赖清单

```bash
npm install markdown-it highlight.js dompurify md-editor-v3 @vueuse/head vite-plugin-compression
npm install -D @types/markdown-it @types/dompurify
```

## 预估工作量

| 功能 | 预估时间 |
|------|----------|
| ① Markdown 渲染 | 30 分钟 |
| ② 路由守卫 | 15 分钟 |
| ③ 错误处理 + 用户体验 | 45 分钟 |
| ④ Markdown 编辑器 | 30 分钟 |
| ⑤ 文件上传 | 30 分钟 |
| ⑥ SEO + 性能优化 | 30 分钟 |
| **总计** | **3 小时** |
