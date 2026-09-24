import { ref } from 'vue'

export type ThemeMode = 'auto' | 'light' | 'dark'

const THEME_KEY = 'theme-mode'

export const themeMode = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'auto')
export const isDark = ref<boolean>(false)
export const sunriseTimeStr = ref<string>('06:00')
export const sunsetTimeStr = ref<string>('18:00')

let userLat = 31.2304
let userLng = 121.4737

if (typeof window !== 'undefined' && 'geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat = pos.coords.latitude
      userLng = pos.coords.longitude
      updateTheme()
    },
    () => { /* 降级使用默认经纬度 */ }
  )
}

/**
 * 动态计算指定日期与地理坐标的日出日落时间
 */
export function getSunriseSunset(date = new Date(), lat = userLat, lng = userLng) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
  const zenith = 90.833 // 官方日出日落天顶角

  const lngHour = lng / 15
  const tSunrise = dayOfYear + ((6 - lngHour) / 24)
  const tSunset = dayOfYear + ((18 - lngHour) / 24)

  const calcTime = (t: number, isSunrise: boolean) => {
    const M = (0.9856 * t) - 3.289
    let L = M + (1.916 * Math.sin(M * Math.PI / 180)) + (0.020 * Math.sin(2 * M * Math.PI / 180)) + 282.634
    L = (L + 360) % 360

    const sinDec = 0.39782 * Math.sin(L * Math.PI / 180)
    const cosDec = Math.cos(Math.asin(sinDec))
    const cosH = (Math.cos(zenith * Math.PI / 180) - (sinDec * Math.sin(lat * Math.PI / 180))) / (cosDec * Math.cos(lat * Math.PI / 180))

    if (cosH > 1) return isSunrise ? 6 : 18
    if (cosH < -1) return isSunrise ? 0 : 24

    let H = isSunrise ? 360 - Math.acos(cosH) * 180 / Math.PI : Math.acos(cosH) * 180 / Math.PI
    H = H / 15

    const T = H + L / 15 - 0.06571 * t - 6.622
    let UT = (T - lngHour + 24) % 24

    const localOffset = -date.getTimezoneOffset() / 60
    return (UT + localOffset + 24) % 24
  }

  const sunrise = calcTime(tSunrise, true)
  const sunset = calcTime(tSunset, false)

  return { sunrise, sunset }
}

/**
 * 判断当前时刻是否处于夜间（日落至次日日出）
 */
export function isNightTime(): boolean {
  const now = new Date()
  const { sunrise, sunset } = getSunriseSunset(now)

  const formatTime = (hoursFloat: number) => {
    const h = Math.floor(hoursFloat)
    const m = Math.floor((hoursFloat - h) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  sunriseTimeStr.value = formatTime(sunrise)
  sunsetTimeStr.value = formatTime(sunset)

  const currentHoursFloat = now.getHours() + now.getMinutes() / 60
  return currentHoursFloat >= sunset || currentHoursFloat < sunrise
}

/**
 * 判断 OS 是否设置为深色主旨
 */
export function isSystemDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 根据主题模式状态更新 DOM
 */
export function updateTheme() {
  let activeDark = false
  if (themeMode.value === 'dark') {
    activeDark = true
  } else if (themeMode.value === 'light') {
    activeDark = false
  } else {
    // 自动模式：基于天文算法动态计算的日出日落时间 (或 OS 系统偏好)
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
 * 初始化主题监听与定时检验
 */
export function initTheme() {
  updateTheme()

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themeMode.value === 'auto') {
        updateTheme()
      }
    })
  }

  // 每 30 秒轮询更新
  setInterval(() => {
    if (themeMode.value === 'auto') {
      updateTheme()
    }
  }, 30000)
}
