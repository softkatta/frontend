import type { TwoFactorMethodName } from '@/services/api/modules/auth.api'

export type TwoFactorChallengePayload = {
  code: 'REQUIRES_2FA'
  challenge_token: string
  methods?: TwoFactorMethodName[]
}

export function isTwoFactorChallengePayload(payload: unknown): payload is TwoFactorChallengePayload {
  return (
    typeof payload === 'object'
    && payload !== null
    && 'code' in payload
    && (payload as TwoFactorChallengePayload).code === 'REQUIRES_2FA'
    && 'challenge_token' in payload
  )
}
