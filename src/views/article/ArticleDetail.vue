<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8" v-if="article">
    <div class="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start justify-center">
      <!-- 主内容区域：大幅拓宽，消除狭窄局促感 -->
      <main class="flex-1 min-w-0 max-w-4xl xl:max-w-5xl w-full">
        <!-- 文章头部元数据 -->
        <div class="mb-8">
          <img
            v-if="article.cover"
            :src="article.cover"
            class="w-full rounded-2xl mb-6 object-cover h-64 sm:h-80 md:h-96 xl:h-[420px] shadow-sm"
            :alt="article.title"
          />
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-main leading-tight tracking-tight">
            {{ article.title }}
          </h1>
          <div class="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-sub">
            <span>{{ article.createTime?.slice(0, 10) }}</span>
            <span>{{ article.viewCount }} 阅读</span>
            <span v-if="article.category" class="font-medium text-primary">{{ article.category.name }}</span>
          </div>
          <div class="flex flex-wrap gap-2 mt-4" v-if="article.tags?.length">
            <span
              v-for="tag in article.tags"
              :key="tag.id"
              class="px-3 py-1 rounded-full text-xs font-semibold"
              :style="{ color: tag.color, background: tag.color + '18' }"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <!-- 正文区域：完全透明融入背景，彻底消除黑框，绑定唯一 Key 保证二次编辑实时重建正文与目录锚点 -->
        <div class="article-preview-container">
          <MdPreview
            :key="previewKey"
            :editorId="editorId"
            :modelValue="article.content || ''"
            :theme="theme"
            :codeFoldable="true"
            :autoFoldThreshold="500"
            :showCodeRowNumber="true"
            :mdHeadingId="customMdHeadingId"
            @onGetCatalog="handleGetCatalog"
          />
        </div>

        <!-- 发表评论区域 -->
        <div class="mt-14 border-t border-gray-100 dark:border-gray-800/80 pt-8">
          <h3 class="text-lg font-bold mb-4 text-text-main">发表评论</h3>
          <form @submit.prevent="submitCommentForm" class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <input
                v-model="commentForm.nickname"
                placeholder="称呼 *"
                required
                class="flex-1 px-4 py-2.5 border rounded-xl text-sm bg-white/70 dark:bg-gray-800/70 dark:border-gray-700/80 text-text-main backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
              <input
                v-model="commentForm.email"
                placeholder="邮箱"
                class="flex-1 px-4 py-2.5 border rounded-xl text-sm bg-white/70 dark:bg-gray-800/70 dark:border-gray-700/80 text-text-main backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            <textarea
              v-model="commentForm.content"
              placeholder="评论内容 *"
              required
              rows="4"
              class="w-full px-4 py-2.5 border rounded-xl text-sm resize-none bg-white/70 dark:bg-gray-800/70 dark:border-gray-700/80 text-text-main backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            ></textarea>
            <button
              type="submit"
              class="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition active:scale-95"
            >
              提交评论
            </button>
          </form>
        </div>

        <!-- 评论列表 -->
        <div class="mt-10 space-y-4">
          <h3 class="text-lg font-bold text-text-main">评论（{{ comments.length }}）</h3>
          <div
            v-for="c in comments"
            :key="c.id"
            class="p-5 glass-card rounded-2xl"
          >
            <div class="flex items-center gap-2 text-sm">
              <strong class="text-text-main">{{ c.nickname }}</strong>
              <span class="text-text-sub text-xs">{{ c.createTime?.slice(0, 10) }}</span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-text-main">{{ c.content }}</p>
          </div>
          <div v-if="!comments.length" class="text-text-sub text-sm py-8 text-center">暂无评论</div>
        </div>
      </main>

      <!-- 桌面端侧边大纲目录导航 -->
      <aside v-if="catalogList.length" class="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-24 self-start">
        <div class="glass-card rounded-2xl p-5 max-h-[calc(100vh-8rem)] flex flex-col shadow-sm">
          <!-- 侧边栏标题与进度 -->
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div class="flex items-center gap-2 font-bold text-sm text-text-main">
              <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14" />
              </svg>
              <span>文章目录</span>
            </div>
            <span class="text-xs text-text-sub font-mono font-medium">{{ readProgress }}%</span>
          </div>

          <!-- 目录列表 -->
          <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <MdCatalog
              :key="previewKey"
              :editorId="editorId"
              :scrollElement="scrollElement"
              :theme="theme"
              :offsetTop="80"
              :scrollElementOffsetTop="80"
              :mdHeadingId="customMdHeadingId"
            />
          </div>
        </div>
      </aside>
    </div>

    <!-- 移动端悬浮目录按钮与抽屉 -->
    <div v-if="catalogList.length" class="lg:hidden">
      <button
        type="button"
        @click="showMobileToc = true"
        class="fixed right-5 bottom-20 z-40 w-11 h-11 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="文章目录"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14" />
        </svg>
      </button>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showMobileToc" class="fixed inset-0 bg-black/50 z-50 flex justify-end" @click.self="showMobileToc = false">
          <div class="w-72 max-w-[80vw] h-full bg-white dark:bg-gray-900 shadow-2xl p-5 flex flex-col">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
              <span class="font-bold text-sm text-text-main flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14" />
                </svg>
                文章目录
              </span>
              <button @click="showMobileToc = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar">
              <MdCatalog
                :key="previewKey"
                :editorId="editorId"
                :scrollElement="scrollElement"
                :theme="theme"
                :offsetTop="80"
                :scrollElementOffsetTop="80"
                :mdHeadingId="customMdHeadingId"
                :onClick="() => { showMobileToc = false }"
              />
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>

  <div v-else class="text-center py-20 text-text-sub">加载中...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import type { HeadList } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { getArticleDetail, type ArticleItem } from '../../api/article'
import { getComments, submitComment, type Comment } from '../../api/comment'
import { isDark } from '../../utils/theme'
import { useAgentStore } from '../../store/agent'

const route = useRoute()
const agentStore = useAgentStore()
const article = ref<ArticleItem | null>(null)
const comments = ref<Comment[]>([])
const commentForm = ref({ nickname: '', email: '', content: '' })

const editorId = computed(() => `article-preview-${article.value?.id || 0}`)
const previewKey = computed(() => `${article.value?.id || 0}-${article.value?.updateTime || ''}-${article.value?.content?.length || 0}`)
const theme = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'))
const catalogList = ref<HeadList[]>([])
const scrollElement = ref<HTMLElement>()
const readProgress = ref<number>(0)
const showMobileToc = ref<boolean>(false)

// 自定义目录锚点 ID 映射，按索引精准绑定，避免特殊字符、标点或重复标题冲突
function customMdHeadingId({ index }: { text: string; level: number; index: number }) {
  return `heading-${index}`
}

useHead({
  title: () => article.value?.title || '文章详情',
  meta: [
    { name: 'description', content: () => article.value?.summary || '' },
    { name: 'keywords', content: () => article.value?.tags?.map(t => t.name).join(',') || '' }
  ]
})

function handleGetCatalog(list: HeadList[]) {
  catalogList.value = list
}

async function fetchArticle() {
  const id = Number(route.params.id)
  if (!id) return
  article.value = await getArticleDetail(id)
}

async function fetchComments() {
  const id = Number(route.params.id)
  if (!id) return
  const res = await getComments({ articleId: id })
  comments.value = res.records
}

async function submitCommentForm() {
  await submitComment({ articleId: Number(route.params.id), ...commentForm.value })
  commentForm.value = { nickname: '', email: '', content: '' }
  fetchComments()
}

let readingTimer: ReturnType<typeof setTimeout> | null = null

function checkDeepReading() {
  if (!article.value) return
  agentStore.triggerArticleRead({
    id: article.value.id,
    title: article.value.title,
  })
}

// 动态计算阅读进度
function updateReadProgress() {
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  readProgress.value = height > 0 ? Math.min(100, Math.max(0, Math.round((winScroll / height) * 100))) : 0

  // 深度阅读滚动阈值 (阅读进度超 60% 触发行为感知)
  if (readProgress.value >= 60) {
    checkDeepReading()
  }
}

// 当浏览器标签页切回前台（例如在后台标签页二次编辑后切回）时，自动拉取最新正文和目录
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    fetchArticle()
  }
}

watch(() => route.params.id, () => {
  if (readingTimer) clearTimeout(readingTimer)
  fetchArticle()
  fetchComments()
  // 切换新文章后重新开始 30 秒停留计时
  readingTimer = setTimeout(() => {
    checkDeepReading()
  }, 30000)
})

onMounted(() => {
  scrollElement.value = document.documentElement
  fetchArticle()
  fetchComments()
  window.addEventListener('scroll', updateReadProgress, { passive: true })
  window.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', fetchArticle)

  // 访客在当前文章详情页停留满 30 秒触发深度阅读感知
  readingTimer = setTimeout(() => {
    checkDeepReading()
  }, 30000)
})

onUnmounted(() => {
  if (readingTimer) clearTimeout(readingTimer)
  window.removeEventListener('scroll', updateReadProgress)
  window.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', fetchArticle)
})
</script>

<style scoped>
/* 彻底清除 md-editor-v3 的默认实心黑底与硬边框，实现与背景通透融入 */
.article-preview-container :deep(.md-editor) {
  background-color: transparent !important;
  --md-bk-color: transparent !important;
  --md-theme-bg-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.article-preview-container :deep(.md-editor-preview-wrapper) {
  padding: 0 !important;
  background-color: transparent !important;
}

.article-preview-container :deep(.md-editor-preview) {
  background-color: transparent !important;
  color: var(--text-main) !important;
  font-size: 1.05rem;
  line-height: 1.9;
}

/* 标题样式与锚点滚动偏移避让顶部导航栏 */
.article-preview-container :deep(h1),
.article-preview-container :deep(h2),
.article-preview-container :deep(h3),
.article-preview-container :deep(h4),
.article-preview-container :deep(h5),
.article-preview-container :deep(h6) {
  scroll-margin-top: 80px;
  color: var(--ink, var(--text-main));
  font-weight: 750;
}

.article-preview-container :deep(p) {
  color: var(--text-main);
  line-height: 1.9;
  margin-top: 1em;
  margin-bottom: 1em;
}

/* 目录菜单细节优化 */
:deep(.md-editor-catalog) {
  font-size: 0.82rem;
}

:deep(.md-editor-catalog-link) {
  padding: 5px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: var(--text-sub);
}

:deep(.md-editor-catalog-link:hover) {
  background: rgba(148, 163, 184, 0.12);
  color: var(--el-color-primary, #315fbd);
}

:deep(.md-editor-catalog-active > .md-editor-catalog-link) {
  color: var(--el-color-primary, #315fbd) !important;
  font-weight: 700;
  background: rgba(37, 99, 235, 0.1);
}
</style>
