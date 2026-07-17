import { Link } from 'react-router-dom'
import { ChevronDown, KeyRound, LogOut, Settings, Shield, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { canAccessPath } from '@/lib/accessControl'
import { userAvatarUrl } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'
import type { SidebarVariant } from './Sidebar'

interface ProfileMenuProps {
  variant?: SidebarVariant
}

export function ProfileMenu({ variant = 'client' }: ProfileMenuProps) {
  const { user, logout } = useAuth()

  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() || 'SK'
    : 'SK'
  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() : 'User'
  const avatarSrc = userAvatarUrl(user?.avatar, displayName)
  const profilePath = variant === 'admin'
    ? '/admin/profile'
    : variant === 'employee'
      ? '/employee/profile'
      : variant === 'hr'
        ? '/hr/profile'
        : '/dashboard/profile'
  const passwordPath = variant === 'admin'
    ? '/admin/change-password'
    : variant === 'employee'
      ? '/employee/change-password'
      : variant === 'hr'
        ? '/hr/change-password'
        : '/dashboard/change-password'
  const securityPath = variant === 'admin'
    ? '/admin/security'
    : variant === 'employee'
      ? '/employee/security'
      : variant === 'hr'
        ? '/hr/security'
        : '/dashboard/security'
  const settingsPath = '/admin/settings'

  const showProfile = canAccessPath(user, profilePath)
  const showPassword = canAccessPath(user, passwordPath)
  const showSecurity = canAccessPath(user, securityPath)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-[var(--input)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]/30',
            variant === 'admin' && 'admin-profile-trigger',
          )}
          aria-label="Open profile menu"
        >
          <Avatar className="h-9 w-9 border border-[var(--border)]">
            <AvatarImage src={avatarSrc} alt={displayName} />
            <AvatarFallback className="bg-[var(--brand-blue)]/10 text-sm font-semibold text-[var(--brand-blue)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:inline">
            {displayName}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-[var(--muted-foreground)] sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-10 w-10 border border-[var(--border)]">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="bg-[var(--brand-blue)]/10 text-sm font-semibold text-[var(--brand-blue)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              {user?.email ? (
                <p className="truncate text-xs font-normal text-[var(--muted-foreground)]">{user.email}</p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showProfile ? (
          <DropdownMenuItem asChild>
            <Link to={profilePath} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </DropdownMenuItem>
        ) : null}
        {showPassword ? (
          <DropdownMenuItem asChild>
            <Link to={passwordPath} className="cursor-pointer">
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Link>
          </DropdownMenuItem>
        ) : null}
        {showSecurity ? (
          <DropdownMenuItem asChild>
            <Link to={securityPath} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Link>
          </DropdownMenuItem>
        ) : null}
        {variant === 'admin' ? (
          <DropdownMenuItem asChild>
            <Link to={settingsPath} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Platform Settings
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={cn('cursor-pointer text-destructive focus:text-destructive')}
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
