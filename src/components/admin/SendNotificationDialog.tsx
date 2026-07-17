import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type NotificationChannel = 'email' | 'whatsapp' | 'in_app'

export type SendNotificationValues = {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  target: 'all_clients' | 'all_admins' | 'specific_user'
  user_id: string
  channels: NotificationChannel[]
}

const EMPTY: SendNotificationValues = {
  title: '',
  message: '',
  type: 'info',
  target: 'all_clients',
  user_id: '',
  channels: ['email', 'whatsapp', 'in_app'],
}

const CHANNEL_OPTIONS: { key: NotificationChannel; label: string; hint: string }[] = [
  { key: 'in_app', label: 'In-app', hint: 'Bell icon in dashboard' },
  { key: 'email', label: 'Email', hint: 'SMTP integration required' },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'WhatsApp Business API + user phone' },
]

type SendNotificationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving?: boolean
  onSubmit: (values: SendNotificationValues) => void | Promise<void>
}

export function SendNotificationDialog({ open, onOpenChange, saving, onSubmit }: SendNotificationDialogProps) {
  const [form, setForm] = useState<SendNotificationValues>(EMPTY)

  useEffect(() => {
    if (!open) setForm(EMPTY)
  }, [open])

  const toggleChannel = (channel: NotificationChannel, checked: boolean) => {
    setForm((current) => {
      const next = checked
        ? [...current.channels, channel]
        : current.channels.filter((item) => item !== channel)
      return { ...current, channels: next.length > 0 ? next : current.channels }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send notification</DialogTitle>
          <DialogDescription>Deliver to in-app, email, and WhatsApp (where configured).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">Title</Label>
            <Input id="notif-title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-message">Message</Label>
            <textarea
              id="notif-message"
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as SendNotificationValues['type'] }))}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['info', 'success', 'warning', 'error'] as const).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={form.target} onValueChange={(v) => setForm((f) => ({ ...f, target: v as SendNotificationValues['target'] }))}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_clients">All clients</SelectItem>
                  <SelectItem value="all_admins">All admins</SelectItem>
                  <SelectItem value="specific_user">Specific user ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Delivery channels</Label>
            <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
              {CHANNEL_OPTIONS.map(({ key, label, hint }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <Switch
                    checked={form.channels.includes(key)}
                    onCheckedChange={(checked) => toggleChannel(key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {form.target === 'specific_user' && (
            <div className="space-y-2">
              <Label htmlFor="notif-user">User ID</Label>
              <Input id="notif-user" required value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))} className="h-11 rounded-xl" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || form.channels.length === 0}>{saving ? 'Sending…' : 'Send'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
