import type { InvoiceDetail } from '@/types'

export type InvoiceDueMeta = {
  hasDue: boolean
  isPaid: boolean
  dueBalance: number
  isOverdue: boolean
  daysOverdue: number | null
  daysUntilDue: number | null
}

export function getInvoiceDueMeta(invoice: InvoiceDetail): InvoiceDueMeta {
  const isPaid = invoice.status === 'paid'
  const isCancelled = invoice.status === 'cancelled'
  const hasDue = !isPaid && !isCancelled
  const dueBalance = hasDue ? invoice.amount : 0

  if (!hasDue || !invoice.due_date) {
    return {
      hasDue,
      isPaid,
      dueBalance,
      isOverdue: false,
      daysOverdue: null,
      daysUntilDue: null,
    }
  }

  const dueDate = new Date(invoice.due_date)
  const today = new Date()
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = invoice.status === 'overdue' || diffDays < 0

  return {
    hasDue,
    isPaid,
    dueBalance,
    isOverdue,
    daysOverdue: isOverdue ? Math.abs(diffDays) : null,
    daysUntilDue: !isOverdue && diffDays >= 0 ? diffDays : null,
  }
}
