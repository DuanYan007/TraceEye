import request from '@/utils/request'
import type { APTOrganization, APTSearchFilters, PaginationResponse } from '@/types'

export const aptApi = {
  getOrganizations: (filters?: APTSearchFilters): Promise<PaginationResponse<APTOrganization>> => {
    return request.get('/apt/organizations', { params: filters })
  },

  getOrganizationById: (id: string): Promise<APTOrganization> => {
    return request.get(`/apt/organizations/${id}`)
  },

  searchOrganizations: (keyword: string): Promise<APTOrganization[]> => {
    return request.get('/apt/organizations/search', { params: { keyword } })
  }
}