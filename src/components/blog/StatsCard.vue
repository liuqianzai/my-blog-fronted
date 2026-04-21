<template>
  <div class="glass-card rounded-2xl p-6">
    <h3 class="text-sm font-bold mb-4 flex items-center">📊 站点统计</h3>
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">已运行</span>
        <span class="text-sm font-mono font-bold text-primary">{{ runDays }} Days</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">总字数</span>
        <span class="text-sm font-mono font-bold">12.4k</span>
      </div>
      <div class="pt-2">
        <div class="text-[10px] text-gray-400 mb-1">今日 Coding 活跃度</div>
        <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary animate-[slide_3s_ease-in-out_infinite]" style="width: 70%"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 简单计算一下从建站到现在的天数
const runDays = Math.floor((new Date().getTime() - new Date('2026-01-01').getTime()) / (1000 * 60 * 60 * 24))
</script>

<style scoped>
@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(150%); }
}
</style>
