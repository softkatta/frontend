import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '@/types'

interface NotificationsState {
  items: Notification[]
  unreadCount: number
  isLoading: boolean
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload
      state.unreadCount = action.payload.filter((n) => !n.is_read).length
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload)
      if (!action.payload.is_read) state.unreadCount++
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload)
      if (notification && !notification.is_read) {
        notification.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => {
        n.is_read = true
      })
      state.unreadCount = 0
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setLoading,
} = notificationsSlice.actions
export default notificationsSlice.reducer
