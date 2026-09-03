<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-extrabold text-text-main mb-8">归档</h1>
    
    <div class="space-y-4">
      <div 
        v-for="arc in archives" 
        :key="arc.month" 
        @click="showMonthArticles(arc.month)"
        class="flex items-center gap-4 hover:bg-gray-50/80 p-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-gray-100/80 hover:shadow-sm"
      >
        <span class="text-sm font-mono text-primary w-24 font-bold">{{ arc.month }}</span>
        <div class="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-500" :style="{ width: (arc.count / maxCount * 100) + '%' }"></div>
        </div>
        <span class="text-sm text-text-sub w-16 text-right font-semibold">{{ arc.count }} 篇</span>
      </div>
    </div>
    
    <div v-if="!archives.length" class="text-center py-20 text-text-sub">暂无归档数据</div>

    <!-- 归档文章弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedMonth + ' 归档文章'"
      width="560px"
      destroy-on-close
      align-center
      class="archive-dialog"
    >
      <div v-loading="loading" class="min-h-[160px] py-2 px-1">
        <ul v-if="filteredArticles.length" class="space-y-3">
          <li 
            v-for="art in filteredArticles" 
            :key="art.id"
            class="flex items-center gap-4 py-2 border-b border-gray-50 hover:bg-gray-50/40 px-2 rounded-xl transition-all"
          >
            <span class="text-xs font-mono text-gray-400 flex-shrink-0">{{ formatDay(art.createTime) }}</span>
            <router-link 
              :to="'/article/' + art.id"
              class="text-sm font-semibold text-gray-700 hover:text-primary no-underline leading-snug truncate flex-1"
            >
              {{ art.title }}
            </router-link>
            <div v-if="art.tags && art.tags.length" class="flex items-center gap-1.5 flex-shrink-0">
              <span
                v-for="tag in art.tags"
                :key="tag.id"
                class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                :style="{ background: tag.color + '15', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </li>
        </ul>
        <div v-else-if="!loading" class="text-center py-12 text-gray-400 text-sm">
          该月份暂无博文
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getArchives, type Archive } from '../api/archive'
import { getArticles, type ArticleItem } from '../api/article'

const archives = ref<Archive[]>([])
const maxCount = computed(() => Math.max(...archives.value.map(a => a.count), 1))

// 弹窗相关响应式变量
const dialogVisible = ref(false)
const selectedMonth = ref('')
const loading = ref(false)
const filteredArticles = ref<ArticleItem[]>([])

onMounted(async () => {
  archives.value = await getArchives()
})

// 判断博文创建时间是否属于指定月份（兼容中英文月份格式）
function isArticleInMonth(createTime: string, monthStr: string): boolean {
  const date = new Date(createTime)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const targetYearMonth = `${y}-${m < 10 ? '0' + m : m}`
  
  let checkYearMonth = monthStr
  if (monthStr.includes('年')) {
    const match = monthStr.match(/(\d+)年(\d+)月/)
    if (match) {
      const year = match[1]
      const monthVal = parseInt(match[2], 10)
      checkYearMonth = `${year}-${monthVal < 10 ? '0' + monthVal : monthVal}`
    }
  }
  return targetYearMonth === checkYearMonth
}

// 弹出展示对应月份的博文列表
async function showMonthArticles(month: string) {
  selectedMonth.value = month
  dialogVisible.value = true
  loading.value = true
  filteredArticles.value = []
  
  try {
    // 调取前台博文数据列表
    const res = await getArticles({ page: 1, size: 1000 })
    const records = res.records || []
    
    // 过滤出指定月份的已发布博文
    filteredArticles.value = records.filter(art => isArticleInMonth(art.createTime, month))
  } catch (e) {
    console.error('加载归档文章失败:', e)
  } finally {
    loading.value = false
  }
}

// 格式化展示的日期号
function formatDay(timeStr: string): string {
  const d = new Date(timeStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const mStr = month < 10 ? '0' + month : month
  const dStr = day < 10 ? '0' + day : day
  return `${mStr}-${dStr}`
}
</script>

<style scoped>
.archive-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}
</style>
