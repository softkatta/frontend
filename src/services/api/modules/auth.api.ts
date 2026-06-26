import type { LoginCredentials, RegisterData, User } from '@/types'
import { api } from '../wrapper'

export type AuthSession = {
  user: User
  access_token: string
  refresh_token?: string
}

export type ProfileUpdatePayload = {
  name?: string
  email?: string
  phone?: string
  company_name?: string
  avatar?: string
}

export type ChangePasswordPayload = {
  current_password: string
  password: string
  password_confirmation: string
}

export type TwoFactorMethodName = 'authenticator' | 'email' | 'passkey'

export type PasskeyCredential = {
  id: string
  name: string
  last_used_at?: string
  created_at?: string
}

export type TwoFactorMethods = {
  authenticator: { enabled: boolean }
  email: { enabled: boolean }
  passkey: { enabled: boolean; credentials: PasskeyCredential[] }
}

export type LoginResponse =
  | AuthSession
  | {
      requires_2fa: true
      challenge_token: string
      methods?: TwoFactorMethodName[]
    }

export type PlatformSecurityPolicy = {
  allow_email_otp: boolean
  allow_authenticator: boolean
  allow_passkeys: boolean
  enforce_2fa_all: boolean
  enforce_2fa_roles: string[]
  enforce_2fa_admins: boolean
  enforce_2fa_clients: boolean
  allow_users_disable_2fa: boolean
  login_2fa_priority: string[]
}

export type TrustedDevice = {
  id: string
  device_name: string
  browser?: string
  platform?: string
  ip_address?: string
  last_login_at?: string
  expires_at?: string
}

export type SecurityStatus = {
  two_factor_enabled: boolean
  two_factor_type: 'none' | 'email' | 'authenticator' | 'passkey' | 'multiple'
  methods: TwoFactorMethods
  enabled_methods: TwoFactorMethodName[]
  platform_policy: PlatformSecurityPolicy
  can_disable_2fa: boolean
  force_two_factor: boolean
  can_disable_methods: {
    authenticator: boolean
    email: boolean
    passkey: boolean
  }
  enforce_2fa_required: boolean
  has_recovery_codes: boolean
  login_alerts_enabled: boolean
  last_login_at?: string
  trusted_devices: TrustedDevice[]
  security_setup_pending: boolean
  session_timeout_minutes: number
}

export type TwoFactorSetup = {
  secret: string
  qr_code_url: string
}

export type TwoFactorConfirmResult = {
  methods: TwoFactorMethods
  recovery_codes?: string[]
}

export type LoginIdentifyResult = {
  found: boolean
  passkey_only: boolean
  requires_password: boolean
  methods: TwoFactorMethodName[]
  challenge_token?: string | null
}

export type SecuritySession = {
  id: string
  name: string
  is_current: boolean
  last_used_at?: string
  created_at?: string
  expires_at?: string
}

function isTwoFactorChallenge(data: LoginResponse): data is {
  requires_2fa: true
  challenge_token: string
  methods?: TwoFactorMethodName[]
} {
  return 'requires_2fa' in data && data.requires_2fa === true
}

export { isTwoFactorChallenge }

export const authApi = {
  register: (payload: RegisterData) =>
    api.post<AuthSession>('/auth/register', payload, { skipAuth: true }),

  login: async (payload: LoginCredentials): Promise<LoginResponse> => {
    const data = await api.post<AuthSession & {
      requires_2fa?: boolean
      challenge_token?: string
      methods?: TwoFactorMethodName[]
    }>(
      '/auth/login',
      payload,
      { skipAuth: true },
    )

    if (data.requires_2fa && data.challenge_token) {
      return {
        requires_2fa: true,
        challenge_token: data.challenge_token,
        methods: data.methods ?? ['authenticator'],
      }
    }

    return data as AuthSession
  },

  identifyLogin: (payload: { email: string }) =>
    api.post<LoginIdentifyResult>('/auth/login/identify', payload, { skipAuth: true }),

  passkeyPrimaryLoginOptions: (payload: { email: string }) =>
    api.post<Record<string, unknown> & { challenge_token: string }>('/auth/login/passkey/options', payload, { skipAuth: true }),

  passkeyPrimaryLoginVerify: (payload: {
    challenge_token: string
    id: string
    clientDataJSON: string
    authenticatorData: string
    signature: string
    userHandle?: string | null
  }) => api.post<AuthSession>('/auth/login/passkey/verify', payload, { skipAuth: true }),

  verify2fa: (payload: { challenge_token: string; method: 'authenticator' | 'email' | 'recovery'; code: string }) =>
    api.post<AuthSession>('/auth/2fa/verify', payload, { skipAuth: true }),

  sendLoginEmailOtp: (payload: { challenge_token: string }) =>
    api.post<null>('/auth/2fa/email/send', payload, { skipAuth: true }),

  passkeyLoginOptions: (payload: { challenge_token: string }) =>
    api.post<Record<string, unknown>>('/auth/2fa/webauthn/options', payload, { skipAuth: true }),

  passkeyLoginVerify: (payload: {
    challenge_token: string
    id: string
    clientDataJSON: string
    authenticatorData: string
    signature: string
    userHandle?: string | null
  }) => api.post<AuthSession>('/auth/2fa/webauthn/verify', payload, { skipAuth: true }),

  logout: () => api.post<null>('/auth/logout'),

  me: () => api.get<User>('/auth/me'),

  updateProfile: (payload: ProfileUpdatePayload) => api.put<User>('/auth/profile', payload),

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post<User>('/auth/profile/avatar', formData)
  },

  changePassword: (payload: ChangePasswordPayload) => api.post<null>('/auth/change-password', payload),

  securityStatus: () => api.get<SecurityStatus>('/auth/security'),

  updateSecurityPreferences: (payload: { login_alerts_enabled: boolean }) =>
    api.put<{ login_alerts_enabled: boolean }>('/auth/security/preferences', payload),

  setupTwoFactor: () => api.post<TwoFactorSetup>('/auth/security/2fa/setup'),

  confirmTwoFactor: (payload: { code: string }) =>
    api.post<TwoFactorConfirmResult>('/auth/security/2fa/confirm', payload),

  disableTwoFactor: (payload: { password: string; code: string }) =>
    api.post<{ methods: TwoFactorMethods }>('/auth/security/2fa/disable', payload),

  sendEmail2faEnableOtp: () => api.post<null>('/auth/security/2fa/email/send'),

  confirmEmail2faEnable: (payload: { code: string }) =>
    api.post<{ methods: TwoFactorMethods }>('/auth/security/2fa/email/confirm', payload),

  sendEmail2faDisableOtp: () => api.post<null>('/auth/security/2fa/email/disable/send'),

  disableEmail2fa: (payload: { password: string; code: string }) =>
    api.post<{ methods: TwoFactorMethods }>('/auth/security/2fa/email/disable', payload),

  passkeyRegisterOptions: () => api.post<Record<string, unknown>>('/auth/security/webauthn/register/options'),

  passkeyRegisterVerify: (payload: {
    clientDataJSON: string
    attestationObject: string
    device_name?: string
  }) => api.post<{ methods: TwoFactorMethods }>('/auth/security/webauthn/register/verify', payload),

  disableAllPasskeys: (payload: { password: string }) =>
    api.post<{ methods: TwoFactorMethods }>('/auth/security/webauthn/disable', payload),

  deletePasskey: (credentialId: string, payload: { password: string }) =>
    api.delete<{ methods: TwoFactorMethods }>(`/auth/security/webauthn/credentials/${credentialId}`, {
      data: payload,
    }),

  listSessions: () => api.get<SecuritySession[]>('/auth/security/sessions'),

  revokeOtherSessions: () => api.post<null>('/auth/security/sessions/revoke'),

  skipSecuritySetup: () => api.post<null>('/auth/security/setup/skip'),
}
