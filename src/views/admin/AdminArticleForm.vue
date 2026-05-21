<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-4">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="text-sm font-medium text-gray-700">标题 *</label>
        <input v-model="form.title" required class="w-full mt-1 px-4 py-2 border rounded-lg text-sm" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700">摘要</label>
        <textarea v-model="form.summary" rows="2" class="w-full mt-1 px-4 py-2 border rounded-lg text-sm resize-none"></textarea>
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700">封面图</label>
        <CoverUpload v-model="form.cover" />
      </div>

      <div>
        <label class="text-sm font-medium text-gray-700">正文 *</label>
        <MarkdownEditor v-model="form.content" />
      </div>

      <div class="flex gap-4">
        <div class="flex-1">
          <label class="text-sm font-medium text-gray-700">分类</label>
          <select v-model="form.categoryId" class="w-full mt-1 px-4 py-2 border rounded-lg text-sm">
            <option :value="undefined">无分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="flex-1">
          <label class="text-sm font-medium text-gray-700">标签</label>
          <div class="mt-1 flex flex-wrap gap-2">
            <label v-for="tag in tags" :key="tag.id" class="flex items-center gap-1 text-sm">
              <input type="checkbox" :value="tag.id" v-model="form.tagIds" />
              {{ tag.name }}
            </label>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.isTop" />
          置顶
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.status" />
          发布
        </label>
      </div>

      <div class="flex gap-2">
        <button type="submit" class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition">
          {{ isEdit ? '保存' : '发布' }}
        </button>
        <router-link to="/admin/articles" class="px-6 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
          取消
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAdminArticleDetail, createArticle, updateArticle } from '../../api/article'
import { getCategories } from '../../api/category'
import { getTags } from '../../api/tag'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import CoverUpload from '../../components/CoverUpload.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const form = ref({
  title: '',
  summary: '',
  content: '',
  cover: '',
  categoryId: undefined as number | undefined,
  tagIds: [] as number[],
  isTop: false,
  status: true,
})

const categories = ref<any[]>([])
const tags = ref<any[]>([])

async function fetchData() {
  const [cats, t] = await Promise.all([getCategories(), getTags()])
  categories.value = cats
  tags.value = t

  if (isEdit.value) {
    const article = await getAdminArticleDetail(Number(route.params.id))
    form.value = {
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      cover: article.cover || '',
      categoryId: article.categoryId,
      tagIds: article.tags?.map(t => t.id) || [],
      isTop: article.isTop,
      status: article.status,
    }
  }
}

async function handleSubmit() {
  try {
    if (isEdit.value) {
      await updateArticle(Number(route.params.id), form.value)
      ElMessage.success('更新成功')
    } else {
      const res = await createArticle(form.value)
      ElMessage.success('创建成功')
      router.push(`/admin/articles/${res.id}/edit`)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => fetchData())
</script>
