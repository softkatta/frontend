import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Building2, FileText, Plug, Wrench, Shield, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { AdminTabsList, AdminTabsTrigger, AdminPanelHeader, AdminSaveBar } from '@/components/admin/AdminUi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminApi } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { asBool, asRecord, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import {
  buildIntegrationCredentials,
  hasStoredCredential,
  INTEGRATION_DESCRIPTIONS,
  INTEGRATION_FIELDS,
  isMaskedSecret,
  validateIntegrationSave,
} from '@/lib/integrationConfig'
import { toast } from '@/components/ui/toaster'
import { notifySiteConfigUpdated, type SiteConfigScope } from '@/lib/siteConfigEvents'
import { HrManagersSettingsPanel } from '@/components/admin/HrManagersSettingsPanel'

type SettingRow = { id?: string; key: string; value: string; group: string }
type IntegrationRow = {
  id: string
  name: string
  provider: string
  is_active: boolean
  is_configured?: boolean
  credentials?: Record<string, string>
}

type SettingField = {
  key: string
  label: string
  group: 'general' | 'invoice' | 'security' | 'maintenance'
  type?: 'boolean' | 'textarea' | 'image' | 'select' | 'number'
  uploadFolder?: string
  accept?: string
  options?: { value: string; label: string }[]
}

const GENERAL_KEYS: SettingField[] = [
  { key: 'company_name', label: 'Company Name', group: 'general' },
  { key: 'company_tagline', label: 'Company Tagline', group: 'general' },
  { key: 'company_address', label: 'Company Address', group: 'general' },
  { key: 'company_phone', label: 'Company Phone', group: 'general' },
  { key: 'company_website', label: 'Company Website', group: 'general' },
  { key: 'company_description', label: 'Company Description (SEO & NAP fallback)', group: 'general', type: 'textarea' },
  { key: 'brand_short_name', label: 'Short Brand Name', group: 'general' },
  { key: 'company_logo', label: 'Company Logo', group: 'general', type: 'image', uploadFolder: 'branding', accept: 'image/png,image/jpeg,image/webp,image/svg+xml' },
  { key: 'favicon', label: 'Favicon', group: 'general', type: 'image', uploadFolder: 'branding', accept: 'image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/jpeg' },
  { key: 'support_email', label: 'Support Email', group: 'general' },
  { key: 'default_currency', label: 'Default Currency', group: 'general' },
]

const MAINTENANCE_KEYS: SettingField[] = [
  { key: 'maintenance_mode', label: 'Maintenance Mode', group: 'maintenance', type: 'boolean' },
  {
    key: 'maintenance_page_type',
    label: 'Page Type',
    group: 'maintenance',
    type: 'select',
    options: [
      { value: 'launch', label: 'Launch / Coming Soon' },
      { value: 'maintenance', label: 'Maintenance' },
    ],
  },
  { key: 'maintenance_image', label: 'Maintenance Image', group: 'maintenance', type: 'image', uploadFolder: 'branding', accept: 'image/png,image/jpeg,image/webp,image/svg+xml' },
  { key: 'maintenance_badge', label: 'Status Badge Text', group: 'maintenance' },
  { key: 'maintenance_message', label: 'Description', group: 'maintenance', type: 'textarea' },
]

const INVOICE_KEYS: SettingField[] = [
  { key: 'billing_email', label: 'Billing Email', group: 'invoice' },
  { key: 'gst_number', label: 'Company GSTIN', group: 'invoice' },
  { key: 'gst_rate', label: 'GST Rate (%)', group: 'invoice', type: 'number' },
  { key: 'invoice_prefix', label: 'Invoice Prefix', group: 'invoice' },
  { key: 'invoice_number_start', label: 'Invoice Number Starts From', group: 'invoice', type: 'number' },
  { key: 'upi_vpa', label: 'UPI ID (for payment QR)', group: 'invoice' },
  { key: 'invoice_account_no', label: 'Bank Account Number', group: 'invoice' },
  { key: 'invoice_account_name', label: 'Bank Account Name', group: 'invoice' },
  { key: 'invoice_ifsc_code', label: 'IFSC Code', group: 'invoice' },
  { key: 'invoice_signatory', label: 'Authorized Signatory Name', group: 'invoice' },
  { key: 'invoice_signature', label: 'Signature Image', group: 'invoice', type: 'image', uploadFolder: 'branding', accept: 'image/png,image/jpeg,image/webp' },
  { key: 'invoice_terms', label: 'Invoice Terms & Conditions', group: 'invoice', type: 'textarea' },
]

const SECURITY_KEYS: SettingField[] = [
  { key: 'two_factor_login_enabled', label: 'Two-Factor Login', group: 'security', type: 'boolean' },
  { key: 'session_timeout_minutes', label: 'Session Timeout (minutes)', group: 'security' },
  { key: 'ip_whitelisting', label: 'IP Whitelisting', group: 'security', type: 'boolean' },
  { key: 'ip_whitelist', label: 'Allowed IPs', group: 'security', type: 'textarea' },
  { key: 'demo_account_email', label: 'Demo Account Email', group: 'security' },
  { key: 'demo_account_2fa_enabled', label: 'Require 2FA for Demo Account', group: 'security', type: 'boolean' },
]

function settingsScopeForGroup(group: SettingField['group']): SiteConfigScope {
  if (group === 'maintenance') return 'maintenance'
  if (group === 'general' || group === 'invoice') return 'branding'
  return 'all'
}

function mapSetting(raw: unknown): SettingRow {
  const item = asRecord(raw)
  return {
    id: String(item.id ?? ''),
    key: String(item.key ?? ''),
    value: String(item.value ?? ''),
    group: String(item.group ?? 'general'),
  }
}

function mapIntegration(raw: unknown): IntegrationRow {
  const item = asRecord(raw)
  const creds = item.credentials
  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    provider: String(item.provider ?? ''),
    is_active: asBool(item.is_active),
    is_configured: item.is_configured === undefined ? undefined : asBool(item.is_configured),
    credentials: creds && typeof creds === 'object' ? Object.fromEntries(Object.entries(asRecord(creds)).map(([k, v]) => [k, String(v)])) : {},
  }
}

function buildCredentialFields(item: IntegrationRow): Record<string, string> {
  const fields = INTEGRATION_FIELDS[item.provider] ?? [{ key: 'api_key', label: 'API Key' }]
  const initial: Record<string, string> = {}

  fields.forEach((field) => {
    const existing = item.credentials?.[field.key] ?? ''
    if (isMaskedSecret(existing)) {
      initial[field.key] = ''
      return
    }

    if (field.type === 'select') {
      const match = field.options?.some((option) => option.value === existing)
      initial[field.key] = match ? existing : (field.options?.[0]?.value ?? '')
      return
    }

    initial[field.key] = existing
  })

  return initial
}

function ImageSettingField({
  label,
  value,
  uploading,
  accept,
  onUpload,
}: {
  label: string
  value: string
  uploading: boolean
  accept?: string
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = value ? resolveMediaUrl(value) : ''

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 transition hover:border-[var(--primary)]"
        >
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-contain p-2" />
          ) : (
            <ImagePlus className="h-8 w-8 text-[var(--muted-foreground)]" />
          )}
        </button>
        <div className="space-y-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : preview ? 'Change image' : 'Upload image'}
          </Button>
          {preview && <p className="max-w-xs truncate text-xs text-[var(--muted-foreground)]">{value}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([])
  const [configure, setConfigure] = useState<IntegrationRow | null>(null)
  const [credentialFields, setCredentialFields] = useState<Record<string, string>>({})
  const [testEmailTo, setTestEmailTo] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [settingsRes, integrationsRes] = await Promise.all([
        adminApi.settings.list(),
        adminApi.integrations.list(),
      ])
      const map: Record<string, string> = {}
      unwrapList(settingsRes).map(mapSetting).forEach((s) => { map[s.key] = s.value })
      setSettings(map)
      setIntegrations(unwrapList(integrationsRes).map(mapIntegration))
    } catch (err) {
      toast({ title: 'Failed to load settings', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const getValue = (key: string, fallback = '') => settings[key] ?? fallback
  const setValue = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))

  const uploadImage = async (key: string, folder: string, file: File) => {
    setUploadingKey(key)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', folder)
      const { path } = await adminApi.uploads.create(form)
      setValue(key, path)
      toast({ title: 'Image uploaded', description: 'Click Save to apply changes.', variant: 'success' })
    } catch (err) {
      toast({ title: 'Upload failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setUploadingKey(null)
    }
  }

  const saveGroup = async (keys: SettingField[]) => {
    setSaving(true)
    try {
      await adminApi.settings.bulkUpdate({
        settings: keys.map((k) => ({
          key: k.key,
          value: getValue(k.key, k.type === 'boolean' ? 'false' : ''),
          group: k.group,
        })),
      })
      toast({ title: 'Settings saved', variant: 'success' })
      await load()
      notifySiteConfigUpdated(settingsScopeForGroup(keys[0]?.group ?? 'general'))
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openIntegration = (item: IntegrationRow) => {
    setConfigure(item)
    setCredentialFields(buildCredentialFields(item))
    setTestEmailTo(user?.email ?? '')
  }

  const saveIntegration = async () => {
    if (!configure) return

    const fields = INTEGRATION_FIELDS[configure.provider] ?? [{ key: 'api_key', label: 'API Key' }]
    const existing = configure.credentials ?? {}
    const credentials = buildIntegrationCredentials(fields, existing, credentialFields)
    const validationError = validateIntegrationSave(configure.provider, fields, existing, credentialFields)

    if (validationError) {
      toast({
        title: 'Integration settings incomplete',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const updated = mapIntegration(await adminApi.integrations.update(configure.id, {
        is_active: configure.is_active,
        credentials,
      }))
      toast({ title: 'Integration saved', description: `${updated.name} settings were saved successfully.`, variant: 'success' })
      await load()
      setConfigure(updated)
      setCredentialFields(buildCredentialFields(updated))
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    if (!configure || configure.provider !== 'email_smtp') return

    const to = testEmailTo.trim()
    if (!to) {
      toast({ title: 'Enter a recipient email', variant: 'destructive' })
      return
    }

    const existing = configure.credentials ?? {}
    const isReady = configure.is_configured ?? (
      hasStoredCredential(existing.host)
      && hasStoredCredential(existing.username)
      && hasStoredCredential(existing.from_address)
      && hasStoredCredential(existing.password)
    )

    if (!isReady) {
      toast({
        title: 'SMTP settings incomplete',
        description: 'Enter host, username, password, and from email, then click Save before sending a test email.',
        variant: 'destructive',
      })
      return
    }

    setSendingTestEmail(true)
    try {
      await adminApi.integrations.sendTestEmail(configure.id, { to })
      toast({ title: 'Test email sent', description: `Check ${to} for the test message.`, variant: 'success' })
    } catch (err) {
      toast({ title: 'Test email failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSendingTestEmail(false)
    }
  }

  const renderField = (k: SettingField) => {
    const wrap = (node: React.ReactNode, full = false) => (
      <div key={k.key} className={full ? 'admin-settings-field admin-settings-field--full' : 'admin-settings-field'}>
        {node}
      </div>
    )

    if (k.type === 'boolean') return null

    if (k.type === 'image') {
      return wrap(
        <ImageSettingField
          label={k.label}
          value={getValue(k.key)}
          uploading={uploadingKey === k.key}
          accept={k.accept}
          onUpload={(file) => void uploadImage(k.key, k.uploadFolder ?? 'uploads', file)}
        />,
        true,
      )
    }

    if (k.type === 'textarea') {
      return wrap(
        <>
          <Label>{k.label}</Label>
          <textarea
            value={getValue(k.key)}
            onChange={(e) => setValue(k.key, e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
          />
        </>,
        true,
      )
    }

    if (k.type === 'select') {
      return wrap(
        <>
          <Label>{k.label}</Label>
          <select
            value={getValue(k.key, k.options?.[0]?.value ?? '')}
            onChange={(e) => setValue(k.key, e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
          >
            {k.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>,
      )
    }

    if (k.type === 'number') {
      return wrap(
        <>
          <Label>{k.label}</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={getValue(k.key, k.key === 'gst_rate' ? '18' : k.key === 'invoice_number_start' ? '1' : '0')}
            onChange={(e) => setValue(k.key, e.target.value)}
            className="h-11 rounded-xl bg-[var(--input-background)]"
          />
          {k.key === 'gst_rate' && (
            <p className="text-xs text-muted-foreground">
              Applied to cart, checkout, orders, and invoices platform-wide.
            </p>
          )}
          {k.key === 'invoice_number_start' && (
            <p className="text-xs text-muted-foreground">
              New invoices count up from this number. Cannot go below the next queued number.
            </p>
          )}
        </>,
      )
    }

    return wrap(
      <>
        <Label>{k.label}</Label>
        <Input
          value={getValue(
            k.key,
            k.key === 'default_currency' ? 'INR' : '',
          )}
          onChange={(e) => setValue(k.key, e.target.value)}
          className="h-11 rounded-xl bg-[var(--input-background)]"
        />
      </>,
    )
  }

  if (loading) {
    return (
      <PortalPage>
        <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
      </PortalPage>
    )
  }

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Configuration"
        title="Platform settings"
        description="Manage company profile, billing, integrations, maintenance mode, and security policies."
      />

      <PageHeader title="Settings" description="Platform configuration and preferences" className="mb-0" />

      <Tabs defaultValue="general" className="space-y-6">
        <AdminTabsList>
          <AdminTabsTrigger value="general" icon={Building2}>General</AdminTabsTrigger>
          <AdminTabsTrigger value="invoice" icon={FileText}>Invoice</AdminTabsTrigger>
          <AdminTabsTrigger value="integrations" icon={Plug}>Integrations</AdminTabsTrigger>
          <AdminTabsTrigger value="maintenance" icon={Wrench}>Maintenance</AdminTabsTrigger>
          <AdminTabsTrigger value="security" icon={Shield}>Security</AdminTabsTrigger>
          <AdminTabsTrigger value="hr-portal" icon={Users}>HR Portal</AdminTabsTrigger>
        </AdminTabsList>

        <TabsContent value="general" className="mt-0">
          <PortalPanel>
            <AdminPanelHeader
              icon={Building2}
              title="General Settings"
              description="Company details here are used on invoices, emails, and site branding."
            />
            <div className="space-y-6 p-6">
              <div className="admin-settings-grid admin-settings-grid--two space-y-0 gap-4">
                {GENERAL_KEYS.map(renderField)}
              </div>
              <AdminSaveBar>
                <Button className="rounded-xl px-6" onClick={() => void saveGroup(GENERAL_KEYS)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </AdminSaveBar>
            </div>
          </PortalPanel>
        </TabsContent>

        <TabsContent value="invoice" className="mt-0">
          <PortalPanel>
            <AdminPanelHeader
              icon={FileText}
              title="Invoice Settings"
              description="Invoice numbering, GST, banking, and terms. Company profile comes from General settings."
            />
            <div className="space-y-6 p-6">
              <div className="admin-settings-grid admin-settings-grid--two gap-4">
                {INVOICE_KEYS.map(renderField)}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] rounded-xl border border-dashed border-[var(--border)] bg-[var(--input)]/30 p-3">
                Next auto invoice:{' '}
                <strong>
                  {getValue('invoice_prefix', 'SK-INV')}-
                  {String(getValue('invoice_number_next', getValue('invoice_number_start', '1'))).padStart(5, '0')}
                </strong>
                {' '}(increments automatically on each new invoice)
              </p>
              <AdminSaveBar>
                <Button className="rounded-xl px-6" onClick={() => void saveGroup(INVOICE_KEYS)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Invoice Settings'}
                </Button>
              </AdminSaveBar>
            </div>
          </PortalPanel>
        </TabsContent>

        <TabsContent value="integrations" className="mt-0">
          <div className="space-y-4">
            <PortalPanel>
              <AdminPanelHeader
                icon={Plug}
                title="Integrations"
                description="Connect payment, messaging, email, and real-time notification services. Credentials are encrypted in the database."
              />
            </PortalPanel>
            {integrations.length === 0 ? (
              <PortalPanel className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                No integrations configured yet.
              </PortalPanel>
            ) : integrations.map((item) => (
              <PortalPanel key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${item.is_active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {item.is_configured && (
                      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                        Configured
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {INTEGRATION_DESCRIPTIONS[item.provider] ?? item.provider}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => openIntegration(item)}>
                  Configure
                </Button>
              </PortalPanel>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-0">
          <PortalPanel>
            <AdminPanelHeader
              icon={Wrench}
              title="Maintenance Page"
              description="Logo, company name, and tagline come from General settings. Configure maintenance-only content below."
            />
            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Disable public access temporarily</p>
                </div>
                <Switch checked={getValue('maintenance_mode') === 'true'} onCheckedChange={(v) => setValue('maintenance_mode', String(v))} />
              </div>
              <div className="admin-settings-grid gap-4">
                {MAINTENANCE_KEYS.filter((k) => k.key !== 'maintenance_mode')
                  .filter((k) => k.key !== 'maintenance_image' || getValue('maintenance_page_type', 'launch') === 'maintenance')
                  .map((field) => (
                  <div key={field.key} className={field.type === 'textarea' || field.type === 'image' ? 'admin-settings-field--full' : ''}>
                    {renderField(field)}
                    {field.key === 'maintenance_page_type' && (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Launch uses the default background. Maintenance uses the uploaded image as the page background.
                      </p>
                    )}
                    {field.key === 'maintenance_image' && (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Used as the page background when page type is Maintenance.
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <AdminSaveBar>
                <Button className="rounded-xl px-6" onClick={() => void saveGroup(MAINTENANCE_KEYS)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Maintenance Settings'}
                </Button>
              </AdminSaveBar>
            </div>
          </PortalPanel>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <PortalPanel>
            <AdminPanelHeader
              icon={Shield}
              title="Security Settings"
              description="Platform-wide login security policies and session controls."
            />
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/30 p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Sign-in verification (2FA)</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Control whether users must verify sign-in with email OTP, authenticator, or passkey.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require two-factor at login</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      When off, users sign in with email and password only. When on, enabled verification methods apply.
                    </p>
                  </div>
                  <Switch
                    checked={getValue('two_factor_login_enabled') === 'true'}
                    onCheckedChange={(v) => setValue('two_factor_login_enabled', String(v))}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/30 p-4">
                <p className="text-sm font-medium text-foreground">Account two-factor authentication</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Enable authenticator, email OTP, or passkeys for your admin login.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 rounded-lg">
                  <Link to="/admin/security">Open Security</Link>
                </Button>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--input)]/30 p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Demo account policy</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Configure which account is treated as demo and whether login 2FA should be enforced for it.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Demo Account Email</Label>
                  <Input
                    type="email"
                    value={getValue('demo_account_email')}
                    onChange={(e) => setValue('demo_account_email', e.target.value)}
                    placeholder="demo@yourcompany.com"
                    className="h-10 rounded-xl bg-[var(--input-background)]"
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">This account will be treated as demo-only.</p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require 2FA for Demo Account</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Turn on/off login 2FA challenge only for the configured demo account.</p>
                  </div>
                  <Switch
                    checked={getValue('demo_account_2fa_enabled') === 'true'}
                    onCheckedChange={(v) => setValue('demo_account_2fa_enabled', String(v))}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input value={getValue('session_timeout_minutes', '30')} onChange={(e) => setValue('session_timeout_minutes', e.target.value)} className="h-10 w-28 rounded-xl bg-[var(--input-background)]" />
                <p className="text-xs text-[var(--muted-foreground)]">Users are signed out after this many minutes of inactivity. Set 0 for no limit.</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--input)]/30 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">IP Whitelisting</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Restrict admin access by IP address</p>
                </div>
                <Switch checked={getValue('ip_whitelisting') === 'true'} onCheckedChange={(v) => setValue('ip_whitelisting', String(v))} />
              </div>
              <div className="space-y-2">
                <Label>Allowed IPs</Label>
                <textarea
                  value={getValue('ip_whitelist')}
                  onChange={(e) => setValue('ip_whitelist', e.target.value)}
                  rows={4}
                  placeholder="127.0.0.1&#10;203.0.113.10"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm"
                />
                <p className="text-xs text-[var(--muted-foreground)]">One IP per line or comma-separated. Localhost is allowed when the list is empty.</p>
              </div>
              <AdminSaveBar>
                <Button className="rounded-xl px-6" onClick={() => void saveGroup(SECURITY_KEYS)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Security Settings'}
                </Button>
              </AdminSaveBar>
            </div>
          </PortalPanel>
        </TabsContent>

        <TabsContent value="hr-portal" className="mt-0">
          <HrManagersSettingsPanel />
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(configure)} onOpenChange={(open) => {
        if (!open) {
          setConfigure(null)
          setCredentialFields({})
          setTestEmailTo('')
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure {configure?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-3 py-2">
              <Label>Active</Label>
              <Switch checked={configure?.is_active ?? false} onCheckedChange={(v) => setConfigure((c) => c ? { ...c, is_active: v } : c)} />
            </div>
            {(INTEGRATION_FIELDS[configure?.provider ?? ''] ?? [{ key: 'api_key', label: 'API Key' }]).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === 'select' ? (
                  <select
                    value={credentialFields[field.key] ?? ''}
                    onChange={(e) => setCredentialFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-background px-3 text-sm"
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                    value={credentialFields[field.key] ?? ''}
                    onChange={(e) => setCredentialFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-11 rounded-xl"
                    placeholder={field.placeholder}
                    autoComplete={field.type === 'password' ? 'new-password' : undefined}
                  />
                )}
                {field.help && <p className="text-xs text-[var(--muted-foreground)]">{field.help}</p>}
                {field.type === 'password' && isMaskedSecret(configure?.credentials?.[field.key]) && !credentialFields[field.key]?.trim() && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Saved securely. Leave blank to keep the current value, or enter a new one and click Save.
                  </p>
                )}
              </div>
            ))}
            {configure?.provider === 'pusher' && (
              <p className="text-xs text-[var(--muted-foreground)] rounded-xl border border-dashed border-[var(--border)] p-3">
                When active, new in-app notifications are pushed instantly to clients and admins.
              </p>
            )}
            {configure?.provider === 'email_smtp' && (
              <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--input)]/30 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Quick setup (no Google 2-Step Verification)</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Use Brevo (free) or your hosting email. Gmail is optional and needs a separate App Password.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setCredentialFields((prev) => ({
                        ...prev,
                        host: 'smtp-relay.brevo.com',
                        port: '587',
                        encryption: 'tls',
                      }))}
                    >
                      Use Brevo preset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setCredentialFields((prev) => ({
                        ...prev,
                        host: 'mail.softkatta.in',
                        port: '587',
                        encryption: 'tls',
                      }))}
                    >
                      Use hosting preset
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Send test email</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Save SMTP settings first. Test email uses the saved password — do not re-type password in the field before testing.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-test-email">Recipient email</Label>
                  <Input
                    id="smtp-test-email"
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={sendingTestEmail || saving}
                  onClick={() => void sendTestEmail()}
                >
                  {sendingTestEmail ? 'Sending…' : 'Send Test Email'}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfigure(null); setCredentialFields({}); setTestEmailTo('') }}>Cancel</Button>
            <Button onClick={() => void saveIntegration()} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  )
}
