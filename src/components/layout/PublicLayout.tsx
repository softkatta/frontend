import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { SmoothScroll } from '@/components/common/SmoothScroll'

export function PublicLayout() {
  return (
    <div className="public-site min-h-screen bg-premium-gradient page-mesh flex flex-col">
      <SmoothScroll />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
