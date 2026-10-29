<template>
  <div class="fixed bottom-6 right-6 z-40 select-none">
    <!-- 气泡弹出卡片 -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="agentStore.bubbleVisible && agentStore.currentBubble"
        class="absolute bottom-16 right-0 mb-3 w-[330px] sm:w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all duration-300"
        :class="bubbleThemeClasses"
        @mouseenter="pauseDismissTimer"
        @mouseleave="resumeDismissTimer"
      >
        <!-- 气泡箭头 (指向小宠物) -->
        <div
          class="absolute -bottom-2 right-6 w-4 h-4 rotate-45 border-r border-b"
          :class="arrowThemeClasses"
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
              博客智能助手
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

    <!-- 浮动小宠物主体 (SVG 矢量灵动形象) -->
    <div class="relative group cursor-pointer" @click="handlePetClick">
      <!-- 今日静音提示小徽章 -->
      <div
        v-if="agentStore.isMuted"
        class="absolute -top-1 -right-1 z-10 px-1.5 py-0.2 bg-gray-600 text-white text-[9px] rounded-full border border-white dark:border-slate-800 shadow-sm"
      >
        静音
      </div>

      <!-- 悬浮光环发光层 -->
      <div
        class="absolute -inset-1.5 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        :class="glowClasses"
      ></div>

      <!-- 小宠物本体球形外壳 -->
      <div
        class="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 transform group-hover:scale-105 active:scale-95"
        :class="[shellClasses, agentStore.petMood === 'HAPPY' ? 'animate-bounce-subtle' : 'animate-float']"
      >
        <!-- 头部小天线 -->
        <div class="absolute -top-2 flex flex-col items-center">
          <div
            class="w-1.5 h-1.5 rounded-full animate-ping"
            :class="antennaBulbClasses"
          ></div>
          <div class="w-0.5 h-2 bg-gray-400 dark:bg-slate-600"></div>
        </div>

        <!-- 矢量表情面部 (根据 petMood 动态切换表情) -->
        <svg class="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <!-- 腮红 (开心或充沛时显现) -->
          <circle
            v-if="agentStore.petMood === 'HAPPY' || agentStore.petMood === 'ENERGETIC'"
            cx="8" cy="22" r="3" fill="#f43f5e" opacity="0.4"
          />
          <circle
            v-if="agentStore.petMood === 'HAPPY' || agentStore.petMood === 'ENERGETIC'"
            cx="32" cy="22" r="3" fill="#f43f5e" opacity="0.4"
          />

          <!-- 眼睛渲染根据状态机分支 -->
          <!-- 1. 静音睡眠态 -->
          <template v-if="agentStore.isMuted">
            <path d="M 10 18 Q 14 22 18 18" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" fill="none" />
            <path d="M 22 18 Q 26 22 30 18" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" fill="none" />
            <path d="M 17 26 Q 20 28 23 26" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" fill="none" />
          </template>

          <!-- 2. 开心表情 HAPPY -->
          <template v-else-if="agentStore.petMood === 'HAPPY'">
            <path d="M 10 19 Q 15 13 20 19" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M 20 19 Q 25 13 30 19" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M 15 24 Q 20 29 25 24" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" fill="#93c5fd" />
          </template>

          <!-- 3. 思考求索表情 THINKING -->
          <template v-else-if="agentStore.petMood === 'THINKING'">
            <!-- 左眼转为思考圆圈，右眼斜视 -->
            <circle cx="14" cy="18" r="3.5" fill="#7c3aed" />
            <circle cx="15.5" cy="16.5" r="1.2" fill="#ffffff" />
            <path d="M 23 15 L 29 17" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="26" cy="20" r="2.5" fill="#7c3aed" />
            <circle cx="27" cy="19" r="0.8" fill="#ffffff" />
            <!-- 嘴部微嘟 -->
            <ellipse cx="20" cy="25" rx="2" ry="1.5" fill="#8b5cf6" />
          </template>

          <!-- 4. 充沛活力表情 ENERGETIC -->
          <template v-else-if="agentStore.petMood === 'ENERGETIC'">
            <!-- 闪亮星星眼 -->
            <polygon points="14,13 15,16 18,17 15,18 14,21 13,18 10,17 13,16" fill="#0284c7" />
            <polygon points="26,13 27,16 30,17 27,18 26,21 25,18 22,17 25,16" fill="#0284c7" />
            <path d="M 15 25 Q 20 29 25 25" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" fill="#38bdf8" />
          </template>

          <!-- 5. 导引阅读表情 GUIDE -->
          <template v-else-if="agentStore.petMood === 'GUIDE'">
            <circle cx="14" cy="18" r="3.2" fill="#0d9488" />
            <circle cx="15" cy="17" r="1.2" fill="#ffffff" />
            <circle cx="26" cy="18" r="3.2" fill="#0d9488" />
            <circle cx="27" cy="17" r="1.2" fill="#ffffff" />
            <path d="M 16 25 Q 20 27 24 25" stroke="#0d9488" stroke-width="2" stroke-linecap="round" fill="none" />
          </template>

          <!-- 6. 默认闲置表情 IDLE -->
          <template v-else>
            <!-- 灵动大眼睛，配微眨光斑 -->
            <circle cx="14" cy="18" r="3.5" fill="#2563eb" class="dark:fill-blue-400" />
            <circle cx="15.5" cy="16.5" r="1.2" fill="#ffffff" />
            <circle cx="26" cy="18" r="3.5" fill="#2563eb" class="dark:fill-blue-400" />
            <circle cx="27.5" cy="16.5" r="1.2" fill="#ffffff" />
            <path d="M 17 24 Q 20 26 23 24" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" fill="none" class="dark:stroke-blue-400" />
          </template>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAgentStore } from '../../store/agent'
import type { AgentSuggestActionVO } from '../../api/agent'

const router = useRouter()
const agentStore = useAgentStore()

// 倒计时管理
const dismissProgressPercent = ref(100)
let dismissTimer: ReturnType<typeof setInterval> | null = null
let remainingMs = 0
let totalMs = 0
let isPaused = false

// 监听气泡弹出，启动倒计时
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
  isPaused = false

  const stepMs = 50
  dismissTimer = setInterval(() => {
    if (isPaused) return
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
  isPaused = true
}

function resumeDismissTimer() {
  isPaused = false
}

onUnmounted(() => {
  stopDismissTimer()
})

// 样式与主题类计算
const bubbleThemeClasses = computed(() => {
  return 'bg-white/95 dark:bg-slate-900/95 border-gray-200/90 dark:border-slate-700/80'
})

const arrowThemeClasses = computed(() => {
  return 'bg-white dark:bg-slate-900 border-gray-200/90 dark:border-slate-700/80'
})

const shellClasses = computed(() => {
  if (agentStore.isMuted) {
    return 'bg-gray-100 dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-700 text-gray-500'
  }
  return 'bg-white/95 dark:bg-slate-900/95 border-2 border-blue-500/30 dark:border-blue-400/30'
})

const glowClasses = computed(() => {
  if (agentStore.isMuted) return 'bg-gray-400/20'
  switch (agentStore.petMood) {
    case 'HAPPY':
      return 'bg-amber-400/40 dark:bg-amber-500/30'
    case 'THINKING':
      return 'bg-purple-500/40 dark:bg-purple-600/30'
    case 'ENERGETIC':
      return 'bg-sky-400/50 dark:bg-sky-500/40'
    case 'GUIDE':
      return 'bg-teal-400/40 dark:bg-teal-500/30'
    default:
      return 'bg-blue-400/30 dark:bg-blue-500/25'
  }
})

const antennaBulbClasses = computed(() => {
  if (agentStore.isMuted) return 'bg-gray-400'
  switch (agentStore.petMood) {
    case 'HAPPY':
      return 'bg-amber-400'
    case 'THINKING':
      return 'bg-purple-500'
    case 'ENERGETIC':
      return 'bg-sky-400'
    case 'GUIDE':
      return 'bg-teal-400'
    default:
      return 'bg-blue-500'
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
      return '随身书童'
  }
})

// 纯文本按钮样式匹配
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

// 点击小宠物本体处理
function handlePetClick() {
  if (agentStore.isMuted) {
    agentStore.unmutePet()
    ElMessage.success('已恢复小宠物提示')
    return
  }
  if (agentStore.bubbleVisible) {
    agentStore.openChat(agentStore.currentBubble?.contextToken)
  } else {
    agentStore.openChat()
  }
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
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes bounceSubtle {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.04);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-bounce-subtle {
  animation: bounceSubtle 1.8s ease-in-out infinite;
}
</style>
