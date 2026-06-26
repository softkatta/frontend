import type { AxiosResponse } from 'axios'
import { apiClient } from './client'
import { ApiError, type ApiRequestConfig, type ApiSuccessResponse } from './types'

function unwrapResponse<T>(response: AxiosResponse<ApiSuccessResponse<T> | T>): T {
  const body = response.data
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as ApiSuccessResponse<T>).data
  }
  return body as T
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }
      message?: string
    }
    const status = axiosError.response?.status ?? 500
    const message = axiosError.response?.data?.message ?? axiosError.message ?? 'Request failed'
    return new ApiError(message, status, axiosError.response?.data?.errors)
  }

  return new ApiError(error instanceof Error ? error.message : 'Request failed', 500)
}

async function request<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
): Promise<T> {
  try {
    const headers = { ...(config?.headers ?? {}) }
    if (config?.skipAuth) {
      headers['X-Skip-Auth'] = '1'
    }

    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    const response = await apiClient.request<ApiSuccessResponse<T> | T>({
      ...config,
      skipAuth: config?.skipAuth,
      method,
      url,
      data,
      headers: isFormData ? { ...headers, 'Content-Type': undefined } : headers,
    } as ApiRequestConfig)

    if (config?.responseType === 'blob') {
      return response.data as T
    }

    return unwrapResponse<T>(response)
  } catch (error) {
    throw toApiError(error)
  }
}

export const api = {
  get: <T>(url: string, config?: ApiRequestConfig) => request<T>('get', url, undefined, config),
  post: <T>(url: string, data?: unknown, config?: ApiRequestConfig) => request<T>('post', url, data, config),
  put: <T>(url: string, data?: unknown, config?: ApiRequestConfig) => request<T>('put', url, data, config),
  patch: <T>(url: string, data?: unknown, config?: ApiRequestConfig) => request<T>('patch', url, data, config),
  delete: <T>(url: string, config?: ApiRequestConfig) => request<T>('delete', url, config?.data, config),
}

export { ApiError }
