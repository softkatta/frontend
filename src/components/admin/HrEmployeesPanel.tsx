import { useCallback, useMemo, useState } from 'react'

import { Download, Eye, FileText, LogOut, Trash2, Upload, UserRound } from 'lucide-react'

import { EmployeeLoginSendMenu } from '@/components/admin/EmployeeLoginSendMenu'
import { PortalPanel } from '@/components/common/PortalPage'

import { DataTable } from '@/components/common/DataTable'

import { TableActions } from '@/components/common/TableActions'

import { LoadingSpinner } from '@/components/common/LoadingSpinner'

import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'

import { Label } from '@/components/ui/label'

import { AdminPanelHeader } from '@/components/admin/AdminUi'

import { DetailDialog, DetailRow } from '@/components/common/DetailDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { adminApi } from '@/services/api'

import { actionBtn } from '@/lib/tableActions'

import { formatDate } from '@/lib/utils'

import { getApiErrorMessage, unwrapList, asRecord } from '@/lib/apiHelpers'

import { mapAdminEmployee } from '@/lib/apiMappers'

import {

  EMPLOYEE_DOC_STAGES,

  EMPLOYEE_STATUSES,

  EXIT_DOC_CATEGORIES,

  EXIT_STATUSES,

  getEmployeeDocumentLabel,

  getEmployeeDocumentStage,

} from '@/lib/hrConstants'

import { toast } from '@/components/ui/toaster'

import { useListData } from '@/hooks/useListData'



type EmployeeRow = ReturnType<typeof mapAdminEmployee>
type SendChannel = 'email' | 'whatsapp'



function DocumentUploadSelect({

  value,

  onChange,

}: {

  value: string

  onChange: (value: string) => void

}) {

  return (

    <select

      value={value}

      onChange={(e) => onChange(e.target.value)}

      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"

    >

      {EMPLOYEE_DOC_STAGES.map(({ title, categories }) => (

        <optgroup key={title} label={title}>

          {categories.map((item) => (

            <option key={item.value} value={item.value}>{item.label}</option>

          ))}

        </optgroup>

      ))}

    </select>

  )

}



function GroupedDocumentList({

  documents,

  onDownload,

}: {

  documents: EmployeeRow['documents']

  onDownload: (documentId: string) => void

}) {

  const grouped = useMemo(() => {

    const buckets: Record<string, EmployeeRow['documents']> = {

      joining: [],

      employment: [],

      exit: [],

      other: [],

    }

    for (const doc of documents) {

      buckets[getEmployeeDocumentStage(doc.category)].push(doc)

    }

    return buckets

  }, [documents])



  const sections = [

    { key: 'joining', title: 'Joining documents' },

    { key: 'employment', title: 'During employment' },

    { key: 'exit', title: 'Exit documents' },

    { key: 'other', title: 'Other' },

  ] as const



  if (documents.length === 0) {

    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>

  }



  return (

    <div className="space-y-4">

      {sections.map(({ key, title }) => {

        const items = grouped[key]

        if (items.length === 0) return null

        return (

          <div key={key} className="space-y-2">

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>

            <ul className="space-y-2">

              {items.map((doc) => (

                <li key={doc.id} className="flex items-center justify-between gap-2 text-sm">

                  <span className="truncate">

                    {doc.original_name}{' '}

                    <span className="text-muted-foreground">({getEmployeeDocumentLabel(doc.category)})</span>

                  </span>

                  <Button type="button" size="sm" variant="outline" className="rounded-lg gap-1 shrink-0" onClick={() => onDownload(doc.id)}>

                    <Download className="h-3.5 w-3.5" /> Download

                  </Button>

                </li>

              ))}

            </ul>

          </div>

        )

      })}

    </div>

  )

}



export function HrEmployeesPanel() {

  const fetcher = useCallback(() => adminApi.employees.list(), [])

  const mapper = useCallback((raw: unknown) => unwrapList(raw).map(mapAdminEmployee), [])

  const { items, loading, error, reload } = useListData(fetcher, mapper)

  const [detail, setDetail] = useState<EmployeeRow | null>(null)

  const [docCategory, setDocCategory] = useState<string>(EMPLOYEE_DOC_STAGES[0]?.categories[0]?.value ?? 'offer_letter')

  const [exitDocCategory, setExitDocCategory] = useState<string>(EXIT_DOC_CATEGORIES[0]?.value ?? 'resignation_form')

  const [uploading, setUploading] = useState(false)

  const [exitUploading, setExitUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)
  const [sendLoginTarget, setSendLoginTarget] = useState<EmployeeRow | null>(null)
  const [sendLoginChannel, setSendLoginChannel] = useState<SendChannel>('email')
  const [sendLoginEmail, setSendLoginEmail] = useState('')

  const handleDownload = async (employeeId: string, documentId: string) => {

    try {

      const res = await adminApi.employees.downloadDocument(employeeId, documentId)

      window.open(res.download_url, '_blank', 'noopener,noreferrer')

    } catch (err) {

      toast({ title: 'Download failed', description: getApiErrorMessage(err), variant: 'destructive' })

    }

  }

  const showSendLoginResult = (portal: Record<string, unknown>, channel: SendChannel) => {
    const sentEmail = Boolean(portal.sent_email ?? portal.credentials_emailed)
    const sentWhatsapp = Boolean(portal.sent_whatsapp)
    const tempPassword = portal.temporary_password as string | null | undefined
    const success = channel === 'email' ? sentEmail : channel === 'whatsapp' ? sentWhatsapp : sentEmail && sentWhatsapp

    toast({
      title: success ? 'Login details sent' : 'Could not send login details',
      description: success
        ? channel === 'email'
          ? `Email sent to ${String(portal.email ?? 'employee')}.`
          : channel === 'whatsapp'
            ? `WhatsApp message sent to ${String(sendLoginTarget?.phone ?? 'employee phone')}.`
            : `Sent by email and WhatsApp to ${String(portal.email ?? 'employee')}.`
        : tempPassword
          ? `Share manually: ${portal.email} / ${tempPassword} at /employee`
          : getApiErrorMessage(new Error('Send failed.')),
      variant: success ? 'success' : 'destructive',
    })
  }

  const executeSendLogin = async (
    employee: EmployeeRow,
    channel: SendChannel,
    portalEmailValue?: string,
  ) => {
    setPortalBusy(true)
    try {
      const payload: { channel: SendChannel; portal_email?: string } = { channel }
      const trimmed = portalEmailValue?.trim()
      if (trimmed) payload.portal_email = trimmed

      const res = asRecord(await adminApi.employees.sendPortalLogin(employee.id, payload))
      showSendLoginResult(asRecord(res.portal_login), channel)

      const fresh = await adminApi.employees.get(employee.id)
      const mapped = mapAdminEmployee(fresh)
      if (detail?.id === employee.id) setDetail(mapped)
      await reload()
    } catch (err) {
      toast({ title: 'Send failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setPortalBusy(false)
      setSendLoginTarget(null)
      setSendLoginEmail('')
    }
  }

  const handleSendLoginSelect = (employee: EmployeeRow, channel: SendChannel) => {
    if (!employee.user_id) {
      setSendLoginTarget(employee)
      setSendLoginChannel(channel)
      setSendLoginEmail(employee.email || '')
      return
    }

    void executeSendLogin(employee, channel)
  }

  const handleConfirmSendLogin = () => {
    if (!sendLoginTarget) return
    void executeSendLogin(sendLoginTarget, sendLoginChannel, sendLoginEmail)
  }



  const handleUpload = async (employeeId: string, file: File) => {

    setUploading(true)

    try {

      const formData = new FormData()

      formData.append('category', docCategory)

      formData.append('file', file)

      await adminApi.employees.uploadDocument(employeeId, formData)

      toast({ title: 'Document uploaded', variant: 'success' })

      await reload()

      if (detail) {

        const fresh = await adminApi.employees.get(detail.id)

        setDetail(mapAdminEmployee(fresh))

      }

    } catch (err) {

      toast({ title: 'Upload failed', description: getApiErrorMessage(err), variant: 'destructive' })

    } finally {

      setUploading(false)

    }

  }



  const handleExitUpload = async (employeeId: string, file: File) => {

    setExitUploading(true)

    try {

      const formData = new FormData()

      formData.append('category', exitDocCategory)

      formData.append('file', file)

      await adminApi.employees.uploadExitDocument(employeeId, formData)

      toast({ title: 'Exit document uploaded', variant: 'success' })

      const fresh = await adminApi.employees.get(employeeId)

      setDetail(mapAdminEmployee(fresh))

      await reload()

    } catch (err) {

      toast({ title: 'Upload failed', description: getApiErrorMessage(err), variant: 'destructive' })

    } finally {

      setExitUploading(false)

    }

  }



  const handleExitStatus = async (employee: EmployeeRow, status: string) => {
    try {
      await adminApi.employees.updateExit(employee.id, { status })
      toast({ title: 'Exit status updated', variant: 'success' })
      const fresh = await adminApi.employees.get(employee.id)
      setDetail(mapAdminEmployee(fresh))
      await reload()
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.employees.delete(deleteTarget.id)
      toast({ title: 'Employee deleted', variant: 'success' })
      if (detail?.id === deleteTarget.id) setDetail(null)
      setDeleteTarget(null)
      await reload()
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  return (

    <>

      <PortalPanel>

        <AdminPanelHeader

          icon={UserRound}

          title="Employees"

          description="HR uploads joining letters and company documents. Leave, attendance, and resignation are submitted by employees at /employee."

        />

        <div className="p-4 sm:p-6">

          {error ? (

            <p className="text-sm text-destructive py-8 text-center">{error}</p>

          ) : (

            <DataTable

              embedded

              searchKeys={['full_name', 'email', 'employee_code', 'department', 'designation']}

              searchPlaceholder="Search employees..."

              filters={[

                {

                  key: 'status',

                  label: 'Status',

                  options: [{ value: 'all', label: 'All' }, ...EMPLOYEE_STATUSES.map((s) => ({ value: s.value, label: s.label }))],

                },

              ]}

              pageSize={10}

              data={items}

              emptyTitle="No employees yet"

              emptyDescription="Mark a candidate as Selected and convert them to an employee from Applications."

              columns={[

                { key: 'employee_code', header: 'Employee ID', className: 'font-mono text-xs' },

                { key: 'full_name', header: 'Name', className: 'font-medium' },

                { key: 'department', header: 'Department', render: (row) => row.department || '—' },

                { key: 'designation', header: 'Designation', render: (row) => row.designation || '—' },

                { key: 'status', header: 'Status', render: (row) => <Badge className="capitalize">{row.status.replace('_', ' ')}</Badge> },

                { key: 'date_of_joining', header: 'Joined', render: (row) => row.date_of_joining ? formatDate(row.date_of_joining) : '—' },

                { key: 'actions', header: '', className: 'w-[168px] text-right', render: (row) => (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="group">
                    <EmployeeLoginSendMenu
                      disabled={portalBusy}
                      onSelect={(channel) => handleSendLoginSelect(row, channel)}
                    />
                    <TableActions actions={[
                      actionBtn('View employee', Eye, () => setDetail(row)),
                      { ...actionBtn('Delete employee', Trash2, () => setDeleteTarget(row)), variant: 'destructive' },
                    ]} />
                  </div>
                ) },

              ]}

            />

          )}

        </div>

      </PortalPanel>



      <DetailDialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title="Employee profile">

        {detail && (

          <>

            <DetailRow label="Employee ID" value={detail.employee_code} />

            <DetailRow label="Name" value={detail.full_name} />

            <DetailRow label="Email" value={detail.email} />

            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee portal login</p>
              <div className="flex flex-wrap items-center gap-2">
                <EmployeeLoginSendMenu
                  disabled={portalBusy}
                  onSelect={(channel) => handleSendLoginSelect(detail, channel)}
                />
                <span className="text-xs text-muted-foreground">
                  {detail.user_id ? 'Portal active — send login details by email or WhatsApp.' : 'Portal not created yet — choose channel and enter portal email if needed.'}
                </span>
              </div>
            </div>

            <DetailRow label="Phone" value={detail.phone || '—'} />

            <DetailRow label="Department" value={detail.department || '—'} />

            <DetailRow label="Designation" value={detail.designation || '—'} />

            <DetailRow label="Reporting manager" value={detail.reporting_manager || '—'} />

            <DetailRow label="PF / UAN" value={detail.pf_uan || '—'} />

            <DetailRow label="ESIC" value={detail.esic_number || '—'} />



            <div className="space-y-3 pt-4 border-t border-[var(--border)]">

              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee documents</p>

              <GroupedDocumentList

                documents={detail.documents}

                onDownload={(documentId) => void handleDownload(detail.id, documentId)}

              />

              <div className="grid sm:grid-cols-2 gap-3 pt-2">

                <div className="space-y-2">

                  <Label>Joining / employment document</Label>

                  <DocumentUploadSelect value={docCategory} onChange={setDocCategory} />

                </div>

                <div className="space-y-2">

                  <Label>Upload file</Label>

                  <label className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-3 text-sm cursor-pointer">

                    <Upload className="h-4 w-4" />

                    {uploading ? 'Uploading…' : 'Choose PDF/JPG/PNG'}

                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={uploading} onChange={(e) => {

                      const file = e.target.files?.[0]

                      if (file) void handleUpload(detail.id, file)

                    }} />

                  </label>

                </div>

              </div>

            </div>



            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
                <LogOut className="h-3.5 w-3.5" /> Exit management (HR)
              </p>
              {detail.exit_record ? (

                <>

                  <DetailRow label="Exit status" value={detail.exit_record.status.replace('_', ' ')} />

                  <div className="flex flex-wrap gap-2">

                    {EXIT_STATUSES.map((status) => (

                      <Button key={status.value} type="button" size="sm" variant={detail.exit_record?.status === status.value ? 'default' : 'outline'} className="rounded-lg text-xs" onClick={() => void handleExitStatus(detail, status.value)}>

                        {status.label}

                      </Button>

                    ))}

                  </div>

                  <div className="space-y-2 pt-2">

                    <Label>Resignation / exit document</Label>

                    <select

                      value={exitDocCategory}

                      onChange={(e) => setExitDocCategory(e.target.value)}

                      className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"

                    >

                      {EXIT_DOC_CATEGORIES.map((item) => (

                        <option key={item.value} value={item.value}>{item.label}</option>

                      ))}

                    </select>

                    <label className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-3 text-sm cursor-pointer">

                      <FileText className="h-4 w-4" />

                      {exitUploading ? 'Uploading…' : 'Upload exit document'}

                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={exitUploading} onChange={(e) => {

                        const file = e.target.files?.[0]

                        if (file) void handleExitUpload(detail.id, file)

                      }} />

                    </label>

                  </div>

                </>

              ) : (
                <p className="text-sm text-muted-foreground">
                  Waiting for employee to submit resignation from the employee portal (/employee/resignation).
                </p>
              )}

            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <Button type="button" variant="destructive" className="rounded-xl" onClick={() => { setDeleteTarget(detail); setDetail(null) }}>
                Delete employee
              </Button>
            </div>

          </>

        )}

      </DetailDialog>

      <Dialog open={Boolean(sendLoginTarget)} onOpenChange={(open) => !open && setSendLoginTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Portal login email</DialogTitle>
            <DialogDescription>
              {sendLoginTarget?.full_name} does not have portal access yet. Enter the login email to create portal access and send details by {sendLoginChannel === 'email' ? 'email' : 'WhatsApp'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="send-login-portal-email">Portal login email</Label>
            <input
              id="send-login-portal-email"
              type="email"
              value={sendLoginEmail}
              onChange={(e) => setSendLoginEmail(e.target.value)}
              placeholder={sendLoginTarget?.email || 'employee@example.com'}
              className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use a different email if {sendLoginTarget?.email || 'this address'} is already used for Admin/Client login.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSendLoginTarget(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={portalBusy || !sendLoginEmail.trim()} onClick={handleConfirmSendLogin}>
              {portalBusy ? 'Sending…' : sendLoginChannel === 'email' ? 'Create & send email' : 'Create & send WhatsApp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete employee?"
        description={`Remove ${deleteTarget?.full_name ?? 'this employee'} (${deleteTarget?.employee_code ?? ''})? Portal login, documents, leave, and attendance records will be permanently deleted. The linked job application will return to Selected status.`}
        confirmLabel="Delete employee"
        loading={deleting}
        onConfirm={handleDelete}
      />

    </>

  )

}

