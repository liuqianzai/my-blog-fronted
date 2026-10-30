<template>
  <div
    class="pet-character relative select-none pointer-events-none transition-transform duration-150"
    :style="{
      transform: `scaleX(${facing}) rotate(${bodyTilt}deg)`,
      transformOrigin: 'center bottom',
    }"
  >
    <!-- 抚摸爱心动效 -->
    <transition name="heart-float">
      <div
        v-if="isPetting"
        class="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-500 font-bold text-sm pointer-events-none flex items-center justify-center animate-bounce"
      >
        <svg class="w-5 h-5 fill-rose-500" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    </transition>

    <!-- 睡眠打盹冒气泡 (zZ) -->
    <div
      v-if="state === 'nap' || isMuted"
      class="absolute -top-7 -right-2 flex flex-col items-center pointer-events-none"
    >
      <span class="text-[11px] font-bold text-blue-400 dark:text-blue-300 animate-zzz-1">z</span>
      <span class="text-[9px] font-bold text-blue-300 dark:text-blue-400 animate-zzz-2">Z</span>
    </div>

    <!-- 底部柔和接触阴影 (悬空时变淡缩小，着地时变大) -->
    <div
      class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/15 dark:bg-black/30 blur-[2px] transition-all duration-200"
      :style="{
        width: shadowWidth,
        height: '8px',
        opacity: shadowOpacity,
      }"
    ></div>

    <!-- 主体 SVG 灵狐桌宠 -->
    <svg
      class="w-20 h-20 overflow-visible"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- 灵狐毛茸身体渐变 -->
        <linearGradient id="foxBodyGrad" x1="50" y1="20" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="65%" stop-color="#F8FAFC" />
          <stop offset="100%" stop-color="#E2E8F0" />
        </linearGradient>

        <!-- 耳朵内衬粉嫩渐变 -->
        <linearGradient id="foxEarInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDA4AF" />
          <stop offset="100%" stop-color="#F43F5E" />
        </linearGradient>

        <!-- 尾巴末梢青灵/碧蓝渐变 -->
        <linearGradient id="foxTailGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="55%" stop-color="#E0F2FE" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>

        <!-- 额间仙玉发光高亮 -->
        <filter id="gemGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- 1. 蓬松飘逸大尾巴 (位于身躯后层) -->
      <g
        class="tail-group"
        :class="{
          'animate-tail-wag': state === 'walk' || state === 'idle',
          'animate-tail-excited': mood === 'HAPPY' || mood === 'ENERGETIC',
          'animate-tail-droop': state === 'nap' || isMuted || state === 'dragging',
        }"
        :style="{ transform: `rotate(${windAngle * 0.4}deg)`, transformOrigin: '28px 75px' }"
      >
        <path
          d="M 28 75 C 15 75 2 62 6 44 C 9 30 22 24 28 32 C 34 38 32 58 28 75 Z"
          fill="url(#foxTailGrad)"
          stroke="#CBD5E1"
          stroke-width="1.2"
        />
        <!-- 尾尖灵气微纹 -->
        <path
          d="M 10 40 Q 18 36 24 38"
          stroke="#38BDF8"
          stroke-width="1.5"
          stroke-linecap="round"
          opacity="0.8"
        />
      </g>

      <!-- 2. 后肢脚掌 (在身体后侧) -->
      <ellipse
        cx="38"
        :cy="backPawY"
        rx="6"
        ry="4"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        stroke-width="1"
        :class="{ 'animate-paw-step-left': state === 'walk', 'animate-paw-dangle': state === 'dragging' }"
      />
      <ellipse
        cx="62"
        :cy="backPawY"
        rx="6"
        ry="4"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        stroke-width="1"
        :class="{ 'animate-paw-step-right': state === 'walk', 'animate-paw-dangle': state === 'dragging' }"
      />

      <!-- 3. 灵狐圆润身躯 (Q弹奶白) -->
      <g :class="{ 'animate-body-bob': state === 'walk', 'animate-body-breathe': state === 'idle' || state === 'sit' }">
        <ellipse
          cx="50"
          cy="64"
          rx="25"
          ry="22"
          fill="url(#foxBodyGrad)"
          stroke="#CBD5E1"
          stroke-width="1.2"
          class="dark:stroke-slate-600"
        />
        <!-- 肚皮柔软小软毛弧线 -->
        <path
          d="M 44 68 Q 50 72 56 68"
          stroke="#E2E8F0"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </g>

      <!-- 4. 双耳 (具有微风倾斜与抖动) -->
      <!-- 左耳 -->
      <g
        class="ear-left"
        :class="{ 'animate-ear-twitch': state === 'idle' || state === 'sit' }"
        :style="{ transform: `rotate(${-8 + windAngle * 0.5}deg)`, transformOrigin: '32px 34px' }"
      >
        <path
          d="M 32 34 L 18 10 C 26 12 38 18 40 30 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          stroke-width="1.2"
        />
        <!-- 左耳内粉 -->
        <path
          d="M 30 30 L 22 14 C 27 16 35 22 36 28 Z"
          fill="url(#foxEarInner)"
          opacity="0.85"
        />
      </g>

      <!-- 右耳 -->
      <g
        class="ear-right"
        :class="{ 'animate-ear-twitch-delayed': state === 'idle' || state === 'sit' }"
        :style="{ transform: `rotate(${8 + windAngle * 0.5}deg)`, transformOrigin: '68px 34px' }"
      >
        <path
          d="M 68 34 L 82 10 C 74 12 62 18 60 30 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          stroke-width="1.2"
        />
        <!-- 右耳内粉 -->
        <path
          d="M 70 30 L 78 14 C 73 16 65 22 64 28 Z"
          fill="url(#foxEarInner)"
          opacity="0.85"
        />
      </g>

      <!-- 5. 灵狐大脑袋 (圆润软萌) -->
      <g :class="{ 'animate-head-bob': state === 'walk', 'animate-head-tilt': mood === 'THINKING' }">
        <circle
          cx="50"
          cy="42"
          r="24"
          fill="url(#foxBodyGrad)"
          stroke="#CBD5E1"
          stroke-width="1.2"
          class="dark:stroke-slate-600"
        />

        <!-- 额头仙印仙玉 (灵力光芒呼应心情状态) -->
        <g filter="url(#gemGlow)">
          <path
            d="M 50 25 L 53 30 L 50 35 L 47 30 Z"
            :fill="gemColor"
          />
        </g>

        <!-- 腮红 (开心/被抚摸/活跃时显现) -->
        <ellipse
          v-if="mood === 'HAPPY' || mood === 'ENERGETIC' || isPetting"
          cx="33"
          cy="48"
          rx="5"
          ry="3"
          fill="#FB7185"
          opacity="0.6"
        />
        <ellipse
          v-if="mood === 'HAPPY' || mood === 'ENERGETIC' || isPetting"
          cx="67"
          cy="48"
          rx="5"
          ry="3"
          fill="#FB7185"
          opacity="0.6"
        />

        <!-- 眼睛渲染根据动作与状态分流 -->
        <!-- 1. 拖拽悬空挣扎惊慌眼 (> <) -->
        <template v-if="state === 'dragging'">
          <path d="M 33 40 L 40 44 L 33 48" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M 67 40 L 60 44 L 67 48" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </template>

        <!-- 2. 打盹 / 今日静音 (眯眼入睡 - -) -->
        <template v-else-if="state === 'nap' || isMuted">
          <path d="M 33 44 Q 39 48 43 44" stroke="#475569" stroke-width="2.2" stroke-linecap="round" fill="none" />
          <path d="M 57 44 Q 61 48 67 44" stroke="#475569" stroke-width="2.2" stroke-linecap="round" fill="none" />
        </template>

        <!-- 3. 开心 / 抚摸 (月牙笑眼 ^ ^) -->
        <template v-else-if="mood === 'HAPPY' || isPetting">
          <path d="M 33 45 Q 39 37 44 45" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" fill="none" class="dark:stroke-white" />
          <path d="M 56 45 Q 61 37 67 45" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" fill="none" class="dark:stroke-white" />
        </template>

        <!-- 4. 思考神态 (一只眨眼斜视，灵动探求) -->
        <template v-else-if="mood === 'THINKING'">
          <ellipse cx="38" cy="43" rx="4" ry="4.5" fill="#1E293B" class="dark:fill-slate-100" />
          <circle cx="39.5" cy="41.5" r="1.5" fill="#FFFFFF" />
          <!-- 另一只微挑眉眯眼 -->
          <path d="M 58 41 Q 63 38 67 42" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" fill="none" class="dark:stroke-slate-100" />
        </template>

        <!-- 5. 常态灵动大眼 (带视线轻微跟随与眨眼) -->
        <template v-else>
          <!-- 左眼 -->
          <g :class="{ 'animate-eye-blink': state === 'idle' || state === 'walk' }">
            <ellipse
              :cx="38 + lookOffset.x"
              :cy="43 + lookOffset.y"
              rx="4"
              ry="4.8"
              fill="#0F172A"
              class="dark:fill-slate-100"
            />
            <!-- 高光点 -->
            <circle :cx="39.5 + lookOffset.x" :cy="41 + lookOffset.y" r="1.6" fill="#FFFFFF" />
            <circle :cx="36.5 + lookOffset.x" :cy="45 + lookOffset.y" r="0.8" fill="#FFFFFF" />
          </g>
          <!-- 右眼 -->
          <g :class="{ 'animate-eye-blink': state === 'idle' || state === 'walk' }">
            <ellipse
              :cx="62 + lookOffset.x"
              :cy="43 + lookOffset.y"
              rx="4"
              ry="4.8"
              fill="#0F172A"
              class="dark:fill-slate-100"
            />
            <!-- 高光点 -->
            <circle :cx="63.5 + lookOffset.x" :cy="41 + lookOffset.y" r="1.6" fill="#FFFFFF" />
            <circle :cx="60.5 + lookOffset.x" :cy="45 + lookOffset.y" r="0.8" fill="#FFFFFF" />
          </g>
        </template>

        <!-- 鼻子 (小巧黑鼻尖) -->
        <ellipse cx="50" cy="48" rx="2" ry="1.2" fill="#334155" />

        <!-- 嘴巴 (小猫嘴 ω 或被抓惊慌小圆嘴 o) -->
        <template v-if="state === 'dragging'">
          <ellipse cx="50" cy="53" rx="2.5" ry="3" fill="#F43F5E" />
        </template>
        <template v-else-if="mood === 'HAPPY' || isPetting">
          <path d="M 45 50 Q 50 56 55 50" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" fill="#FDA4AF" class="dark:stroke-white" />
        </template>
        <template v-else>
          <!-- 精巧小 ω 嘴 -->
          <path d="M 46 50 Q 48 53 50 50 Q 52 53 54 50" stroke="#475569" stroke-width="1.4" stroke-linecap="round" fill="none" />
        </template>
      </g>

      <!-- 6. 前肢小短肉垫 (迈步时交替轻摆) -->
      <g :class="{ 'animate-front-paw-left': state === 'walk', 'animate-paw-dangle': state === 'dragging' }">
        <ellipse cx="43" :cy="frontPawY" rx="5" ry="3.5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
      </g>
      <g :class="{ 'animate-front-paw-right': state === 'walk', 'animate-paw-dangle': state === 'dragging' }">
        <ellipse cx="57" :cy="frontPawY" rx="5" ry="3.5" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    state?: 'idle' | 'walk' | 'sit' | 'nap' | 'jump' | 'dragging' | 'falling'
    mood?: 'IDLE' | 'HAPPY' | 'THINKING' | 'ENERGETIC' | 'GUIDE'
    facing?: 1 | -1
    isMuted?: boolean
    windAngle?: number
    lookOffset?: { x: number; y: number }
    isPetting?: boolean
  }>(),
  {
    state: 'idle',
    mood: 'IDLE',
    facing: 1,
    isMuted: false,
    windAngle: 0,
    lookOffset: () => ({ x: 0, y: 0 }),
    isPetting: false,
  },
)

// 身体水平微倾角 (移动/被抓时动态调整)
const bodyTilt = computed(() => {
  if (props.state === 'dragging') return -10 * props.facing
  if (props.state === 'walk') return 3 * props.facing
  if (props.state === 'jump') return -5 * props.facing
  return 0
})

// 额间仙玉发光颜色
const gemColor = computed(() => {
  if (props.isMuted) return '#94A3B8'
  switch (props.mood) {
    case 'HAPPY':
      return '#F59E0B' // 金色
    case 'THINKING':
      return '#A855F7' // 紫灵
    case 'ENERGETIC':
      return '#06B6D4' // 苍碧
    case 'GUIDE':
      return '#10B981' // 翡翠
    default:
      return '#38BDF8' // 晴空蓝
  }
})

// 爪子位置计算 (坐姿或被抓时微调)
const frontPawY = computed(() => {
  if (props.state === 'sit' || props.state === 'nap') return 78
  if (props.state === 'dragging') return 84
  return 80
})

const backPawY = computed(() => {
  if (props.state === 'sit' || props.state === 'nap') return 80
  if (props.state === 'dragging') return 88
  return 82
})

// 阴影宽度与不透明度 (悬空时淡化缩小)
const shadowWidth = computed(() => {
  if (props.state === 'dragging' || props.state === 'falling') return '24px'
  if (props.state === 'jump') return '30px'
  if (props.state === 'sit' || props.state === 'nap') return '56px'
  return '46px'
})

const shadowOpacity = computed(() => {
  if (props.state === 'dragging' || props.state === 'falling') return 0.2
  return 0.8
})
</script>

<style scoped>
/* 尾巴轻柔摆动 */
@keyframes tailWag {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-14deg);
  }
}

/* 开心时快速摇尾巴 */
@keyframes tailExcited {
  0%, 100% {
    transform: rotate(4deg);
  }
  50% {
    transform: rotate(-24deg);
  }
}

/* 垂尾状态 */
@keyframes tailDroop {
  0%, 100% {
    transform: rotate(18deg);
  }
  50% {
    transform: rotate(12deg);
  }
}

.animate-tail-wag {
  animation: tailWag 2.4s ease-in-out infinite;
}

.animate-tail-excited {
  animation: tailExcited 0.8s ease-in-out infinite;
}

.animate-tail-droop {
  animation: tailDroop 3s ease-in-out infinite;
}

/* 耳朵轻抖 */
@keyframes earTwitch {
  0%, 90%, 100% {
    transform: rotate(-8deg);
  }
  93% {
    transform: rotate(-18deg);
  }
  96% {
    transform: rotate(-5deg);
  }
}

@keyframes earTwitchDelayed {
  0%, 85%, 100% {
    transform: rotate(8deg);
  }
  88% {
    transform: rotate(18deg);
  }
  92% {
    transform: rotate(5deg);
  }
}

.animate-ear-twitch {
  animation: earTwitch 4s ease-in-out infinite;
}

.animate-ear-twitch-delayed {
  animation: earTwitchDelayed 4.5s ease-in-out infinite;
}

/* 身体轻柔呼吸与步态起伏 */
@keyframes bodyBreathe {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.02, 0.98) translateY(0.5px);
  }
}

@keyframes bodyBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

.animate-body-breathe {
  animation: bodyBreathe 3s ease-in-out infinite;
}

.animate-body-bob {
  animation: bodyBob 0.35s ease-in-out infinite;
}

.animate-head-bob {
  animation: bodyBob 0.35s ease-in-out infinite;
}

/* 思考歪头 */
.animate-head-tilt {
  transform: rotate(10deg);
  transform-origin: 50px 50px;
}

/* 自然眨眼 */
@keyframes eyeBlink {
  0%, 94%, 100% {
    transform: scaleY(1);
  }
  96% {
    transform: scaleY(0.1);
  }
  98% {
    transform: scaleY(1);
  }
}

.animate-eye-blink {
  animation: eyeBlink 4s ease-in-out infinite;
  transform-origin: 50px 43px;
}

/* 迈步碎步动画 */
@keyframes pawStepLeft {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(4px) translateY(-3px);
  }
}

@keyframes pawStepRight {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(-4px) translateY(-3px);
  }
}

.animate-paw-step-left {
  animation: pawStepLeft 0.35s ease-in-out infinite;
}

.animate-paw-step-right {
  animation: pawStepRight 0.35s ease-in-out infinite 0.175s;
}

/* 被拎起时悬空爪子扑腾 */
@keyframes pawDangle {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(3px) rotate(8deg);
  }
}

.animate-paw-dangle {
  animation: pawDangle 0.5s ease-in-out infinite alternate;
}

/* 睡眠冒泡动画 */
@keyframes zzz1 {
  0% {
    opacity: 0;
    transform: translate(0, 4px) scale(0.6);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(6px, -12px) scale(1.1);
  }
}

@keyframes zzz2 {
  0% {
    opacity: 0;
    transform: translate(0, 4px) scale(0.5);
  }
  50% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(10px, -18px) scale(1.2);
  }
}

.animate-zzz-1 {
  animation: zzz1 2.2s ease-out infinite;
}

.animate-zzz-2 {
  animation: zzz2 2.2s ease-out infinite 0.7s;
}

/* 爱心漂浮渐隐 */
.heart-float-enter-active {
  transition: all 0.4s ease-out;
}
.heart-float-leave-active {
  transition: all 0.6s ease-in;
}
.heart-float-enter-from {
  opacity: 0;
  transform: translate(-50%, 10px) scale(0.5);
}
.heart-float-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(1.3);
}
</style>
