import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { getApiBaseUrl, getApiHostname } from '@/config/env'
import { clearSecureAuth, getAccessToken, loadSecureAuth, saveSecureAuth } from '@/lib/secureStorage'

const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000)
const ADMIN_WORKSPACE_STORAGE_KEY = 'softkatta.admin.workspace'

export type AdminWorkspaceMode = 'live' | 'demo'

export function getAdminWorkspaceMode(): AdminWorkspaceMode {
  if (typeof window === 'undefined') {
    return 'live'
  }

  const raw = String(window.localStorage.getItem(ADMIN_WORKSPACE_STORAGE_KEY) ?? '').trim().toLowerCase()
  if (raw === 'demo') {
    return raw
  }

  if (raw === 'all') {
    window.localStorage.setItem(ADMIN_WORKSPACE_STORAGE_KEY, 'live')
  }

  return 'live'
}

export function setAdminWorkspaceMode(mode: AdminWorkspaceMode): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ADMIN_WORKSPACE_STORAGE_KEY, mode)
}

type AuthAwareRequestConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  _retry?: boolean
}

let authLogoutHandler: (() => void) | null = null
let csrfCookiePromise: Promise<void> | null = null

export function registerAuthLogoutHandler(handler: () => void): void {
  authLogoutHandler = handler
}

function isPublicAuthRequest(config?: AuthAwareRequestConfig): boolean {
  if (!config) return false
  if (config.skipAuth) return true
  const url = config.url ?? ''
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')
}

async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  if (!csrfCookiePromise) {
    const csrfCookieUrl = getApiHostname()
      ? `${getApiHostname().replace(/\/$/, '')}/sanctum/csrf-cookie`
      : '/sanctum/csrf-cookie'

    csrfCookiePromise = axios.get(csrfCookieUrl, {
      withCredentials: true,
    }).then(() => undefined).catch((error) => {
      csrfCookiePromise = null
      throw error
    })
  }

  await csrfCookiePromise
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: REQUEST_TIMEOUT_MS,
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  client.interceptors.request.use(async (config) => {
    const authConfig = config as AuthAwareRequestConfig
    const requestUrl = String(config.url ?? '')

    if (isPublicAuthRequest(authConfig) && config.method === 'post') {
      await ensureCsrfCookie()
    }

    if (requestUrl.startsWith('/admin/') || requestUrl.includes('/admin/')) {
      const workspace = getAdminWorkspaceMode()

      if (config.params instanceof URLSearchParams) {
        config.params.set('workspace', workspace)
      } else {
        config.params = {
          ...(config.params as Record<string, unknown> | undefined),
          workspace,
        }
      }
    }

    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type']
        delete config.headers['content-type']
      }
    }

    if (config.headers?.['X-Skip-Auth']) {
      delete config.headers['X-Skip-Auth']
      authConfig.skipAuth = true
      return config
    }

    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as AuthAwareRequestConfig | undefined

      if (
        error.response?.status === 403
        && typeof window !== 'undefined'
      ) {
        const errors = error.response?.data?.errors
        const code = typeof errors === 'object' && errors !== null && 'code' in errors
          ? String(errors.code)
          : ''
        if (code === 'TWO_FACTOR_SETUP_REQUIRED') {
          if (
            window.location.pathname.startsWith('/admin')
            && !window.location.pathname.startsWith('/admin/security')
          ) {
            window.location.href = '/admin/security'
            return Promise.reject(error)
          }
          if (
            window.location.pathname.startsWith('/dashboard')
            && !window.location.pathname.startsWith('/dashboard/security')
          ) {
            window.location.href = '/dashboard/security'
            return Promise.reject(error)
          }
        }
      }

      if (
        error.response?.status === 401
        && typeof window !== 'undefined'
      ) {
        const errors = error.response?.data?.errors
        const code = typeof errors === 'object' && errors !== null && 'code' in errors
          ? String(errors.code)
          : ''
        if (code === 'SESSION_EXPIRED') {
          clearSecureAuth()
          authLogoutHandler?.()
          window.location.href = window.location.pathname.startsWith('/admin') ? '/admin' : '/login'
          return Promise.reject(error)
        }
      }

      if (
        error.response?.status === 401
        && originalRequest
        && !originalRequest._retry
        && !isPublicAuthRequest(originalRequest)
      ) {
        originalRequest._retry = true
        const session = await loadSecureAuth()

        if (session?.refreshToken) {
          try {
            const { data } = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
              refresh_token: session.refreshToken,
            })
            const accessToken = data.access_token ?? data.data?.access_token
            const refreshToken = data.refresh_token ?? data.data?.refresh_token ?? session.refreshToken
            await saveSecureAuth({ ...session, accessToken, refreshToken })
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return client(originalRequest)
          } catch {
            clearSecureAuth()
            authLogoutHandler?.()
            window.location.href = window.location.pathname.startsWith('/admin') ? '/admin' : '/login'
          }
        } else {
          clearSecureAuth()
          authLogoutHandler?.()
          window.location.href = window.location.pathname.startsWith('/admin') ? '/admin' : '/login'
        }
      }

      return Promise.reject(error)
    },
  )

  return client
}

export const apiClient = createApiClient()
