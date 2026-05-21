# 博客前端功能完善实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善博客前端 6 个核心功能模块，使其能够完整对接后端 API，提供良好的用户体验。

**Architecture:** 基于现有 Vue 3 + TypeScript + Vite 5 项目，按依赖关系分 6 个阶段实现：Markdown 渲染 → 路由守卫 → 错误处理 → 文件上传 → Markdown 编辑器 → SEO 优化。

**Tech Stack:** Vue 3, TypeScript, Vite 5, Tailwind CSS, Element Plus, Pinia, Vue Router, markdown-it, highlight.js, dompurify, md-editor-v3, @vueuse/head

---

## 文件结构

```
src/
├── utils/
│   └── markdown.ts              # Markdown 渲染工具（新增）
├── components/
│   ├── Skeleton.vue             # 骨架屏组件（新增）
│   ├── MarkdownEditor.vue       # Markdown 编辑器组件（新增）
│   └── CoverUpload.vue          # 封面上传组件（新增）
├── views/
│   ├── NotFound.vue             # 404 页面（新增）
│   ├── article/
│   │   └── ArticleDetail.vue    # 文章详情（修改）
│   ├── home/
│   │   └── Home.vue             # 首页（修改）
│   └── admin/
│       ├── AdminLayout.vue      # 后台布局（修改）
│       └── AdminArticleForm.vue # 文章表单（修改）
├── router/
│   └── index.ts                 # 路由配置（修改）
├── utils/
│   └── request.ts               # Axios 拦截器（修改）
├── store/
│   ├── category.ts              # 分类缓存（新增）
│   └── tag.ts                   # 标签缓存（新增）
├── api/
│   └── file.ts                  # 文件上传 API（新增）
└── main.ts                      # 应用入口（修改）

vite.config.ts                   # Vite 配置（修改）
```

---

## Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 Markdown 渲染依赖**

```bash
npm install markdown-it highlight.js dompurify
npm install -D @types/markdown-it @types/dompurify
```

- [ ] **Step 2: 安装编辑器和 SEO 依赖**

```bash
npm install md-editor-v3 @vueuse/head vite-plugin-compression
```

- [ ] **Step 3: 验证安装**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json
git commit -m "feat: 添加 markdown-it、highlight.js、md-editor-v3、@vueuse/head 等依赖"
```

---

## Task 2: Markdown 渲染工具

**Files:**
- Create: `src/utils/markdown.ts`

- [ ] **Step 1: 创建 Markdown 渲染工具**

```typescript
// src/utils/markdown.ts
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch {
        // ignore
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

export function renderMarkdown(content: string): string {
  if (!content) return ''
  const html = md.render(content)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
  })
}
```

- [ ] **Step 2: 验证文件创建成功**

```bash
ls src/utils/markdown.ts
```

Expected: 文件存在

- [ ] **Step 3: 提交**

```bash
git add src/utils/markdown.ts
git commit -m "feat: 添加 Markdown 渲染工具（markdown-it + highlight.js + DOMPurify）"
```

---

## Task 3: 更新文章详情页使用 Markdown 渲染

**Files:**
- Modify: `src/views/article/ArticleDetail.vue`

- [ ] **Step 1: 更新 ArticleDetail.vue 模板**

替换 `src/views/article/ArticleDetail.vue` 中的 `renderedContent` 计算属性和样式：

```vue
<template>
  <div class="max-w-3xl mx-auto py-8" v-if="article">
    <div class="mb-8">
      <h1 class="text-4xl font-extrabold text-text-main leading-tight">{{ article.title }}</h1>
      <div class="flex items-center gap-4 mt-4 text-sm text-text-sub">
        <span>{{ article.createTime?.slice(0, 10) }}</span>
        <span>{{ article.viewCount }} 阅读</span>
        <span v-if="article.category">{{ article.category.name }}</span>
      </div>
      <div class="flex flex-wrap gap-2 mt-4" v-if="article.tags?.length">
        <span v-for="tag in article.tags" :key="tag.id"
              class="px-3 py-1 rounded-full text-xs font-bold"
              :style="{ color: tag.color, background: tag.color + '18' }">
          {{ tag.name }}
        </span>
      </div>
    </div>

    <article class="prose max-w-none" v-html="renderedContent"></article>

    <!-- 评论部分保持不变 -->
    <div class="mt-12 border-t pt-8">
      <h3 class="text-lg font-bold mb-4">发表评论</h3>
      <form @submit.prevent="submitCommentForm" class="space-y-4">
        <div class="flex gap-4">
          <input v-model="commentForm.nickname" placeholder="称呼 *" required
                 class="flex-1 px-4 py-2 border rounded-lg text-sm" />
          <input v-model="commentForm.email" placeholder="邮箱"
                 class="flex-1 px-4 py-2 border rounded-lg text-sm" />
        </div>
        <textarea v-model="commentForm.content" placeholder="评论内容 *" required rows="4"
                  class="w-full px-4 py-2 border rounded-lg text-sm resize-none"></textarea>
        <button type="submit"
                class="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition">
          提交评论
        </button>
      </form>
    </div>

    <div class="mt-8 space-y-4">
      <h3 class="text-lg font-bold">评论（{{ comments.length }}）</h3>
      <div v-for="c in comments" :key="c.id"
           class="p-4 bg-white/60 rounded-xl border">
        <div class="flex items-center gap-2 text-sm">
          <strong>{{ c.nickname }}</strong>
          <span class="text-text-sub">{{ c.createTime?.slice(0, 10) }}</span>
        </div>
        <p class="mt-2 text-sm leading-relaxed">{{ c.content }}</p>
      </div>
      <div v-if="!comments.length" class="text-text-sub text-sm py-8 text-center">暂无评论</div>
    </div>
  </div>

  <div v-else class="text-center py-20 text-text-sub">加载中...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleDetail, type ArticleItem } from '../../api/article'
import { getComments, submitComment, type Comment } from '../../api/comment'
import { renderMarkdown } from '../../utils/markdown'

const route = useRoute()
const article = ref<ArticleItem | null>(null)
const comments = ref<Comment[]>([])

const renderedContent = computed(() => {
  return renderMarkdown(article.value?.content || '')
})

const commentForm = ref({ nickname: '', email: '', content: '' })

async function fetchArticle() {
  const id = Number(route.params.id)
  article.value = await getArticleDetail(id)
}

async function fetchComments() {
  const id = Number(route.params.id)
  const res = await getComments({ articleId: id })
  comments.value = res.records
}

async function submitCommentForm() {
  await submitComment({ articleId: Number(route.params.id), ...commentForm.value })
  commentForm.value = { nickname: '', email: '', content: '' }
  fetchComments()
}

watch(() => route.params.id, () => { fetchArticle(); fetchComments() })
onMounted(() => { fetchArticle(); fetchComments() })
</script>

<style scoped>
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 800;
  color: var(--ink, #172033);
}

.prose :deep(h1) { font-size: 1.8rem; }
.prose :deep(h2) { font-size: 1.5rem; }
.prose :deep(h3) { font-size: 1.25rem; }

.prose :deep(p) {
  margin-top: 0.8em;
  line-height: 1.9;
  color: var(--muted, #68758a);
}

.prose :deep(pre.hljs) {
  margin: 1em 0;
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 0.88rem;
  line-height: 1.6;
}

.prose :deep(code) {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
}

.prose :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 1em 0;
}

.prose :deep(blockquote) {
  border-left: 4px solid var(--blue, #315fbd);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--muted, #68758a);
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5em;
  margin: 0.8em 0;
}

.prose :deep(li) {
  margin: 0.3em 0;
  line-height: 1.8;
}

.prose :deep(a) {
  color: var(--blue, #315fbd);
  text-decoration: underline;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.prose :deep(th),
.prose :deep(td) {
  border: 1px solid var(--soft-line, rgba(105, 119, 141, 0.16));
  padding: 8px 12px;
  text-align: left;
}

.prose :deep(th) {
  background: var(--paper, rgba(255, 255, 255, 0.72));
  font-weight: 700;
}
</style>
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/views/article/ArticleDetail.vue
git commit -m "feat: 文章详情页使用 markdown-it 渲染 Markdown 正文"
```

---

## Task 4: 路由守卫

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/views/admin/AdminLayout.vue`

- [ ] **Step 1: 更新路由配置添加守卫**

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', component: () => import('../views/home/Home.vue') },
        { path: 'article/:id', component: () => import('../views/article/ArticleDetail.vue') },
        { path: 'page/:slug', component: () => import('../views/PageView.vue') },
      ],
    },
    {
      path: '/login',
      component: () => import('../views/login/Login.vue'),
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      redirect: '/admin/dashboard',
      children: [
        { path: 'dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
        { path: 'articles', component: () => import('../views/admin/AdminArticles.vue') },
        { path: 'articles/create', component: () => import('../views/admin/AdminArticleForm.vue') },
        { path: 'articles/:id/edit', component: () => import('../views/admin/AdminArticleForm.vue') },
        { path: 'categories', component: () => import('../views/admin/AdminCategories.vue') },
        { path: 'tags', component: () => import('../views/admin/AdminTags.vue') },
        { path: 'comments', component: () => import('../views/admin/AdminComments.vue') },
        { path: 'pages', component: () => import('../views/admin/AdminPages.vue') },
        { path: 'friend-links', component: () => import('../views/admin/AdminFriendLinks.vue') },
        { path: 'configs', component: () => import('../views/admin/AdminConfigs.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/NotFound.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
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

export default router
```

- [ ] **Step 2: 移除 AdminLayout 中的认证检查**

```vue
<!-- src/views/admin/AdminLayout.vue -->
<template>
  <div class="min-h-screen flex bg-gray-50">
    <aside class="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      <div class="h-14 flex items-center px-5 font-bold tracking-wide border-b border-gray-700">
        <router-link to="/admin/dashboard" class="hover:text-gray-300 transition">Admin Panel</router-link>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition"
          :class="$route.fullPath.startsWith(item.path) ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          <span v-html="item.icon" class="w-5 h-5 text-center" />
          {{ item.label }}
        </router-link>
      </nav>
      <div class="p-3 border-t border-gray-700">
        <p class="text-xs text-gray-500 px-2">v1.0.0</p>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <span class="font-bold text-gray-800 text-base">Liu Yang's Blog</span>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">{{ auth.nickname }}</span>
          <button @click="handleLogout" class="text-sm text-red-500 hover:text-red-700 font-medium transition">退出</button>
        </div>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '&#9632;' },
  { path: '/admin/articles', label: 'Articles', icon: '&#9776;' },
  { path: '/admin/categories', label: 'Categories', icon: '&#9635;' },
  { path: '/admin/tags', label: 'Tags', icon: '&#9830;' },
  { path: '/admin/comments', label: 'Comments', icon: '&#9993;' },
  { path: '/admin/pages', label: 'Pages', icon: '&#9641;' },
  { path: '/admin/friend-links', label: 'Friend Links', icon: '&#8861;' },
  { path: '/admin/configs', label: 'Configs', icon: '&#9881;' },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add src/router/index.ts src/views/admin/AdminLayout.vue
git commit -m "feat: 添加全局路由守卫，/admin 需要登录，/login 已登录禁止访问"
```

---

## Task 5: 错误处理增强

**Files:**
- Modify: `src/utils/request.ts`

- [ ] **Step 1: 更新 Axios 拦截器**

```typescript
// src/utils/request.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (res) => {
    const { code, message, data } = res.data
    if (code !== 200) {
      if (code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message))
    }
    return data
  },
  (err) => {
    if (err.response) {
      const { status } = err.response
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(`请求失败：${status}`)
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(err)
  },
)

export default request
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/utils/request.ts
git commit -m "feat: 增强 Axios 错误处理，统一使用 ElMessage 提示"
```

---

## Task 6: 骨架屏组件

**Files:**
- Create: `src/components/Skeleton.vue`

- [ ] **Step 1: 创建骨架屏组件**

```vue
<!-- src/components/Skeleton.vue -->
<template>
  <div class="skeleton" :class="{ 'skeleton--avatar': avatar }">
    <div v-if="avatar" class="skeleton-avatar"></div>
    <div class="skeleton-content">
      <div v-for="i in lines" :key="i" class="skeleton-line" :style="{ width: i === lines ? '60%' : '100%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  lines?: number
  avatar?: boolean
}>(), {
  lines: 3,
  avatar: false
})
</script>

<style scoped>
.skeleton {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/components/Skeleton.vue
git commit -m "feat: 添加骨架屏加载组件"
```

---

## Task 7: 404 页面

**Files:**
- Create: `src/views/NotFound.vue`

- [ ] **Step 1: 创建 404 页面**

```vue
<!-- src/views/NotFound.vue -->
<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-9xl font-extrabold text-primary opacity-20">404</h1>
      <h2 class="text-2xl font-bold text-text-main mt-4">页面未找到</h2>
      <p class="text-text-sub mt-2">你访问的页面不存在或已被移除</p>
      <router-link to="/" class="inline-block mt-6 bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition">
        返回首页
      </router-link>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/views/NotFound.vue
git commit -m "feat: 添加 404 页面"
```

---

## Task 8: 文件上传 API

**Files:**
- Create: `src/api/file.ts`

- [ ] **Step 1: 创建文件上传 API**

```typescript
// src/api/file.ts
import request from '../utils/request'

export interface UploadResult {
  url: string
  filename: string
}

export const uploadImage = (file: File): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<any, UploadResult>('/files/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/api/file.ts
git commit -m "feat: 添加文件上传 API"
```

---

## Task 9: 封面上传组件

**Files:**
- Create: `src/components/CoverUpload.vue`

- [ ] **Step 1: 创建封面上传组件**

```vue
<!-- src/components/CoverUpload.vue -->
<template>
  <el-upload
    class="cover-upload"
    :action="''"
    :http-request="handleUpload"
    :show-file-list="false"
    :before-upload="beforeUpload"
    accept="image/*"
  >
    <img v-if="modelValue" :src="modelValue" class="cover-preview" />
    <div v-else class="cover-placeholder">
      <el-icon class="text-2xl text-gray-400"><Plus /></el-icon>
      <span class="text-xs text-gray-400 mt-1">点击上传封面</span>
    </div>
  </el-upload>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '../api/file'

defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

async function handleUpload(options: any) {
  try {
    const result = await uploadImage(options.file)
    emit('update:modelValue', result.url)
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}
</script>

<style scoped>
.cover-upload {
  width: 200px;
  height: 120px;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.cover-placeholder:hover {
  border-color: #409eff;
}
</style>
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/components/CoverUpload.vue
git commit -m "feat: 添加封面图片上传组件"
```

---

## Task 10: Markdown 编辑器组件

**Files:**
- Create: `src/components/MarkdownEditor.vue`

- [ ] **Step 1: 创建 Markdown 编辑器组件**

```vue
<!-- src/components/MarkdownEditor.vue -->
<template>
  <MdEditor
    v-model="content"
    :theme="theme"
    :preview="true"
    :toolbars="toolbars"
    @onUploadImg="handleUploadImg"
    @onChange="handleChange"
    style="height: 500px"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MdEditor, type ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadImage } from '../api/file'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

const content = ref(props.modelValue)
const theme = ref<'light' | 'dark'>('light')

const toolbars: ToolbarNames[] = [
  'bold', 'underline', 'italic', 'strikeThrough', '-',
  'title', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-',
  'codeRow', 'code', 'link', 'image', 'table', '-',
  'revoke', 'next', 'save', '=', 'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog'
]

watch(() => props.modelValue, (val) => {
  if (val !== content.value) {
    content.value = val
  }
})

function handleChange(value: string) {
  emit('update:modelValue', value)
}

async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  const urls = await Promise.all(
    files.map(async (file) => {
      const result = await uploadImage(file)
      return result.url
    })
  )
  callback(urls)
}
</script>
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/components/MarkdownEditor.vue
git commit -m "feat: 添加 Markdown 编辑器组件（md-editor-v3）"
```

---

## Task 11: 更新文章表单使用编辑器和封面上传

**Files:**
- Modify: `src/views/admin/AdminArticleForm.vue`

- [ ] **Step 1: 更新 AdminArticleForm.vue**

```vue
<!-- src/views/admin/AdminArticleForm.vue -->
<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-4">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="text-sm font-medium text-gray-700">标题 *</label>
        <input v-model="form.title" required class="w-full mt-1 px-4 py-2 border rounded-lg text-sm" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700">摘要</label>
        <textarea v-model="form.summary" rows="2" class="w-full mt-1 px-4 py-2 border rounded-lg text-sm resize-none"></textarea>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700">封面图</label>
        <CoverUpload v-model="form.cover" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700">正文 *</label>
        <MarkdownEditor v-model="form.content" />
      </div>

      <div class="flex gap-4">
        <div class="flex-1">
          <label class="text-sm font-medium text-gray-700">分类</label>
          <select v-model="form.categoryId" class="w-full mt-1 px-4 py-2 border rounded-lg text-sm">
            <option :value="undefined">无分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="flex-1">
          <label class="text-sm font-medium text-gray-700">标签</label>
          <div class="mt-1 flex flex-wrap gap-2">
            <label v-for="tag in tags" :key="tag.id" class="flex items-center gap-1 text-sm">
              <input type="checkbox" :value="tag.id" v-model="form.tagIds" />
              {{ tag.name }}
            </label>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.isTop" />
          置顶
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.status" />
          发布
        </label>
      </div>

      <div class="flex gap-2">
        <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition">
          {{ isEdit ? '保存' : '发布' }}
        </button>
        <router-link to="/admin/articles" class="px-6 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
          取消
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAdminArticleDetail, createArticle, updateArticle } from '../../api/article'
import { getCategories } from '../../api/category'
import { getTags } from '../../api/tag'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import CoverUpload from '../../components/CoverUpload.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const form = ref({
  title: '',
  summary: '',
  content: '',
  cover: '',
  categoryId: undefined as number | undefined,
  tagIds: [] as number[],
  isTop: false,
  status: true,
})

const categories = ref<any[]>([])
const tags = ref<any[]>([])

async function fetchData() {
  const [cats, t] = await Promise.all([getCategories(), getTags()])
  categories.value = cats
  tags.value = t

  if (isEdit.value) {
    const article = await getAdminArticleDetail(Number(route.params.id))
    form.value = {
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      cover: article.cover || '',
      categoryId: article.categoryId,
      tagIds: article.tags?.map(t => t.id) || [],
      isTop: article.isTop,
      status: article.status,
    }
  }
}

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await updateArticle(Number(route.params.id), form.value)
      ElMessage.success('更新成功')
    } else {
      const res = await createArticle(form.value)
      ElMessage.success('创建成功')
      router.push(`/admin/articles/${res.id}/edit`)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => fetchData())
</script>
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add src/views/admin/AdminArticleForm.vue
git commit -m "feat: 文章表单集成 Markdown 编辑器和封面上传组件"
```

---

## Task 12: SEO 配置

**Files:**
- Modify: `src/main.ts`
- Modify: `src/views/article/ArticleDetail.vue`
- Modify: `src/views/home/Home.vue`

- [ ] **Step 1: 更新 main.ts 添加 @vueuse/head**

```typescript
// src/main.ts
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
```

- [ ] **Step 2: 更新 ArticleDetail.vue 添加 SEO**

在 `src/views/article/ArticleDetail.vue` 的 `<script setup>` 中添加：

```typescript
import { useHead } from '@vueuse/head'

// 在 article ref 定义后添加
useHead({
  title: () => article.value?.title || '文章详情',
  meta: [
    { name: 'description', content: () => article.value?.summary || '' },
    { name: 'keywords', content: () => article.value?.tags?.map(t => t.name).join(',') || '' }
  ]
})
```

- [ ] **Step 3: 更新 Home.vue 添加 SEO**

在 `src/views/home/Home.vue` 的 `<script setup>` 中添加：

```typescript
import { useHead } from '@vueuse/head'

useHead({
  title: 'Liu Yang\'s Blog',
  meta: [
    { name: 'description', content: '记录 3DGS、计算机视觉、全栈开发的研究笔记' },
    { name: 'keywords', content: '3DGS,CV,Vue3,Spring Boot,博客' }
  ]
})
```

- [ ] **Step 4: 验证构建**

```bash
npm run build
```

Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add src/main.ts src/views/article/ArticleDetail.vue src/views/home/Home.vue
git commit -m "feat: 添加 SEO 配置（@vueuse/head 动态 meta 标签）"
```

---

## Task 13: Gzip 压缩

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: 更新 vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'markdown': ['markdown-it', 'highlight.js'],
          'editor': ['md-editor-v3'],
        }
      }
    }
  }
})
```

- [ ] **Step 2: 验证构建**

```bash
npm run build
```

Expected: 构建成功，dist 目录中有 .gz 文件

- [ ] **Step 3: 提交**

```bash
git add vite.config.ts
git commit -m "feat: 添加 Gzip 压缩和代码分割配置"
```

---

## Task 14: 最终验证

- [ ] **Step 1: 完整构建测试**

```bash
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 检查所有文件**

```bash
git status
```

Expected: 所有文件已提交，工作区干净

- [ ] **Step 3: 推送到远程**

```bash
git push
```

Expected: 推送成功
