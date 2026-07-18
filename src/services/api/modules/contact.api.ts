import { api } from '../wrapper'

export type ContactPayload = {
  name: string
  email: string
  phone?: string
  company?: string
  subject?: string
  message: string
  recaptcha_token?: string
}

export const contactApi = {
  submit: (payload: ContactPayload) => api.post<null>('/contact', payload, { skipAuth: true }),
}
