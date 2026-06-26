import { Navigate, useParams } from 'react-router-dom'
import { InvoiceViewShell } from '@/components/invoice/InvoiceViewShell'
import { adminApi } from '@/services/api'

export default function AdminInvoiceViewPage() {
  const { id } = useParams()
  if (!id) return <Navigate to="/admin/invoices" replace />

  return (
    <InvoiceViewShell
      invoiceId={id}
      backTo="/admin/invoices"
      backLabel="Back to invoices"
      fetchInvoice={(invoiceId) => adminApi.invoices.get(invoiceId)}
      downloadInvoice={(invoiceId) => adminApi.invoices.download(invoiceId)}
      onMarkPaid={async () => { await adminApi.invoices.update(id, { status: 'paid' }) }}
    />
  )
}
