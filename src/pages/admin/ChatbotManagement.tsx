import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BarChart3, Bot, FolderTree, HelpCircle, ImagePlus, LayoutDashboard, MessageSquare, Settings2, Users,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { DataTable } from '@/components/common/DataTable'
import { StatCard } from '@/components/common/StatCard'
import { ChartCard } from '@/components/common/ChartCard'
import { AdminTabsList, AdminTabsTrigger } from '@/components/admin/AdminUi'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { adminApi } from '@/services/api'
import { asNumber, asRecord, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { clearChatbotConfigCache } from '@/hooks/useChatbotConfig'
import { toast } from '@/components/ui/toaster'
import type {
  ChatbotAnalytics,
  ChatbotCategory,
  ChatbotConversation,
  ChatbotDashboardStats,
  ChatbotFaq,
  ChatbotLead,
  ChatbotSettings,
} from '@/types/chatbot'

const LEAD_STATUSES = ['new', 'contacted', 'converted', 'closed'] as const

export default function ChatbotManagement() {
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<ChatbotDashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<ChatbotAnalytics | null>(null)
  const [faqs, setFaqs] = useState<ChatbotFaq[]>([])
  const [categories, setCategories] = useState<ChatbotCategory[]>([])
  const [leads, setLeads] = useState<ChatbotLead[]>([])
  const [conversations, setConversations] = useState<ChatbotConversation[]>([])
  const [settings, setSettings] = useState<ChatbotSettings | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingRobot, setUploadingRobot] = useState(false)
  const robotInputRef = useRef<HTMLInputElement>(null)
  const [faqForm, setFaqForm] = useState<Partial<ChatbotFaq>>({ language: 'en', is_active: true, sort_order: 0 })
  const [categoryForm, setCategoryForm] = useState<Partial<ChatbotCategory>>({ is_active: true, sort_order: 0 })
  const [deleteFaqId, setDeleteFaqId] = useState<string | number | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [dash, stats, faqList, categoryList, leadRes, convRes, settingsRes] = await Promise.all([
        adminApi.chatbot.dashboard(),
        adminApi.chatbot.analytics(),
        adminApi.chatbot.faqs.list(),
        adminApi.chatbot.categories.list(),
        adminApi.chatbot.leads.list(),
        adminApi.chatbot.conversations.list(),
        adminApi.chatbot.settings.get(),
      ])
      setDashboard(dash as ChatbotDashboardStats)
      setAnalytics(stats as ChatbotAnalytics)
      setFaqs(unwrapList<ChatbotFaq>(faqList))
      setCategories(unwrapList<ChatbotCategory>(categoryList))
      const leadPayload = asRecord(leadRes)
      setLeads(unwrapList<ChatbotLead>(leadPayload.data ?? leadRes))
      const convPayload = asRecord(convRes)
      setConversations(unwrapList<ChatbotConversation>(convPayload.data ?? convRes))
      setSettings(settingsRes as ChatbotSettings)
    } catch (error) {
      toast({ title: 'Failed to load chatbot module', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  const saveSettings = async () => {
    if (!settings) return
    setSavingSettings(true)
    try {
      const updated = await adminApi.chatbot.settings.update(settings)
      setSettings(updated as ChatbotSettings)
      clearChatbotConfigCache()
      toast({ title: 'Chatbot settings saved', variant: 'success' })
    } catch (error) {
      toast({ title: 'Save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSavingSettings(false)
    }
  }

  const uploadWelcomeRobot = async (file: File) => {
    if (!settings) return
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Use a GIF under 10 MB. Compress the animation for faster website loading.',
        variant: 'destructive',
      })
      return
    }

    setUploadingRobot(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'chatbot')
      const { path } = await adminApi.uploads.create(form)
      setSettings({ ...settings, welcome_robot_image: path })
      toast({ title: 'Robot image uploaded', description: 'Click Save Settings to apply on the website.', variant: 'success' })
    } catch (error) {
      toast({ title: 'Upload failed', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setUploadingRobot(false)
    }
  }

  const saveFaq = async () => {
    try {
      if (!faqForm.question || !faqForm.answer) {
        toast({ title: 'Question and answer are required', variant: 'destructive' })
        return
      }
      if (faqForm.id) {
        await adminApi.chatbot.faqs.update(faqForm.id, faqForm)
      } else {
        await adminApi.chatbot.faqs.create(faqForm)
      }
      setFaqForm({ language: 'en', is_active: true, sort_order: 0 })
      await loadAll()
      toast({ title: 'FAQ saved', variant: 'success' })
    } catch (error) {
      toast({ title: 'FAQ save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const saveCategory = async () => {
    try {
      if (!categoryForm.name) {
        toast({ title: 'Category name is required', variant: 'destructive' })
        return
      }
      if (categoryForm.id) {
        await adminApi.chatbot.categories.update(categoryForm.id, categoryForm)
      } else {
        await adminApi.chatbot.categories.create(categoryForm)
      }
      setCategoryForm({ is_active: true, sort_order: 0 })
      await loadAll()
      toast({ title: 'Category saved', variant: 'success' })
    } catch (error) {
      toast({ title: 'Category save failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  const updateLeadStatus = async (lead: ChatbotLead, status: ChatbotLead['status']) => {
    try {
      await adminApi.chatbot.leads.update(lead.id, { status })
      await loadAll()
    } catch (error) {
      toast({ title: 'Lead update failed', description: getApiErrorMessage(error), variant: 'destructive' })
    }
  }

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome
        eyebrow="Website"
        title="Chatbot"
        description="Manage FAQ chatbot content, leads, conversations, settings, and analytics."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <AdminTabsList>
          <AdminTabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</AdminTabsTrigger>
          <AdminTabsTrigger value="faqs"><HelpCircle className="h-4 w-4" /> FAQs</AdminTabsTrigger>
          <AdminTabsTrigger value="categories"><FolderTree className="h-4 w-4" /> Categories</AdminTabsTrigger>
          <AdminTabsTrigger value="leads"><Users className="h-4 w-4" /> Leads</AdminTabsTrigger>
          <AdminTabsTrigger value="conversations"><MessageSquare className="h-4 w-4" /> Conversations</AdminTabsTrigger>
          <AdminTabsTrigger value="settings"><Settings2 className="h-4 w-4" /> Settings</AdminTabsTrigger>
          <AdminTabsTrigger value="analytics"><BarChart3 className="h-4 w-4" /> Analytics</AdminTabsTrigger>
        </AdminTabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Conversations" value={dashboard?.total_conversations ?? 0} icon={MessageSquare} />
            <StatCard title="Total Leads" value={dashboard?.total_leads ?? 0} icon={Users} />
            <StatCard title="Conversion Rate" value={`${dashboard?.conversion_rate ?? 0}%`} icon={BarChart3} />
            <StatCard title="Active FAQs" value={faqs.filter((f) => f.is_active).length} icon={Bot} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Daily Chats (7 days)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dashboard?.daily_chats ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <PortalPanel>
              <div className="border-b border-[var(--border)] px-6 py-4 font-display font-semibold">Most Asked Questions</div>
              <div className="p-6">
              <ul className="space-y-2">
                {(dashboard?.most_asked_questions ?? []).map((item) => (
                  <li key={item.message} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{item.message}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </li>
                ))}
              </ul>
              </div>
            </PortalPanel>
          </div>
          <PortalPanel>
            <div className="border-b border-[var(--border)] px-6 py-4 font-display font-semibold">Recent Conversations</div>
            <div className="p-4">
            <DataTable
              embedded
              data={dashboard?.recent_conversations?.map((c) => ({ ...c, id: String(c.id) })) ?? []}
              isLoading={loading}
              columns={[
                { key: 'session_id', header: 'Session', className: 'font-mono text-xs' },
                { key: 'message', header: 'Message' },
                { key: 'language', header: 'Lang' },
                { key: 'created_at', header: 'When', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : '—' },
              ]}
            />
            </div>
          </PortalPanel>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6 mt-6">
          <PortalPanel>
            <div className="border-b border-[var(--border)] px-6 py-4 font-display font-semibold">{faqForm.id ? 'Edit FAQ' : 'Add FAQ'}</div>
            <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Question</Label><Input value={faqForm.question ?? ''} onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))} /></div>
              <div><Label>Language</Label><Input value={faqForm.language ?? 'en'} onChange={(e) => setFaqForm((p) => ({ ...p, language: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>Answer</Label><textarea rows={4} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={faqForm.answer ?? ''} onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))} /></div>
              <div><Label>Keywords</Label><Input value={faqForm.keywords ?? ''} onChange={(e) => setFaqForm((p) => ({ ...p, keywords: e.target.value }))} /></div>
              <div><Label>Category</Label><Input value={faqForm.category ?? ''} onChange={(e) => setFaqForm((p) => ({ ...p, category: e.target.value }))} /></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => void saveFaq()}>Save FAQ</Button>
              {faqForm.id ? <Button variant="outline" onClick={() => setFaqForm({ language: 'en', is_active: true, sort_order: 0 })}>Cancel</Button> : null}
            </div>
            </div>
          </PortalPanel>
          <DataTable
            embedded
            data={faqs.map((f) => ({ ...f, id: String(f.id) }))}
            isLoading={loading}
            searchKeys={['question', 'category', 'keywords']}
            columns={[
              { key: 'question', header: 'Question', className: 'font-medium' },
              { key: 'language', header: 'Lang' },
              { key: 'category', header: 'Category' },
              { key: 'is_active', header: 'Status', render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
              { key: 'actions', header: 'Actions', render: (row) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setFaqForm(row)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteFaqId(row.id)}>Delete</Button>
                </div>
              )},
            ]}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <PortalPanel>
            <div className="border-b border-[var(--border)] px-6 py-4 font-display font-semibold">Category</div>
            <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Name</Label><Input value={categoryForm.name ?? ''} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Slug</Label><Input value={categoryForm.slug ?? ''} onChange={(e) => setCategoryForm((p) => ({ ...p, slug: e.target.value }))} /></div>
            </div>
            <Button className="mt-4" onClick={() => void saveCategory()}>Save Category</Button>
            </div>
          </PortalPanel>
          <DataTable
            embedded
            data={categories.map((c) => ({ ...c, id: String(c.id) }))}
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'slug', header: 'Slug' },
              { key: 'is_active', header: 'Status', render: (row) => <Badge variant={row.is_active ? 'success' : 'secondary'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
            ]}
          />
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          <DataTable
            embedded
            data={leads.map((l) => ({ ...l, id: String(l.id) }))}
            isLoading={loading}
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'phone', header: 'Phone' },
              { key: 'email', header: 'Email' },
              { key: 'product', header: 'Product' },
              { key: 'status', header: 'Status', render: (row) => (
                <select className="rounded-md border px-2 py-1 text-sm" value={row.status} onChange={(e) => void updateLeadStatus(row, e.target.value as ChatbotLead['status'])}>
                  {LEAD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              )},
            ]}
          />
        </TabsContent>

        <TabsContent value="conversations" className="mt-6">
          <DataTable
            embedded
            data={conversations.map((c) => ({ ...c, id: String(c.id) }))}
            isLoading={loading}
            searchKeys={['message', 'session_id']}
            columns={[
              { key: 'session_id', header: 'Session', className: 'font-mono text-xs' },
              { key: 'message', header: 'Message' },
              { key: 'response', header: 'Response', render: (row) => <span className="line-clamp-2">{row.response ?? '—'}</span> },
              { key: 'created_at', header: 'When', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : '—' },
            ]}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          {settings ? (
            <PortalPanel>
              <div className="border-b border-[var(--border)] px-6 py-4 font-display font-semibold">Chatbot Settings</div>
              <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border p-4 md:col-span-2">
                  <div><Label>Enable chatbot</Label><p className="text-sm text-muted-foreground">Show widget on public website</p></div>
                  <Switch checked={Boolean(settings.enabled)} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
                </div>
                <div className="md:col-span-2"><Label>Welcome message</Label><textarea rows={4} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={settings.welcome_message ?? ''} onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })} /></div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Welcome screen robot (GIF/image)</Label>
                  <p className="text-sm text-muted-foreground">
                    Shown on the chatbot welcome screen. Prefer a compressed GIF under 2 MB for faster loading.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => robotInputRef.current?.click()}
                      disabled={uploadingRobot}
                      className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 transition hover:border-[var(--primary)]"
                    >
                      {(settings.welcome_robot_url || settings.welcome_robot_image) ? (
                        <img
                          src={resolveMediaUrl(settings.welcome_robot_url ?? settings.welcome_robot_image)}
                          alt="Welcome robot preview"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-[var(--muted-foreground)]" />
                      )}
                    </button>
                    <div className="space-y-2">
                      <Button type="button" variant="outline" size="sm" disabled={uploadingRobot} onClick={() => robotInputRef.current?.click()}>
                        {uploadingRobot ? 'Uploading…' : (settings.welcome_robot_image ? 'Change robot image' : 'Upload robot image')}
                      </Button>
                      {settings.welcome_robot_image ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSettings({ ...settings, welcome_robot_image: '' })}
                        >
                          Remove (use default)
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    ref={robotInputRef}
                    type="file"
                    accept="image/gif,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadWelcomeRobot(file)
                      e.target.value = ''
                    }}
                  />
                </div>
                <div><Label>Theme color</Label><Input type="color" value={settings.theme_color ?? '#2563eb'} onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })} /></div>
                <div><Label>Position</Label>
                  <select className="w-full rounded-md border px-3 py-2" value={settings.position ?? 'right'} onChange={(e) => setSettings({ ...settings, position: e.target.value as 'left' | 'right' })}>
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                  </select>
                </div>
                <div><Label>Auto-open delay (seconds)</Label><Input type="number" value={settings.auto_open_delay ?? 0} onChange={(e) => setSettings({ ...settings, auto_open_delay: asNumber(e.target.value) })} /></div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <Label>File upload</Label>
                  <Switch checked={Boolean(settings.file_upload_enabled)} onCheckedChange={(v) => setSettings({ ...settings, file_upload_enabled: v })} />
                </div>
                <div className="md:col-span-2"><Label>Business hours</Label><textarea rows={3} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={settings.business_hours ?? ''} onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })} /></div>
                <div><Label>Company name</Label><Input value={settings.company_name ?? ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={settings.company_phone ?? ''} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={settings.company_email ?? ''} onChange={(e) => setSettings({ ...settings, company_email: e.target.value })} /></div>
                <div><Label>Website</Label><Input value={settings.company_website ?? ''} onChange={(e) => setSettings({ ...settings, company_website: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Address</Label><textarea rows={2} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={settings.company_address ?? ''} onChange={(e) => setSettings({ ...settings, company_address: e.target.value })} /></div>
              </div>
              <Button className="mt-4" onClick={() => void saveSettings()} disabled={savingSettings}>
                {savingSettings ? 'Saving…' : 'Save Settings'}
              </Button>
              </div>
            </PortalPanel>
          ) : null}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Daily Conversations (30 days)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analytics?.daily_conversations ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Lead Conversion">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics?.lead_conversion ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Device Statistics">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics?.device_statistics ?? []}>
                  <XAxis dataKey="device" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Language Statistics">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics?.language_statistics ?? []}>
                  <XAxis dataKey="language" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteFaqId != null}
        onOpenChange={(open) => !open && setDeleteFaqId(null)}
        title="Delete FAQ?"
        description="This FAQ will be permanently removed from the chatbot."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deleteFaqId == null) return
          await adminApi.chatbot.faqs.delete(deleteFaqId)
          setDeleteFaqId(null)
          await loadAll()
          toast({ title: 'FAQ deleted', variant: 'success' })
        }}
      />
    </PortalPage>
  )
}
