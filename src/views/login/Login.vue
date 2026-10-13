<template>
  <div class="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden select-none transition-colors duration-300">
    <!-- 装饰背景光斑（营造暗色与浅色下的通透氛围感） -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

    <!-- 顶部操作栏：返回前台 & 主题模式快速切换 -->
    <div class="absolute top-6 left-6 right-6 flex items-center justify-between z-10 max-w-5xl mx-auto">
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition px-3 py-1.5 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 shadow-sm"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>返回博客首页</span>
      </router-link>

      <!-- 主题切换迷你胶囊 -->
      <div class="inline-flex items-center p-0.5 rounded-full bg-white/70 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/70 text-xs shadow-sm backdrop-blur-md">
        <button
          type="button"
          @click="setThemeMode('light')"
          :class="[
            'px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 cursor-pointer',
            themeMode === 'light'
              ? 'bg-amber-50 dark:bg-gray-700 text-amber-600 font-semibold shadow-xs'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          ]"
          title="浅色模式"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="hidden sm:inline">浅色</span>
        </button>

        <button
          type="button"
          @click="setThemeMode('auto')"
          :class="[
            'px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 cursor-pointer',
            themeMode === 'auto'
              ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          ]"
          title="自动模式 (结合日出日落)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="hidden sm:inline">自动</span>
        </button>

        <button
          type="button"
          @click="setThemeMode('dark')"
          :class="[
            'px-2 py-1 rounded-full flex items-center gap-1 transition-all duration-200 cursor-pointer',
            themeMode === 'dark'
              ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-500 dark:text-indigo-400 font-semibold shadow-xs'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          ]"
          title="深色模式"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span class="hidden sm:inline">深色</span>
        </button>
      </div>
    </div>

    <!-- 登录主卡片 -->
    <div class="w-full max-w-sm relative z-10">
      <div class="glass-card bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl rounded-3xl p-8 sm:p-9 shadow-2xl border border-gray-200/80 dark:border-gray-800 transition-colors duration-300">
        <!-- 头部图标与标题 -->
        <div class="text-center mb-7">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary mb-3 shadow-inner">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">管理后台登录</h1>
          <p class="text-xs text-text-sub mt-1.5">Liu Yang's Blog · 身份认证凭据</p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              用户名
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
                </svg>
              </span>
              <input
                v-model="form.username"
                type="text"
                autocomplete="username"
                required
                placeholder="请输入管理账号"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              密码
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                required
                placeholder="请输入管理密码"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition backdrop-blur-sm"
              />
            </div>
          </div>

          <!-- 错误信息提示 -->
          <div v-if="error" class="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ loading ? '验证身份中...' : '立即登录' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { themeMode, setThemeMode } from '../../utils/theme'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value)
    router.push('/admin')
  } catch (e: any) {
    error.value = e.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>
