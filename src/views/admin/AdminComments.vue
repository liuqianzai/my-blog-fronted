<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-4">评论管理</h1>

    <div class="bg-white rounded-xl border p-4 mb-4 flex items-center gap-3">
      <label class="text-sm text-gray-600">筛选：</label>
      <select v-model="approvedFilter" class="border rounded-lg px-3 py-2 text-sm" @change="fetchData">
        <option value="">全部</option>
        <option value="true">已审核</option>
        <option value="false">待审核</option>
      </select>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium w-16">文章</th>
            <th class="px-4 py-3 font-medium">昵称</th>
            <th class="px-4 py-3 font-medium">邮箱</th>
            <th class="px-4 py-3 font-medium">内容</th>
            <th class="px-4 py-3 font-medium w-20">状态</th>
            <th class="px-4 py-3 font-medium w-36">时间</th>
            <th class="px-4 py-3 font-medium w-28">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.records" :key="row.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-500 text-xs">{{ row.articleId }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ row.nickname }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ row.email }}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{{ row.content }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="row.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ row.approved ? '已审核' : '待审核' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ row.createTime }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="handleReview(row.id, !row.approved)" class="text-blue-600 hover:underline text-xs">
                  {{ row.approved ? '取消审核' : '通过审核' }}
                </button>
                <button @click="handleDelete(row.id)" class="text-red-500 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="data.records.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">暂无评论</td>
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
import { getAdminComments, reviewComment, deleteComment, Comment } from '../../api/comment'
import { ElMessage, ElMessageBox } from 'element-plus'

const approvedFilter = ref('')
const page = ref(1)
const size = ref(10)
const data = ref<{ total: number; page: number; size: number; records: Comment[] }>({ total: 0, page: 1, size: 10, records: [] })

onMounted(() => fetchData())

async function fetchData() {
  const params: any = { page: page.value, size: size.value }
  if (approvedFilter.value !== '') params.approved = approvedFilter.value === 'true'
  data.value = await getAdminComments(params)
}

function onPageChange(p: number) {
  page.value = p
  fetchData()
}

async function handleReview(id: number, approved: boolean) {
  await reviewComment(id, approved)
  ElMessage.success(approved ? '已审核' : '已取消审核')
  fetchData()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deleteComment(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* cancelled */ }
}
</script>
