<template>
  <div class="min-h-screen flex bg-gray-50">
    <aside class="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      <div class="h-14 flex items-center px-5 font-bold tracking-wide border-b border-gray-700">
        <router-link to="/admin/dashboard" class="hover:text-gray-300 transition">Admin Panel</router-link>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition"
          :class="$route.fullPath.startsWith(item.path) ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          <span v-html="item.icon" class="w-5 h-5 text-center" />
          {{ item.label }}
        </router-link>
      </nav>
      <div class="p-3 border-t border-gray-700">
        <p class="text-xs text-gray-500 px-2">v1.0.0</p>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <span class="font-bold text-gray-800 text-base">Liu Yang's Blog</span>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">{{ auth.nickname }}</span>
          <button @click="handleLogout" class="text-sm text-red-500 hover:text-red-700 font-medium transition">退出</button>
        </div>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '&#9632;' },
  { path: '/admin/articles', label: 'Articles', icon: '&#9776;' },
  { path: '/admin/categories', label: 'Categories', icon: '&#9635;' },
  { path: '/admin/tags', label: 'Tags', icon: '&#9830;' },
  { path: '/admin/comments', label: 'Comments', icon: '&#9993;' },
  { path: '/admin/pages', label: 'Pages', icon: '&#9641;' },
  { path: '/admin/friend-links', label: 'Friend Links', icon: '&#8861;' },
  { path: '/admin/configs', label: 'Configs', icon: '&#9881;' },
]

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>
