<template>
  <div class="space-y-6">
    <!-- 页面标题与顶部操作 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">分类管理</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          管理文章分类、URL 别名与展示排序，支持随时修改、合并迁移及维护。
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="openMergeDialog"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium shadow-sm transition flex items-center gap-1.5"
          title="将某个分类下的文章批量合并迁移到另一个分类"
        >
          <span>合并分类</span>
        </button>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          共 <span class="font-bold text-primary">{{ list.length }}</span> 个分类
        </div>
      </div>
    </div>

    <!-- 添加分类卡片 -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm space-y-4">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-primary"></span>
        <h2 class="text-sm font-bold text-gray-800 dark:text-gray-200">新建分类</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <!-- 分类名称 (必填) -->
        <div class="md:col-span-3">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            分类名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="newForm.name"
            placeholder="例如: 后端开发, 读书笔记"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
            @blur="handleNameBlur"
          />
        </div>

        <!-- URL 别名 Slug -->
        <div class="md:col-span-3">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">
              URL 别名 (Slug)
            </label>
            <button
              type="button"
              @click="generateNewSlug"
              class="text-[11px] text-primary hover:underline font-medium"
              title="根据分类名智能转换"
            >
              智能生成
            </button>
          </div>
          <input
            v-model="newForm.slug"
            placeholder="例如: backend, reading"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- 分类描述 -->
        <div class="md:col-span-3">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            分类描述
          </label>
          <input
            v-model="newForm.description"
            placeholder="简短描述（选填）"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- 排序权重 -->
        <div class="md:col-span-1">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            排序
          </label>
          <input
            v-model.number="newForm.sort"
            type="number"
            placeholder="0"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-2.5 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- 提交按钮 -->
        <div class="md:col-span-2">
          <button
            @click="handleCreate"
            :disabled="!newForm.name.trim() || isCreating"
            class="w-full bg-primary disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition shadow-sm flex items-center justify-center gap-1"
          >
            <el-icon v-if="isCreating" class="animate-spin"><RefreshRight /></el-icon>
            <span>添加分类</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 检索与分类列表卡片 -->
    <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
      <!-- 搜索筛选栏 -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3">
        <div class="relative flex-1 max-w-xs">
          <input
            v-model="searchKeyword"
            placeholder="搜索分类名称或别名..."
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <button
            v-if="searchKeyword"
            @click="searchKeyword = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
          >
            ✕
          </button>
        </div>
        <div class="text-xs text-gray-400">
          点击「文章数」可直接跳转筛选名下文章，点击「编辑」可修改分类信息
        </div>
      </div>

      <!-- 表格内容 -->
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 text-left text-gray-600 dark:text-gray-400">
            <th class="px-5 py-3.5 font-medium w-20">排序</th>
            <th class="px-5 py-3.5 font-medium">分类名称</th>
            <th class="px-5 py-3.5 font-medium">URL 别名 (Slug)</th>
            <th class="px-5 py-3.5 font-medium w-24">文章数</th>
            <th class="px-5 py-3.5 font-medium">分类描述</th>
            <th class="px-5 py-3.5 font-medium text-right pr-6 w-36">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredList"
            :key="item.id"
            class="border-b border-gray-100 dark:border-gray-800/70 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition group"
          >
            <!-- 排序 -->
            <td class="px-5 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">
              <span class="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {{ item.sort ?? 0 }}
              </span>
            </td>

            <!-- 名称 -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 text-xs font-semibold">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {{ item.name }}
                </span>
              </div>
            </td>

            <!-- 别名 -->
            <td class="px-5 py-3.5">
              <span class="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700/60">
                /{{ item.slug || item.id }}
              </span>
            </td>

            <!-- 关联文章数 -->
            <td class="px-5 py-3.5">
              <router-link
                :to="`/admin/articles?categoryId=${item.id}`"
                class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full transition"
                :class="(articleCountMap[item.id] || 0) > 0 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:underline' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200/50 dark:border-gray-700/50'"
                title="点击跳转查看该分类下的所有文章"
              >
                <span>{{ articleCountMap[item.id] || 0 }} 篇</span>
              </router-link>
            </td>

            <!-- 描述 -->
            <td class="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate" :title="item.description">
              {{ item.description || '-' }}
            </td>

            <!-- 操作 -->
            <td class="px-5 py-3.5 text-right pr-6">
              <div class="inline-flex items-center gap-3">
                <button
                  type="button"
                  @click="startEdit(item)"
                  class="text-primary hover:underline text-xs font-medium flex items-center gap-0.5"
                >
                  <el-icon class="text-xs"><Edit /></el-icon>
                  <span>编辑</span>
                </button>
                <button
                  type="button"
                  @click="handleDelete(item.id)"
                  class="text-red-500 dark:text-red-400 hover:underline text-xs font-medium flex items-center gap-0.5"
                >
                  <el-icon class="text-xs"><Delete /></el-icon>
                  <span>删除</span>
                </button>
              </div>
            </td>
          </tr>

          <!-- 空状态 -->
          <tr v-if="filteredList.length === 0">
            <td colspan="6" class="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
              {{ searchKeyword ? '未找到匹配的分类' : '暂无分类，欢迎在上方添加首个分类' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 核心修改弹窗：现代化编辑分类对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改分类信息"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
      @closed="handleEditDialogClosed"
    >
      <div class="space-y-4 py-1">
        <!-- 分类名称 (必填) -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            分类名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="editForm.name"
            placeholder="请输入分类名称"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <!-- URL 别名 (Slug) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              URL 别名 (Slug)
            </label>
            <button
              type="button"
              @click="generateEditSlug"
              class="text-xs text-primary hover:underline font-medium"
            >
              智能生成别名
            </button>
          </div>
          <input
            v-model="editForm.slug"
            placeholder="例如: backend, tech-notes"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            用于前台友好 URL 路由访问（如 /categories/tech-notes），建议使用英文字母、数字和连字符。
          </p>
        </div>

        <!-- 排序权重 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            显示排序权重
          </label>
          <input
            v-model.number="editForm.sort"
            type="number"
            placeholder="0"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            数值越小越靠前（例如 0 为最高优先级或按序排列）。
          </p>
        </div>

        <!-- 分类描述 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            分类描述
          </label>
          <textarea
            v-model="editForm.description"
            rows="3"
            placeholder="简短描述该分类下收录的主要内容..."
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2.5">
          <el-button @click="editDialogVisible = false" :disabled="isSaving">取消</el-button>
          <el-button type="primary" :loading="isSaving" @click="handleSave">保存修改</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 合并分类弹窗 -->
    <el-dialog
      v-model="mergeDialogVisible"
      title="合并分类"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="space-y-4 py-1">
        <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          将某个源分类名下的所有文章一次性批量转移至目标分类。适用于重构分类体系或合并细分主题。
        </p>

        <!-- 源分类 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            源分类（将被合并的分类）<span class="text-red-500">*</span>
          </label>
          <select
            v-model="mergeSourceId"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          >
            <option :value="undefined" disabled>请选择源分类</option>
            <option
              v-for="cat in list"
              :key="cat.id"
              :value="cat.id"
              :disabled="cat.id === mergeTargetId"
            >
              {{ cat.name }} ({{ articleCountMap[cat.id] || 0 }} 篇)
            </option>
          </select>
        </div>

        <!-- 目标分类 -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            目标分类（文章迁入的目标）<span class="text-red-500">*</span>
          </label>
          <select
            v-model="mergeTargetId"
            class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          >
            <option :value="undefined" disabled>请选择目标分类</option>
            <option
              v-for="cat in list"
              :key="cat.id"
              :value="cat.id"
              :disabled="cat.id === mergeSourceId"
            >
              {{ cat.name }} ({{ articleCountMap[cat.id] || 0 }} 篇)
            </option>
          </select>
        </div>

        <!-- 是否删除源分类 -->
        <div class="pt-1">
          <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="deleteSourceAfterMerge"
              class="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>合并完成后自动删除源分类</span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2.5">
          <el-button @click="mergeDialogVisible = false" :disabled="isMerging">取消</el-button>
          <el-button
            type="primary"
            :loading="isMerging"
            :disabled="!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId"
            @click="handleMergeSubmit"
          >
            {{ isMerging ? '正在合并迁移中...' : '确认合并' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '../../api/category'
import { getAdminArticles, getAdminArticleDetail, updateArticle } from '../../api/article'
import { generateSlug } from '../../utils/slug'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, RefreshRight } from '@element-plus/icons-vue'

const list = ref<Category[]>([])
const articleCountMap = ref<Record<number, number>>({})
const searchKeyword = ref('')

const isCreating = ref(false)
const isSaving = ref(false)
const editDialogVisible = ref(false)
const editingId = ref<number | null>(null)

// 合并分类响应式状态
const mergeDialogVisible = ref(false)
const mergeSourceId = ref<number | undefined>(undefined)
const mergeTargetId = ref<number | undefined>(undefined)
const deleteSourceAfterMerge = ref(true)
const isMerging = ref(false)

const newForm = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0
})

const editForm = ref({
  name: '',
  slug: '',
  description: '',
  sort: 0
})

const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (item) =>
      item.name.toLowerCase().includes(kw) ||
      (item.slug && item.slug.toLowerCase().includes(kw)) ||
      (item.description && item.description.toLowerCase().includes(kw))
  )
})

onMounted(() => {
  fetchList()
})

async function fetchList() {
  try {
    list.value = await getCategories()
    fetchArticleCounts()
  } catch {
    ElMessage.error('获取分类列表失败')
  }
}

async function fetchArticleCounts() {
  try {
    const res = await getAdminArticles({ size: 1000 })
    const map: Record<number, number> = {}
    res.records.forEach((art) => {
      if (art.category?.id) {
        map[art.category.id] = (map[art.category.id] || 0) + 1
      }
    })
    articleCountMap.value = map
  } catch {
    // ignore
  }
}

function handleNameBlur() {
  if (newForm.value.name.trim() && !newForm.value.slug.trim()) {
    newForm.value.slug = generateSlug(newForm.value.name)
  }
}

function generateNewSlug() {
  if (!newForm.value.name.trim()) {
    ElMessage.info('请先输入分类名称')
    return
  }
  newForm.value.slug = generateSlug(newForm.value.name)
}

function generateEditSlug() {
  if (!editForm.value.name.trim()) {
    ElMessage.info('请先输入分类名称')
    return
  }
  editForm.value.slug = generateSlug(editForm.value.name)
}

function startEdit(item: Category) {
  editingId.value = item.id
  editForm.value = {
    name: item.name,
    slug: item.slug || '',
    description: item.description || '',
    sort: item.sort ?? 0
  }
  editDialogVisible.value = true
}

function handleEditDialogClosed() {
  editingId.value = null
}

async function handleSave() {
  if (!editingId.value) return
  if (!editForm.value.name.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }

  isSaving.value = true
  try {
    await updateCategory(editingId.value, {
      name: editForm.value.name.trim(),
      slug: editForm.value.slug.trim() || generateSlug(editForm.value.name),
      description: editForm.value.description.trim(),
      sort: editForm.value.sort ?? 0
    })
    ElMessage.success('分类修改成功')
    editDialogVisible.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '更新分类失败')
  } finally {
    isSaving.value = false
  }
}

async function handleCreate() {
  const name = newForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  isCreating.value = true
  try {
    const slug = newForm.value.slug.trim() || generateSlug(name)
    await createCategory({
      name,
      slug,
      description: newForm.value.description.trim(),
      sort: newForm.value.sort ?? 0
    })
    ElMessage.success('创建分类成功')
    newForm.value = { name: '', slug: '', description: '', sort: 0 }
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '创建分类失败')
  } finally {
    isCreating.value = false
  }
}

function openMergeDialog() {
  mergeSourceId.value = undefined
  mergeTargetId.value = undefined
  deleteSourceAfterMerge.value = true
  mergeDialogVisible.value = true
}

async function handleMergeSubmit() {
  if (!mergeSourceId.value || !mergeTargetId.value || mergeSourceId.value === mergeTargetId.value) {
    ElMessage.warning('请正确选择源分类与目标分类')
    return
  }

  const sourceCat = list.value.find((c) => c.id === mergeSourceId.value)
  const targetCat = list.value.find((c) => c.id === mergeTargetId.value)
  const sourceName = sourceCat?.name || '源分类'
  const targetName = targetCat?.name || '目标分类'
  const count = articleCountMap.value[mergeSourceId.value] || 0

  try {
    await ElMessageBox.confirm(
      `确定要将「${sourceName}」名下的 ${count} 篇文章全部合并转移至「${targetName}」吗？${deleteSourceAfterMerge.value ? ' 合并后将自动删除「' + sourceName + '」。' : ''}`,
      '确认合并分类',
      {
        type: 'warning',
        confirmButtonText: '确定合并',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  isMerging.value = true
  try {
    const res = await getAdminArticles({ categoryId: mergeSourceId.value, size: 1000 })
    let transferCount = 0

    const promises = res.records.map(async (art) => {
      try {
        const detail = await getAdminArticleDetail(art.id)
        await updateArticle(art.id, {
          title: detail.title,
          summary: detail.summary || '',
          content: detail.content || '',
          cover: detail.cover || '',
          categoryId: mergeTargetId.value,
          tagIds: detail.tags?.map((t) => t.id) || [],
          isTop: detail.isTop,
          status: detail.status,
        })
        transferCount++
      } catch {
        // individual fail
      }
    })

    await Promise.all(promises)

    if (deleteSourceAfterMerge.value && mergeSourceId.value) {
      await deleteCategory(mergeSourceId.value)
    }

    ElMessage.success(`成功将 ${transferCount} 篇文章合并至「${targetName}」！`)
    mergeDialogVisible.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '合并分类失败')
  } finally {
    isMerging.value = false
  }
}

async function handleDelete(id: number) {
  const count = articleCountMap.value[id] || 0
  const confirmText = count > 0
    ? `⚠️ 警告：该分类下当前包含 ${count} 篇文章！删除后这些文章将失去分类（变为未分类）。若需保留文章归属，建议使用上方「合并分类」功能。确定要继续删除吗？`
    : '确定要删除该分类吗？'

  try {
    await ElMessageBox.confirm(
      confirmText,
      count > 0 ? '高风险操作：分类下存在文章' : '确认删除分类',
      {
        type: 'warning',
        confirmButtonText: count > 0 ? '仍然删除' : '删除',
        cancelButtonText: '取消',
        confirmButtonClass: count > 0 ? 'el-button--danger' : undefined
      }
    )
    await deleteCategory(id)
    ElMessage.success('分类已删除')
    await fetchList()
  } catch {
    // cancelled
  }
}
</script>
