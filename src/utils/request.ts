import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

function requiresAuth(config: any): boolean {
  const url = config.url || ''
  const method = (config.method || '').toLowerCase()
  
  if (url.startsWith('/admin')) {
    return true
  }
  
  const isWrite = ['post', 'put', 'delete', 'patch'].includes(method)
  const isPublicWrite = url === '/comments' || url === '/auth/login'
  
  if (isWrite && !isPublicWrite) {
    return true
  }
  
  return false
}

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && requiresAuth(config)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (res) => {
    const { code, message, data } = res.data
    if (code !== 200) {
      if (code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login'
        }
      }
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message))
    }
    return data
  },
  (err) => {
    if (err.response) {
      const { status } = err.response
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/login'
          }
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(`请求失败：${status}`)
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(err)
  },
)

export default request
