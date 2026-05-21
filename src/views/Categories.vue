<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-extrabold text-text-main mb-8">分类</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link
        v-for="cat in categories"
        :key="cat.id"
        :to="{ path: '/', query: { categoryId: cat.id } }"
        class="block p-6 bg-white/60 backdrop-blur-md rounded-2xl border hover:shadow-lg hover:-translate-y-1 transition-all"
      >
        <h2 class="text-xl font-bold text-text-main">{{ cat.name }}</h2>
        <p class="text-sm text-text-sub mt-2">{{ cat.description || '暂无描述' }}</p>
      </router-link>
    </div>
    <div v-if="!categories.length" class="text-center py-20 text-text-sub">暂无分类</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCategories, type Category } from '../api/category'

const categories = ref<Category[]>([])

onMounted(async () => {
  categories.value = await getCategories()
})
</script>
