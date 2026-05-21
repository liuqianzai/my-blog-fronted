<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="w-full max-w-sm mx-4">
      <div class="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border">
        <h1 class="text-2xl font-extrabold text-center mb-2">登录</h1>
        <p class="text-sm text-text-sub text-center mb-6">Liu Yang's Blog 管理后台</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-text-main">用户名</label>
            <input v-model="form.username" type="text" required
                   class="w-full mt-1 px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
          </div>
          <div>
            <label class="text-sm font-medium text-text-main">密码</label>
            <input v-model="form.password" type="password" required
                   class="w-full mt-1 px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" />
          </div>
          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
          <button type="submit" :disabled="loading"
                  class="w-full bg-primary text-white py-2.5 rounded-xl font-medium hover:shadow-lg transition disabled:opacity-60">
            {{ loading ? '登录中...' : '登录' }}
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

const router = useRouter()
const auth = useAuthStore()
const form = ref({ username: 'admin', password: '123456' })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value)
    router.push('/admin')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
