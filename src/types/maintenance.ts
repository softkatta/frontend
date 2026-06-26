export type MaintenancePageType = 'launch' | 'maintenance'

export type MaintenancePageContent = {
  enabled: boolean
  pageType: MaintenancePageType
  badge: string
  message: string
  imageUrl?: string
  logoUrl?: string
  companyName: string
  companyTagline: string
}

export const EMPTY_MAINTENANCE_CONTENT: MaintenancePageContent = {
  enabled: false,
  pageType: 'launch',
  badge: '',
  message: '',
  companyName: '',
  companyTagline: '',
}
