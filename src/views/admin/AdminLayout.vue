<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-200">
    <aside class="w-60 bg-gray-900 text-white flex flex-col shrink-0 border-r border-gray-800">
      <div class="h-14 flex items-center justify-between px-5 font-bold tracking-wide border-b border-gray-800">
        <router-link to="/admin/dashboard" class="hover:text-gray-300 transition flex items-center gap-2">
          <span>管理后台</span>
        </router-link>
        <router-link to="/" class="text-xs font-normal text-gray-400 hover:text-white transition">
          返回前台
        </router-link>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition"
          :class="$route.fullPath.startsWith(item.path) ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'"
        >
          <span v-html="item.icon" class="w-5 h-5 text-center" />
          {{ item.label }}
        </router-link>
      </nav>
      <div class="p-3 border-t border-gray-800">
        <p class="text-xs text-gray-500 px-2">v1.0.0</p>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
        <span class="font-bold text-gray-800 dark:text-gray-100 text-base">Liu Yang's Blog</span>
        <div class="flex items-center gap-4">
          <!-- 主题切换胶囊 -->
          <div class="inline-flex items-center p-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs shadow-inner shrink-0">
            <button
              type="button"
              @click="setThemeMode('light')"
              :class="[
                'px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 select-none cursor-pointer',
                themeMode === 'light'
                  ? 'bg-white dark:bg-gray-700 text-amber-500 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
              title="浅色模式"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>浅色</span>
            </button>
            <button
              type="button"
              @click="setThemeMode('auto')"
              :class="[
                'px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 select-none cursor-pointer',
                themeMode === 'auto'
                  ? 'bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
              :title="`自动模式：结合日出(${sunriseTimeStr})与日落(${sunsetTimeStr})`"
            >
              <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path class="text-amber-500" fill="currentColor" stroke="none" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path class="text-amber-500" stroke="currentColor" d="M12 4V2M4.93 4.93L3.51 3.51M4 12H2M4.93 19.07l-1.42 1.42M12 20v2" />
                <path class="text-indigo-400" fill="currentColor" stroke="none" d="M12 3a9 9 0 0 1 9 9 9 9 0 0 0 6-8.5A8.5 8.5 0 0 0 12 3z" />
              </svg>
              <span>自动</span>
            </button>
            <button
              type="button"
              @click="setThemeMode('dark')"
              :class="[
                'px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 select-none cursor-pointer',
                themeMode === 'dark'
                  ? 'bg-white dark:bg-gray-700 text-indigo-400 font-semibold shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
              title="深色模式"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>深色</span>
            </button>
          </div>

          <span class="text-sm text-gray-500 dark:text-gray-400">{{ auth.nickname }}</span>
          <button @click="handleLogout" class="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition">退出</button>
        </div>
      </header>
      <main class="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { themeMode, setThemeMode, sunriseTimeStr, sunsetTimeStr } from '../../utils/theme'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { path: '/admin/dashboard', label: '仪表盘', icon: '&#9632;' },
  { path: '/admin/articles', label: '文章管理', icon: '&#9776;' },
  { path: '/admin/categories', label: '分类管理', icon: '&#9635;' },
  { path: '/admin/tags', label: '标签管理', icon: '&#9830;' },
  { path: '/admin/comments', label: '评论管理', icon: '&#9993;' },
  { path: '/admin/pages', label: '页面管理', icon: '&#9641;' },
  { path: '/admin/friend-links', label: '友链管理', icon: '&#8861;' },
  { path: '/admin/configs', label: '系统配置', icon: '&#9881;' },
]

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>
