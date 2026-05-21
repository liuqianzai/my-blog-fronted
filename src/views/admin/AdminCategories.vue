<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-4">Categories</h1>

    <div class="bg-white rounded-xl border p-4 mb-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Add Category</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="newForm.name" placeholder="Name" class="border rounded-lg px-3 py-2 text-sm w-40" />
        <input v-model="newForm.slug" placeholder="Slug" class="border rounded-lg px-3 py-2 text-sm w-40" />
        <input v-model="newForm.description" placeholder="Description" class="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]" />
        <input v-model.number="newForm.sort" type="number" placeholder="Sort" class="border rounded-lg px-3 py-2 text-sm w-20" />
        <button @click="handleCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Add</button>
      </div>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium w-16">Sort</th>
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Slug</th>
            <th class="px-4 py-3 font-medium">Description</th>
            <th class="px-4 py-3 font-medium w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b hover:bg-gray-50">
            <template v-if="editingId === item.id">
              <td class="px-4 py-2"><input v-model.number="editForm.sort" type="number" class="border rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2"><input v-model="editForm.name" class="border rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2"><input v-model="editForm.slug" class="border rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2"><input v-model="editForm.description" class="border rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2">
                <div class="flex gap-2">
                  <button @click="handleSave(item.id)" class="text-green-600 hover:underline text-xs">Save</button>
                  <button @click="cancelEdit" class="text-gray-500 hover:underline text-xs">Cancel</button>
                </div>
              </td>
            </template>
            <template v-else>
              <td class="px-4 py-3 text-gray-500">{{ item.sort }}</td>
              <td class="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:text-blue-600" @click="startEdit(item)">{{ item.name }}</td>
              <td class="px-4 py-3 text-gray-500">{{ item.slug }}</td>
              <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ item.description }}</td>
              <td class="px-4 py-3">
                <button @click="handleDelete(item.id)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </template>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">No categories.</td>
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
  ElMessage.success('Updated')
  cancelEdit()
  fetchList()
}

async function handleCreate() {
  if (!newForm.value.name) return
  await createCategory(newForm.value)
  ElMessage.success('Created')
  newForm.value = { name: '', slug: '', description: '', sort: 0 }
  fetchList()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('Delete this category?', 'Confirm', { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' })
    await deleteCategory(id)
    ElMessage.success('Deleted')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
