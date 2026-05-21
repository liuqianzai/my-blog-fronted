<template>
  <div class="page-view" v-loading="loading">
    <div v-if="page">
      <h1>{{ page.title }}</h1>
      <div class="page-content" v-html="page.content"></div>
    </div>
    <div v-else-if="!loading" class="empty-state">页面不存在</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPageBySlug } from '../api/page'
import type { Page } from '../api/page'

const route = useRoute()
const page = ref<Page | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    page.value = await getPageBySlug(route.params.slug as string)
  } catch {
    page.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 0;
}

.page-view h1 {
  font-size: 2rem;
  font-weight: 850;
  color: var(--ink, #172033);
  margin-bottom: 28px;
}

.page-content {
  line-height: 1.9;
  color: var(--muted, #68758a);
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--muted, #68758a);
}
</style>
