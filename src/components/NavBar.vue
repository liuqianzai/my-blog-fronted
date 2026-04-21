<template>
  <nav class="fixed top-0 w-full h-16 glass-card z-50 flex items-center justify-between px-8">
    <div class="text-2xl font-bold text-primary tracking-tight cursor-pointer">
      Liu Yang<span class="text-text-main">.Blog</span>
    </div>

    <div class="hidden md:flex space-x-8 text-sm font-medium">
      <a href="#" class="hover:text-primary transition-colors">首页</a>
      <a href="#" class="hover:text-primary transition-colors">文章</a>
      <a href="#" class="hover:text-primary transition-colors">项目</a>
      <a href="#" class="hover:text-primary transition-colors">关于</a>
    </div>

    <div class="flex items-center space-x-4">
      <button class="p-2 hover:bg-gray-100 rounded-full transition">
        🔍
      </button>
      <button class="bg-primary text-white px-5 py-1.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95">
        登录
      </button>
    </div>
  </nav>
</template>
