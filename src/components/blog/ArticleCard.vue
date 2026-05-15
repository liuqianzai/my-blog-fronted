<template>
  <article class="article-card gradient-border-card ripple-card" tabindex="0">
    <div class="cover-wrap">
      <img :src="cover" class="cover-image" :alt="title" loading="lazy" />
      <div class="cover-overlay">
        <span>{{ date }}</span>
      </div>
    </div>

    <div class="card-body">
      <div class="tag-row">
        <span v-for="tag in tags" :key="tag">
          {{ tag }}
        </span>
      </div>

      <h3>{{ title }}</h3>
      <p>{{ summary }}</p>

      <div class="card-meta">
        <span>{{ views.toLocaleString() }} 阅读</span>
        <span>阅读全文</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  summary: string
  cover: string
  tags: string[]
  date: string
  views: number
}>()
</script>

<style scoped>
.article-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.gradient-border-card {
  border: 1px solid transparent;
  background:
    linear-gradient(rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.86)) padding-box,
    linear-gradient(135deg, rgba(37, 99, 235, 0.28), rgba(20, 184, 166, 0.22), rgba(245, 158, 11, 0.18)) border-box;
  backdrop-filter: blur(16px);
}

.article-card:hover,
.article-card:focus-visible {
  transform: translateY(-7px);
  box-shadow: 0 28px 64px rgba(15, 23, 42, 0.12);
  outline: none;
}

.article-card:focus-visible {
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.16), 0 28px 64px rgba(15, 23, 42, 0.12);
}

.cover-wrap {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 520ms ease, filter 520ms ease;
}

.article-card:hover .cover-image {
  transform: scale(1.055);
  filter: saturate(1.08);
}

.cover-overlay {
  position: absolute;
  left: 14px;
  bottom: 14px;
}

.cover-overlay span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  padding: 0 10px;
  color: #fff;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(12px);
  font-size: 0.72rem;
  font-weight: 800;
}

.card-body {
  padding: 22px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.tag-row span {
  border-radius: 999px;
  padding: 5px 10px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  font-size: 0.72rem;
  font-weight: 800;
}

h3 {
  display: -webkit-box;
  min-height: 3.25rem;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: #111827;
  font-size: 1.16rem;
  font-weight: 900;
  line-height: 1.42;
  transition: color 180ms ease;
}

.article-card:hover h3 {
  color: #2563eb;
}

p {
  display: -webkit-box;
  min-height: 4.55rem;
  margin-top: 10px;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.7;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 800;
}

.card-meta span:last-child {
  color: #14b8a6;
}

.ripple-card::after {
  content: '';
  position: absolute;
  inset: 50%;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  opacity: 0;
  transform: translate(-50%, -50%) scale(1);
}

.ripple-card:active::after {
  animation: card-ripple 520ms ease-out;
}

@keyframes card-ripple {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(48);
  }
}
</style>
