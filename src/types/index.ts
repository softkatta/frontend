export type UserRole = 'client' | 'admin' | 'employee' | 'hr'

export interface UserCompanyRole {
  name: string
  slug: string
  category?: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  permissions?: string[]
  company_role?: UserCompanyRole | null
  employee_portal_paths?: string[]
  avatar?: string
  company?: string
  phone?: string
  is_active: boolean
  is_demo_account?: boolean
  two_factor_enabled?: boolean
  login_alerts_enabled?: boolean
  created_at: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  recaptcha_token?: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  company?: string
  phone?: string
  avatar?: File
  recaptcha_token?: string
}

export interface ProductFeatureItem {
  title: string
  description?: string
  icon?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  category: string
  price_monthly: number
  price_yearly: number
  price_enterprise?: number
  features: string[]
  featureItems: ProductFeatureItem[]
  images: string[]
  demo_video_url?: string
  is_active: boolean
  has_free_trial?: boolean
  trial_days: number
  created_at: string
  default_monthly_plan_id?: string
  default_yearly_plan_id?: string
  default_enterprise_plan_id?: string
  monthly_plan_name?: string
  yearly_plan_name?: string
  enterprise_plan_name?: string
}

export interface Subscription {
  id: string
  product_id: string
  product_name: string
  plan: 'monthly' | 'yearly' | 'enterprise'
  plan_name?: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  start_date: string
  end_date: string
  auto_renew: boolean
  amount: number
  domain_setup?: DomainSetupStatus
}

export type DomainSetupStatusCode = 'none' | 'skipped' | 'pending' | 'rejected' | 'approved'

export interface DomainSetupStatus {
  status: DomainSetupStatusCode
  frontend_domain?: string | null
  backend_domain?: string | null
  rejection_reason?: string | null
  submitted_at?: string | null
  skipped_at?: string | null
}


export interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'cancelled' | 'sent' | 'draft'
  due_date: string
  paid_date?: string
  items: InvoiceItem[]
  created_at: string
}

export interface InvoiceCompanyProfile {
  name: string
  tagline: string
  address: string
  email: string
  website: string
  phone: string
  accountNo: string
  accountName: string
  ifscCode: string
  upiVpa?: string
  branch: string
  gstNumber: string
  initials: string
  logoUrl?: string
  signatory: string
  signatureUrl?: string
}

export interface InvoiceDetail extends Invoice {
  subtotal: number
  tax_amount: number
  cgst: number
  sgst: number
  igst: number
  currency: string
  terms: string
  company: InvoiceCompanyProfile
  paymentQrPayload?: string
  billing: {
    name: string
    phone?: string
    email?: string
    address?: string
    company?: string
  }
  gst: {
    gst_number?: string
    customer_gst?: string
  }
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  tax_rate?: number
  total: number
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  product_name: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export interface SupportTicketReply {
  id: string
  message: string
  user_name: string
  is_internal?: boolean
  created_at: string
}

export interface SupportTicket {
  id: string
  ticket_number?: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'waiting_on_client'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customer_name?: string
  customer_email?: string
  assignee_id?: string | null
  assignee_name?: string | null
  created_at: string
  updated_at: string
  replies?: SupportTicketReply[]
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  image?: string
  published_at: string
  read_time: number
  meta_title?: string
  meta_description?: string
}

export interface CareerOpening {
  id: string
  title: string
  slug: string
  department: string
  company_role_id?: string
  company_role_name?: string
  location: string
  employment_type: string
  experience_required?: string
  salary_display?: string
  excerpt: string
  description: string
  requirements: string
  apply_email?: string
  apply_url?: string
  is_published?: boolean
  published_at: string
  sort_order: number
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
}

export interface PricingPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: string[]
  is_popular?: boolean
  is_enterprise?: boolean
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  avatar?: string
  rating: number
}

export interface FAQ {
  id: string
  question: string
  answer: string
}

export interface DashboardStats {
  total_products: number
  active_subscriptions: number
  pending_renewals: number
  expiring_soon: number
  total_revenue?: number
  total_customers?: number
  open_tickets?: number
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
