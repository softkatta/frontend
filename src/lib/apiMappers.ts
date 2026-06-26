import { DEFAULT_GST_RATE } from '@/lib/gst'
import { getDefaultPlan } from '@/lib/purchasePlan'
import type { BlogPost, Invoice, InvoiceCompanyProfile, InvoiceDetail, InvoiceItem, Notification, Product, Subscription, SupportTicket, SupportTicketReply } from '@/types'
import { asBool, asNumber, asRecord, asString } from './apiHelpers'
import { INVOICE_COMPANY, INVOICE_TERMS } from './invoiceConfig'
import { resolveMediaUrl } from './mediaUrl'
import { normalizeEmbedUrl } from './videoUrl'

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
    status: uiStatus,
    start_date: asString(item.starts_at ?? item.start_date),
    end_date: asString(item.ends_at ?? item.end_date),
    auto_renew: asBool(item.auto_renew),
    amount: asNumber(plan.price ?? item.amount),
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
  return {
    id: asString(item.id),
    customer: asString(user.name ?? user.email, 'Customer'),
    customer_email: asString(user.email),
    product: asString(product.name, 'Product'),
    plan: asString(plan.billing_cycle ?? plan.name, 'monthly'),
    status: asString(item.status, 'pending'),
    amount: asNumber(plan.price ?? item.amount),
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
  }
}

export function mapApiProduct(raw: unknown): Product {
  const item = asRecord(raw)
  const category = asRecord(item.category)
  const monthlyPlan = getDefaultPlan(raw, 'monthly')
  const yearlyPlan = getDefaultPlan(raw, 'yearly')
  const screenshots = Array.isArray(item.screenshots)
    ? item.screenshots
        .map((s) => resolveMediaUrl(asString(asRecord(s).image_path ?? asRecord(s).url ?? asRecord(s).path)))
        .filter(Boolean)
    : []
  const videos = Array.isArray(item.videos) ? item.videos.map(asRecord) : []
  const demoVideo = videos.length > 0 ? normalizeEmbedUrl(asString(videos[0].video_url)) : ''

  return {
    id: asString(item.id),
    name: asString(item.name),
    slug: asString(item.slug),
    description: asString(item.description ?? item.overview),
    short_description: asString(item.overview ?? item.description).slice(0, 160),
    category: asString(category.name ?? category.slug ?? item.category, 'General'),
    price_monthly: monthlyPlan?.price ?? 0,
    price_yearly: yearlyPlan?.price ?? 0,
    default_monthly_plan_id: monthlyPlan?.id,
    default_yearly_plan_id: yearlyPlan?.id,
    monthly_plan_name: monthlyPlan?.name,
    yearly_plan_name: yearlyPlan?.name,
    features: Array.isArray(item.features)
      ? item.features.map((f) => asString(asRecord(f).title ?? asRecord(f).name ?? f))
      : [],
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
