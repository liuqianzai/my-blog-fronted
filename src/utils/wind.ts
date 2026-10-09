// 全局风场微动事件总线
type WindListener = (strength: number, dirX: number) => void

const listeners: Set<WindListener> = new Set()

export function onWindGust(fn: WindListener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function triggerWindGust(strength = 1.0, dirX = 1.0) {
  listeners.forEach(fn => {
    try {
      fn(strength, dirX)
    } catch {
      // 容错处理
    }
  })
}

// 铜钱挂件在视口中的实时空间锚点坐标 (供 WindStreamlines.vue 计算与水面的实时相对距离)
let currentCoinPos = { x: 0, y: 0, active: false }

export function registerCoinPosition(x: number, y: number) {
  currentCoinPos = { x, y, active: true }
}

export function unregisterCoinPosition() {
  currentCoinPos.active = false
}

export function getCoinPosition() {
  return currentCoinPos
}

// 铜钱沉浸水下状态变化总线 (WindStreamlines 判定水位是否覆盖并通知 FortuneTelling)
type CoinSubmergeListener = (submerged: boolean) => void
const coinSubmergeListeners: Set<CoinSubmergeListener> = new Set()
let currentCoinSubmerged = false

export function onCoinSubmergedStateChange(fn: CoinSubmergeListener) {
  coinSubmergeListeners.add(fn)
  return () => {
    coinSubmergeListeners.delete(fn)
  }
}

export function setCoinSubmergedState(submerged: boolean) {
  if (currentCoinSubmerged !== submerged) {
    currentCoinSubmerged = submerged
    coinSubmergeListeners.forEach(fn => {
      try {
        fn(submerged)
      } catch {
        // 容错处理
      }
    })
  }
}

export function isCoinSubmerged() {
  return currentCoinSubmerged
}
