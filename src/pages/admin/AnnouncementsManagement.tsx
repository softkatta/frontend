import { useCallback, useEffect, useMemo, useState } from 'react'
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { PortalPageShell } from '@/components/common/PortalPageShell'
import { DataTable, type Column } from '@/components/common/DataTable'
import { TableActions } from '@/components/common/TableActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminApi } from '@/services/api'
import { asRecord, asString, asBool, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { actionBtn } from '@/lib/tableActions'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type AnnouncementRow = {
  id: string
  title: string
  body: string
  priority: string
  is_published: boolean
  published_at: string
  expires_at: string
  reads_count: number
  author_name: string
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

const emptyForm = {
  title: '',
  body: '',
  priority: 'normal',
  is_published: true,
  published_at: '',
  expires_at: '',
}

/** datetime-local value → ISO UTC for the API */
function toApiDateTime(local: string): string | null {
  if (!local.trim()) return null
  const date = new Date(local)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** API ISO / datetime → datetime-local (browser local) */
function toLocalInput(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapRow(raw: unknown): AnnouncementRow {
  const item = asRecord(raw)
  const author = asRecord(item.author)
  return {
    id: asString(item.id),
    title: asString(item.title),
    body: asString(item.body),
    priority: asString(item.priority) || 'normal',
    is_published: asBool(item.is_published),
    published_at: asString(item.published_at),
    expires_at: asString(item.expires_at),
    reads_count: Number(item.reads_count ?? 0),
    author_name: asString(author.name),
  }
}

export default function AnnouncementsManagement() {
  const [items, setItems] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = asRecord(await adminApi.announcements.list())
      setItems(unwrapList(raw.data ?? raw).map(mapRow))
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row: AnnouncementRow) => {
    setEditing(row)
    setForm({
      title: row.title,
      body: row.body,
      priority: row.priority,
      is_published: row.is_published,
      published_at: toLocalInput(row.published_at),
      expires_at: toLocalInput(row.expires_at),
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        is_published: form.is_published,
        // Leave blank when publishing now — backend sets published_at = now()
        published_at: toApiDateTime(form.published_at),
        expires_at: toApiDateTime(form.expires_at),
      }
      if (editing) {
        await adminApi.announcements.update(editing.id, payload)
        toast({ title: 'Announcement updated', variant: 'success' })
      } else {
        await adminApi.announcements.create(payload)
        toast({ title: 'Announcement published', variant: 'success' })
      }
      setFormOpen(false)
      await load()
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
      await adminApi.announcements.delete(deleteTarget.id)
      toast({ title: 'Announcement deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<AnnouncementRow>[] = useMemo(() => [
    {
      key: 'title',
      header: 'Announcement',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.title}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)] max-w-md">{row.body}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <Badge variant={row.priority === 'urgent' || row.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">{row.priority}</Badge>,
    },
    {
      key: 'is_published',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_published ? 'default' : 'outline'}>
          {row.is_published ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'published_at',
      header: 'Published',
      render: (row) => (row.published_at ? formatDate(row.published_at) : '—'),
    },
    {
      key: 'reads_count',
      header: 'Reads',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (row) => (
        <TableActions
          actions={[
            actionBtn('Edit', Pencil, () => openEdit(row)),
            { ...actionBtn('Delete', Trash2, () => setDeleteTarget(row)), variant: 'destructive' },
          ]}
        />
      ),
    },
  ], [])

  return (
    <>
      <PortalPageShell
        eyebrow="Company updates"
        heroTitle="Announcements"
        heroDescription="Publish notices that employees see in their portal."
        title="Manage announcements"
        description="Create, publish, and track read counts"
        loading={loading}
        error={error}
        actions={(
          <Button className="rounded-xl glow-btn" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New announcement
          </Button>
        )}
      >
        <DataTable
          columns={columns}
          data={items}
          searchKeys={['title', 'body', 'priority']}
          searchPlaceholder="Search announcements..."
          emptyTitle="No announcements"
          emptyDescription="Create the first company announcement."
        />
      </PortalPageShell>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              {editing ? 'Edit announcement' : 'New announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Body *</Label>
              <textarea
                rows={5}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex items-end justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Visible to employees</p>
                </div>
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Publish at</Label>
                <Input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-[var(--muted-foreground)]">Leave blank to publish immediately</p>
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-[var(--muted-foreground)]">Optional — blank means never expires</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.title.trim() || !form.body.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete announcement?"
        description={deleteTarget ? `Remove “${deleteTarget.title}”?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
