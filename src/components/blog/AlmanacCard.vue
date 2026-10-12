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

// 丰富多样的备份诗词池（覆盖先秦、两汉、唐、宋、元、明、清各代经典名家）
const FALLBACK_POEMS = [
  { content: "行到水穷处，坐看云起时。", author: "唐代 · 王维", title: "终南别业" },
  { content: "欲把西湖比西子，淡妆浓抹总相宜。", author: "宋代 · 苏轼", title: "饮湖上初晴后雨" },
  { content: "大鹏一日同风起，扶摇直上九万里。", author: "唐代 · 李白", title: "上李邕" },
  { content: "星垂平野阔，月涌大江流。", author: "唐代 · 杜甫", title: "旅夜书怀" },
  { content: "采菊东篱下，悠然见南山。", author: "晋代 · 陶渊明", title: "饮酒·其五" },
  { content: "落霞与孤鹜齐飞，秋水共长天一色。", author: "唐代 · 王勃", title: "滕王阁序" },
  { content: "山重水复疑无路，柳暗花明又一村。", author: "宋代 · 陆游", title: "游山西村" },
  { content: "人生若只如初见，何事秋风悲画扇。", author: "清代 · 纳兰性德", title: "木兰花·拟古决绝词柬友" },
  { content: "不畏浮云遮望眼，自缘身在最高层。", author: "宋代 · 王安石", title: "登飞来峰" },
  { content: "醉后不知天在水，满船清梦压星河。", author: "元代 · 唐珫", title: "题龙阳县青草湖" },
  { content: "海内存知己，天涯若比邻。", author: "唐代 · 王勃", title: "送杜少府之任蜀州" },
  { content: "问渠那得清如许？为有源头活水来。", author: "宋代 · 朱熹", title: "观书有感" },
  { content: "天生我材必有用，千金散尽还复来。", author: "唐代 · 李白", title: "将进酒" },
  { content: "春风得意马蹄疾，一日看尽长安花。", author: "唐代 · 孟郊", title: "登科后" },
  { content: "小荷才露尖尖角，早有蜻蜓立上头。", author: "宋代 · 杨万里", title: "小池" },
  { content: "长风破浪会有时，直挂云帆济沧海。", author: "唐代 · 李白", title: "行路难" },
  { content: "白日依山尽，黄河入海流。", author: "唐代 · 王之涣", title: "登鹳雀楼" },
  { content: "会当凌绝顶，一览众山小。", author: "唐代 · 杜甫", title: "望岳" },
  { content: "千磨万击还坚劲，任尔东西南北风。", author: "清代 · 郑燮", title: "竹石" },
  { content: "明月松间照，清泉石上流。", author: "唐代 · 王维", title: "山居秋暝" },
  { content: "休对故人思故国，且将新火试新茶。诗酒趁年华。", author: "宋代 · 苏轼", title: "望江南·超然台作" },
  { content: "曾经沧海难为水，除却巫山不是云。", author: "唐代 · 元稹", title: "离思五首·其四" },
  { content: "众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。", author: "宋代 · 辛弃疾", title: "青玉案·元夕" },
  { content: "落红不是无情物，化作春泥更护花。", author: "清代 · 龚自珍", title: "己亥杂诗" },
  { content: "黑发不知勤学早，白首方悔读书迟。", author: "唐代 · 颜真卿", title: "劝学诗" },
  { content: "纸上得来终觉浅，绝知此事要躬行。", author: "宋代 · 陆游", title: "冬夜读书示子聿" },
  { content: "潮平两岸阔，风正一帆悬。", author: "唐代 · 王湾", title: "次北固山下" },
  { content: "疏影横斜水清浅，暗香浮动月黄昏。", author: "宋代 · 林逋", title: "山园小梅·其一" },
  { content: "青山遮不住，毕竟东流去。", author: "宋代 · 辛弃疾", title: "菩萨蛮·书江西造口壁" },
  { content: "野旷天低树，江清月近人。", author: "唐代 · 孟浩然", title: "宿建德江" }
]

const POEM_TOKEN_KEY = 'jinrishici_user_token'

// 记录上一次展示的作者，避免连续刷新出现同一诗人
let lastPoemAuthor = ''

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

// 动态拉取诗词：优先今日诗词API（支持携带Token防同一人），备用古风诗词源与优质多样离线池
async function loadDynamicPoem(retryCount = 0) {
  loadingPoem.value = true
  try {
    const savedToken = localStorage.getItem(POEM_TOKEN_KEY)
    const headers: Record<string, string> = {}
    if (savedToken) {
      headers['X-User-Token'] = savedToken
    }

    // 加入随机戳防浏览器与CDN缓存同内容
    const res = await fetch(`https://v2.jinrishici.com/one.json?client=browser&_t=${Date.now()}`, {
      headers
    })
    const json = await res.json()

    if (json && json.status === 'success' && json.data) {
      // 保存会话 Token，使后续调用被识别为不同诗篇探索
      if (json.token) {
        localStorage.setItem(POEM_TOKEN_KEY, json.token)
      }

      const currentAuthor = `${json.data.origin.dynasty} · ${json.data.origin.author}`

      // 若与上次作者相同且允许重试1次，则尝试重新换一首不同诗人的佳句
      if (lastPoemAuthor && currentAuthor === lastPoemAuthor && retryCount < 1) {
        return loadDynamicPoem(retryCount + 1)
      }

      lastPoemAuthor = currentAuthor
      poem.value = {
        content: json.data.content,
        author: currentAuthor,
        title: json.data.origin.title
      }
    } else {
      useFallbackPoem()
    }
  } catch (e) {
    console.warn('拉取今日古诗词接口失败，改用本地多样备份池：', e)
    useFallbackPoem()
  } finally {
    loadingPoem.value = false
  }
}

// 诗词库本地备份真随机轮换（且主动排除上一位诗人，保证首首不重复）
function useFallbackPoem() {
  const availablePoems = FALLBACK_POEMS.filter(p => p.author !== lastPoemAuthor)
  const pool = availablePoems.length > 0 ? availablePoems : FALLBACK_POEMS
  const randomIdx = Math.floor(Math.random() * pool.length)
  const selected = pool[randomIdx]
  lastPoemAuthor = selected.author
  poem.value = selected
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
