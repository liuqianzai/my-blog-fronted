<template>
  <!-- 风本无形 · 因物成风：白天落花触清泉微澜，夜晚竹叶入寒潭月波；每次刷新风速动态多变 -->
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

// 每次页面刷新时，随机生成本次访问的基础风场流速与气流强度（0.68x 悠然闲适和风 ~ 1.55x 爽朗轻快清风）
const sessionWindIntensity = 0.68 + Math.random() * 0.87

// ==========================================
// 数据模型：无形风场中的自然实体与空间微尘
// ==========================================

// 1. 白天自然飞舞之物（樱花瓣、桃花瓣、春萌柳叶、银杏秋叶）
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
  // 触水状态：airborne(空中飘飞) -> floating(落入澄澈清水泛起微细水纹并随波慢漂)
  state: 'airborne' | 'floating'
  waterY: number
  floatTimer: number
}

// 2. 夜晚月下飞舞之物（月下修竹碧叶 + 夜昙冷白花瓣）
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
  // 触水状态：airborne(空中飘飞) -> floating(落入寒潭静水泛起月华水波并随波微漂)
  state: 'airborne' | 'floating'
  waterY: number
  floatTimer: number
}

// 3. 落水微波涟漪（区分白天澄澈清水纹与夜晚月光冷水纹，极淡不突兀）
interface WaterRipple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  growthSpeed: number
  mode: 'day' | 'night'
  color: string
}

// 4. 落水飞溅微水珠（触水瞬间晶莹跃起）
interface WaterSplash {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  alpha: number
  color: string
}

// 5. 白天阳光微尘浮粒（空气中漂浮的细微金色光尘，体现空气本身的流动感）
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

// 6. 夜幕月光萤火虫（夜间静谧游弋的微光生物）
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
let waterSplashes: WaterSplash[] = []
let sunDusts: SunDust[] = []
let nightFireflies: NightFirefly[] = []

// 水位基准配置：底部水区高度 (根据视口自适应，76px ~ 115px，形成开阔纵深水域)
function getWaterLevel(h: number) {
  const waterHeight = Math.max(76, Math.min(115, Math.floor(h * 0.115)))
  return h - waterHeight
}

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
    gustIntensity = 1.35 + Math.random() * 0.25 * sessionWindIntensity
    triggerWindGust((0.35 + Math.random() * 0.16) * sessionWindIntensity, 1)
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
  waterSplashes = []
  sunDusts = []
  nightFireflies = []

  // 1. 白天自然落叶与花瓣：平视穿堂风，近大远小多层景深
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
  // 清水水面基准线（落水浮游层位于水面内深 20 ~ 36px 处，给水底浅影留出透视景深）
  const waterLevel = getWaterLevel(h)
  const waterY = waterLevel + 22 + (Math.random() * 14 - 7)

  return {
    kind,
    x: randomStart ? Math.random() * w : -40 - Math.random() * 120,
    y: randomStart ? Math.random() * (h * 0.8) : Math.random() * (h * 0.6) - 30,
    vx: (Math.random() * 1.5 + 1.1) * (0.6 + depth * 0.5),
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
    lift: 0,
    state: 'airborne',
    waterY,
    floatTimer: 0
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
  const waterLevel = getWaterLevel(h)
  const waterY = waterLevel + 22 + (Math.random() * 14 - 7)

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
  // 结合单次刷新生成的动态随机风强倍率
  const currentWindFlow = gustIntensity * breathingCycle * sessionWindIntensity

  // ==========================================
  // 1. 白天模式更新：空中飞掠 ➔ 触碰清水泛起清澈细浪 ➔ 水面慢漂融水淡出
  // ==========================================
  if (!isNight) {
    for (let i = dayNatureItems.length - 1; i >= 0; i--) {
      const item = dayNatureItems[i]

      // 阶段 A: 空中飞舞 (Airborne)
      if (item.state === 'airborne') {
        const { waveX, waveY } = getAtmosphericWind(item.x, item.y, globalTime)

        item.swayPhase += item.swaySpeed
        item.rotation += item.rotSpeed * currentWindFlow
        item.pitchAngle += item.pitchSpeed * currentWindFlow
        item.rollAngle += item.rollSpeed * currentWindFlow

        const aerolift = Math.sin(item.pitchAngle) * Math.cos(item.rollAngle) * 0.85
        item.lift = item.lift * 0.88 + aerolift * 0.12

        item.x += (item.vx * currentWindFlow + waveX * 0.35) + Math.cos(item.swayPhase) * 0.6
        item.y += (item.vy * (1.1 - aerolift * 0.45)) - (item.lift * 1.5) + waveY * 0.5 + Math.sin(item.swayPhase * 0.7) * item.swayAmp

        if (item.alpha < item.maxAlpha) {
          item.alpha = Math.min(item.alpha + 0.015, item.maxAlpha)
        }

        // 白天清水接水检测：落至水面线，泛起澄澈春水细纹与晶莹水珠
        if (item.y >= item.waterY) {
          item.state = 'floating'
          item.floatTimer = 0

          // 白天清水细纹 (极淡天水碧细圈，绝不喧宾夺主)
          waterRipples.push({
            x: item.x,
            y: item.waterY,
            radius: 2,
            maxRadius: Math.random() * 12 + 22,
            alpha: 0.6,
            growthSpeed: 0.52 * sessionWindIntensity,
            mode: 'day',
            color: 'rgba(186, 230, 253, 0.5)'
          })

          // 触水溅起晶莹微水珠 (2~3 枚)
          for (let s = 0; s < 3; s++) {
            waterSplashes.push({
              x: item.x + (Math.random() - 0.5) * 5,
              y: item.waterY,
              vx: (Math.random() - 0.5) * 1.3 + 0.25,
              vy: -(Math.random() * 1.5 + 0.7),
              radius: Math.random() * 0.7 + 0.7,
              alpha: 0.75,
              color: 'rgba(254, 249, 195, 0.8)'
            })
          }
        }
      }
      // 阶段 B: 白天清水浮游 (Floating)
      else if (item.state === 'floating') {
        item.floatTimer++
        item.pitchAngle += (0 - item.pitchAngle) * 0.12
        item.rollAngle += (0 - item.rollAngle) * 0.12
        item.rotSpeed *= 0.9

        // 随清水微波轻柔沉浮，顺水流向右缓漂
        item.y = item.waterY + Math.sin(globalTime * 2.2 + item.x * 0.06) * 1.2
        item.x += (0.65 + item.depth * 0.35) * sessionWindIntensity

        // 漂浮数秒后如落花融入清泉般自然淡出
        if (item.floatTimer > 150) {
          item.alpha -= 0.009
          if (item.alpha <= 0 || item.x > w + 60) {
            dayNatureItems[i] = createDayNatureItem(w, h, false)
          }
        }
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
  // 2. 黑夜模式更新：空中飘飞 ➔ 落水触波泛起月夜涟漪 ➔ 水面随波浮游淡出
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

        // 触水检测：触发月光涟漪与冷光水花！
        if (item.y >= item.waterY) {
          item.state = 'floating'
          item.floatTimer = 0

          waterRipples.push({
            x: item.x,
            y: item.waterY,
            radius: 2,
            maxRadius: Math.random() * 16 + 26,
            alpha: 0.85,
            growthSpeed: 0.52 * sessionWindIntensity,
            mode: 'night',
            color: item.kind === 'bamboo' ? 'rgba(45, 212, 191, 0.8)' : 'rgba(165, 243, 252, 0.9)'
          })

          // 触水微溅冷光水珠
          for (let s = 0; s < 3; s++) {
            waterSplashes.push({
              x: item.x + (Math.random() - 0.5) * 5,
              y: item.waterY,
              vx: (Math.random() - 0.5) * 1.3 + 0.25,
              vy: -(Math.random() * 1.5 + 0.7),
              radius: Math.random() * 0.7 + 0.7,
              alpha: 0.8,
              color: 'rgba(165, 243, 252, 0.85)'
            })
          }
        }
      }
      // 阶段 B: 水面浮游 (Floating)
      else if (item.state === 'floating') {
        item.floatTimer++
        item.pitchAngle += (0 - item.pitchAngle) * 0.1
        item.rollAngle += (0 - item.rollAngle) * 0.1
        item.rotSpeed *= 0.9

        item.y = item.waterY + Math.sin(globalTime * 2.5 + item.x * 0.08) * 1.5
        item.x += 0.65 * (0.6 + item.depth * 0.4) * sessionWindIntensity

        if (item.floatTimer > 180) {
          item.alpha -= 0.009
          if (item.alpha <= 0 || item.x > w + 60) {
            nightNatureItems[i] = createNightNatureItem(w, h, false)
          }
        }
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

  // ==========================================
  // 通用更新：落水微澜涟漪更新 (白天/夜间共享)
  // ==========================================
  for (let i = waterRipples.length - 1; i >= 0; i--) {
    const r = waterRipples[i]
    r.radius += r.growthSpeed
    r.alpha = (1 - (r.radius / r.maxRadius)) * (r.mode === 'day' ? 0.6 : 0.85)
    if (r.radius >= r.maxRadius || r.alpha <= 0.01) {
      waterRipples.splice(i, 1)
    }
  }

  // 通用更新：触水晶莹飞溅微水珠 (重力下坠回水面)
  for (let i = waterSplashes.length - 1; i >= 0; i--) {
    const sp = waterSplashes[i]
    sp.x += sp.vx
    sp.y += sp.vy
    sp.vy += 0.12 // 自然重力
    sp.alpha -= 0.038
    if (sp.alpha <= 0 || sp.y > h) {
      waterSplashes.splice(i, 1)
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

// 绘制自然物品形态 (白天落花落叶)
function renderDayItemShape(ctx: CanvasRenderingContext2D, item: DayNatureItem, isBack: boolean) {
  if (item.kind === 'sakura' || item.kind === 'peach') {
    drawPetal(ctx, item.baseSize, item.kind === 'peach', isBack)
  } else {
    drawLeaf(ctx, item.baseSize, item.kind === 'leaf-gold', isBack)
  }
}

// 绘制自然物品形态 (夜晚修竹夜昙)
function renderNightItemShape(ctx: CanvasRenderingContext2D, item: NightNatureItem, isBack: boolean) {
  if (item.kind === 'bamboo') {
    drawBambooLeaf(ctx, item.baseSize, isBack)
  } else {
    drawNightPetal(ctx, item.baseSize, isBack)
  }
}

// 绘制底层水体与通透水色渐变
function drawWaterSurface(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  isNight: boolean,
  waterLevel: number
) {
  const waterHeight = h - waterLevel
  if (waterHeight <= 0) return

  ctx.save()

  // 1. 水体通透渐变（既有水的澄澈存在感，又保持通透不遮挡背景内容）
  const grad = ctx.createLinearGradient(0, waterLevel, 0, h)
  if (!isNight) {
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.0)')
    grad.addColorStop(0.3, 'rgba(186, 230, 253, 0.08)')
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.16)')
  } else {
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.0)')
    grad.addColorStop(0.3, 'rgba(15, 23, 42, 0.15)')
    grad.addColorStop(1, 'rgba(14, 116, 144, 0.20)')
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, waterLevel, w, waterHeight)

  // 2. 水面高光粼粼碎波 (微浪浮光)
  const shimmerCount = 7
  for (let s = 0; s < shimmerCount; s++) {
    const segW = w / shimmerCount
    const startX = s * segW + Math.sin(time * 0.9 + s * 1.7) * 22
    const segLen = segW * (0.35 + 0.3 * Math.sin(time * 1.3 + s * 2.2))
    const lineY = waterLevel + Math.sin(time * 1.7 + s * 1.9) * 1.4

    ctx.beginPath()
    ctx.moveTo(startX, lineY)
    ctx.lineTo(startX + segLen, lineY)
    const lineAlpha = 0.28 + 0.16 * Math.sin(time * 2.4 + s * 1.1)
    ctx.strokeStyle = isNight
      ? `rgba(165, 243, 252, ${lineAlpha * 0.75})`
      : `rgba(255, 255, 255, ${lineAlpha * 0.9})`
    ctx.lineWidth = 0.8
    ctx.stroke()
  }

  ctx.restore()
}

// 绘制【静止太阳倒影】(白天：水中温润日光金晕、太阳虚像与粼粼碎金波光)
function drawSunReflection(
  ctx: CanvasRenderingContext2D,
  w: number,
  time: number,
  waterLevel: number
) {
  const sunX = w * 0.78
  const sunY = waterLevel + 36

  ctx.save()

  // 1. 水下日光金晕漫反射 (更大气开阔的温润水晕)
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 62)
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.38)')
  glow.addColorStop(0.45, 'rgba(251, 191, 36, 0.16)')
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(sunX, sunY, 62, 0, Math.PI * 2)
  ctx.fill()

  // 2. 扁平透视的太阳水中虚影
  ctx.beginPath()
  ctx.ellipse(sunX, sunY, 22, 9, 0, 0, Math.PI * 2)
  const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 22)
  coreGrad.addColorStop(0, 'rgba(255, 255, 245, 0.82)')
  coreGrad.addColorStop(0.55, 'rgba(253, 224, 71, 0.48)')
  coreGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = coreGrad
  ctx.fill()

  // 3. 水中粼粼碎金横向波纹 (随水波微漾)
  const waveOffsets = [-12, -6, 0, 6, 12, 18]
  for (let i = 0; i < waveOffsets.length; i++) {
    const offY = waveOffsets[i]
    const currentY = sunY + offY
    const widthFactor = 1 - Math.abs(offY) / 24
    const waveLen = (32 + 16 * Math.sin(time * 2.5 + i * 1.3)) * widthFactor
    const shiftX = Math.sin(time * 1.9 + i) * 3

    ctx.beginPath()
    ctx.moveTo(sunX - waveLen * 0.5 + shiftX, currentY)
    ctx.lineTo(sunX + waveLen * 0.5 + shiftX, currentY)
    ctx.strokeStyle = `rgba(255, 255, 240, ${0.42 + 0.26 * Math.sin(time * 2.8 + i)})`
    ctx.lineWidth = 1.05 + 0.4 * widthFactor
    ctx.stroke()
  }

  ctx.restore()
}

// 绘制【静止月亮倒影】(夜晚：寒潭冷月清辉、水中月虚影与碎月冷波)
function drawMoonReflection(
  ctx: CanvasRenderingContext2D,
  w: number,
  time: number,
  waterLevel: number
) {
  const moonX = w * 0.78
  const moonY = waterLevel + 36

  ctx.save()

  // 1. 寒潭月影清辉漫反射
  const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 58)
  glow.addColorStop(0, 'rgba(186, 230, 253, 0.4)')
  glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.16)')
  glow.addColorStop(1, 'rgba(14, 116, 144, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(moonX, moonY, 58, 0, Math.PI * 2)
  ctx.fill()

  // 2. 扁平透视的冷月虚影本体 (清冷明净)
  ctx.beginPath()
  ctx.ellipse(moonX, moonY, 20, 8.5, 0, 0, Math.PI * 2)
  const coreGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 20)
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.88)')
  coreGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.55)')
  coreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = coreGrad
  ctx.fill()

  // 3. 水中碎月冷波 (如微风吹碎池中月)
  const waveOffsets = [-11, -5.5, 0, 5.5, 11, 16]
  for (let i = 0; i < waveOffsets.length; i++) {
    const offY = waveOffsets[i]
    const currentY = moonY + offY
    const widthFactor = 1 - Math.abs(offY) / 22
    const waveLen = (28 + 14 * Math.sin(time * 2.2 + i * 1.4)) * widthFactor
    const shiftX = Math.sin(time * 1.7 + i) * 2.8

    ctx.beginPath()
    ctx.moveTo(moonX - waveLen * 0.5 + shiftX, currentY)
    ctx.lineTo(moonX + waveLen * 0.5 + shiftX, currentY)
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.48 + 0.28 * Math.sin(time * 2.5 + i)})`
    ctx.lineWidth = 1.0 + 0.35 * widthFactor
    ctx.shadowColor = 'rgba(165, 243, 252, 0.7)'
    ctx.shadowBlur = 4
    ctx.stroke()
  }

  ctx.restore()
}

// 绘制【落叶/飞花在空中飞行与浮水时投在水面上的影子与倒影】
function renderItemShadowAndReflection(
  ctx: CanvasRenderingContext2D,
  item: DayNatureItem | NightNatureItem,
  isNight: boolean,
  time: number
) {
  if (item.alpha <= 0.01) return

  const cosRoll = Math.cos(item.rollAngle)
  const cosPitch = Math.cos(item.pitchAngle)
  const isBack = cosRoll < 0
  const scaleX = (Math.abs(cosRoll) < 0.08 ? 0.08 : cosRoll) * item.depth
  const scaleY = (Math.abs(cosPitch) < 0.15 ? 0.15 : cosPitch) * item.depth

  // 1. 空中高度相对于水面的归一化进度 (0: 顶层高空飞舞, 1: 接触落水面)
  const heightProgress = Math.max(0, Math.min(1, item.y / item.waterY))

  // 水面投射 X 坐标：跟随空中落叶水平位置，伴随自然水波微晃
  const waterSurfaceX = item.x + Math.sin(time * 2.2 + item.x * 0.04) * 2.0

  // 水面投射 Y 坐标：无论叶片在空中多高，水面上都实时显示其对应的投影与倒影
  const isFloating = item.state === 'floating'
  const waterSurfaceY = isFloating
    ? item.y
    : item.waterY + (1 - heightProgress) * 10

  // ==========================================
  // A. 水底/水面柔和暗影 (Shadow)：空中飞舞遮光投下的光影
  // ==========================================
  ctx.save()
  const shadowOffsetX = isNight ? 3 : 4
  const shadowOffsetY = isFloating ? 11 : (11 + (1 - heightProgress) * 5)
  ctx.translate(waterSurfaceX + shadowOffsetX, waterSurfaceY + shadowOffsetY)
  ctx.rotate(item.rotation)

  // 高空时影子漫反射虚化扩散（略大且柔淡），低空接近水面时聚焦清晰
  const shadowSpread = isFloating ? 1.0 : (1.35 - heightProgress * 0.35)
  ctx.scale(item.depth * 0.95 * shadowSpread, item.depth * 0.38 * shadowSpread)

  const shadowBaseAlpha = isNight ? 0.35 : 0.22
  // 高空时有温和漫反射淡影(0.35x)，越近越深邃
  const shadowAlpha = item.alpha * shadowBaseAlpha * (0.4 + 0.6 * heightProgress)

  ctx.beginPath()
  ctx.ellipse(0, 0, item.baseSize * 1.15, item.baseSize * 0.65, 0, 0, Math.PI * 2)
  ctx.fillStyle = isNight ? `rgba(3, 7, 18, ${shadowAlpha})` : `rgba(15, 23, 42, ${shadowAlpha})`
  ctx.fill()
  ctx.restore()

  // ==========================================
  // B. 水面镜像倒影 (Reflection)：空中叶片投射在水面上的镜像
  // ==========================================
  // 水面微波波动
  const waveDistort = Math.sin(time * 2.8 + item.x * 0.08) * 1.5
  const refY = waterSurfaceY + 2.5 + waveDistort

  // 空中飞舞时倒影清透可见；落水后与水面完全交融
  const refAlpha = isFloating
    ? item.alpha * 0.36
    : item.alpha * (0.18 + 0.24 * heightProgress)

  if (refAlpha > 0.01) {
    ctx.save()
    ctx.translate(waterSurfaceX, refY)
    ctx.rotate(-item.rotation) // 镜像旋转
    ctx.scale(scaleX, -scaleY * 0.44) // 垂直翻转并由于水面透视扁平化
    ctx.globalAlpha = refAlpha * (0.6 + item.depth * 0.3)

    if ('kind' in item && (item.kind === 'bamboo' || item.kind === 'night-petal')) {
      renderNightItemShape(ctx, item as NightNatureItem, isBack)
    } else {
      renderDayItemShape(ctx, item as DayNatureItem, isBack)
    }

    ctx.restore()
  }
}

function renderWind(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const isNight = isDark.value
  const waterLevel = getWaterLevel(h)

  // 1. 水体通透渐变与水面高光微波
  drawWaterSurface(ctx, w, h, globalTime, isNight, waterLevel)

  // 2. 静止天体倒影（白天太阳，黑夜明月）
  if (!isNight) {
    drawSunReflection(ctx, w, globalTime, waterLevel)
  } else {
    drawMoonReflection(ctx, w, globalTime, waterLevel)
  }

  // 3. 落叶/飞花的水底浅影与水面倒影 (在水面浮叶前渲染)
  if (!isNight) {
    for (const item of dayNatureItems) {
      renderItemShadowAndReflection(ctx, item, false, globalTime)
    }
  } else {
    for (const item of nightNatureItems) {
      renderItemShadowAndReflection(ctx, item, true, globalTime)
    }
  }

  // 4. 空中飘飞与水面浮游的自然实体
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

    // B. 白天落花落叶实体渲染
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
      renderDayItemShape(ctx, item, isBack)
      ctx.restore()
    }
  } else {
    // A. 月下修竹与夜昙实体渲染
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
      renderNightItemShape(ctx, item, isBack)
      ctx.restore()
    }

    // B. 萤火虫游弋
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

  // 5. 水面波澜涟漪 (落水微波)
  for (const r of waterRipples) {
    if (r.alpha <= 0.01) continue
    ctx.save()

    ctx.beginPath()
    ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.32, 0, 0, Math.PI * 2)

    if (r.mode === 'day') {
      ctx.strokeStyle = `rgba(186, 230, 253, ${r.alpha * 0.5})`
      ctx.lineWidth = 0.65
      ctx.stroke()

      if (r.radius > 6) {
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, r.radius * 0.5, r.radius * 0.5 * 0.32, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(254, 240, 138, ${r.alpha * 0.28})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    } else {
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
    }

    ctx.restore()
  }

  // 6. 触水微溅晶莹水珠
  for (const sp of waterSplashes) {
    if (sp.alpha <= 0.01) continue
    ctx.save()
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2)
    ctx.fillStyle = sp.color.replace(/[\d\.]+\)$/, `${sp.alpha})`)
    ctx.fill()
    ctx.restore()
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
