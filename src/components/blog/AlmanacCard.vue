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
        {{ lunarYear }} · {{ lunarMonthAndDay }}
      </div>
      <div class="text-[10px] text-gray-400 mt-0.5">丙午马年 传统黄历</div>
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
          title="刷新诗词"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="text-center py-2 px-1">
        <p class="font-serif text-sm font-semibold text-gray-700 dark:text-gray-200 leading-relaxed tracking-wide">
          “{{ poem.content }}”
        </p>
        <p class="text-[11px] text-gray-400 mt-2 font-serif">
          —— {{ poem.author }} 《{{ poem.title }}》
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 候选诗词池
const POEMS = [
  { content: "行到水穷处，坐看云起时。", author: "王维", title: "终南别业" },
  { content: "欲把西湖比西子，淡妆浓抹总相宜。", author: "苏轼", title: "饮湖上初晴后雨" },
  { content: "人生如逆旅，我亦是行人。", author: "苏轼", title: "临江仙·送钱穆父" },
  { content: "大鹏一日同风起，扶摇直上九万里。", author: "李白", title: "上李邕" },
  { content: "长风破浪会有时，直挂云帆济沧海。", author: "李白", title: "行路难" },
  { content: "星垂平野阔，月涌大江流。", author: "杜甫", title: "旅夜书怀" },
  { content: "采菊东篱下，悠然见南山。", author: "陶渊明", title: "饮酒·其五" },
  { content: "会当凌绝顶，一览众山小。", author: "杜甫", title: "望岳" },
  { content: "春蚕到死丝方尽，蜡炬成灰泪始干。", author: "李商隐", title: "无题" },
  { content: "海上生明月，天涯共此时。", author: "张九龄", title: "望月怀远" },
  { content: "明月松间照，清泉石上流。", author: "王维", title: "山居秋暝" },
  { content: "落红不是无情物，化作春泥更护花。", author: "龚自珍", title: "己亥杂诗" },
  { content: "莫听穿林打叶声，何妨吟啸且徐行。", author: "苏轼", title: "定风波" },
  { content: "回首向来萧瑟处，归去，也无风雨也无晴。", author: "苏轼", title: "定风波" },
  { content: "山重水复疑无路，柳暗花明又一村。", author: "陆游", title: "游山西村" },
  { content: "落霞与孤鹜齐飞，秋水共长天一色。", author: "王勃", title: "滕王阁序" },
  { content: "两情若是久长时，又岂在朝朝暮暮。", author: "秦观", title: "鹊桥仙" },
  { content: "沉舟侧畔千帆过，病树前头万木春。", author: "刘禹锡", title: "酬乐天扬州初逢席上见赠" },
  { content: "东边日出西边雨，道是无晴却有晴。", author: "刘禹锡", title: "竹枝词" }
]

// 程序员/学生定制宜忌池
const YI_POOL = [
  "重构老旧代码",
  "阅读 3DGS 论文",
  "提交 Git Commit",
  "准时下班回家",
  "喝杯香浓咖啡",
  "学习新的框架",
  "解答同事提问",
  "编写单元测试",
  "摸鱼放松心情",
  "整理办公桌面",
  "户外散步运动",
  "享受美味午餐"
]

const JI_POOL = [
  "线上直接部署",
  "盲目升级 Node",
  "熬夜编写代码",
  "会议超过两小时",
  "强行合并分支",
  "在电脑前吃零食",
  "忽略编译警告",
  "拖延代码提交",
  "开过多的网页",
  "盲目修改配置",
  "钻牛角尖Debug",
  "忘记喝水运动"
]

// 日期相关
const dayStr = ref('')
const monthAndYear = ref('')
const weekday = ref('')

// 农历相关
const lunarYear = ref('')
const lunarMonthAndDay = ref('')

// 宜忌列表
const yiList = ref<string[]>([])
const jiList = ref<string[]>([])

// 诗词
const poem = ref({ content: '', author: '', title: '' })

// 转换农历日期数字为中文
function getLunarDayName(dayNum: number): string {
  const cnDays = [
    "", "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
  ]
  return cnDays[dayNum] || dayNum.toString()
}

// 格式化当前日期和黄历
function initDateAndAlmanac() {
  const now = new Date()
  
  // 1. 公历设置
  const day = now.getDate()
  dayStr.value = day < 10 ? '0' + day : day.toString()
  
  const month = now.getMonth() + 1
  const monthStr = month < 10 ? '0' + month : month.toString()
  monthAndYear.value = `${now.getFullYear()}年${monthStr}月`
  
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  weekday.value = weekdays[now.getDay()]

  // 2. 农历设置 (使用内置 Intl 接口)
  try {
    const formatted = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(now)

    const match = formatted.match(/(\d+)?([\u4e00-\u9fa5]+年)([\u4e00-\u9fa5]+月)(\d+)/)
    if (match) {
      lunarYear.value = match[2] // 比如 丙午年
      const monthPart = match[3] // 比如 六月
      const dayNum = parseInt(match[4], 10)
      lunarMonthAndDay.value = `农历 ${monthPart}${getLunarDayName(dayNum)}`
    } else {
      lunarYear.value = '丙午年'
      lunarMonthAndDay.value = '农历六月廿三'
    }
  } catch (e) {
    lunarYear.value = '丙午年'
    lunarMonthAndDay.value = '农历六月廿三'
  }

  // 3. 确定性宜忌计算 (确保每天根据日期固定，不随刷新改变)
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const seed = (y * 367) + (m * 31) + d

  const yi1 = seed % YI_POOL.length
  const yi2 = (seed + 3) % YI_POOL.length
  const finalYi = [YI_POOL[yi1]]
  if (yi1 !== yi2) finalYi.push(YI_POOL[yi2])
  else finalYi.push(YI_POOL[(yi1 + 1) % YI_POOL.length])
  yiList.value = finalYi

  const ji1 = (seed * 2 + 1) % JI_POOL.length
  const ji2 = (seed * 2 + 5) % JI_POOL.length
  const finalJi = [JI_POOL[ji1]]
  if (ji1 !== ji2) finalJi.push(JI_POOL[ji2])
  else finalJi.push(JI_POOL[(ji1 + 1) % JI_POOL.length])
  jiList.value = finalJi

  // 4. 确定性诗词初始化
  const poemSeed = y + m + d
  const poemIdx = poemSeed % POEMS.length
  poem.value = POEMS[poemIdx]
}

// 刷新诗词按钮
function refreshPoem() {
  const currentContent = poem.value.content
  let nextPoem = poem.value
  while (nextPoem.content === currentContent) {
    const randomIdx = Math.floor(Math.random() * POEMS.length)
    nextPoem = POEMS[randomIdx]
  }
  poem.value = nextPoem
}

onMounted(() => {
  initDateAndAlmanac()
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
</style>
