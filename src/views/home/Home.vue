<template>
  <div class="essay-home">
    <header class="intro">
      <p class="intro-kicker">{{ getConfigValue('home_kicker', "Liu Yang's Notes") }}</p>
      <h1>{{ getConfigValue('home_title', '写一点技术，也写一点正在发生的生活。') }}</h1>
      <p class="intro-text">
        {{ getConfigValue('home_description', '这里更像一本公开的随笔本：记录 3DGS、计算机视觉、全栈开发，也记录研究、项目和日常之间那些还没完全成形的想法。') }}
      </p>
    </header>

    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索文章…"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <span style="color: var(--muted)">🔍</span>
        </template>
      </el-input>
      <el-button type="primary" round @click="handleSearch">搜索</el-button>
    </div>

    <div class="filter-bar" v-if="categories.length">
      <span class="filter-label">分类</span>
      <el-button
        v-for="cat in categories"
        :key="cat.id"
        :type="selectedCategoryId === cat.id ? 'primary' : 'default'"
        :plain="selectedCategoryId !== cat.id"
        size="small"
        round
        @click="toggleCategory(cat.id)"
      >
        {{ cat.name }}
      </el-button>
      <el-button
        v-if="selectedCategoryId"
        size="small"
        round
        @click="clearCategory"
      >
        清除
      </el-button>
    </div>

    <div class="journal-layout">
      <main class="journal-feed" aria-label="随笔列表">
        <div v-if="loading" class="loading-state">加载中…</div>
        <div v-else-if="!articles.length" class="empty-state">暂无文章</div>
        <article
          v-for="note in articles"
          :key="note.id"
          class="note-entry"
        >
          <div class="note-date">
            <span>{{ formatMonth(note.createTime) }}</span>
            <strong>{{ formatDay(note.createTime) }}</strong>
          </div>

          <div class="note-content" @mousemove="handleSpotlight" @mouseleave="clearSpotlight">
            <router-link :to="`/article/${note.id}`" class="note-link">
              <img v-if="note.cover" :src="note.cover" class="note-cover" :alt="note.title" loading="lazy" />
              <div class="note-meta">
                <span>{{ note.category?.name || '随笔' }}</span>
                <span>{{ note.viewCount }} 次阅读</span>
              </div>
              <h2>{{ note.title }}</h2>
              <p>{{ note.summary }}</p>
            </router-link>
            <div class="note-tags">
              <span
                v-for="tag in note.tags"
                :key="tag.id"
                :style="{ background: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </article>

        <div class="pagination-wrap" v-if="total > size">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="size"
            :current-page="page"
            @current-change="handlePageChange"
          />
        </div>
      </main>

      <aside class="quiet-aside" aria-label="个人信息" :style="{ top: asideTop }">
        <section class="aside-panel profile-note">
          <div 
            class="avatar-wrapper cursor-pointer relative overflow-hidden group flex-shrink-0" 
            :class="{ 'is-playing': isPlayingHajimi }"
            @click="toggleHajimi"
            title="点击头像播放哈基米音乐"
          >
            <img src="/avatar.jpg" alt="Liu Yang avatar" class="avatar-img" />
            <!-- 悬浮播放/暂停图标遮罩 -->
            <div class="avatar-overlay absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg v-if="!isPlayingHajimi" class="w-6 h-6 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="w-6 h-6 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </div>
            
            <!-- 飘动的音符 -->
            <div v-if="isPlayingHajimi" class="notes-container absolute inset-0 pointer-events-none">
              <span class="music-note note-1">🎵</span>
              <span class="music-note note-2">🎶</span>
              <span class="music-note note-3">♩</span>
              <span class="music-note note-4">♪</span>
            </div>

            <!-- 猫咪发光眼睛 -->
            <div v-if="isPlayingHajimi" class="eyes-glow pointer-events-none absolute inset-0">
              <span class="eye-dot eye-left"></span>
              <span class="eye-dot eye-right"></span>
            </div>
          </div>
          <div>
            <h2>{{ getConfigValue('profile_name', '刘洋') }}</h2>
            <p>{{ getConfigValue('profile_bio', '研究生。最近在看 3DGS、工业视觉和一些前后端工程化的小问题。') }}</p>
          </div>
        </section>

        <AlmanacCard />

        <section class="aside-panel" v-if="socialLinks.length">
          <p class="aside-title">社交链接</p>
          <div class="social-links">
            <a
              v-for="link in socialLinks"
              :key="link.name"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
              :title="link.name"
            >
              <svg v-if="link.icon === 'github'" class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <svg v-else-if="link.icon === 'bilibili'" class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
              </svg>
              <svg v-else-if="link.icon === 'douyin'" class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.37-6.22V9.4a8.16 8.16 0 0 0 4.85 1.58V7.53a4.85 4.85 0 0 1-1-.84z"/>
              </svg>
              <svg v-else-if="link.icon === 'leetcode'" class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.617 2.616c-1.393 1.386-3.616 1.393-5.018.019l-4.708-4.62c-.754-.74-1.189-1.748-1.189-2.793c0-1.045.435-2.053 1.189-2.793l4.708-4.62c1.393-1.386 3.616-1.393 5.018-.019l2.617 2.616c.54.54 1.414.54 1.955.003a1.378 1.378 0 0 0-.003-1.955l-2.396-2.392c-2.212-2.207-5.816-2.239-8.063-.074l-.039.038l-4.277 4.193a5.938 5.938 0 0 1-1.271 1.818a5.83 5.83 0 0 1-.349 1.017a5.527 5.527 0 0 1-.062 2.362a5.35 5.35 0 0 1 .125.513a5.266 5.266 0 0 1 1.209 2.104l3.854 4.126l5.406 5.788a1.374 1.374 0 0 0 .961.438a1.374 1.374 0 0 0 .961-.438l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.955-.003l-2.617 2.616c-1.393 1.386-3.616 1.393-5.018.019l-4.708-4.62c-.754-.74-1.189-1.748-1.189-2.793c0-1.045.435-2.053 1.189-2.793l4.708-4.62c1.393-1.386 3.616-1.393 5.018-.019l2.617 2.616c.54.54 1.414.54 1.955.003a1.378 1.378 0 0 0-.003-1.955z"/>
              </svg>
              <svg v-else class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span class="social-name">{{ link.name }}</span>
            </a>
          </div>
        </section>

        <section class="aside-panel" v-if="archives.length">
          <p class="aside-title">归档</p>
          <ul class="thought-list">
            <li v-for="arc in archives" :key="arc.month">
              {{ arc.month }} ({{ arc.count }})
            </li>
          </ul>
        </section>

        <section class="aside-panel">
          <p class="aside-title">标签</p>
          <div class="soft-tags">
            <span
              v-for="tag in tags"
              :key="tag.id"
              :style="{ background: tag.color + '20', color: tag.color, cursor: 'pointer' }"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </span>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getArticles } from '../../api/article'
import { loadConfigs, getConfigValue, getSocialLinks, type SocialLink } from '../../utils/config'
import AlmanacCard from '../../components/blog/AlmanacCard.vue'

useHead({
  title: getConfigValue('site_title', "Liu Yang's Blog") || "Liu Yang's Blog",
  meta: [
    { name: 'description', content: getConfigValue('site_meta_description', '记录 3DGS、计算机视觉、全栈开发的研究笔记') || '记录 3DGS、计算机视觉、全栈开发的研究笔记' },
    { name: 'keywords', content: getConfigValue('site_meta_keywords', '3DGS,CV,Vue3,Spring Boot,博客') || '3DGS,CV,Vue3,Spring Boot,博客' }
  ]
})
import { getCategories, type Category } from '../../api/category'
import { getTags, type Tag } from '../../api/tag'
import { getArchives, type Archive } from '../../api/archive'
import type { ArticleItem } from '../../api/article'

const route = useRoute()
const router = useRouter()

const articles = ref<ArticleItem[]>([])
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const archives = ref<Archive[]>([])
const socialLinks = ref<SocialLink[]>([])
const loading = ref(false)
const keyword = ref((route.query.keyword as string) || '')
const selectedCategoryId = ref<number | undefined>(undefined)
const selectedTagId = ref<number | undefined>(undefined)
const page = ref(1)
const size = ref(10)
const total = ref(0)

// --- 哈基米音乐播放器彩蛋 ---
const isPlayingHajimi = ref(false)
const audioHajimi = ref<HTMLAudioElement | null>(null)

// 两首本地哈基米音频，实现播放时简单随机选择
const HAJIMI_PLAYLIST = ['/hajimi.mp3', '/hajimi2.mp3']

function toggleHajimi() {
  if (isPlayingHajimi.value) {
    if (audioHajimi.value) {
      audioHajimi.value.pause()
    }
    isPlayingHajimi.value = false
  } else {
    // 每次从关闭状态点击播放，都随机挑选一首
    const randomTrack = HAJIMI_PLAYLIST[Math.floor(Math.random() * HAJIMI_PLAYLIST.length)]
    
    // 清理之前的播放器实例
    if (audioHajimi.value) {
      audioHajimi.value.pause()
      audioHajimi.value = null
    }

    audioHajimi.value = new Audio(randomTrack)
    audioHajimi.value.loop = true
    audioHajimi.value.addEventListener('ended', () => {
      isPlayingHajimi.value = false
    })

    audioHajimi.value.play().catch(err => {
      console.warn('播放哈基米失败：', err)
      isPlayingHajimi.value = false
    })
    isPlayingHajimi.value = true
  }
}

onUnmounted(() => {
  if (audioHajimi.value) {
    audioHajimi.value.pause()
    audioHajimi.value = null
  }
})

function formatMonth(time: string) {
  const d = new Date(time)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[d.getMonth()]
}

function formatDay(time: string) {
  const d = new Date(time)
  return String(d.getDate())
}

function handleSpotlight(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--y', `${e.clientY - rect.top}px`)
}

function clearSpotlight(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  el.style.removeProperty('--x')
  el.style.removeProperty('--y')
}

async function fetchArticles() {
  loading.value = true
  try {
    const params: any = { page: page.value, size: size.value }
    if (keyword.value) params.keyword = keyword.value
    if (selectedCategoryId.value) params.categoryId = selectedCategoryId.value
    if (selectedTagId.value) params.tagId = selectedTagId.value
    const res = await getArticles(params)
    articles.value = res.records
    total.value = res.total
    page.value = res.page
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    categories.value = await getCategories()
  } catch { /* ignore */ }
}

async function fetchTags() {
  try {
    tags.value = await getTags()
  } catch { /* ignore */ }
}

async function fetchArchives() {
  try {
    archives.value = await getArchives()
  } catch { /* ignore */ }
}

function handleSearch() {
  page.value = 1
  router.replace({ query: { ...route.query, keyword: keyword.value || undefined } })
  fetchArticles().then(() => nextTick().then(observeScrollReveal))
}

function toggleCategory(id: number) {
  selectedCategoryId.value = selectedCategoryId.value === id ? undefined : id
  page.value = 1
  fetchArticles().then(() => nextTick().then(observeScrollReveal))
}

function clearCategory() {
  selectedCategoryId.value = undefined
  page.value = 1
  fetchArticles().then(() => nextTick().then(observeScrollReveal))
}

function toggleTag(id: number) {
  selectedTagId.value = selectedTagId.value === id ? undefined : id
  page.value = 1
  fetchArticles().then(() => nextTick().then(observeScrollReveal))
}

function handlePageChange(p: number) {
  page.value = p
  fetchArticles().then(() => nextTick().then(observeScrollReveal))
}

function observeScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.note-entry:not(.revealed)').forEach((el) => {
    observer.observe(el)
  })
}
const asideTop = ref('108px')
let resizeObserver: ResizeObserver | null = null

function updateStickyPosition() {
  const asideEl = document.querySelector('.quiet-aside') as HTMLElement
  if (!asideEl) return
  const height = asideEl.getBoundingClientRect().height
  const viewportHeight = window.innerHeight
  // 108px is header space, 24px is bottom safety spacing
  if (height + 108 + 24 > viewportHeight) {
    asideTop.value = `${viewportHeight - height - 24}px`
  } else {
    asideTop.value = '108px'
  }
}

onMounted(async () => {
  await loadConfigs()
  socialLinks.value = getSocialLinks()
  await fetchArticles()
  await nextTick()
  observeScrollReveal()
  fetchCategories()
  fetchTags()
  fetchArchives()

  nextTick(() => {
    updateStickyPosition()
    window.addEventListener('resize', updateStickyPosition)
    const asideEl = document.querySelector('.quiet-aside') as HTMLElement
    if (asideEl) {
      resizeObserver = new ResizeObserver(() => {
        updateStickyPosition()
      })
      resizeObserver.observe(asideEl)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateStickyPosition)
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.essay-home {
  --paper: rgba(255, 255, 255, 0.72);
  --paper-strong: rgba(255, 255, 255, 0.88);
  --ink: #172033;
  --muted: #68758a;
  --soft-line: rgba(105, 119, 141, 0.16);
  --blue: #315fbd;
  --tea: #0f9f8f;
  max-width: 1120px;
  margin: 0 auto;
}

.intro {
  max-width: 760px;
  padding: 36px 0 42px;
  animation: fade-up 520ms ease both;
}

.intro-kicker {
  color: var(--blue);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.intro h1 {
  margin-top: 18px;
  color: var(--ink);
  font-size: clamp(2.2rem, 6vw, 4.6rem);
  font-weight: 850;
  line-height: 1.08;
}

.intro-text {
  max-width: 660px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 1.03rem;
  line-height: 1.95;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
}

.filter-label {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
  margin-right: 4px;
}

.journal-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 56px;
  align-items: start;
}

.journal-feed {
  display: flex;
  flex-direction: column;
}

.loading-state,
.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.95rem;
}

.note-entry {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 24px;
  padding: 28px 0;
  border-top: 1px solid var(--soft-line);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.note-entry.revealed {
  opacity: 1;
  transform: translateY(0);
}

.note-entry:last-of-type {
  border-bottom: 1px solid var(--soft-line);
}

.note-date {
  position: sticky;
  top: 108px;
  width: 58px;
  height: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(49, 95, 189, 0.14);
  border-radius: 18px;
  background: var(--paper);
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
  backdrop-filter: blur(16px);
}

.note-date span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.note-date strong {
  color: var(--ink);
  font-size: 1.45rem;
  line-height: 1;
}

.note-content {
  position: relative;
  padding: 24px;
  border: 1px solid transparent;
  border-radius: 24px;
  background:
    linear-gradient(var(--paper-strong), var(--paper-strong)) padding-box,
    linear-gradient(135deg, rgba(49, 95, 189, 0.20), rgba(15, 159, 143, 0.10), rgba(255, 255, 255, 0.28)) border-box;
  box-shadow: 0 18px 44px rgba(23, 32, 51, 0.055);
  backdrop-filter: blur(18px);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  overflow: hidden;
}

.note-content::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: radial-gradient(
    350px circle at var(--x) var(--y),
    rgba(49, 95, 189, 0.10),
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}

.note-content:hover::before {
  opacity: 1;
}

.note-content > * {
  position: relative;
  z-index: 1;
}

.note-content:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 58px rgba(23, 32, 51, 0.09);
}

.note-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.note-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
}

.note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.note-meta span + span::before {
  content: '/';
  margin-right: 10px;
  color: rgba(104, 117, 138, 0.55);
}

.note-content h2 {
  margin-top: 12px;
  color: var(--ink);
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 850;
  line-height: 1.35;
}

.note-content p {
  margin-top: 12px;
  color: var(--muted);
  line-height: 1.9;
}

.note-tags,
.soft-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.note-tags {
  margin-top: 18px;
}

.note-tags span,
.soft-tags span {
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--blue);
  background: rgba(49, 95, 189, 0.08);
  font-size: 0.76rem;
  font-weight: 750;
}

.quiet-aside {
  position: sticky;
  top: 108px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aside-panel {
  border: 1px solid var(--soft-line);
  border-radius: 24px;
  padding: 20px;
  background: var(--paper);
  box-shadow: 0 18px 44px rgba(23, 32, 51, 0.045);
  backdrop-filter: blur(18px);
}

.profile-note {
  display: flex;
  gap: 14px;
}

.profile-note .avatar-wrapper {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 18px;
  background: #eef4ff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.profile-note .avatar-wrapper:hover {
  transform: scale(1.06);
  box-shadow: 0 8px 20px rgba(49, 95, 189, 0.2);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s ease;
}

.profile-note .avatar-wrapper.is-playing {
  animation: pulse-avatar 2s infinite ease-in-out;
  box-shadow: 0 0 20px rgba(49, 95, 189, 0.4);
}

@keyframes pulse-avatar {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

/* 飘动音符容器与动画 */
.notes-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.music-note {
  position: absolute;
  bottom: -10px;
  font-size: 8px;
  color: #ffd60a;
  opacity: 0;
  text-shadow: 0 0 5px rgba(255, 214, 10, 0.8);
}

.note-1 {
  left: 10%;
  animation: float-note 1.8s infinite ease-out;
  animation-delay: 0s;
}

.note-2 {
  left: 40%;
  animation: float-note 2.2s infinite ease-out;
  animation-delay: 0.4s;
}

.note-3 {
  left: 70%;
  animation: float-note 2s infinite ease-out;
  animation-delay: 0.8s;
}

.note-4 {
  left: 85%;
  animation: float-note 1.5s infinite ease-out;
  animation-delay: 1.2s;
}

@keyframes float-note {
  0% {
    transform: translateY(0) scale(0.6) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  80% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(-50px) scale(1.2) rotate(360deg);
    opacity: 0;
  }
}

/* 喵咪眼睛发光特效 */
.eyes-glow {
  position: absolute;
  inset: 0;
}

.eye-dot {
  position: absolute;
  width: 3.5px;
  height: 3.5px;
  background: #ffd60a;
  border-radius: 50%;
  box-shadow: 0 0 6px #ffd60a, 0 0 12px #ffd60a;
  opacity: 0.85;
  animation: blink-eye 1.2s infinite alternate ease-in-out;
}

.eye-left {
  top: 38%;
  left: 42.5%;
}

.eye-right {
  top: 38%;
  left: 63.5%;
}

@keyframes blink-eye {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 1; }
}

.profile-note h2 {
  color: var(--ink);
  font-size: 1rem;
  font-weight: 850;
}

.profile-note p,
.thought-list {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.75;
}

.aside-title {
  margin-bottom: 12px;
  color: var(--ink);
  font-size: 0.88rem;
  font-weight: 850;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(49, 95, 189, 0.06);
  color: var(--muted);
  text-decoration: none;
  font-size: 0.82rem;
  transition: all 0.2s ease;
}

.social-link:hover {
  background: rgba(49, 95, 189, 0.12);
  color: var(--blue);
  transform: translateY(-1px);
}

.social-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.social-name {
  font-weight: 600;
}

.thought-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 18px;
}

.thought-list li::marker {
  color: var(--tea);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 32px 0 8px;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .essay-home * {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 980px) {
  .journal-layout {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .quiet-aside {
    position: static;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .intro {
    padding-top: 20px;
  }

  .note-entry {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 22px 0;
  }

  .note-date {
    position: static;
    width: auto;
    height: auto;
    flex-direction: row;
    justify-content: flex-start;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
  }

  .note-date strong {
    font-size: 0.82rem;
  }

  .note-content {
    padding: 20px;
    border-radius: 20px;
  }

  .quiet-aside {
    grid-template-columns: 1fr;
  }
}
</style>
