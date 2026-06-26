export type IntegrationField = {
  key: string
  label: string
  type?: 'password' | 'number' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
  help?: string
}

export const INTEGRATION_FIELDS: Record<string, IntegrationField[]> = {
  razorpay: [
    { key: 'key_id', label: 'Key ID', placeholder: 'rzp_test_...' },
    { key: 'api_secret', label: 'Key Secret', type: 'password', placeholder: 'Enter Razorpay secret key' },
  ],
  email_smtp: [
    { key: 'host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
    { key: 'port', label: 'SMTP Port', type: 'number', placeholder: '587' },
    { key: 'username', label: 'SMTP Username', placeholder: 'noreply@yourdomain.com' },
    { key: 'password', label: 'SMTP Password', type: 'password' },
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
    { key: 'from_address', label: 'From Email', placeholder: 'noreply@softkatta.com' },
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
    { key: 'host', label: 'Custom Host (optional)', placeholder: 'Leave empty for Pusher cloud' },
    { key: 'port', label: 'Custom Port (optional)', type: 'number', placeholder: '443' },
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
