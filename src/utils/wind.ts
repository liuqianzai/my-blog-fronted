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
