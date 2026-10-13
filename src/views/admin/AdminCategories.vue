<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">分类管理</h1>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">添加分类</h2>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="newForm.name"
          placeholder="分类名称"
          class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          v-model="newForm.slug"
          placeholder="URL别名"
          class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          v-model="newForm.description"
          placeholder="描述"
          class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          v-model.number="newForm.sort"
          type="number"
          placeholder="排序"
          class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button @click="handleCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm">添加</button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-4 py-3 font-medium w-16">排序</th>
            <th class="px-4 py-3 font-medium">名称</th>
            <th class="px-4 py-3 font-medium">别名</th>
            <th class="px-4 py-3 font-medium">描述</th>
            <th class="px-4 py-3 font-medium w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
            <template v-if="editingId === item.id">
              <td class="px-4 py-2"><input v-model.number="editForm.sort" type="number" class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2"><input v-model="editForm.name" class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2"><input v-model="editForm.slug" class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2"><input v-model="editForm.description" class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2">
                <div class="flex gap-2">
                  <button @click="handleSave(item.id)" class="text-green-600 dark:text-green-400 hover:underline text-xs">保存</button>
                  <button @click="cancelEdit" class="text-gray-500 dark:text-gray-400 hover:underline text-xs">取消</button>
                </div>
              </td>
            </template>
            <template v-else>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ item.sort }}</td>
              <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" @click="startEdit(item)">{{ item.name }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ item.slug }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{{ item.description }}</td>
              <td class="px-4 py-3">
                <button @click="handleDelete(item.id)" class="text-red-500 dark:text-red-400 hover:underline text-xs">删除</button>
              </td>
            </template>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">暂无分类</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '../../api/category'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<Category[]>([])
const editingId = ref<number | null>(null)
const editForm = ref({ name: '', slug: '', description: '', sort: 0 })
const newForm = ref({ name: '', slug: '', description: '', sort: 0 })

onMounted(() => fetchList())

async function fetchList() {
  list.value = await getCategories()
}

function startEdit(item: Category) {
  editingId.value = item.id
  editForm.value = { name: item.name, slug: item.slug, description: item.description, sort: item.sort }
}

function cancelEdit() {
  editingId.value = null
}

async function handleSave(id: number) {
  await updateCategory(id, editForm.value)
  ElMessage.success('更新成功')
  cancelEdit()
  fetchList()
}

async function handleCreate() {
  if (!newForm.value.name) return
  await createCategory(newForm.value)
  ElMessage.success('创建成功')
  newForm.value = { name: '', slug: '', description: '', sort: 0 }
  fetchList()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deleteCategory(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
