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
import { useHead } from '@vueuse/head'
import { getArticleDetail, type ArticleItem } from '../../api/article'
import { getComments, submitComment, type Comment } from '../../api/comment'
import { renderMarkdown } from '../../utils/markdown'

const route = useRoute()
const article = ref<ArticleItem | null>(null)

useHead({
  title: () => article.value?.title || '文章详情',
  meta: [
    { name: 'description', content: () => article.value?.summary || '' },
    { name: 'keywords', content: () => article.value?.tags?.map(t => t.name).join(',') || '' }
  ]
})
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
