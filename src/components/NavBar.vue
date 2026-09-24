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
    <div class="flex items-center space-x-2 sm:space-x-4 shrink-0">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索…"
        size="small"
        class="!w-24 sm:!w-36 md:!w-44"
        clearable
        @keyup.enter="handleSearch"
      />

      <!-- Combined Sun + Moon Theme Status Indicator -->
      <div
        class="p-1.5 rounded-full bg-gray-100/70 dark:bg-gray-800/70 transition-colors flex items-center justify-center shrink-0 cursor-default"
        :title="isDark ? '自动模式：处于夜间（18:00 - 06:00 深色模式）' : '自动模式：处于白天（06:00 - 18:00 浅色模式）'"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <!-- 太阳半侧（左） -->
          <path class="text-amber-500" fill="currentColor" stroke="none" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <path class="text-amber-500" stroke="currentColor" d="M12 4V2M4.93 4.93L3.51 3.51M4 12H2M4.93 19.07l-1.42 1.42M12 20v2" />
          <!-- 月牙半侧（右拼接） -->
          <path class="text-indigo-400" fill="currentColor" stroke="none" d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 0 6-8.5A8.5 8.5 0 0 0 12 3z" />
        </svg>
      </div>

      <template v-if="auth.isAuthenticated">
        <el-dropdown trigger="click">
          <button class="bg-primary text-white px-3 py-1 sm:px-5 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
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
          <button class="bg-primary text-white px-3 py-1 sm:px-5 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
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
      class="fixed top-16 left-0 w-full glass-card border-b border-gray-100/80 z-40 md:hidden px-4 py-3 shadow-lg space-y-1"
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

      <div class="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="flex items-center space-x-1.5">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path class="text-amber-500" fill="currentColor" stroke="none" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path class="text-amber-500" stroke="currentColor" d="M12 4V2M4.93 4.93L3.51 3.51M4 12H2M4.93 19.07l-1.42 1.42M12 20v2" />
            <path class="text-indigo-400" fill="currentColor" stroke="none" d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 0 0 0 6-8.5A8.5 8.5 0 0 0 12 3z" />
          </svg>
          <span>主题模式</span>
        </span>
        <span class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
          自动跟随日出日落时间
        </span>
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
import { isDark } from '../utils/theme'

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
