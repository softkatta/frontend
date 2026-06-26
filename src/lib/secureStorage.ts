const STORAGE_KEY = 'sk_secure_auth'
const LEGACY_TOKEN_KEY = 'access_token'
const LEGACY_REFRESH_KEY = 'refresh_token'

export interface SecureAuthPayload {
  user: unknown
  accessToken: string
  refreshToken?: string | null
}

function getSecret(): string {
  return import.meta.env.VITE_STORAGE_SECRET ?? 'softkatta-local-dev-secret'
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
}

async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 120000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptPayload(payload: SecureAuthPayload): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(salt)
  const encoded = new TextEncoder().encode(JSON.stringify(payload))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer }, key, encoded)

  return JSON.stringify({
    s: toBase64(salt),
    i: toBase64(iv),
    c: toBase64(new Uint8Array(cipher)),
  })
}

export async function decryptPayload(raw: string): Promise<SecureAuthPayload | null> {
  try {
    const parsed = JSON.parse(raw) as { s: string; i: string; c: string }
    const salt = fromBase64(parsed.s)
    const iv = fromBase64(parsed.i)
    const cipher = fromBase64(parsed.c)
    const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
    const cipherBuffer = cipher.buffer.slice(cipher.byteOffset, cipher.byteOffset + cipher.byteLength) as ArrayBuffer
    const key = await deriveKey(salt)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, key, cipherBuffer)
    return JSON.parse(new TextDecoder().decode(plain)) as SecureAuthPayload
  } catch {
    return null
  }
}

export async function saveSecureAuth(payload: SecureAuthPayload): Promise<void> {
  const encrypted = await encryptPayload(payload)
  localStorage.setItem(STORAGE_KEY, encrypted)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_REFRESH_KEY)
}

export async function loadSecureAuth(): Promise<SecureAuthPayload | null> {
  const encrypted = localStorage.getItem(STORAGE_KEY)
  if (encrypted) {
    return decryptPayload(encrypted)
  }

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (!legacyToken) return null

  const legacy: SecureAuthPayload = {
    accessToken: legacyToken,
    refreshToken: localStorage.getItem(LEGACY_REFRESH_KEY),
    user: null,
  }
  await saveSecureAuth(legacy)
  return legacy
}

export function clearSecureAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_REFRESH_KEY)
}

export async function getAccessToken(): Promise<string | null> {
  const auth = await loadSecureAuth()
  return auth?.accessToken ?? null
}
