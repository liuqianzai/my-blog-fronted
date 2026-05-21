<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800">友链管理</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ 新建友链</button>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium">名称</th>
            <th class="px-4 py-3 font-medium">链接</th>
            <th class="px-4 py-3 font-medium w-20">排序</th>
            <th class="px-4 py-3 font-medium w-20">状态</th>
            <th class="px-4 py-3 font-medium w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ item.name }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{{ item.url }}</td>
            <td class="px-4 py-3 text-gray-500">{{ item.sort }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="item.status ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'">
                {{ item.status ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openEdit(item)" class="text-blue-600 hover:underline text-xs">编辑</button>
                <button @click="handleDelete(item.id)" class="text-red-500 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">暂无友链</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">{{ isEditing ? '编辑友链' : '新建友链' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700">名称</label>
            <input v-model="modalForm.name" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">链接</label>
            <input v-model="modalForm.url" placeholder="https://..." class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">头像链接</label>
            <input v-model="modalForm.avatar" placeholder="https://..." class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">描述</label>
            <input v-model="modalForm.description" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium text-gray-700">排序</label>
              <input v-model.number="modalForm.sort" type="number" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">状态</label>
              <div class="mt-2">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" v-model="modalForm.status" />
                  <span>启用</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="closeModal" class="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">取消</button>
          <button @click="handleSave" :disabled="saving" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60">
            {{ saving ? '保存中...' : '保存' }}
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
      ElMessage.success('更新成功')
    } else {
      await createFriendLink(modalForm.value)
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
    await ElMessageBox.confirm('确定要删除这个友链吗？', '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deleteFriendLink(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
