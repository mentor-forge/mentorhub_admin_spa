import { createRouter, createWebHistory } from 'vue-router'
import { buildJourneyUrl, hasStoredRole, redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/admin'
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    redirectToIdpLogin(window.location.origin + to.fullPath)
    next(false)
    return
  }

  const requiredRole = to.meta.requiresRole as string | undefined
  if (requiredRole && !hasStoredRole(requiredRole)) {
    window.location.replace(buildJourneyUrl('discovery', ''))
    next(false)
    return
  }

  next()
})

router.afterEach(() => {
  document.title = 'Admin'
})

export default router

