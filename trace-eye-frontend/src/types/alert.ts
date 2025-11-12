export interface SecurityAlert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  status: 'new' | 'investigating' | 'resolved'
  aptOrganization?: string
  createdAt: string
  updatedAt: string
}

export interface AlertStatistics {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  new: number
  investigating: number
  resolved: number
}