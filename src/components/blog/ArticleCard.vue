<template>
  <div class="glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group">
    <div class="aspect-[16/10] overflow-hidden">
      <img
          :src="cover"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          alt="cover"
      />
    </div>

    <div class="p-6">
      <div class="flex space-x-2 mb-3">
        <span v-for="tag in tags" :key="tag" class="px-3 py-1 bg-blue-50 text-primary text-xs font-medium rounded-full">
          {{ tag }}
        </span>
      </div>
      <h3 class="text-xl font-bold text-text-main mb-3 line-clamp-2 group-hover:text-primary transition-colors">
        {{ title }}
      </h3>
      <p class="text-text-sub text-sm line-clamp-3 mb-4 leading-relaxed">
        {{ summary }}
      </p>
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>📅 {{ date }}</span>
        <span>👁️ {{ views }} 阅读</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  summary: string
  cover: string
  tags: string[]
  date: string
  views: number
}>()
</script>
