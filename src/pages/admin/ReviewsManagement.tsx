import { useCallback, useEffect, useState } from 'react'
import {
  BadgeCheck, Check, Download, Eye, MessageSquare, Star, Trash2, X,
} from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/reviews/StarRating'
import { adminReviewsApi } from '@/services/api/modules/reviews.api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import type { AdminReview, ReviewStats } from '@/types/reviews'

const emptyStats: ReviewStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  featured: 0,
  average_rating: 0,
  product_reviews: 0,
  service_reviews: 0,
  rating_distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
  recommend_percent: 0,
}

export default function ReviewsManagement() {
  const [items, setItems] = useState<AdminReview[]>([])
  const [stats, setStats] = useState<ReviewStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminReview | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null)
  const [replyTarget, setReplyTarget] = useState<AdminReview | null>(null)
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, nextStats] = await Promise.all([
        adminReviewsApi.list({ per_page: 100 }),
        adminReviewsApi.stats(),
      ])
      setItems(list.data ?? [])
      setStats(nextStats)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      toast({ title: label, variant: 'success' })
      setDetail(null)
      setReplyTarget(null)
      setReplyText('')
      await load()
    } catch (err) {
      toast({ title: 'Action failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await adminReviewsApi.export()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reviews-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Export downloaded', variant: 'success' })
    } catch (err) {
      toast({ title: 'Export failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const statusBadge = (status: string) => {
    const variant = status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'
    return <Badge variant={variant}>{status}</Badge>
  }

  return (
    <>
      <PortalPageShell
        eyebrow="Website"
        heroTitle="Reviews"
        heroDescription="Moderate customer product and service reviews."
        title="Review Management"
        description="Approve, feature, reply, and export customer reviews"
        actions={
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => void handleExport()}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
        loading={loading}
        error={error}
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Approved', value: stats.approved },
            { label: 'Rejected', value: stats.rejected },
            { label: 'Featured', value: stats.featured },
            { label: 'Avg rating', value: stats.average_rating.toFixed(1) },
            { label: 'Product', value: stats.product_reviews },
            { label: 'Service', value: stats.service_reviews },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-xl font-bold tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>

        <DataTable
          embedded
          searchKeys={['full_name', 'email', 'mobile', 'title', 'company_name', 'target_name']}
          searchPlaceholder="Search reviews..."
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ],
            },
            {
              key: 'review_type',
              label: 'Type',
              options: [
                { value: 'all', label: 'All types' },
                { value: 'product', label: 'Product' },
                { value: 'service', label: 'Service' },
              ],
            },
            {
              key: 'rating',
              label: 'Rating',
              options: [
                { value: 'all', label: 'All ratings' },
                { value: '5', label: '5 stars' },
                { value: '4', label: '4 stars' },
                { value: '3', label: '3 stars' },
                { value: '2', label: '2 stars' },
                { value: '1', label: '1 star' },
              ],
            },
            {
              key: 'is_featured',
              label: 'Featured',
              options: [
                { value: 'all', label: 'All' },
                { value: 'true', label: 'Featured' },
                { value: 'false', label: 'Not featured' },
              ],
            },
          ]}
          pageSize={10}
          data={items.map((r) => ({
            ...r,
            id: String(r.id),
            is_featured: String(r.is_featured),
            rating: String(r.rating),
          }))}
          emptyTitle="No reviews yet"
          emptyDescription="Customer reviews will appear here after submission."
          columns={[
            { key: 'full_name', header: 'Customer', className: 'font-medium min-w-[140px]', render: (r) => (
              <div>
                <p>{r.full_name}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
              </div>
            ) },
            { key: 'review_type', header: 'Type', render: (r) => <Badge variant="outline">{r.review_type}</Badge> },
            { key: 'target_name', header: 'Target', render: (r) => r.target_name || '—' },
            { key: 'rating', header: 'Rating', render: (r) => <StarRating value={Number(r.rating)} readOnly size="sm" /> },
            { key: 'title', header: 'Title', className: 'min-w-[160px]' },
            { key: 'status', header: 'Status', render: (r) => statusBadge(r.status) },
            { key: 'is_featured', header: 'Featured', render: (r) => (r.is_featured === 'true' ? 'Yes' : '—') },
            { key: 'created_at', header: 'Date', render: (r) => formatDate(r.created_at || '') },
            { key: 'actions', header: '', className: 'w-[140px] text-right', render: (r) => {
              const row = items.find((i) => String(i.id) === String(r.id))
              if (!row) return null
              return (
                <TableActions actions={[
                  actionBtn('View', Eye, () => setDetail(row)),
                  ...(row.status === 'pending' ? [
                    actionBtn('Approve', Check, () => void runAction('Review approved', () => adminReviewsApi.approve(row.id))),
                    { ...actionBtn('Reject', X, () => void runAction('Review rejected', () => adminReviewsApi.reject(row.id))), variant: 'destructive' as const },
                  ] : []),
                  actionBtn('Reply', MessageSquare, () => { setReplyTarget(row); setReplyText(row.admin_reply || '') }),
                  { ...actionBtn('Delete', Trash2, () => setDeleteTarget(row)), variant: 'destructive' as const },
                ]} />
              )
            } },
          ]}
        />
      </PortalPageShell>

      <DetailDialog
        open={Boolean(detail)}
        onOpenChange={(open) => { if (!open) setDetail(null) }}
        title={detail?.title || 'Review'}
        description={detail ? `${detail.full_name} · ${detail.review_type}` : undefined}
      >
        {detail && (
          <div className="space-y-3">
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Rating" value={`${detail.rating} / 5`} />
            <DetailRow label="Email" value={detail.email} />
            <DetailRow label="Mobile" value={detail.mobile} />
            <DetailRow label="Company" value={detail.company_name || '—'} />
            <DetailRow label="Location" value={[detail.city, detail.country].filter(Boolean).join(', ') || '—'} />
            <DetailRow label="Target" value={detail.target_name || '—'} />
            <DetailRow label="Recommend" value={detail.would_recommend ? 'Yes' : 'No'} />
            <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
            {detail.admin_reply && (
              <div className="rounded-xl border border-[var(--border)] p-3 text-sm">
                <p className="font-medium">Admin reply</p>
                <p className="mt-1 text-muted-foreground">{detail.admin_reply}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {detail.status === 'pending' && (
                <>
                  <Button size="sm" className="rounded-lg" disabled={busy} onClick={() => void runAction('Review approved', () => adminReviewsApi.approve(detail.id))}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-lg" disabled={busy} onClick={() => void runAction('Review rejected', () => adminReviewsApi.reject(detail.id))}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </>
              )}
              {detail.status === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={busy}
                  onClick={() => void runAction(detail.is_featured ? 'Unfeatured' : 'Featured', () => adminReviewsApi.feature(detail.id, !detail.is_featured))}
                >
                  <Star className="mr-1 h-4 w-4" /> {detail.is_featured ? 'Unfeature' : 'Feature'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                disabled={busy}
                onClick={() => void runAction(detail.is_verified ? 'Unverified' : 'Verified', () => adminReviewsApi.verify(detail.id, !detail.is_verified))}
              >
                <BadgeCheck className="mr-1 h-4 w-4" /> {detail.is_verified ? 'Remove verified' : 'Mark verified'}
              </Button>
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { setReplyTarget(detail); setReplyText(detail.admin_reply || '') }}>
                <MessageSquare className="mr-1 h-4 w-4" /> Reply
              </Button>
            </div>
          </div>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete review?"
        description="This permanently removes the review and uploaded images."
        confirmLabel="Delete"
        loading={busy}
        onConfirm={() => {
          if (!deleteTarget) return
          void runAction('Review deleted', async () => {
            await adminReviewsApi.delete(deleteTarget.id)
            setDeleteTarget(null)
          })
        }}
      />

      <DetailDialog
        open={Boolean(replyTarget)}
        onOpenChange={(open) => { if (!open) setReplyTarget(null) }}
        title="Reply to review"
        description={replyTarget?.full_name}
      >
        {replyTarget && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin_reply">Public reply</Label>
              <textarea
                id="admin_reply"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <Button
              className="rounded-xl"
              disabled={busy || replyText.trim().length < 2}
              onClick={() => void runAction('Reply saved', () => adminReviewsApi.reply(replyTarget.id, replyText.trim()))}
            >
              Save reply
            </Button>
          </div>
        )}
      </DetailDialog>
    </>
  )
}
