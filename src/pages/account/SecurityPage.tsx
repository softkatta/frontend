import { useLocation } from 'react-router-dom'
import AccountSecurityPage from '@/pages/account/AccountSecurityPage'

export default function SecurityPage() {
  const isAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <AccountSecurityPage
      changePasswordPath={isAdmin ? '/admin/change-password' : '/dashboard/change-password'}
    />
  )
}
