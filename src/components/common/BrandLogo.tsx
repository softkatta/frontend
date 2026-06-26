import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'

type BrandLogoSize = 'sm' | 'md' | 'lg'

const sizes: Record<BrandLogoSize, { img: string; text: string; gap: string }> = {
  sm: { img: 'h-8 w-8', text: 'text-sm', gap: 'gap-2' },
  md: { img: 'h-9 w-9 sm:h-10 sm:w-10', text: 'text-base sm:text-lg', gap: 'gap-2.5' },
  lg: { img: 'h-11 w-11 sm:h-12 sm:w-12', text: 'text-lg sm:text-xl', gap: 'gap-3' },
}

interface BrandLogoProps {
  size?: BrandLogoSize
  showText?: boolean
  className?: string
  linkToHome?: boolean
}

export function BrandLogo({ size = 'md', showText = true, className, linkToHome = true }: BrandLogoProps) {
  const { logoUrl, companyName } = useSiteBranding()
  const s = sizes[size]

  const content = (
    <>
      <img
        src={logoUrl || BRAND_LOGO_SRC}
        alt={`${companyName || BRAND_NAME} logo`}
        className={cn('brand-logo__img object-contain shrink-0', s.img)}
      />
      {showText && (
        <span className={cn('font-display font-bold tracking-tight leading-none text-brand-gradient', s.text)}>
          {companyName || BRAND_NAME}
        </span>
      )}
    </>
  )

  const classes = cn('brand-logo inline-flex items-center', s.gap, className)

  if (linkToHome) {
    return (
      <Link to="/" className={cn(classes, 'nav-pill-logo shrink-0')}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
