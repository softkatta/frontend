import { Navigate, useParams } from 'react-router-dom'
import { InvoiceViewShell } from '@/components/invoice/InvoiceViewShell'
import { clientApi } from '@/services/api'

export default function ClientInvoiceViewPage() {
  const { id } = useParams()
  if (!id) return <Navigate to="/dashboard/invoices" replace />

  return (
    <InvoiceViewShell
      invoiceId={id}
      backTo="/dashboard/invoices"
      backLabel="Back to invoices"
      fetchInvoice={(invoiceId) => clientApi.invoices.get(invoiceId)}
      downloadInvoice={(invoiceId) => clientApi.invoices.download(invoiceId)}
    />
  )
}
