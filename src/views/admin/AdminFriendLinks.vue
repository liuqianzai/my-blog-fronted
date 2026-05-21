<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800">Friend Links</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ New</button>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">URL</th>
            <th class="px-4 py-3 font-medium w-20">Sort</th>
            <th class="px-4 py-3 font-medium w-20">Status</th>
            <th class="px-4 py-3 font-medium w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ item.name }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{{ item.url }}</td>
            <td class="px-4 py-3 text-gray-500">{{ item.sort }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="item.status ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'">
                {{ item.status ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openEdit(item)" class="text-blue-600 hover:underline text-xs">Edit</button>
                <button @click="handleDelete(item.id)" class="text-red-500 hover:underline text-xs">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">No friend links.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">{{ isEditing ? 'Edit Friend Link' : 'New Friend Link' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700">Name</label>
            <input v-model="modalForm.name" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">URL</label>
            <input v-model="modalForm.url" placeholder="https://..." class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Avatar URL</label>
            <input v-model="modalForm.avatar" placeholder="https://..." class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">Description</label>
            <input v-model="modalForm.description" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium text-gray-700">Sort</label>
              <input v-model.number="modalForm.sort" type="number" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Status</label>
              <div class="mt-2">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" v-model="modalForm.status" />
                  <span>Active</span>
                </label>
              </div>
            </div>
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
import { getAdminFriendLinks, getAdminFriendLinkDetail, createFriendLink, updateFriendLink, deleteFriendLink, FriendLink } from '../../api/friendLink'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<FriendLink[]>([])
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const modalForm = ref({ name: '', url: '', avatar: '', description: '', sort: 0, status: true })

onMounted(() => fetchList())

async function fetchList() {
  list.value = await getAdminFriendLinks()
}

function openCreate() {
  isEditing.value = false
  editingId.value = null
  modalForm.value = { name: '', url: '', avatar: '', description: '', sort: 0, status: true }
  showModal.value = true
}

async function openEdit(item: FriendLink) {
  isEditing.value = true
  editingId.value = item.id
  const detail = await getAdminFriendLinkDetail(item.id)
  modalForm.value = { name: detail.name, url: detail.url, avatar: detail.avatar, description: detail.description, sort: detail.sort, status: detail.status }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSave() {
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await updateFriendLink(editingId.value, modalForm.value)
      ElMessage.success('Updated')
    } else {
      await createFriendLink(modalForm.value)
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
    await ElMessageBox.confirm('Delete this friend link?', 'Confirm', { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' })
    await deleteFriendLink(id)
    ElMessage.success('Deleted')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
