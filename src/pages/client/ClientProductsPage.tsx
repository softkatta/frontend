import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { actionBtn } from '@/lib/tableActions'
import { formatCurrency } from '@/lib/utils'
import { clientApi } from '@/services/api'
import { asRecord, unwrapList } from '@/lib/apiHelpers'
import { mapApiProduct } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'

export default function ClientProductsPage() {
  const navigate = useNavigate()
  const fetcher = useCallback(async () => {
    const productsResponse = await clientApi.products.list()
    const products = unwrapList(productsResponse)
    if (products.length > 0) {
      return productsResponse
    }

    const dashboard = asRecord(await clientApi.dashboard())
    return dashboard.purchased_products ?? []
  }, [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map((item) => mapApiProduct(asRecord(item).product ?? item)), [])
  const { items, loading, error } = useListData(fetcher, mapper)

  return (
    <PortalPageShell
      eyebrow="Products"
      heroTitle="My Products"
      heroDescription="Products and licenses assigned to your account."
      title="My Products"
      description="Products licensed to your account"
      actions={
        <Button onClick={() => navigate('/products')} className="rounded-xl glow-btn">
          Browse Products
        </Button>
      }
      loading={loading}
      error={error}
    >
      <DataTable
        embedded
        searchKeys={['name', 'category']}
        searchPlaceholder="Search products..."
        filters={[
          {
            key: 'is_active',
            label: 'Status',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
        pageSize={5}
        data={items}
        emptyTitle="No licensed products yet"
        emptyDescription="Purchase a product to see it in your list."
        columns={[
          { key: 'name', header: 'Product', className: 'font-medium' },
          { key: 'category', header: 'Category', render: (p) => <Badge variant="outline">{p.category}</Badge> },
          {
            key: 'is_active',
            header: 'Status',
            render: (p) => <Badge variant={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>,
          },
          { key: 'price_monthly', header: 'Price', render: (p) => `${formatCurrency(p.price_monthly)}/mo` },
          {
            key: 'actions',
            header: 'Actions',
            className: 'w-[120px] text-right',
            render: (p) => (
              <TableActions
                actions={[
                  actionBtn('Manage', ExternalLink, () => navigate(`/products/${p.slug}`)),
                ]}
              />
            ),
          },
        ]}
      />
    </PortalPageShell>
  )
}
