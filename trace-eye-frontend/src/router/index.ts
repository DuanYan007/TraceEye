import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecord } from '@/types'

const routes: RouteRecord[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login/index.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard/index.vue'),
        meta: {
          title: '首页',
          icon: 'House'
        }
      },
      {
        path: '/apt',
        name: 'APT',
        component: () => import('@/pages/APT/index.vue'),
        meta: {
          title: 'APT监测',
          icon: 'Monitor'
        }
      },
      {
        path: '/alerts',
        name: 'Alerts',
        component: () => import('@/pages/Alerts/index.vue'),
        meta: {
          title: '报警管理',
          icon: 'Bell'
        }
      },
      {
        path: '/logs',
        name: 'Logs',
        component: () => import('@/pages/Logs/index.vue'),
        meta: {
          title: '日志管理',
          icon: 'Document'
        }
      },
      {
        path: '/graph',
        name: 'AttackGraph',
        component: () => import('@/pages/AttackGraph/index.vue'),
        meta: {
          title: '攻击关系图',
          icon: 'Share'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router