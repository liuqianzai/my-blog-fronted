<template>
  <div
    ref="containerRef"
    tabindex="0"
    class="cover-upload-container relative w-64 h-36 rounded-xl overflow-hidden select-none transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/40"
    :class="[
      isDragOver
        ? 'border-2 border-primary bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-primary/20 scale-[1.02]'
        : 'border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary/80 bg-gray-50/60 dark:bg-gray-800/40',
      uploading ? 'cursor-wait opacity-80' : 'cursor-pointer'
    ]"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @paste="onContainerPaste"
    @click="triggerSelect"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileInputChange"
    />

    <!-- 上传中 Loading 状态 -->
    <div
      v-if="uploading"
      class="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-gray-800/85 z-20"
    >
      <el-icon class="is-loading text-3xl text-primary mb-2"><Loading /></el-icon>
      <span class="text-xs text-gray-600 dark:text-gray-300 font-medium">正在上传封面...</span>
    </div>

    <!-- 拖拽悬浮提示 (当有文件正在拖动悬浮时) -->
    <div
      v-else-if="isDragOver"
      class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-[1px] text-primary"
    >
      <el-icon class="text-4xl animate-bounce mb-1"><UploadFilled /></el-icon>
      <span class="text-xs font-bold">松开鼠标即可上传封面</span>
      <span class="text-[11px] opacity-80 mt-0.5">支持拖入替换或新建</span>
    </div>

    <!-- 已有封面图预览 -->
    <div v-else-if="modelValue" class="relative w-full h-full">
      <img :src="modelValue" class="w-full h-full object-cover rounded-lg" alt="封面预览" />

      <!-- 悬浮操作遮罩 -->
      <div
        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 text-white p-2"
      >
        <span class="text-xs font-medium text-center">
          点击替换 / 拖拽 / 按 Ctrl+V 粘贴
        </span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click.stop="pasteFromClipboard"
            class="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition"
          >
            粘贴
          </button>
          <button
            type="button"
            @click.stop="handleRemove"
            class="text-xs bg-red-500/80 hover:bg-red-600 text-white px-3 py-1 rounded-full transition flex items-center gap-1 shadow-sm"
          >
            <el-icon><Delete /></el-icon> 移除封面
          </button>
        </div>
      </div>
    </div>

    <!-- 空白状态：引导点击、拖拽或按 Ctrl+V 粘贴 -->
    <div v-else class="w-full h-full flex flex-col items-center justify-center p-2 text-center">
      <el-icon class="text-3xl text-gray-400 dark:text-gray-500 mb-1 group-hover:text-primary transition-colors">
        <Picture />
      </el-icon>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
        点击上传 或 拖拽图片至此
      </span>
      <span class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
        支持直接按 Ctrl+V 粘贴
      </span>
      <button
        type="button"
        @click.stop="pasteFromClipboard"
        class="mt-1 px-2.5 py-0.5 text-xs text-primary hover:text-white hover:bg-primary border border-primary/40 rounded transition"
      >
        粘贴
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Delete, Loading, Picture, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '../api/file'

defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

const containerRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isHovered = ref(false)
const uploading = ref(false)

let dragCounter = 0

function resetDrag() {
  dragCounter = 0
  isDragOver.value = false
}

function onDragEnter() {
  dragCounter++
  isDragOver.value = true
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    resetDrag()
  }
}

function onWindowGlobalDragLeave(e: DragEvent) {
  if (!e.relatedTarget || e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
    resetDrag()
  }
}

function isImageUrl(url: string): boolean {
  if (!url) return false
  return /^https?:\/\/.+(\.(png|jpg|jpeg|webp|gif|svg)|(\?.*(png|jpg|jpeg|webp|gif|svg)))/i.test(url)
}

/**
 * 统一处理剪贴板数据（支持提取截图文件、从文件管理器复制的图片文件、或图片直链文本）
 */
async function processClipboardData(dataTransfer: DataTransfer | null): Promise<boolean> {
  if (!dataTransfer || uploading.value) return false

  // 1. 优先从 items 中提取图片（支持截图软件、网页右键复制图片）
  const items = dataTransfer.items
  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          await uploadFile(file)
          return true
        }
      }
    }
  }

  // 2. 尝试从 files 中提取图片（支持操作系统文件管理器复制的文件）
  const files = dataTransfer.files
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        await uploadFile(file)
        return true
      }
    }
  }

  // 3. 尝试识别文本是否为图片网络链接
  const text = dataTransfer.getData('text')?.trim()
  if (text && (isImageUrl(text) || text.startsWith('/api/file/'))) {
    emit('update:modelValue', text)
    ElMessage.success('已应用剪贴板中的图片链接')
    return true
  }

  return false
}

/**
 * 容器自身 paste 事件（当通过 Tab 或聚焦在封面容器上时）
 */
async function onContainerPaste(e: ClipboardEvent) {
  const handled = await processClipboardData(e.clipboardData)
  if (handled) {
    e.preventDefault()
    e.stopPropagation()
  }
}

/**
 * 全局 paste 事件监听（当鼠标悬停在封面区域上，且当前焦点不在其他输入框/编辑器时，按下 Ctrl+V 即可触发）
 */
async function onWindowPaste(e: ClipboardEvent) {
  // 如果焦点在其他文本输入框、文本域或富文本编辑器内，不干扰用户正在进行的输入操作
  const activeEl = document.activeElement as HTMLElement | null
  if (activeEl) {
    const tagName = activeEl.tagName.toUpperCase()
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || activeEl.isContentEditable) {
      // 若当前焦点正好在封面容器内，则仍然允许
      if (!containerRef.value || !containerRef.value.contains(activeEl)) {
        return
      }
    }
  }

  // 当鼠标悬浮在封面区域或者封面容器聚焦时响应
  const isTarget = isHovered.value || (containerRef.value && containerRef.value.contains(document.activeElement))
  if (isTarget) {
    const handled = await processClipboardData(e.clipboardData)
    if (handled) {
      e.preventDefault()
      e.stopPropagation()
    }
  }
}

/**
 * 点击「粘贴」按钮时，通过 Clipboard API 直接读取剪贴板
 */
async function pasteFromClipboard() {
  if (uploading.value) return

  try {
    if (!navigator.clipboard) {
      ElMessage.warning('当前环境不支持直接访问剪贴板，请将鼠标悬停在封面区域直接按 Ctrl+V 粘贴')
      return
    }

    // 1. 尝试直接读取图片 Blob（Chrome/Edge 等现代浏览器）
    if (typeof navigator.clipboard.read === 'function') {
      try {
        const clipboardItems = await navigator.clipboard.read()
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type)
              const ext = type.split('/')[1] || 'png'
              const file = new File([blob], `cover_${Date.now()}.${ext}`, { type })
              await uploadFile(file)
              return
            }
          }
        }
      } catch {
        // 权限或非安全上下文抛错时，降级尝试读取文本
      }
    }

    // 2. 尝试读取剪贴板文本
    if (typeof navigator.clipboard.readText === 'function') {
      const text = (await navigator.clipboard.readText()).trim()
      if (text && (isImageUrl(text) || text.startsWith('/api/file/'))) {
        emit('update:modelValue', text)
        ElMessage.success('已应用剪贴板中的图片链接')
        return
      }
    }

    ElMessage.info('剪贴板中未检测到图片或图片链接，请先截图或复制图片后按 Ctrl+V')
  } catch {
    ElMessage.warning('读取剪贴板失败，请将鼠标悬停在封面区域后直接按 Ctrl+V 粘贴')
  }
}

onMounted(() => {
  window.addEventListener('drop', resetDrag, true)
  window.addEventListener('dragend', resetDrag, true)
  window.addEventListener('dragleave', onWindowGlobalDragLeave)
  window.addEventListener('paste', onWindowPaste)
})

onUnmounted(() => {
  window.removeEventListener('drop', resetDrag, true)
  window.removeEventListener('dragend', resetDrag, true)
  window.removeEventListener('dragleave', onWindowGlobalDragLeave)
  window.removeEventListener('paste', onWindowPaste)
})

async function onDrop(e: DragEvent) {
  resetDrag()
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  await uploadFile(files[0])
}

function triggerSelect() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

async function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadFile(file)
  }
  target.value = ''
}

function validateFile(file: File): boolean {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB！')
    return false
  }
  return true
}

async function uploadFile(file: File) {
  if (!validateFile(file)) return

  uploading.value = true
  try {
    const result = await uploadImage(file)
    emit('update:modelValue', result.url)
    ElMessage.success('封面上传成功')
  } catch {
    ElMessage.error('封面上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

function handleRemove() {
  emit('update:modelValue', '')
  ElMessage.info('已移除封面')
}
</script>

<style scoped>
.cover-upload-container {
  max-width: 100%;
}
</style>
