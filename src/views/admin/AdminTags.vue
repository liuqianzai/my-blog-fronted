<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-4">Tags</h1>

    <div class="bg-white rounded-xl border p-4 mb-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Add Tag</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="newForm.name" placeholder="Name" class="border rounded-lg px-3 py-2 text-sm w-44" />
        <input v-model="newForm.color" placeholder="Color (e.g. #315fbd)" class="border rounded-lg px-3 py-2 text-sm w-44" />
        <span class="inline-block w-8 h-8 rounded border self-center" :style="{ backgroundColor: newForm.color || '#ccc' }"></span>
        <button @click="handleCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Add</button>
      </div>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Color</th>
            <th class="px-4 py-3 font-medium w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b hover:bg-gray-50">
            <template v-if="editingId === item.id">
              <td class="px-4 py-2"><input v-model="editForm.name" class="border rounded px-2 py-1 text-sm w-full" /></td>
              <td class="px-4 py-2">
                <input v-model="editForm.color" placeholder="#hex" class="border rounded px-2 py-1 text-sm w-28" />
                <span class="inline-block w-6 h-6 rounded border ml-2 align-middle" :style="{ backgroundColor: editForm.color || '#ccc' }"></span>
              </td>
              <td class="px-4 py-2">
                <div class="flex gap-2">
                  <button @click="handleSave(item.id)" class="text-green-600 hover:underline text-xs">Save</button>
                  <button @click="cancelEdit" class="text-gray-500 hover:underline text-xs">Cancel</button>
                </div>
              </td>
            </template>
            <template v-else>
              <td class="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:text-blue-600" @click="startEdit(item)">{{ item.name }}</td>
              <td class="px-4 py-3">
                <span class="inline-block w-5 h-5 rounded border align-middle" :style="{ backgroundColor: item.color }"></span>
                <span class="ml-2 text-gray-500 text-xs">{{ item.color }}</span>
              </td>
              <td class="px-4 py-3">
                <button @click="handleDelete(item.id)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </template>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="3" class="px-4 py-8 text-center text-gray-400">No tags.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTags, createTag, updateTag, deleteTag, Tag } from '../../api/tag'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<Tag[]>([])
const editingId = ref<number | null>(null)
const editForm = ref({ name: '', color: '' })
const newForm = ref({ name: '', color: '#315fbd' })

onMounted(() => fetchList())

async function fetchList() {
  list.value = await getTags()
}

function startEdit(item: Tag) {
  editingId.value = item.id
  editForm.value = { name: item.name, color: item.color }
}

function cancelEdit() {
  editingId.value = null
}

async function handleSave(id: number) {
  await updateTag(id, editForm.value)
  ElMessage.success('Updated')
  cancelEdit()
  fetchList()
}

async function handleCreate() {
  if (!newForm.value.name) return
  await createTag(newForm.value)
  ElMessage.success('Created')
  newForm.value = { name: '', color: '#315fbd' }
  fetchList()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('Delete this tag?', 'Confirm', { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' })
    await deleteTag(id)
    ElMessage.success('Deleted')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
