import { useCallback, useState, useEffect } from 'react'
import { Download, RefreshCw, Users, CreditCard, IndianRupee, FileCheck, BarChart3, Package, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ChartCard } from '@/components/common/ChartCard'
import { StatCard } from '@/components/common/StatCard'
import { PortalPage, PortalWelcome, chartTooltipStyle } from '@/components/common/PortalPage'
import { AdminTabsList, AdminTabsTrigger, AdminToolbar } from '@/components/admin/AdminUi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { adminApi } from '@/services/api'
import { asRecord, getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'

const COLORS = ['#14b8a6', '#2563eb', '#8b5cf6', '#f59e0b', '#1e293b']

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(todayStr())
  const [productData, setProductData] = useState<{ name: string; value: number }[]>([])
  const [regionData, setRegionData] = useState<{ name: string; customers: number }[]>([])
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null)
  const [revenueData, setRevenueData] = useState<{ name: string; total: number }[]>([])
  const [subscriptionData, setSubscriptionData] = useState<{ name: string; count: number }[]>([])
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [productsRes, dashboardRes, revenueRes, subsRes] = await Promise.all([
        adminApi.reports.products(),
        adminApi.reports.dashboard({ from, to }),
        adminApi.reports.revenue({ from, to }),
        adminApi.reports.subscriptions(),
      ])
      const products = asRecord(productsRes)
      setProductData(Array.isArray(products.distribution) ? products.distribution as { name: string; value: number }[] : [])
      setRegionData(Array.isArray(products.regions) ? products.regions as { name: string; customers: number }[] : [])
      setDashboard(asRecord(dashboardRes))

      const revenue = asRecord(revenueRes)
      const gateways = Array.isArray(revenue.by_gateway) ? revenue.by_gateway : []
      setRevenueData(gateways.map((g: unknown) => {
        const row = asRecord(g)
        return { name: String(row.gateway ?? 'Unknown'), total: Number(row.total ?? 0) }
      }))

      const subs = asRecord(subsRes)
      setSubscriptionData(Object.entries(subs).map(([name, count]) => ({ name: name.replace(/_/g, ' '), count: Number(count) })))
    } catch (err) {
      toast({ title: 'Failed to load reports', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { void load() }, [load])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await adminApi.reports.exportCsv({ from, to })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `softkatta-report-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Report exported', variant: 'success' })
    } catch (err) {
      toast({ title: 'Export failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const dash = dashboard ?? {}
  const revenue = asRecord(dash.revenue)
  const users = asRecord(dash.users)
  const subscriptions = asRecord(dash.subscriptions)

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Analytics"
        title="Business reports"
        description="Track clients, revenue, subscriptions, and regional growth across your platform."
      />

      <PageHeader title="Reports" description="Analytics and business intelligence" className="mb-0">
        <AdminToolbar>
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 w-full rounded-xl bg-[var(--input-background)] sm:w-40" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 w-full rounded-xl bg-[var(--input-background)] sm:w-40" />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button className="rounded-xl glow-btn" onClick={() => void handleExport()} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </AdminToolbar>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center p-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Clients" value={Number(users.total ?? 0)} icon={Users} gradient="blue" />
            <StatCard title="Active Subscriptions" value={Number(subscriptions.active ?? 0)} icon={CreditCard} gradient="teal" />
            <StatCard title="Order Revenue" value={`₹${Number(revenue.total_orders ?? 0).toLocaleString()}`} icon={IndianRupee} gradient="green" />
            <StatCard title="Paid Invoices" value={`₹${Number(revenue.paid_invoices ?? 0).toLocaleString()}`} icon={FileCheck} gradient="purple" />
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <AdminTabsList className="sm:w-auto">
              <AdminTabsTrigger value="products" icon={Package}>Products</AdminTabsTrigger>
              <AdminTabsTrigger value="revenue" icon={BarChart3}>Revenue</AdminTabsTrigger>
              <AdminTabsTrigger value="customers" icon={MapPin}>Customers</AdminTabsTrigger>
            </AdminTabsList>

            <TabsContent value="products" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Product Distribution" description="Active subscriptions by product">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={productData.length ? productData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {(productData.length ? productData : [{ name: 'No data', value: 1 }]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Customers by Region" description="Geographic distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={regionData.length ? regionData : [{ name: 'No data', customers: 0 }]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} width={100} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="customers" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Revenue by Gateway" description={`${from} to ${to}`}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.length ? revenueData : [{ name: 'No payments', total: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Total']} />
                      <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Subscription Status" description="All subscriptions">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={subscriptionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="mt-0">
              <ChartCard title="Customers by Region" description="Top regions by client count">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={regionData.length ? regionData : [{ name: 'No data', customers: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="customers" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </TabsContent>
          </Tabs>
        </>
      )}
    </PortalPage>
  )
}
