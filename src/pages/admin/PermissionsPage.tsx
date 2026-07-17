import { PortalPageShell } from '@/components/common/PortalPageShell'
import { PermissionsPanel } from '@/components/admin/PermissionsPanel'

export default function PermissionsPage() {
  return (
    <PortalPageShell
      eyebrow="Access control"
      heroTitle="Permissions"
      heroDescription="Configure what each login role can access across employee, HR, and client portals."
      title="Role permissions"
      description="Founder / Owner, HR Manager, Employee, and Customer access"
      layout="sections"
    >
      <PermissionsPanel embedded />
    </PortalPageShell>
  )
}
