<template>
  <SkyCurtain />
  <router-view />
  <template v-if="!isLoginPage">
    <AgentPetWidget />
    <AgentChatDrawer />
  </template>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import SkyCurtain from './components/SkyCurtain.vue'
import AgentPetWidget from './components/agent/AgentPetWidget.vue'
import AgentChatDrawer from './components/agent/AgentChatDrawer.vue'
import { useAgentStore } from './store/agent'

const route = useRoute()
const agentStore = useAgentStore()

const isLoginPage = computed(() => route.path === '/login')

watch(
  () => route.path,
  (newPath) => {
    // 仅针对前台普通页面执行冷启动/翻页被动感知（受前端防抖与后端3分钟冷却双重约束）
    if (!newPath.startsWith('/admin') && newPath !== '/login' && !newPath.startsWith('/article/')) {
      const scene = newPath === '/' ? 'HOME' : newPath.replace('/', '').toUpperCase()
      agentStore.triggerPageEnter(scene)
    }
  },
  { immediate: true },
)
</script>

<style>
/* 全局样式已在 main.css 中，这里可以保持空白 */
</style>
