<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">系统配置</h1>
      <button @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm">+ 添加配置</button>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-4 py-3 font-medium">配置项</th>
            <th class="px-4 py-3 font-medium">值</th>
            <th class="px-4 py-3 font-medium">备注</th>
            <th class="px-4 py-3 font-medium w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in list" :key="item.configKey + index" class="border-b border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
            <td class="px-4 py-3 font-mono text-sm text-gray-800 dark:text-gray-200">{{ item.configKey }}</td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">{{ item.configValue }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ item.remark }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button @click="openEdit(item)" class="text-blue-600 dark:text-blue-400 hover:underline text-xs">编辑</button>
                <button @click="handleDelete(item.configKey)" class="text-red-500 dark:text-red-400 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">暂无配置</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ isEditing ? '编辑配置' : '新建配置' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">配置项</label>
            <input
              v-model="modalForm.configKey"
              :disabled="isEditing"
              class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 text-gray-800 dark:text-gray-100 disabled:text-gray-500 dark:disabled:text-gray-400 rounded-lg px-3 py-2 text-sm mt-1 font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">值</label>
            <input v-model="modalForm.configValue" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">备注</label>
            <input v-model="modalForm.remark" class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40" />
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
