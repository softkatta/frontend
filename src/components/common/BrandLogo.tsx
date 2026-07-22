import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'

type BrandLogoSize = 'sm' | 'md' | 'lg'

const sizes: Record<BrandLogoSize, { img: string; text: string; gap: string; px: number }> = {
  sm: { img: 'h-8 w-8', text: 'text-sm', gap: 'gap-2', px: 32 },
  md: { img: 'h-9 w-9 sm:h-10 sm:w-10', text: 'text-base sm:text-lg', gap: 'gap-2.5', px: 40 },
  lg: { img: 'h-11 w-11 sm:h-12 sm:w-12', text: 'text-lg sm:text-xl', gap: 'gap-3', px: 48 },
}

interface BrandLogoProps {
  size?: BrandLogoSize
  showText?: boolean
  /** Use short brand name and truncate on narrow viewports (navbar). */
  compactOnNarrow?: boolean
  className?: string
  linkToHome?: boolean
}

export function BrandLogo({
  size = 'md',
  showText = true,
  compactOnNarrow = false,
  className,
  linkToHome = true,
}: BrandLogoProps) {
  const { logoUrl, companyName, brandShortName } = useSiteBranding()
  const [imgSrc, setImgSrc] = useState(logoUrl || BRAND_LOGO_SRC)
  const s = sizes[size]
  const fullName = companyName || BRAND_NAME
  const displayName = compactOnNarrow ? (brandShortName || fullName) : fullName

  useEffect(() => {
    setImgSrc(logoUrl || BRAND_LOGO_SRC)
  }, [logoUrl])

  const content = (
    <>
      <img
        src={imgSrc}
        alt={`${fullName} logo`}
        width={s.px}
        height={s.px}
        decoding="async"
        className={cn('brand-logo__img object-contain shrink-0', s.img)}
        onError={() => {
          if (imgSrc !== BRAND_LOGO_SRC) setImgSrc(BRAND_LOGO_SRC)
        }}
      />
      {showText && (
        <span
          className={cn(
            'font-display font-bold tracking-tight leading-none text-brand-gradient',
            s.text,
            compactOnNarrow && 'max-w-[7.5rem] truncate sm:max-w-[9.5rem] lg:max-w-none lg:whitespace-normal',
          )}
        >
          <span className={cn(compactOnNarrow && 'lg:hidden')}>{displayName}</span>
          {compactOnNarrow && <span className="hidden lg:inline">{fullName}</span>}
        </span>
      )}
    </>
  )

  const classes = cn('brand-logo inline-flex min-w-0 items-center', s.gap, className)

  if (linkToHome) {
    return (
      <Link to="/" className={cn(classes, 'nav-pill-logo min-w-0 shrink')}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
