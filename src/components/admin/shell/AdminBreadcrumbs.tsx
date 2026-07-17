import { Link, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getAdminBreadcrumbs } from '@/lib/adminNavigation'

export function AdminBreadcrumbs() {
  const { pathname } = useLocation()
  const segments = getAdminBreadcrumbs(pathname)

  if (segments.length <= 1) return null

  return (
    <Breadcrumb className="admin-breadcrumbs mb-4 sm:mb-5">
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const isFirst = index === 0

          return (
            <span key={`${segment.label}-${index}`} className="contents">
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={segment.href} className="inline-flex items-center gap-1.5">
                      {isFirst ? <Home className="h-3.5 w-3.5" aria-hidden /> : null}
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="font-medium text-[var(--muted-foreground)]">{segment.label}</span>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
