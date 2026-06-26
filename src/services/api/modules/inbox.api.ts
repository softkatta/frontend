import { api } from '../wrapper'

export const inboxApi = {
  list: () => api.get<unknown[]>('/inbox/notifications'),
  markRead: (id: string | number) => api.post<unknown>(`/inbox/notifications/${id}/read`),
  markAllRead: () => api.post<unknown>('/inbox/notifications/read-all'),
}
