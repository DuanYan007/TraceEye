import { defineStore } from 'pinia'
import type { SecurityAlert, AlertStatistics } from '@/types/alert'
import { alertApi } from '@/api/alert'

export const useAlertStore = defineStore('alert', {
  state: () => ({
    alerts: [] as SecurityAlert[],
    statistics: null as AlertStatistics | null,
    loading: false,
    unreadCount: 0
  }),

  getters: {
    criticalAlerts: (state) => {
      return state.alerts.filter(alert => alert.severity === 'critical')
    },
    newAlerts: (state) => {
      return state.alerts.filter(alert => alert.status === 'new')
    }
  },

  actions: {
    async fetchAlerts() {
      this.loading = true
      try {
        const response = await alertApi.getAlerts()
        this.alerts = response.data
        this.unreadCount = response.data.filter((alert: SecurityAlert) =>
          alert.status === 'new'
        ).length
      } finally {
        this.loading = false
      }
    },

    async fetchStatistics() {
      try {
        const response = await alertApi.getStatistics()
        this.statistics = response
      } catch (error) {
        console.error('Failed to fetch alert statistics:', error)
      }
    },

    async markAsRead(alertId: string) {
      try {
        await alertApi.updateAlertStatus(alertId, 'investigating')
        const alert = this.alerts.find(a => a.id === alertId)
        if (alert) {
          alert.status = 'investigating'
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (error) {
        console.error('Failed to mark alert as read:', error)
      }
    }
  }
})