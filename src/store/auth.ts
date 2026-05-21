import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

  const isAuthenticated = computed(() => !!token.value)
  const username = computed(() => user.value.username || '')
  const nickname = computed(() => user.value.nickname || '')

  // 👇👇👇 只改了这一行！！！
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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, username, nickname, login, logout }
})
