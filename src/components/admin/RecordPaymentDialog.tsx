import { useState } from 'react'
import { Banknote, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type RecordPaymentTarget = {
  paymentId?: string
  invoiceId?: string
  orderId?: string
  subscriptionId?: string
  label: string
  amount: number
}

type RecordPaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: RecordPaymentTarget | null
  loading?: boolean
  onSubmit: (payload: {
    payment_method: 'cash' | 'cheque'
    reference?: string
    notes?: string
  }) => Promise<void>
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  target,
  loading = false,
  onSubmit,
}: RecordPaymentDialogProps) {
  const [method, setMethod] = useState<'cash' | 'cheque'>('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setMethod('cash')
    setReference('')
    setNotes('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = async () => {
    if (!target) return
    await onSubmit({
      payment_method: method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    reset()
    onOpenChange(false)
  }

  const chequeMissing = method === 'cheque' && reference.trim() === ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>

        {target ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/30 px-3 py-2.5 text-sm">
              <p className="font-medium text-foreground">{target.label}</p>
              <p className="mt-1 text-[var(--muted-foreground)]">Amount: {formatCurrency(target.amount)}</p>
            </div>

            <div className="space-y-2">
              <Label>Payment method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    method === 'cash'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]'
                      : 'border-[var(--border)] hover:bg-[var(--input)]/50',
                  )}
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('cheque')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                    method === 'cheque'
                      ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]'
                      : 'border-[var(--border)] hover:bg-[var(--input)]/50',
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Cheque
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reference">
                {method === 'cheque' ? 'Cheque number' : 'Receipt / reference (optional)'}
              </Label>
              <Input
                id="payment-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={method === 'cheque' ? 'e.g. 123456' : 'Cash receipt number'}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notes (optional)</Label>
              <textarea
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Bank name, received by, etc."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading || !target || chequeMissing}>
            {loading ? 'Saving…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
