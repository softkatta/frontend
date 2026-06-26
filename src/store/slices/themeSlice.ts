import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

const stored = (localStorage.getItem('theme') as Theme) || 'system'

const initialState: ThemeState = {
  theme: stored,
  resolvedTheme: resolveTheme(stored),
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
      state.resolvedTheme = resolveTheme(action.payload)
      localStorage.setItem('theme', action.payload)
      document.documentElement.classList.toggle('dark', state.resolvedTheme === 'dark')
    },
    initTheme: (state) => {
      document.documentElement.classList.toggle('dark', state.resolvedTheme === 'dark')
    },
  },
})

export const { setTheme, initTheme } = themeSlice.actions
export default themeSlice.reducer
