import { Link } from 'react-router-dom'
import { Moon, Sun, Settings, Monitor, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/hooks/useTheme'
import { getAdminWorkspaceMode } from '@/services/api/client'
import { cn } from '@/lib/utils'

interface AdminSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
]

export function AdminSettingsPanel({ open, onOpenChange }: AdminSettingsPanelProps) {
  const { theme, changeTheme } = useTheme()
  const workspace = getAdminWorkspaceMode()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-settings-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Admin preferences</DialogTitle>
          <DialogDescription>
            Customize your admin workspace appearance. These settings are stored locally.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Appearance
            </p>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all',
                    theme === value
                      ? 'border-[var(--brand-blue)]/40 bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:text-[var(--brand-aqua)]'
                      : 'border-[var(--border)] bg-[var(--input)]/40 text-[var(--muted-foreground)] hover:border-[var(--brand-blue)]/25 hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Workspace
            </p>
            <p className="mt-2 font-display text-lg font-semibold capitalize">{workspace}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Switch between live and demo data from the top bar.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link to="/admin/settings" onClick={() => onOpenChange(false)}>
              <Settings className="mr-2 h-4 w-4" />
              Platform settings
              <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
