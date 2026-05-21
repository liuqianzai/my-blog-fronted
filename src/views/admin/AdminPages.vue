<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800">Pages</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ New</button>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium">Title</th>
            <th class="px-4 py-3 font-medium">Slug</th>
            <th class="px-4 py-3 font-medium w-20">Status</th>
            <th class="px-4 py-3 font-medium w-36">Updated</th>
            <th class="px-4 py-3 font-medium w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ item.title }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ item.slug }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="item.status ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'">
                {{ item.status ? 'Active' : 'Draft' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ item.updateTime }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openEdit(item)" class="text-blue-600 hover:underline text-xs">Edit</button>
                <button @click="handleDelete(item.id)" class="text-red-500 hover:underline text-xs">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">No pages.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">{{ isEditing ? 'Edit Page' : 'New Page' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700">Title</label>
            <input v-model="modalForm.title" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Slug</label>
            <input v-model="modalForm.slug" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Content</label>
            <textarea v-model="modalForm.content" rows="6" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono"></textarea>
          </div>
          <div>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" v-model="modalForm.status" />
              <span>Active</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeModal" class="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button @click="handleSave" :disabled="saving" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60">
            {{ saving ? 'Saving...' : 'Save' }}
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
      ElMessage.success('Updated')
    } else {
      await createPage(modalForm.value)
      ElMessage.success('Created')
    }
    closeModal()
    fetchList()
  } catch {
    ElMessage.error('Operation failed')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('Delete this page?', 'Confirm', { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' })
    await deletePage(id)
    ElMessage.success('Deleted')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
