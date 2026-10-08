<template>
  <Transition
    name="sky-curtain"
    @after-leave="onAfterLeave"
  >
    <div
      v-if="visible"
      class="sky-curtain-overlay fixed inset-0 z-[9999] overflow-hidden select-none cursor-default font-sans"
      :class="{ 'dragging': isDragging }"
      @mousedown="startDrag"
      @touchstart="startDragTouch"
      :style="{ transform: `translateY(-${dragProgress * 100}%)`, opacity: 1 - dragProgress * 0.4 }"
    >
      <!-- 天空背景画卷 -->
      <div
        class="absolute inset-0 transition-colors duration-1000"
        :class="isDark ? 'bg-night' : 'bg-day'"
      >
        <!-- Canvas 动态层：黑夜流星与星空，白天微风光芒与浮云粒子 -->
        <canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

        <!-- 黑夜场景元素 -->
        <div v-if="isDark" class="absolute inset-0 pointer-events-none overflow-hidden">
          <!-- 弯月或满月带呼吸光晕 -->
          <div class="absolute top-12 right-12 md:top-20 md:right-28 pointer-events-none">
            <div class="relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-amber-100/90 to-yellow-50 shadow-[0_0_50px_rgba(254,240,138,0.45)] moon-glow">
              <!-- 月球陨石坑微弱剪影 -->
              <div class="absolute w-4 h-4 rounded-full bg-amber-200/40 top-5 left-5"></div>
              <div class="absolute w-3 h-3 rounded-full bg-amber-200/30 bottom-6 right-6"></div>
              <div class="absolute w-2 h-2 rounded-full bg-amber-200/30 top-10 right-8"></div>
            </div>
          </div>
          <!-- 远山/极光微弱渐变轮廓 -->
          <div class="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none"></div>
        </div>

        <!-- 白天场景元素 -->
        <div v-else class="absolute inset-0 pointer-events-none overflow-hidden">
          <!-- 朝阳升起光芒 -->
          <div class="absolute -top-10 -left-10 md:top-10 md:left-20 pointer-events-none">
            <div class="relative w-32 h-32 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-[0_0_80px_rgba(251,191,36,0.6)] sun-pulse"></div>
            <div class="absolute -inset-10 rounded-full bg-amber-200/20 blur-2xl animate-pulse"></div>
          </div>
          <!-- 晨光薄雾与远景温和渐变 -->
          <div class="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-sky-100/90 via-sky-50/40 to-transparent pointer-events-none"></div>
        </div>

        <!-- 居中视效与标题仪式感 -->
        <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
          <div class="max-w-xl mx-auto space-y-4 transform transition-all duration-700 ease-out" :style="{ transform: `scale(${1 - dragProgress * 0.15})` }">
            <!-- 灵动徽标或天气小图标 -->
            <div class="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl mx-auto"
                 :class="isDark ? 'bg-white/10 text-amber-300' : 'bg-white/40 text-amber-500'">
              <span class="text-2xl md:text-3xl select-none">{{ isDark ? '✨' : '🌅' }}</span>
            </div>

            <!-- 欢迎主标题 -->
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
                :class="isDark ? 'text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]' : 'text-slate-800 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]'">
              {{ siteTitle }}
            </h1>

            <!-- 灵动副标题 / 问候语 -->
            <p class="text-sm sm:text-base md:text-lg max-w-md mx-auto line-clamp-2"
               :class="isDark ? 'text-slate-300/90' : 'text-slate-600'">
              {{ greetingText }}
            </p>

            <!-- 自动播放倒计时微进度条 -->
            <div class="w-48 sm:w-64 h-1 mx-auto rounded-full overflow-hidden bg-white/20 backdrop-blur-sm mt-6">
              <div
                class="h-full transition-[width] ease-linear duration-75"
                :class="isDark ? 'bg-gradient-to-r from-blue-400 to-indigo-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'"
                :style="{ width: `${autoPlayProgress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 顶部操作条（跳过与不再自动播放开关） -->
        <div class="absolute top-4 right-4 md:top-6 md:right-8 z-30 flex items-center space-x-2 md:space-x-3 pointer-events-auto">
          <!-- 切换不再自动播放 -->
          <button
            type="button"
            @click.stop="toggleAutoPlaySetting"
            class="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-200 border"
            :class="isDark
              ? (disableAutoPlay ? 'bg-white/20 text-white border-white/30' : 'bg-black/30 text-white/70 border-white/10 hover:text-white')
              : (disableAutoPlay ? 'bg-slate-800 text-white border-slate-700' : 'bg-white/60 text-slate-700 border-black/10 hover:bg-white/80')"
            :title="disableAutoPlay ? '已开启静音模式，后续进入不再自动弹窗' : '点击设为不再自动播放'"
          >
            {{ disableAutoPlay ? '已禁止自启' : '不再自动播放' }}
          </button>

          <!-- 立即跳过 -->
          <button
            type="button"
            @click.stop="openCurtain"
            class="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-md transition-all duration-200 shadow-md border hover:scale-105 active:scale-95"
            :class="isDark
              ? 'bg-blue-600/80 hover:bg-blue-600 text-white border-blue-400/30'
              : 'bg-white/80 hover:bg-white text-slate-800 border-white/60'"
          >
            开启旅程 ➔
          </button>
        </div>

        <!-- 底部窗帘拉环 / 向上滑动交互引导 -->
        <div
          class="absolute bottom-4 sm:bottom-6 inset-x-0 flex flex-col items-center justify-center z-20 pointer-events-auto cursor-grab active:cursor-grabbing group"
          @click.stop="openCurtain"
        >
          <!-- 动感向上滑动的箭头指示 -->
          <div class="flex flex-col items-center text-xs space-y-1 transition-transform group-hover:-translate-y-1"
               :class="isDark ? 'text-white/75' : 'text-slate-600'">
            <svg class="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
            </svg>
            <span class="tracking-widest font-medium">向上拉动或点击拉开幕布</span>
          </div>
          <!-- 拟物拉帘手柄条 -->
          <div
            class="mt-2 w-20 h-1.5 rounded-full backdrop-blur-md transition-all duration-300 group-hover:w-28 group-hover:h-2"
            :class="isDark ? 'bg-white/40 group-hover:bg-white/70' : 'bg-slate-700/30 group-hover:bg-slate-800/60'"
          ></div>
        </div>

        <!-- 幕布边缘投影 -->
        <div class="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isDark } from '../utils/theme'
import { getConfigValue } from '../utils/config'

const STORAGE_KEY_DISABLE = 'blog_curtain_disabled'

// 响应式状态
const visible = ref(false)
const disableAutoPlay = ref(false)
const dragProgress = ref(0)
const isDragging = ref(false)
const autoPlayProgress = ref(0)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number | null = null
let autoTimer: any = null

// 配置及文案
const siteTitle = computed(() => getConfigValue('site_title', "Liu Yang's Blog"))
const greetingText = computed(() => {
  if (isDark.value) {
    return '夜幕低垂，星河流转。愿此处的文字，如流星划过，照亮片刻思绪。'
  }
  return '晨光破晓，微风初动。记录思想的萌芽，迎接崭新的一天。'
})

// 流星与星星/粒子系统
interface Star {
  x: number
  y: number
  radius: number
  alpha: number
  twinkleSpeed: number
}

interface Meteor {
  x: number
  y: number
  length: number
  speed: number
  angle: number
  alpha: number
  color: string
}

interface DayParticle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
}

let stars: Star[] = []
let meteors: Meteor[] = []
let dayParticles: DayParticle[] = []

// 初始化 Canvas 粒子
function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    spawnStarsAndParticles()
  }

  resize()
  window.addEventListener('resize', resize)

  const loop = () => {
    if (!visible.value) return
    renderCanvas(ctx, canvas.width, canvas.height)
    animationFrameId = requestAnimationFrame(loop)
  }
  loop()
}

function spawnStarsAndParticles() {
  const width = window.innerWidth
  const height = window.innerHeight

  // 黑夜繁星
  stars = []
  const starCount = Math.floor((width * height) / 3500)
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      radius: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1)
    })
  }

  // 白天阳光微尘粒子
  dayParticles = []
  const dayCount = Math.floor(width / 35)
  for (let i = 0; i < dayCount; i++) {
    dayParticles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.2) * 0.6,
      vy: (Math.random() - 0.7) * 0.8,
      alpha: Math.random() * 0.5 + 0.2
    })
  }

  meteors = []
}

// 产生一颗流星
function createMeteor(width: number) {
  const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.2 // 约 45 度角
  meteors.push({
    x: Math.random() * (width + 200) - 100,
    y: Math.random() * 80 - 40,
    length: Math.random() * 120 + 80,
    speed: Math.random() * 12 + 16,
    angle,
    alpha: 1,
    color: Math.random() > 0.3 ? '#60A5FA' : '#FDE047'
  })
}

function renderCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height)

  if (isDark.value) {
    // 绘制星空
    for (const star of stars) {
      star.alpha += star.twinkleSpeed
      if (star.alpha > 0.95 || star.alpha < 0.2) {
        star.twinkleSpeed = -star.twinkleSpeed
      }
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
      ctx.fill()
    }

    // 随机生成流星（每隔几帧概率产生）
    if (Math.random() < 0.05 && meteors.length < 5) {
      createMeteor(width)
    }

    // 绘制流星
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]
      const tailX = m.x - Math.cos(m.angle) * m.length
      const tailY = m.y - Math.sin(m.angle) * m.length

      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
      grad.addColorStop(1, m.color)

      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(m.x, m.y)
      ctx.lineWidth = 2.2
      ctx.strokeStyle = grad
      ctx.lineCap = 'round'
      ctx.stroke()

      // 流星头部光芒
      ctx.beginPath()
      ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = m.color
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0

      // 移动
      m.x += Math.cos(m.angle) * m.speed
      m.y += Math.sin(m.angle) * m.speed
      m.alpha -= 0.008

      if (m.y > height + 100 || m.x > width + 200 || m.alpha <= 0) {
        meteors.splice(i, 1)
      }
    }
  } else {
    // 白天模式：温暖光斑与漂浮微粒
    for (const p of dayParticles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0) p.x = width
      if (p.x > width) p.x = 0
      if (p.y < 0) p.y = height
      if (p.y > height) p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha * 0.4})`
      ctx.fill()
    }
  }
}

// 拉帘拖拽交互
let startY = 0
function startDrag(e: MouseEvent) {
  isDragging.value = true
  startY = e.clientY
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
}

function startDragTouch(e: TouchEvent) {
  isDragging.value = true
  startY = e.touches[0].clientY
  window.addEventListener('touchmove', onDragTouch, { passive: true })
  window.addEventListener('touchend', endDragTouch)
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const delta = startY - e.clientY
  if (delta > 0) {
    dragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function onDragTouch(e: TouchEvent) {
  if (!isDragging.value) return
  const delta = startY - e.touches[0].clientY
  if (delta > 0) {
    dragProgress.value = Math.min(delta / (window.innerHeight * 0.6), 1)
  }
}

function endDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
  checkOpenThreshold()
}

function endDragTouch() {
  isDragging.value = false
  window.removeEventListener('touchmove', onDragTouch)
  window.removeEventListener('touchend', endDragTouch)
  checkOpenThreshold()
}

function checkOpenThreshold() {
  if (dragProgress.value > 0.25) {
    openCurtain()
  } else {
    dragProgress.value = 0
  }
}

// 自动开启或手动开启
function openCurtain() {
  clearInterval(autoTimer)
  visible.value = false
}

function onAfterLeave() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// 开关记忆“不再自动播放”
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

  // 如果用户未禁止自动播放，则开启开屏大幕
  if (!disableAutoPlay.value) {
    visible.value = true

    // 启动 canvas
    setTimeout(() => {
      initCanvas()
    }, 50)

    // 倒计时约 3.6 秒后自动收起
    const totalDuration = 3600
    const interval = 50
    const step = (interval / totalDuration) * 100

    autoTimer = setInterval(() => {
      if (autoPlayProgress.value < 100) {
        autoPlayProgress.value += step
      } else {
        openCurtain()
      }
    }, interval)
  }
})

onUnmounted(() => {
  clearInterval(autoTimer)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
/* 渐变天空夜景与日景 */
.bg-night {
  background: radial-gradient(circle at 80% 20%, #1e1b4b 0%, #0f172a 45%, #020617 100%);
}

.bg-day {
  background: radial-gradient(circle at 20% 20%, #fef08a 0%, #bae6fd 50%, #e0f2fe 100%);
}

/* 动感月光与朝阳 */
.moon-glow {
  box-shadow: 0 0 60px rgba(254, 240, 138, 0.4), inset -8px -8px 20px rgba(253, 224, 71, 0.2);
  animation: moonFloat 6s ease-in-out infinite alternate;
}

@keyframes moonFloat {
  0% { transform: translateY(0px) rotate(0deg); }
  100% { transform: translateY(-8px) rotate(2deg); }
}

.sun-pulse {
  box-shadow: 0 0 100px rgba(251, 191, 36, 0.7);
  animation: sunRise 5s ease-out forwards;
}

@keyframes sunRise {
  0% { transform: translateY(20px) scale(0.9); opacity: 0.8; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

/* 幕布拉起离开动画：如剧场帷幕向上优雅卷起 */
.sky-curtain-leave-active {
  transition: transform 0.85s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.85s ease;
}

.sky-curtain-leave-to {
  transform: translateY(-100%);
  opacity: 0.95;
}

.dragging {
  transition: none !important;
}
</style>
