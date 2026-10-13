<template>
  <div
    class="markdown-editor-container relative rounded-xl transition-all"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop="onDrop"
  >
    <!-- 拖拽悬浮提示层 -->
    <div
      v-if="isDragOver"
      class="absolute inset-0 z-50 bg-blue-500/10 dark:bg-blue-500/20 border-2 border-dashed border-primary backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center pointer-events-none"
    >
      <div class="bg-white/95 dark:bg-gray-800/95 px-6 py-4 rounded-2xl shadow-xl border border-primary/30 flex items-center gap-3">
        <el-icon class="text-3xl text-primary animate-bounce"><UploadFilled /></el-icon>
        <div>
          <div class="text-sm font-bold text-gray-800 dark:text-gray-100">松开鼠标即可插入内容</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">支持拖入图片（自动上传并插入）或 Markdown 文档（导入正文）</div>
        </div>
      </div>
    </div>

    <MdEditor
      ref="editorRef"
      v-model="content"
      :theme="theme"
      :preview="true"
      :toolbars="toolbars"
      @onUploadImg="handleUploadImg"
      @onChange="handleChange"
      style="height: 550px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { MdEditor, type ToolbarNames, type ExposeParam } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadImage, uploadGenericFile } from '../api/file'
import { isDark } from '../utils/theme'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'dropMdFile', file: File): void
}>()

const editorRef = ref<ExposeParam>()
const content = ref(props.modelValue)
const theme = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'))

const toolbars: ToolbarNames[] = [
  'bold', 'underline', 'italic', 'strikeThrough', '-',
  'title', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-',
  'codeRow', 'code', 'link', 'image', 'table', '-',
  'revoke', 'next', 'save', '=', 'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog'
]

watch(
  () => props.modelValue,
  (val) => {
    if (val !== content.value) {
      content.value = val
    }
  }
)

function handleChange(value: string) {
  emit('update:modelValue', value)
}

function insertText(text: string) {
  if (editorRef.value && typeof editorRef.value.insert === 'function') {
    editorRef.value.insert(() => ({
      targetValue: text,
      select: false,
      deviationStart: 0,
      deviationEnd: 0
    }))
  } else {
    content.value = (content.value ? content.value + '\n\n' : '') + text
    emit('update:modelValue', content.value)
  }
}

let dragCounter = 0
const isDragOver = ref(false)

function onDragEnter() {
  dragCounter++
  isDragOver.value = true
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragOver.value = false
  }
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  dragCounter = 0
  isDragOver.value = false

  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length === 0) return

  // 1. 如果包含 Markdown 文档 (.md 或 .markdown)
  const mdFile = files.find(
    (f) => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.markdown')
  )
  if (mdFile) {
    emit('dropMdFile', mdFile)
    return
  }

  // 2. 如果包含图片文件
  const imageFiles = files.filter((f) => f.type.startsWith('image/'))
  if (imageFiles.length > 0) {
    await handleUploadImages(imageFiles)
    return
  }

  // 3. 如果是纯文本文件 (.txt)
  const txtFile = files.find((f) => f.name.toLowerCase().endsWith('.txt'))
  if (txtFile) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      insertText(text)
    }
    reader.readAsText(txtFile)
    return
  }

  // 4. 其他附件文件（PDF、ZIP、DOCX 等）
  await handleUploadAttachments(files)
}

import { runBatchUpload } from '../utils/batchUpload'

async function handleUploadImages(files: File[]) {
  const loadingMsg = ElMessage.info({
    message: `正在批量上传 ${files.length} 张图片 (0%)...`,
    duration: 0
  })

  try {
    const { success, failed } = await runBatchUpload(files, {
      concurrency: 3,
      uploadFn: uploadImage,
      onOverallProgress: (percent, completed, total) => {
        loadingMsg.message = `正在批量上传图片 (${completed}/${total}) ${percent}%...`
      }
    })
    loadingMsg.close()

    if (success.length > 0) {
      const mdImages = success
        .map((task) => `![${task.file.name.replace(/\.[^/.]+$/, '')}](${task.result!.url})`)
        .join('\n\n')
      insertText(mdImages)
    }

    if (failed.length === 0) {
      ElMessage.success(`成功上传并插入 ${success.length} 张图片`)
    } else {
      ElMessage.warning(`上传完成：${success.length} 张成功，${failed.length} 张失败`)
    }
  } catch {
    loadingMsg.close()
    ElMessage.error('批量上传图片过程出现异常')
  }
}

async function handleUploadAttachments(files: File[]) {
  const loadingMsg = ElMessage.info({
    message: `正在批量上传 ${files.length} 个附件 (0%)...`,
    duration: 0
  })

  try {
    const { success, failed } = await runBatchUpload(files, {
      concurrency: 3,
      uploadFn: uploadGenericFile,
      onOverallProgress: (percent, completed, total) => {
        loadingMsg.message = `正在批量上传附件 (${completed}/${total}) ${percent}%...`
      }
    })
    loadingMsg.close()

    if (success.length > 0) {
      const links = success
        .map((task) => `[${task.result!.filename || task.file.name}](${task.result!.url})`)
        .join('\n\n')
      insertText(links)
    }

    if (failed.length === 0) {
      ElMessage.success(`成功上传并插入 ${success.length} 个附件`)
    } else {
      ElMessage.warning(`附件上传：${success.length} 个成功，${failed.length} 个失败`)
    }
  } catch {
    loadingMsg.close()
    ElMessage.error('批量上传附件过程出现异常')
  }
}

async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  const { success, failed } = await runBatchUpload(files, {
    concurrency: 3,
    uploadFn: uploadImage
  })

  const urls = success.map((t) => t.result!.url)
  callback(urls)

  if (failed.length === 0) {
    ElMessage.success(`图片上传成功 (${success.length}张)`)
  } else {
    ElMessage.warning(`${success.length} 张图片上传成功，${failed.length} 张失败`)
  }
}
</script>

<style scoped>
.markdown-editor-container {
  position: relative;
  width: 100%;
}
</style>
