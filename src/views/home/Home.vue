<template>
  <div class="relative">
    <section class="py-16 text-center">
      <h1 class="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
        探索 <span class="text-primary text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">技术</span> 与生活的边界
      </h1>
      <p class="text-text-sub text-lg max-w-2xl mx-auto">
        记录编程心得、3DGS 研究沉淀与日常思考。
      </p>
    </section>
    <section class="py-20 text-center relative overflow-hidden">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full">
        <div class="absolute top-0 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/50 border border-gray-100 mb-6 shadow-sm">
    <span class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
        <span class="text-xs font-medium text-gray-500">Thinking about 3DGS...</span>
      </div>

      <h1 class="text-6xl font-extrabold mb-6 tracking-tighter">
        Explore <span class="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Intelligence</span>
      </h1>
    </section>
    <div class="flex flex-col lg:flex-row gap-8">

      <div class="lg:w-9/12 space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ArticleCard
              v-for="i in 6"
              :key="i"
              title="Spring Boot 3.0 与 Vue 3 全栈开发实战指南"
              summary="本文将深入探讨如何使用最新的 Spring Boot 3.0 框架与 Vue 3 构建高性能、响应式的现代 Web 应用..."
              cover="https://picsum.photos/seed/blog/800/500"
              :tags="['Java', 'Vue3']"
              date="2026-04-21"
              :views="1240"
          />
        </div>
        <div class="flex justify-center pt-8">
          <el-pagination background layout="prev, pager, next" :total="50" />
        </div>
      </div>

      <aside class="lg:w-3/12 space-y-6">
        <ProfileCard />
        <StatsCard />
        <TagCloud />
      </aside>

    </div>
  </div>
</template>

<script setup lang="ts">
import ArticleCard from '../../components/blog/ArticleCard.vue'
import ProfileCard from '../../components/blog/ProfileCard.vue'
import StatsCard from '../../components/blog/StatsCard.vue'
import TagCloud from '../../components/blog/TagCloud.vue'
</script>
