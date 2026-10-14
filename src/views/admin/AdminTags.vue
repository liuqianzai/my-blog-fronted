<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">标签管理</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          管理文章标签及前台胶囊展示色彩，支持可视化取色、一键随机及快捷色卡。
        </p>
      </div>
    </div>

    <!-- 添加标签卡片 -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-2 h-2 rounded-full bg-primary"></span>
        <h2 class="text-sm font-bold text-gray-800 dark:text-gray-200">新建标签</h2>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- 标签名称输入 -->
        <input
          v-model="newForm.name"
          placeholder="标签名称 (如: Vue3, 算法)"
          class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />

        <!-- 可视化选色板 (Element Plus ColorPicker) -->
        <div class="flex items-center gap-2">
          <el-color-picker
            v-model="newForm.color"
            :predefine="PRESET_COLORS"
            size="default"
          />
          <input
            v-model="newForm.color"
            placeholder="#315fbd"
            class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-2.5 py-2 text-xs font-mono w-24 text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <!-- 针对选择困难症：随机颜色按钮 -->
        <button
          type="button"
          @click="randomizeNewColor"
          class="inline-flex items-center px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
          title="选择困难症？点击一键随机一个精选清新色"
        >
          <span>随机颜色</span>
        </button>

        <!-- 实时前台胶囊预览效果 -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
          <span class="text-xs text-gray-400">前台效果：</span>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm"
            :style="{
              color: newForm.color || '#315fbd',
              backgroundColor: (newForm.color || '#315fbd') + '18',
              border: `1px solid ${(newForm.color || '#315fbd')}40`
            }"
          >
            {{ newForm.name.trim() || '示例标签' }}
          </span>
        </div>

        <!-- 添加按钮 -->
        <button
          @click="handleCreate"
          :disabled="!newForm.name.trim()"
          class="ml-auto bg-primary disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition shadow-sm"
        >
          创建标签
        </button>
      </div>

      <!-- 快捷预设色卡推荐 -->
      <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-2 flex-wrap">
        <span class="text-xs text-gray-400 shrink-0">推荐色盘：</span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            v-for="color in PRESET_COLORS"
            :key="color"
            type="button"
            @click="newForm.color = color"
            class="w-5 h-5 rounded-full transition-transform hover:scale-125 focus:scale-125 focus:outline-none border-2"
            :class="newForm.color?.toLowerCase() === color.toLowerCase() ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-white dark:border-gray-800'"
            :style="{ backgroundColor: color }"
            :title="color"
          />
        </div>
      </div>
    </div>

    <!-- 标签列表表格卡片 -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-5 py-3.5 font-medium">前台胶囊预览</th>
            <th class="px-5 py-3.5 font-medium">标签名称</th>
            <th class="px-5 py-3.5 font-medium">色彩取色 / 调色盘</th>
            <th class="px-5 py-3.5 font-medium text-right pr-6 w-36">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-b border-gray-100 dark:border-gray-800/70 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition"
          >
            <!-- 处于编辑模式 -->
            <template v-if="editingId === item.id">
              <!-- 胶囊预览 (实时联动) -->
              <td class="px-5 py-3">
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold shadow-sm inline-block"
                  :style="{
                    color: editForm.color || '#315fbd',
                    backgroundColor: (editForm.color || '#315fbd') + '18',
                    border: `1px solid ${(editForm.color || '#315fbd')}40`
                  }"
                >
                  {{ editForm.name.trim() || '预览' }}
                </span>
              </td>

              <!-- 名称输入 -->
              <td class="px-5 py-3">
                <input
                  v-model="editForm.name"
                  class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </td>

              <!-- 选色板 + 随机 + Hex -->
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <el-color-picker
                    v-model="editForm.color"
                    :predefine="PRESET_COLORS"
                    size="small"
                  />
                  <input
                    v-model="editForm.color"
                    class="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1 text-xs font-mono w-20 text-center"
                  />
                  <button
                    type="button"
                    @click="randomizeEditColor"
                    class="px-2 py-1 rounded-lg text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    title="换个随机色"
                  >
                    随机
                  </button>
                </div>
              </td>

              <!-- 编辑操作 -->
              <td class="px-5 py-3 text-right pr-6">
                <div class="inline-flex items-center gap-2">
                  <button
                    @click="handleSave(item.id)"
                    class="px-3 py-1 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 active:scale-95 transition"
                  >
                    保存
                  </button>
                  <button
                    @click="cancelEdit"
                    class="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    取消
                  </button>
                </div>
              </td>
            </template>

            <!-- 处于查看模式 -->
            <template v-else>
              <!-- 胶囊预览 -->
              <td class="px-5 py-3.5">
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold shadow-sm inline-block"
                  :style="{
                    color: item.color || '#315fbd',
                    backgroundColor: (item.color || '#315fbd') + '18',
                    border: `1px solid ${(item.color || '#315fbd')}40`
                  }"
                >
                  {{ item.name }}
                </span>
              </td>

              <!-- 标签名称 -->
              <td class="px-5 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                {{ item.name }}
              </td>

              <!-- 颜色展示与色值 -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-block w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700 shadow-inner"
                    :style="{ backgroundColor: item.color }"
                  ></span>
                  <span class="text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {{ item.color }}
                  </span>
                </div>
              </td>

              <!-- 操作按钮 -->
              <td class="px-5 py-3.5 text-right pr-6">
                <div class="inline-flex items-center gap-3">
                  <button
                    @click="startEdit(item)"
                    class="text-primary hover:underline text-xs font-medium"
                  >
                    编辑
                  </button>
                  <button
                    @click="handleDelete(item.id)"
                    class="text-red-500 dark:text-red-400 hover:underline text-xs font-medium"
                  >
                    删除
                  </button>
                </div>
              </td>
            </template>
          </tr>

          <!-- 空列表提示 -->
          <tr v-if="list.length === 0">
            <td colspan="4" class="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
              暂无标签，欢迎在上方添加首个标签
            </td>
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

// 精选高颜值调色池（莫兰迪/马卡龙/科技感，专为胶囊徽章设计）
const PRESET_COLORS = [
  '#315fbd', // 品牌科技蓝
  '#2563eb', // 皇家高光蓝
  '#0284c7', // 蔚蓝海空
  '#0d9488', // 墨青碧水
  '#10b981', // 翡翠翠绿
  '#16a34a', // 薄荷叶绿
  '#84cc16', // 活力青草
  '#eab308', // 暖阳琥珀
  '#f97316', // 落日暖橙
  '#ea580c', // 柿红晚霞
  '#ef4444', // 枫叶朱红
  '#e11d48', // 胭脂玫红
  '#db2777', // 甜梦樱粉
  '#a855f7', // 罗兰轻紫
  '#7c3aed', // 极客紫电
  '#6366f1', // 银河靛蓝
  '#64748b', // 雅致石墨灰
  '#0891b2', // 碧波湖蓝
]

const list = ref<Tag[]>([])
const editingId = ref<number | null>(null)
const editForm = ref({ name: '', color: '#315fbd' })
const newForm = ref({ name: '', color: '#315fbd' })

onMounted(() => fetchList())

async function fetchList() {
  list.value = await getTags()
}

/**
 * 从精选色库中随机挑选一个与当前不同的颜色
 */
function pickRandomColor(currentColor?: string): string {
  const pool = PRESET_COLORS.filter(c => c.toLowerCase() !== currentColor?.toLowerCase())
  const candidates = pool.length > 0 ? pool : PRESET_COLORS
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function randomizeNewColor() {
  newForm.value.color = pickRandomColor(newForm.value.color)
}

function randomizeEditColor() {
  editForm.value.color = pickRandomColor(editForm.value.color)
}

function startEdit(item: Tag) {
  editingId.value = item.id
  editForm.value = { name: item.name, color: item.color || '#315fbd' }
}

function cancelEdit() {
  editingId.value = null
}

async function handleSave(id: number) {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('标签名称不能为空')
    return
  }
  await updateTag(id, {
    name: editForm.value.name.trim(),
    color: editForm.value.color || '#315fbd'
  })
  ElMessage.success('更新成功')
  cancelEdit()
  fetchList()
}

async function handleCreate() {
  if (!newForm.value.name.trim()) {
    ElMessage.warning('标签名称不能为空')
    return
  }
  await createTag({
    name: newForm.value.name.trim(),
    color: newForm.value.color || '#315fbd'
  })
  ElMessage.success('创建成功')
  newForm.value = { name: '', color: pickRandomColor() }
  fetchList()
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个标签吗？删除后文章关联关系也将一并移除。', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteTag(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    /* 用户取消操作 */
  }
}
</script>

<style scoped>
:deep(.el-color-picker__trigger) {
  border-radius: 0.75rem !important;
  border-color: rgba(209, 213, 219, 0.8);
  height: 38px;
  width: 38px;
  padding: 3px;
  transition: all 0.2s ease;
}

:deep(.el-color-picker__trigger:hover) {
  border-color: var(--el-color-primary, #315fbd);
}

.dark :deep(.el-color-picker__trigger) {
  border-color: rgba(55, 65, 81, 1);
  background-color: rgba(31, 41, 55, 1);
}
</style>
