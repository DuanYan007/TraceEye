import { defineStore } from 'pinia'
import type { User, LoginCredentials, LoginResponse } from '@/types/user'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || '',
    permissions: [] as string[],
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    hasPermission: (state) => (permission: string) => {
      return state.permissions.includes(permission)
    }
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true
      try {
        const response = await authApi.login(credentials) as LoginResponse
        this.user = response.user
        this.token = response.token
        this.permissions = response.user.permissions

        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        return response
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = ''
      this.permissions = []

      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    initAuth() {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')

      if (token && userStr) {
        this.token = token
        try {
          this.user = JSON.parse(userStr)
          this.permissions = this.user.permissions || []
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error)
          this.logout()
        }
      }
    }
  }
})