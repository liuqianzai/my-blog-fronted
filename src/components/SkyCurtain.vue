<template>
  <div
    v-if="visible"
    class="curtain-portal-root fixed inset-0 z-[9999] overflow-hidden select-none font-sans"
    :class="{ 'pointer-events-none': (isDark && (stage === 'splitting' || stage === 'ended')) }"
  >
    <!-- ========================================== -->
    <!-- 分支一：黑夜模式（电影级运镜流星 + 破空裂隙转场） -->
    <!-- ========================================== -->
    <template v-if="isDark">
      <!-- 上/左裂片：沿流星轨迹切分开的半幕 -->
      <div
        class="curtain-shard shard-top absolute inset-0"
        :style="shardTopStyle"
      >
        <div class="sky-canvas-container absolute inset-0 bg-night">
          <canvas ref="canvasTopRef" class="w-full h-full block"></canvas>
        </div>
        <!-- 裂口处的高亮光边 -->
        <div
          v-if="stage === 'splitting' || stage === 'tracking'"
          class="absolute inset-0 pointer-events-none rift-glow-border-top"
        ></div>
      </div>

      <!-- 下/右裂片：沿流星轨迹切分开的另一半幕 -->
      <div
        class="curtain-shard shard-bottom absolute inset-0"
        :style="shardBottomStyle"
      >
        <div class="sky-canvas-container absolute inset-0 bg-night">
          <canvas ref="canvasBottomRef" class="w-full h-full block"></canvas>
        </div>
        <!-- 裂口处的高亮光边 -->
        <div
          v-if="stage === 'splitting' || stage === 'tracking'"
          class="absolute inset-0 pointer-events-none rift-glow-border-bottom"
        ></div>
      </div>

      <!-- 黑夜电影镜头 HUD 提示层 -->
      <div
        class="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8 transition-opacity duration-700"
        :style="{ opacity: hudOpacity }"
      >
        <!-- 顶部操作条 -->
        <div class="w-full flex items-center justify-between text-xs tracking-wider font-mono text-white/70">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span class="uppercase">DEEP SPACE OBSERVATORY</span>
          </div>
          <div class="flex items-center space-x-3 pointer-events-auto">
            <button
              type="button"
              @click.stop="toggleAutoPlaySetting"
              class="px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-200 border bg-black/40 text-white/70 border-white/20 hover:text-white"
            >
              {{ disableAutoPlay ? '已禁止自启' : '不再自动播放' }}
            </button>
            <button
              type="button"
              @click.stop="skipToHome"
              class="px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 bg-white/20 hover:bg-white/40 text-white border border-white/30"
            >
              跳过 ➔
            </button>
          </div>
        </div>

        <!-- 中心焦点与标题 -->
        <div class="text-center space-y-4 max-w-lg mx-auto">
          <div
            class="transition-all duration-1000 transform"
            :class="stage === 'tracking' ? 'scale-110' : 'scale-100'"
          >
            <p class="text-xs uppercase tracking-[0.3em] text-blue-300 font-mono mb-2">
              {{ stageText }}
            </p>
            <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
              {{ siteTitle }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-300/80 mt-2 font-light max-w-sm mx-auto">
              夜幕低垂 · 流星划破寂静，带你进入思维的宇宙
            </p>
          </div>
        </div>

        <!-- 底部手动触发引导 -->
        <div class="text-center font-mono text-[11px] text-white/50 tracking-widest pb-4 pointer-events-auto">
          <button
            type="button"
            @click.stop="triggerManualRift"
            class="cursor-pointer hover:text-white transition-colors underline underline-offset-4 decoration-white/30"
          >
            点击触发破空裂隙或静候片刻
          </button>
        </div>
      </div>
    </template>

    <!-- ========================================== -->
    <!-- 分支二：白天模式（经典朝阳升起 + 优雅向上拉帘） -->
    <!-- ========================================== -->
    <template v-else>
      <Transition name="day-curtain">
        <div
          v-if="dayVisible"
          class="absolute inset-0 bg-day overflow-hidden"
          :class="{ 'day-dragging': isDragging }"
          @mousedown="startDayDrag"
          @touchstart="startDayDragTouch"
          :style="{ transform: `translateY(-${dragProgress * 100}%)`, opacity: 1 - dragProgress * 0.4 }"
        >
          <!-- 阳光与漂浮粒子 Canvas -->
          <canvas ref="canvasDayRef" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

          <!-- 朝阳升起视觉与晨雾光芒 -->
          <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute -top-10 -left-10 md:top-10 md:left-20">
              <div class="relative w-32 h-32 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-[0_0_80px_rgba(251,191,36,0.6)] sun-pulse"></div>
              <div class="absolute -inset-10 rounded-full bg-amber-200/20 blur-2xl animate-pulse"></div>
            </div>
            <div class="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-sky-100/90 via-sky-50/40 to-transparent"></div>
          </div>

          <!-- 白天标题与仪式感居中文案 -->
          <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div class="max-w-xl mx-auto space-y-4 transform transition-all duration-700 ease-out" :style="{ transform: `scale(${1 - dragProgress * 0.15})` }">
              <div class="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl mx-auto bg-white/40 text-amber-500">
                <span class="text-2xl md:text-3xl select-none">🌅</span>
              </div>
              <h1 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-800 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">
                {{ siteTitle }}
              </h1>
              <p class="text-sm sm:text-base md:text-lg max-w-md mx-auto line-clamp-2 text-slate-600">
                晨光破晓，微风初动。记录思想的萌芽，迎接崭新的一天。
              </p>
              <!-- 倒计时进度条 -->
              <div class="w-48 sm:w-64 h-1 mx-auto rounded-full overflow-hidden bg-white/40 backdrop-blur-sm mt-6">
                <div
                  class="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-[width] ease-linear duration-75"
                  :style="{ width: `${autoPlayProgress}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- 白天顶部操作条 -->
          <div class="absolute top-4 right-4 md:top-6 md:right-8 z-30 flex items-center space-x-2 md:space-x-3 pointer-events-auto">
            <button
              type="button"
              @click.stop="toggleAutoPlaySetting"
              class="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-200 border"
              :class="disableAutoPlay ? 'bg-slate-800 text-white border-slate-700' : 'bg-white/60 text-slate-700 border-black/10 hover:bg-white/80'"
            >
              {{ disableAutoPlay ? '已禁止自启' : '不再自动播放' }}
            </button>
            <button
              type="button"
              @click.stop="openDayCurtain"
              class="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md transition-all duration-200 shadow-md border bg-white/80 hover:bg-white text-slate-800 border-white/60 hover:scale-105 active:scale-95"
            >
              开启旅程 ➔
            </button>
          </div>

          <!-- 白天底部向上滑动引导条 -->
          <div
            class="absolute bottom-4 sm:bottom-6 inset-x-0 flex flex-col items-center justify-center z-20 pointer-events-auto cursor-grab active:cursor-grabbing group"
            @click.stop="openDayCurtain"
          >
            <div class="flex flex-col items-center text-xs space-y-1 transition-transform group-hover:-translate-y-1 text-slate-600">
              <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
              </svg>
              <span class="tracking-widest font-medium">向上拉动或点击拉开幕布</span>
            </div>
            <div class="mt-2 w-20 h-1.5 rounded-full backdrop-blur-md transition-all duration-300 group-hover:w-28 group-hover:h-2 bg-slate-700/30 group-hover:bg-slate-800/60"></div>
          </div>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isDark } from '../utils/theme'
import { getConfigValue } from '../utils/config'

const STORAGE_KEY_DISABLE = 'blog_curtain_disabled'

const visible = ref(false)
const disableAutoPlay = ref(false)

// 站点通用配置
const siteTitle = computed(() => getConfigValue('site_title', "Liu Yang's Blog"))

// ==========================================
// 1. 黑夜模式逻辑（运镜拉近 + 破空裂隙）
// ==========================================
type Stage = 'idle' | 'tracking' | 'splitting' | 'ended'
const stage = ref<Stage>('idle')
const splitProgress = ref(0)
const canvasTopRef = ref<HTMLCanvasElement | null>(null)
const canvasBottomRef = ref<HTMLCanvasElement | null>(null)
let nightAnimFrame: number | null = null
let nightTimer: any = null

const stageText = computed(() => {
  if (stage.value === 'idle') return 'STEP 01: CELESTIAL SCANNING'
  if (stage.value === 'tracking') return 'STEP 02: TARGET LOCKED · CAMERA ZOOM'
  if (stage.value === 'splitting') return 'STEP 03: RIFT OPENING'
  return 'COMPLETED'
})

const hudOpacity = computed(() => {
  if (stage.value === 'splitting') return Math.max(0, 1 - splitProgress.value * 2.5)
  if (stage.value === 'ended') return 0
  return 1
})

const RIFT_START = { x: 0.95, y: 0.05 }
const RIFT_END = { x: 0.05, y: 0.95 }

const shardTopStyle = computed(() => {
  const clip = 'polygon(0% 0%, 100% 0%, 95% 5%, 5% 95%, 0% 95%)'
  if (stage.value !== 'splitting') {
    return { clipPath: clip }
  }
  const move = splitProgress.value * 120
  const rotate = splitProgress.value * 5
  return {
    clipPath: clip,
    transform: `translate3d(-${move}%, -${move * 0.7}%, 0) rotate(-${rotate}deg)`,
    opacity: 1 - splitProgress.value * 0.3
  }
})

const shardBottomStyle = computed(() => {
  const clip = 'polygon(100% 0%, 100% 100%, 0% 100%, 5% 95%, 95% 5%)'
  if (stage.value !== 'splitting') {
    return { clipPath: clip }
  }
  const move = splitProgress.value * 120
  const rotate = splitProgress.value * 5
  return {
    clipPath: clip,
    transform: `translate3d(${move}%, ${move * 0.7}%, 0) rotate(${rotate}deg)`,
    opacity: 1 - splitProgress.value * 0.3
  }
})

interface Camera {
  x: number
  y: number
  zoom: number
  targetX: number
  targetY: number
  targetZoom: number
}

const camera: Camera = {
  x: 0,
  y: 0,
  zoom: 1,
  targetX: 0,
  targetY: 0,
  targetZoom: 1
}

interface Star {
  x: number
  y: number
  radius: number
  alpha: number
  twinkle: number
}

interface Meteor {
  x: number
  y: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  progress: number
  speed: number
  isHero: boolean
  trail: { x: number; y: number; alpha: number }[]
  color: string
}

let stars: Star[] = []
let meteors: Meteor[] = []
let heroMeteor: Meteor | null = null

function initNightScene() {
  const cTop = canvasTopRef.value
  const cBottom = canvasBottomRef.value
  if (!cTop || !cBottom) return

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    cTop.width = w
    cTop.height = h
    cBottom.width = w
    cBottom.height = h
    buildNightStars(w, h)
  }

  resize()
  window.addEventListener('resize', resize)

  camera.x = window.innerWidth / 2
  camera.y = window.innerHeight / 2
  camera.zoom = 1
  camera.targetX = camera.x
  camera.targetY = camera.y
  camera.targetZoom = 1

  stage.value = 'idle'
  nightTimer = setTimeout(() => {
    spawnHeroMeteor()
    stage.value = 'tracking'
  }, 1400)

  const loop = () => {
    if (stage.value === 'ended') return
    updateNightScene()
    renderNightCanvas()
    nightAnimFrame = requestAnimationFrame(loop)
  }
  loop()
}

function buildNightStars(w: number, h: number) {
  stars = []
  const count = Math.floor((w * h) / 3200)
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (Math.random() - 0.5) * w * 2.5,
      y: (Math.random() - 0.5) * h * 2.5,
      radius: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 0.03 + 0.01
    })
  }
}

function spawnHeroMeteor() {
  const w = window.innerWidth
  const h = window.innerHeight

  const sx = w * RIFT_START.x
  const sy = h * RIFT_START.y
  const tx = w * RIFT_END.x
  const ty = h * RIFT_END.y

  heroMeteor = {
    x: sx,
    y: sy,
    startX: sx,
    startY: sy,
    targetX: tx,
    targetY: ty,
    progress: 0,
    speed: 0.0075,
    isHero: true,
    trail: [],
    color: '#38BDF8'
  }
}

function updateNightScene() {
  const w = window.innerWidth
  const h = window.innerHeight

  for (const s of stars) {
    s.alpha += s.twinkle
    if (s.alpha > 0.95 || s.alpha < 0.2) {
      s.twinkle = -s.twinkle
    }
  }

  if (Math.random() < 0.02 && meteors.length < 3 && stage.value === 'idle') {
    meteors.push({
      x: Math.random() * w,
      y: Math.random() * (h * 0.4),
      startX: 0,
      startY: 0,
      targetX: 0,
      targetY: 0,
      progress: 0,
      speed: 12 + Math.random() * 8,
      isHero: false,
      trail: [],
      color: '#93C5FD'
    })
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.x -= m.speed
    m.y += m.speed * 0.8
    if (m.y > h || m.x < 0) {
      meteors.splice(i, 1)
    }
  }

  if (heroMeteor) {
    heroMeteor.progress += heroMeteor.speed
    const p = Math.min(heroMeteor.progress, 1)

    heroMeteor.x = heroMeteor.startX + (heroMeteor.targetX - heroMeteor.startX) * p
    heroMeteor.y = heroMeteor.startY + (heroMeteor.targetY - heroMeteor.startY) * p

    heroMeteor.trail.unshift({ x: heroMeteor.x, y: heroMeteor.y, alpha: 1 })
    if (heroMeteor.trail.length > 35) {
      heroMeteor.trail.pop()
    }
    for (const t of heroMeteor.trail) {
      t.alpha *= 0.93
    }

    camera.targetX = heroMeteor.x
    camera.targetY = heroMeteor.y
    camera.targetZoom = 1.85

    camera.x += (camera.targetX - camera.x) * 0.08
    camera.y += (camera.targetY - camera.y) * 0.08
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.05

    if (p >= 0.85 && stage.value === 'tracking') {
      stage.value = 'splitting'
    }
  }

  if (stage.value === 'splitting') {
    splitProgress.value += 0.028
    if (splitProgress.value >= 1) {
      finishNightTransition()
    }
  }
}

function finishNightTransition() {
  stage.value = 'ended'
  visible.value = false
  if (nightAnimFrame) {
    cancelAnimationFrame(nightAnimFrame)
    nightAnimFrame = null
  }
}

function triggerManualRift() {
  if (stage.value === 'splitting' || stage.value === 'ended') return
  stage.value = 'splitting'
}

function renderNightCanvas() {
  const cTop = canvasTopRef.value
  const cBottom = canvasBottomRef.value
  if (!cTop || !cBottom) return

  const ctxTop = cTop.getContext('2d')
  const ctxBottom = cBottom.getContext('2d')
  if (!ctxTop || !ctxBottom) return

  const w = cTop.width
  const h = cTop.height

  drawNightContext(ctxTop, w, h)
  drawNightContext(ctxBottom, w, h)
}

function drawNightContext(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.save()

  const cx = w / 2
  const cy = h / 2
  ctx.translate(cx, cy)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)

  for (const s of stars) {
    ctx.beginPath()
    ctx.arc(s.x + cx, s.y + cy, s.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`
    ctx.fill()
  }

  for (const m of meteors) {
    ctx.beginPath()
    ctx.moveTo(m.x + 80, m.y - 64)
    ctx.lineTo(m.x, m.y)
    ctx.lineWidth = 1.8
    ctx.strokeStyle = m.color
    ctx.stroke()
  }

  if (heroMeteor) {
    if (heroMeteor.trail.length > 1) {
      for (let i = 0; i < heroMeteor.trail.length - 1; i++) {
        const p1 = heroMeteor.trail[i]
        const p2 = heroMeteor.trail[i + 1]
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.lineWidth = Math.max(0.8, (heroMeteor.trail.length - i) * 0.45)
        ctx.strokeStyle = `rgba(125, 211, 252, ${p1.alpha})`
        ctx.stroke()
      }
    }

    ctx.beginPath()
    ctx.arc(heroMeteor.x, heroMeteor.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = heroMeteor.color
    ctx.shadowBlur = 18
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.moveTo(heroMeteor.startX, heroMeteor.startY)
    ctx.lineTo(heroMeteor.x, heroMeteor.y)
    ctx.lineWidth = 1.2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.stroke()
  }

  ctx.restore()
}

// ==========================================
// 2. 白天模式逻辑（经典朝阳升起 + 优雅向上拉帘）
// ==========================================
const dayVisible = ref(true)
const dragProgress = ref(0)
const isDragging = ref(false)
const autoPlayProgress = ref(0)
const canvasDayRef = ref<HTMLCanvasElement | null>(null)
let dayAnimFrame: number | null = null
let dayAutoTimer: any = null

interface DayParticle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
}
let dayParticles: DayParticle[] = []

function initDayScene() {
  const canvas = canvasDayRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    buildDayParticles(canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)

  const loop = () => {
    if (!dayVisible.value) return
    renderDayCanvas(ctx, canvas.width, canvas.height)
    dayAnimFrame = requestAnimationFrame(loop)
  }
  loop()

  // 白天自动播放倒计时
  const totalDuration = 3600
  const interval = 50
  const step = (interval / totalDuration) * 100

  dayAutoTimer = setInterval(() => {
    if (autoPlayProgress.value < 100) {
      autoPlayProgress.value += step
    } else {
      openDayCurtain()
    }
  }, interval)
}

function buildDayParticles(w: number, h: number) {
  dayParticles = []
  const count = Math.floor(w / 35)
  for (let i = 0; i < count; i++) {
    dayParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.2) * 0.6,
      vy: (Math.random() - 0.7) * 0.8,
      alpha: Math.random() * 0.5 + 0.2
    })
  }
}

function renderDayCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  for (const p of dayParticles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x = w
    if (p.x > w) p.x = 0
    if (p.y < 0) p.y = h
    if (p.y > h) p.y = 0

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha * 0.4})`
    ctx.fill()
  }
}

// 白天拖拽手势
let startY = 0
function startDayDrag(e: MouseEvent) {
  isDragging.value = true
  startY = e.clientY
  window.addEventListener('mousemove', onDayDrag)
  window.addEventListener('mouseup', endDayDrag)
}

function startDayDragTouch(e: TouchEvent) {
  isDragging.value = true
  startY = e.touches[0].clientY
  window.addEventListener('touchmove', onDayDragTouch, { passive: true })
  window.addEventListener('touchend', endDayDragTouch)
}

function onDayDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const delta = startY - e.clientY
  if (delta > 0) {
    dragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function onDayDragTouch(e: TouchEvent) {
  if (!isDragging.value) return
  const delta = startY - e.touches[0].clientY
  if (delta > 0) {
    dragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function endDayDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDayDrag)
  window.removeEventListener('mouseup', endDayDrag)
  checkDayOpenThreshold()
}

function endDayDragTouch() {
  isDragging.value = false
  window.removeEventListener('touchmove', onDayDragTouch)
  window.removeEventListener('touchend', endDayDragTouch)
  checkDayOpenThreshold()
}

function checkDayOpenThreshold() {
  if (dragProgress.value > 0.25) {
    openDayCurtain()
  } else {
    dragProgress.value = 0
  }
}

function openDayCurtain() {
  clearInterval(dayAutoTimer)
  dayVisible.value = false
  setTimeout(() => {
    visible.value = false
    if (dayAnimFrame) cancelAnimationFrame(dayAnimFrame)
  }, 850)
}

// ==========================================
// 3. 通用控制
// ==========================================
function skipToHome() {
  if (isDark.value) {
    finishNightTransition()
  } else {
    openDayCurtain()
  }
}

function toggleAutoPlaySetting() {
  disableAutoPlay.value = !disableAutoPlay.value
  if (disableAutoPlay.value) {
    localStorage.setItem(STORAGE_KEY_DISABLE, 'true')
  } else {
    localStorage.removeItem(STORAGE_KEY_DISABLE)
  }
}

onMounted(() => {
  disableAutoPlay.value = localStorage.getItem(STORAGE_KEY_DISABLE) === 'true'

  if (!disableAutoPlay.value) {
    visible.value = true
    setTimeout(() => {
      if (isDark.value) {
        initNightScene()
      } else {
        initDayScene()
      }
    }, 50)
  }
})

onUnmounted(() => {
  clearTimeout(nightTimer)
  clearInterval(dayAutoTimer)
  if (nightAnimFrame) cancelAnimationFrame(nightAnimFrame)
  if (dayAnimFrame) cancelAnimationFrame(dayAnimFrame)
})
</script>

<style scoped>
.bg-night {
  background: radial-gradient(circle at 75% 25%, #17153b 0%, #0c0f1d 50%, #030712 100%);
}

.bg-day {
  background: radial-gradient(circle at 20% 20%, #fef08a 0%, #bae6fd 50%, #e0f2fe 100%);
}

/* 黑夜裂片动画 */
.curtain-shard {
  will-change: transform, clip-path, opacity;
  transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease-out;
}

.rift-glow-border-top {
  box-shadow: 0 0 35px rgba(125, 211, 252, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.6);
}

.rift-glow-border-bottom {
  box-shadow: 0 0 35px rgba(253, 224, 71, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.6);
}

/* 白天朝阳与拉帘动画 */
.sun-pulse {
  box-shadow: 0 0 100px rgba(251, 191, 36, 0.7);
  animation: sunRise 5s ease-out forwards;
}

@keyframes sunRise {
  0% { transform: translateY(20px) scale(0.9); opacity: 0.8; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.day-curtain-leave-active {
  transition: transform 0.85s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.85s ease;
}

.day-curtain-leave-to {
  transform: translateY(-100%);
  opacity: 0.95;
}

.day-dragging {
  transition: none !important;
}
</style>
