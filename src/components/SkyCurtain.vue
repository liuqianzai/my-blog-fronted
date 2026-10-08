<template>
  <div
    v-if="visible"
    class="curtain-portal-root fixed inset-0 z-[9999] overflow-hidden select-none font-sans"
    :class="{ 'pointer-events-none': (isDark && (stage === 'splitting' || stage === 'ended')) || (!isDark && (dayStage === 'revealing' || dayStage === 'ended')) }"
  >
    <!-- ========================================== -->
    <!-- 分支一：黑夜模式（沉浸星空 + 点击唤醒运镜裂空） -->
    <!-- ========================================== -->
    <template v-if="isDark">
      <!-- 上/左裂片：沿流星轨迹切分开的半幕 -->
      <div
        class="curtain-shard shard-top absolute inset-0"
        :style="shardTopStyle"
      >
        <div
          class="sky-canvas-container absolute inset-0 bg-night"
          :style="nightCurtainDragStyle"
        >
          <canvas ref="canvasTopRef" class="w-full h-full block"></canvas>
        </div>
        <!-- 裂口处的高亮光边 -->
        <div
          v-if="stage === 'splitting'"
          class="absolute inset-0 pointer-events-none rift-glow-border-top"
        ></div>
      </div>

      <!-- 下/右裂片：沿流星轨迹切分开的另一半幕 -->
      <div
        class="curtain-shard shard-bottom absolute inset-0"
        :style="shardBottomStyle"
      >
        <div
          class="sky-canvas-container absolute inset-0 bg-night"
          :style="nightCurtainDragStyle"
        >
          <canvas ref="canvasBottomRef" class="w-full h-full block"></canvas>
        </div>
        <!-- 裂口处的高亮光边 -->
        <div
          v-if="stage === 'splitting'"
          class="absolute inset-0 pointer-events-none rift-glow-border-bottom"
        ></div>
      </div>

      <!-- 黑夜交互与 HUD 层 -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-between p-6 sm:p-8 transition-all duration-700 pointer-events-auto"
        :class="{ 'cursor-pointer': stage === 'idle', 'night-dragging': isNightDragging }"
        :style="[nightHudStyle, { opacity: hudOpacity }]"
        @click="onNightScreenClick"
        @mousedown="startNightDrag"
        @touchstart="startNightDragTouch"
      >
        <!-- 顶部操作条 -->
        <div class="w-full flex items-center justify-between text-xs tracking-wider font-mono text-white/70 pointer-events-auto">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span class="uppercase tracking-widest">{{ stage === 'idle' ? 'NIGHT SKY OBSERVATORY' : 'METEOR FOCUS & ZOOM' }}</span>
          </div>
          <div class="flex items-center space-x-3" @click.stop>
            <button
              type="button"
              @click.stop="skipToHome"
              class="px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 bg-white/20 hover:bg-white/40 text-white border border-white/30"
            >
              跳过 ➔
            </button>
          </div>
        </div>

        <!-- 中心焦点文案与标题 -->
        <div class="text-center space-y-4 max-w-lg mx-auto pointer-events-none">
          <div
            class="transition-all duration-1000 transform"
            :class="stage === 'tracking' ? 'scale-105' : 'scale-100'"
          >
            <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]">
              {{ siteTitle }}
            </h1>
            <p class="text-xs sm:text-sm text-slate-300/80 mt-2 font-light max-w-sm mx-auto leading-relaxed">
              {{ stage === 'idle' ? '夜幕宁静，星河流转。你可以静静驻足，或向上拉开幕布。' : '随流星弧光划过夜空，主页正在缓缓展开…' }}
            </p>
          </div>
        </div>

        <!-- 底部向上滑动引导（在 idle 阶段呈现） -->
        <div
          v-if="stage === 'idle'"
          class="flex flex-col items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing group pb-2"
          @click.stop="openNightCurtainDirectly"
        >
          <div class="flex flex-col items-center text-xs space-y-1 transition-transform group-hover:-translate-y-1 text-white/75">
            <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
            </svg>
            <span class="tracking-widest font-medium">向上拉动或点击直接进入</span>
          </div>
          <div class="mt-2 w-20 h-1.5 rounded-full backdrop-blur-md transition-all duration-300 group-hover:w-28 group-hover:h-2 bg-white/40 group-hover:bg-white/70"></div>
        </div>
        <div v-else class="h-10"></div>
      </div>
    </template>

    <!-- ========================================== -->
    <!-- 分支二：白天模式（阳光苹果树 + 点击苹果坠落运镜裂幕） -->
    <!-- ========================================== -->
    <template v-else>
      <div
        class="absolute inset-0 bg-day overflow-hidden"
        :class="{ 'day-dragging': isDragging, 'cursor-pointer': dayStage === 'idle' }"
        :style="dayRootStyle"
        @click="onDayScreenClick"
        @mousedown="startDayDrag"
        @touchstart="startDayDragTouch"
      >
        <!-- 苹果树与落苹果 Canvas 场景 -->
        <canvas ref="canvasDayRef" class="absolute inset-0 w-full h-full block pointer-events-none"></canvas>

        <!-- 晨曦暖阳光晕与薄雾 -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-12 -left-12 md:top-6 md:left-14">
            <div class="relative w-36 h-36 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 shadow-[0_0_100px_rgba(251,191,36,0.6)] sun-pulse"></div>
            <div class="absolute -inset-10 rounded-full bg-amber-100/30 blur-3xl animate-pulse"></div>
          </div>
          <div class="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-emerald-100/50 via-sky-50/20 to-transparent"></div>
        </div>

        <!-- 白天标题与仪式感居中文案 -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-between p-6 sm:p-8 pointer-events-none transition-all duration-700"
          :style="{ opacity: dayHudOpacity }"
        >
          <!-- 顶部操作栏 -->
          <div class="w-full flex items-center justify-between text-xs tracking-wider font-mono text-slate-700 pointer-events-auto">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span class="uppercase tracking-widest font-semibold">{{ dayStage === 'idle' ? 'SUNLIT ORCHARD' : 'GRAVITY IN MOTION' }}</span>
            </div>
            <div class="flex items-center space-x-3" @click.stop>
              <button
                type="button"
                @click.stop="skipToHome"
                class="px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-200 bg-white/80 hover:bg-white text-slate-800 border border-white/60 shadow-sm"
              >
                跳过 ➔
              </button>
            </div>
          </div>

          <!-- 居中标题与文案 -->
          <div class="max-w-xl mx-auto space-y-3 text-center my-auto transition-transform duration-700" :style="{ transform: `scale(${dayStage === 'tracking' ? 1.05 : 1})` }">
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-800 drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)]">
              {{ siteTitle }}
            </h1>
            <p class="text-xs sm:text-base text-slate-600 max-w-md mx-auto line-clamp-2">
              {{ dayStage === 'idle' ? '清风拂过树梢，阳光洒满果园。你可以静静驻足，或向上拉开幕布。' : '苹果自枝头轻落，灵感如甘霖初现…' }}
            </p>
          </div>

          <!-- 底部向上滑动引导条 -->
          <div
            v-if="dayStage === 'idle'"
            class="flex flex-col items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing group pb-2"
            @click.stop="openDayCurtainDirectly"
          >
            <div class="flex flex-col items-center text-xs space-y-1 transition-transform group-hover:-translate-y-1 text-slate-600">
              <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
              </svg>
              <span class="tracking-widest font-medium">向上拉动或点击直接进入</span>
            </div>
            <div class="mt-2 w-20 h-1.5 rounded-full backdrop-blur-md transition-all duration-300 group-hover:w-28 group-hover:h-2 bg-slate-700/30 group-hover:bg-slate-800/60"></div>
          </div>
          <div v-else class="h-10"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isDark } from '../utils/theme'
import { getConfigValue } from '../utils/config'

const visible = ref(false)
const siteTitle = computed(() => getConfigValue('site_title', "Liu Yang's Blog"))

// ==========================================
// 1. 黑夜模式逻辑（多流星自然流转 -> 点击锁定真实流星 -> 顺滑弧线飞掠 + 镜头渐进推近放大）
// ==========================================
type Stage = 'idle' | 'tracking' | 'splitting' | 'ended'
const stage = ref<Stage>('idle')
const splitProgress = ref(0)
const canvasTopRef = ref<HTMLCanvasElement | null>(null)
const canvasBottomRef = ref<HTMLCanvasElement | null>(null)
let nightAnimFrame: number | null = null

// 黑夜手势状态
const nightDragProgress = ref(0)
const isNightDragging = ref(false)
let nightStartY = 0
let nightPointerDownPos = { x: 0, y: 0 }

const nightCurtainDragStyle = computed(() => {
  if (stage.value === 'idle' && nightDragProgress.value > 0) {
    return {
      transform: `translateY(-${nightDragProgress.value * 100}%)`,
      opacity: 1 - nightDragProgress.value * 0.4
    }
  }
  return {}
})

const nightHudStyle = computed(() => {
  if (stage.value === 'idle' && nightDragProgress.value > 0) {
    return {
      transform: `translateY(-${nightDragProgress.value * 100}%)`
    }
  }
  return {}
})

const hudOpacity = computed(() => {
  if (stage.value === 'splitting') return Math.max(0, 1 - splitProgress.value * 2.5)
  if (stage.value === 'ended') return 0
  return 1
})

const shardTopStyle = computed(() => {
  const clip = 'polygon(0% 0%, 100% 0%, 94% 6%, 6% 94%, 0% 94%)'
  if (stage.value !== 'splitting') {
    return { clipPath: clip }
  }
  const move = splitProgress.value * 115
  const rotate = splitProgress.value * 3.5
  return {
    clipPath: clip,
    transform: `translate3d(-${move}%, -${move * 0.65}%, 0) rotate(-${rotate}deg)`,
    opacity: 1 - splitProgress.value * 0.2
  }
})

const shardBottomStyle = computed(() => {
  const clip = 'polygon(100% 0%, 100% 100%, 0% 100%, 6% 94%, 94% 6%)'
  if (stage.value !== 'splitting') {
    return { clipPath: clip }
  }
  const move = splitProgress.value * 115
  const rotate = splitProgress.value * 3.5
  return {
    clipPath: clip,
    transform: `translate3d(${move}%, ${move * 0.65}%, 0) rotate(${rotate}deg)`,
    opacity: 1 - splitProgress.value * 0.2
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
  id: number
  p0: { x: number; y: number }
  p1: { x: number; y: number }
  p2: { x: number; y: number }
  t: number
  speed: number
  current: { x: number; y: number }
  trail: { x: number; y: number; alpha: number }[]
  alpha: number
  isHero: boolean
}

interface MicroMeteor {
  x: number
  y: number
  length: number
  speed: number
  angle: number
  alpha: number
  trailWidth: number
}

let meteorCounter = 0
let stars: Star[] = []
let meteors: Meteor[] = []
let microMeteors: MicroMeteor[] = []
let targetedMeteor: Meteor | null = null

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
  meteors = []
  microMeteors = []
  targetedMeteor = null

  spawnAmbientArcMeteor(window.innerWidth, window.innerHeight, 0.1)

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
      radius: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 0.02 + 0.008
    })
  }
}

function getBezierPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const invT = 1 - t
  const x = invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x
  const y = invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y
  return { x, y }
}

function spawnAmbientArcMeteor(w: number, h: number, initialT = 0): Meteor {
  const startX = Math.random() * (w * 0.6) + w * 0.4
  const startY = Math.random() * (h * 0.2) - 50

  const endX = startX - (w * 0.7 + Math.random() * 150)
  const endY = startY + (h * 0.85 + Math.random() * 150)

  const ctrlX = (startX + endX) / 2 + (Math.random() * 80 - 40)
  const ctrlY = (startY + endY) / 2 - (h * 0.15 + Math.random() * 50)

  const p0 = { x: startX, y: startY }
  const p1 = { x: ctrlX, y: ctrlY }
  const p2 = { x: endX, y: endY }

  const m: Meteor = {
    id: ++meteorCounter,
    p0,
    p1,
    p2,
    t: initialT,
    speed: 0.0035 + Math.random() * 0.0015,
    current: getBezierPoint(p0, p1, p2, initialT),
    trail: [],
    alpha: 0.9,
    isHero: false
  }
  meteors.push(m)
  return m
}

function spawnMicroMeteor(w: number, h: number) {
  const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35
  microMeteors.push({
    x: Math.random() * (w + 100),
    y: Math.random() * (h * 0.6) - 50,
    length: Math.random() * 45 + 25,
    speed: Math.random() * 7 + 9,
    angle,
    alpha: Math.random() * 0.45 + 0.25,
    trailWidth: Math.random() * 0.4 + 0.5
  })
}

function onNightScreenClick(e: MouseEvent) {
  const dist = Math.abs(e.clientY - nightPointerDownPos.y)
  if (dist > 15 || stage.value !== 'idle') return
  triggerMeteorLockOn()
}

function triggerMeteorLockOn() {
  if (stage.value !== 'idle') return
  stage.value = 'tracking'

  const w = window.innerWidth
  const h = window.innerHeight

  let candidate = meteors.find(m => m.t > 0.05 && m.t < 0.55)
  if (!candidate) {
    candidate = spawnAmbientArcMeteor(w, h, 0)
  }

  candidate.isHero = true
  candidate.speed = 0.0032
  targetedMeteor = candidate
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

  if (meteors.length < 2 && Math.random() < 0.012) {
    spawnAmbientArcMeteor(w, h, 0)
  }

  if (microMeteors.length < 4 && Math.random() < 0.04) {
    spawnMicroMeteor(w, h)
  }
  for (let i = microMeteors.length - 1; i >= 0; i--) {
    const mm = microMeteors[i]
    mm.x -= Math.cos(mm.angle) * mm.speed
    mm.y += Math.sin(mm.angle) * mm.speed
    mm.alpha -= 0.006
    if (mm.alpha <= 0 || mm.y > h + 50 || mm.x < -100) {
      microMeteors.splice(i, 1)
    }
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.t += m.speed
    m.current = getBezierPoint(m.p0, m.p1, m.p2, m.t)

    m.trail.unshift({ x: m.current.x, y: m.current.y, alpha: 1 })
    const maxTrail = m.isHero ? 50 : 25
    if (m.trail.length > maxTrail) {
      m.trail.pop()
    }
    for (const pt of m.trail) {
      pt.alpha *= 0.94
    }

    if (m.t >= 1 && !m.isHero) {
      meteors.splice(i, 1)
    }
  }

  if (targetedMeteor) {
    const m = targetedMeteor
    camera.targetX = m.current.x
    camera.targetY = m.current.y
    camera.targetZoom = 2.0

    camera.x += (camera.targetX - camera.x) * 0.022
    camera.y += (camera.targetY - camera.y) * 0.022
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.016

    if (m.t >= 0.75 && stage.value === 'tracking') {
      stage.value = 'splitting'
    }
  }

  if (stage.value === 'splitting') {
    splitProgress.value += 0.015
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

function startNightDrag(e: MouseEvent) {
  if (stage.value !== 'idle') return
  isNightDragging.value = true
  nightStartY = e.clientY
  nightPointerDownPos = { x: e.clientX, y: e.clientY }
  window.addEventListener('mousemove', onNightDrag)
  window.addEventListener('mouseup', endNightDrag)
}

function startNightDragTouch(e: TouchEvent) {
  if (stage.value !== 'idle') return
  isNightDragging.value = true
  nightStartY = e.touches[0].clientY
  nightPointerDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  window.addEventListener('touchmove', onNightDragTouch, { passive: true })
  window.addEventListener('touchend', endNightDragTouch)
}

function onNightDrag(e: MouseEvent) {
  if (!isNightDragging.value || stage.value !== 'idle') return
  const delta = nightStartY - e.clientY
  if (delta > 0) {
    nightDragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function onNightDragTouch(e: TouchEvent) {
  if (!isNightDragging.value || stage.value !== 'idle') return
  const delta = nightStartY - e.touches[0].clientY
  if (delta > 0) {
    nightDragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function endNightDrag() {
  isNightDragging.value = false
  window.removeEventListener('mousemove', onNightDrag)
  window.removeEventListener('mouseup', endNightDrag)
  checkNightOpenThreshold()
}

function endNightDragTouch() {
  isNightDragging.value = false
  window.removeEventListener('touchmove', onNightDragTouch)
  window.removeEventListener('touchend', endNightDragTouch)
  checkNightOpenThreshold()
}

function checkNightOpenThreshold() {
  if (nightDragProgress.value > 0.25) {
    openNightCurtainDirectly()
  } else {
    nightDragProgress.value = 0
  }
}

function openNightCurtainDirectly() {
  const startProgress = nightDragProgress.value
  const startTime = performance.now()
  const duration = 500

  const anim = (now: number) => {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    nightDragProgress.value = startProgress + (1 - startProgress) * t
    if (t < 1) {
      requestAnimationFrame(anim)
    } else {
      finishNightTransition()
    }
  }
  requestAnimationFrame(anim)
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

  for (const mm of microMeteors) {
    const tailX = mm.x + Math.cos(mm.angle) * mm.length
    const tailY = mm.y - Math.sin(mm.angle) * mm.length

    const grad = ctx.createLinearGradient(tailX, tailY, mm.x, mm.y)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(1, `rgba(224, 242, 254, ${mm.alpha})`)

    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(mm.x, mm.y)
    ctx.lineWidth = mm.trailWidth
    ctx.strokeStyle = grad
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  for (const m of meteors) {
    if (m.trail.length > 1) {
      for (let i = 0; i < m.trail.length - 1; i++) {
        const p1 = m.trail[i]
        const p2 = m.trail[i + 1]
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.lineWidth = Math.max(0.8, (m.trail.length - i) * 0.3)
        ctx.strokeStyle = m.isHero
          ? `rgba(147, 197, 253, ${p1.alpha})`
          : `rgba(224, 242, 254, ${p1.alpha * 0.6})`
        ctx.stroke()
      }
    }

    ctx.beginPath()
    ctx.arc(m.current.x, m.current.y, m.isHero ? 3.5 : 2.2, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = m.isHero ? '#38BDF8' : '#93C5FD'
    ctx.shadowBlur = m.isHero ? 16 : 8
    ctx.fill()
    ctx.shadowBlur = 0

    if (m.isHero && m.t > 0) {
      ctx.beginPath()
      const samples = 25
      for (let s = 0; s <= samples; s++) {
        const curT = (m.t * s) / samples
        const pt = getBezierPoint(m.p0, m.p1, m.p2, curT)
        if (s === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      }
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ==========================================
// 2. 白天模式逻辑（微风阳光苹果树 + 点击苹果自由落体与镜头追踪 + 舒缓波纹展开）
// ==========================================
type DayStage = 'idle' | 'tracking' | 'revealing' | 'ended'
const dayStage = ref<DayStage>('idle')
const canvasDayRef = ref<HTMLCanvasElement | null>(null)
let dayAnimFrame: number | null = null

// 白天手势拉帘
const dragProgress = ref(0)
const isDragging = ref(false)
let dayStartY = 0
let dayPointerDownPos = { x: 0, y: 0 }

// 白天裂变或揭开动画进度 (0 ~ 1)
const dayRevealProgress = ref(0)

const dayRootStyle = computed(() => {
  if (dayStage.value === 'idle' && dragProgress.value > 0) {
    return {
      transform: `translateY(-${dragProgress.value * 100}%)`,
      opacity: 1 - dragProgress.value * 0.4
    }
  }
  if (dayStage.value === 'revealing') {
    // 苹果落地后，白天画卷如圆形光波/优雅向上舒展退散
    const p = dayRevealProgress.value
    return {
      transform: `scale(${1 + p * 0.08})`,
      opacity: Math.max(0, 1 - p * 1.2),
      filter: `blur(${p * 12}px)`
    }
  }
  return {}
})

const dayHudOpacity = computed(() => {
  if (dayStage.value === 'revealing') return Math.max(0, 1 - dayRevealProgress.value * 2)
  if (dayStage.value === 'ended') return 0
  return 1
})

// 白天摄像机
const dayCamera: Camera = {
  x: 0,
  y: 0,
  zoom: 1,
  targetX: 0,
  targetY: 0,
  targetZoom: 1
}

// 苹果定义
interface Apple {
  id: number
  x: number
  y: number
  originX: number
  originY: number
  radius: number
  swingAngle: number
  swingSpeed: number
  state: 'hanging' | 'falling' | 'bounced'
  vy: number
  vx: number
  bounceCount: number
  trail: { x: number; y: number; alpha: number }[]
}

// 阳光浮尘与落叶粒子
interface SunlightParticle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
  type: 'mote' | 'leaf'
  angle: number
  rotSpeed: number
}

// 灵动飞舞的彩蝶定义
interface Butterfly {
  x: number
  y: number
  vx: number
  vy: number
  wingAngle: number
  wingSpeed: number
  wingSpan: number
  color1: string
  color2: string
  baseAngle: number
}

let apples: Apple[] = []
let targetedApple: Apple | null = null
let sunParticles: SunlightParticle[] = []
let butterflies: Butterfly[] = []
let windTime = 0

function initDayScene() {
  const canvas = canvasDayRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    buildDayEnvironment(canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)

  dayCamera.x = window.innerWidth / 2
  dayCamera.y = window.innerHeight / 2
  dayCamera.zoom = 1
  dayCamera.targetX = dayCamera.x
  dayCamera.targetY = dayCamera.y
  dayCamera.targetZoom = 1

  dayStage.value = 'idle'
  dayRevealProgress.value = 0

  const loop = () => {
    if (dayStage.value === 'ended') return
    updateDayScene(canvas.width, canvas.height)
    renderDayCanvas(ctx, canvas.width, canvas.height)
    dayAnimFrame = requestAnimationFrame(loop)
  }
  loop()
}

function buildDayEnvironment(w: number, h: number) {
  // 树冠中心位于屏幕偏右上方
  const treeCenterX = w * 0.72
  const treeCenterY = h * 0.38
  const crownRadius = Math.min(w, h) * 0.28

  apples = []
  // 减少苹果密度：精简为 4 ~ 5 颗，且每次刷新位置、摇曳相位都随机分布
  const appleCount = 4 + Math.floor(Math.random() * 2) // 4 或 5 颗
  for (let i = 0; i < appleCount; i++) {
    // 随机极坐标分布在树冠内
    const angle = (i / appleCount) * Math.PI * 1.8 + (Math.random() - 0.5) * 0.4
    const dist = crownRadius * (0.35 + Math.random() * 0.45)
    const ax = treeCenterX + Math.cos(angle) * dist
    const ay = treeCenterY + Math.sin(angle) * dist * 0.85

    apples.push({
      id: i + 1,
      x: ax,
      y: ay,
      originX: ax,
      originY: ay,
      radius: Math.min(w, h) * 0.015 + 7 + Math.random() * 3, // 大小自然差异 22-28px
      swingAngle: Math.random() * Math.PI * 2,
      swingSpeed: 0.018 + Math.random() * 0.012,
      state: 'hanging',
      vy: 0,
      vx: (Math.random() - 0.5) * 1.2,
      bounceCount: 0,
      trail: []
    })
  }

  // 生成 3 只翩翩起舞的小蝴蝶
  butterflies = [
    {
      x: w * 0.45,
      y: h * 0.45,
      vx: 0.6,
      vy: -0.3,
      wingAngle: 0,
      wingSpeed: 0.18,
      wingSpan: 11,
      color1: '#fde047', // 暖黄
      color2: '#fb923c', // 橙粉
      baseAngle: 0
    },
    {
      x: w * 0.65,
      y: h * 0.55,
      vx: -0.4,
      vy: 0.2,
      wingAngle: 1.5,
      wingSpeed: 0.22,
      wingSpan: 9,
      color1: '#38bdf8', // 浅天蓝
      color2: '#818cf8', // 蓝紫
      baseAngle: Math.PI
    },
    {
      x: w * 0.3,
      y: h * 0.35,
      vx: 0.5,
      vy: 0.4,
      wingAngle: 2.8,
      wingSpeed: 0.15,
      wingSpan: 10,
      color1: '#f472b6', // 樱花粉
      color2: '#c084fc', // 薰衣草紫
      baseAngle: Math.PI / 2
    }
  ]

  // 阳光金尘与随风漂浮的小绿叶
  sunParticles = []
  const count = Math.floor(w / 30)
  for (let i = 0; i < count; i++) {
    sunParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 3 + 1,
      vx: (Math.random() - 0.3) * 0.8,
      vy: (Math.random() - 0.6) * 0.6,
      alpha: Math.random() * 0.6 + 0.2,
      type: Math.random() > 0.4 ? 'mote' : 'leaf',
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04
    })
  }
}

// 用户点击白天屏幕
function onDayScreenClick(e: MouseEvent) {
  const dist = Math.abs(e.clientY - dayPointerDownPos.y)
  if (dist > 15 || dayStage.value !== 'idle') return
  triggerAppleFall()
}

// 核心互动：从树上的苹果中随机挑一颗脱离枝头坠落，摄像机拉近追踪
function triggerAppleFall() {
  if (dayStage.value !== 'idle') return
  dayStage.value = 'tracking'

  const hangingApples = apples.filter(a => a.state === 'hanging')
  if (!hangingApples.length) return

  // 随机选中其中一颗苹果作为主角！
  const randomIndex = Math.floor(Math.random() * hangingApples.length)
  const hero = hangingApples[randomIndex]

  hero.state = 'falling'
  hero.vy = 0.5
  targetedApple = hero
}

function updateDayScene(w: number, h: number) {
  windTime += 0.03

  // 1. 阳光粒子与树叶飘动
  for (const p of sunParticles) {
    p.x += p.vx + Math.sin(windTime + p.y * 0.01) * 0.3
    p.y += p.vy
    p.angle += p.rotSpeed
    if (p.x < -20) p.x = w + 20
    if (p.x > w + 20) p.x = -20
    if (p.y < -20) p.y = h + 20
    if (p.y > h + 20) p.y = -20
  }

  // 1.5 灵动小蝴蝶飞舞（翅膀扇动 + 优美波浪轨迹）
  for (const b of butterflies) {
    b.wingAngle += b.wingSpeed
    b.x += b.vx + Math.cos(windTime * 1.5 + b.y * 0.02) * 0.8
    b.y += b.vy + Math.sin(windTime * 2 + b.x * 0.02) * 0.6

    // 边界反弹/回环漫游
    if (b.x < w * 0.1) b.vx = Math.abs(b.vx)
    if (b.x > w * 0.9) b.vx = -Math.abs(b.vx)
    if (b.y < h * 0.15) b.vy = Math.abs(b.vy)
    if (b.y > h * 0.8) b.vy = -Math.abs(b.vy)
  }

  // 2. 苹果物理状态更新
  const groundY = h * 0.88 // 草地地面高度

  for (const a of apples) {
    if (a.state === 'hanging') {
      // 在枝头随风微弱摆动
      a.swingAngle += a.swingSpeed
      a.x = a.originX + Math.sin(a.swingAngle) * 3
      a.y = a.originY + Math.cos(a.swingAngle) * 1.5
    } else if (a.state === 'falling' || a.state === 'bounced') {
      // 优雅重力自由落体（慢重力，模拟梦幻物理）
      const gravity = 0.38
      a.vy += gravity
      a.y += a.vy
      a.x += a.vx

      // 轨迹微光粒子记录
      a.trail.unshift({ x: a.x, y: a.y, alpha: 1 })
      if (a.trail.length > 25) a.trail.pop()
      for (const t of a.trail) t.alpha *= 0.92

      // 触地反弹判定
      if (a.y >= groundY - a.radius) {
        a.y = groundY - a.radius
        if (a.bounceCount < 2) {
          a.vy = -a.vy * 0.45 // 弹起衰减
          a.bounceCount++
          a.state = 'bounced'
        } else {
          a.vy = 0
          a.vx = 0
          // 苹果落地平稳，触发画卷舒缓展开
          if (dayStage.value === 'tracking') {
            dayStage.value = 'revealing'
          }
        }
      }
    }
  }

  // 3. 摄像机跟踪坠落苹果并逐渐推近特写（约 2.2 ~ 2.6 秒）
  if (targetedApple) {
    dayCamera.targetX = targetedApple.x
    dayCamera.targetY = targetedApple.y
    dayCamera.targetZoom = 1.9 // 镜头放大 1.9 倍聚焦苹果

    dayCamera.x += (dayCamera.targetX - dayCamera.x) * 0.035
    dayCamera.y += (dayCamera.targetY - dayCamera.y) * 0.035
    dayCamera.zoom += (dayCamera.targetZoom - dayCamera.zoom) * 0.02
  }

  // 4. 揭开主页过程
  if (dayStage.value === 'revealing') {
    dayRevealProgress.value += 0.022
    if (dayRevealProgress.value >= 1) {
      finishDayTransition()
    }
  }
}

function finishDayTransition() {
  dayStage.value = 'ended'
  visible.value = false
  if (dayAnimFrame) {
    cancelAnimationFrame(dayAnimFrame)
    dayAnimFrame = null
  }
}

function renderDayCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.save()

  // 摄影机空间变换
  const cx = w / 2
  const cy = h / 2
  ctx.translate(cx, cy)
  ctx.scale(dayCamera.zoom, dayCamera.zoom)
  ctx.translate(-dayCamera.x, -dayCamera.y)

  // 1. 远景小山丘与草地剪影
  drawRollingHills(ctx, w, h)

  // 2. 绘制微风苹果树（树干与枝叶云团）
  drawAppleTree(ctx, w, h)

  // 3. 绘制苹果（树上及坠落中的苹果）
  drawApples(ctx)

  // 3.5 绘制翩翩起舞的小蝴蝶
  drawButterflies(ctx)

  // 4. 阳光微尘与微风小叶
  drawSunParticles(ctx)

  ctx.restore()
}

// 绘制地景山丘
function drawRollingHills(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  // 远山
  ctx.beginPath()
  ctx.moveTo(-w * 0.5, h * 0.95)
  ctx.quadraticCurveTo(w * 0.3, h * 0.72, w * 1.5, h * 0.92)
  ctx.lineTo(w * 1.5, h * 1.5)
  ctx.lineTo(-w * 0.5, h * 1.5)
  ctx.fillStyle = '#bbf7d0' // 浅绿
  ctx.fill()

  // 前景草地
  ctx.beginPath()
  ctx.moveTo(-w * 0.5, h * 0.92)
  ctx.quadraticCurveTo(w * 0.6, h * 0.82, w * 1.5, h * 0.88)
  ctx.lineTo(w * 1.5, h * 1.5)
  ctx.lineTo(-w * 0.5, h * 1.5)
  ctx.fillStyle = '#86efac' // 柔和鲜绿
  ctx.fill()
  ctx.restore()
}

// 绘制苹果树
function drawAppleTree(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const treeX = w * 0.72
  const treeY = h * 0.86
  const trunkWidth = Math.min(w, h) * 0.05

  ctx.save()
  // 树干（带自然的温润棕色弧度）
  ctx.beginPath()
  ctx.moveTo(treeX - trunkWidth * 0.8, treeY)
  ctx.quadraticCurveTo(treeX - trunkWidth * 0.2, h * 0.58, treeX - trunkWidth * 0.5, h * 0.42)
  ctx.lineTo(treeX + trunkWidth * 0.5, h * 0.42)
  ctx.quadraticCurveTo(treeX + trunkWidth * 0.2, h * 0.58, treeX + trunkWidth * 0.8, treeY)
  ctx.fillStyle = '#78350f' // 树干棕
  ctx.fill()

  // 树冠层叠圆润叶团（多重色彩层次）
  const crownCenterX = treeX
  const crownCenterY = h * 0.38
  const baseR = Math.min(w, h) * 0.22

  const leafPuffs = [
    { dx: -baseR * 0.6, dy: 0, r: baseR * 0.75, color: '#22c55e' },
    { dx: baseR * 0.5, dy: -baseR * 0.2, r: baseR * 0.8, color: '#16a34a' },
    { dx: 0, dy: -baseR * 0.6, r: baseR * 0.85, color: '#4ade80' },
    { dx: -baseR * 0.2, dy: -baseR * 0.25, r: baseR * 0.9, color: '#22c55e' },
    { dx: baseR * 0.2, dy: baseR * 0.1, r: baseR * 0.75, color: '#15803d' },
    { dx: 0, dy: baseR * 0.05, r: baseR * 0.8, color: '#22c55e' }
  ]

  for (const puff of leafPuffs) {
    ctx.beginPath()
    const windOffset = Math.sin(windTime + puff.dx) * 4
    ctx.arc(crownCenterX + puff.dx + windOffset, crownCenterY + puff.dy, puff.r, 0, Math.PI * 2)
    ctx.fillStyle = puff.color
    ctx.fill()
  }
  ctx.restore()
}

// 绘制苹果
function drawApples(ctx: CanvasRenderingContext2D) {
  for (const a of apples) {
    ctx.save()

    // 如果在坠落中，绘制柔和光斑尾迹
    if (a.trail.length > 1) {
      for (let i = 0; i < a.trail.length - 1; i++) {
        const pt = a.trail[i]
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, a.radius * 0.6 * pt.alpha, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(254, 240, 138, ${pt.alpha * 0.4})`
        ctx.fill()
      }
    }

    // 细细的小果梗
    ctx.beginPath()
    ctx.moveTo(a.x, a.y - a.radius * 0.6)
    ctx.quadraticCurveTo(a.x + 3, a.y - a.radius * 1.3, a.x + 6, a.y - a.radius * 1.5)
    ctx.lineWidth = 2
    ctx.strokeStyle = '#451a03'
    ctx.stroke()

    // 绿叶小芽
    ctx.beginPath()
    ctx.ellipse(a.x + 4, a.y - a.radius * 1.2, 5, 2.5, Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = '#4ade80'
    ctx.fill()

    // 苹果主体：饱满透亮的红宝石色渐变
    const grad = ctx.createRadialGradient(
      a.x - a.radius * 0.35,
      a.y - a.radius * 0.35,
      a.radius * 0.1,
      a.x,
      a.y,
      a.radius
    )
    grad.addColorStop(0, '#f87171') // 高光粉红
    grad.addColorStop(0.35, '#ef4444') // 鲜艳红
    grad.addColorStop(1, '#b91c1c') // 深果红

    ctx.beginPath()
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.shadowColor = 'rgba(185, 28, 28, 0.4)'
    ctx.shadowBlur = a.state === 'falling' ? 14 : 6
    ctx.fill()
    ctx.shadowBlur = 0

    // 苹果表面高光点
    ctx.beginPath()
    ctx.arc(a.x - a.radius * 0.35, a.y - a.radius * 0.35, a.radius * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.fill()

    ctx.restore()
  }
}

// 绘制阳光浮尘与微风落叶
function drawSunParticles(ctx: CanvasRenderingContext2D) {
  for (const p of sunParticles) {
    ctx.save()
    if (p.type === 'mote') {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(253, 224, 71, ${p.alpha})`
      ctx.fill()
    } else {
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.beginPath()
      ctx.ellipse(0, 0, p.radius * 2.2, p.radius, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(74, 222, 128, ${p.alpha * 0.75})`
      ctx.fill()
    }
    ctx.restore()
  }
}

// 绘制翩翩起舞的小蝴蝶（扇翅动画与半透明彩翼）
function drawButterflies(ctx: CanvasRenderingContext2D) {
  for (const b of butterflies) {
    ctx.save()
    ctx.translate(b.x, b.y)

    // 蝴蝶朝向
    const moveAngle = Math.atan2(b.vy, b.vx) + Math.PI / 2
    ctx.rotate(moveAngle)

    // 扇翅幅度（基于 wingAngle 进行正弦振荡）
    const flap = Math.cos(b.wingAngle) // -1 ~ 1
    const currentSpan = b.wingSpan * Math.abs(flap)

    // 蝴蝶小身体
    ctx.beginPath()
    ctx.ellipse(0, 0, 1.8, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#1e293b'
    ctx.fill()

    // 细小触角
    ctx.beginPath()
    ctx.moveTo(-1, -4)
    ctx.lineTo(-3, -7)
    ctx.moveTo(1, -4)
    ctx.lineTo(3, -7)
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.8
    ctx.stroke()

    // 左翅膀（主翼 + 尾翼）
    ctx.beginPath()
    ctx.ellipse(-currentSpan * 0.5, -2, currentSpan * 0.6, 5, -Math.PI / 6, 0, Math.PI * 2)
    ctx.fillStyle = b.color1
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(-currentSpan * 0.4, 2.5, currentSpan * 0.45, 3.5, Math.PI / 6, 0, Math.PI * 2)
    ctx.fillStyle = b.color2
    ctx.fill()

    // 右翅膀（主翼 + 尾翼）
    ctx.beginPath()
    ctx.ellipse(currentSpan * 0.5, -2, currentSpan * 0.6, 5, Math.PI / 6, 0, Math.PI * 2)
    ctx.fillStyle = b.color1
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(currentSpan * 0.4, 2.5, currentSpan * 0.45, 3.5, -Math.PI / 6, 0, Math.PI * 2)
    ctx.fillStyle = b.color2
    ctx.fill()

    ctx.restore()
  }
}

// 白天拖拽手势
function startDayDrag(e: MouseEvent) {
  if (dayStage.value !== 'idle') return
  isDragging.value = true
  dayStartY = e.clientY
  dayPointerDownPos = { x: e.clientX, y: e.clientY }
  window.addEventListener('mousemove', onDayDrag)
  window.addEventListener('mouseup', endDayDrag)
}

function startDayDragTouch(e: TouchEvent) {
  if (dayStage.value !== 'idle') return
  isDragging.value = true
  dayStartY = e.touches[0].clientY
  dayPointerDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  window.addEventListener('touchmove', onDayDragTouch, { passive: true })
  window.addEventListener('touchend', endDayDragTouch)
}

function onDayDrag(e: MouseEvent) {
  if (!isDragging.value || dayStage.value !== 'idle') return
  const delta = dayStartY - e.clientY
  if (delta > 0) {
    dragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function onDayDragTouch(e: TouchEvent) {
  if (!isDragging.value || dayStage.value !== 'idle') return
  const delta = dayStartY - e.touches[0].clientY
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
    openDayCurtainDirectly()
  } else {
    dragProgress.value = 0
  }
}

function openDayCurtainDirectly() {
  const startProgress = dragProgress.value
  const startTime = performance.now()
  const duration = 500

  const anim = (now: number) => {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    dragProgress.value = startProgress + (1 - startProgress) * t
    if (t < 1) {
      requestAnimationFrame(anim)
    } else {
      finishDayTransition()
    }
  }
  requestAnimationFrame(anim)
}

// ==========================================
// 3. 通用控制
// ==========================================
function skipToHome() {
  if (isDark.value) {
    finishNightTransition()
  } else {
    finishDayTransition()
  }
}

onMounted(() => {
  visible.value = true
  setTimeout(() => {
    if (isDark.value) {
      initNightScene()
    } else {
      initDayScene()
    }
  }, 50)
})

onUnmounted(() => {
  if (nightAnimFrame) cancelAnimationFrame(nightAnimFrame)
  if (dayAnimFrame) cancelAnimationFrame(dayAnimFrame)
})
</script>

<style scoped>
.bg-night {
  background: radial-gradient(circle at 75% 25%, #17153b 0%, #0c0f1d 50%, #030712 100%);
}

.bg-day {
  background: radial-gradient(circle at 20% 18%, #fef3c7 0%, #dbeafe 55%, #e0f2fe 100%);
}

/* 黑夜裂片动画 */
.curtain-shard {
  will-change: transform, clip-path, opacity;
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease-out;
}

.rift-glow-border-top {
  box-shadow: 0 0 35px rgba(125, 211, 252, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.6);
}

.rift-glow-border-bottom {
  box-shadow: 0 0 35px rgba(253, 224, 71, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.6);
}

/* 白天朝阳动效 */
.sun-pulse {
  animation: sunFloat 6s ease-in-out infinite alternate;
}

@keyframes sunFloat {
  0% { transform: translateY(0px) scale(0.98); }
  100% { transform: translateY(-8px) scale(1.02); }
}

.day-dragging, .night-dragging {
  transition: none !important;
}
</style>
