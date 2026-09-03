<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800">文章管理</h1>
      <div class="flex gap-2">
        <router-link to="/admin/articles/create?import=md" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1">
          导入 Markdown
        </router-link>
        <router-link to="/admin/articles/create" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ 新建文章</router-link>
      </div>
    </div>

    <div class="bg-white rounded-xl border p-4 mb-4 flex flex-wrap gap-3">
      <input v-model="keyword" placeholder="搜索文章标题..." class="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" @input="onSearch" />
      <select v-model="statusFilter" class="border rounded-lg px-3 py-2 text-sm" @change="fetchData">
        <option value="">全部状态</option>
        <option value="true">已发布</option>
        <option value="false">草稿</option>
      </select>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium">标题</th>
            <th class="px-4 py-3 font-medium">分类</th>
            <th class="px-4 py-3 font-medium">标签</th>
            <th class="px-4 py-3 font-medium w-20">阅读</th>
            <th class="px-4 py-3 font-medium w-24">状态</th>
            <th class="px-4 py-3 font-medium w-40">创建时间</th>
            <th class="px-4 py-3 font-medium w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.records" :key="row.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{{ row.title }}</td>
            <td class="px-4 py-3 text-gray-500">{{ row.category?.name || '-' }}</td>
            <td class="px-4 py-3">
              <span v-for="t in row.tags" :key="t.id" class="inline-block bg-gray-100 text-gray-600 rounded px-2 py-0.5 text-xs mr-1 mb-1">{{ t.name }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ row.viewCount }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="row.status ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'">
                {{ row.status ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ row.createTime }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <router-link :to="`/admin/articles/${row.id}/edit`" class="text-blue-600 hover:underline text-xs">编辑</router-link>
                <button @click="handleDelete(row.id)" class="text-red-500 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="data.records.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">暂无文章</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-center mt-4" v-if="data.total > 0">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="data.total"
        :page-size="size"
        :current-page="page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminArticles, deleteArticle, PageResult, ArticleItem } from '../../api/article'
import { ElMessage, ElMessageBox } from 'element-plus'

const keyword = ref('')
const statusFilter = ref('')
const page = ref(1)
const size = ref(10)
const data = ref<PageResult<ArticleItem>>({ total: 0, page: 1, size: 10, records: [] })

let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => fetchData())

async function fetchData() {
  const params: any = { page: page.value, size: size.value }
  if (keyword.value) params.keyword = keyword.value
  if (statusFilter.value !== '') params.status = statusFilter.value === 'true'
  data.value = await getAdminArticles(params)
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 300)
}

function onPageChange(p: number) {
  page.value = p
  fetchData()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deleteArticle(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // cancelled
  }
}
</script>
