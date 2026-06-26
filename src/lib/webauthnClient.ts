function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function convertCredentialDescriptorList(list: unknown): void {
  if (!Array.isArray(list)) return

  for (const item of list) {
    if (!isRecord(item) || typeof item.id !== 'string') continue
    item.id = base64ToArrayBuffer(item.id)
  }
}

function preparePublicKeyOptions(publicKey: Record<string, unknown>): void {
  if (typeof publicKey.challenge === 'string') {
    publicKey.challenge = base64ToArrayBuffer(publicKey.challenge)
  }

  const user = publicKey.user
  if (isRecord(user) && typeof user.id === 'string') {
    user.id = base64ToArrayBuffer(user.id)
  }

  convertCredentialDescriptorList(publicKey.excludeCredentials)
  convertCredentialDescriptorList(publicKey.allowCredentials)
}

function prepareCredentialOptions(options: Record<string, unknown>): Record<string, unknown> {
  const prepared = structuredClone(options)

  if (isRecord(prepared.publicKey)) {
    preparePublicKeyOptions(prepared.publicKey)
    return prepared
  }

  if (typeof prepared.challenge === 'string') {
    preparePublicKeyOptions(prepared)
  }

  return prepared
}

export async function createPasskeyRegistration(options: Record<string, unknown>) {
  if (!navigator.credentials?.create) {
    throw new Error('Passkeys are not supported in this browser.')
  }

  const prepared = prepareCredentialOptions(options)

  const credential = await navigator.credentials.create(prepared as CredentialCreationOptions)
  if (!credential || !('response' in credential)) {
    throw new Error('Passkey registration was cancelled.')
  }

  const response = credential.response as AuthenticatorAttestationResponse

  return {
    clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
    attestationObject: arrayBufferToBase64(response.attestationObject),
  }
}

export async function getPasskeyAuthentication(options: Record<string, unknown>) {
  if (!navigator.credentials?.get) {
    throw new Error('Passkeys are not supported in this browser.')
  }

  const prepared = prepareCredentialOptions(options)

  const credential = await navigator.credentials.get(prepared as CredentialRequestOptions)
  if (!credential || !('response' in credential)) {
    throw new Error('Passkey verification was cancelled.')
  }

  const publicKeyCredential = credential as PublicKeyCredential
  const response = publicKeyCredential.response as AuthenticatorAssertionResponse

  return {
    id: arrayBufferToBase64(publicKeyCredential.rawId),
    clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
    authenticatorData: arrayBufferToBase64(response.authenticatorData),
    signature: arrayBufferToBase64(response.signature),
    userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : null,
  }
}
