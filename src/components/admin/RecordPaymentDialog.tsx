import { useEffect, useState } from 'react'
import { Banknote, FileText, Globe } from 'lucide-react'
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

export type PaymentMethodOption = 'cash' | 'cheque' | 'online'

export type RecordPaymentTarget = {
  paymentId?: string
  invoiceId?: string
  orderId?: string
  subscriptionId?: string
  label: string
  amount: number
}

export type RecordPaymentPayload = {
  payment_method: PaymentMethodOption
  amount?: number
  reference?: string
  notes?: string
}

type RecordPaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: RecordPaymentTarget | null
  loading?: boolean
  onSubmit: (payload: RecordPaymentPayload) => Promise<void>
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  target,
  loading = false,
  onSubmit,
}: RecordPaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethodOption>('cash')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && target) {
      setAmount(String(target.amount || ''))
      setMethod('cash')
      setReference('')
      setNotes('')
    }
  }, [open, target])

  const reset = () => {
    setMethod('cash')
    setAmount('')
    setReference('')
    setNotes('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const parsedAmount = Number(amount)
  const amountInvalid =
    !amount.trim() ||
    Number.isNaN(parsedAmount) ||
    parsedAmount <= 0 ||
    (target ? parsedAmount > target.amount + 0.001 : false)

  const handleSubmit = async () => {
    if (!target || amountInvalid) return
    await onSubmit({
      payment_method: method,
      amount: Math.round(parsedAmount * 100) / 100,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    reset()
    onOpenChange(false)
  }

  const chequeMissing = method === 'cheque' && reference.trim() === ''

  const methodBtn = (value: PaymentMethodOption, label: string, Icon: typeof Banknote) => (
    <button
      type="button"
      onClick={() => setMethod(value)}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
        method === value
          ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]'
          : 'border-[var(--border)] hover:bg-[var(--input)]/50',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

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
              <p className="mt-1 text-[var(--muted-foreground)]">
                Remaining due: {formatCurrency(target.amount)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment method</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {methodBtn('cash', 'Cash', Banknote)}
                {methodBtn('cheque', 'Cheque', FileText)}
                {methodBtn('online', 'Online', Globe)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount received</Label>
              <Input
                id="payment-amount"
                type="number"
                min={0.01}
                step="0.01"
                max={target.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 rounded-xl"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                You can enter a partial amount. Any balance stays pending.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reference">
                {method === 'cheque'
                  ? 'Cheque number'
                  : method === 'online'
                    ? 'Transaction / UTR (optional)'
                    : 'Receipt / reference (optional)'}
              </Label>
              <Input
                id="payment-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  method === 'cheque'
                    ? 'e.g. 123456'
                    : method === 'online'
                      ? 'UPI / bank reference'
                      : 'Cash receipt number'
                }
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
          <Button
            onClick={() => void handleSubmit()}
            disabled={loading || !target || chequeMissing || amountInvalid}
          >
            {loading ? 'Saving…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
