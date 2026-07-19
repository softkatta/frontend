import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Package, CreditCard, RefreshCw, AlertTriangle, Bell, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { ChartCard } from '@/components/common/ChartCard'
import { DataTable } from '@/components/common/DataTable'
import { PortalPage, PortalWelcome, chartTooltipStyle, portalNotificationTone } from '@/components/common/PortalPage'
import { TableActions } from '@/components/common/TableActions'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { actionBtn } from '@/lib/tableActions'
import { clientApi } from '@/services/api'
import { asBool, asRecord, asString, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapInvoice, mapNotification, mapSubscription } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { SecuritySetupWizard } from '@/components/auth/SecuritySetupWizard'
import type { Invoice, Notification } from '@/types'

const statusVariant = { paid: 'success', pending: 'warning', overdue: 'destructive', cancelled: 'secondary', sent: 'warning', draft: 'secondary' } as const

const chartData = [
  { name: 'Jan', value: 4000 }, { name: 'Feb', value: 3000 }, { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 }, { name: 'May', value: 6000 }, { name: 'Jun', value: 5500 },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.first_name || 'there'
  const [loading, setLoading] = useState(true)
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [purchasedProducts, setPurchasedProducts] = useState<Array<{ id: string; name: string; slug: string; is_active: boolean }>>([])
  const [stats, setStats] = useState({ products: 0, subscriptions: 0, renewals: 0, expiring: 0, spend: 0 })
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)
  const [domainNudgeCount, setDomainNudgeCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = asRecord(await clientApi.dashboard())
      const subs = unwrapList(data.active_subscriptions)
      try {
        const subList = unwrapList(await clientApi.subscriptions.list()).map(mapSubscription)
        setDomainNudgeCount(
          subList.filter((item) => {
            const status = item.domain_setup?.status ?? 'none'
            return status === 'none' || status === 'skipped' || status === 'rejected'
          }).length,
        )
      } catch {
        setDomainNudgeCount(0)
      }
      const products = unwrapList(data.purchased_products)
        .map((raw) => {
          const item = asRecord(raw)
          return {
            id: asString(item.id),
            name: asString(item.name, 'Product'),
            slug: asString(item.slug),
            is_active: asBool(item.is_active),
          }
        })
        .filter((p) => p.id !== '' && p.slug !== '')

      const invoices = unwrapList(data.recent_invoices).map(mapInvoice)
      setRecentInvoices(invoices)
      setPurchasedProducts(products)
      setStats({
        products: products.length,
        subscriptions: subs.filter((s) => asString(asRecord(s).status) === 'active' || asString(asRecord(s).status) === 'expiring_soon').length,
        renewals: subs.filter((s) => asString(asRecord(s).status) === 'pending').length,
        expiring: subs.filter((s) => asString(asRecord(s).status) === 'expiring_soon').length,
        spend: invoices.reduce((sum, i) => sum + i.amount, 0),
      })

      const notifications = unwrapList(await clientApi.notifications.list()).map(mapNotification).slice(0, 3)
      setRecentNotifications(notifications)
    } catch (error) {
      toast({ title: 'Failed to load dashboard', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return (
      <PortalPage className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </PortalPage>
    )
  }

  return (
    <PortalPage className="space-y-6">
      <SecuritySetupWizard />
      {domainNudgeCount > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
          <p className="text-sm font-medium">Add install domains</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {domainNudgeCount} subscription{domainNudgeCount > 1 ? 's need' : ' needs'} frontend + backend domains.
            You can skip for now — SoftKatta admin approves before license keys are issued.
          </p>
          <Link
            to="/dashboard/subscriptions"
            className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          >
            Open Subscriptions →
          </Link>
        </div>
      )}
      <PortalWelcome
        eyebrow="Client Portal"
        title={`Welcome back, ${firstName}`}
        description="Track subscriptions, invoices, and product usage from your business overview."
        aside={(
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm">
            <TrendingUp className="h-4 w-4 text-[var(--brand-teal)]" />
            <span className="text-[var(--muted-foreground)]">Recent spend</span>
            <span className="font-bold text-foreground">{formatCurrency(stats.spend)}</span>
          </div>
        )}
      />

      <PageHeader title="Overview" description="Key metrics at a glance" className="mb-0" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Products" value={stats.products} icon={Package} gradient="blue" description="Licensed products" />
        <StatCard title="Active Subscriptions" value={stats.subscriptions} icon={CreditCard} gradient="green" />
        <StatCard title="Pending Renewals" value={stats.renewals} icon={RefreshCw} gradient="teal" />
        <StatCard title="Expiring Soon" value={stats.expiring} icon={AlertTriangle} gradient="purple" description="Within 30 days" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Spending Overview" description="Monthly subscription costs" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--muted-foreground)' }} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#spendFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent Notifications" className="h-full">
          <div className="space-y-3">
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No notifications yet.</p>
            ) : recentNotifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 ${portalNotificationTone[n.type]}`}>
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)] leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="My Purchased Products" description="Only products you have already bought">
        {purchasedProducts.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">You have not purchased any products yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {purchasedProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-[var(--brand-teal)]/40 hover:bg-[var(--card)]"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate">{product.name}</span>
                  <Badge variant={product.is_active ? 'success' : 'secondary'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </span>
              </Link>
            ))}
          </div>
        )}
      </ChartCard>

      <ChartCard title="Recent Invoices">
        <DataTable
          embedded
          data={recentInvoices}
          emptyTitle="No invoices yet"
          columns={[
            { key: 'invoice_number', header: 'Invoice #', className: 'font-medium' },
            { key: 'amount', header: 'Amount', render: (i) => formatCurrency(i.amount) },
              { key: 'status', header: 'Status', render: (i) => <Badge variant={statusVariant[i.status] ?? 'secondary'}>{i.status}</Badge> },
            { key: 'due_date', header: 'Due Date', render: (i) => formatDate(i.due_date) },
            { key: 'actions', header: 'Actions', className: 'w-[100px] text-right', render: (i) => (
              <TableActions actions={[
                actionBtn('View invoice', Eye, () => setDetailInvoice(i)),
              ]} />
            ) },
          ]}
        />
      </ChartCard>

      <DetailDialog open={Boolean(detailInvoice)} onOpenChange={(open) => !open && setDetailInvoice(null)} title="Invoice details">
        {detailInvoice && (
          <>
            <DetailRow label="Invoice #" value={detailInvoice.invoice_number} />
            <DetailRow label="Amount" value={formatCurrency(detailInvoice.amount)} />
            <DetailRow label="Status" value={detailInvoice.status} />
            <DetailRow label="Due date" value={formatDate(detailInvoice.due_date)} />
            <DetailRow label="Created" value={formatDate(detailInvoice.created_at)} />
          </>
        )}
      </DetailDialog>
    </PortalPage>
  )
}
