import { registerAuthLogoutHandler } from '@/services/api'
import { store } from '@/store'
import { clearAuthState, hydrateAuth } from '@/store/slices/authSlice'

export async function bootstrapAuth(): Promise<void> {
  registerAuthLogoutHandler(() => {
    store.dispatch(clearAuthState())
  })

  await store.dispatch(hydrateAuth())
}
