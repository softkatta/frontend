import { DEFAULT_GST_RATE } from '@/lib/gst'
import { getDefaultPlan } from '@/lib/purchasePlan'
import type { BlogPost, CareerOpening, Invoice, InvoiceCompanyProfile, InvoiceDetail, InvoiceItem, Notification, Product, Subscription, SupportTicket, SupportTicketReply } from '@/types'
import { asBool, asNumber, asRecord, asString } from './apiHelpers'
import { INVOICE_COMPANY, INVOICE_TERMS } from './invoiceConfig'
import { resolveMediaUrl } from './mediaUrl'
import { resolveDemoVideoUrl } from './videoUrl'

export function mapSubscription(raw: unknown): Subscription {
  const item = asRecord(raw)
  const product = asRecord(item.product)
  const plan = asRecord(item.plan)
  const status = asString(item.status, 'pending')
  const uiStatus =
    status === 'expiring_soon' ? 'active' :
    status === 'suspend' ? 'cancelled' :
    (status as Subscription['status'])

  return {
    id: asString(item.id),
    product_id: asString(item.product_id ?? product.id),
    product_name: asString(product.name, 'Product'),
    plan: (asString(plan.billing_cycle, 'monthly') as Subscription['plan']),
    plan_name: asString(plan.name, asString(plan.billing_cycle, 'plan')),
    status: uiStatus,
    start_date: asString(item.starts_at ?? item.start_date),
    end_date: asString(item.ends_at ?? item.end_date),
    auto_renew: asBool(item.auto_renew),
    amount: asNumber(plan.price ?? item.amount),
    domain_setup: mapDomainSetup(item.domain_setup),
  }
}

function mapDomainSetup(raw: unknown): Subscription['domain_setup'] {
  const item = asRecord(raw)
  const status = asString(item.status, 'none') as NonNullable<Subscription['domain_setup']>['status']
  if (!['none', 'skipped', 'pending', 'rejected', 'approved'].includes(status)) {
    return { status: 'none' }
  }
  return {
    status,
    frontend_domain: asString(item.frontend_domain) || null,
    backend_domain: asString(item.backend_domain) || null,
    rejection_reason: asString(item.rejection_reason) || null,
    submitted_at: asString(item.submitted_at) || null,
    skipped_at: asString(item.skipped_at) || null,
  }
}

export function mapInvoice(raw: unknown): Invoice {
  const item = asRecord(raw)
  const items = Array.isArray(item.items)
    ? item.items.map(mapInvoiceItem)
    : []
  return {
    id: asString(item.id),
    invoice_number: asString(item.invoice_number, `INV-${item.id}`),
    amount: asNumber(item.total_amount ?? item.amount),
    status: asString(item.status, 'pending') as Invoice['status'],
    due_date: asString(item.due_date),
    paid_date: asString(item.paid_at ?? item.paid_date) || undefined,
    created_at: asString(item.created_at),
    items,
  }
}

function mapInvoiceItem(raw: unknown): InvoiceItem {
  const item = asRecord(raw)
  return {
    description: asString(item.description),
    quantity: asNumber(item.quantity, 1),
    unit_price: asNumber(item.unit_price),
    tax_rate: asNumber(item.tax_rate, DEFAULT_GST_RATE),
    total: asNumber(item.total_amount ?? item.total),
  }
}

export function mapInvoiceCompanyProfile(raw: unknown): InvoiceCompanyProfile {
  const profile = asRecord(raw)
  const name = asString(profile.name, INVOICE_COMPANY.name)

  return {
    name,
    tagline: asString(profile.tagline, INVOICE_COMPANY.tagline),
    address: asString(profile.address, INVOICE_COMPANY.address),
    email: asString(profile.email, INVOICE_COMPANY.email),
    website: asString(profile.website, INVOICE_COMPANY.website),
    phone: asString(profile.phone, INVOICE_COMPANY.phone),
    accountNo: asString(profile.account_no ?? profile.accountNo, INVOICE_COMPANY.accountNo),
    accountName: asString(profile.account_name ?? profile.accountName, INVOICE_COMPANY.accountName),
    ifscCode: asString(profile.ifsc_code ?? profile.ifscCode, INVOICE_COMPANY.ifscCode),
    upiVpa: asString(profile.upi_vpa ?? profile.upiVpa) || undefined,
    branch: asString(profile.branch, INVOICE_COMPANY.branch),
    gstNumber: asString(profile.gst_number ?? profile.gstNumber, INVOICE_COMPANY.gstNumber),
    initials: asString(profile.initials, INVOICE_COMPANY.initials),
    logoUrl: asString(profile.logo_url ?? profile.logoUrl) || undefined,
    signatory: asString(profile.signatory, INVOICE_COMPANY.signatory),
    signatureUrl: asString(profile.signature_url ?? profile.signatureUrl) || undefined,
  }
}

export function mapInvoiceDetail(raw: unknown): InvoiceDetail {
  const item = asRecord(raw)
  const billing = asRecord(item.billing_details)
  const gst = asRecord(item.gst_details)
  const user = asRecord(item.user)
  const addressParts = [
    billing.address ?? user.address,
    billing.city ?? user.city,
    billing.state ?? user.state,
    billing.pincode ?? user.pincode,
  ].filter(Boolean)

  const base = mapInvoice(raw)
  const company = mapInvoiceCompanyProfile(item.company_profile)

  return {
    ...base,
    subtotal: asNumber(item.subtotal, base.amount),
    tax_amount: asNumber(item.tax_amount),
    cgst: asNumber(item.cgst),
    sgst: asNumber(item.sgst),
    igst: asNumber(item.igst),
    amount: asNumber(item.total_amount ?? item.amount),
    currency: asString(item.currency, 'INR'),
    terms: asString(item.terms_text ?? item.terms, INVOICE_TERMS),
    company,
    paymentQrPayload: asString(item.payment_qr_payload) || undefined,
    billing: {
      name: asString(billing.name ?? user.name, 'Customer'),
      phone: asString(billing.phone ?? user.phone) || undefined,
      email: asString(billing.email ?? user.email) || undefined,
      address: addressParts.length ? addressParts.map(String).join(', ') : undefined,
      company: asString(billing.company ?? user.company_name) || undefined,
    },
    gst: {
      gst_number: asString(gst.gst_number ?? company.gstNumber) || undefined,
      customer_gst: asString(gst.customer_gst) || undefined,
    },
  }
}

export function mapNotification(raw: unknown): Notification {
  const item = asRecord(raw)
  const type = asString(item.type)
  const uiType: Notification['type'] =
    type.includes('error') || type.includes('fail') ? 'error' :
    type.includes('warn') || type.includes('due') ? 'warning' :
    type.includes('success') || type.includes('renew') || type.includes('welcome') ? 'success' :
    'info'

  return {
    id: asString(item.id),
    title: asString(item.title, 'Notification'),
    message: asString(item.message),
    type: uiType,
    is_read: Boolean(item.read_at),
    created_at: asString(item.created_at),
  }
}

export function mapSupportTicket(raw: unknown): SupportTicket {
  const item = asRecord(raw)
  const statusRaw = asString(item.status, 'open')
  const status = statusRaw as SupportTicket['status']
  const user = asRecord(item.user)
  const assignee = asRecord(item.assignee)
  const replies = Array.isArray(item.replies)
    ? item.replies.map(mapSupportTicketReply)
    : undefined
  return {
    id: asString(item.id),
    ticket_number: asString(item.ticket_number) || undefined,
    subject: asString(item.subject),
    description: asString(item.description ?? item.message),
    status,
    priority: asString(item.priority, 'medium') as SupportTicket['priority'],
    customer_name: asString(user.name) || undefined,
    customer_email: asString(user.email) || undefined,
    assignee_id: item.assigned_to != null ? asString(item.assigned_to) : (assignee.id != null ? asString(assignee.id) : null),
    assignee_name: asString(assignee.name) || null,
    created_at: asString(item.created_at),
    updated_at: asString(item.updated_at ?? item.created_at),
    replies,
  }
}

export function mapSupportTicketReply(raw: unknown): SupportTicketReply {
  const item = asRecord(raw)
  const user = asRecord(item.user)
  return {
    id: asString(item.id),
    message: asString(item.message),
    user_name: asString(user.name ?? user.email, 'User'),
    is_internal: asBool(item.is_internal),
    created_at: asString(item.created_at),
  }
}

export function mapAdminInternalUser(raw: unknown) {
  return mapAdminUser(raw)
}

export function mapAdminUser(raw: unknown) {
  const item = asRecord(raw)
  const employee = asRecord(item.employee_profile)
  const tenant = asRecord(item.tenant)
  const companyRole = asRecord(employee.company_role)
  const role = asString(item.role, 'client')
  const roleMeta: Record<string, { label: string; portal: string }> = {
    super_admin: { label: 'Super Admin', portal: '/admin' },
    admin: { label: 'Super Admin', portal: '/admin' },
    hr_manager: { label: 'HR Manager', portal: '/hr' },
    employee: { label: 'Employee', portal: '/employee' },
    client: { label: 'Customer', portal: '/login' },
  }
  const meta = roleMeta[role] ?? { label: role.replace(/_/g, ' '), portal: '—' }
  const companyRoleName = asString(companyRole.name) || asString(employee.designation)
  const loginDetails = asRecord(item.login_details)
  const loginRoleLabel = meta.label
  const displayRoleLabel = role === 'employee' && companyRoleName ? companyRoleName : meta.label

  return {
    id: asString(item.id),
    name: asString(item.name),
    email: asString(item.email),
    phone: asString(item.phone),
    avatar: asString(item.avatar) || undefined,
    company: asString(item.company_name ?? tenant.name),
    role,
    role_label: displayRoleLabel,
    login_role_label: loginRoleLabel,
    login_portal: meta.portal,
    login_details: loginDetails.portal_url || loginDetails.email || loginDetails.password
      ? {
          portal_url: asString(loginDetails.portal_url) || meta.portal,
          email: asString(loginDetails.email) || asString(item.email),
          password: asString(loginDetails.password) || undefined,
        }
      : undefined,
    is_active: asBool(item.is_active),
    created_at: asString(item.created_at),
    last_login_at: asString(item.last_login_at) || undefined,
    employee_code: asString(employee.employee_code) || undefined,
    employee_id: asString(employee.id) || undefined,
    department: asString(employee.department) || undefined,
    company_role_id: asString(employee.company_role_id) || undefined,
    company_role_name: companyRoleName || undefined,
    designation: asString(employee.designation) || companyRoleName || undefined,
  }
}

export function mapAdminCustomer(raw: unknown) {
  const item = asRecord(raw)
  const name = asString(item.name)
  const parts = name.split(' ')
  return {
    id: asString(item.id),
    name,
    email: asString(item.email),
    company: asString(item.company_name ?? item.company),
    role: asString(item.role, 'client'),
    is_active: asBool(item.is_active),
    created_at: asString(item.created_at),
    first_name: parts[0] ?? '',
    last_name: parts.slice(1).join(' '),
  }
}

export function mapAdminTenant(raw: unknown) {
  const item = asRecord(raw)
  const owner = asRecord(item.owner)
  const settings = asRecord(item.settings)
  const subscriptionDomainsRaw = asRecord(settings.subscription_domains)
  const subscription_domains = Object.values(subscriptionDomainsRaw).map((rowRaw) => {
    const row = asRecord(rowRaw)
    return {
      subscription_id: asString(row.subscription_id),
      product_id: asString(row.product_id),
      frontend_domain: asString(row.frontend_domain),
      backend_domain: asString(row.backend_domain),
    }
  }).filter((row) => row.subscription_id && row.frontend_domain && row.backend_domain)

  // Legacy product_domains → shown only if no subscription_domains yet
  const productDomainsRaw = asRecord(settings.product_domains)
  const product_domains: Record<string, { frontend_domain: string; backend_domain: string }> = {}
  for (const [slug, pairRaw] of Object.entries(productDomainsRaw)) {
    const pair = asRecord(pairRaw)
    product_domains[slug] = {
      frontend_domain: asString(pair.frontend_domain),
      backend_domain: asString(pair.backend_domain),
    }
  }

  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    backend_domain: asString(item.backend_domain),
    frontend_domain: asString(item.frontend_domain || item.domain),
    domain: asString(item.frontend_domain || item.domain),
    subscription_domains,
    product_domains,
    status: asString(item.status, 'active'),
    owner_id: asString(owner.id || item.owner_id),
    owner_name: asString(owner.name),
    owner_email: asString(owner.email),
    created_at: asString(item.created_at),
  }
}

export function mapAdminCategory(raw: unknown) {
  const item = asRecord(raw)
  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    description: asString(item.description),
    icon: asString(item.icon),
    is_active: asBool(item.is_active),
    sort_order: asNumber(item.sort_order),
    products_count: asNumber(item.products_count),
  }
}

export function mapAdminService(raw: unknown) {
  const item = asRecord(raw)
  const image = asString(item.image)
  const bullets = item.bullets
  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    description: asString(item.description),
    body: asString(item.body),
    bullets_heading: asString(item.bullets_heading),
    bullets: Array.isArray(bullets) ? bullets.map(String) : [],
    meta_title: asString(item.meta_title),
    meta_description: asString(item.meta_description),
    icon: asString(item.icon),
    image: image || undefined,
    image_url: image ? resolveMediaUrl(image) : undefined,
    is_active: item.is_active === undefined || item.is_active === null ? true : asBool(item.is_active),
    sort_order: asNumber(item.sort_order, 0),
    created_at: asString(item.created_at),
    updated_at: asString(item.updated_at),
  }
}

export function mapAdminPlan(raw: unknown) {
  const item = asRecord(raw)
  const product = asRecord(item.product)
  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    product_id: asString(item.product_id),
    product_name: asString(product.name, 'Product'),
    price: asNumber(item.price),
    billing_cycle: asString(item.billing_cycle, 'monthly'),
    description: asString(item.description),
    is_active: asBool(item.is_active),
    is_popular: asBool(item.is_popular),
    sort_order: asNumber(item.sort_order),
  }
}

export function mapAdminSubscription(raw: unknown) {
  const item = asRecord(raw)
  const user = asRecord(item.user)
  const product = asRecord(item.product)
  const plan = asRecord(item.plan)
  const invoiceTotal = asNumber(item.invoice_total)
  const amountDue = asNumber(item.amount_due)
  const amountPaid = asNumber(item.amount_paid)
  const planAmount = asNumber(plan.price ?? item.amount)
  return {
    id: asString(item.id),
    customer: asString(user.name ?? user.email, 'Customer'),
    customer_email: asString(user.email),
    product: asString(product.name, 'Product'),
    plan: asString(plan.billing_cycle ?? plan.name, 'monthly'),
    status: asString(item.status, 'pending'),
    amount: invoiceTotal > 0 ? invoiceTotal : planAmount,
    invoice_id: asString(item.invoice_id) || undefined,
    invoice_total: invoiceTotal,
    amount_paid: amountPaid,
    amount_due: amountDue,
    payment_status: asString(item.payment_status, 'none'),
    auto_renew: asBool(item.auto_renew),
    start_date: asString(item.starts_at ?? item.start_date),
    end_date: asString(item.ends_at ?? item.end_date),
    cancelled_at: asString(item.cancelled_at),
  }
}

export function mapAdminInvoice(raw: unknown) {
  const item = asRecord(raw)
  const user = asRecord(item.user)
  return {
    id: asString(item.id),
    invoice_number: asString(item.invoice_number),
    customer: asString(user.name ?? user.email, 'Customer'),
    amount: asNumber(item.total_amount ?? item.amount),
    status: asString(item.status, 'pending'),
    due_date: asString(item.due_date),
    created_at: asString(item.created_at),
  }
}

export function mapClientOrder(raw: unknown) {
  const item = asRecord(raw)
  const product = asRecord(item.product)
  const plan = asRecord(item.plan)
  const invoice = asRecord(item.invoice)
  return {
    id: asString(item.id),
    order_number: asString(item.order_number),
    product_name: asString(product.name, 'Product'),
    plan_name: asString(plan.name) || undefined,
    amount: asNumber(item.total_amount ?? item.amount),
    status: asString(item.status, 'pending'),
    payment_gateway: asString(item.payment_gateway) || undefined,
    invoice_id: asString(invoice.id) || undefined,
    invoice_number: asString(invoice.invoice_number) || undefined,
    created_at: asString(item.created_at),
  }
}

export function mapAdminOrder(raw: unknown) {
  const item = asRecord(raw)
  const user = asRecord(item.user)
  const product = asRecord(item.product)
  return {
    id: asString(item.id),
    order_number: asString(item.order_number),
    customer_name: asString(user.name ?? user.email, 'Customer'),
    product_name: asString(product.name, 'Product'),
    amount: asNumber(item.total_amount ?? item.amount),
    status: asString(item.status, 'pending'),
    created_at: asString(item.created_at),
  }
}

export function mapAdminPayment(raw: unknown) {
  const item = asRecord(raw)
  const user = asRecord(item.user)
  const order = asRecord(item.order)
  const invoice = asRecord(item.invoice)
  const gatewayResponse = asRecord(item.gateway_response)
  const transactionId = resolvePaymentTransactionId(item, gatewayResponse)
  const paymentMode = resolvePaymentMode(item, gatewayResponse)

  return {
    id: asString(item.id),
    transaction_id: transactionId,
    payment_mode: paymentMode,
    gateway: asString(item.gateway, 'unknown'),
    amount: asNumber(item.amount),
    status: asString(item.status, 'pending'),
    customer_name: asString(user.name ?? user.email, 'Customer'),
    order_id: asString(item.order_id ?? order.id) || undefined,
    invoice_id: asString(item.invoice_id ?? invoice.id) || undefined,
    order_number: asString(order.order_number) || undefined,
    invoice_number: asString(invoice.invoice_number) || undefined,
    created_at: asString(item.created_at),
  }
}

function resolvePaymentTransactionId(
  item: Record<string, unknown>,
  gatewayResponse: Record<string, unknown>,
): string | undefined {
  const candidates = [
    asString(gatewayResponse.razorpay_payment_id),
    asString(item.transaction_id),
    asString(gatewayResponse.transaction_id),
    asString(gatewayResponse.razorpay_order_id),
  ].filter(Boolean)

  return candidates[0] || undefined
}

function resolvePaymentMode(
  item: Record<string, unknown>,
  gatewayResponse: Record<string, unknown>,
): string {
  const transactionId = asString(item.transaction_id)

  if (asString(gatewayResponse.source) === 'admin_manual') {
    const method = asString(gatewayResponse.payment_method ?? item.gateway).toLowerCase()
    if (method === 'cash') return 'Cash'
    if (method === 'cheque') return 'Cheque'
  }

  if (asString(gatewayResponse.source) === 'invoice_paid' || transactionId.startsWith('MANUAL-')) {
    return 'Manual'
  }

  const method = asString(gatewayResponse.method ?? gatewayResponse.payment_method).toLowerCase()
  const methodLabels: Record<string, string> = {
    upi: 'UPI',
    card: 'Card',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
    emi: 'EMI',
  }
  if (method && methodLabels[method]) {
    return methodLabels[method]
  }
  if (method) {
    return method.charAt(0).toUpperCase() + method.slice(1)
  }

  const gateway = asString(item.gateway, 'unknown').toLowerCase()
  const gatewayLabels: Record<string, string> = {
    razorpay: 'Razorpay',
    manual: 'Manual',
    cash: 'Cash',
    cheque: 'Cheque',
    stripe: 'Stripe',
    payu: 'PayU',
    cashfree: 'Cashfree',
  }

  return gatewayLabels[gateway] ?? (gateway ? gateway.charAt(0).toUpperCase() + gateway.slice(1) : 'Unknown')
}

export function mapAdminSupportTicket(raw: unknown) {
  const item = asRecord(raw)
  const user = asRecord(item.user)
  return {
    id: asString(item.id),
    subject: asString(item.subject),
    customer: asString(user.name ?? user.email, 'Customer'),
    status: asString(item.status, 'open'),
    priority: asString(item.priority, 'medium'),
    created_at: asString(item.created_at),
  }
}

export function mapAdminBlog(raw: unknown) {
  const item = asRecord(raw)
  const author = asRecord(item.author)
  const meta = asRecord(item.meta)
  const content = asString(item.content ?? item.body)
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return {
    id: asString(item.id),
    title: asString(item.title),
    slug: asString(item.slug),
    excerpt: asString(item.excerpt ?? item.summary),
    content,
    author: asString(author.name ?? item.author ?? item.author_name, 'SoftKatta'),
    category: asString(meta.category ?? item.category ?? item.category_name, 'General'),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    image: asString(item.featured_image ?? item.image ?? item.cover_image) || undefined,
    meta_title: asString(meta.meta_title ?? meta.seo_title) || undefined,
    meta_description: asString(meta.meta_description ?? meta.seo_description) || undefined,
    is_published: asBool(item.is_published),
    published_at: asString(item.published_at ?? item.created_at),
    read_time: asNumber(item.read_time ?? item.reading_time, Math.max(1, Math.ceil(wordCount / 200))),
  }
}

export function mapPublicBlog(raw: unknown): BlogPost {
  const mapped = mapAdminBlog(raw)
  return {
    id: mapped.id,
    title: mapped.title,
    slug: mapped.slug,
    excerpt: mapped.excerpt,
    content: mapped.content,
    author: mapped.author,
    category: mapped.category,
    tags: mapped.tags,
    image: mapped.image,
    published_at: mapped.published_at,
    read_time: mapped.read_time,
    meta_title: mapped.meta_title,
    meta_description: mapped.meta_description,
  }
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

export function formatEmploymentType(value: string): string {
  return EMPLOYMENT_TYPE_LABELS[value] ?? value
}

export function mapAdminCareer(raw: unknown) {
  const item = asRecord(raw)
  const employmentType = asString(item.employment_type, 'full-time')
  const companyRole = asRecord(item.company_role)
  return {
    id: asString(item.id),
    title: asString(item.title),
    slug: asString(item.slug),
    department: asString(item.department),
    company_role_id: asString(item.company_role_id) || undefined,
    company_role_name: asString(companyRole.name) || undefined,
    location: asString(item.location),
    employment_type: employmentType,
    employment_label: formatEmploymentType(employmentType),
    experience_required: asString(item.experience_required),
    salary_display: asString(item.salary_display),
    excerpt: asString(item.excerpt),
    description: asString(item.description),
    requirements: asString(item.requirements),
    apply_email: asString(item.apply_email) || undefined,
    apply_url: asString(item.apply_url) || undefined,
    is_published: asBool(item.is_published),
    published_at: asString(item.published_at ?? item.created_at),
    sort_order: asNumber(item.sort_order, 0),
  }
}

export function mapPublicCareer(raw: unknown): CareerOpening {
  const mapped = mapAdminCareer(raw)
  return {
    id: mapped.id,
    title: mapped.title,
    slug: mapped.slug,
    department: mapped.department,
    location: mapped.location,
    employment_type: mapped.employment_type,
    experience_required: mapped.experience_required,
    salary_display: mapped.salary_display,
    excerpt: mapped.excerpt,
    description: mapped.description,
    requirements: mapped.requirements,
    apply_email: mapped.apply_email,
    apply_url: mapped.apply_url,
    published_at: mapped.published_at,
    sort_order: mapped.sort_order,
  }
}

export function mapAdminJobApplication(raw: unknown) {
  const item = asRecord(raw)
  const career = asRecord(item.career)
  const careerCompanyRole = asRecord(career.company_role)
  const documents = Array.isArray(item.documents)
    ? item.documents.map((doc) => {
        const d = asRecord(doc)
        return {
          id: asString(d.id),
          document_type: asString(d.document_type),
          original_name: asString(d.original_name),
          mime_type: asString(d.mime_type),
          file_size: asNumber(d.file_size),
        }
      })
    : []

  return {
    id: asString(item.id),
    career_id: asString(item.career_id),
    career_default_company_role_id: asString(career.company_role_id) || undefined,
    career_default_company_role_name: asString(careerCompanyRole.name) || undefined,
    employee_id: asString(item.employee_id) || undefined,
    job_title: asString(career.title ?? item.job_title, '—'),
    job_slug: asString(career.slug ?? item.job_slug),
    name: asString(item.name),
    email: asString(item.email),
    phone: asString(item.phone),
    date_of_birth: asString(item.date_of_birth) || undefined,
    gender: asString(item.gender) || undefined,
    current_address: asString(item.current_address) || undefined,
    permanent_address: asString(item.permanent_address) || undefined,
    qualification: asString(item.qualification) || undefined,
    skills: asString(item.skills) || undefined,
    total_experience: asString(item.total_experience) || undefined,
    current_company: asString(item.current_company) || undefined,
    current_salary: asNumber(item.current_salary) || undefined,
    expected_salary: asNumber(item.expected_salary) || undefined,
    notice_period: asString(item.notice_period) || undefined,
    preferred_location: asString(item.preferred_location) || undefined,
    message: asString(item.message),
    hr_remarks: asString(item.hr_remarks) || undefined,
    interview_scheduled_at: asString(item.interview_scheduled_at) || undefined,
    resume_path: asString(item.resume_path) || undefined,
    documents,
    status: asString(item.status, 'applied'),
    created_at: asString(item.created_at),
  }
}

export function mapAdminEmployee(raw: unknown) {
  const item = asRecord(raw)
  const documents = Array.isArray(item.documents)
    ? item.documents.map((doc) => {
        const d = asRecord(doc)
        return {
          id: asString(d.id),
          category: asString(d.category),
          original_name: asString(d.original_name),
          notes: asString(d.notes) || undefined,
        }
      })
    : []
  const exit = asRecord(item.exit_record)

  return {
    id: asString(item.id),
    employee_code: asString(item.employee_code),
    full_name: asString(item.full_name),
    email: asString(item.email),
    phone: asString(item.phone),
    department: asString(item.department),
    designation: asString(item.designation),
    date_of_joining: asString(item.date_of_joining) || undefined,
    reporting_manager: asString(item.reporting_manager) || undefined,
    salary_details: item.salary_details ?? null,
    pf_uan: asString(item.pf_uan) || undefined,
    esic_number: asString(item.esic_number) || undefined,
    bank_details: item.bank_details ?? null,
    emergency_contact: item.emergency_contact ?? null,
    status: asString(item.status, 'active'),
    user_id: asString(item.user_id) || undefined,
    documents,
    exit_record: exit.id ? {
      id: asString(exit.id),
      status: asString(exit.status, 'initiated'),
      resignation_date: asString(exit.resignation_date) || undefined,
      last_working_day: asString(exit.last_working_day) || undefined,
      reason: asString(exit.reason) || undefined,
      hr_remarks: asString(exit.hr_remarks) || undefined,
      checklist: exit.checklist ?? null,
    } : undefined,
    created_at: asString(item.created_at),
  }
}

export function mapApiProduct(raw: unknown): Product {
  const item = asRecord(raw)
  const category = asRecord(item.category)
  const monthlyPlan = getDefaultPlan(raw, 'monthly')
  const yearlyPlan = getDefaultPlan(raw, 'yearly')
  const enterprisePlan = getDefaultPlan(raw, 'enterprise')
  const screenshots = Array.isArray(item.screenshots)
    ? item.screenshots
        .map((s) => resolveMediaUrl(asString(asRecord(s).image_path ?? asRecord(s).url ?? asRecord(s).path)))
        .filter(Boolean)
    : []
  const videos = Array.isArray(item.videos) ? item.videos.map(asRecord) : []
  const demoVideo = videos.length > 0 ? resolveDemoVideoUrl(asString(videos[0].video_url)) : ''

  const featureRows = Array.isArray(item.features) ? item.features.map(asRecord) : []
  const featureItems = featureRows
    .map((f) => ({
      title: asString(f.title ?? f.name ?? f),
      description: asString(f.description) || undefined,
      icon: asString(f.icon) || undefined,
    }))
    .filter((f) => f.title)

  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    description: asString(item.description ?? item.overview),
    short_description: asString(item.overview ?? item.description).slice(0, 160),
    category: asString(category.name ?? category.slug ?? item.category, 'General'),
    price_monthly: monthlyPlan?.price ?? 0,
    price_yearly: yearlyPlan?.price ?? 0,
    price_enterprise: enterprisePlan?.price ?? 0,
    default_monthly_plan_id: monthlyPlan?.id,
    default_yearly_plan_id: yearlyPlan?.id,
    default_enterprise_plan_id: enterprisePlan?.id,
    monthly_plan_name: monthlyPlan?.name,
    yearly_plan_name: yearlyPlan?.name,
    enterprise_plan_name: enterprisePlan?.name,
    features: featureItems.map((f) => f.title),
    featureItems,
    images: screenshots,
    demo_video_url: demoVideo || undefined,
    is_active: asBool(item.is_active ?? true),
    has_free_trial: asBool(item.has_free_trial),
    trial_days: asNumber(item.trial_days),
    created_at: asString(item.created_at),
  }
}

export function getPlanIdForProduct(raw: unknown, billing: 'monthly' | 'yearly'): string {
  return getDefaultPlan(raw, billing)?.id ?? ''
}

export function mapAdminLicense(raw: unknown) {
  const item = asRecord(raw)
  const product = asRecord(item.product)
  const user = asRecord(item.user)
  const subscription = asRecord(item.subscription)
  const plan = asRecord(subscription.plan)
  const installationEnv = asRecord(item.installation_env)
  return {
    id: asString(item.id),
    license_key: asString(item.license_key),
    status: asString(item.status, 'active'),
    product_name: asString(product.name, 'Product'),
    product_slug: asString(installationEnv.SOFTKATTA_PRODUCT_SLUG || product.installer_slug || product.slug),
    product_version: asString(installationEnv.SOFTKATTA_PRODUCT_VERSION || product.current_version, '1.0.0'),
    api_url: asString(installationEnv.SOFTKATTA_API_URL),
    api_key: asString(installationEnv.SOFTKATTA_API_KEY),
    product_id: asString(item.product_id),
    customer_name: asString(user.name ?? user.email, 'Customer'),
    customer_email: asString(user.email),
    plan_name: asString(plan.name ?? plan.billing_cycle, 'Plan'),
    allowed_domains: Array.isArray(item.allowed_domains) ? (item.allowed_domains as string[]) : [],
    domains_text: Array.isArray(item.allowed_domains) ? (item.allowed_domains as string[]).join(', ') : '',
    max_devices: asNumber(item.max_devices, 1),
    max_domains: asNumber(item.max_domains, 1),
    activation_count: asNumber(item.activation_count),
    activated_at: asString(item.activated_at),
    expires_at: asString(item.expires_at),
    last_verified_at: asString(item.last_verified_at),
    revoke_reason: asString(item.revoke_reason),
    subscription_id: asString(item.subscription_id),
  }
}

export function mapAdminCompanyRole(raw: unknown) {
  const item = asRecord(raw)
  const menuLabels = Array.isArray(item.employee_portal_menu_labels)
    ? item.employee_portal_menu_labels.map((label) => asString(label)).filter(Boolean)
    : []
  const menuKeys = Array.isArray(item.employee_portal_menus)
    ? item.employee_portal_menus.map((key) => asString(key)).filter(Boolean)
    : []
  const menuOverride = Array.isArray(item.employee_portal_menus_override)
    ? item.employee_portal_menus_override.map((key) => asString(key)).filter(Boolean)
    : null

  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    category: asString(item.category),
    sort_order: asNumber(item.sort_order, 0),
    is_active: item.is_active !== false,
    employees_count: asNumber(item.employees_count, 0),
    employee_portal_menus: menuKeys,
    employee_portal_menus_override: menuOverride,
    uses_default_portal_menus: item.uses_default_portal_menus !== false && !menuOverride?.length,
    employee_portal_menu_labels: menuLabels,
    created_at: asString(item.created_at),
  }
}
