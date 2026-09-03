<template>
  <section class="aside-panel almanac-card text-gray-800 dark:text-gray-100">
    <!-- Date Header -->
    <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
      <div class="flex items-baseline gap-1.5">
        <span class="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{{ dayStr }}</span>
        <span class="text-xs text-gray-400">{{ monthAndYear }}</span>
      </div>
      <div class="text-right">
        <div class="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full inline-block">
          {{ weekday }}
        </div>
      </div>
    </div>

    <!-- Lunar Info -->
    <div class="text-center py-2 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl mb-4">
      <div class="text-sm font-bold text-gray-700 dark:text-gray-300">
        {{ lunarMonthAndDay }}
      </div>
      <div class="text-[10px] text-gray-400 mt-0.5">{{ lunarYear }} 传统黄历</div>
    </div>

    <!-- Yi / Ji (宜/忌) -->
    <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
      <!-- 宜 -->
      <div class="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl p-3">
        <div class="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
          <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-serif shadow-sm">宜</span>
          <span class="text-[10px] uppercase tracking-wider">Suitable</span>
        </div>
        <ul class="space-y-1 text-xs text-emerald-800/90 dark:text-emerald-300/90 font-medium">
          <li v-for="item in yiList" :key="item">• {{ item }}</li>
        </ul>
      </div>

      <!-- 忌 -->
      <div class="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 rounded-xl p-3">
        <div class="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 mb-1.5">
          <span class="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-serif shadow-sm">忌</span>
          <span class="text-[10px] uppercase tracking-wider">Avoid</span>
        </div>
        <ul class="space-y-1 text-xs text-rose-800/90 dark:text-rose-300/90 font-medium">
          <li v-for="item in jiList" :key="item">• {{ item }}</li>
        </ul>
      </div>
    </div>

    <!-- Poem Section -->
    <div class="border-t border-gray-100 dark:border-gray-800 pt-4 relative group">
      <div class="flex justify-between items-center mb-2">
        <span class="text-[10px] text-gray-400 font-medium uppercase tracking-widest">每日诗词</span>
        <button 
          @click="refreshPoem" 
          class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          :class="{ 'animate-spin': loadingPoem }"
          :disabled="loadingPoem"
          title="刷新诗词"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="text-center py-2 px-1">
        <template v-if="loadingPoem">
          <div class="text-xs text-gray-400 animate-pulse py-4">正在加载诗词...</div>
        </template>
        <template v-else>
          <p class="font-serif text-sm font-semibold text-gray-700 dark:text-gray-200 leading-relaxed tracking-wide">
            “{{ poem.content }}”
          </p>
          <p class="text-[11px] text-gray-400 mt-2 font-serif">
            —— {{ poem.author }} 《{{ poem.title }}》
          </p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Lunar } from 'lunar-javascript'

// 备份诗词池（网络请求失败时使用）
const FALLBACK_POEMS = [
  { content: "行到水穷处，坐看云起时。", author: "唐代 · 王维", title: "终南别业" },
  { content: "欲把西湖比西子，淡妆浓抹总相宜。", author: "宋代 · 苏轼", title: "饮湖上初晴后雨" },
  { content: "人生如逆旅，我亦是行人。", author: "宋代 · 苏轼", title: "临江仙·送钱穆父" },
  { content: "大鹏一日同风起，扶摇直上九万里。", author: "唐代 · 李白", title: "上李邕" },
  { content: "长风破浪会有时，直挂云帆济沧海。", author: "唐代 · 李白", title: "行路难" },
  { content: "星垂平野阔，月涌大江流。", author: "唐代 · 杜甫", title: "旅夜书怀" },
  { content: "采菊东篱下，悠然见南山。", author: "晋代 · 陶渊明", title: "饮酒·其五" },
  { content: "会当凌绝顶，一览众山小。", author: "唐代 · 杜甫", title: "望岳" },
  { content: "春蚕到死丝方尽，蜡炬成灰泪始干。", author: "唐代 · 李商隐", title: "无题" },
  { content: "海上生明月，天涯共此时。", author: "唐代 · 张九龄", title: "望月怀远" }
]

// 日期相关
const dayStr = ref('')
const monthAndYear = ref('')
const weekday = ref('')

// 农历与老黄历信息
const lunarYear = ref('')
const lunarMonthAndDay = ref('')
const yiList = ref<string[]>([])
const jiList = ref<string[]>([])

// 每日诗词数据
const poem = ref({ content: '', author: '', title: '' })
const loadingPoem = ref(false)

// 初始化日期和真实黄历数据
function initDateAndAlmanac() {
  const now = new Date()
  
  // 1. 公历数据设置
  const day = now.getDate()
  dayStr.value = day < 10 ? '0' + day : day.toString()
  
  const month = now.getMonth() + 1
  const monthStr = month < 10 ? '0' + month : month.toString()
  monthAndYear.value = `${now.getFullYear()}年${monthStr}月`
  
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  weekday.value = weekdays[now.getDay()]

  // 2. 调用 lunar-javascript 计算真实的中国传统黄历
  try {
    const l = Lunar.fromDate(now)
    
    // 干支纪年 + 生肖
    lunarYear.value = `${l.getYearInGanZhi()}年 (${l.getYearShengXiao()}年)`
    // 农历月日
    lunarMonthAndDay.value = `农历 ${l.getMonthInChinese()}月${l.getDayInChinese()}`
    
    // 获取当天的传统 宜/忌 列表，展示前 4 项以确保视觉舒适
    const yis = l.getDayYi()
    const jis = l.getDayJi()
    
    yiList.value = yis.length > 0 ? yis.slice(0, 4) : ['诸事吉庆']
    jiList.value = jis.length > 0 ? jis.slice(0, 4) : ['诸事无忌']
  } catch (e) {
    console.error('获取传统黄历数据失败', e)
    // 降级兜底数据
    lunarYear.value = '丙午年 (马年)'
    lunarMonthAndDay.value = '农历六月廿三'
    yiList.value = ['祭祀', '祈福', '求嗣', '开光']
    jiList.value = ['开仓', '掘井', '破土', '安葬']
  }
}

// 动态拉取今日诗词 (今日诗词 API)
async function loadDynamicPoem() {
  loadingPoem.value = true
  try {
    // 今日诗词 API 支持跨域且无需 Token 认证直接调用
    const res = await fetch('https://v2.jinrishici.com/one.json')
    const json = await res.json()
    if (json && json.status === 'success') {
      poem.value = {
        content: json.data.content,
        author: `${json.data.origin.dynasty} · ${json.data.origin.author}`,
        title: json.data.origin.title
      }
    } else {
      useFallbackPoem()
    }
  } catch (e) {
    console.warn('拉取今日古诗词接口失败，改用本地备份：', e)
    useFallbackPoem()
  } finally {
    loadingPoem.value = false
  }
}

// 诗词库本地备份降级
function useFallbackPoem() {
  const now = new Date()
  const seed = now.getFullYear() + now.getMonth() + now.getDate()
  const idx = seed % FALLBACK_POEMS.length
  poem.value = FALLBACK_POEMS[idx]
}

// 刷新诗词
function refreshPoem() {
  loadDynamicPoem()
}

onMounted(() => {
  initDateAndAlmanac()
  loadDynamicPoem()
})
</script>

<style scoped>
.almanac-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.almanac-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 48px rgba(23, 32, 51, 0.06);
}

.font-serif {
  font-family: Georgia, "Nimbus Roman No9 L", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "Source Han Serif CN", STSong, "AR PL New Sung", "AR PL SungtiL GB", serif;
}

/* 刷新图标旋转动效 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
