import { useCallback, useEffect, useState } from 'react'
import { Printer, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { InvoiceDocument } from '@/components/invoice/InvoiceDocument'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { mapInvoiceDetail } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import type { InvoiceDetail } from '@/types'

type InvoiceViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string | null
  fetchInvoice: (id: string) => Promise<unknown>
}

export function InvoiceViewDialog({
  open,
  onOpenChange,
  invoiceId,
  fetchInvoice,
}: InvoiceViewDialogProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const data = await fetchInvoice(id)
      setInvoice(mapInvoiceDetail(data))
    } catch (err) {
      toast({ title: 'Failed to load invoice', description: getApiErrorMessage(err), variant: 'destructive' })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }, [fetchInvoice, onOpenChange])

  useEffect(() => {
    if (open && invoiceId) void load(invoiceId)
    if (!open) setInvoice(null)
  }, [open, invoiceId, load])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-[960px] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none print:max-h-none print:max-w-none">
        <div className="flex max-h-[95vh] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl print:rounded-none print:border-0 print:shadow-none">
          {/* Toolbar */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)]/95 px-5 py-3.5 backdrop-blur-sm print:hidden">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Invoice Preview
              </DialogTitle>
              {invoice && (
                <p className="text-xs text-[var(--muted-foreground)]">{invoice.invoice_number}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => window.print()} disabled={!invoice}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 to-slate-200/90 p-5 sm:p-8 print:overflow-visible print:bg-white print:p-0">
            {loading ? (
              <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
            ) : invoice ? (
              <InvoiceDocument invoice={invoice} />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
