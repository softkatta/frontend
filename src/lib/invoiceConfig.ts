/** Company details shown on invoice preview/print — keep in sync with backend/config/invoice.php */
export const INVOICE_COMPANY = {
  name: '',
  tagline: '',
  address: '',
  email: '',
  website: '',
  phone: '',
  accountNo: '',
  accountName: '',
  ifscCode: '',
  upiVpa: '',
  branch: '',
  signatory: '',
  gstNumber: '',
  initials: '',
} as const

export const INVOICE_TERMS = ''

export const INVOICE_COLORS = {
  gradient: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)',
} as const
