<template>
  <!-- 风本无形 · 因物成风：白天落花触清泉微澜，夜晚竹叶入寒潭月波；每次刷新风速动态多变 -->
  <div class="wind-stream-container fixed inset-0 pointer-events-none z-[1] overflow-hidden">
    <canvas ref="canvasRef" class="w-full h-full block"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { isDark } from '../utils/theme'
import { getCoinPosition, setCoinSubmergedState, triggerWindGust } from '../utils/wind'

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
  depthRatio: number  // 在整片水域纵深中的分布比例 (0: 远岸水面, 1: 近岸水底)
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
  depthRatio: number
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

// 7. 池塘底上升晶莹小气泡（随滚动进入水下/塘底时活跃升腾）
interface PondBubble {
  x: number
  y: number
  vy: number
  radius: number
  alpha: number
  wobblePhase: number
  wobbleSpeed: number
}

// 8. 池塘底温润鹅卵石特征
interface PondPebble {
  xRatio: number
  yOffset: number
  radiusX: number
  radiusY: number
  rotation: number
  shade: number
}

// 9. 潜入水下时自在游弋的灵动游鱼 (锦鲤 / 幽潭青鱼)
interface PondFish {
  x: number
  y: number
  vx: number
  targetVy: number
  vy: number
  size: number
  depthRatio: number     // 水下纵深
  swimPhase: number      // 尾鳍摆动相位
  swimSpeed: number      // 摆动速率
  direction: 1 | -1      // 1: 向右游, -1: 向左游
  colorType: 'orange' | 'gold' | 'cyan' | 'azure'
  tailFinAngle: number
}

// 10. 铜钱落水实体 (水面接近时直着垂直下坠，落入水底后优雅平缓摊平安睡于池底)
interface FallingCoin {
  x: number
  y: number
  vy: number
  state: 'falling' | 'flattening' | 'resting'
  targetBedY: number
  splashed: boolean
  alpha: number
  flattenProgress: number // 摊平进度 (0: 直立垂直视角 scaleY=1, 1: 摊平透视视角 scaleY=0.38)
}

let dayNatureItems: DayNatureItem[] = []
let nightNatureItems: NightNatureItem[] = []
let waterRipples: WaterRipple[] = []
let waterSplashes: WaterSplash[] = []
let sunDusts: SunDust[] = []
let nightFireflies: NightFirefly[] = []
let pondBubbles: PondBubble[] = []
let pondPebbles: PondPebble[] = []
let pondFishes: PondFish[] = []
let fallingCoin: FallingCoin | null = null

// 页面滚动条下拉进入水面与池塘底的平滑动态进度 (0.0: 页面顶部, 1.0: 滑到底部)
// 潜入水下阶段：当水位上升超过阈值 (currentScrollProgress > 0.28) 时，曲线变为水面，进入潜水视角 (落叶隐匿，气泡与游鱼涌现)
// 池塘底阶段：当滑到底部 (currentScrollProgress > 0.72) 时，池塘底泥沙、焦散光网、卵石与沉叶完全浮现
let targetScrollProgress = 0
let currentScrollProgress = 0

// 水位基准配置：随着滚动条下滑，水在屏幕中的比例逐渐上升 (30% -> 88%)
function getWaterHeight(h: number) {
  const baseRatio = 0.30
  const maxRatio = 0.88
  const ratio = baseRatio + (maxRatio - baseRatio) * currentScrollProgress
  return Math.max(180, Math.floor(h * ratio))
}

function getWaterBaseLevel(h: number) {
  return h - getWaterHeight(h)
}

// 自然有机水岸曲线（随 X 坐标自然起伏平缓优美的曲线水湾边界）
function getWaterShoreY(x: number, w: number, h: number, time: number = 0) {
  const baseLevel = getWaterBaseLevel(h)
  const normX = x / Math.max(1, w)
  // 优雅连绵的自然曲线水岸：带有水湾起伏与微波呼吸
  const wave1 = Math.sin(normX * Math.PI * 2.2 - 0.4) * 22
  const wave2 = Math.cos(normX * Math.PI * 4.0 + 0.6) * 9
  const breathing = Math.sin(time * 0.8 + normX * 3.5) * 3.2
  return baseLevel + wave1 + wave2 + breathing
}

// 获取在“整片水域”中指定纵深比例的实际落水浮游高度
function getItemWaterY(x: number, depthRatio: number, w: number, h: number, time: number = 0) {
  const shoreY = getWaterShoreY(x, w, h, time)
  const availableDepth = h - shoreY - 24
  return shoreY + 16 + depthRatio * Math.max(25, availableDepth)
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

function initPondBedPebbles() {
  pondPebbles = []
  const count = 18
  for (let i = 0; i < count; i++) {
    pondPebbles.push({
      xRatio: (i + 0.3 + Math.random() * 0.4) / count,
      yOffset: Math.random() * 26 + 10,
      radiusX: Math.random() * 7.5 + 7.5,
      radiusY: Math.random() * 4 + 3.5,
      rotation: (Math.random() - 0.5) * 0.8,
      shade: Math.random() * 0.4 + 0.6
    })
  }
}

function createPondBubble(w: number, h: number, randomY = false): PondBubble {
  return {
    x: Math.random() * w,
    y: randomY ? h - Math.random() * (getWaterHeight(h) * 0.65) : h + Math.random() * 8,
    vy: -(Math.random() * 0.7 + 0.45),
    radius: Math.random() * 1.6 + 1.2,
    alpha: Math.random() * 0.35 + 0.45,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.035 + 0.018
  }
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

  // 监听页面滚动条进度：滚动下滑时水面平滑升高进入水底
  const handleScroll = () => {
    const doc = document.documentElement
    const maxScroll = doc.scrollHeight - doc.clientHeight
    targetScrollProgress = maxScroll > 0 ? Math.min(1, Math.max(0, doc.scrollTop / maxScroll)) : 0
  }
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })

  initPondBedPebbles()

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
    window.removeEventListener('scroll', handleScroll)
    if (animId !== null) {
      cancelAnimationFrame(animId)
      animId = null
    }
  })
}

function createPondFish(w: number, h: number, randomStart = false): PondFish {
  const isNight = isDark.value
  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1
  const depthRatio = Math.random() * 0.7 + 0.15 // 水下纵深分布
  const colors: ('orange' | 'gold' | 'cyan' | 'azure')[] = isNight
    ? ['cyan', 'azure', 'cyan']
    : ['orange', 'gold', 'orange']
  const colorType = colors[Math.floor(Math.random() * colors.length)]
  const startX = randomStart
    ? Math.random() * w
    : (direction === 1 ? -60 - Math.random() * 80 : w + 60 + Math.random() * 80)

  const shoreY = getWaterShoreY(startX, w, h, 0)
  const availableDepth = Math.max(30, h - shoreY - 40)
  const initialY = shoreY + 25 + depthRatio * availableDepth

  return {
    x: startX,
    y: initialY,
    vx: (Math.random() * 0.5 + 0.65) * direction,
    targetVy: 0,
    vy: 0,
    size: Math.random() * 8 + 16, // 鱼体适度放大（16px ~ 24px），灵动优雅且清晰可见
    depthRatio,
    swimPhase: Math.random() * Math.PI * 2,
    swimSpeed: Math.random() * 0.045 + 0.03,
    direction,
    colorType,
    tailFinAngle: 0
  }
}

function spawnInitialElements(w: number, h: number) {
  dayNatureItems = []
  nightNatureItems = []
  waterRipples = []
  waterSplashes = []
  sunDusts = []
  nightFireflies = []
  pondBubbles = []
  pondFishes = []

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

  // 5. 初始池塘底小气泡 (潜水与水底时活跃)
  for (let i = 0; i < 16; i++) {
    pondBubbles.push(createPondBubble(w, h, true))
  }

  // 6. 水下游弋灵动锦鲤 / 冷玉青鱼 (4~6 条轻盈小鱼)
  const fishCount = Math.max(4, Math.floor(w / 320))
  for (let i = 0; i < fishCount; i++) {
    pondFishes.push(createPondFish(w, h, true))
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
  const initX = randomStart ? Math.random() * w : -40 - Math.random() * 120
  const depthRatio = Math.random()
  const waterY = getItemWaterY(initX, depthRatio, w, h, 0)

  return {
    kind,
    x: initX,
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
    depthRatio,
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
  const initX = randomStart ? Math.random() * w : -40 - Math.random() * 120
  const depthRatio = Math.random()
  const waterY = getItemWaterY(initX, depthRatio, w, h, 0)

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
    depthRatio,
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

  // 页面滚动平滑阻尼插值 (Lerp)：实现滚动下滑进入水面与池底的丝滑过渡
  currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08
  if (Math.abs(targetScrollProgress - currentScrollProgress) < 0.001) {
    currentScrollProgress = targetScrollProgress
  }

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

        // 随滚动条动态水位联动：浮叶自然随水面上浮或下潜
        const curWaterY = getItemWaterY(item.x, item.depthRatio, w, h, globalTime)
        item.waterY += (curWaterY - item.waterY) * 0.15

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

        // 随滚动条动态水位联动：浮叶自然随水面上浮或下潜
        const curWaterY = getItemWaterY(item.x, item.depthRatio, w, h, globalTime)
        item.waterY += (curWaterY - item.waterY) * 0.15

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
  // 通用更新：池底升腾晶莹气泡 (随着滚动进入水下/池塘底逐渐活跃升起)
  // ==========================================
  for (let i = pondBubbles.length - 1; i >= 0; i--) {
    const b = pondBubbles[i]
    b.wobblePhase += b.wobbleSpeed
    b.x += Math.sin(b.wobblePhase) * 0.65
    b.y += b.vy

    const shoreY = getWaterShoreY(b.x, w, h, globalTime)
    // 气泡升至水面或屏幕上方时在水面破裂，并在池底重新生成
    if (b.y <= shoreY) {
      if (Math.random() < 0.35) {
        // 微型破裂小水花/涟漪
        waterSplashes.push({
          x: b.x,
          y: shoreY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * 0.8 + 0.3),
          radius: 0.8,
          alpha: 0.5,
          color: isNight ? 'rgba(165, 243, 252, 0.6)' : 'rgba(254, 249, 195, 0.6)'
        })
      }
      pondBubbles[i] = createPondBubble(w, h, false)
    }
  }

  // ==========================================
  // 通用更新：潜入水下灵动游鱼游弋 (随水流与摆尾徐徐前进)
  // ==========================================
  for (let i = pondFishes.length - 1; i >= 0; i--) {
    const fish = pondFishes[i]
    fish.swimPhase += fish.swimSpeed
    fish.tailFinAngle = Math.sin(fish.swimPhase) * 0.45

    fish.x += fish.vx + Math.sin(fish.swimPhase * 0.8) * 0.35

    const shoreY = getWaterShoreY(fish.x, w, h, globalTime)
    const availableDepth = Math.max(30, h - shoreY - 40)
    const targetY = shoreY + 22 + fish.depthRatio * availableDepth + Math.sin(globalTime * 1.8 + fish.swimPhase) * 4

    fish.y += (targetY - fish.y) * 0.08

    // 游出屏幕边缘后在另一侧折返或重新生成
    if (fish.direction === 1 && fish.x > w + 80) {
      pondFishes[i] = createPondFish(w, h, false)
    } else if (fish.direction === -1 && fish.x < -80) {
      pondFishes[i] = createPondFish(w, h, false)
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

  // ==========================================
  // 通用更新：水面接近铜钱时，铜钱脱落落入水中与沉底物理模拟
  // ==========================================
  const coinPos = getCoinPosition()
  if (coinPos.active) {
    const shoreYAtCoin = getWaterShoreY(coinPos.x, w, h, globalTime)
    // 铜钱底端与水面波浪上边缘的相对垂直距离 (正数表示水面还在下方，0 或负数表示水面已漫过铜钱)
    const distanceToWater = shoreYAtCoin - coinPos.y

    // 触发落水阈值：当水面距离铜钱不足 60px 时（即水位迅速接近铜钱）
    const SUBMERGE_TRIGGER_DISTANCE = 60

    if (distanceToWater <= SUBMERGE_TRIGGER_DISTANCE) {
      // 触发落入水中：通知顶部导航栏挂件淡出隐藏
      setCoinSubmergedState(true)

      // 如果尚未生成落水铜钱实体，则立即生成一枚从铜钱位置直着下坠的实体
      if (!fallingCoin) {
        fallingCoin = {
          x: coinPos.x,
          y: coinPos.y,
          vy: 2.2, // 垂直平稳直坠
          state: 'falling',
          targetBedY: h - (20 + Math.random() * 8),
          splashed: false,
          alpha: 1.0,
          flattenProgress: 0
        }
      }
    } else if (distanceToWater > SUBMERGE_TRIGGER_DISTANCE + 45) {
      // 当用户滚回顶部，水面远离铜钱时，重置状态，铜钱挂件重新挂回导航栏
      setCoinSubmergedState(false)
      if (fallingCoin) {
        fallingCoin = null
      }
    }
  }

  // 更新落入水中的铜钱运动 (直着垂直下坠，落入水底后慢慢平缓摊平)
  if (fallingCoin) {
    const c = fallingCoin
    const shoreY = getWaterShoreY(c.x, w, h, globalTime)

    if (c.state === 'falling') {
      // 直着垂直下坠 (严格保持垂直，不发生翻转偏角)
      c.y += c.vy

      // 触碰水面瞬间：溅起金色灵运水花与激荡涟漪圈
      if (c.y >= shoreY && !c.splashed) {
        c.splashed = true
        c.vy = 1.35 // 没入水中受到水的阻力，保持平稳下沉速度

        // 激起一圈大涟漪
        waterRipples.push({
          x: c.x,
          y: shoreY,
          radius: 3,
          maxRadius: 36,
          alpha: 0.9,
          growthSpeed: 0.65,
          mode: isNight ? 'night' : 'day',
          color: isNight ? 'rgba(254, 240, 138, 0.95)' : 'rgba(245, 158, 11, 0.9)'
        })

        // 触水溅起 4 枚金色晶莹水珠
        for (let k = 0; k < 4; k++) {
          waterSplashes.push({
            x: c.x + (Math.random() - 0.5) * 8,
            y: shoreY,
            vx: (Math.random() - 0.5) * 1.6,
            vy: -(Math.random() * 1.8 + 0.8),
            radius: 1.2,
            alpha: 0.85,
            color: 'rgba(254, 240, 138, 0.9)'
          })
        }

        // 铜钱入水产生 2 颗小气泡
        pondBubbles.push({
          x: c.x - 3,
          y: shoreY + 6,
          vy: -(Math.random() * 0.6 + 0.4),
          radius: 1.8,
          alpha: 0.8,
          wobblePhase: Math.random() * Math.PI,
          wobbleSpeed: 0.04
        })
      }

      // 触碰池塘底部：进入【慢慢摊平】阶段
      if (c.y >= c.targetBedY) {
        c.y = c.targetBedY
        c.state = 'flattening'
        c.vy = 0
      }
    } else if (c.state === 'flattening') {
      // 触底后平滑展开摊平：flattenProgress 0 -> 1 (约 0.6 秒平缓倾伏)
      c.flattenProgress += (1 - c.flattenProgress) * 0.075
      if (c.flattenProgress >= 0.99) {
        c.flattenProgress = 1
        c.state = 'resting'
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

// 绘制广阔水体与全域潋滟波光（呈现“一片浩渺水域/水池”的开阔景深）
function drawWaterSurface(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  isNight: boolean
) {
  const baseLevel = getWaterBaseLevel(h)
  const waterHeight = getWaterHeight(h)
  if (waterHeight <= 0) return

  ctx.save()

  // 1. 绘制带有自然水湾缓弧的整体水域多边形 (告别死板直线，呈现自然湖面)
  ctx.beginPath()
  const step = 24
  ctx.moveTo(0, getWaterShoreY(0, w, h, time))
  for (let x = step; x <= w + step; x += step) {
    ctx.lineTo(Math.min(w, x), getWaterShoreY(Math.min(w, x), w, h, time))
  }
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()

  // 水体大面积柔和通透渐变：随滚动深入水底，深水区色泽自然深邃沉淀
  const p = currentScrollProgress
  const grad = ctx.createLinearGradient(0, baseLevel, 0, h)
  if (!isNight) {
    grad.addColorStop(0, `rgba(186, 230, 253, ${0.22 + 0.08 * p})`)
    grad.addColorStop(0.25, `rgba(125, 211, 252, ${0.32 + 0.10 * p})`)
    grad.addColorStop(0.65, `rgba(56, 189, 248, ${0.42 + 0.14 * p})`)
    grad.addColorStop(1, `rgba(14, 165, 233, ${0.50 + 0.16 * p})`)
  } else {
    grad.addColorStop(0, `rgba(15, 23, 42, ${0.05 + 0.08 * p})`)
    grad.addColorStop(0.25, `rgba(15, 23, 42, ${0.18 + 0.10 * p})`)
    grad.addColorStop(0.65, `rgba(14, 116, 144, ${0.24 + 0.12 * p})`)
    grad.addColorStop(1, `rgba(8, 47, 73, ${0.32 + 0.16 * p})`)
  }
  ctx.fillStyle = grad
  ctx.fill()

  // 2. 曲线边界（当未浸入水下时表现为湖水岸线；当深入水下时，曲线即为仰望的水面起伏界面）
  // underwaterFactor: 0(岸上开阔湖面视角) -> 1(已完全没入水中，水线为头顶水面)
  const underwaterFactor = Math.max(0, Math.min(1, (currentScrollProgress - 0.28) / 0.22))

  // A. 曲线边界水色光波 (水下时更具天光折射的微透光感)
  ctx.beginPath()
  ctx.moveTo(0, getWaterShoreY(0, w, h, time))
  for (let x = step; x <= w + step; x += step) {
    ctx.lineTo(Math.min(w, x), getWaterShoreY(Math.min(w, x), w, h, time))
  }
  const shoreAlpha = isNight
    ? (0.65 - 0.25 * underwaterFactor)
    : (0.75 - 0.25 * underwaterFactor)
  ctx.strokeStyle = isNight ? `rgba(56, 189, 248, ${shoreAlpha})` : `rgba(14, 165, 233, ${shoreAlpha})`
  ctx.lineWidth = 2.0 - 0.5 * underwaterFactor
  ctx.stroke()

  // B. 曲线边界内层晶莹白光高光水线 (浸入水下时为水面天光微光，波浪更加柔和)
  ctx.beginPath()
  ctx.moveTo(0, getWaterShoreY(0, w, h, time))
  for (let x = step; x <= w + step; x += step) {
    ctx.lineTo(Math.min(w, x), getWaterShoreY(Math.min(w, x), w, h, time))
  }
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 - 0.3 * underwaterFactor})`
  ctx.lineWidth = 1.0
  ctx.stroke()

  // C. 水岸伴生小微浪 (岸边为叠浪，进入水下后逐渐转化为水面折射波动)
  if (underwaterFactor < 0.85) {
    const subWaveAlpha = 1 - underwaterFactor / 0.85
    ctx.beginPath()
    ctx.moveTo(0, getWaterShoreY(0, w, h, time) + 7)
    for (let x = step; x <= w + step; x += step) {
      const shoreY = getWaterShoreY(Math.min(w, x), w, h, time)
      const waveSub = Math.sin(x * 0.015 + time * 1.6) * 2.2
      ctx.lineTo(Math.min(w, x), shoreY + 7 + waveSub)
    }
    ctx.strokeStyle = isNight
      ? `rgba(165, 243, 252, ${0.45 * subWaveAlpha})`
      : `rgba(255, 255, 255, ${0.68 * subWaveAlpha})`
    ctx.lineWidth = 0.85
    ctx.stroke()
  }

  // 3. 全域多层透视粼粼碎波（5 层纵深分布：远水细密、近水宽阔，铺满整片水域）
  const waveLayers = 5
  for (let layer = 0; layer < waveLayers; layer++) {
    const layerProgress = (layer + 0.5) / waveLayers
    const layerY = baseLevel + 22 + layerProgress * (waterHeight - 40)
    const waveCount = 5 + layer * 2
    const segW = w / waveCount

    for (let s = 0; s < waveCount; s++) {
      const startX = s * segW + Math.sin(time * 0.8 + s * 1.5 + layer) * 22
      const segLen = segW * (0.32 + 0.35 * Math.sin(time * 1.2 + s * 2.1 + layer))
      const currentY = layerY + Math.sin(time * 1.5 + s * 1.7 + layer) * 1.8

      ctx.beginPath()
      ctx.moveTo(startX, currentY)
      ctx.lineTo(startX + segLen, currentY)

      const alphaPulse = 0.22 + 0.18 * Math.sin(time * 2.0 + s * 1.1 + layer)
      ctx.strokeStyle = isNight
        ? `rgba(165, 243, 252, ${alphaPulse * (0.45 + layerProgress * 0.4)})`
        : `rgba(255, 255, 255, ${alphaPulse * (0.55 + layerProgress * 0.4)})`
      ctx.lineWidth = 0.65 + layerProgress * 0.55
      ctx.stroke()
    }
  }

  ctx.restore()
}

// 绘制【静止太阳倒影与碎金光道】(白天：水中温润日光金晕、太阳虚像与铺展碎金)
function drawSunReflection(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // 倒影向右移至右侧开阔水域 (约 89% 宽度处)，避开侧边栏博主头像与卡片区域
  const sunX = Math.min(w - 60, Math.max(w * 0.88, (w + 1120) / 2 - 20))
  const shoreY = getWaterShoreY(sunX, w, h, time)
  const sunY = shoreY + 48

  ctx.save()

  // 1. 水下日光金晕漫反射 (更大范围漫反射)
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 78)
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.42)')
  glow.addColorStop(0.5, 'rgba(251, 191, 36, 0.16)')
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(sunX, sunY, 78, 0, Math.PI * 2)
  ctx.fill()

  // 2. 扁平透视的太阳水中虚影
  ctx.beginPath()
  ctx.ellipse(sunX, sunY, 26, 11, 0, 0, Math.PI * 2)
  const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 26)
  coreGrad.addColorStop(0, 'rgba(255, 255, 245, 0.85)')
  coreGrad.addColorStop(0.55, 'rgba(253, 224, 71, 0.5)')
  coreGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = coreGrad
  ctx.fill()

  // 3. 水面碎金光道 (从太阳倒影向近岸铺展的一整条粼粼碎金波光)
  const waveRows = 10
  for (let i = 0; i < waveRows; i++) {
    const offY = (i - 3) * 8.5
    const currentY = sunY + offY
    if (currentY > h - 4) continue
    const widthFactor = 0.65 + (i / waveRows) * 0.85
    const waveLen = (36 + 18 * Math.sin(time * 2.4 + i * 1.3)) * widthFactor
    const shiftX = Math.sin(time * 1.8 + i) * 3.5

    ctx.beginPath()
    ctx.moveTo(sunX - waveLen * 0.5 + shiftX, currentY)
    ctx.lineTo(sunX + waveLen * 0.5 + shiftX, currentY)
    ctx.strokeStyle = `rgba(255, 255, 240, ${0.44 + 0.28 * Math.sin(time * 2.6 + i)})`
    ctx.lineWidth = 1.1 + 0.4 * widthFactor
    ctx.stroke()
  }

  ctx.restore()
}

// 绘制【静止月亮倒影与碎月光道】(夜晚：寒潭冷月清辉、水中月虚影与铺展碎月冷波)
function drawMoonReflection(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // 倒影向右移至右侧开阔水域 (约 89% 宽度处)，避开侧边栏博主头像与卡片区域
  const moonX = Math.min(w - 60, Math.max(w * 0.88, (w + 1120) / 2 - 20))
  const shoreY = getWaterShoreY(moonX, w, h, time)
  const moonY = shoreY + 48

  ctx.save()

  // 1. 寒潭月影清辉漫反射
  const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 75)
  glow.addColorStop(0, 'rgba(186, 230, 253, 0.42)')
  glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.16)')
  glow.addColorStop(1, 'rgba(14, 116, 144, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(moonX, moonY, 75, 0, Math.PI * 2)
  ctx.fill()

  // 2. 扁平透视的冷月虚影本体 (清冷明净)
  ctx.beginPath()
  ctx.ellipse(moonX, moonY, 24, 10, 0, 0, Math.PI * 2)
  const coreGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 24)
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  coreGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.58)')
  coreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = coreGrad
  ctx.fill()

  // 3. 水面碎月光道 (从月亮倒影向近岸铺展的粼粼碎玉冷波)
  const waveRows = 10
  for (let i = 0; i < waveRows; i++) {
    const offY = (i - 3) * 8.5
    const currentY = moonY + offY
    if (currentY > h - 4) continue
    const widthFactor = 0.65 + (i / waveRows) * 0.85
    const waveLen = (32 + 16 * Math.sin(time * 2.2 + i * 1.4)) * widthFactor
    const shiftX = Math.sin(time * 1.7 + i) * 3.2

    ctx.beginPath()
    ctx.moveTo(moonX - waveLen * 0.5 + shiftX, currentY)
    ctx.lineTo(moonX + waveLen * 0.5 + shiftX, currentY)
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.48 + 0.28 * Math.sin(time * 2.5 + i)})`
    ctx.lineWidth = 1.05 + 0.35 * widthFactor
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
  // 用户要求：白天的叶子落入水中后不应该再有影子，保持水面澄澈透明
  // ==========================================
  const shouldDrawShadow = isNight ? true : !isFloating
  if (shouldDrawShadow) {
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
  }

  // ==========================================
  // B. 水面镜像倒影 (Reflection)：空中与水面落叶投射在水面上的真实镜像
  // 用户要求：倒影应该和叶子的大小和翻转状态严格一致 (1:1 镜面反射)
  // ==========================================
  // 水面微波波动 (浮水时紧随叶片，空中时轻柔微漾)
  const waveDistort = Math.sin(time * 2.5 + item.x * 0.08) * (isFloating ? 0.6 : 1.2)
  const refY = isFloating ? (item.y + 1.2 + waveDistort) : (waterSurfaceY + waveDistort)

  // 倒影透明度：清澈明亮，水光相印
  const refAlpha = isFloating
    ? item.alpha * 0.42
    : item.alpha * (0.22 + 0.26 * heightProgress)

  if (refAlpha > 0.01) {
    ctx.save()
    ctx.translate(waterSurfaceX, refY)
    // 采用严格的平面镜像变换：关于水面水平轴垂直翻转 scale(1, -1)
    // 继而保留原物完全相同的旋转角 item.rotation 与 3D 侧翻俯仰 (scaleX, scaleY)
    // 使得倒影的大小、叶尖指向、正面反面翻转状态与实物叶片 100% 严密一致！
    ctx.scale(1, -1)
    ctx.rotate(item.rotation)
    ctx.scale(scaleX, scaleY)
    ctx.globalAlpha = refAlpha * (0.6 + item.depth * 0.3)

    if ('kind' in item && (item.kind === 'bamboo' || item.kind === 'night-petal')) {
      renderNightItemShape(ctx, item as NightNatureItem, isBack)
    } else {
      renderDayItemShape(ctx, item as DayNatureItem, isBack)
    }

    ctx.restore()
  }
}

// 绘制【池塘底（Pond Bed）幽静景致】(当用户滚动至页面底部时显现)
function drawPondBed(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  isNight: boolean,
  pondProgress: number
) {
  if (pondProgress <= 0.01) return

  ctx.save()

  // 1. 塘底温润沉积层渐变 (屏幕底部约 65px)
  const bedHeight = 65
  const bedGrad = ctx.createLinearGradient(0, h - bedHeight, 0, h)
  if (!isNight) {
    bedGrad.addColorStop(0, 'rgba(14, 165, 233, 0)')
    bedGrad.addColorStop(0.35, `rgba(56, 189, 248, ${0.12 * pondProgress})`)
    bedGrad.addColorStop(0.75, `rgba(180, 160, 140, ${0.16 * pondProgress})`)
    bedGrad.addColorStop(1, `rgba(140, 120, 100, ${0.28 * pondProgress})`)
  } else {
    bedGrad.addColorStop(0, 'rgba(8, 47, 73, 0)')
    bedGrad.addColorStop(0.35, `rgba(14, 116, 144, ${0.12 * pondProgress})`)
    bedGrad.addColorStop(0.75, `rgba(15, 23, 42, ${0.22 * pondProgress})`)
    bedGrad.addColorStop(1, `rgba(3, 7, 18, ${0.35 * pondProgress})`)
  }
  ctx.fillStyle = bedGrad
  ctx.fillRect(0, h - bedHeight, w, bedHeight)

  // 2. 水下阳光/月光焦散光网 (Caustics Grid)
  const causticsCount = 7
  const segW = w / causticsCount
  for (let c = 0; c < causticsCount; c++) {
    const cx = c * segW + segW * 0.5 + Math.sin(time * 0.9 + c * 1.8) * 16
    const cy = h - 22 + Math.cos(time * 1.1 + c * 2.1) * 6
    const rx = segW * (0.42 + 0.15 * Math.sin(time * 1.4 + c))
    const ry = 8 + 3 * Math.cos(time * 1.6 + c * 1.5)

    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, (Math.PI / 180) * (Math.sin(time + c) * 15), 0, Math.PI * 2)

    const cAlpha = (0.07 + 0.05 * Math.sin(time * 2.0 + c * 1.2)) * pondProgress
    ctx.strokeStyle = isNight
      ? `rgba(165, 243, 252, ${cAlpha * 1.2})`
      : `rgba(254, 249, 195, ${cAlpha * 1.4})`
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  // 3. 散落池底的温润鹅卵石 (Pebbles)
  for (const pebble of pondPebbles) {
    const px = pebble.xRatio * w
    const py = h - pebble.yOffset

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(pebble.rotation)

    // A. 卵石在泥沙上的微弱阴影
    ctx.beginPath()
    ctx.ellipse(1.5, 3, pebble.radiusX * 1.05, pebble.radiusY * 0.8, 0, 0, Math.PI * 2)
    ctx.fillStyle = isNight
      ? `rgba(3, 7, 18, ${0.28 * pondProgress})`
      : `rgba(71, 85, 105, ${0.18 * pondProgress})`
    ctx.fill()

    // B. 鹅卵石本体 (自然卵石色，带水下滤镜)
    ctx.beginPath()
    ctx.ellipse(0, 0, pebble.radiusX, pebble.radiusY, 0, 0, Math.PI * 2)
    const pGrad = ctx.createLinearGradient(-pebble.radiusX, -pebble.radiusY, pebble.radiusX, pebble.radiusY)
    if (!isNight) {
      const baseL = Math.floor(180 + pebble.shade * 40)
      pGrad.addColorStop(0, `rgba(${baseL + 15}, ${baseL + 10}, ${baseL - 5}, ${0.55 * pondProgress})`)
      pGrad.addColorStop(1, `rgba(${baseL - 25}, ${baseL - 30}, ${baseL - 40}, ${0.65 * pondProgress})`)
    } else {
      const baseL = Math.floor(60 + pebble.shade * 35)
      pGrad.addColorStop(0, `rgba(${baseL + 10}, ${baseL + 25}, ${baseL + 35}, ${0.55 * pondProgress})`)
      pGrad.addColorStop(1, `rgba(${baseL - 20}, ${baseL - 10}, ${baseL}, ${0.68 * pondProgress})`)
    }
    ctx.fillStyle = pGrad
    ctx.fill()

    // C. 鹅卵石顶端水光高光点
    ctx.beginPath()
    ctx.ellipse(-pebble.radiusX * 0.25, -pebble.radiusY * 0.35, pebble.radiusX * 0.45, pebble.radiusY * 0.35, 0, 0, Math.PI * 2)
    ctx.fillStyle = isNight
      ? `rgba(224, 242, 254, ${0.25 * pondProgress})`
      : `rgba(255, 255, 255, ${0.35 * pondProgress})`
    ctx.fill()

    ctx.restore()
  }

  // 4. 池底沉睡的古雅残叶 (2~3 片沉静在池底泥沙上的落叶)
  const sleepingLeaves = [
    { xRatio: 0.18, yOff: 18, rot: 0.35, size: 7.5, type: 'leaf' },
    { xRatio: 0.52, yOff: 14, rot: -0.45, size: 6.8, type: 'petal' },
    { xRatio: 0.84, yOff: 22, rot: 0.82, size: 8.0, type: 'leaf' }
  ]
  for (const sl of sleepingLeaves) {
    const lx = sl.xRatio * w
    const ly = h - sl.yOff
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(sl.rot)
    ctx.scale(1.0, 0.45) // 贴底透视扁平化
    ctx.globalAlpha = 0.28 * pondProgress

    if (!isNight) {
      if (sl.type === 'leaf') {
        drawLeaf(ctx, sl.size, true, true)
      } else {
        drawPetal(ctx, sl.size, false, true)
      }
    } else {
      if (sl.type === 'leaf') {
        drawBambooLeaf(ctx, sl.size, true)
      } else {
        drawNightPetal(ctx, sl.size, true)
      }
    }
    ctx.restore()
  }

  ctx.restore()
}

// 绘制【池底升腾的晶莹小气泡】
function drawPondBubbles(
  ctx: CanvasRenderingContext2D,
  h: number,
  isNight: boolean,
  alphaFactor: number = 1.0
) {
  if (alphaFactor <= 0.01) return
  for (const b of pondBubbles) {
    if (b.y > h || b.alpha <= 0.01) continue
    ctx.save()
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)

    // 晶莹微光气泡泡圈
    ctx.strokeStyle = isNight
      ? `rgba(186, 230, 253, ${b.alpha * 0.75 * alphaFactor})`
      : `rgba(255, 255, 255, ${b.alpha * 0.85 * alphaFactor})`
    ctx.lineWidth = 0.75
    ctx.stroke()

    // 气泡中心微弱高光
    ctx.beginPath()
    ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = isNight
      ? `rgba(255, 255, 255, ${b.alpha * 0.6 * alphaFactor})`
      : `rgba(254, 240, 138, ${b.alpha * 0.65 * alphaFactor})`
    ctx.fill()

    ctx.restore()
  }
}

// 绘制【潜入水下自在游弋的灵动鱼儿】(流线形轻灵鱼身、飘逸鱼鳍与轻摆尾翼)
function drawPondFish(
  ctx: CanvasRenderingContext2D,
  fish: PondFish,
  isNight: boolean,
  waterAlpha: number
) {
  if (waterAlpha <= 0.01) return
  ctx.save()
  ctx.translate(fish.x, fish.y)
  ctx.scale(fish.direction, 1)

  const s = fish.size
  const tailWave = fish.tailFinAngle

  // A. 水下浅影 (投射在水体与更深处的轻柔虚影)
  ctx.save()
  ctx.translate(2, 6)
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.9, s * 0.32, 0, 0, Math.PI * 2)
  ctx.fillStyle = isNight
    ? `rgba(3, 7, 18, ${0.16 * waterAlpha})`
    : `rgba(15, 23, 42, ${0.12 * waterAlpha})`
  ctx.fill()
  ctx.restore()

  // B. 摇摆轻灵鱼尾 (根据 swimPhase 左右轻柔摆动)
  ctx.save()
  ctx.translate(-s * 0.75, 0)
  ctx.rotate(tailWave)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(-s * 0.5, -s * 0.5, -s * 0.95, -s * 0.6)
  ctx.quadraticCurveTo(-s * 0.65, 0, -s * 0.95, s * 0.6)
  ctx.quadraticCurveTo(-s * 0.5, s * 0.5, 0, 0)
  ctx.closePath()

  let tailColor = 'rgba(251, 146, 60, 0.55)'
  if (isNight) {
    tailColor = fish.colorType === 'cyan'
      ? `rgba(165, 243, 252, ${0.48 * waterAlpha})`
      : `rgba(125, 211, 252, ${0.45 * waterAlpha})`
  } else {
    tailColor = fish.colorType === 'orange'
      ? `rgba(251, 146, 60, ${0.52 * waterAlpha})`
      : `rgba(250, 204, 21, ${0.50 * waterAlpha})`
  }
  ctx.fillStyle = tailColor
  ctx.fill()
  ctx.restore()

  // C. 灵动流线鱼身
  ctx.beginPath()
  ctx.moveTo(s * 0.95, 0) // 鱼嘴
  ctx.bezierCurveTo(s * 0.45, -s * 0.45, -s * 0.45, -s * 0.4, -s * 0.75, 0) // 上脊背
  ctx.bezierCurveTo(-s * 0.45, s * 0.4, s * 0.45, s * 0.45, s * 0.95, 0)   // 腹底
  ctx.closePath()

  const fishGrad = ctx.createLinearGradient(s, 0, -s, 0)
  if (isNight) {
    if (fish.colorType === 'cyan') {
      fishGrad.addColorStop(0, `rgba(224, 242, 254, ${0.85 * waterAlpha})`)
      fishGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.72 * waterAlpha})`)
      fishGrad.addColorStop(1, `rgba(14, 116, 144, ${0.58 * waterAlpha})`)
    } else {
      fishGrad.addColorStop(0, `rgba(240, 249, 255, ${0.85 * waterAlpha})`)
      fishGrad.addColorStop(0.5, `rgba(125, 211, 252, ${0.70 * waterAlpha})`)
      fishGrad.addColorStop(1, `rgba(3, 105, 161, ${0.55 * waterAlpha})`)
    }
  } else {
    if (fish.colorType === 'orange') {
      fishGrad.addColorStop(0, `rgba(255, 237, 213, ${0.88 * waterAlpha})`)
      fishGrad.addColorStop(0.45, `rgba(249, 115, 22, ${0.78 * waterAlpha})`)
      fishGrad.addColorStop(1, `rgba(234, 88, 12, ${0.62 * waterAlpha})`)
    } else {
      fishGrad.addColorStop(0, `rgba(254, 249, 195, ${0.88 * waterAlpha})`)
      fishGrad.addColorStop(0.45, `rgba(250, 204, 21, ${0.76 * waterAlpha})`)
      fishGrad.addColorStop(1, `rgba(217, 119, 6, ${0.60 * waterAlpha})`)
    }
  }
  ctx.fillStyle = fishGrad
  ctx.fill()

  // D. 脊背微弱高光水线 (凸显晶莹通透)
  ctx.beginPath()
  ctx.moveTo(s * 0.75, -s * 0.08)
  ctx.quadraticCurveTo(0, -s * 0.32, -s * 0.5, -s * 0.08)
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * waterAlpha})`
  ctx.lineWidth = 0.8
  ctx.stroke()

  // E. 飘逸胸鳍 (轻微划水)
  ctx.save()
  ctx.translate(s * 0.2, s * 0.1)
  ctx.rotate(0.35 + Math.sin(fish.swimPhase * 1.2) * 0.18)
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.35, s * 0.14, 0, 0, Math.PI * 2)
  ctx.fillStyle = isNight
    ? `rgba(186, 230, 253, ${0.45 * waterAlpha})`
    : `rgba(254, 215, 170, ${0.55 * waterAlpha})`
  ctx.fill()
  ctx.restore()

  // F. 极小灵动鱼眼
  ctx.beginPath()
  ctx.arc(s * 0.72, -s * 0.12, s * 0.075, 0, Math.PI * 2)
  ctx.fillStyle = isNight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)'
  ctx.fill()

  ctx.restore()
}

// 绘制【落入水中的精致金石铜钱挂件】(1:1 复刻原本挂件模型：红绳挂环、编织绳、微雕乾坤通宝、金珠与红流苏；下坠时直立无翻转，触底后慢慢摊平)
function drawFallingCoin(ctx: CanvasRenderingContext2D, coin: FallingCoin, isNight: boolean) {
  if (coin.alpha <= 0.01) return
  ctx.save()
  ctx.translate(coin.x, coin.y)

  // 慢慢摊平透视变换：下坠时直立(1.0)，触底后平缓倾伏摊平至贴底透视(0.38)
  const flattenScaleY = 1.0 - 0.62 * coin.flattenProgress
  ctx.scale(1.0, flattenScaleY)

  const coinR = 12 // 铜钱主体半径 (与导航栏 24px 大小严密对应)

  // 1. 水下软影 (随着摊平慢慢在泥沙上铺开)
  ctx.save()
  ctx.translate(1.5, 4 * (1 - coin.flattenProgress * 0.5))
  ctx.beginPath()
  ctx.ellipse(0, 0, coinR * 1.08, coinR * (0.95 * flattenScaleY), 0, 0, Math.PI * 2)
  ctx.fillStyle = isNight ? 'rgba(3, 7, 18, 0.42)' : 'rgba(15, 23, 42, 0.26)'
  ctx.fill()
  ctx.restore()

  // 2. 上部编织红绳与挂环 (未完全摊平时清晰可见)
  if (coin.flattenProgress < 0.95) {
    const ropeAlpha = 1 - coin.flattenProgress * 0.7
    ctx.save()
    ctx.globalAlpha = ropeAlpha

    // A. 挂环系扣
    ctx.beginPath()
    ctx.arc(0, -coinR - 10, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#dc2626'
    ctx.fill()
    ctx.strokeStyle = '#f87171'
    ctx.lineWidth = 0.6
    ctx.stroke()

    // B. 短红绳编织线
    ctx.beginPath()
    ctx.rect(-1, -coinR - 8, 2, 8)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    ctx.restore()
  }

  // 3. 核心精致铜钱外圆 (外圈双层金辉，与 FortuneTelling.vue 渐变严格统一)
  ctx.beginPath()
  ctx.arc(0, 0, coinR, 0, Math.PI * 2)
  const outerGrad = ctx.createLinearGradient(-coinR, -coinR, coinR, coinR)
  outerGrad.addColorStop(0, '#f59e0b')
  outerGrad.addColorStop(0.5, '#fbbf24')
  outerGrad.addColorStop(1, '#d97706')
  ctx.fillStyle = outerGrad
  ctx.fill()

  // 4. 铜钱内盘深色青铜/玄金底盘
  ctx.beginPath()
  ctx.arc(0, 0, coinR - 1.2, 0, Math.PI * 2)
  const innerGrad = ctx.createLinearGradient(-coinR, -coinR, coinR, coinR)
  if (isNight) {
    innerGrad.addColorStop(0, '#78350f')
    innerGrad.addColorStop(0.5, '#451a03')
    innerGrad.addColorStop(1, '#1e1b4b')
  } else {
    innerGrad.addColorStop(0, '#92400e')
    innerGrad.addColorStop(0.5, '#78350f')
    innerGrad.addColorStop(1, '#451a03')
  }
  ctx.fillStyle = innerGrad
  ctx.fill()

  // 5. 铜钱微小内方孔 (镂空内方孔，内透深邃水色)
  const sq = 3.2
  ctx.beginPath()
  ctx.rect(-sq, -sq, sq * 2, sq * 2)
  ctx.fillStyle = isNight ? '#0a0a0f' : '#020617'
  ctx.fill()
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)'
  ctx.lineWidth = 0.7
  ctx.stroke()

  // 方孔中心灵动微光
  ctx.beginPath()
  ctx.arc(0, 0, 1.0, 0, Math.PI * 2)
  ctx.fillStyle = '#fde047'
  ctx.fill()

  // 6. 四角微雕铭文字样：乾、坤、通、宝
  ctx.save()
  ctx.fillStyle = '#fef08a'
  ctx.font = 'bold 5px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('乾', 0, -coinR * 0.58)
  ctx.fillText('坤', 0, coinR * 0.58)
  ctx.fillText('通', -coinR * 0.58, 0)
  ctx.fillText('宝', coinR * 0.58, 0)
  ctx.restore()

  // 7. 下垂小流苏束与小金珠 (摊平时优雅伏贴在池底)
  if (coin.flattenProgress < 0.95) {
    const tasselAlpha = 1 - coin.flattenProgress * 0.75
    ctx.save()
    ctx.globalAlpha = tasselAlpha
    // A. 小金珠
    ctx.beginPath()
    ctx.arc(0, coinR + 3.5, 1.8, 0, Math.PI * 2)
    ctx.fillStyle = '#facc15'
    ctx.fill()

    // B. 红流苏
    ctx.beginPath()
    ctx.rect(-0.8, coinR + 5.5, 1.6, 6)
    ctx.fillStyle = '#dc2626'
    ctx.fill()
    ctx.restore()
  }

  ctx.restore()
}

function renderWind(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  const isNight = isDark.value

  // 阶段 1: 潜入水下进度 (滚动超过 25% 开始进入水面以下，48% 时完全没入水中：此时头顶为水面，身处水中，落叶无法存在，只有气泡与游鱼)
  const underwaterProgress = Math.max(0, Math.min(1, (currentScrollProgress - 0.25) / 0.23))
  const surfaceEntityAlpha = 1 - underwaterProgress // 水面与空中的落叶/微尘/倒影透明度系数 (深入水下后完全隐退)

  // 阶段 2: 池塘底显现进度 (继续向下滚动超过 68% 时逐渐到达塘底，滑到底部 100% 呈现池塘底鹅卵石、泥沙与焦散光斑)
  const pondBedProgress = Math.max(0, Math.min(1, (currentScrollProgress - 0.68) / 0.32))

  // 1. 广阔水体通透渐变与全域粼粼微波（一片水域的壮阔与灵动）
  drawWaterSurface(ctx, w, h, globalTime, isNight)

  // 2. 池塘底静物与焦散网 (当真正到达池塘底时展现)
  if (pondBedProgress > 0) {
    drawPondBed(ctx, w, h, globalTime, isNight, pondBedProgress)
  }

  // 3. 静止天体倒影与碎金/碎月水面光道 (在未深入水底时呈现)
  if (surfaceEntityAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = surfaceEntityAlpha
    if (!isNight) {
      drawSunReflection(ctx, w, h, globalTime)
    } else {
      drawMoonReflection(ctx, w, h, globalTime)
    }
    ctx.restore()
  }

  // 4. 落叶/飞花的水底浅影与水面倒影 (仅在水面上视角出现；一旦潜入水中则消失)
  if (surfaceEntityAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = surfaceEntityAlpha
    if (!isNight) {
      for (const item of dayNatureItems) {
        renderItemShadowAndReflection(ctx, item, false, globalTime)
      }
    } else {
      for (const item of nightNatureItems) {
        renderItemShadowAndReflection(ctx, item, true, globalTime)
      }
    }
    ctx.restore()
  }

  // 5. 空中飘飞与水面浮游的自然实体 (空中与水面落叶，潜入水中后完全隐退)
  if (surfaceEntityAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = surfaceEntityAlpha
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
    ctx.restore()
  }

  // 6. 水面波澜涟漪 (落水微波，仅水面视角)
  if (surfaceEntityAlpha > 0.01) {
    ctx.save()
    ctx.globalAlpha = surfaceEntityAlpha
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

    // 触水微溅晶莹水珠
    for (const sp of waterSplashes) {
      if (sp.alpha <= 0.01) continue
      ctx.save()
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2)
      ctx.fillStyle = sp.color.replace(/[\d\.]+\)$/, `${sp.alpha})`)
      ctx.fill()
      ctx.restore()
    }
    ctx.restore()
  }

  // 7. 潜入水下灵动游弋的游鱼 (当滚动进入水中视角时游鱼自在穿梭)
  if (underwaterProgress > 0.05) {
    for (const fish of pondFishes) {
      drawPondFish(ctx, fish, isNight, underwaterProgress)
    }
  }

  // 8. 水中与池底升腾的晶莹小气泡 (随滚动进入水中逐渐活跃升起)
  if (underwaterProgress > 0.05 || pondBedProgress > 0.05) {
    const bubbleAlphaFactor = Math.max(underwaterProgress, pondBedProgress)
    drawPondBubbles(ctx, h, isNight, bubbleAlphaFactor)
  }

  // 9. 落入水中的铜钱实体 (在水中缓缓飘落或安睡在池底)
  if (fallingCoin) {
    drawFallingCoin(ctx, fallingCoin, isNight)
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
