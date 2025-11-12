export interface RouteRecord {
  path: string
  name: string
  component: () => Promise<any>
  meta?: {
    title?: string
    requiresAuth?: boolean
    icon?: string
  }
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  total?: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}