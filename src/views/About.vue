<template>
  <div class="about-page">
    <h1>关于我</h1>
    <div class="about-content" v-html="aboutContent"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadConfigs, getConfigValue } from '../utils/config'
import { renderMarkdown } from '../utils/markdown'

const aboutContent = ref('')

onMounted(async () => {
  await loadConfigs()
  const md = getConfigValue('about_content')
  // 如果配置为空，使用默认内容
  aboutContent.value = md 
    ? renderMarkdown(md) 
    : renderMarkdown('## 你好 👋\n\n这是关于我页面，可以在管理后台的系统配置中修改内容。\n\n配置项：`about_content`')
})
</script>

<style scoped>
.about-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 0;
}

.about-page h1 {
  font-size: 2rem;
  font-weight: 850;
  color: var(--ink, #172033);
  margin-bottom: 28px;
}

.about-content {
  line-height: 1.9;
  color: var(--muted, #68758a);
}

.about-content :deep(h2) {
  color: var(--ink, #172033);
  font-size: 1.5rem;
  font-weight: 800;
  margin: 2em 0 1em;
}

.about-content :deep(h3) {
  color: var(--ink, #172033);
  font-size: 1.2rem;
  font-weight: 700;
  margin: 1.5em 0 0.8em;
}

.about-content :deep(p) {
  margin: 1em 0;
}

.about-content :deep(a) {
  color: var(--blue, #315fbd);
  text-decoration: none;
}

.about-content :deep(a:hover) {
  text-decoration: underline;
}

.about-content :deep(img) {
  max-width: 100%;
  border-radius: 12px;
  margin: 1em 0;
}

.about-content :deep(code) {
  background: rgba(49, 95, 189, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.about-content :deep(pre) {
  background: rgba(49, 95, 189, 0.06);
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1em 0;
}

.about-content :deep(pre code) {
  background: none;
  padding: 0;
}

.about-content :deep(ul),
.about-content :deep(ol) {
  padding-left: 1.5em;
  margin: 1em 0;
}

.about-content :deep(li) {
  margin: 0.5em 0;
}

.about-content :deep(blockquote) {
  border-left: 4px solid var(--blue, #315fbd);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--muted, #68758a);
}
</style>
