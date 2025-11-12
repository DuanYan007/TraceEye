import request from '@/utils/request'
import type { SecurityAlert, AlertStatistics, PaginationResponse } from '@/types'

export const alertApi = {
  getAlerts: (params?: any): Promise<PaginationResponse<SecurityAlert>> => {
    return request.get('/alerts', { params })
  },

  getStatistics: (): Promise<AlertStatistics> => {
    return request.get('/alerts/statistics')
  },

  updateAlertStatus: (id: string, status: string): Promise<void> => {
    return request.put(`/alerts/${id}`, { status })
  }
}