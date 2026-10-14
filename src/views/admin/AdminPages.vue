<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">页面管理</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm">+ 新建页面</button>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">标题</th>
            <th class="px-4 py-3 font-medium">别名</th>
            <th class="px-4 py-3 font-medium w-24 whitespace-nowrap">状态</th>
            <th class="px-4 py-3 font-medium w-40 whitespace-nowrap">更新时间</th>
            <th class="px-4 py-3 font-medium w-28 whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
            <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{{ item.title }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ item.slug }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                :class="item.status
                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700/50'"
              >
                {{ item.status ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{{ item.updateTime }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2 whitespace-nowrap">
                <button @click="openEdit(item)" class="text-blue-600 dark:text-blue-400 hover:underline text-xs">编辑</button>
                <button @click="handleDelete(item.id)" class="text-red-500 dark:text-red-400 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">暂无页面</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ isEditing ? '编辑页面' : '新建页面' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">标题</label>
            <input v-model="modalForm.title" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">别名</label>
            <input v-model="modalForm.slug" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">内容</label>
            <textarea v-model="modalForm.content" rows="6" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"></textarea>
          </div>
          <div>
            <label class="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="checkbox" v-model="modalForm.status" />
              <span>发布</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeModal" class="border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">取消</button>
          <button @click="handleSave" :disabled="saving" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60 shadow-sm">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminPages, getAdminPageDetail, createPage, updatePage, deletePage, Page } from '../../api/page'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<Page[]>([])
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const modalForm = ref({ title: '', slug: '', content: '', status: true })

onMounted(() => fetchList())

async function fetchList() {
  list.value = await getAdminPages()
}

function openCreate() {
  isEditing.value = false
  editingId.value = null
  modalForm.value = { title: '', slug: '', content: '', status: true }
  showModal.value = true
}

async function openEdit(item: Page) {
  isEditing.value = true
  editingId.value = item.id
  const detail = await getAdminPageDetail(item.id)
  modalForm.value = { title: detail.title, slug: detail.slug, content: detail.content, status: detail.status }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSave() {
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await updatePage(editingId.value, modalForm.value)
      ElMessage.success('更新成功')
    } else {
      await createPage(modalForm.value)
      ElMessage.success('创建成功')
    }
    closeModal()
    fetchList()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个页面吗？', '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deletePage(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
