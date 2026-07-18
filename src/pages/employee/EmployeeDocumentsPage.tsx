import { useCallback, useEffect, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { PortalPage, PortalPanel, PortalWelcome } from '@/components/common/PortalPage'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { employeeApi } from '@/services/api/modules/employee.api'
import { EMPLOYEE_SELF_SERVICE_DOC_CATEGORIES, getEmployeeDocumentLabel } from '@/lib/hrConstants'
import { asRecord, asString, downloadBlob, getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'

type DocRow = { id: string; original_name: string; category: string }

export default function EmployeeDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [companyDocs, setCompanyDocs] = useState<DocRow[]>([])
  const [myDocs, setMyDocs] = useState<DocRow[]>([])
  const [category, setCategory] = useState<string>(EMPLOYEE_SELF_SERVICE_DOC_CATEGORIES[0]?.value ?? 'leave_application')
  const [uploading, setUploading] = useState(false)
  const [idCardBusy, setIdCardBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = asRecord(await employeeApi.documents.list())
      const mapDocs = (list: unknown) => unwrapList(list).map((item) => {
        const row = asRecord(item)
        return { id: asString(row.id), original_name: asString(row.original_name), category: asString(row.category) }
      })
      setCompanyDocs(mapDocs(raw.company_documents))
      setMyDocs(mapDocs(raw.my_submissions))
    } catch (err) {
      toast({ title: 'Failed to load documents', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleDownload = async (id: string) => {
    try {
      const res = await employeeApi.documents.download(id)
      window.open(res.download_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast({ title: 'Download failed', description: getApiErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleDownloadIdCard = async () => {
    setIdCardBusy(true)
    try {
      const blob = await employeeApi.documents.downloadIdCard()
      downloadBlob(blob, `id-card-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast({ title: 'ID card downloaded', variant: 'success' })
    } catch (err) {
      toast({ title: 'ID card failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setIdCardBusy(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('file', file)
      await employeeApi.documents.upload(formData)
      toast({ title: 'Document uploaded', variant: 'success' })
      await load()
    } catch (err) {
      toast({ title: 'Upload failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  const renderList = (docs: DocRow[], empty: string) => docs.length === 0 ? (
    <p className="text-sm text-muted-foreground">{empty}</p>
  ) : (
    <ul className="space-y-2">
      {docs.map((doc) => (
        <li key={doc.id} className="flex flex-col items-stretch gap-3 rounded-xl border border-[var(--border)] px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:py-2">
          <span className="min-w-0 break-all sm:break-normal">{doc.original_name} <span className="text-muted-foreground">({getEmployeeDocumentLabel(doc.category)})</span></span>
          <Button type="button" size="sm" variant="outline" className="w-full shrink-0 gap-1 rounded-lg sm:w-auto" onClick={() => void handleDownload(doc.id)}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
        </li>
      ))}
    </ul>
  )

  return (
    <PortalPage className="space-y-6">
      <PortalWelcome eyebrow="Documents" title="My documents" description="Download company-issued letters. Upload leave or attendance supporting documents here." />

      <PortalPanel>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--input)]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display font-semibold text-sm">Employee ID card</p>
              <p className="text-xs text-muted-foreground">Download your SoftKatta identity card (PDF).</p>
            </div>
            <Button type="button" variant="outline" className="gap-2 rounded-xl shrink-0" disabled={idCardBusy} onClick={() => void handleDownloadIdCard()}>
              <Download className="h-4 w-4" />
              {idCardBusy ? 'Generating…' : 'Download ID card'}
            </Button>
          </div>
          <div>
            <h2 className="font-display font-semibold mb-3">Company documents (view / download)</h2>
            {renderList(companyDocs, 'No company documents uploaded by HR yet.')}
          </div>
          <div>
            <h2 className="font-display font-semibold mb-3">My submissions</h2>
            {renderList(myDocs, 'No self-service documents uploaded yet.')}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
            <div className="space-y-2">
              <Label>Upload document type</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-sm">
                {EMPLOYEE_SELF_SERVICE_DOC_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Choose file</Label>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-[var(--border)] px-3 text-sm cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'PDF / JPG / PNG'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={uploading} onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }} />
              </label>
            </div>
          </div>
        </div>
      </PortalPanel>
    </PortalPage>
  )
}
