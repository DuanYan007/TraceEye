export interface APTOrganization {
  id: string
  name: string
  aliases: string[]
  country: string
  description: string
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  lastSeen: string
  attackPatterns: string[]
  malwares: string[]
  indicators: ThreatIndicator[]
}

export interface ThreatIndicator {
  id: string
  type: 'ip' | 'domain' | 'hash' | 'url'
  value: string
  confidence: number
  description: string
}

export interface APTSearchFilters {
  name?: string
  country?: string
  threatLevel?: string
  page?: number
  pageSize?: number
}