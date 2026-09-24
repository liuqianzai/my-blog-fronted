import { ref } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'

const THEME_KEY = 'theme-mode'

export const themeMode = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'auto')
export const isDark = ref<boolean>(false)

/**
 * 判断当前时间是否属于夜间 (18:00 - 06:00)
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
 * 更新 DOM 主题类名及响应式状态
 */
export function updateTheme() {
  let activeDark = false
  if (themeMode.value === 'dark') {
    activeDark = true
  } else if (themeMode.value === 'light') {
    activeDark = false
  } else {
    // auto 模式：结合系统时间 (18点-06点) 或 OS 深色主旨
    activeDark = isNightTime() || isSystemDark()
  }

  isDark.value = activeDark
  if (activeDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * 切换并持久化主题模式
 */
export function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode
  localStorage.setItem(THEME_KEY, mode)
  updateTheme()
}

/**
 * 循环切换主题模式：自动 -> 浅色 -> 深色 -> 自动
 */
export function cycleThemeMode() {
  if (themeMode.value === 'auto') {
    setThemeMode('light')
  } else if (themeMode.value === 'light') {
    setThemeMode('dark')
  } else {
    setThemeMode('auto')
  }
}

/**
 * 初始化主题监听与定时调度
 */
export function initTheme() {
  updateTheme()

  // 监听系统 OS 主题变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themeMode.value === 'auto') {
        updateTheme()
      }
    })
  }

  // 每 30 秒校验时间，自动处理 18:00 和 06:00 的模式切换
  setInterval(() => {
    if (themeMode.value === 'auto') {
      updateTheme()
    }
  }, 30000)
}
