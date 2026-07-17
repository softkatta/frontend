import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { clearSecureAuth, loadSecureAuth, saveSecureAuth } from '@/lib/secureStorage'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { authApi, isTwoFactorChallenge } from '@/services/api'
import { getPasskeyAuthentication } from '@/lib/webauthnClient'
import type { LoginCredentials, RegisterData, User } from '@/types'

interface AuthSliceState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
}

const initialState: AuthSliceState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
}

function normalizeUser(user: User): User {
  const role = String(user.role)
  if (role === 'super_admin') {
    return { ...user, role: 'admin' }
  }
  if (role === 'hr_manager') {
    return { ...user, role: 'hr' }
  }
  return user
}

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const session = await loadSecureAuth()
  if (!session?.accessToken) return null

  // Always refresh /auth/me so portal menus & permissions pick up server changes
  // without requiring a full logout. Fall back to cached user if the request fails.
  try {
    const user = await authApi.me()
    await saveSecureAuth({
      user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    })

    return {
      user: normalizeUser(user),
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? undefined,
    }
  } catch {
    // Re-read storage in case a login completed while /auth/me was in flight.
    const latest = await loadSecureAuth()
    if (latest?.accessToken && latest.user) {
      return {
        user: normalizeUser(latest.user as User),
        accessToken: latest.accessToken,
        refreshToken: latest.refreshToken ?? undefined,
      }
    }
    if (session.user) {
      return {
        user: normalizeUser(session.user as User),
        accessToken: session.accessToken,
        refreshToken: session.refreshToken ?? undefined,
      }
    }
    throw new Error('Session expired')
  }
})

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ credentials }: { credentials: LoginCredentials; redirectTo?: string }, { rejectWithValue }) => {
    try {
      const session = await authApi.login(credentials)

      if (isTwoFactorChallenge(session)) {
        return rejectWithValue({
          code: 'REQUIRES_2FA',
          challenge_token: session.challenge_token,
          methods: session.methods ?? ['authenticator'],
        })
      }

      const accessToken = session.access_token
      const refreshToken = session.refresh_token
      await saveSecureAuth({ user: session.user, accessToken, refreshToken })
      return {
        user: normalizeUser(session.user),
        accessToken,
        refreshToken,
      }
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Invalid email or password.'))
    }
  },
)

export const verifyPasskeyLogin = createAsyncThunk(
  'auth/verifyPasskey',
  async ({ challenge_token }: { challenge_token: string }, { rejectWithValue }) => {
    try {
      const options = await authApi.passkeyLoginOptions({ challenge_token })
      const assertion = await getPasskeyAuthentication(options)
      const session = await authApi.passkeyLoginVerify({ challenge_token, ...assertion })
      const accessToken = session.access_token
      const refreshToken = session.refresh_token
      await saveSecureAuth({ user: session.user, accessToken, refreshToken })
      return {
        user: normalizeUser(session.user),
        accessToken,
        refreshToken,
      }
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Passkey verification failed.'))
    }
  },
)

export const verifyPasskeyPrimaryLogin = createAsyncThunk(
  'auth/verifyPasskeyPrimary',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const options = await authApi.passkeyPrimaryLoginOptions({ email })
      const assertion = await getPasskeyAuthentication(options)
      const session = await authApi.passkeyPrimaryLoginVerify({
        challenge_token: options.challenge_token,
        ...assertion,
      })
      const accessToken = session.access_token
      const refreshToken = session.refresh_token
      await saveSecureAuth({ user: session.user, accessToken, refreshToken })
      return {
        user: normalizeUser(session.user),
        accessToken,
        refreshToken,
      }
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Passkey sign-in failed.'))
    }
  },
)

export const verify2faLogin = createAsyncThunk(
  'auth/verify2fa',
  async (
    { challenge_token, code, method = 'authenticator' }: {
      challenge_token: string
      code: string
      method?: 'authenticator' | 'email' | 'recovery'
    },
    { rejectWithValue },
  ) => {
    try {
      const session = await authApi.verify2fa({ challenge_token, code, method })
      const accessToken = session.access_token
      const refreshToken = session.refresh_token
      await saveSecureAuth({ user: session.user, accessToken, refreshToken })
      return {
        user: normalizeUser(session.user),
        accessToken,
        refreshToken,
      }
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Invalid authentication code.'))
    }
  },
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ data }: { data: RegisterData; redirectTo?: string }, { rejectWithValue }) => {
    try {
      const session = await authApi.register(data)
      const accessToken = session.access_token
      const refreshToken = session.refresh_token
      await saveSecureAuth({ user: session.user, accessToken, refreshToken })
      return {
        user: normalizeUser(session.user),
        accessToken,
        refreshToken,
      }
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Registration failed.'))
    }
  },
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } catch {
    // Clear local session even if API fails
  }
  clearSecureAuth()
})

export const fetchCurrentUser = createAsyncThunk('auth/me', async () => {
  const user = await authApi.me()
  const session = await loadSecureAuth()
  if (session?.accessToken) {
    await saveSecureAuth({
      user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    })
  }
  return normalizeUser(user)
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    clearAuthState: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.isHydrated = true
        if (action.payload) {
          state.user = action.payload.user
          state.isAuthenticated = true
        }
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.isLoading = false
        state.isHydrated = true
        // Only clear storage when hydrate truly failed without a usable session.
        // Avoid wiping a login that completed while /auth/me was still failing.
        if (!state.isAuthenticated) {
          clearSecureAuth()
        }
      })

    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isHydrated = true
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false
      })

    builder
      .addCase(verifyPasskeyLogin.pending, (state) => {
        state.isLoading = true
      })
      .addCase(verifyPasskeyLogin.fulfilled, (state, action) => {
        state.isLoading = false
        state.isHydrated = true
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(verifyPasskeyLogin.rejected, (state) => {
        state.isLoading = false
      })

    builder
      .addCase(verifyPasskeyPrimaryLogin.pending, (state) => {
        state.isLoading = true
      })
      .addCase(verifyPasskeyPrimaryLogin.fulfilled, (state, action) => {
        state.isLoading = false
        state.isHydrated = true
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(verifyPasskeyPrimaryLogin.rejected, (state) => {
        state.isLoading = false
      })

    builder
      .addCase(verify2faLogin.pending, (state) => {
        state.isLoading = true
      })
      .addCase(verify2faLogin.fulfilled, (state, action) => {
        state.isLoading = false
        state.isHydrated = true
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(verify2faLogin.rejected, (state) => {
        state.isLoading = false
      })

    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isHydrated = true
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(registerUser.rejected, (state) => {
        state.isLoading = false
      })

    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
      })

    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    })
  },
})

export const { setUser, clearAuthState } = authSlice.actions
export default authSlice.reducer
