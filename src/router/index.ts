import { createRouter, createWebHistory } from 'vue-router'
import { buildJourneyUrl, hasStoredRole, redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/settings'
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' }
    },
    {
      path: '/logs',
      name: 'Logs',
      component: () => import('@/pages/LogsPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' }
    },
    {
      path: '/config',
      name: 'Config',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    const base = import.meta.env.BASE_URL
    const routePath = to.fullPath === '/' ? '' : to.fullPath.replace(/^\//, '')
    redirectToIdpLogin(`${window.location.origin}${base}${routePath}`)
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


