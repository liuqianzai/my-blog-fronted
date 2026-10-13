<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">仪表盘</h1>
    <div v-if="loading" class="text-gray-500 dark:text-gray-400">加载中...</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="card in cards" :key="card.label" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardStats, DashboardStats } from '../../api/dashboard'

const loading = ref(true)
const stats = ref<DashboardStats>({
  totalArticles: 0,
  publishedArticles: 0,
  hiddenArticles: 0,
  totalTags: 0,
  totalCategories: 0,
  totalComments: 0,
  pendingComments: 0,
  totalViews: 0,
})

const cards = ref<{ label: string; value: number }[]>([])

onMounted(async () => {
  try {
    stats.value = await getDashboardStats()
  } finally {
    loading.value = false
  }
})

function buildCards(s: DashboardStats) {
  return [
    { label: '文章总数', value: s.totalArticles },
    { label: '已发布', value: s.publishedArticles },
    { label: '草稿', value: s.hiddenArticles },
    { label: '标签数', value: s.totalTags },
    { label: '分类数', value: s.totalCategories },
    { label: '评论总数', value: s.totalComments },
    { label: '待审核评论', value: s.pendingComments },
    { label: '总阅读量', value: s.totalViews },
  ]
}

import { watch } from 'vue'
watch(stats, (s) => {
  cards.value = buildCards(s)
}, { immediate: true })
</script>
