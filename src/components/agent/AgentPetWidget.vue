<template>
  <div class="fixed inset-0 pointer-events-none z-40 select-none overflow-hidden">
    <!-- 智能自适应跟随气泡卡片 -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-95"
    >
      <div
        v-if="agentStore.bubbleVisible && agentStore.currentBubble"
        class="absolute pointer-events-auto w-[330px] sm:w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-200"
        :class="bubbleThemeClasses"
        :style="{
          left: `${bubbleLeft}px`,
          bottom: `${bubbleBottom}px`,
        }"
        @mouseenter="pauseDismissTimer"
        @mouseleave="resumeDismissTimer"
      >
        <!-- 气泡下三角形箭头 (动态对准小桌宠中心) -->
        <div
          class="absolute -bottom-2 w-4 h-4 rotate-45 border-r border-b"
          :class="arrowThemeClasses"
          :style="{ left: `${arrowLeft}px` }"
        ></div>

        <!-- 顶部信息行：神态徽标 + 标题 + 纯文本收起按钮 -->
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
              :class="moodBadgeClasses"
            >
              {{ moodBadgeLabel }}
            </span>
            <span class="text-xs font-semibold text-gray-800 dark:text-gray-200">
              博客智能桌宠
            </span>
          </div>
          <button
            type="button"
            class="text-xs text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 px-1 py-0.5 rounded transition-colors"
            @click="agentStore.dismissBubble()"
          >
            收起
          </button>
        </div>

        <!-- 气泡核心台词 -->
        <p class="text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-3">
          {{ agentStore.currentBubble.bubbleText }}
        </p>

        <!-- 推荐关联文章微卡片 (如有) -->
        <div
          v-if="agentStore.currentBubble.relatedArticle"
          class="mb-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group"
          @click="handleNavigateArticle(agentStore.currentBubble.relatedArticle.id)"
        >
          <div class="flex gap-2.5 items-start">
            <img
              v-if="agentStore.currentBubble.relatedArticle.cover"
              :src="agentStore.currentBubble.relatedArticle.cover"
              :alt="agentStore.currentBubble.relatedArticle.title"
              class="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1 transition-colors">
                {{ agentStore.currentBubble.relatedArticle.title }}
              </div>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {{ agentStore.currentBubble.relatedArticle.summary || agentStore.currentBubble.relatedArticle.matchReason }}
              </p>
              <div class="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                <span v-if="agentStore.currentBubble.relatedArticle.categoryName" class="text-blue-600 dark:text-blue-400 font-medium">
                  {{ agentStore.currentBubble.relatedArticle.categoryName }}
                </span>
                <span>{{ agentStore.currentBubble.relatedArticle.viewCount }} 次阅读</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 纯文本操作按钮组 (严格遵守纯文本无符号规范) -->
        <div class="flex flex-wrap items-center justify-end gap-1.5 pt-1">
          <template v-for="(action, idx) in agentStore.currentBubble.suggestActions" :key="idx">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs transition-all font-medium"
              :class="getActionBtnClass(action.actionCode)"
              @click="handleAction(action)"
            >
              {{ action.label }}
            </button>
          </template>
        </div>

        <!-- 倒计时进度条 (若 autoDismissSec > 0) -->
        <div
          v-if="agentStore.currentBubble.autoDismissSec > 0"
          class="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-100 dark:bg-slate-800 rounded-b-2xl overflow-hidden"
        >
          <div
            class="h-full bg-blue-500 dark:bg-blue-400 transition-all linear"
            :style="{ width: `${dismissProgressPercent}%` }"
          ></div>
        </div>
      </div>
    </transition>

    <!-- 桌宠主体：全屏自由坐标容器 (可拖拽、自主行走、物理落体) -->
    <div
      class="absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-shadow"
      :style="{
        left: `${petX}px`,
        top: `${petY}px`,
        width: '80px',
        height: '80px',
      }"
      @mousedown="onPetMouseDown"
      @mouseenter="onPetMouseEnter"
      @mouseleave="onPetMouseLeave"
      @dblclick="onPetDblClick"
    >
      <!-- 今日静音提示小徽章 -->
      <div
        v-if="agentStore.isMuted"
        class="absolute -top-1 right-2 z-10 px-1.5 py-0.2 bg-gray-600 text-white text-[9px] rounded-full border border-white dark:border-slate-800 shadow-sm"
      >
        静音
      </div>

      <!-- 灵宠发光光晕 (心情呼应) -->
      <div
        class="absolute inset-1 rounded-full blur-md opacity-40 transition-opacity duration-300"
        :class="glowClasses"
      ></div>

      <!-- 灵狐桌宠视觉角色组件 -->
      <AgentPetCharacter
        :state="petState"
        :mood="agentStore.petMood"
        :facing="facingDirection"
        :is-muted="agentStore.isMuted"
        :wind-angle="windAngle"
        :look-offset="lookOffset"
        :is-petting="isPetting"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAgentStore } from '../../store/agent'
import type { AgentSuggestActionVO } from '../../api/agent'
import AgentPetCharacter from './AgentPetCharacter.vue'
import { onWindGust, triggerWindGust } from '../../utils/wind'

const router = useRouter()
const agentStore = useAgentStore()

// 1. 全屏坐标系统与物理引擎状态
const petX = ref(window.innerWidth - 130)
const petY = ref(window.innerHeight - 95)
const facingDirection = ref<1 | -1>(-1) // 1: 面向右, -1: 面向左
const petState = ref<'idle' | 'walk' | 'sit' | 'nap' | 'jump' | 'dragging' | 'falling'>('idle')
const isPetting = ref(false)
const windAngle = ref(0)
const lookOffset = ref({ x: 0, y: 0 })

// 物理地平线基准
const groundY = computed(() => Math.max(100, window.innerHeight - 95))

// 2. 鼠标拖拽系统状态
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragOffsetX = 0
let dragOffsetY = 0
let hasMoved = false

// 3. 自由落体物理循环
let fallAnimationId: number | null = null
let velocityY = 0
const GRAVITY = 0.8
const BOUNCE_RESTITUTION = 0.35

// 4. 自主漫步 AI 调度器
let roamingTimer: ReturnType<typeof setTimeout> | null = null
let walkAnimationId: number | null = null

// 5. 气泡倒计时管理
const dismissProgressPercent = ref(100)
let dismissTimer: ReturnType<typeof setInterval> | null = null
let remainingMs = 0
let totalMs = 0
let isTimerPaused = false

// --- 气泡自适应坐标计算 (贴合桌宠头顶，视口边界动态防溢出) ---
const bubbleWidth = 350
const bubbleLeft = computed(() => {
  // 桌宠中心 X
  const centerPetX = petX.value + 40
  let targetLeft = centerPetX - bubbleWidth / 2
  // 视口边界钳位
  const minLeft = 16
  const maxLeft = Math.max(16, window.innerWidth - bubbleWidth - 16)
  return Math.max(minLeft, Math.min(maxLeft, targetLeft))
})

const bubbleBottom = computed(() => {
  // 气泡位于小桌宠上方 12px
  return Math.max(20, window.innerHeight - petY.value + 10)
})

// 箭头相对气泡左侧偏移 (指准桌宠中心)
const arrowLeft = computed(() => {
  const centerPetX = petX.value + 40
  const rel = centerPetX - bubbleLeft.value - 8
  return Math.max(16, Math.min(bubbleWidth - 32, rel))
})

// --- 气泡样式与主题 ---
const bubbleThemeClasses = computed(() => 'bg-white/95 dark:bg-slate-900/95 border-gray-200/90 dark:border-slate-700/80')
const arrowThemeClasses = computed(() => 'bg-white dark:bg-slate-900 border-gray-200/90 dark:border-slate-700/80')

const glowClasses = computed(() => {
  if (agentStore.isMuted) return 'bg-gray-400/20'
  switch (agentStore.petMood) {
    case 'HAPPY':
      return 'bg-amber-400/50 dark:bg-amber-500/40'
    case 'THINKING':
      return 'bg-purple-500/50 dark:bg-purple-600/40'
    case 'ENERGETIC':
      return 'bg-sky-400/60 dark:bg-sky-500/50'
    case 'GUIDE':
      return 'bg-teal-400/50 dark:bg-teal-500/40'
    default:
      return 'bg-blue-400/40 dark:bg-blue-500/30'
  }
})

const moodBadgeClasses = computed(() => {
  switch (agentStore.petMood) {
    case 'HAPPY':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'THINKING':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    case 'ENERGETIC':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
    case 'GUIDE':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  }
})

const moodBadgeLabel = computed(() => {
  switch (agentStore.petMood) {
    case 'HAPPY':
      return '心境吉兆'
    case 'THINKING':
      return '卦象求索'
    case 'ENERGETIC':
      return '重磅上新'
    case 'GUIDE':
      return '深度研读'
    default:
      return '随行灵宠'
  }
})

// --- 纯文本按钮样式匹配 ---
function getActionBtnClass(actionCode: string) {
  if (actionCode === 'NAVIGATE_ARTICLE') {
    return 'bg-blue-600 hover:bg-blue-700 text-white'
  }
  if (actionCode === 'OPEN_CHAT') {
    return 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-300'
  }
  if (actionCode === 'MUTE_PET') {
    return 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-400'
  }
  return 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-400'
}

// --- 鼠标抓取与拖拽逻辑 ---
function onPetMouseDown(e: MouseEvent) {
  if (e.button !== 0) return // 仅响应鼠标左键

  // 中断当前一切漫步与落体
  stopWalking()
  stopFalling()
  clearTimeout(roamingTimer!)

  isDragging = true
  hasMoved = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragOffsetX = e.clientX - petX.value
  dragOffsetY = e.clientY - petY.value

  petState.value = 'dragging'

  window.addEventListener('mousemove', onPetMouseMove)
  window.addEventListener('mouseup', onPetMouseUp)
}

function onPetMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY)
  if (dist > 5) {
    hasMoved = true
  }

  // 坐标跟随鼠标，并在屏幕视口内部钳位
  petX.value = Math.max(10, Math.min(window.innerWidth - 90, e.clientX - dragOffsetX))
  petY.value = Math.max(10, Math.min(window.innerHeight - 90, e.clientY - dragOffsetY))
}

function onPetMouseUp(_e: MouseEvent) {
  if (!isDragging) return
  isDragging = false
  window.removeEventListener('mousemove', onPetMouseMove)
  window.removeEventListener('mouseup', onPetMouseUp)

  if (!hasMoved) {
    // 纯点击互动 (Poke / Pet)
    handlePetPoke()
    petState.value = 'idle'
    scheduleNextRoam()
    return
  }

  // 松手后启动物理自由落体
  startFalling()
}

// 自由落体与碰撞反弹引擎
function startFalling() {
  stopFalling()
  petState.value = 'falling'
  velocityY = 0

  function fallStep() {
    velocityY += GRAVITY
    petY.value += velocityY

    if (petY.value >= groundY.value) {
      // 触地反弹
      petY.value = groundY.value
      velocityY = -velocityY * BOUNCE_RESTITUTION

      // 触地瞬间激起水波与微风涟漪 (场景互动共鸣)
      triggerWindGust(1.2, 0)

      // 弹力消退平稳站定
      if (Math.abs(velocityY) < 1.4) {
        petY.value = groundY.value
        petState.value = 'idle'
        stopFalling()
        scheduleNextRoam()
        return
      }
    }

    fallAnimationId = requestAnimationFrame(fallStep)
  }

  fallAnimationId = requestAnimationFrame(fallStep)
}

function stopFalling() {
  if (fallAnimationId) {
    cancelAnimationFrame(fallAnimationId)
    fallAnimationId = null
  }
}

// --- 纯点击与抚摸互动 ---
function handlePetPoke() {
  isPetting.value = true
  setTimeout(() => {
    isPetting.value = false
  }, 1200)

  if (agentStore.isMuted) {
    agentStore.unmutePet()
    ElMessage.success('已恢复小灵宠提示')
    return
  }

  if (agentStore.bubbleVisible) {
    agentStore.openChat(agentStore.currentBubble?.contextToken)
  } else {
    agentStore.openChat()
  }
}

// 双击萌态小跳 (Jump)
function onPetDblClick() {
  if (isDragging || petState.value === 'falling') return
  stopWalking()
  petState.value = 'jump'

  // 向上小跳
  const startY = petY.value
  let jumpProgress = 0
  const jumpDuration = 450
  const startTime = performance.now()

  function jumpStep(now: number) {
    const elapsed = now - startTime
    jumpProgress = Math.min(1, elapsed / jumpDuration)
    // 抛物线跳跃: sin(0 -> pi)
    const offset = Math.sin(jumpProgress * Math.PI) * 28
    petY.value = startY - offset

    if (jumpProgress < 1) {
      requestAnimationFrame(jumpStep)
    } else {
      petY.value = startY
      petState.value = 'idle'
      triggerWindGust(0.8, 0) // 落地轻波
      scheduleNextRoam()
    }
  }

  requestAnimationFrame(jumpStep)
}

function onPetMouseEnter() {
  // 鼠标悬停时略微放缓
}

function onPetMouseLeave() {
  lookOffset.value = { x: 0, y: 0 }
}

// 鼠标目光轻微跟随
function onGlobalMouseMove(e: MouseEvent) {
  if (isDragging) return
  const centerPetX = petX.value + 40
  const centerPetY = petY.value + 40
  const dx = e.clientX - centerPetX
  const dy = e.clientY - centerPetY
  const dist = Math.hypot(dx, dy)

  if (dist < 260) {
    lookOffset.value = {
      x: Math.max(-2, Math.min(2, (dx / 260) * 2)),
      y: Math.max(-1.5, Math.min(1.5, (dy / 260) * 1.5)),
    }
  } else {
    lookOffset.value = { x: 0, y: 0 }
  }
}

// --- 自主漫步 AI 行为树 ---
function scheduleNextRoam() {
  clearTimeout(roamingTimer!)
  if (isDragging || agentStore.chatDrawerVisible || petState.value === 'falling') return

  // 4~7 秒随机决策一次行为
  const delay = 4000 + Math.random() * 3000
  roamingTimer = setTimeout(() => {
    executeAiBehavior()
  }, delay)
}

function executeAiBehavior() {
  if (isDragging || agentStore.chatDrawerVisible || petState.value === 'falling') {
    scheduleNextRoam()
    return
  }

  // 行为概率分布: 45% 漫步, 25% 原地坐看, 15% 欢快小跳, 15% 打盹
  const rand = Math.random()
  if (rand < 0.45) {
    startRoamingWalk()
  } else if (rand < 0.70) {
    petState.value = 'sit'
    setTimeout(() => {
      petState.value = 'idle'
      scheduleNextRoam()
    }, 3200)
  } else if (rand < 0.85) {
    onPetDblClick()
  } else {
    petState.value = 'nap'
    setTimeout(() => {
      petState.value = 'idle'
      scheduleNextRoam()
    }, 4500)
  }
}

function startRoamingWalk() {
  stopWalking()

  // 在屏幕安全宽度内挑选目标 X
  const minX = 40
  const maxX = Math.max(minX, window.innerWidth - 130)
  const targetX = minX + Math.random() * (maxX - minX)

  // 设置面朝方向
  facingDirection.value = targetX >= petX.value ? 1 : -1
  petState.value = 'walk'

  const startX = petX.value
  const distance = Math.abs(targetX - startX)
  const speed = 65 // 移动速度：65px/s (平缓自然)
  const duration = (distance / speed) * 1000
  const startTime = performance.now()

  function walkStep(now: number) {
    if (isDragging || petState.value === 'falling') return
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)

    petX.value = startX + (targetX - startX) * progress

    if (progress < 1) {
      walkAnimationId = requestAnimationFrame(walkStep)
    } else {
      petX.value = targetX
      petState.value = 'idle'
      scheduleNextRoam()
    }
  }

  walkAnimationId = requestAnimationFrame(walkStep)
}

function stopWalking() {
  if (walkAnimationId) {
    cancelAnimationFrame(walkAnimationId)
    walkAnimationId = null
  }
}

// --- 窗口重置自适应 ---
function onWindowResize() {
  petX.value = Math.max(16, Math.min(window.innerWidth - 100, petX.value))
  if (petState.value !== 'falling' && !isDragging) {
    petY.value = groundY.value
  }
}

// --- 场景感知：风场共鸣监听 ---
let unregisterWind: (() => void) | null = null

// --- 气泡倒计时管理 ---
watch(
  [() => agentStore.bubbleVisible, () => agentStore.currentBubble],
  ([visible, bubble]) => {
    stopDismissTimer()
    if (visible && bubble && bubble.autoDismissSec > 0) {
      startDismissTimer(bubble.autoDismissSec)
    }
  },
  { deep: true },
)

function startDismissTimer(seconds: number) {
  totalMs = seconds * 1000
  remainingMs = totalMs
  dismissProgressPercent.value = 100
  isTimerPaused = false

  const stepMs = 50
  dismissTimer = setInterval(() => {
    if (isTimerPaused) return
    remainingMs -= stepMs
    if (remainingMs <= 0) {
      stopDismissTimer()
      agentStore.dismissBubble()
    } else {
      dismissProgressPercent.value = Math.max(0, (remainingMs / totalMs) * 100)
    }
  }, stepMs)
}

function stopDismissTimer() {
  if (dismissTimer) {
    clearInterval(dismissTimer)
    dismissTimer = null
  }
}

function pauseDismissTimer() {
  isTimerPaused = true
}

function resumeDismissTimer() {
  isTimerPaused = false
}

// 导航到文章
function handleNavigateArticle(articleId?: number) {
  if (!articleId) return
  agentStore.dismissBubble()
  router.push(`/article/${articleId}`)
}

// 处理气泡上的操作按钮
function handleAction(action: AgentSuggestActionVO) {
  switch (action.actionCode) {
    case 'NAVIGATE_ARTICLE': {
      const articleId = action.payload?.articleId
      handleNavigateArticle(articleId)
      break
    }
    case 'OPEN_CHAT': {
      const contextToken = action.payload?.contextToken || agentStore.currentBubble?.contextToken
      agentStore.openChat(contextToken)
      break
    }
    case 'DISMISS_BUBBLE': {
      agentStore.dismissBubble()
      break
    }
    case 'MUTE_PET': {
      agentStore.setMuteToday()
      ElMessage.info('已开启今日静音，今日将不再主动弹窗打扰')
      break
    }
    case 'VIEW_PAGE': {
      const articleId = action.payload?.articleId
      if (articleId) {
        handleNavigateArticle(articleId)
      } else {
        router.push('/')
      }
      break
    }
    default:
      agentStore.dismissBubble()
  }
}

// 监听卦象/思考神态 (起卦时小桌宠好奇转身靠近观摩)
watch(
  () => agentStore.petMood,
  (newMood) => {
    if (newMood === 'THINKING' && !isDragging) {
      // 起卦时，面向中央并停步端详
      facingDirection.value = petX.value > window.innerWidth / 2 ? -1 : 1
      petState.value = 'sit'
    } else if (newMood === 'HAPPY' && !isDragging) {
      // 出吉卦时欢快小跳
      onPetDblClick()
    }
  },
)

onMounted(() => {
  petY.value = groundY.value
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('mousemove', onGlobalMouseMove, { passive: true })

  // 场景共鸣：监听风场微动
  unregisterWind = onWindGust((strength, dirX) => {
    windAngle.value = Math.max(-25, Math.min(25, dirX * strength * 20))
    setTimeout(() => {
      windAngle.value = 0
    }, 800)
  })

  // 启动自主漫步 AI
  scheduleNextRoam()
})

onUnmounted(() => {
  stopDismissTimer()
  stopWalking()
  stopFalling()
  clearTimeout(roamingTimer!)
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', onGlobalMouseMove)
  if (unregisterWind) unregisterWind()
})
</script>
