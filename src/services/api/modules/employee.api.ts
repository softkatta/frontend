import { api } from '../wrapper'

export type LeavePayload = {
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  attachment?: File
}

export type AttendancePayload = {
  work_date: string
  check_in?: string
  check_out?: string
  work_mode?: string
  notes?: string
}

export type ResignationPayload = {
  resignation_date: string
  last_working_day?: string
  reason: string
  resignation_letter?: File
}

export type TaskPayload = {
  title: string
  description?: string
  status?: string
  priority?: string
  due_date?: string | null
}

export type ProjectPayload = {
  name: string
  description?: string
  status?: string
  role?: string
  progress?: number
  start_date?: string | null
  end_date?: string | null
}

export type TimesheetPayload = {
  work_date: string
  hours: number
  project_label?: string
  employee_project_id?: number | null
  status?: string
  notes?: string
}

export type CalendarEventPayload = {
  title: string
  description?: string
  event_type?: string
  all_day?: boolean
  starts_at: string
  ends_at?: string | null
  location?: string
  color?: string
}

export const employeeApi = {
  dashboard: () => api.get<unknown>('/employee/dashboard'),
  profile: {
    get: () => api.get<unknown>('/employee/profile'),
    update: (payload: { phone?: string; emergency_contact?: Record<string, string> }) =>
      api.patch<unknown>('/employee/profile', payload),
  },
  documents: {
    list: () => api.get<unknown>('/employee/documents'),
    upload: (formData: FormData) => api.post<unknown>('/employee/documents', formData),
    download: (documentId: string) =>
      api.get<{ download_url: string; original_name: string }>(`/employee/documents/${documentId}/download`),
  },
  leave: {
    list: () => api.get<unknown>('/employee/leave'),
    apply: (payload: LeavePayload) => {
      const formData = new FormData()
      formData.append('leave_type', payload.leave_type)
      formData.append('start_date', payload.start_date)
      formData.append('end_date', payload.end_date)
      formData.append('reason', payload.reason)
      if (payload.attachment) formData.append('attachment', payload.attachment)
      return api.post<unknown>('/employee/leave', formData)
    },
    cancel: (id: string) => api.post<unknown>(`/employee/leave/${id}/cancel`),
  },
  attendance: {
    list: (month?: string) => api.get<unknown>('/employee/attendance', { params: month ? { month } : undefined }),
    submit: (payload: AttendancePayload) => api.post<unknown>('/employee/attendance', payload),
  },
  tasks: {
    list: (params?: { status?: string; priority?: string }) =>
      api.get<unknown>('/employee/tasks', { params }),
    create: (payload: TaskPayload) => api.post<unknown>('/employee/tasks', payload),
    update: (id: string | number, payload: Partial<TaskPayload>) =>
      api.put<unknown>(`/employee/tasks/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/employee/tasks/${id}`),
  },
  projects: {
    list: (params?: { status?: string }) =>
      api.get<unknown>('/employee/projects', { params }),
    create: (payload: ProjectPayload) => api.post<unknown>('/employee/projects', payload),
    update: (id: string | number, payload: Partial<ProjectPayload>) =>
      api.put<unknown>(`/employee/projects/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/employee/projects/${id}`),
  },
  timesheets: {
    list: (params?: { month?: string; status?: string }) =>
      api.get<unknown>('/employee/timesheets', { params }),
    create: (payload: TimesheetPayload) => api.post<unknown>('/employee/timesheets', payload),
    update: (id: string | number, payload: Partial<TimesheetPayload>) =>
      api.put<unknown>(`/employee/timesheets/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/employee/timesheets/${id}`),
  },
  calendar: {
    list: (params?: { month?: string; from?: string; to?: string; event_type?: string }) =>
      api.get<unknown>('/employee/calendar', { params }),
    create: (payload: CalendarEventPayload) => api.post<unknown>('/employee/calendar', payload),
    update: (id: string | number, payload: Partial<CalendarEventPayload>) =>
      api.put<unknown>(`/employee/calendar/${id}`, payload),
    delete: (id: string | number) => api.delete<null>(`/employee/calendar/${id}`),
  },
  announcements: {
    list: () => api.get<unknown>('/employee/announcements'),
    get: (id: string | number) => api.get<unknown>(`/employee/announcements/${id}`),
    markRead: (id: string | number) => api.post<unknown>(`/employee/announcements/${id}/read`),
  },
  assets: {
    list: () => api.get<unknown>('/employee/assets'),
    get: (id: string | number) => api.get<unknown>(`/employee/assets/${id}`),
  },
  training: {
    list: (params?: { status?: string }) => api.get<unknown>('/employee/training', { params }),
    get: (id: string | number) => api.get<unknown>(`/employee/training/${id}`),
    update: (id: string | number, payload: { status?: string; completion_percent?: number }) =>
      api.put<unknown>(`/employee/training/${id}`, payload),
  },
  performance: {
    list: () => api.get<unknown>('/employee/performance'),
    get: (id: string | number) => api.get<unknown>(`/employee/performance/${id}`),
    acknowledge: (id: string | number, payload?: { employee_comments?: string | null }) =>
      api.post<unknown>(`/employee/performance/${id}/acknowledge`, payload ?? {}),
  },
  helpdesk: {
    list: (params?: { status?: string }) => api.get<unknown>('/employee/helpdesk', { params }),
    get: (id: string | number) => api.get<unknown>(`/employee/helpdesk/${id}`),
    create: (payload: { subject: string; description: string; category?: string; priority?: string }) =>
      api.post<unknown>('/employee/helpdesk', payload),
    update: (id: string | number, payload: unknown) => api.put<unknown>(`/employee/helpdesk/${id}`, payload),
  },
  resignation: {
    get: () => api.get<unknown>('/employee/resignation'),
    submit: (payload: ResignationPayload) => {
      const formData = new FormData()
      formData.append('resignation_date', payload.resignation_date)
      if (payload.last_working_day) formData.append('last_working_day', payload.last_working_day)
      formData.append('reason', payload.reason)
      if (payload.resignation_letter) formData.append('resignation_letter', payload.resignation_letter)
      return api.post<unknown>('/employee/resignation', formData)
    },
  },
}
