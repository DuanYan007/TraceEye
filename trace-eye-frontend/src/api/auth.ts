import request from '@/utils/request'
import type { LoginCredentials, LoginResponse } from '@/types/user'

export const authApi = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> => {
    return request.post('/auth/login', credentials)
  },

  logout: (): Promise<void> => {
    return request.post('/auth/logout')
  },

  getProfile: (): Promise<any> => {
    return request.get('/auth/profile')
  }
}