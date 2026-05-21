<template>
  <el-upload
    class="cover-upload"
    :action="''"
    :http-request="handleUpload"
    :show-file-list="false"
    :before-upload="beforeUpload"
    accept="image/*"
  >
    <img v-if="modelValue" :src="modelValue" class="cover-preview" />
    <div v-else class="cover-placeholder">
      <el-icon class="text-2xl text-gray-400"><Plus /></el-icon>
      <span class="text-xs text-gray-400 mt-1">点击上传封面</span>
    </div>
  </el-upload>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '../api/file'

defineProps<{ modelValue: string }>()
const emit = defineEmits(['update:modelValue'])

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

async function handleUpload(options: any) {
  try {
    const result = await uploadImage(options.file)
    emit('update:modelValue', result.url)
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}
</script>

<style scoped>
.cover-upload {
  width: 200px;
  height: 120px;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.cover-placeholder:hover {
  border-color: #409eff;
}
</style>
