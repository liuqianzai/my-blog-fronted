<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-extrabold text-text-main mb-8">归档</h1>
    <div class="space-y-4">
      <div v-for="arc in archives" :key="arc.month" class="flex items-center gap-4">
        <span class="text-sm font-mono text-primary w-24">{{ arc.month }}</span>
        <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full" :style="{ width: (arc.count / maxCount * 100) + '%' }"></div>
        </div>
        <span class="text-sm text-text-sub w-16 text-right">{{ arc.count }} 篇</span>
      </div>
    </div>
    <div v-if="!archives.length" class="text-center py-20 text-text-sub">暂无归档数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getArchives, type Archive } from '../api/archive'

const archives = ref<Archive[]>([])
const maxCount = computed(() => Math.max(...archives.value.map(a => a.count), 1))

onMounted(async () => {
  archives.value = await getArchives()
})
</script>
