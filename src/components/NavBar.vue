<template>
  <nav class="fixed top-0 w-full h-16 glass-card z-50 flex items-center justify-between px-8">
    <router-link to="/" class="text-2xl font-bold text-primary tracking-tight cursor-pointer no-underline">
      Liu Yang<span class="text-text-main">.Blog</span>
    </router-link>

    <div class="hidden md:flex space-x-8 text-sm font-medium">
      <router-link to="/" class="nav-link">首页</router-link>
      <router-link to="/categories" class="nav-link">分类</router-link>
      <router-link to="/archives" class="nav-link">归档</router-link>
      <router-link to="/page/about" class="nav-link">关于</router-link>
      <router-link to="/friends" class="nav-link">友链</router-link>
    </div>

    <div class="flex items-center space-x-4">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索…"
        size="small"
        style="width: 160px"
        clearable
        @keyup.enter="handleSearch"
      />
      <template v-if="auth.isAuthenticated">
        <el-dropdown trigger="click">
          <button class="bg-primary text-white px-5 py-1.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95">
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
          <button class="bg-primary text-white px-5 py-1.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95">
            登录
          </button>
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const auth = useAuthStore()
const searchKeyword = ref('')

function handleSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/', query: { keyword: searchKeyword.value.trim() } })
  }
}

function goAdmin() {
  router.push('/admin')
}

function handleLogout() {
  auth.logout()
  router.push('/')
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
