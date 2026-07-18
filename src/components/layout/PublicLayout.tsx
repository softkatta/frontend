import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AnnouncementBar } from './AnnouncementBar'
import { ChatWidget } from '@/components/public/chatbot/ChatWidget'
import { SmoothScroll } from '@/components/common/SmoothScroll'
import { PublicRouteSeo } from '@/components/common/PublicRouteSeo'
import { useSiteOffers } from '@/hooks/useSiteOffers'
import { prefetchPublicProducts } from '@/hooks/usePublicProducts'
import { prefetchPublicServices } from '@/hooks/usePublicServices'
import { prefetchHomeReviews } from '@/hooks/useHomeReviews'
import { siteApi } from '@/services/api/modules/site.api'

const SESSION_KEY = 'sk_visit_session'

function visitSessionKey() {
  try {
    let key = sessionStorage.getItem(SESSION_KEY)
    if (!key) {
      key = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, key)
    }
    return key
  } catch {
    return undefined
  }
}

export function PublicLayout() {
  const { offers } = useSiteOffers()
  const location = useLocation()
  const lastPath = useRef('')

  useEffect(() => {
    const prefetch = () => {
      prefetchPublicProducts()
      prefetchPublicServices()
      prefetchHomeReviews()
    }

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(prefetch, { timeout: 800 })
      return () => cancelIdleCallback(id)
    }

    const timer = window.setTimeout(prefetch, 100)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const path = location.pathname || '/'
    if (path === lastPath.current) return
    lastPath.current = path

    void siteApi.trackVisit({ path, session_key: visitSessionKey() }).catch(() => undefined)
  }, [location.pathname])

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
