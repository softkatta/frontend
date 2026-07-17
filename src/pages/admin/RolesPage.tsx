import { PortalPageShell } from '@/components/common/PortalPageShell'
import { CompanyRolesPanel } from '@/components/admin/CompanyRolesPanel'

export default function RolesPage() {
  return (
    <PortalPageShell
      eyebrow="Access control"
      heroTitle="Roles"
      heroDescription="Standard SoftKatta job titles — Founder, CEO, Developer, HR Executive, and more."
      title="Company roles"
      description="Designations used when hiring and assigning employees"
      layout="sections"
    >
      <CompanyRolesPanel embedded />
    </PortalPageShell>
  )
}
