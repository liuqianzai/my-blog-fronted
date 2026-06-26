import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', component: () => import('../views/home/Home.vue') },
        { path: 'article/:id', component: () => import('../views/article/ArticleDetail.vue') },
        { path: 'categories', component: () => import('../views/Categories.vue') },
        { path: 'archives', component: () => import('../views/Archives.vue') },
        { path: 'friends', component: () => import('../views/Friends.vue') },
        { path: 'page/:slug', component: () => import('../views/PageView.vue') },
      ],
    },
    {
      path: '/login',
      component: () => import('../views/login/Login.vue'),
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      redirect: '/admin/dashboard',
      children: [
        { path: 'dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
        { path: 'articles', component: () => import('../views/admin/AdminArticles.vue') },
        { path: 'articles/create', component: () => import('../views/admin/AdminArticleForm.vue') },
        { path: 'articles/:id/edit', component: () => import('../views/admin/AdminArticleForm.vue') },
        { path: 'categories', component: () => import('../views/admin/AdminCategories.vue') },
        { path: 'tags', component: () => import('../views/admin/AdminTags.vue') },
        { path: 'comments', component: () => import('../views/admin/AdminComments.vue') },
        { path: 'pages', component: () => import('../views/admin/AdminPages.vue') },
        { path: 'friend-links', component: () => import('../views/admin/AdminFriendLinks.vue') },
        { path: 'configs', component: () => import('../views/admin/AdminConfigs.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/NotFound.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (!to.path.startsWith('/admin') && to.path !== '/login') {
    return next()
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return next('/admin')
  }

  if (to.path.startsWith('/admin') && !auth.isAuthenticated) {
    return next('/login')
  }

  next()
})

router.afterEach(() => {
  if (!document.startViewTransition) return
  document.startViewTransition(async () => {
    await nextTick()
  })
})

export default router
