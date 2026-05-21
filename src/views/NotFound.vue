<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-9xl font-extrabold text-primary opacity-20">404</h1>
      <h2 class="text-2xl font-bold text-text-main mt-4">页面未找到</h2>
      <p class="text-text-sub mt-2">你访问的页面不存在或已被移除</p>
      <router-link to="/" class="inline-block mt-6 bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition">
        返回首页
      </router-link>
    </div>
  </div>
</template>
