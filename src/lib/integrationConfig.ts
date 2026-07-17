export type IntegrationField = {
  key: string
  label: string
  type?: 'password' | 'number' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
  help?: string
  optional?: boolean
}

export const MASKED_SECRET = '••••••••'

export function isMaskedSecret(value?: string): boolean {
  return value === MASKED_SECRET
}

/** True when the API returned a stored value (including masked secrets). */
export function hasStoredCredential(value?: string): boolean {
  return Boolean(value && value.trim() !== '')
}

export function buildIntegrationCredentials(
  fields: IntegrationField[],
  existing: Record<string, string>,
  edited: Record<string, string>,
): Record<string, string> {
  const credentials: Record<string, string> = {}

  for (const field of fields) {
    const editedValue = edited[field.key]?.trim() ?? ''
    const existingValue = existing[field.key]?.trim() ?? ''

    if (field.type === 'password') {
      if (editedValue) {
        credentials[field.key] = editedValue
      }
      continue
    }

    if (editedValue) {
      credentials[field.key] = editedValue
    } else if (field.optional) {
      if (existingValue && !isMaskedSecret(existingValue)) {
        credentials[field.key] = ''
      }
    } else if (existingValue && !isMaskedSecret(existingValue)) {
      credentials[field.key] = existingValue
    }
  }

  return credentials
}

export function validateIntegrationSave(
  provider: string,
  fields: IntegrationField[],
  existing: Record<string, string>,
  edited: Record<string, string>,
): string | null {
  const credentials = buildIntegrationCredentials(fields, existing, edited)

  const hasValue = (key: string) => Boolean(credentials[key]?.trim()) || hasStoredCredential(existing[key])
  const hasSecret = (key: string) => Boolean(edited[key]?.trim()) || hasStoredCredential(existing[key])

  switch (provider) {
    case 'razorpay':
      if (!hasValue('key_id') || !hasSecret('api_secret')) {
        return 'Enter Key ID and Key Secret, then save.'
      }
      break
    case 'email_smtp':
      if (!hasValue('host') || !hasValue('username') || !hasValue('from_address') || !hasSecret('password')) {
        return 'Host, username, password, and from email are required.'
      }
      break
    case 'whatsapp':
      if (!hasValue('phone_number_id') || !hasSecret('access_token')) {
        return 'Phone Number ID and Access Token are required.'
      }
      break
    case 'pusher':
      if (!hasValue('app_id') || !hasValue('key') || !hasSecret('secret') || !hasValue('cluster')) {
        return 'App ID, App Key, App Secret, and Cluster are required.'
      }
      break
    case 'stripe':
      if (!hasValue('publishable_key') || !hasSecret('secret_key')) {
        return 'Publishable Key and Secret Key are required.'
      }
      break
    default:
      break
  }

  return null
}

export function hasUnsavedCredentialEdits(
  fields: IntegrationField[],
  existing: Record<string, string>,
  edited: Record<string, string>,
): boolean {
  for (const field of fields) {
    const editedValue = edited[field.key]?.trim() ?? ''
    if (!editedValue) continue

    if (field.type === 'password') {
      if (isMaskedSecret(existing[field.key])) {
        continue
      }

      return true
    }

    const existingValue = isMaskedSecret(existing[field.key]) ? '' : (existing[field.key]?.trim() ?? '')
    if (String(editedValue) !== String(existingValue)) {
      return true
    }
  }

  return false
}

export const INTEGRATION_FIELDS: Record<string, IntegrationField[]> = {
  razorpay: [
    { key: 'key_id', label: 'Key ID', placeholder: 'rzp_test_...' },
    { key: 'api_secret', label: 'Key Secret', type: 'password', placeholder: 'Enter Razorpay secret key' },
  ],
  email_smtp: [
    { key: 'host', label: 'SMTP Host', placeholder: 'smtp-relay.brevo.com', help: 'Recommended: Brevo (smtp-relay.brevo.com) or your hosting mail server (mail.yourdomain.com). No Google 2-Step Verification needed.' },
    { key: 'port', label: 'SMTP Port', type: 'number', placeholder: '587', help: 'Usually 587 (TLS) or 465 (SSL).' },
    { key: 'username', label: 'SMTP Username', placeholder: 'noreply@yourdomain.com', help: 'Your email address or Brevo login email.' },
    {
      key: 'password',
      label: 'SMTP Password',
      type: 'password',
      help: 'Hosting: your email account password. Brevo: SMTP key from Brevo dashboard (SMTP & API). Not your Google account password.',
    },
    {
      key: 'encryption',
      label: 'Encryption',
      type: 'select',
      options: [
        { value: 'tls', label: 'TLS' },
        { value: 'ssl', label: 'SSL' },
        { value: 'none', label: 'None' },
      ],
    },
    { key: 'from_address', label: 'From Email', placeholder: 'noreply@softkatta.in' },
    { key: 'from_name', label: 'From Name', placeholder: 'SoftKatta' },
  ],
  whatsapp: [
    { key: 'phone_number_id', label: 'Phone Number ID', placeholder: 'Meta WhatsApp phone number ID' },
    { key: 'access_token', label: 'Access Token', type: 'password' },
    { key: 'api_version', label: 'API Version', placeholder: 'v21.0' },
  ],
  pusher: [
    { key: 'app_id', label: 'App ID' },
    { key: 'key', label: 'App Key' },
    { key: 'secret', label: 'App Secret', type: 'password' },
    { key: 'cluster', label: 'Cluster', placeholder: 'ap2' },
    { key: 'host', label: 'Custom Host (optional)', placeholder: 'Leave empty for Pusher cloud', optional: true },
    { key: 'port', label: 'Custom Port (optional)', type: 'number', placeholder: '443', optional: true },
    {
      key: 'scheme',
      label: 'Scheme',
      type: 'select',
      options: [
        { value: 'https', label: 'HTTPS' },
        { value: 'http', label: 'HTTP' },
      ],
    },
  ],
  stripe: [
    { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_test_...' },
    { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...' },
  ],
}

export const INTEGRATION_DESCRIPTIONS: Record<string, string> = {
  razorpay: 'Accept online payments via Razorpay checkout.',
  email_smtp: 'Send invoice, welcome, and notification emails via SMTP.',
  whatsapp: 'Send WhatsApp alerts using Meta Cloud API credentials.',
  pusher: 'Deliver real-time in-app notifications to clients and admins.',
  stripe: 'Optional card payments via Stripe (coming soon).',
}
