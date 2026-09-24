import { ref } from 'vue'

export const isDark = ref<boolean>(false)

/**
 * 判断当前时间是否处于夜间 (日落 18:00 到 日出 06:00)
 */
export function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6
}

/**
 * 判断系统 OS 是否设置为深色模式
 */
export function isSystemDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 根据日落日出时间 (或 OS 系统偏好) 自动更新 DOM 主题
 */
export function updateTheme() {
  const activeDark = isNightTime() || isSystemDark()
  isDark.value = activeDark
  if (activeDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * 初始化主题监听与定时检查
 */
export function initTheme() {
  updateTheme()

  // 监听 OS 系统偏好变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      updateTheme()
    })
  }

  // 每 30 秒轮询系统时间，自动在日落 (18:00) 和日出 (06:00) 切换主题
  setInterval(() => {
    updateTheme()
  }, 30000)
}
