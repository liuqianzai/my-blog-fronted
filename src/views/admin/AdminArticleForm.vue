<template>
  <div>
    <div class="flex items-center justify-between mb-4 border-b pb-3">
      <h1 class="text-xl font-bold text-gray-800">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
      <div class="flex gap-2">
        <button type="button" @click="triggerMdSelect" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1">
          导入 Markdown
        </button>
        <input
          type="file"
          ref="mdFileInput"
          accept=".md"
          class="hidden"
          @change="handleMdFileLoad"
        />
      </div>
    </div>

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

      <!-- 附件管理卡片 -->
      <div class="bg-white rounded-xl border p-5 mt-4 space-y-3">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="text-sm font-semibold text-gray-800">文章附件库 (可上传 PDF、Zip、Docx、Markdown 等)</h3>
          <span class="text-xs text-gray-400">单文件最大限制 10MB</span>
        </div>
        <div class="flex items-center gap-3">
          <el-upload
            :action="''"
            :http-request="handleUploadAttachment"
            :show-file-list="false"
            :before-upload="beforeUploadAttachment"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar,.tar,.gz,.7z"
          >
            <button type="button" class="bg-gray-100 border text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition">
              选择文件并上传
            </button>
          </el-upload>
        </div>
        <div v-if="attachments.length > 0" class="space-y-2 max-h-48 overflow-y-auto pr-1">
          <div v-for="(file, index) in attachments" :key="index" class="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 animate-fade-in">
            <span class="truncate font-medium text-gray-700 flex-1 mr-2">{{ file.filename }}</span>
            <div class="flex gap-2 shrink-0">
              <button type="button" @click="insertAttachmentLink(file)" class="text-blue-600 hover:underline">
                复制 Markdown 链接
              </button>
              <button type="button" @click="copyLink(file.url)" class="text-gray-500 hover:underline">
                复制链接
              </button>
              <button type="button" @click="removeAttachment(index)" class="text-red-500 hover:underline">
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-gray-400 text-center py-4">
          暂无上传的附件
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

    <!-- 拖拽图片转存弹窗 -->
    <el-dialog
      v-model="showDragDropModal"
      title="检测到本地图片，请上传"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          为了使图片正常显示，请在本地文件夹中找到以下引用的图片，并**全部拖拽**到下方区域进行批量转存：
        </p>

        <!-- 一键在本地资源管理器中打开图片所在的文件夹 -->
        <div v-if="detectedLocalFolderPath" class="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between animate-fade-in">
          <div class="text-xs text-blue-700 truncate flex-1 mr-2">
            检测到本地路径: <span class="font-mono font-medium">{{ detectedLocalFolderPath }}</span>
          </div>
          <button type="button" @click="handleOpenFolder" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs transition shrink-0 font-medium flex items-center gap-1 shadow-sm">
            📁 打开文件夹
          </button>
        </div>

        <!-- 待上传的文件名列表 -->
        <div class="bg-gray-50 border rounded-lg p-3 max-h-36 overflow-y-auto">
          <ul class="space-y-1 text-xs">
            <li
              v-for="img in mdImages"
              :key="img.filename"
              :class="img.uploadedUrl ? 'text-green-600 line-through font-medium' : 'text-gray-500'"
              class="flex items-center gap-1"
            >
              <span v-if="img.uploadedUrl">✓</span>
              <span v-else>•</span>
              {{ img.filename }} <span v-if="img.uploadedUrl" class="text-xs text-green-500 font-normal">(已转存)</span>
            </li>
          </ul>
        </div>

        <!-- 拖拽区域 -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
          :class="isDragOver ? 'bg-green-50 border-emerald-500 text-emerald-600' : 'bg-blue-50/50 border-blue-500 text-blue-600'"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDropImages"
        >
          {{ isDragOver ? '松开鼠标即可上传' : '将上方列出的图片文件拖拽至此区域' }}
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <el-button @click="cancelImport">取消导入</el-button>
          <el-button type="warning" @click="forceImport">跳过未上传图片并直接导入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminArticleDetail, createArticle, updateArticle } from '../../api/article'
import { getCategories } from '../../api/category'
import { getTags } from '../../api/tag'
import { uploadGenericFile, openLocalFolder } from '../../api/file'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import CoverUpload from '../../components/CoverUpload.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const mdFileInput = ref<HTMLInputElement | null>(null)
const showDragDropModal = ref(false)
const isDragOver = ref(false)

const currentMdContent = ref('')
const currentFilename = ref('')
const parsedMetadata = ref<any>({})
const mdImages = ref<Array<{ rawPath: string; filename: string; uploadedUrl: string | null }>>([])
const detectedLocalFolderPath = ref('')

async function handleOpenFolder() {
  if (!detectedLocalFolderPath.value) return
  try {
    await openLocalFolder(detectedLocalFolderPath.value)
    ElMessage.success('已向本地系统发起打开文件夹指令，请查看桌面窗口')
  } catch {
    ElMessage.error('无法自动打开本地文件夹，请手动查找')
  }
}

function triggerMdSelect() {
  mdFileInput.value?.click()
}

function handleMdFileLoad(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.name.endsWith('.md')) {
    ElMessage.error('请选择 .md 格式的 Markdown 文档！')
    target.value = ''
    return
  }

  currentFilename.value = file.name.substring(0, file.name.lastIndexOf('.'))

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    parseFrontMatter(text)
    extractLocalImages(currentMdContent.value)

    if (mdImages.value.length > 0) {
      showDragDropModal.value = true
    } else {
      fillFormAndFinish()
    }
  }
  reader.readAsText(file)
  target.value = ''
}

function parseFrontMatter(content: string) {
  parsedMetadata.value = { title: '', summary: '', category: '', tags: [] }
  let bodyContent = content

  const lines = content.split(/\r?\n/)
  if (lines.length > 0 && lines[0].trim() === '---') {
    let i = 1
    let yamlContent = ''
    while (i < lines.length && lines[i].trim() !== '---') {
      yamlContent += lines[i] + '\n'
      i++
    }

    const yamlLines = yamlContent.split('\n')
    yamlLines.forEach((line) => {
      const colonIdx = line.indexOf(':')
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim().toLowerCase()
        let val = line.substring(colonIdx + 1).trim()
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)

        if (key === 'title') parsedMetadata.value.title = val
        if (key === 'summary') parsedMetadata.value.summary = val
        if (key === 'category') parsedMetadata.value.category = val
        if (key === 'tags') {
          if (val.startsWith('[') && val.endsWith(']')) val = val.slice(1, -1)
          parsedMetadata.value.tags = val
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        }
      }
    })

    bodyContent = lines.slice(i + 1).join('\n')
  }
  currentMdContent.value = bodyContent
}

function extractLocalImages(content: string) {
  mdImages.value = []
  detectedLocalFolderPath.value = ''
  const imgRegex = /!\[.*?\]\((.*?)\)/g
  let match
  const uniqueNames = new Set<string>()

  while ((match = imgRegex.exec(content)) !== null) {
    const rawPath = match[1]
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      continue
    }

    const filename = decodeURIComponent(rawPath.replace(/^.*[\\\/]/, ''))
    if (filename && !uniqueNames.has(filename)) {
      uniqueNames.add(filename)
      mdImages.value.push({
        rawPath,
        filename,
        uploadedUrl: null
      })
    }

    if (!detectedLocalFolderPath.value) {
      const isAbsoluteWin = /^[a-zA-Z]:[\\\/]/.test(rawPath)
      const isAbsoluteUnix = rawPath.startsWith('/')
      if (isAbsoluteWin || isAbsoluteUnix) {
        const lastSlashIdx = Math.max(rawPath.lastIndexOf('/'), rawPath.lastIndexOf('\\'))
        if (lastSlashIdx > 0) {
          detectedLocalFolderPath.value = rawPath.substring(0, lastSlashIdx)
        }
      }
    }
  }
}

async function onDropImages(event: DragEvent) {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length === 0) return

  let uploadCount = 0
  for (const file of files) {
    const targetImg = mdImages.value.find(
      (img) => decodeURIComponent(img.filename) === file.name || img.filename === file.name
    )

    if (targetImg && !targetImg.uploadedUrl) {
      try {
        const result = await uploadGenericFile(file)
        targetImg.uploadedUrl = result.url
        uploadCount++
      } catch {
        ElMessage.error(`${file.name} 上传失败，请重试`)
      }
    }
  }

  const allUploaded = mdImages.value.every((img) => img.uploadedUrl !== null)
  if (allUploaded) {
    ElMessage.success('所有图片均已成功上传转存！')
    replaceImagesAndFill()
  } else {
    try {
      await ElMessageBox.confirm(
        '检测到仍有部分引用的图片未拖入上传，是否跳过这些图片并直接导入文章内容？',
        '部分图片未转存',
        {
          confirmButtonText: '直接导入',
          cancelButtonText: '继续拖入图片',
          type: 'warning',
        }
      )
      replaceImagesAndFill()
    } catch {
      if (uploadCount > 0) {
        ElMessage.info('已上传部分图片，您可以继续拖入剩余图片！')
      } else {
        ElMessage.info('您可以继续拖拽上传剩余的图片文件')
      }
    }
  }
}

function replaceImagesAndFill() {
  let content = currentMdContent.value
  mdImages.value.forEach((img) => {
    if (img.uploadedUrl) {
      const escapedPath = img.rawPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(escapedPath, 'g')
      content = content.replace(regex, () => img.uploadedUrl!)
    }
  })
  currentMdContent.value = content
  showDragDropModal.value = false
  fillFormAndFinish()
}

function fillFormAndFinish() {
  form.value.title = parsedMetadata.value.title || currentFilename.value
  form.value.summary = parsedMetadata.value.summary || extractTextSummary(currentMdContent.value)
  form.value.content = currentMdContent.value

  if (parsedMetadata.value.category) {
    const matchedCat = categories.value.find(
      (cat) => cat.name.trim().toLowerCase() === parsedMetadata.value.category.trim().toLowerCase()
    )
    if (matchedCat) {
      form.value.categoryId = matchedCat.id
    }
  }

  if (parsedMetadata.value.tags && parsedMetadata.value.tags.length > 0) {
    const matchedTagIds: number[] = []
    parsedMetadata.value.tags.forEach((tagName: string) => {
      const matchedTag = tags.value.find(
        (t) => t.name.trim().toLowerCase() === tagName.trim().toLowerCase()
      )
      if (matchedTag) {
        matchedTagIds.push(matchedTag.id)
      }
    })
    form.value.tagIds = Array.from(new Set([...form.value.tagIds, ...matchedTagIds]))
  }

  ElMessage.success('Markdown 导入并解析成功，元数据已填充表单！')
}

function extractTextSummary(content: string): string {
  const cleanText = content
    .replace(/^#+\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[\*_`~>\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText
}

function cancelImport() {
  showDragDropModal.value = false
  mdImages.value = []
  detectedLocalFolderPath.value = ''
  currentMdContent.value = ''
  currentFilename.value = ''
  parsedMetadata.value = {}
  ElMessage.info('导入已取消')
}

function forceImport() {
  ElMessage.warning('已跳过未上传的图片，正在导入文章内容...')
  replaceImagesAndFill()
}

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

interface AttachmentItem {
  url: string
  filename: string
}
const attachments = ref<AttachmentItem[]>([])

function beforeUploadAttachment(file: File) {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

async function handleUploadAttachment(options: any) {
  try {
    const result = await uploadGenericFile(options.file)
    attachments.value.push({
      url: result.url,
      filename: result.filename
    })
    ElMessage.success('附件上传成功！')
  } catch {
    ElMessage.error('附件上传失败')
  }
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('复制失败', err)
    }
    document.body.removeChild(textarea)
  }
}

async function insertAttachmentLink(file: AttachmentItem) {
  const mdLink = `[${file.filename}](${file.url})`
  try {
    await copyToClipboard(mdLink)
    ElMessage.success({
      message: '已成功生成并复制 Markdown 链接！请直接在正文中按 Ctrl+V 粘贴。',
      duration: 5000
    })
  } catch {
    ElMessage.error('复制链接失败，请手动复制')
  }
}

async function copyLink(url: string) {
  const fullUrl = window.location.origin + url
  try {
    await copyToClipboard(fullUrl)
    ElMessage.success('已复制文件链接到剪贴板！')
  } catch {
    ElMessage.error('复制链接失败，请手动复制')
  }
}

function removeAttachment(index: number) {
  attachments.value.splice(index, 1)
  ElMessage.success('附件已移除')
}

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

onMounted(() => {
  fetchData()
  if (route.query.from === 'import') {
    ElMessage({
      message: '温馨提示：请核对导入文章的【标题、分类、标签、摘要】等元数据是否准确，核对无误后请点击保存/发布！',
      type: 'warning',
      duration: 10000,
      showClose: true
    })
  }
  if (route.query.import === 'md') {
    setTimeout(() => {
      triggerMdSelect()
    }, 300)
  }
})
</script>
