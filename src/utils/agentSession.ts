/**
 * 智能体小宠物会话与防打扰频控工具
 */

const STORAGE_KEY_VISITOR_SESSION = 'agent_visitor_session_id'
const STORAGE_KEY_MUTE_UNTIL = 'agent_pet_muted_until'

// 被动事件（如页面进入、冷启动）防打扰冷却时间：180 秒 (3分钟)
const PASSIVE_COOLDOWN_MS = 180 * 1000

// 频繁切页防抖阈值：10 秒
const ROUTE_FLIP_DEBOUNCE_MS = 10 * 1000

// 运行时内存记录
let lastRouteFlipTimestamp = 0
let lastPassiveBubbleTimestamp = 0

/**
 * 获取或初始化访客会话标识 (存入 sessionStorage，关闭标签页即重置)
 */
export function getVisitorSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(STORAGE_KEY_VISITOR_SESSION)
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem(STORAGE_KEY_VISITOR_SESSION, sessionId)
    }
    return sessionId
  } catch (_e) {
    return `session_${Date.now()}`
  }
}

/**
 * 检查当前访客是否已开启“今日静音”
 */
export function isMutedToday(): boolean {
  try {
    const muteUntilStr = localStorage.getItem(STORAGE_KEY_MUTE_UNTIL)
    if (!muteUntilStr) return false
    const muteUntil = parseInt(muteUntilStr, 10)
    if (isNaN(muteUntil)) return false
    if (Date.now() > muteUntil) {
      // 已过静音期，自动清理
      localStorage.removeItem(STORAGE_KEY_MUTE_UNTIL)
      return false
    }
    return true
  } catch (_e) {
    return false
  }
}

/**
 * 开启今日静音 (静音至今天 23:59:59)
 */
export function muteToday(): void {
  try {
    const tonight = new Date()
    tonight.setHours(23, 59, 59, 999)
    localStorage.setItem(STORAGE_KEY_MUTE_UNTIL, tonight.getTime().toString())
  } catch (_e) {
    // 忽略存储异常
  }
}

/**
 * 解除静音
 */
export function unmute(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_MUTE_UNTIL)
  } catch (_e) {
    // 忽略存储异常
  }
}

/**
 * 记录一次路由切换，并判断是否触发 10 秒内连续切页防抖抑制
 */
export function recordRouteChangeAndCheckDebounced(): boolean {
  const now = Date.now()
  const isDebounced = (now - lastRouteFlipTimestamp) < ROUTE_FLIP_DEBOUNCE_MS
  lastRouteFlipTimestamp = now
  return isDebounced
}

/**
 * 检查被动事件是否处于 3 分钟冷却中
 */
export function isPassiveCooldownActive(): boolean {
  const now = Date.now()
  return (now - lastPassiveBubbleTimestamp) < PASSIVE_COOLDOWN_MS
}

/**
 * 更新被动事件气泡弹出时间戳
 */
export function markPassiveBubbleShown(): void {
  lastPassiveBubbleTimestamp = Date.now()
}
