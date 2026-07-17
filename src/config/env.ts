const apiHostname = (import.meta.env.VITE_API_HOSTNAME ?? '').replace(/\/$/, '')
const apiBasePath = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const appEnv = import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE
export const appName = import.meta.env.VITE_APP_NAME ?? 'SoftKatta Solutions'

/** Public website origin for SEO canonical URLs */
export function getSiteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://softkatta.in'
}

/** Full API base URL — uses hostname in staging/production, relative path in local dev. */
export function getApiBaseUrl(): string {
  const path = apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`
  return apiHostname ? `${apiHostname}${path}` : path
}

export function getApiHostname(): string {
  return apiHostname
}
