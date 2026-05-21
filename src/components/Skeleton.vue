<template>
  <div class="skeleton" :class="{ 'skeleton--avatar': avatar }">
    <div v-if="avatar" class="skeleton-avatar"></div>
    <div class="skeleton-content">
      <div v-for="i in lines" :key="i" class="skeleton-line" :style="{ width: i === lines ? '60%' : '100%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  lines?: number
  avatar?: boolean
}>(), {
  lines: 3,
  avatar: false
})
</script>

<style scoped>
.skeleton {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>