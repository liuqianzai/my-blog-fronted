<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-6">Dashboard</h1>
    <div v-if="loading" class="text-gray-500">Loading...</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="card in cards" :key="card.label" class="bg-white rounded-xl border p-5 hover:shadow-md transition">
        <p class="text-sm text-gray-500">{{ card.label }}</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ card.value }}</p>
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
    { label: 'Total Articles', value: s.totalArticles },
    { label: 'Published', value: s.publishedArticles },
    { label: 'Hidden', value: s.hiddenArticles },
    { label: 'Tags', value: s.totalTags },
    { label: 'Categories', value: s.totalCategories },
    { label: 'Comments', value: s.totalComments },
    { label: 'Pending Comments', value: s.pendingComments },
    { label: 'Total Views', value: s.totalViews },
  ]
}

import { watch } from 'vue'
watch(stats, (s) => {
  cards.value = buildCards(s)
}, { immediate: true })
</script>
