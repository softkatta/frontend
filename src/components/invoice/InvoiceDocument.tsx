import { PaymentQr } from '@/components/invoice/PaymentQr'
import type { ReactNode } from 'react'
import type { InvoiceCompanyProfile, InvoiceDetail } from '@/types'
import { DEFAULT_GST_RATE } from '@/lib/gst'
import { INVOICE_COLORS } from '@/lib/invoiceConfig'
import { getInvoiceDueMeta } from '@/lib/invoiceDue'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

type InvoiceDocumentProps = {
  invoice: InvoiceDetail
  className?: string
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--brand-navy)]">{children}</p>
  )
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      {children}
    </div>
  )
}

function InvoiceHeader({ company, gstNumber }: { company: InvoiceCompanyProfile; gstNumber?: string }) {
  const website = company.website.replace(/^https?:\/\//, '')

  return (
    <header className="relative bg-white">
      <div className="relative w-full">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="inv-hdr-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-teal)" />
              <stop offset="50%" stopColor="var(--brand-aqua)" />
              <stop offset="100%" stopColor="var(--brand-blue)" />
            </linearGradient>
            <linearGradient id="inv-hdr-wave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--brand-aqua)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <path
            fill="url(#inv-hdr-grad)"
            d="M0,0 H1440 V148 C1240,188 1040,108 820,148 C600,188 400,108 0,168 Z"
          />
          <path
            fill="url(#inv-hdr-wave)"
            d="M0,55 C220,15 420,95 640,60 C860,25 1080,85 1440,45 V0 H0 Z"
          />
        </svg>

        <div className="relative z-10 flex items-center justify-between gap-6 px-8 pb-16 pt-7 sm:px-10 sm:pb-[4.5rem] sm:pt-8">
          <div className="flex min-w-0 items-center gap-4">
            {company.logoUrl ? (
              <img
                src={resolveMediaUrl(company.logoUrl)}
                alt={company.name}
                className="h-[68px] w-[68px] shrink-0 rounded-xl bg-white object-contain p-2 shadow-lg shadow-[color-mix(in_srgb,var(--brand-blue)_22%,transparent)]"
              />
            ) : (
              <div className="flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-lg shadow-[color-mix(in_srgb,var(--brand-blue)_22%,transparent)]">
                <span className="font-display text-2xl font-black leading-none text-[var(--brand-blue)]">
                  {company.initials}
                </span>
                <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--brand-teal)]">
                  {company.name.split(' ')[0]}
                </span>
              </div>
            )}
            <div className="min-w-0 text-white">
              <p className="text-sm font-bold uppercase leading-snug tracking-wide sm:text-base">
                {company.name}
              </p>
              <p className="mt-1 text-xs text-white/90">{company.tagline}</p>
              <p className="mt-1.5 text-[11px] text-white/75">{company.address}</p>
              <p className="mt-1 text-[11px] text-white/70">
                {company.phone} · {company.email}
              </p>
              <p className="text-[11px] text-white/70">{website}</p>
              {gstNumber && (
                <p className="mt-1.5 text-[11px] font-semibold text-white/90">
                  GSTIN: {gstNumber}
                </p>
              )}
            </div>
          </div>

          <h1 className="shrink-0 text-right font-display text-[2.5rem] font-black uppercase leading-none tracking-tight text-white drop-shadow-sm sm:text-6xl">
            Invoice
          </h1>
        </div>
      </div>
    </header>
  )
}

function InvoiceSignature({ company }: { company: InvoiceCompanyProfile }) {
  if (!company.signatory && !company.signatureUrl) return null

  return (
    <div className="flex justify-end px-8 pb-6 sm:px-10">
      <div className="text-right">
        {company.signatureUrl && (
          <img
            src={resolveMediaUrl(company.signatureUrl)}
            alt="Authorized signature"
            className="ml-auto mb-2 h-16 max-w-[180px] object-contain object-right"
          />
        )}
        {company.signatory && (
          <p className="font-display text-base italic text-[var(--foreground)]">{company.signatory}</p>
        )}
        <div className="mt-8 w-48 border-t-2 border-[var(--border)] pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Authorized Signature
          </p>
        </div>
      </div>
    </div>
  )
}

function FooterWaves({ initials }: { initials: string }) {
  return (
    <div className="relative mt-6 h-32 w-full overflow-hidden" aria-hidden>
      <p className="pointer-events-none absolute bottom-4 right-10 select-none font-display text-7xl font-black text-white/25 sm:text-8xl">
        {initials}
      </p>
      <svg className="absolute bottom-0 left-0 h-full w-full" viewBox="0 0 1440 112" preserveAspectRatio="none">
        <defs>
          <linearGradient id="inv-footer-wave" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--brand-teal)" />
            <stop offset="45%" stopColor="var(--brand-aqua)" />
            <stop offset="100%" stopColor="var(--brand-blue)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#inv-footer-wave)"
          d="M0,48 C240,8 480,88 720,52 C960,16 1200,76 1440,40 L1440,112 L0,112 Z"
        />
      </svg>
    </div>
  )
}

export function InvoiceDocument({ invoice, className }: InvoiceDocumentProps) {
  const { company } = invoice
  const taxRate = invoice.items[0]?.tax_rate ?? DEFAULT_GST_RATE
  const taxTotal = invoice.cgst + invoice.sgst + invoice.igst
  const dueMeta = getInvoiceDueMeta(invoice)
  const money = (amount: number) => formatCurrency(amount, invoice.currency)
  const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
  const gstNumber = (invoice.gst.gst_number ?? company.gstNumber ?? '').trim() || undefined

  return (
    <article
      id="invoice-print-area"
      className={cn(
        'mx-auto w-full max-w-[820px] overflow-hidden bg-white text-[var(--foreground)] shadow-2xl shadow-[color-mix(in_srgb,var(--brand-blue)_12%,transparent)] print:shadow-none',
        className,
      )}
    >
      <InvoiceHeader company={company} gstNumber={gstNumber} />

      <div className="relative z-10 grid gap-8 px-8 pb-8 pt-6 sm:grid-cols-2 sm:px-10 sm:pt-8">
        <InfoBlock label="Invoice To">
          <p className="text-base font-bold text-[var(--brand-blue)]">{invoice.billing.name}</p>
          {invoice.billing.company && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{invoice.billing.company}</p>
          )}
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted-foreground)]">
            {invoice.billing.address && <li>{invoice.billing.address}</li>}
            {invoice.billing.phone && <li>{invoice.billing.phone}</li>}
            {invoice.billing.email && <li>{invoice.billing.email}</li>}
            {invoice.gst.customer_gst && (
              <li>
                <span className="text-[var(--muted-foreground)]">GSTIN: </span>
                {invoice.gst.customer_gst}
              </li>
            )}
          </ul>
        </InfoBlock>

        <InfoBlock label={`Invoice No. ${invoice.invoice_number}`}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted-foreground)]">Invoice Date</dt>
              <dd className="font-semibold text-[var(--foreground)]">{formatDate(invoice.created_at)}</dd>
            </div>
            {dueMeta.hasDue && (
              <>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                  <dt className="text-[var(--muted-foreground)]">Due Date</dt>
                  <dd className="font-semibold text-[var(--foreground)]">{formatDate(invoice.due_date)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                  <dt className="text-[var(--muted-foreground)]">Due Balance</dt>
                  <dd className="font-bold text-[var(--brand-navy)]">{money(dueMeta.dueBalance)}</dd>
                </div>
                {dueMeta.isOverdue && dueMeta.daysOverdue !== null && (
                  <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--muted-foreground)]">Days Overdue</dt>
                    <dd className="font-semibold text-red-600">{dueMeta.daysOverdue} days</dd>
                  </div>
                )}
                {!dueMeta.isOverdue && dueMeta.daysUntilDue !== null && dueMeta.daysUntilDue >= 0 && (
                  <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                    <dt className="text-[var(--muted-foreground)]">Days Until Due</dt>
                    <dd className="font-semibold text-[var(--foreground)]">{dueMeta.daysUntilDue} days</dd>
                  </div>
                )}
              </>
            )}
            {dueMeta.isPaid && invoice.paid_date && (
              <>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                  <dt className="text-[var(--muted-foreground)]">Paid Date</dt>
                  <dd className="font-semibold text-[var(--foreground)]">{formatDate(invoice.paid_date)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
                  <dt className="text-[var(--muted-foreground)]">Amount Paid</dt>
                  <dd className="font-bold text-emerald-700">{money(invoice.amount)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-[var(--muted-foreground)]">Status</dt>
              <dd className="font-semibold text-[var(--foreground)]">{statusLabel}</dd>
            </div>
          </dl>
        </InfoBlock>
      </div>

      <div className="px-8 sm:px-10">
        <div className="overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px] font-bold uppercase tracking-wider text-white"
                style={{ background: INVOICE_COLORS.gradient }}
              >
                <th className="w-12 px-4 py-3.5 text-center">S/L</th>
                <th className="px-4 py-3.5">Product Description</th>
                <th className="w-16 px-4 py-3.5 text-center">Qty</th>
                <th className="hidden px-4 py-3.5 text-right sm:table-cell">Unit Price</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border-b border-[var(--border)] px-4 py-8 text-center text-[var(--muted-foreground)]">
                    No line items
                  </td>
                </tr>
              ) : (
                invoice.items.map((line, index) => (
                  <tr key={index} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3.5 text-center text-[var(--muted-foreground)]">{index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                      {line.description}
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)] sm:hidden">
                        {money(line.unit_price)} × {line.quantity}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-center text-[var(--muted-foreground)]">{line.quantity}</td>
                    <td className="hidden px-4 py-3.5 text-right text-[var(--muted-foreground)] sm:table-cell">
                      {money(line.unit_price)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-[var(--foreground)]">{money(line.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end px-8 py-8 sm:px-10">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between border-b border-[var(--border)] pb-2 text-[var(--muted-foreground)]">
            <span className="font-bold uppercase tracking-wide text-[var(--brand-navy)]">Sub-Total</span>
            <span className="font-semibold text-[var(--foreground)]">{money(invoice.subtotal)}</span>
          </div>
          {invoice.cgst > 0 && (
            <>
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>CGST ({(taxRate / 2).toFixed(0)}%)</span>
                <span className="font-medium">{money(invoice.cgst)}</span>
              </div>
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>SGST ({(taxRate / 2).toFixed(0)}%)</span>
                <span className="font-medium">{money(invoice.sgst)}</span>
              </div>
            </>
          )}
          {invoice.igst > 0 && (
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>GST ({taxRate.toFixed(0)}%)</span>
              <span className="font-medium">{money(invoice.igst)}</span>
            </div>
          )}
          {taxTotal === 0 && invoice.tax_amount > 0 && (
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Tax</span>
              <span className="font-medium">{money(invoice.tax_amount)}</span>
            </div>
          )}
          {taxTotal === 0 && invoice.tax_amount === 0 && (
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>GST</span>
              <span className="font-medium">{money(0)}</span>
            </div>
          )}
          <div
            className="mt-3 flex items-center justify-between rounded-full px-5 py-3 text-white"
            style={{ background: INVOICE_COLORS.gradient }}
          >
            <span className="text-sm font-bold uppercase tracking-wide">Total</span>
            <span className="text-lg font-bold">{money(invoice.amount)}</span>
          </div>
          {dueMeta.hasDue && (
            <div className="mt-2 flex items-center justify-between rounded-full border-2 border-[var(--brand-navy)] bg-[color-mix(in_srgb,var(--brand-navy)_6%,white)] px-5 py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-[var(--brand-navy)]">Amount Due</span>
              <span className="text-lg font-bold text-[var(--brand-navy)]">{money(dueMeta.dueBalance)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 px-8 pb-4 sm:px-10">
        {dueMeta.hasDue && (
          <PaymentQr
            payload={invoice.paymentQrPayload}
            vpa={company.upiVpa}
            payeeName={company.name}
            amount={invoice.amount}
            note={`Invoice ${invoice.invoice_number}`}
            currency={invoice.currency}
            className="flex justify-start"
          />
        )}

        <div>
          <SectionTitle>Terms</SectionTitle>
          <p className="max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">{invoice.terms}</p>
        </div>
      </div>

      <InvoiceSignature company={company} />

      <FooterWaves initials={company.initials} />
    </article>
  )
}
