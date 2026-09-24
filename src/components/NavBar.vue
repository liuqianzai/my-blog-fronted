<template>
  <nav class="fixed top-0 w-full h-16 glass-card z-50 flex items-center justify-between px-3 sm:px-6 md:px-8 gap-2">
    <!-- Logo -->
    <router-link
      to="/"
      class="text-base sm:text-xl md:text-2xl font-bold text-primary tracking-tight cursor-pointer no-underline whitespace-nowrap shrink-0 max-w-[150px] sm:max-w-none truncate"
    >
      {{ getConfigValue('site_title', "Liu Yang's Blog") }}
    </router-link>

    <!-- Desktop Navigation Links -->
    <div class="hidden md:flex space-x-8 text-sm font-medium">
      <router-link to="/" class="nav-link">首页</router-link>
      <router-link to="/categories" class="nav-link">分类</router-link>
      <router-link to="/archives" class="nav-link">归档</router-link>
      <router-link to="/friends" class="nav-link">友链</router-link>
      <router-link
        v-for="page in publishedPages"
        :key="page.id"
        :to="`/page/${page.slug}`"
        class="nav-link"
      >
        {{ page.title }}
      </router-link>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center space-x-2 sm:space-x-3 shrink-0">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索…"
        size="small"
        class="!w-24 sm:!w-32 md:!w-40"
        clearable
        @keyup.enter="handleSearch"
      />

      <!-- Left / Center / Right Segmented Theme Switcher -->
      <div class="inline-flex items-center p-0.5 rounded-full bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 text-xs shadow-inner shrink-0">
        <!-- Left: Light / Sun -->
        <button
          type="button"
          @click="setThemeMode('light')"
          :class="[
            'px-2 py-1 rounded-full flex items-center space-x-1 transition-all duration-200 select-none cursor-pointer',
            themeMode === 'light'
              ? 'bg-white dark:bg-gray-700 text-amber-500 font-semibold shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
          title="手动浅色模式"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="hidden sm:inline">浅色</span>
        </button>

        <!-- Center: Auto / Sun+Moon Combined -->
        <button
          type="button"
          @click="setThemeMode('auto')"
          :class="[
            'px-2 py-1 rounded-full flex items-center space-x-1 transition-all duration-200 select-none cursor-pointer',
            themeMode === 'auto'
              ? 'bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400 font-semibold shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
          :title="`自动模式：结合地理位置动态计算日出(${sunriseTimeStr})与日落(${sunsetTimeStr})`"
        >
          <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path class="text-amber-500" fill="currentColor" stroke="none" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path class="text-amber-500" stroke="currentColor" d="M12 4V2M4.93 4.93L3.51 3.51M4 12H2M4.93 19.07l-1.42 1.42M12 20v2" />
            <path class="text-indigo-400" fill="currentColor" stroke="none" d="M12 3a9 9 0 0 1 9 9 9 9 0 0 0 6-8.5A8.5 8.5 0 0 0 12 3z" />
          </svg>
          <span class="hidden sm:inline">自动</span>
        </button>

        <!-- Right: Dark / Moon -->
        <button
          type="button"
          @click="setThemeMode('dark')"
          :class="[
            'px-2 py-1 rounded-full flex items-center space-x-1 transition-all duration-200 select-none cursor-pointer',
            themeMode === 'dark'
              ? 'bg-white dark:bg-gray-700 text-indigo-400 font-semibold shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
          title="手动深色模式"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span class="hidden sm:inline">深色</span>
        </button>
      </div>

      <template v-if="auth.isAuthenticated">
        <el-dropdown trigger="click">
          <button class="bg-primary text-white px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
            {{ auth.nickname || auth.username }}
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goAdmin">管理后台</el-dropdown-item>
              <el-dropdown-item @click="handleLogout">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <template v-else>
        <router-link to="/login">
          <button class="bg-primary text-white px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
            登录
          </button>
        </router-link>
      </template>

      <!-- Mobile Menu Toggle Button -->
      <button
        type="button"
        @click="showMobileMenu = !showMobileMenu"
        class="md:hidden p-1 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100/80 transition"
        aria-label="Toggle Menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!showMobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>

  <!-- Mobile Menu Dropdown -->
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform -translate-y-4 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-4 opacity-0"
  >
    <div
      v-if="showMobileMenu"
      class="fixed top-16 left-0 w-full glass-card border-b border-gray-100/80 z-40 md:hidden px-4 py-3 shadow-lg space-y-2"
    >
      <router-link to="/" class="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-primary" @click="showMobileMenu = false">首页</router-link>
      <router-link to="/categories" class="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-primary" @click="showMobileMenu = false">分类</router-link>
      <router-link to="/archives" class="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-primary" @click="showMobileMenu = false">归档</router-link>
      <router-link to="/friends" class="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-primary" @click="showMobileMenu = false">友链</router-link>
      <router-link
        v-for="page in publishedPages"
        :key="page.id"
        :to="`/page/${page.slug}`"
        class="block py-2 px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-primary"
        @click="showMobileMenu = false"
      >
        {{ page.title }}
      </router-link>

      <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-3 text-xs">
        <span class="font-medium text-gray-600 dark:text-gray-300">外观主题</span>
        <div class="inline-flex items-center p-0.5 rounded-lg bg-gray-100 dark:bg-gray-800">
          <button
            type="button"
            @click="setThemeMode('light')"
            :class="['px-2.5 py-1 rounded-md transition', themeMode === 'light' ? 'bg-white dark:bg-gray-700 text-amber-500 font-semibold shadow-sm' : 'text-gray-500 dark:text-gray-400']"
          >
            浅色
          </button>
          <button
            type="button"
            @click="setThemeMode('auto')"
            :class="['px-2.5 py-1 rounded-md transition', themeMode === 'auto' ? 'bg-white dark:bg-gray-700 text-blue-500 font-semibold shadow-sm' : 'text-gray-500 dark:text-gray-400']"
          >
            自动
          </button>
          <button
            type="button"
            @click="setThemeMode('dark')"
            :class="['px-2.5 py-1 rounded-md transition', themeMode === 'dark' ? 'bg-white dark:bg-gray-700 text-indigo-400 font-semibold shadow-sm' : 'text-gray-500 dark:text-gray-400']"
          >
            深色
          </button>
        </div>
      </div>
      <div v-if="themeMode === 'auto'" class="text-[11px] text-gray-400 text-right px-3">
        今日动态日出 {{ sunriseTimeStr }} · 日落 {{ sunsetTimeStr }}
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { loadConfigs, getConfigValue } from '../utils/config'
import { getPublishedPages } from '../api/page'
import { themeMode, setThemeMode, sunriseTimeStr, sunsetTimeStr } from '../utils/theme'

interface PageItem {
  id: number
  title: string
  slug: string
}

const router = useRouter()
const auth = useAuthStore()
const searchKeyword = ref('')
const publishedPages = ref<PageItem[]>([])
const showMobileMenu = ref(false)

onMounted(async () => {
  loadConfigs()
  try {
    publishedPages.value = await getPublishedPages()
  } catch { /* ignore */ }
})

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/', query: { keyword: searchKeyword.value.trim() } })
    showMobileMenu.value = false
  }
}

function goAdmin() {
  router.push('/admin')
  showMobileMenu.value = false
}

function handleLogout() {
  auth.logout()
  router.push('/')
  showMobileMenu.value = false
}
</script>

<style scoped>
.nav-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--el-color-primary, #315fbd);
}
</style>
