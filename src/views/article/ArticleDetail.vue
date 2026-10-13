<template>
  <div class="max-w-6xl mx-auto py-8 px-2 sm:px-4" v-if="article">
    <div class="flex flex-col lg:flex-row gap-8 items-start justify-center">
      <!-- 主内容区域 -->
      <main class="flex-1 min-w-0 max-w-3xl w-full">
        <!-- 文章头部元数据 -->
        <div class="mb-8">
          <img v-if="article.cover" :src="article.cover" class="w-full rounded-2xl mb-6 object-cover max-h-96" :alt="article.title" />
          <h1 class="text-3xl sm:text-4xl font-extrabold text-text-main leading-tight">{{ article.title }}</h1>
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

        <!-- 正文区域 -->
        <article
          class="prose max-w-none article-content"
          v-html="renderedContent"
          @click="handleArticleClick"
        ></article>

        <!-- 发表评论区域 -->
        <div class="mt-12 border-t border-gray-100 dark:border-gray-800 pt-8">
          <h3 class="text-lg font-bold mb-4 text-text-main">发表评论</h3>
          <form @submit.prevent="submitCommentForm" class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <input v-model="commentForm.nickname" placeholder="称呼 *" required
                     class="flex-1 px-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input v-model="commentForm.email" placeholder="邮箱"
                     class="flex-1 px-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <textarea v-model="commentForm.content" placeholder="评论内容 *" required rows="4"
                      class="w-full px-4 py-2 border rounded-lg text-sm resize-none bg-white dark:bg-gray-800 dark:border-gray-700 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"></textarea>
            <button type="submit"
                    class="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition">
              提交评论
            </button>
          </form>
        </div>

        <!-- 评论列表 -->
        <div class="mt-8 space-y-4">
          <h3 class="text-lg font-bold text-text-main">评论（{{ comments.length }}）</h3>
          <div v-for="c in comments" :key="c.id"
               class="p-4 glass-card rounded-xl">
            <div class="flex items-center gap-2 text-sm">
              <strong class="text-text-main">{{ c.nickname }}</strong>
              <span class="text-text-sub">{{ c.createTime?.slice(0, 10) }}</span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-text-main">{{ c.content }}</p>
          </div>
          <div v-if="!comments.length" class="text-text-sub text-sm py-8 text-center">暂无评论</div>
        </div>
      </main>

      <!-- 桌面端侧边大纲目录导航 -->
      <aside v-if="tocList.length" class="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start">
        <div class="glass-card rounded-2xl p-4 max-h-[calc(100vh-8rem)] flex flex-col shadow-sm">
          <!-- 侧边栏标题与进度 -->
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div class="flex items-center gap-2 font-bold text-sm text-text-main">
              <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h14" />
              </svg>
              <span>文章目录</span>
            </div>
            <span class="text-xs text-text-sub font-mono">{{ readProgress }}%</span>
          </div>

          <!-- 目录列表 -->
          <nav class="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
            <a
              v-for="item in tocList"
              :key="item.id"
              :href="`#${item.id}`"
              @click.prevent="scrollToHeading(item.id)"
              class="block py-1.5 px-2.5 rounded-lg transition-all duration-200 truncate cursor-pointer select-none"
              :class="[
                activeHeadingId === item.id
                  ? 'bg-primary/10 text-primary font-bold border-l-2 border-primary'
                  : 'text-text-sub hover:text-text-main hover:bg-gray-100/60 dark:hover:bg-gray-800/60',
                item.level === 1 ? 'font-semibold' : '',
                item.level === 2 ? 'pl-3' : '',
                item.level === 3 ? 'pl-5' : '',
                item.level === 4 ? 'pl-7' : ''
              ]"
              :title="item.text"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>
      </aside>
    </div>

    <!-- 移动端悬浮目录按钮与抽屉 -->
    <div v-if="tocList.length" class="lg:hidden">
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
            <nav class="flex-1 overflow-y-auto space-y-1 text-xs custom-scrollbar">
              <a
                v-for="item in tocList"
                :key="item.id"
                :href="`#${item.id}`"
                @click.prevent="scrollToHeading(item.id); showMobileToc = false"
                class="block py-2 px-2.5 rounded-lg transition-all duration-200 truncate cursor-pointer"
                :class="[
                  activeHeadingId === item.id
                    ? 'bg-primary/10 text-primary font-bold border-l-2 border-primary'
                    : 'text-text-sub hover:text-text-main hover:bg-gray-100/60 dark:hover:bg-gray-800/60',
                  item.level === 2 ? 'pl-3' : '',
                  item.level === 3 ? 'pl-5' : '',
                  item.level === 4 ? 'pl-7' : ''
                ]"
              >
                {{ item.text }}
              </a>
            </nav>
          </div>
        </div>
      </transition>
    </div>
  </div>

  <div v-else class="text-center py-20 text-text-sub">加载中...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getArticleDetail, type ArticleItem } from '../../api/article'
import { getComments, submitComment, type Comment } from '../../api/comment'
import { renderMarkdown } from '../../utils/markdown'

interface TocItem {
  id: string
  text: string
  level: number
}

const route = useRoute()
const article = ref<ArticleItem | null>(null)
const comments = ref<Comment[]>([])
const commentForm = ref({ nickname: '', email: '', content: '' })

const tocList = ref<TocItem[]>([])
const activeHeadingId = ref<string>('')
const readProgress = ref<number>(0)
const showMobileToc = ref<boolean>(false)

useHead({
  title: () => article.value?.title || '文章详情',
  meta: [
    { name: 'description', content: () => article.value?.summary || '' },
    { name: 'keywords', content: () => article.value?.tags?.map(t => t.name).join(',') || '' }
  ]
})

const renderedContent = computed(() => {
  return renderMarkdown(article.value?.content || '')
})

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

// 提取正文中所有标题，生成目录大纲
function extractToc() {
  const container = document.querySelector('.article-content')
  if (!container) return
  const elements = container.querySelectorAll('h1, h2, h3, h4')
  const items: TocItem[] = []
  elements.forEach((el, index) => {
    let id = el.id
    if (!id) {
      id = `heading-${index}`
      el.id = id
    }
    const level = parseInt(el.tagName.replace('H', ''), 10)
    const text = el.textContent?.trim() || `第 ${index + 1} 节`
    items.push({ id, text, level })
  })
  tocList.value = items
}

// 平滑滚动到指定标题
function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
    activeHeadingId.value = id
  }
}

// 动态高亮视口内当前标题
function updateActiveHeading() {
  if (tocList.value.length === 0) return
  const scrollY = window.scrollY || document.documentElement.scrollTop
  const headingElements = tocList.value
    .map(item => document.getElementById(item.id))
    .filter((el): el is HTMLElement => el !== null)

  let currentId = tocList.value[0]?.id || ''
  for (const el of headingElements) {
    const top = el.offsetTop
    if (scrollY >= top - 110) {
      currentId = el.id
    } else {
      break
    }
  }
  activeHeadingId.value = currentId
}

// 动态计算页面阅读进度百分比
function updateReadProgress() {
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  readProgress.value = height > 0 ? Math.min(100, Math.max(0, Math.round((winScroll / height) * 100))) : 0
}

let scrollTicking = false
function handleScroll() {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      updateReadProgress()
      updateActiveHeading()
      scrollTicking = false
    })
    scrollTicking = true
  }
}

// 事件代理：处理代码复制与超过 500 行代码折叠/展开
function handleArticleClick(e: MouseEvent) {
  const target = e.target as HTMLElement

  // 1. 复制代码块
  const copyBtn = target.closest('.code-copy-btn') as HTMLButtonElement | null
  if (copyBtn) {
    const container = copyBtn.closest('.code-block-container')
    const codeEl = container?.querySelector('pre.hljs code')
    if (codeEl) {
      const codeText = codeEl.textContent || ''
      navigator.clipboard.writeText(codeText).then(() => {
        copyBtn.classList.add('copied')
        const textSpan = copyBtn.querySelector('.copy-text')
        if (textSpan) {
          const original = textSpan.textContent
          textSpan.textContent = '已复制!'
          setTimeout(() => {
            textSpan.textContent = original
            copyBtn.classList.remove('copied')
          }, 2000)
        }
      })
    }
    return
  }

  // 2. 超过500行代码折叠/展开
  const collapseBtn = target.closest('.code-collapse-btn') as HTMLButtonElement | null
  if (collapseBtn) {
    const container = collapseBtn.closest('.code-block-container')
    if (container) {
      const isCollapsed = container.classList.contains('is-collapsed')
      const lines = container.getAttribute('data-lines') || '500+'
      const textSpan = collapseBtn.querySelector('.collapse-btn-text')
      const chevron = collapseBtn.querySelector('.chevron-icon')

      if (isCollapsed) {
        // 展开全部代码
        container.classList.remove('is-collapsed')
        if (textSpan) textSpan.textContent = `收起代码 (共 ${lines} 行)`
        if (chevron) chevron.classList.add('rotate-180')
      } else {
        // 折叠代码
        container.classList.add('is-collapsed')
        if (textSpan) textSpan.textContent = `代码超过 500 行，点击展开全部 (${lines} 行)`
        if (chevron) chevron.classList.remove('rotate-180')
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
    return
  }
}

watch(renderedContent, () => {
  nextTick(() => {
    extractToc()
    updateActiveHeading()
  })
})

watch(() => route.params.id, () => {
  fetchArticle()
  fetchComments()
})

onMounted(() => {
  fetchArticle()
  fetchComments()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 800;
  color: var(--ink);
  scroll-margin-top: 80px;
}

.prose :deep(h1) { font-size: 1.8rem; }
.prose :deep(h2) { font-size: 1.5rem; }
.prose :deep(h3) { font-size: 1.25rem; }

.prose :deep(p) {
  margin-top: 0.8em;
  line-height: 1.9;
  color: var(--muted);
}

.prose :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 1em 0;
}

.prose :deep(blockquote) {
  border-left: 4px solid var(--blue);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--muted);
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5em;
  margin: 0.8em 0;
}

.prose :deep(li) {
  margin: 0.3em 0;
  line-height: 1.8;
  color: var(--muted);
}

.prose :deep(a) {
  color: var(--blue);
  text-decoration: underline;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.prose :deep(th),
.prose :deep(td) {
  border: 1px solid var(--soft-line);
  padding: 8px 12px;
  text-align: left;
}

.prose :deep(th) {
  background: var(--paper);
  font-weight: 700;
}
</style>
