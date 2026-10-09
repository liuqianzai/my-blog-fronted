<template>
  <!-- 风本无形 · 因物成风：白天花叶穿堂漫卷掠向远方，夜晚竹叶入水微荡月光涟漪 -->
  <div class="wind-stream-container fixed inset-0 pointer-events-none z-[1] overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full block"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { isDark } from '../utils/theme'
import { triggerWindGust } from '../utils/wind'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

// ==========================================
// 数据模型：无形风场中的自然实体与空间微尘
// ==========================================

// 1. 白天自然飞舞之物（樱花瓣、桃花瓣、春萌柳叶、银杏秋叶）—— 自由乘风飞掠，无卡顿停留
interface DayNatureItem {
  kind: 'sakura' | 'peach' | 'leaf-green' | 'leaf-gold'
  x: number
  y: number
  vx: number
  vy: number
  baseSize: number
  rotation: number
  rotSpeed: number
  pitchAngle: number  // 3D 俯仰翻转
  pitchSpeed: number
  rollAngle: number   // 3D 侧翻滚转
  rollSpeed: number
  swayPhase: number
  swaySpeed: number
  swayAmp: number
  alpha: number
  maxAlpha: number
  depth: number       // 0.4(远景深空) ~ 1.6(近景掠过眼前)
  lift: number        // 迎风气动升力 (呈现乘风起伏)
}

// 2. 夜晚月下飞舞之物（月下修竹碧叶 + 夜昙冷白花瓣）—— 触水微澜
interface NightNatureItem {
  kind: 'bamboo' | 'night-petal'
  x: number
  y: number
  vx: number
  vy: number
  baseSize: number
  rotation: number
  rotSpeed: number
  pitchAngle: number
  pitchSpeed: number
  rollAngle: number
  rollSpeed: number
  swayPhase: number
  swaySpeed: number
  swayAmp: number
  alpha: number
  maxAlpha: number
  depth: number
  lift: number
  // 触水状态：airborne(空中飘飞) -> floating(落入静水泛起微澜并随波微漂)
  state: 'airborne' | 'floating'
  waterY: number
  floatTimer: number
}

// 3. 夜间落水微波涟漪
interface WaterRipple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  growthSpeed: number
  color: string
}

// 4. 白天阳光微尘浮粒（空气中漂浮的细微金色光尘，体现空气本身的流动感）
interface SunDust {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  maxAlpha: number
  pulsePhase: number
  pulseSpeed: number
  depth: number
  seed: number
}

// 5. 夜幕月光萤火虫（夜间静谧游弋的微光生物）
interface NightFirefly {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  maxAlpha: number
  pulsePhase: number
  pulseSpeed: number
  colorTheme: 'cyan' | 'gold' | 'azure'
  floatAngle: number
  depth: number
}

let dayNatureItems: DayNatureItem[] = []
let nightNatureItems: NightNatureItem[] = []
let waterRipples: WaterRipple[] = []
let sunDusts: SunDust[] = []
let nightFireflies: NightFirefly[] = []

// 无形风场全局时间与自然呼吸律动
let globalTime = 0
let gustIntensity = 1.0  // 阵风起伏
let breathingCycle = 1.0 // 16~20秒宏观呼吸和风潮

// 无形流体风场：根据坐标与时间计算无形气流的微涡旋与抬升矢量
function getAtmosphericWind(x: number, y: number, t: number) {
  const waveX = Math.sin(x * 0.0018 + t * 0.9 + y * 0.0008) * 0.8 + Math.cos(x * 0.0035 - t * 0.6) * 0.4
  const waveY = Math.sin(x * 0.0022 + t * 1.1) * 0.45 + Math.cos(y * 0.0028 - t * 0.7) * 0.25
  return { waveX, waveY }
}

function initWindScene() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    spawnInitialElements(canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)

  // 自然和风潮汐 (每隔 10 ~ 13 秒掠过一阵自然和风，带动落英与铜钱挂坠共鸣)
  const gustInterval = setInterval(() => {
    gustIntensity = 1.45 + Math.random() * 0.25
    triggerWindGust(0.38 + Math.random() * 0.18, 1)
  }, 11000)

  const loop = () => {
    animId = requestAnimationFrame(loop)
    updateWind(canvas.width, canvas.height)
    renderWind(ctx, canvas.width, canvas.height)
  }
  loop()

  onUnmounted(() => {
    clearInterval(gustInterval)
    window.removeEventListener('resize', resize)
    if (animId !== null) {
      cancelAnimationFrame(animId)
      animId = null
    }
  })
}

function spawnInitialElements(w: number, h: number) {
  dayNatureItems = []
  nightNatureItems = []
  waterRipples = []
  sunDusts = []
  nightFireflies = []

  // 1. 白天自然落叶与花瓣：平视穿堂风，近大远小多层景深，自由翱翔飘掠
  const dayNatureCount = Math.max(22, Math.floor(w / 65))
  for (let i = 0; i < dayNatureCount; i++) {
    dayNatureItems.push(createDayNatureItem(w, h, true))
  }

  // 2. 夜间月下修竹碧叶 + 夜昙冷白花瓣
  const nightNatureCount = Math.max(18, Math.floor(w / 75))
  for (let i = 0; i < nightNatureCount; i++) {
    nightNatureItems.push(createNightNatureItem(w, h, true))
  }

  // 3. 白天阳光空气微尘浮粒 (营造空间充盈感)
  const dustCount = Math.max(26, Math.floor(w / 55))
  for (let i = 0; i < dustCount; i++) {
    sunDusts.push(createSunDust(w, h, true))
  }

  // 4. 夜幕月光萤火虫
  const fireflyCount = Math.max(18, Math.floor(w / 75))
  for (let i = 0; i < fireflyCount; i++) {
    nightFireflies.push(createNightFirefly(w, h, true))
  }
}

function createDayNatureItem(w: number, h: number, randomStart = false): DayNatureItem {
  const kinds: ('sakura' | 'peach' | 'leaf-green' | 'leaf-gold')[] = [
    'sakura', 'peach', 'sakura', 'leaf-green', 'leaf-gold'
  ]
  const kind = kinds[Math.floor(Math.random() * kinds.length)]

  // 景深透视：远景深邃微小，中景标准，近景偶然掠过镜头眼前
  const depthRand = Math.random()
  let depth = 0.8 + Math.random() * 0.4
  if (depthRand < 0.22) {
    depth = 0.45 + Math.random() * 0.25
  } else if (depthRand > 0.85) {
    depth = 1.35 + Math.random() * 0.35 // 前景花瓣轻掠眼前
  }

  const baseSize = kind.startsWith('leaf') ? (Math.random() * 3.5 + 7.5) : (Math.random() * 3 + 6.5)

  return {
    kind,
    x: randomStart ? Math.random() * w : -40 - Math.random() * 120,
    y: randomStart ? Math.random() * (h * 0.95) : Math.random() * (h * 0.85) - 30,
    // 水平微风流速与景深正相关
    vx: (Math.random() * 1.6 + 1.1) * (0.6 + depth * 0.5),
    vy: (Math.random() * 0.7 + 0.3) * (0.7 + depth * 0.4),
    baseSize,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.038,
    pitchAngle: Math.random() * Math.PI * 2,
    pitchSpeed: Math.random() * 0.032 + 0.015,
    rollAngle: Math.random() * Math.PI * 2,
    rollSpeed: Math.random() * 0.038 + 0.02,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.022 + 0.012,
    swayAmp: Math.random() * 1.6 + 0.8,
    alpha: randomStart ? (Math.random() * 0.4 + 0.5) : 0,
    maxAlpha: Math.random() * 0.22 + 0.68,
    depth,
    lift: 0
  }
}

function createNightNatureItem(w: number, h: number, randomStart = false): NightNatureItem {
  const kinds: ('bamboo' | 'night-petal')[] = ['bamboo', 'night-petal', 'bamboo']
  const kind = kinds[Math.floor(Math.random() * kinds.length)]

  const depthRand = Math.random()
  let depth = 0.8 + Math.random() * 0.4
  if (depthRand < 0.22) {
    depth = 0.45 + Math.random() * 0.25
  } else if (depthRand > 0.82) {
    depth = 1.35 + Math.random() * 0.35
  }

  const baseSize = kind === 'bamboo' ? (Math.random() * 3 + 8.5) : (Math.random() * 3 + 6.8)
  const waterY = h - 22 - Math.random() * 20

  return {
    kind,
    x: randomStart ? Math.random() * w : -40 - Math.random() * 120,
    y: randomStart ? Math.random() * (h * 0.75) : Math.random() * (h * 0.6) - 30,
    vx: (kind === 'bamboo' ? (Math.random() * 1.8 + 1.3) : (Math.random() * 1.5 + 1.0)) * (0.6 + depth * 0.5),
    vy: (Math.random() * 0.65 + 0.3) * (0.7 + depth * 0.4),
    baseSize,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * (kind === 'bamboo' ? 0.028 : 0.042),
    pitchAngle: Math.random() * Math.PI * 2,
    pitchSpeed: Math.random() * 0.03 + 0.015,
    rollAngle: Math.random() * Math.PI * 2,
    rollSpeed: Math.random() * 0.035 + 0.02,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.02 + 0.012,
    swayAmp: kind === 'bamboo' ? (Math.random() * 1.2 + 0.6) : (Math.random() * 1.8 + 0.9),
    alpha: randomStart ? (Math.random() * 0.4 + 0.5) : 0,
    maxAlpha: Math.random() * 0.2 + 0.72,
    depth,
    lift: 0,
    state: 'airborne',
    waterY,
    floatTimer: 0
  }
}

function createSunDust(w: number, h: number, randomStart = false): SunDust {
  const depth = Math.random() * 0.8 + 0.4
  return {
    x: randomStart ? Math.random() * w : -20 - Math.random() * 60,
    y: Math.random() * h,
    vx: (Math.random() * 0.8 + 0.5) * depth,
    vy: (Math.random() - 0.5) * 0.3,
    radius: (Math.random() * 1.6 + 0.8) * depth,
    alpha: randomStart ? (Math.random() * 0.4 + 0.2) : 0,
    maxAlpha: Math.random() * 0.45 + 0.25,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.03 + 0.015,
    depth,
    seed: Math.random() * 100
  }
}

function createNightFirefly(w: number, h: number, randomStart = false): NightFirefly {
  const depth = Math.random() * 0.8 + 0.5
  const themes: ('cyan' | 'gold' | 'azure')[] = ['cyan', 'gold', 'azure']
  return {
    x: randomStart ? Math.random() * w : -30 - Math.random() * 80,
    y: Math.random() * h,
    vx: (Math.random() * 0.9 + 0.6) * depth,
    vy: (Math.random() - 0.5) * 0.4,
    radius: (Math.random() * 2.2 + 1.2) * depth,
    alpha: randomStart ? (Math.random() * 0.4 + 0.2) : 0,
    maxAlpha: Math.random() * 0.55 + 0.35,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.035 + 0.018,
    colorTheme: themes[Math.floor(Math.random() * themes.length)],
    floatAngle: Math.random() * Math.PI * 2,
    depth
  }
}

function updateWind(w: number, h: number) {
  globalTime += 0.02
  const isNight = isDark.value

  breathingCycle = 1.0 + 0.22 * Math.sin(globalTime * 0.35) + 0.1 * Math.cos(globalTime * 0.18)

  if (gustIntensity > 1.0) {
    gustIntensity += (1.0 - gustIntensity) * 0.015
  }
  const currentWindFlow = gustIntensity * breathingCycle

  // ==========================================
  // 1. 白天模式更新：自由翱翔飞掠 · 顺风穿堂掠向远方 (无卡顿停留)
  // ==========================================
  if (!isNight) {
    for (let i = dayNatureItems.length - 1; i >= 0; i--) {
      const item = dayNatureItems[i]
      const { waveX, waveY } = getAtmosphericWind(item.x, item.y, globalTime)

      item.swayPhase += item.swaySpeed
      item.rotation += item.rotSpeed * currentWindFlow
      item.pitchAngle += item.pitchSpeed * currentWindFlow
      item.rollAngle += item.rollSpeed * currentWindFlow

      // 气动升力：当迎角合适且风起时向上托举，风大时叶片在空中轻盈盘旋爬升
      const aerolift = Math.sin(item.pitchAngle) * Math.cos(item.rollAngle) * 0.85
      item.lift = item.lift * 0.88 + aerolift * 0.12

      // 水平位移：主风流速 + 局部波形微动 (顺畅向右向远方飞掠)
      item.x += (item.vx * currentWindFlow + waveX * 0.35) + Math.cos(item.swayPhase) * 0.6
      // 垂直位移：自然下落 - 气动升力 + 垂直风涡沉浮
      item.y += (item.vy * (1.1 - aerolift * 0.45)) - (item.lift * 1.5) + waveY * 0.5 + Math.sin(item.swayPhase * 0.7) * item.swayAmp

      if (item.alpha < item.maxAlpha) {
        item.alpha = Math.min(item.alpha + 0.015, item.maxAlpha)
      }

      // 自由飞掠出屏幕右侧或下侧边界后，自然循环重生，行云流水毫无滞纳
      if (item.x > w + 60 || item.y > h + 60) {
        dayNatureItems[i] = createDayNatureItem(w, h, false)
      }
    }

    // 更新空间阳光微尘
    for (let i = sunDusts.length - 1; i >= 0; i--) {
      const d = sunDusts[i]
      d.x += d.vx * currentWindFlow
      d.y += d.vy + Math.sin(globalTime * 1.5 + d.seed) * 0.4
      d.pulsePhase += d.pulseSpeed

      if (d.alpha < d.maxAlpha) {
        d.alpha = Math.min(d.alpha + 0.01, d.maxAlpha)
      }

      if (d.x > w + 30) {
        sunDusts[i] = createSunDust(w, h, false)
      }
    }
  }

  // ==========================================
  // 2. 黑夜模式更新：空中飘飞 ➔ 落水触波泛起涟漪 ➔ 水面随波浮游淡出
  // ==========================================
  if (isNight) {
    for (let i = nightNatureItems.length - 1; i >= 0; i--) {
      const item = nightNatureItems[i]

      // 阶段 A: 空中飞舞
      if (item.state === 'airborne') {
        const { waveX, waveY } = getAtmosphericWind(item.x, item.y, globalTime)

        item.swayPhase += item.swaySpeed
        item.rotation += item.rotSpeed * currentWindFlow
        item.pitchAngle += item.pitchSpeed * currentWindFlow
        item.rollAngle += item.rollSpeed * currentWindFlow

        const aerolift = Math.sin(item.pitchAngle) * Math.cos(item.rollAngle) * 0.85
        item.lift = item.lift * 0.88 + aerolift * 0.12

        item.x += (item.vx * currentWindFlow + waveX * 0.3) + Math.cos(item.swayPhase) * 0.5
        item.y += (item.vy * (1.1 - aerolift * 0.45)) - (item.lift * 1.4) + waveY * 0.4 + Math.sin(item.swayPhase * 0.7) * item.swayAmp

        if (item.alpha < item.maxAlpha) {
          item.alpha = Math.min(item.alpha + 0.015, item.maxAlpha)
        }

        // 触水检测：触发水波涟漪！
        if (item.y >= item.waterY) {
          item.state = 'floating'
          item.floatTimer = 0

          // 在入水处泛起同心水波涟漪
          waterRipples.push({
            x: item.x,
            y: item.waterY,
            radius: 2,
            maxRadius: Math.random() * 16 + 26,
            alpha: 0.8,
            growthSpeed: 0.55,
            color: item.kind === 'bamboo' ? 'rgba(45, 212, 191, 0.75)' : 'rgba(165, 243, 252, 0.85)'
          })
        }
      }
      // 阶段 B: 水面浮游 (Floating)
      else if (item.state === 'floating') {
        item.floatTimer++
        item.pitchAngle += (0 - item.pitchAngle) * 0.1
        item.rollAngle += (0 - item.rollAngle) * 0.1
        item.rotSpeed *= 0.9

        item.y = item.waterY + Math.sin(globalTime * 2.5 + item.x * 0.08) * 1.5
        item.x += 0.65 * (0.6 + item.depth * 0.4)

        if (item.floatTimer > 180) {
          item.alpha -= 0.009
          if (item.alpha <= 0 || item.x > w + 60) {
            nightNatureItems[i] = createNightNatureItem(w, h, false)
          }
        }
      }
    }

    // 更新水波微澜涟漪
    for (let i = waterRipples.length - 1; i >= 0; i--) {
      const r = waterRipples[i]
      r.radius += r.growthSpeed
      r.alpha = (1 - (r.radius / r.maxRadius)) * 0.8
      if (r.radius >= r.maxRadius || r.alpha <= 0.01) {
        waterRipples.splice(i, 1)
      }
    }

    // 更新夜幕萤火虫
    for (let i = nightFireflies.length - 1; i >= 0; i--) {
      const f = nightFireflies[i]
      f.floatAngle += 0.02
      f.x += f.vx * currentWindFlow
      f.y += f.vy + Math.sin(f.floatAngle) * 0.5
      f.pulsePhase += f.pulseSpeed

      if (f.alpha < f.maxAlpha) {
        f.alpha = Math.min(f.alpha + 0.01, f.maxAlpha)
      }

      if (f.x > w + 40) {
        nightFireflies[i] = createNightFirefly(w, h, false)
      }
    }
  }
}

// 绘制单枚娇柔花瓣 (白天桃樱)
function drawPetal(ctx: CanvasRenderingContext2D, size: number, isPeach: boolean, isBack: boolean) {
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.bezierCurveTo(size * 0.88, -size * 0.65, size * 0.82, size * 0.45, 0, size)
  ctx.bezierCurveTo(-size * 0.82, size * 0.45, -size * 0.88, -size * 0.65, 0, -size)
  ctx.closePath()

  const grad = ctx.createLinearGradient(0, size, 0, -size)
  if (isPeach) {
    if (isBack) {
      grad.addColorStop(0, '#fff1f2')
      grad.addColorStop(0.5, '#fda4af')
      grad.addColorStop(1, '#f43f5e')
    } else {
      grad.addColorStop(0, '#ffe4e6')
      grad.addColorStop(0.5, '#fb7185')
      grad.addColorStop(1, '#e11d48')
    }
  } else {
    if (isBack) {
      grad.addColorStop(0, '#fdf2f8')
      grad.addColorStop(0.5, '#fbcfe8')
      grad.addColorStop(1, '#ec4899')
    } else {
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.5, '#f472b6')
      grad.addColorStop(1, '#db2777')
    }
  }
  ctx.fillStyle = grad
  ctx.fill()
}

// 绘制单片白天树叶
function drawLeaf(ctx: CanvasRenderingContext2D, size: number, isGold: boolean, isBack: boolean) {
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.quadraticCurveTo(size * 0.78, 0, 0, size)
  ctx.quadraticCurveTo(-size * 0.78, 0, 0, -size)
  ctx.closePath()

  const grad = ctx.createLinearGradient(0, -size, 0, size)
  if (isGold) {
    if (isBack) {
      grad.addColorStop(0, '#fef9c3')
      grad.addColorStop(0.5, '#facc15')
      grad.addColorStop(1, '#b45309')
    } else {
      grad.addColorStop(0, '#fef08a')
      grad.addColorStop(0.5, '#f59e0b')
      grad.addColorStop(1, '#d97706')
    }
  } else {
    if (isBack) {
      grad.addColorStop(0, '#dcfce7')
      grad.addColorStop(0.5, '#86efac')
      grad.addColorStop(1, '#15803d')
    } else {
      grad.addColorStop(0, '#bbf7d0')
      grad.addColorStop(0.5, '#4ade80')
      grad.addColorStop(1, '#16a34a')
    }
  }
  ctx.fillStyle = grad
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, -size * 0.7)
  ctx.lineTo(0, size * 0.7)
  ctx.strokeStyle = isGold ? 'rgba(180, 83, 9, 0.35)' : 'rgba(21, 128, 61, 0.35)'
  ctx.lineWidth = Math.max(0.6, size * 0.08)
  ctx.stroke()
}

// 绘制【月下修竹碧叶】(墨翠冷竹 · 冷月银辉轮廓光)
function drawBambooLeaf(ctx: CanvasRenderingContext2D, size: number, isBack: boolean) {
  const length = size * 2.3
  const width = size * 0.46

  ctx.beginPath()
  ctx.moveTo(0, -length * 0.5)
  ctx.bezierCurveTo(width * 1.3, -length * 0.18, width * 1.05, length * 0.22, 0, length * 0.5)
  ctx.bezierCurveTo(-width * 1.05, length * 0.22, -width * 1.3, -length * 0.18, 0, -length * 0.5)
  ctx.closePath()

  const grad = ctx.createLinearGradient(0, -length * 0.5, 0, length * 0.5)
  if (isBack) {
    grad.addColorStop(0, 'rgba(13, 148, 136, 0.85)')
    grad.addColorStop(0.5, 'rgba(20, 184, 166, 0.75)')
    grad.addColorStop(1, 'rgba(15, 118, 110, 0.9)')
  } else {
    grad.addColorStop(0, 'rgba(6, 78, 59, 0.95)')
    grad.addColorStop(0.4, 'rgba(13, 148, 136, 0.9)')
    grad.addColorStop(1, 'rgba(4, 47, 46, 0.98)')
  }
  ctx.fillStyle = grad
  ctx.fill()

  ctx.strokeStyle = isBack ? 'rgba(153, 246, 228, 0.75)' : 'rgba(204, 251, 241, 0.6)'
  ctx.lineWidth = 0.75
  ctx.shadowColor = 'rgba(45, 212, 191, 0.65)'
  ctx.shadowBlur = 4
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -length * 0.44)
  ctx.lineTo(0, length * 0.44)
  ctx.strokeStyle = 'rgba(204, 251, 241, 0.45)'
  ctx.lineWidth = 0.65
  ctx.shadowBlur = 0
  ctx.stroke()
}

// 绘制【夜昙冷白花瓣】(清冷月华 · 羊脂冷白水滴瓣)
function drawNightPetal(ctx: CanvasRenderingContext2D, size: number, isBack: boolean) {
  ctx.beginPath()
  ctx.moveTo(0, -size * 1.1)
  ctx.bezierCurveTo(size * 0.86, -size * 0.6, size * 0.76, size * 0.5, 0, size * 1.0)
  ctx.bezierCurveTo(-size * 0.76, size * 0.5, -size * 0.86, -size * 0.6, 0, -size * 1.1)
  ctx.closePath()

  const grad = ctx.createLinearGradient(0, size * 1.0, 0, -size * 1.1)
  if (isBack) {
    grad.addColorStop(0, 'rgba(241, 245, 249, 0.88)')
    grad.addColorStop(0.5, 'rgba(186, 230, 253, 0.78)')
    grad.addColorStop(1, 'rgba(192, 132, 252, 0.82)')
  } else {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)')
    grad.addColorStop(0.5, 'rgba(224, 242, 254, 0.88)')
    grad.addColorStop(1, 'rgba(165, 243, 252, 0.92)')
  }
  ctx.fillStyle = grad
  ctx.fill()

  ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)'
  ctx.lineWidth = 0.65
  ctx.shadowColor = 'rgba(165, 243, 252, 0.8)'
  ctx.shadowBlur = 6
  ctx.stroke()
}

function renderWind(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const isNight = isDark.value

  // ==========================================
  // 1. 白天模式：阳光微尘 + 自由乘风飞掠的落花飞叶 (行云流水)
  // ==========================================
  if (!isNight) {
    // A. 阳光微尘浮粒
    for (const d of sunDusts) {
      if (d.alpha <= 0.01) continue
      ctx.save()
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2)

      const pulse = 0.7 + 0.3 * Math.sin(d.pulsePhase)
      ctx.fillStyle = `rgba(253, 224, 71, ${d.alpha * pulse * 0.6})`
      ctx.shadowColor = 'rgba(251, 191, 36, 0.4)'
      ctx.shadowBlur = 4 * d.depth
      ctx.fill()
      ctx.restore()
    }

    // B. 自由飞花落叶：随风穿堂掠向远方
    for (const item of dayNatureItems) {
      if (item.alpha <= 0.01) continue

      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(item.rotation)

      const cosRoll = Math.cos(item.rollAngle)
      const cosPitch = Math.cos(item.pitchAngle)
      const isBack = cosRoll < 0

      const scaleX = (Math.abs(cosRoll) < 0.08 ? 0.08 : cosRoll) * item.depth
      const scaleY = (Math.abs(cosPitch) < 0.15 ? 0.15 : cosPitch) * item.depth
      ctx.scale(scaleX, scaleY)

      ctx.globalAlpha = item.alpha * (0.6 + item.depth * 0.3)

      const renderSize = item.baseSize

      if (item.kind === 'sakura' || item.kind === 'peach') {
        drawPetal(ctx, renderSize, item.kind === 'peach', isBack)
      } else {
        drawLeaf(ctx, renderSize, item.kind === 'leaf-gold', isBack)
      }

      ctx.restore()
    }
  }

  // ==========================================
  // 2. 黑夜模式：月华萤火虫 + 【入水水波微澜涟漪】 + 【月下修竹与夜昙】
  // ==========================================
  if (isNight) {
    // A. 入水水波微澜涟漪 (同心椭圆月光水纹扩散)
    for (const r of waterRipples) {
      if (r.alpha <= 0.01) continue
      ctx.save()

      ctx.beginPath()
      ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.32, 0, 0, Math.PI * 2)
      ctx.strokeStyle = r.color.replace(/[\d\.]+\)$/, `${r.alpha})`)
      ctx.lineWidth = 0.85
      ctx.shadowColor = r.color
      ctx.shadowBlur = 5
      ctx.stroke()

      if (r.radius > 8) {
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, r.radius * 0.52, r.radius * 0.52 * 0.32, 0, 0, Math.PI * 2)
        ctx.strokeStyle = r.color.replace(/[\d\.]+\)$/, `${r.alpha * 0.55})`)
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      ctx.restore()
    }

    // B. 月下修竹碧叶与夜昙冷白花瓣
    for (const item of nightNatureItems) {
      if (item.alpha <= 0.01) continue

      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(item.rotation)

      const cosRoll = Math.cos(item.rollAngle)
      const cosPitch = Math.cos(item.pitchAngle)
      const isBack = cosRoll < 0

      const scaleX = (Math.abs(cosRoll) < 0.08 ? 0.08 : cosRoll) * item.depth
      const scaleY = (Math.abs(cosPitch) < 0.15 ? 0.15 : cosPitch) * item.depth
      ctx.scale(scaleX, scaleY)

      ctx.globalAlpha = item.alpha * (0.65 + item.depth * 0.3)

      if (item.kind === 'bamboo') {
        drawBambooLeaf(ctx, item.baseSize, isBack)
      } else {
        drawNightPetal(ctx, item.baseSize, isBack)
      }

      ctx.restore()
    }

    // C. 萤火虫游弋
    for (const f of nightFireflies) {
      if (f.alpha <= 0.01) continue
      ctx.save()
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2)

      const pulse = 0.6 + 0.4 * Math.sin(f.pulsePhase)
      const renderAlpha = f.alpha * pulse

      if (f.colorTheme === 'cyan') {
        ctx.fillStyle = `rgba(165, 243, 252, ${renderAlpha})`
        ctx.shadowColor = 'rgba(56, 189, 248, 0.85)'
      } else if (f.colorTheme === 'gold') {
        ctx.fillStyle = `rgba(254, 240, 138, ${renderAlpha})`
        ctx.shadowColor = 'rgba(250, 204, 21, 0.85)'
      } else {
        ctx.fillStyle = `rgba(191, 219, 254, ${renderAlpha})`
        ctx.shadowColor = 'rgba(96, 165, 250, 0.85)'
      }

      ctx.shadowBlur = 10 * f.depth
      ctx.fill()
      ctx.restore()
    }
  }
}

onMounted(() => {
  initWindScene()
})
</script>

<style scoped>
.wind-stream-container {
  user-select: none;
}
</style>
