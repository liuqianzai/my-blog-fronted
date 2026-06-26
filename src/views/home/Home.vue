<template>
  <div class="essay-home">
    <header class="intro">
      <p class="intro-kicker">Liu Yang's Notes</p>
      <h1>写一点技术，也写一点正在发生的生活。</h1>
      <p class="intro-text">
        这里更像一本公开的随笔本：记录 3DGS、计算机视觉、全栈开发，也记录研究、项目和日常之间那些还没完全成形的想法。
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

      <aside class="quiet-aside" aria-label="个人信息">
        <section class="aside-panel profile-note">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=LiuYang" alt="Liu Yang avatar" />
          <div>
            <h2>刘洋</h2>
            <p>研究生。最近在看 3DGS、工业视觉和一些前后端工程化的小问题。</p>
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
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { getArticles } from '../../api/article'

useHead({
  title: 'Liu Yang\'s Blog',
  meta: [
    { name: 'description', content: '记录 3DGS、计算机视觉、全栈开发的研究笔记' },
    { name: 'keywords', content: '3DGS,CV,Vue3,Spring Boot,博客' }
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
const loading = ref(false)
const keyword = ref((route.query.keyword as string) || '')
const selectedCategoryId = ref<number | undefined>(undefined)
const selectedTagId = ref<number | undefined>(undefined)
const page = ref(1)
const size = ref(10)
const total = ref(0)

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

onMounted(async () => {
  await fetchArticles()
  await nextTick()
  observeScrollReveal()
  fetchCategories()
  fetchTags()
  fetchArchives()
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

.profile-note img {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 18px;
  background: #eef4ff;
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
