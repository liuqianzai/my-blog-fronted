<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800">系统配置</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ 添加配置</button>
    </div>

    <div class="bg-white rounded-xl border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-gray-600">
            <th class="px-4 py-3 font-medium">配置项</th>
            <th class="px-4 py-3 font-medium">值</th>
            <th class="px-4 py-3 font-medium">备注</th>
            <th class="px-4 py-3 font-medium w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in list" :key="item.configKey + index" class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-sm text-gray-800">{{ item.configKey }}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{{ item.configValue }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ item.remark }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openEdit(item)" class="text-blue-600 hover:underline text-xs">编辑</button>
                <button @click="handleDelete(item.configKey)" class="text-red-500 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-gray-400">暂无配置</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 mb-4">{{ isEditing ? '编辑配置' : '新建配置' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700">配置项</label>
            <input v-model="modalForm.configKey" :disabled="isEditing" class="w-full border rounded-lg px-3 py-2 text-sm mt-1 font-mono" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">值</label>
            <input v-model="modalForm.configValue" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700">备注</label>
            <input v-model="modalForm.remark" class="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
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
import { getConfigs, saveConfig, deleteConfig, Config } from '../../api/config'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<Config[]>([])
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const modalForm = ref<Config>({ configKey: '', configValue: '', remark: '' })
const originalKey = ref('')

onMounted(() => fetchList())

async function fetchList() {
  list.value = await getConfigs()
}

function openCreate() {
  isEditing.value = false
  modalForm.value = { configKey: '', configValue: '', remark: '' }
  showModal.value = true
}

function openEdit(item: Config) {
  isEditing.value = true
  originalKey.value = item.configKey
  modalForm.value = { configKey: item.configKey, configValue: item.configValue, remark: item.remark }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSave() {
  saving.value = true
  try {
    await saveConfig(modalForm.value)
    ElMessage.success(isEditing.value ? '更新成功' : '创建成功')
    closeModal()
    fetchList()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(key: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个配置吗？', '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
    await deleteConfig(key)
    ElMessage.success('删除成功')
    fetchList()
  } catch { /* cancelled */ }
}
</script>
