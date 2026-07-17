import { api } from '../wrapper'

import { APPLICATION_DOCUMENTS } from '@/lib/hrConstants'

export type CareerOpening = {
  id: string | number
  title: string
  slug: string
  department?: string
  location?: string
  employment_type?: string
  experience_required?: string
  salary_display?: string
  excerpt?: string
  description?: string
  requirements?: string
  apply_email?: string
  apply_url?: string
  published_at?: string
}

export type JobApplicationPayload = {
  name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  current_address?: string
  permanent_address?: string
  qualification?: string
  skills?: string
  total_experience?: string
  current_company?: string
  current_salary?: string
  expected_salary?: string
  notice_period?: string
  preferred_location?: string
  message?: string
  resume?: File
} & Partial<Record<(typeof APPLICATION_DOCUMENTS)[number]['key'], File>>

export const careersApi = {
  list: () => api.get<CareerOpening[]>('/careers', { skipAuth: true }),
  get: (slug: string) => api.get<CareerOpening>(`/careers/${slug}`, { skipAuth: true }),
  apply: (slug: string, payload: JobApplicationPayload) => {
    const formData = new FormData()
    const scalarKeys = [
      'name', 'email', 'phone', 'date_of_birth', 'gender', 'current_address', 'permanent_address',
      'qualification', 'skills', 'total_experience', 'current_company', 'current_salary',
      'expected_salary', 'notice_period', 'preferred_location', 'message',
    ] as const

    for (const key of scalarKeys) {
      const value = payload[key]
      if (value !== undefined && value !== '') {
        formData.append(key, String(value))
      }
    }

    const fileKeys = APPLICATION_DOCUMENTS.map((doc) => doc.key)

    for (const key of fileKeys) {
      const file = payload[key]
      if (file) formData.append(key, file)
    }

    return api.post<null>(`/careers/${slug}/apply`, formData, { skipAuth: true })
  },
}
