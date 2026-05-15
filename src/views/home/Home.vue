<template>
  <div class="essay-home">
    <header class="intro">
      <p class="intro-kicker">Liu Yang's Notes</p>
      <h1>写一点技术，也写一点正在发生的生活。</h1>
      <p class="intro-text">
        这里更像一本公开的随笔本：记录 3DGS、计算机视觉、全栈开发，也记录研究、项目和日常之间那些还没完全成形的想法。
      </p>
    </header>

    <div class="journal-layout">
      <main class="journal-feed" aria-label="随笔列表">
        <article v-for="note in notes" :key="note.title" class="note-entry">
          <div class="note-date">
            <span>{{ note.month }}</span>
            <strong>{{ note.day }}</strong>
          </div>

          <div class="note-content">
            <div class="note-meta">
              <span>{{ note.mood }}</span>
              <span>{{ note.readingTime }}</span>
            </div>
            <h2>{{ note.title }}</h2>
            <p>{{ note.summary }}</p>
            <div class="note-tags">
              <span v-for="tag in note.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </article>

        <div class="pagination-wrap">
          <el-pagination background layout="prev, pager, next" :total="50" />
        </div>
      </main>

      <aside class="quiet-aside" aria-label="个人信息">
        <section class="aside-panel profile-note">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=LiuYang" alt="Liu Yang avatar" />
          <div>
            <h2>刘洋</h2>
            <p>研究生。最近在看 3DGS、工业视觉和一些前后端工程化的小问题。</p>
          </div>
        </section>

        <section class="aside-panel">
          <p class="aside-title">最近在想</p>
          <ul class="thought-list">
            <li>怎样把论文复现写得更像一份实验日志</li>
            <li>个人博客如何从展示页变成知识索引</li>
            <li>轻量检测模型在真实部署里的取舍</li>
          </ul>
        </section>

        <section class="aside-panel">
          <p class="aside-title">常出现的词</p>
          <div class="soft-tags">
            <span v-for="tag in tags" :key="tag">{{ tag }}</span>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
const notes = [
  {
    month: 'Apr',
    day: '21',
    mood: '工程手记',
    readingTime: '约 8 分钟',
    title: 'Spring Boot 3.0 与 Vue 3 全栈开发实战指南',
    summary: '整理一次从接口设计、页面组织到构建优化的过程。很多问题看起来是框架问题，最后其实都是边界和习惯的问题。',
    tags: ['Java', 'Vue3', '全栈'],
  },
  {
    month: 'Apr',
    day: '16',
    mood: '研究笔记',
    readingTime: '约 10 分钟',
    title: '3D Gaussian Splatting 论文阅读与实验笔记',
    summary: '复现一篇论文的时候，最有价值的往往不是跑通结果，而是记录每个“不确定”的地方，以及后来怎么理解它。',
    tags: ['3DGS', 'CV', '论文'],
  },
  {
    month: 'Apr',
    day: '10',
    mood: '实验复盘',
    readingTime: '约 6 分钟',
    title: '工业缺陷检测中的轻量化模型设计思路',
    summary: '小目标、细长缺陷、推理速度和部署环境经常互相拉扯。这里记录一些模型设计时真实会遇到的取舍。',
    tags: ['深度学习', '检测', '部署'],
  },
  {
    month: 'Apr',
    day: '02',
    mood: '前端随想',
    readingTime: '约 5 分钟',
    title: '从博客项目看前端组件的可复用设计',
    summary: '一个博客页面其实足够暴露很多问题：信息层级、组件边界、样式变量、空状态，以及以后会不会想改。',
    tags: ['UI', 'Tailwind', '组件'],
  },
]

const tags = ['3DGS', 'CV', 'Vue3', 'Spring Boot', '实验记录', '随笔', 'Docker']
</script>

<style scoped>
.essay-home {
  --paper: rgba(255, 255, 255, 0.72);
  --paper-strong: rgba(255, 255, 255, 0.88);
  --ink: #172033;
  --muted: #68758a;
  --soft-line: rgba(105, 119, 141, 0.16);
  --blue: #315fbd;
  --tea: #0f9f8f;
  max-width: 1120px;
  margin: 0 auto;
}

.intro {
  max-width: 760px;
  padding: 36px 0 42px;
  animation: fade-up 520ms ease both;
}

.intro-kicker {
  color: var(--blue);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.intro h1 {
  margin-top: 18px;
  color: var(--ink);
  font-size: clamp(2.2rem, 6vw, 4.6rem);
  font-weight: 850;
  line-height: 1.08;
}

.intro-text {
  max-width: 660px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 1.03rem;
  line-height: 1.95;
}

.journal-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 56px;
  align-items: start;
}

.journal-feed {
  display: flex;
  flex-direction: column;
}

.note-entry {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 24px;
  padding: 28px 0;
  border-top: 1px solid var(--soft-line);
  animation: fade-up 560ms ease both;
}

.note-entry:last-of-type {
  border-bottom: 1px solid var(--soft-line);
}

.note-date {
  position: sticky;
  top: 108px;
  width: 58px;
  height: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(49, 95, 189, 0.14);
  border-radius: 18px;
  background: var(--paper);
  box-shadow: 0 16px 36px rgba(23, 32, 51, 0.06);
  backdrop-filter: blur(16px);
}

.note-date span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.note-date strong {
  color: var(--ink);
  font-size: 1.45rem;
  line-height: 1;
}

.note-content {
  position: relative;
  padding: 24px;
  border: 1px solid transparent;
  border-radius: 24px;
  background:
    linear-gradient(var(--paper-strong), var(--paper-strong)) padding-box,
    linear-gradient(135deg, rgba(49, 95, 189, 0.20), rgba(15, 159, 143, 0.10), rgba(255, 255, 255, 0.28)) border-box;
  box-shadow: 0 18px 44px rgba(23, 32, 51, 0.055);
  backdrop-filter: blur(18px);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.note-content:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 58px rgba(23, 32, 51, 0.09);
}

.note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.note-meta span + span::before {
  content: '/';
  margin-right: 10px;
  color: rgba(104, 117, 138, 0.55);
}

.note-content h2 {
  margin-top: 12px;
  color: var(--ink);
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 850;
  line-height: 1.35;
}

.note-content p {
  margin-top: 12px;
  color: var(--muted);
  line-height: 1.9;
}

.note-tags,
.soft-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.note-tags {
  margin-top: 18px;
}

.note-tags span,
.soft-tags span {
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--blue);
  background: rgba(49, 95, 189, 0.08);
  font-size: 0.76rem;
  font-weight: 750;
}

.quiet-aside {
  position: sticky;
  top: 108px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aside-panel {
  border: 1px solid var(--soft-line);
  border-radius: 24px;
  padding: 20px;
  background: var(--paper);
  box-shadow: 0 18px 44px rgba(23, 32, 51, 0.045);
  backdrop-filter: blur(18px);
}

.profile-note {
  display: flex;
  gap: 14px;
}

.profile-note img {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 18px;
  background: #eef4ff;
}

.profile-note h2 {
  color: var(--ink);
  font-size: 1rem;
  font-weight: 850;
}

.profile-note p,
.thought-list {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.75;
}

.aside-title {
  margin-bottom: 12px;
  color: var(--ink);
  font-size: 0.88rem;
  font-weight: 850;
}

.thought-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 18px;
}

.thought-list li::marker {
  color: var(--tea);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 32px 0 8px;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .essay-home * {
    animation: none !important;
    transition: none !important;
  }
}

@media (max-width: 980px) {
  .journal-layout {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .quiet-aside {
    position: static;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .intro {
    padding-top: 20px;
  }

  .note-entry {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 22px 0;
  }

  .note-date {
    position: static;
    width: auto;
    height: auto;
    flex-direction: row;
    justify-content: flex-start;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 999px;
  }

  .note-date strong {
    font-size: 0.82rem;
  }

  .note-content {
    padding: 20px;
    border-radius: 20px;
  }

  .quiet-aside {
    grid-template-columns: 1fr;
  }
}
</style>
