import { api } from '../wrapper'

export type CaptchaConfig = {
  enabled: boolean
  site_key: string
}

export type VisitTrackResult = {
  recorded: boolean
  today: number
  yesterday?: number
  month: number
  total?: number
}

export const siteApi = {
  captchaConfig: () => api.get<CaptchaConfig>('/site/captcha', { skipAuth: true }),
  trackVisit: (payload: { path: string; session_key?: string }) =>
    api.post<VisitTrackResult>('/site/visit', payload, { skipAuth: true }),
}
