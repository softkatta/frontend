import { useLocation } from 'react-router-dom'
import CareersManagement from '@/pages/admin/CareersManagement'
import { HR_CAREERS_TAB_BY_PATH } from '@/lib/hrNavigation'

/** HR module pages — reuses CareersManagement with the tab for the current route */
export default function HrCareersModulePage() {
  const { pathname } = useLocation()
  const initialTab = HR_CAREERS_TAB_BY_PATH[pathname] ?? 'openings'
  return <CareersManagement initialTab={initialTab} />
}
