import { useEffect, useState } from 'react'
import { Users, DollarSign, Package, LifeBuoy, TrendingUp, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { ChartCard } from '@/components/common/ChartCard'
import { PortalPage, PortalWelcome, chartTooltipStyle } from '@/components/common/PortalPage'
import { AdminDashboardSkeleton } from '@/components/admin/shell/AdminPageSkeleton'
import { formatCurrency } from '@/lib/utils'
import { adminApi } from '@/services/api'
import { asRecord, asNumber, getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

const fallbackChart = [
  { name: 'Jan', revenue: 45000, customers: 120 }, { name: 'Feb', revenue: 52000, customers: 135 },
  { name: 'Mar', revenue: 48000, customers: 128 }, { name: 'Apr', revenue: 61000, customers: 150 },
  { name: 'May', revenue: 55000, customers: 142 }, { name: 'Jun', revenue: 67000, customers: 165 },
]

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    customers: 0,
    revenue: 0,
    products: 0,
    tickets: 0,
    visitorsToday: 0,
    visitorsMonth: 0,
  })
  const [chartData, setChartData] = useState(fallbackChart)

  useEffect(() => {
    void (async () => {
      try {
        const data = asRecord(await adminApi.reports.dashboard())
        const users = asRecord(data.users)
        const revenue = asRecord(data.revenue)
        const support = asRecord(data.support)
        const subscriptions = asRecord(data.subscriptions)
        const visitors = asRecord(data.visitors)
        setStats({
          customers: asNumber(users.active ?? users.total),
          revenue: asNumber(revenue.paid_invoices ?? revenue.total_orders),
          products: asNumber(subscriptions.active),
          tickets: asNumber(support.open_tickets) + asNumber(support.in_progress),
          visitorsToday: asNumber(visitors.today),
          visitorsMonth: asNumber(visitors.month),
        })
        const revenueReport = asRecord(await adminApi.reports.revenue())
        const monthly = Array.isArray(revenueReport.monthly) ? revenueReport.monthly : fallbackChart
        if (monthly.length > 0) setChartData(monthly as typeof fallbackChart)
      } catch (error) {
        toast({ title: 'Using cached dashboard data', description: getApiErrorMessage(error), variant: 'default' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <PortalPage className="space-y-8">
        <AdminDashboardSkeleton />
      </PortalPage>
    )
  }

  return (
    <PortalPage className="space-y-8">
      <PortalWelcome
        eyebrow="Admin Portal"
        title="Platform overview"
        description="Monitor revenue, customers, visitors, and support activity across SoftKatta."
        aside={(
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm">
            <TrendingUp className="h-4 w-4 text-[var(--brand-teal)]" />
            <span className="text-[var(--muted-foreground)]">Revenue</span>
            <span className="font-bold text-foreground">{formatCurrency(stats.revenue)}</span>
          </div>
        )}
      />

      <PageHeader title="Key Metrics" description="Platform performance at a glance" className="mb-0" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Customers" value={stats.customers} icon={Users} gradient="blue" />
        <StatCard title="Monthly Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} gradient="green" />
        <StatCard title="Active Subscriptions" value={stats.products} icon={Package} gradient="teal" />
        <StatCard title="Open Tickets" value={stats.tickets} icon={LifeBuoy} gradient="purple" />
        <StatCard
          title="Visitors Today"
          value={stats.visitorsToday}
          description={`${stats.visitorsMonth} unique this month`}
          icon={Eye}
          gradient="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Overview" description="Monthly revenue trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--muted-foreground)' }} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Growth" description="New customers per month">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--muted-foreground)' }} />
              <Line type="monotone" dataKey="customers" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </PortalPage>
  )
}
