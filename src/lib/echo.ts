import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { api } from '@/services/api/wrapper'
import { asRecord } from '@/lib/apiHelpers'
import { getApiHostname } from '@/config/env'
import { getAccessToken } from '@/lib/secureStorage'

type BroadcastingConfig = {
  enabled: boolean
  key?: string
  cluster?: string
  host?: string | null
  port?: number | null
  scheme?: string
}

let echoInstance: Echo<'pusher'> | null = null
let initPromise: Promise<Echo<'pusher'> | null> | null = null

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo?: Echo<'pusher'>
  }
}

async function fetchBroadcastingConfig(): Promise<BroadcastingConfig> {
  try {
    const raw = asRecord(await api.get<unknown>('/site/broadcasting'))
    return {
      enabled: Boolean(raw.enabled),
      key: raw.key ? String(raw.key) : undefined,
      cluster: raw.cluster ? String(raw.cluster) : undefined,
      host: raw.host ? String(raw.host) : null,
      port: raw.port != null && raw.port !== '' ? Number(raw.port) : null,
      scheme: raw.scheme ? String(raw.scheme) : 'https',
    }
  } catch {
    return { enabled: false }
  }
}

export async function getEcho(): Promise<Echo<'pusher'> | null> {
  if (echoInstance) return echoInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    const config = await fetchBroadcastingConfig()

    if (!config.enabled || !config.key || !config.cluster) {
      return null
    }

    window.Pusher = Pusher

    const token = await getAccessToken()
    const hostname = getApiHostname()
    const authEndpoint = hostname ? `${hostname}/broadcasting/auth` : '/broadcasting/auth'

    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: config.key,
      cluster: config.cluster,
      forceTLS: config.scheme !== 'http',
      wsHost: config.host || undefined,
      wsPort: config.port || undefined,
      wssPort: config.port || undefined,
      enabledTransports: ['ws', 'wss'],
      authEndpoint,
      auth: {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    })

    window.Echo = echoInstance

    return echoInstance
  })()

  return initPromise
}

export function disconnectEcho(): void {
  echoInstance?.disconnect()
  echoInstance = null
  initPromise = null
  delete window.Echo
}
