import { defineStore } from 'pinia'
import type { APTOrganization, APTSearchFilters } from '@/types/apt'
import { aptApi } from '@/api/apt'

export const useAPTStore = defineStore('apt', {
  state: () => ({
    organizations: [] as APTOrganization[],
    currentAPT: null as APTOrganization | null,
    loading: false,
    searchFilters: {
      page: 1,
      pageSize: 10
    } as APTSearchFilters,
    total: 0
  }),

  getters: {
    getAPTById: (state) => (id: string) => {
      return state.organizations.find(apt => apt.id === id)
    },
    highThreatAPTs: (state) => {
      return state.organizations.filter(apt =>
        apt.threatLevel === 'high' || apt.threatLevel === 'critical'
      )
    }
  },

  actions: {
    async fetchOrganizations(filters?: Partial<APTSearchFilters>) {
      this.loading = true
      try {
        this.searchFilters = { ...this.searchFilters, ...filters }
        const response = await aptApi.getOrganizations(this.searchFilters)
        this.organizations = response.data
        this.total = response.total
      } finally {
        this.loading = false
      }
    },

    async fetchOrganizationById(id: string) {
      this.loading = true
      try {
        const response = await aptApi.getOrganizationById(id)
        this.currentAPT = response
        return response
      } finally {
        this.loading = false
      }
    },

    setSearchFilters(filters: Partial<APTSearchFilters>) {
      this.searchFilters = { ...this.searchFilters, ...filters }
    }
  }
})