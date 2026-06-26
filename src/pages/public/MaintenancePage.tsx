import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { SparkleBackground } from '@/components/common/SparkleBackground'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { BRAND_LOGO_SRC } from '@/lib/brand'
import type { MaintenancePageContent } from '@/types/maintenance'

type MaintenancePageProps = {
  content: MaintenancePageContent
}

export function MaintenancePage({ content }: MaintenancePageProps) {
  const { logoUrl, companyName, companyTagline } = useSiteBranding()

  const logoSrc = logoUrl || content.logoUrl || BRAND_LOGO_SRC
  const name = companyName || content.companyName
  const tagline = companyTagline || content.companyTagline
  const showImage = content.pageType === 'maintenance' && content.imageUrl
  const showLaunchSparkles = content.pageType === 'launch'
  const isLaunch = content.pageType === 'launch'

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden ${
        isLaunch
          ? 'flex flex-col items-center justify-center px-4 py-6 sm:px-6'
          : 'px-4 py-10 sm:px-6 sm:py-14'
      }`}
      style={{
        background: showImage
          ? undefined
          : 'radial-gradient(ellipse 80% 60% at 50% 20%, #1a2d52 0%, #0c1428 45%, #060a14 100%)',
      }}
    >
      {showImage && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${content.imageUrl})` }}
          aria-hidden
        />
      )}

      {showLaunchSparkles && <SparkleBackground />}

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: showImage
            ? 'linear-gradient(180deg, rgba(6, 10, 20, 0.18) 0%, rgba(6, 10, 20, 0.32) 100%)'
            : undefined,
        }}
      />

      <div
        className={`pointer-events-none absolute inset-0 ${showImage ? 'opacity-10' : 'opacity-40'}`}
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.12) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 40%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.55 }}
        className={`relative z-10 flex w-full max-w-5xl flex-col items-center justify-center text-center ${
          showImage
            ? 'mx-auto rounded-3xl border border-white/20 bg-white/[0.03] px-6 py-10 shadow-[0_8px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl backdrop-saturate-125 sm:px-10 sm:py-12'
            : 'mx-auto'
        }`}
      >
        <div className="mb-6 flex justify-center">
          <div
            className="relative"
            style={{ filter: 'drop-shadow(0 0 28px rgba(45, 212, 191, 0.35)) drop-shadow(0 0 48px rgba(99, 102, 241, 0.2))' }}
          >
            <img
              src={logoSrc}
              alt={name}
              className="h-28 w-28 object-contain sm:h-36 sm:w-36"
            />
          </div>
        </div>

        {content.badge && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-4 py-2 text-sm text-[#b8fff4] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
            <Rocket className="h-4 w-4 shrink-0" aria-hidden />
            <span>{content.badge}</span>
          </div>
        )}

        {name && (
          <h1 className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl">
            {name}
          </h1>
        )}

        {tagline && (
          <p className="mt-3 text-base font-medium text-slate-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-lg">
            {tagline}
          </p>
        )}

        {content.message && (
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] sm:text-base">
            {content.message}
          </p>
        )}
      </motion.div>
    </div>
  )
}
