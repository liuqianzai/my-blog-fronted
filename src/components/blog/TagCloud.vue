<template>
  <div class="glass-card rounded-2xl p-6">
    <h3 class="text-sm font-bold mb-4 flex items-center">
      <span class="mr-2">🏷️</span> 热门标签
    </h3>
    <div class="flex flex-wrap gap-2">
      <span v-for="tag in ['3DGS', 'Java', 'Python', 'Vue3', 'Docker', '深度学习']"
            :key="tag"
            class="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all">
        {{ tag }}
      </span>
    </div>
  </div>
</template>
