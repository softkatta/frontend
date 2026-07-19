import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, IndianRupee, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { InvoiceDocument } from '@/components/invoice/InvoiceDocument'
import { PortalPage } from '@/components/common/PortalPage'
import { RecordPaymentDialog, type RecordPaymentPayload, type RecordPaymentTarget } from '@/components/admin/RecordPaymentDialog'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { mapInvoiceDetail } from '@/lib/apiMappers'
import { getInvoiceDueMeta } from '@/lib/invoiceDue'
import { toast } from '@/components/ui/toaster'
import type { InvoiceDetail } from '@/types'

type InvoiceViewShellProps = {
  invoiceId: string
  backTo: string
  backLabel?: string
  fetchInvoice: (id: string) => Promise<unknown>
  onMarkPaid?: () => Promise<void>
  onRecordPayment?: (payload: RecordPaymentPayload) => Promise<void>
}

export function InvoiceViewShell({
  invoiceId,
  backTo,
  backLabel = 'Back to invoices',
  fetchInvoice,
  onMarkPaid,
  onRecordPayment,
}: InvoiceViewShellProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [recordingPayment, setRecordingPayment] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchInvoice(invoiceId)
      setInvoice(mapInvoiceDetail(data))
    } catch (err) {
      toast({ title: 'Failed to load invoice', description: getApiErrorMessage(err), variant: 'destructive' })
      setInvoice(null)
    } finally {
      setLoading(false)
    }
  }, [fetchInvoice, invoiceId])

  useEffect(() => { void load() }, [load])

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return
    setMarkingPaid(true)
    try {
      await onMarkPaid()
      toast({ title: 'Invoice marked as paid', variant: 'success' })
      await load()
    } catch (err) {
      toast({ title: 'Failed to update invoice', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleRecordPayment = async (payload: RecordPaymentPayload) => {
    if (!onRecordPayment) return
    setRecordingPayment(true)
    try {
      await onRecordPayment(payload)
      toast({ title: 'Payment recorded', variant: 'success' })
      setPaymentOpen(false)
      await load()
    } catch (err) {
      toast({ title: 'Failed to record payment', description: getApiErrorMessage(err), variant: 'destructive' })
      throw err
    } finally {
      setRecordingPayment(false)
    }
  }

  const dueMeta = invoice ? getInvoiceDueMeta(invoice) : null
  const canRecordPayment = Boolean(onRecordPayment && dueMeta?.hasDue)
  const canMarkPaid = Boolean(onMarkPaid && !onRecordPayment && dueMeta?.hasDue)
  const paymentTarget: RecordPaymentTarget | null = invoice && canRecordPayment && dueMeta
    ? {
        invoiceId,
        label: invoice.invoice_number,
        amount: dueMeta.dueBalance > 0 ? dueMeta.dueBalance : invoice.amount,
      }
    : null

  return (
    <PortalPage className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" className="h-9 rounded-lg" asChild>
          <Link to={backTo}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {canRecordPayment && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
              onClick={() => setPaymentOpen(true)}
            >
              <IndianRupee className="mr-1.5 h-4 w-4" />
              Record payment
            </Button>
          )}
          {canMarkPaid && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
              onClick={() => void handleMarkPaid()}
              disabled={markingPaid}
            >
              {markingPaid ? 'Updating…' : 'Mark as Paid'}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => window.print()} disabled={!invoice}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        loading={recordingPayment}
        onSubmit={handleRecordPayment}
      />

      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[color-mix(in_srgb,var(--brand-teal)_6%,white)] to-[color-mix(in_srgb,var(--brand-blue)_5%,white)] p-4 sm:p-8 print:border-0 print:bg-white print:p-0">
        {loading ? (
          <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
        ) : invoice ? (
          <InvoiceDocument invoice={invoice} />
        ) : (
          <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">Invoice not found.</p>
        )}
      </div>
    </PortalPage>
  )
}
