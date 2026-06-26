import { useCallback, useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { BlogFormDialog, type BlogFormValues } from '@/components/admin/BlogFormDialog'
import { adminApi } from '@/services/api'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapAdminBlog } from '@/lib/apiMappers'
import { toast } from '@/components/ui/toaster'
import { useListData } from '@/hooks/useListData'
import type { BlogPost } from '@/types'

type BlogRow = ReturnType<typeof mapAdminBlog>

export default function BlogsManagement() {
  const fetcher = useCallback(() => adminApi.blogs.list(), [])
  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminBlog), [])
  const { items, loading, error, reload } = useListData(fetcher, mapper)
  const [detail, setDetail] = useState<BlogRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlogRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BlogRow | null>(null)
  const [saving, setSaving] = useState(false)

  const buildPayload = (values: BlogFormValues) => ({
    title: values.title,
    slug: values.slug,
    excerpt: values.excerpt,
    content: values.content,
    featured_image: values.featured_image || null,
    is_published: values.is_published,
    meta: { category: values.category },
  })

  const handleSave = async (values: BlogFormValues) => {
    setSaving(true)
    try {
      if (editTarget) {
        await adminApi.blogs.update(editTarget.id, buildPayload(values))
        toast({ title: 'Post updated', variant: 'success' })
      } else {
        await adminApi.blogs.create(buildPayload(values))
        toast({ title: 'Post created', variant: 'success' })
      }
      setFormOpen(false)
      setEditTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.blogs.delete(deleteTarget.id)
      toast({ title: 'Post deleted', variant: 'success' })
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
        eyebrow="Content"
        heroTitle="Blogs"
        heroDescription="Publish and manage blog posts on the public website."
        title="Blogs Management"
        description="Create and manage blog posts"
        actions={
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }} className="gap-2 rounded-xl glow-btn">
            New Post
          </Button>
        }
        loading={loading}
        error={error}
      >
        <DataTable
          embedded
          searchKeys={['title', 'author', 'category']}
          searchPlaceholder="Search posts..."
          pageSize={5}
          data={items}
          columns={[
            { key: 'title', header: 'Title', className: 'font-medium' },
            { key: 'category', header: 'Category', render: (p) => <Badge variant="outline">{p.category}</Badge> },
            { key: 'author', header: 'Author' },
            { key: 'read_time', header: 'Read Time', render: (p) => `${p.read_time} min` },
            { key: 'published_at', header: 'Published', render: (p) => formatDate(p.published_at) },
            { key: 'actions', header: 'Actions', className: 'w-[120px] text-right', render: (p) => (
              <TableActions actions={[
                actionBtn('View post', Eye, () => setDetail(p)),
                actionBtn('Edit post', Pencil, () => { setEditTarget(p); setFormOpen(true) }),
                { ...actionBtn('Delete post', Trash2, () => setDeleteTarget(p)), variant: 'destructive' },
              ]} />
            ) },
          ]}
        />
      </PortalPageShell>

      <BlogFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditTarget(null) }}
        initial={editTarget as BlogPost & { is_published?: boolean } | null}
        saving={saving}
        onSubmit={handleSave}
      />

      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Blog post">
        {detail && (
          <>
            <DetailRow label="Title" value={detail.title} />
            <DetailRow label="Author" value={detail.author} />
            <DetailRow label="Category" value={detail.category} />
            <DetailRow label="Published" value={formatDate(detail.published_at)} />
            <DetailRow label="Excerpt" value={detail.excerpt} />
          </>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete post?"
        description={`Remove "${deleteTarget?.title ?? 'this post'}" permanently?`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
