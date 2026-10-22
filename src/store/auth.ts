import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import { isTokenExpired, clearAuthStorage } from '../utils/token'

export const useAuthStore = defineStore('auth', () => {
  const initialToken = localStorage.getItem('token') || ''
  const isInitialExpired = isTokenExpired(initialToken)

  if (initialToken && isInitialExpired) {
    clearAuthStorage()
  }

  const token = ref(isInitialExpired ? '' : initialToken)
  const user = ref(isInitialExpired ? {} : JSON.parse(localStorage.getItem('user') || '{}'))

  // 动态计算是否已登录（包含 JWT 过期时间实时校验，已过期则自动清除假登录态）
  const isAuthenticated = computed(() => {
    if (!token.value) return false
    if (isTokenExpired(token.value)) {
      token.value = ''
      user.value = {}
      clearAuthStorage()
      return false
    }
    return true
  })

  const username = computed(() => user.value.username || '')
  const nickname = computed(() => user.value.nickname || '')

  function checkTokenValidity(): boolean {
    if (!token.value || isTokenExpired(token.value)) {
      logout()
      return false
    }
    return true
  }

  async function login(loginForm: { username: string; password: string }) {
    const data: any = await request.post('/auth/login', loginForm)

    token.value = data.token
    user.value = { username: data.username, nickname: data.nickname }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = ''
    user.value = {}
    clearAuthStorage()
  }

  return { token, user, isAuthenticated, username, nickname, checkTokenValidity, login, logout }
})
