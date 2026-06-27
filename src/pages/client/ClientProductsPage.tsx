import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { PortalPanel } from '@/components/common/PortalPage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getProductScreenshot } from '@/lib/productAssets'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { clientApi } from '@/services/api'
import { asRecord, unwrapList } from '@/lib/apiHelpers'
import { mapApiProduct } from '@/lib/apiMappers'
import { useListData } from '@/hooks/useListData'

export default function ClientProductsPage() {
  const fetcher = useCallback(() => clientApi.products.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map((item) => mapApiProduct(asRecord(item).product ?? item)), [])
  const { items, loading, error } = useListData(fetcher, mapper)

  return (
    <PortalPageShell
      eyebrow="Products"
      heroTitle="My Products"
      heroDescription="Products and licenses assigned to your account."
      title="My Products"
      description="Products licensed to your account"
      loading={loading}
      error={error}
    >
      {items.length === 0 ? (
        <PortalPanel className="p-8 text-center">
          <p className="text-[var(--muted-foreground)]">No licensed products yet.</p>
          <Button className="mt-4 rounded-xl glow-btn" asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </PortalPanel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((product) => (
            <PortalPanel key={product.id} className="p-6 transition-colors hover:border-[var(--brand-teal)]/30">
              <div className="flex gap-4">
                <img
                  src={product.images[0] ? resolveMediaUrl(product.images[0]) : getProductScreenshot(product.slug)}
                  alt={product.name}
                  className="h-16 w-24 shrink-0 rounded-lg border border-[var(--border)] object-cover bg-[var(--input)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{product.category}</Badge>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{product.short_description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(product.price_monthly)}
                      <span className="text-[var(--muted-foreground)] font-normal">/mo</span>
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/products/${product.slug}`} className="gap-1.5">
                        Manage <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </PortalPanel>
          ))}
        </div>
      )}
    </PortalPageShell>
  )
}
