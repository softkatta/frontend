import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminInvoice } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'

const statusVariant = { paid: 'success', pending: 'warning', overdue: 'destructive', cancelled: 'secondary', sent: 'warning', draft: 'secondary' } as const

type InvoiceRow = ReturnType<typeof mapAdminInvoice>

export default function InvoicesManagement() {
  const navigate = useNavigate()
  const fetcher = useCallback(() => adminApi.invoices.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminInvoice), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.invoices.delete(deleteTarget.id)
      toast({ title: 'Invoice deleted', description: deleteTarget.invoice_number, variant: 'success' })
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Billing"
        heroTitle="Invoices"
        heroDescription="Review GST invoices generated automatically from customer orders."
        title="Invoices Management"
        description="Manage all platform invoices — created automatically from orders"
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['invoice_number', 'customer']}
          searchPlaceholder="Search invoices..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'sent', label: 'Sent' },
            ]},
          ]}
          pageSize={5}
          data={items}
          columns={[
            { key: 'invoice_number', header: 'Invoice #', className: 'font-medium' },
            { key: 'customer', header: 'Customer' },
            { key: 'amount', header: 'Amount', render: (i) => formatCurrency(i.amount) },
            { key: 'status', header: 'Status', render: (i) => <Badge variant={statusVariant[i.status as keyof typeof statusVariant] ?? 'secondary'}>{i.status}</Badge> },
            { key: 'due_date', header: 'Due Date', render: (i) => formatDate(i.due_date) },
            { key: 'actions', header: 'Actions', className: 'w-[120px] text-right', render: (i) => (
              <TableActions actions={[
                actionBtn('View invoice', Eye, () => navigate(`/admin/invoices/${i.id}`)),
                { ...actionBtn('Delete invoice', Trash2, () => setDeleteTarget(i)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete invoice?"
        description={deleteTarget ? `This will permanently remove invoice ${deleteTarget.invoice_number} and its linked payment records.` : ''}
        confirmLabel="Delete invoice"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
