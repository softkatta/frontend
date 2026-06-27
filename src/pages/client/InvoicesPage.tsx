import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { clientApi } from '@/services/api'
import { unwrapList } from '@/lib/apiHelpers'
import { mapInvoice } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'

const statusVariant = { paid: 'success', pending: 'warning', overdue: 'destructive', cancelled: 'secondary', sent: 'warning', draft: 'secondary' } as const

export default function InvoicesPage() {
  const navigate = useNavigate()
  const fetcher = useCallback(() => clientApi.invoices.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapInvoice), [])
  const { items, loading, error } = useListData(fetcher, mapper)

  return (
    <PortalPageShell
      eyebrow="Billing"
      heroTitle="Invoices"
      heroDescription="View, print, and track GST invoices for your purchases."
      title="Invoices"
      description="View and print your invoices"
      loading={loading}
      error={error}
    >
      <DataTable
        embedded
        searchKeys={['invoice_number']}
        searchPlaceholder="Search invoices..."
        filters={[
          { key: 'status', label: 'Status', options: [
            { value: 'paid', label: 'Paid' },
            { value: 'pending', label: 'Pending' },
            { value: 'overdue', label: 'Overdue' },
          ]},
        ]}
        pageSize={5}
        data={items}
        columns={[
          { key: 'invoice_number', header: 'Invoice #', className: 'font-medium' },
          { key: 'amount', header: 'Amount', render: (i) => formatCurrency(i.amount) },
          { key: 'status', header: 'Status', render: (i) => <Badge variant={statusVariant[i.status] ?? 'secondary'}>{i.status}</Badge> },
          { key: 'due_date', header: 'Due Date', render: (i) => formatDate(i.due_date) },
          { key: 'created_at', header: 'Created', render: (i) => formatDate(i.created_at) },
          { key: 'actions', header: 'Actions', className: 'w-[100px] text-right', render: (i) => (
            <TableActions actions={[
              actionBtn('View invoice', Eye, () => navigate(`/dashboard/invoices/${i.id}`)),
            ]} />
          ) },
        ]}
      />
    </PortalPageShell>
  )
}
