import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
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
import { employeeApi } from '@/services/api/modules/employee.api'
import { asRecord, asString, asBool, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type CalendarEvent = {
  id: string
  title: string
  description: string
  event_type: string
  all_day: boolean
  starts_at: string
  ends_at: string
  location: string
  color: string
}

const EVENT_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'personal', label: 'Personal' },
] as const

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toLocalInput(value: string, allDay: boolean) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, allDay ? 10 : 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  if (allDay) return base
  return `${base}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string, allDay: boolean) {
  if (!value) return null
  if (allDay) return `${value}T00:00:00`
  return value.length === 16 ? `${value}:00` : value
}

function formatEventTime(event: CalendarEvent) {
  const start = new Date(event.starts_at)
  if (event.all_day) return 'All day'
  return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const emptyForm = {
  title: '',
  description: '',
  event_type: 'event',
  all_day: false,
  starts_at: '',
  ends_at: '',
  location: '',
}

export default function EmployeeCalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.calendar.list({ month: monthKey(cursor) }))
      setEvents(unwrapList(raw.data ?? raw).map((item) => {
        const row = asRecord(item)
        return {
          id: asString(row.id),
          title: asString(row.title),
          description: asString(row.description),
          event_type: asString(row.event_type) || 'event',
          all_day: asBool(row.all_day),
          starts_at: asString(row.starts_at),
          ends_at: asString(row.ends_at),
          location: asString(row.location),
          color: asString(row.color),
        }
      }))
    } catch (err) {
      toast({ title: 'Failed to load calendar', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [cursor])

  useEffect(() => {
    void load()
  }, [load])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const items: Array<{ key: string; day: number; inMonth: boolean }> = []

    for (let i = 0; i < startPad; i += 1) {
      const d = new Date(year, month, i - startPad + 1)
      items.push({ key: dayKey(d), day: d.getDate(), inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(year, month, day)
      items.push({ key: dayKey(d), day, inMonth: true })
    }
    while (items.length % 7 !== 0) {
      const last = parseDayKey(items[items.length - 1].key)
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
      items.push({ key: dayKey(d), day: d.getDate(), inMonth: false })
    }
    return items
  }, [cursor])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const start = new Date(event.starts_at)
      if (Number.isNaN(start.getTime())) continue
      const key = dayKey(start)
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    return map
  }, [events])

  const selectedEvents = useMemo(
    () => (eventsByDay.get(selectedDay) ?? []).slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [eventsByDay, selectedDay],
  )

  const openCreate = (day = selectedDay) => {
    setEditing(null)
    setForm({
      ...emptyForm,
      starts_at: `${day}T09:00`,
      ends_at: `${day}T10:00`,
    })
    setFormOpen(true)
  }

  const openEdit = (event: CalendarEvent) => {
    setEditing(event)
    setForm({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      all_day: event.all_day,
      starts_at: toLocalInput(event.starts_at, event.all_day),
      ends_at: toLocalInput(event.ends_at, event.all_day),
      location: event.location,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.starts_at) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        event_type: form.event_type,
        all_day: form.all_day,
        starts_at: fromLocalInput(form.starts_at, form.all_day)!,
        ends_at: form.ends_at ? fromLocalInput(form.ends_at, form.all_day) : null,
        location: form.location.trim() || undefined,
      }
      if (editing) {
        await employeeApi.calendar.update(editing.id, payload)
        toast({ title: 'Event updated', variant: 'success' })
      } else {
        await employeeApi.calendar.create(payload)
        toast({ title: 'Event created', variant: 'success' })
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
      await employeeApi.calendar.delete(deleteTarget.id)
      toast({ title: 'Event deleted' })
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const selectedLabel = parseDayKey(selectedDay).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Work"
        title="Calendar"
        description="Plan meetings, reminders, and personal deadlines."
        aside={(
          <Button className="rounded-xl glow-btn" onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Add event
          </Button>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <PortalPanel>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-display font-semibold">{monthLabel}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                  const dayEvents = eventsByDay.get(cell.key) ?? []
                  const selected = cell.key === selectedDay
                  const today = cell.key === dayKey(new Date())

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDay(cell.key)}
                      onDoubleClick={() => {
                        setSelectedDay(cell.key)
                        openCreate(cell.key)
                      }}
                      className={cn(
                        'min-h-[72px] rounded-xl border p-1.5 text-left transition-colors sm:min-h-[88px]',
                        cell.inMonth ? 'bg-[var(--card)]' : 'bg-[var(--input)]/40 text-[var(--muted-foreground)]',
                        selected
                          ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/8'
                          : 'border-[var(--border)] hover:border-[var(--brand-blue)]/30',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                            today && 'bg-[var(--brand-teal)] text-white',
                          )}
                        >
                          {cell.day}
                        </span>
                        {dayEvents.length > 0 ? (
                          <span className="text-[10px] text-[var(--muted-foreground)]">{dayEvents.length}</span>
                        ) : null}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="truncate rounded px-1 py-0.5 text-[10px] font-medium bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 ? (
                          <p className="text-[10px] text-[var(--muted-foreground)]">+{dayEvents.length - 2} more</p>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </PortalPanel>

        <PortalPanel>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Selected day</p>
              <p className="font-display font-semibold">{selectedLabel}</p>
            </div>
            <Button type="button" size="sm" className="rounded-xl" onClick={() => openCreate(selectedDay)}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <div className="space-y-3 p-4">
            {selectedEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No events on this day.</p>
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatEventTime(event)}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize shrink-0">{event.event_type}</Badge>
                  </div>
                  {event.description ? (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{event.description}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(event)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => setDeleteTarget(event)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PortalPanel>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit event' : 'Add event'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cal-title">Title *</Label>
              <Input
                id="cal-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Team standup"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
                >
                  {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex items-end justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <div>
                  <p className="text-sm font-medium">All day</p>
                  <p className="text-xs text-[var(--muted-foreground)]">No specific time</p>
                </div>
                <Switch
                  checked={form.all_day}
                  onCheckedChange={(checked) => setForm({
                    ...form,
                    all_day: checked,
                    starts_at: form.starts_at ? form.starts_at.slice(0, 10) + (checked ? '' : 'T09:00') : form.starts_at,
                    ends_at: form.ends_at ? form.ends_at.slice(0, 10) + (checked ? '' : 'T10:00') : form.ends_at,
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cal-start">Starts *</Label>
                <Input
                  id="cal-start"
                  type={form.all_day ? 'date' : 'datetime-local'}
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-end">Ends</Label>
                <Input
                  id="cal-end"
                  type={form.all_day ? 'date' : 'datetime-local'}
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-location">Location</Label>
              <Input
                id="cal-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Meeting room / Zoom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-description">Description</Label>
              <textarea
                id="cal-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving || !form.title.trim() || !form.starts_at}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete event?"
        description={deleteTarget ? `Remove “${deleteTarget.title}”?` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </PortalPage>
  )
}
