const apiHostname = (import.meta.env.VITE_API_HOSTNAME ?? '').replace(/\/$/, '')
const apiBasePath = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const appEnv = import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE
export const appName = import.meta.env.VITE_APP_NAME ?? 'SoftKatta Solutions'
export const isProduction = appEnv === 'production' || import.meta.env.PROD

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

  // Production/staging builds must call the API host explicitly. Relative /api/v1 on the
  // SPA domain (softkatta.in) causes auth/CORS failures and fake "logged out" redirects.
  if (!apiHostname && isProduction) {
    console.error(
      '[SoftKatta] VITE_API_HOSTNAME is missing in production. Set it to https://api.softkatta.in before building.',
    )
  }

  return apiHostname ? `${apiHostname}${path}` : path
}

export function getApiHostname(): string {
  return apiHostname
}
