import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AnnouncementBar } from './AnnouncementBar'
import { ChatWidget } from '@/components/public/chatbot/ChatWidget'
import { SmoothScroll } from '@/components/common/SmoothScroll'
import { PublicRouteSeo } from '@/components/common/PublicRouteSeo'
import { useSiteOffers } from '@/hooks/useSiteOffers'
import { prefetchPublicProducts } from '@/hooks/usePublicProducts'
import { prefetchPublicServices } from '@/hooks/usePublicServices'

export function PublicLayout() {
  const { offers } = useSiteOffers()

  useEffect(() => {
    const prefetch = () => {
      prefetchPublicProducts()
      prefetchPublicServices()
    }

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(prefetch, { timeout: 1500 })
      return () => cancelIdleCallback(id)
    }

    const timer = window.setTimeout(prefetch, 200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="public-site flex min-h-screen min-w-0 max-w-full flex-col overflow-x-clip bg-premium-gradient page-mesh">
      <PublicRouteSeo />
      <SmoothScroll />
      <AnnouncementBar offers={offers} />
      <Navbar />
      <main className="min-w-0 max-w-full flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
