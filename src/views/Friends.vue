<template>
  <div class="friends-page">
    <h1 class="page-title">友情链接</h1>
    <p class="page-desc">感谢以下朋友的博客和站点</p>

    <div v-if="loading" class="loading-state">加载中…</div>

    <div v-else class="friends-grid">
      <a
        v-for="link in links"
        :key="link.id"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="friend-card"
      >
        <img v-if="link.avatar" :src="link.avatar" class="friend-avatar" :alt="link.name" />
        <div v-else class="friend-avatar-placeholder">{{ link.name[0] }}</div>
        <div class="friend-info">
          <h3>{{ link.name }}</h3>
          <p v-if="link.description">{{ link.description }}</p>
        </div>
      </a>
    </div>

    <div v-if="!loading && !links.length" class="empty-state">暂无友链</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFriendLinks, type FriendLink } from '../api/friendLink'

const links = ref<FriendLink[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    links.value = await getFriendLinks()
  } catch {
    links.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.friends-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 0;
}

.page-title {
  font-size: 2rem;
  font-weight: 850;
  color: var(--ink, #172033);
}

.page-desc {
  margin-top: 8px;
  color: var(--muted, #68758a);
  font-size: 0.95rem;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.friend-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(105, 119, 141, 0.16);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.friend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(23, 32, 51, 0.08);
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  background: #eef4ff;
  flex-shrink: 0;
}

.friend-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #315fbd, #0f9f8f);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.friend-info h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink, #172033);
}

.friend-info p {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--muted, #68758a);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--muted, #68758a);
}
</style>
