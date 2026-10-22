<template>
  <div
    class="cover-upload-container relative w-64 h-36 rounded-xl overflow-hidden select-none transition-all duration-200 group"
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
        class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 text-white"
      >
        <span class="text-xs font-medium flex items-center gap-1.5">
          <el-icon><Upload /></el-icon> 点击或拖拽替换封面
        </span>
        <button
          type="button"
          @click.stop="handleRemove"
          class="text-xs bg-red-500/80 hover:bg-red-600 text-white px-3 py-1 rounded-full transition flex items-center gap-1 shadow-sm"
        >
          <el-icon><Delete /></el-icon> 移除封面
        </button>
      </div>
    </div>

    <!-- 空白状态：引导点击或拖拽 -->
    <div v-else class="w-full h-full flex flex-col items-center justify-center p-3 text-center">
      <el-icon class="text-3xl text-gray-400 dark:text-gray-500 mb-1.5 group-hover:text-primary transition-colors">
        <Picture />
      </el-icon>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
        点击上传 或 拖拽图片至此
      </span>
      <span class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
        支持 JPG、PNG、WebP、GIF (最大 10MB)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Upload, Delete, Loading, Picture, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '../api/file'

defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
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

onMounted(() => {
  window.addEventListener('drop', resetDrag, true)
  window.addEventListener('dragend', resetDrag, true)
  window.addEventListener('dragleave', onWindowGlobalDragLeave)
})

onUnmounted(() => {
  window.removeEventListener('drop', resetDrag, true)
  window.removeEventListener('dragend', resetDrag, true)
  window.removeEventListener('dragleave', onWindowGlobalDragLeave)
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
