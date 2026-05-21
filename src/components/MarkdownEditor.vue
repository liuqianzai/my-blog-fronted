<template>
  <MdEditor
    v-model="content"
    :theme="theme"
    :preview="true"
    :toolbars="toolbars"
    @onUploadImg="handleUploadImg"
    @onChange="handleChange"
    style="height: 500px"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MdEditor, type ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadImage } from '../api/file'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

const content = ref(props.modelValue)
const theme = ref<'light' | 'dark'>('light')

const toolbars: ToolbarNames[] = [
  'bold', 'underline', 'italic', 'strikeThrough', '-',
  'title', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-',
  'codeRow', 'code', 'link', 'image', 'table', '-',
  'revoke', 'next', 'save', '=', 'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog'
]

watch(() => props.modelValue, (val) => {
  if (val !== content.value) {
    content.value = val
  }
})

function handleChange(value: string) {
  emit('update:modelValue', value)
}

async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  const urls = await Promise.all(
    files.map(async (file) => {
      const result = await uploadImage(file)
      return result.url
    })
  )
  callback(urls)
}
</script>
