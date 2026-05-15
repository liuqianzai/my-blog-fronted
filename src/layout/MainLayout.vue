<template>
  <div class="min-h-screen bg-background">
    <NavBar />
    <div class="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 to-purple-500 z-[60] transition-all duration-100"
         :style="{ width: scrollPercent + '%' }"></div>
    <main class="container mx-auto px-4 pt-28 pb-12">
      <router-view></router-view>
    </main>

    <footer class="py-8 text-center text-text-sub text-sm border-t border-gray-100">
      © 2026 Liu Yang's Blog · Powered by Spring Boot & Vue 3
    </footer>
  </div>
</template>

<script setup lang="ts">
import NavBar from '../components/NavBar.vue'
import { ref, onMounted, onUnmounted } from 'vue'
const scrollPercent = ref(0)

const updateScroll = () => {
  const winScroll = document.documentElement.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  scrollPercent.value = height > 0 ? (winScroll / height) * 100 : 0
}

onMounted(() => window.addEventListener('scroll', updateScroll))
onUnmounted(() => window.removeEventListener('scroll', updateScroll))
</script>
