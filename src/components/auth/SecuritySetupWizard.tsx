import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Fingerprint, KeyRound, Mail, Shield } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { authApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

interface SecuritySetupWizardProps {
  securityPath?: string
}

export function SecuritySetupWizard({ securityPath = '/dashboard/security' }: SecuritySetupWizardProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void authApi.securityStatus()
      .then((status) => {
        if (status.security_setup_pending && !status.two_factor_enabled) {
          setOpen(true)
        }
      })
      .catch(() => {
        // Ignore — wizard is optional.
      })
  }, [])

  const handleSkip = async () => {
    setBusy(true)
    try {
      await authApi.skipSecuritySetup()
      setOpen(false)
    } catch (error) {
      toast({ title: 'Could not save preference', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-teal)]/10">
            <Shield className="h-6 w-6 text-[var(--brand-teal)]" />
          </div>
          <DialogTitle className="text-center">Protect your account</DialogTitle>
          <DialogDescription className="text-center">
            Enable two-factor authentication to add an extra layer of security to your sign-in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
            <Mail className="h-5 w-5 text-[var(--muted-foreground)]" />
            <span className="text-sm font-medium">Email OTP</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
            <KeyRound className="h-5 w-5 text-[var(--muted-foreground)]" />
            <span className="text-sm font-medium">Authenticator App</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3">
            <Fingerprint className="h-5 w-5 text-[var(--muted-foreground)]" />
            <span className="text-sm font-medium">Passkey</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full rounded-xl">
            <Link to={securityPath} onClick={() => setOpen(false)}>Enable Security</Link>
          </Button>
          <Button variant="outline" className="w-full rounded-xl" disabled={busy} onClick={() => void handleSkip()}>
            Setup Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
