<template>
  <div
    v-if="visible"
    class="curtain-portal-root fixed inset-0 z-[9999] overflow-hidden select-none font-sans"
    :class="{ 'pointer-events-none': (isDark && (stage === 'splitting' || stage === 'ended')) }"
  >
    <!-- ========================================== -->
    <!-- 分支一：黑夜模式（漫天自然流星 -> 镜头锁中某颗缓推放大 -> 弧线滑落裂空） -->
    <!-- ========================================== -->
    <template v-if="isDark">
      <!-- 上/左裂片：沿流星贝塞尔弧线轨迹切开的半幕 -->
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

      <!-- 下/右裂片：沿流星轨迹切开的另一半幕 -->
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

        <!-- 中心对焦文案与呼吸光环 -->
        <div class="text-center space-y-4 max-w-lg mx-auto pointer-events-none">
          <div
            class="transition-all duration-1000 transform"
            :class="stage === 'tracking' ? 'scale-105' : 'scale-100'"
          >
            <!-- 阶段微标 -->
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-mono text-blue-200 mb-3">
              <span>{{ stage === 'idle' ? '✦ 点击星空锁定流星跟随' : '✦ 镜头正在对焦并拉近流星…' }}</span>
            </div>

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

// 裂缝两翼样式：沿弧形斜切线分割并舒缓向两侧退开
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

// 虚拟摄影机
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

// 流星定义：无论是背景流星还是被选中的流星，物理尺寸和结构完全一致
interface Meteor {
  id: number
  p0: { x: number; y: number } // 起点
  p1: { x: number; y: number } // 贝塞尔控制点（带来优雅弧度）
  p2: { x: number; y: number } // 终点
  t: number                   // 当前时间参数 0 ~ 1
  speed: number               // 速度
  current: { x: number; y: number }
  trail: { x: number; y: number; alpha: number }[]
  alpha: number
  isHero: boolean             // 是否已被相机选为聚焦主角
}

let meteorCounter = 0
let stars: Star[] = []
let meteors: Meteor[] = []
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
  targetedMeteor = null

  // 初始生成 1-2 颗在天空中漫步的流星
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

// 二阶贝塞尔曲线坐标计算：生成优雅的带弧度航迹
function getBezierPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const invT = 1 - t
  const x = invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x
  const y = invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y
  return { x, y }
}

// 生成具有优雅弧线的流星
function spawnAmbientArcMeteor(w: number, h: number, initialT = 0): Meteor {
  const startX = Math.random() * (w * 0.6) + w * 0.4
  const startY = Math.random() * (h * 0.2) - 50

  const endX = startX - (w * 0.7 + Math.random() * 150)
  const endY = startY + (h * 0.85 + Math.random() * 150)

  // 弧线控制点向外偏置，产生如重力牵引般的优美抛物弧线
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
    speed: 0.0035 + Math.random() * 0.0015, // 优雅稳妥的流星速度，不急不躁
    current: getBezierPoint(p0, p1, p2, initialT),
    trail: [],
    alpha: 0.9,
    isHero: false
  }
  meteors.push(m)
  return m
}

// 用户点击屏幕交互
function onNightScreenClick(e: MouseEvent) {
  const dist = Math.abs(e.clientY - nightPointerDownPos.y)
  if (dist > 15 || stage.value !== 'idle') return
  triggerMeteorLockOn()
}

// 核心逻辑：从天空中现有的流星中选一颗（或者刚升起的流星），摄像机聚焦锁定到它身上并逐步拉近
function triggerMeteorLockOn() {
  if (stage.value !== 'idle') return
  stage.value = 'tracking'

  const w = window.innerWidth
  const h = window.innerHeight

  // 1. 优先在天空中寻找一颗正在划行、且尚未飞完（t < 0.55）的流星
  let candidate = meteors.find(m => m.t > 0.05 && m.t < 0.55)

  // 2. 如果天空中暂无合适流星，则立即从右上角升起一颗全新的优雅弧线流星
  if (!candidate) {
    candidate = spawnAmbientArcMeteor(w, h, 0)
  }

  // 标记其为主角
  candidate.isHero = true
  // 将其飞行周期适度延长以确保 2.5~3 秒充分的运镜欣赏时间
  candidate.speed = 0.0032
  targetedMeteor = candidate
}

function updateNightScene() {
  const w = window.innerWidth
  const h = window.innerHeight

  // 1. 星星呼吸闪烁
  for (const s of stars) {
    s.alpha += s.twinkle
    if (s.alpha > 0.95 || s.alpha < 0.2) {
      s.twinkle = -s.twinkle
    }
  }

  // 2. 漫天流星生成控制（夜空中始终维持 1-2 颗流星轻柔划过）
  if (meteors.length < 2 && Math.random() < 0.012) {
    spawnAmbientArcMeteor(w, h, 0)
  }

  // 3. 更新所有流星的物理弧线位置与拖尾
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.t += m.speed
    m.current = getBezierPoint(m.p0, m.p1, m.p2, m.t)

    // 拖尾记录
    m.trail.unshift({ x: m.current.x, y: m.current.y, alpha: 1 })
    const maxTrail = m.isHero ? 50 : 25
    if (m.trail.length > maxTrail) {
      m.trail.pop()
    }
    for (const pt of m.trail) {
      pt.alpha *= 0.94
    }

    // 普通流星完结后销毁
    if (m.t >= 1 && !m.isHero) {
      meteors.splice(i, 1)
    }
  }

  // 4. 运镜逻辑：摄像机平滑锁定到主角流星上，镜头逐步拉近（持续 2.5 ~ 3 秒）
  if (targetedMeteor) {
    const m = targetedMeteor

    // 摄像机目标：聚焦在这颗流星当前坐标上，缩放目标设为 2.0 倍（近距离特写）
    camera.targetX = m.current.x
    camera.targetY = m.current.y
    camera.targetZoom = 2.0

    // 呼吸式柔和平滑插值（lerp 0.022）：镜头不是瞬间猛推，而是伴随流星飞行柔和跟近，视感自然由小变大
    camera.x += (camera.targetX - camera.x) * 0.022
    camera.y += (camera.targetY - camera.y) * 0.022
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.016

    // 当主角流星划完全部航迹的 75% 且镜头已完成充分对焦后，平缓开启夜空裂隙
    if (m.t >= 0.75 && stage.value === 'tracking') {
      stage.value = 'splitting'
    }
  }

  // 5. 裂空阶段进度
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

// 黑夜手势滑动直接拉开
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

  // 摄像机统一坐标变换：缩放 + 聚焦平移
  // 注意：所有流星与星星的物理尺寸都是完全统一的，流星之所以显大，纯粹是因为 camera.zoom 贴近产生的自然近大远小
  const cx = w / 2
  const cy = h / 2
  ctx.translate(cx, cy)
  ctx.scale(camera.zoom, camera.zoom)
  ctx.translate(-camera.x, -camera.y)

  // 1. 恒星
  for (const s of stars) {
    ctx.beginPath()
    ctx.arc(s.x + cx, s.y + cy, s.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`
    ctx.fill()
  }

  // 2. 所有流星（普通流星与主角流星绘制逻辑统一）
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

    // 头部发光核心
    ctx.beginPath()
    ctx.arc(m.current.x, m.current.y, m.isHero ? 3.5 : 2.2, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = m.isHero ? '#38BDF8' : '#93C5FD'
    ctx.shadowBlur = m.isHero ? 16 : 8
    ctx.fill()
    ctx.shadowBlur = 0

    // 如果是主角流星，绘制已划过的微弱时空弧线
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
// 2. 白天模式逻辑
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

let startY = 0
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
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease-out;
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

.day-dragging, .night-dragging {
  transition: none !important;
}
</style>
