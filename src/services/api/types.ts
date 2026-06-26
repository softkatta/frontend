import type { AxiosRequestConfig } from 'axios'

export interface ApiSuccessResponse<T = unknown> {
  success: true
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status = 400, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export type ApiRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}
