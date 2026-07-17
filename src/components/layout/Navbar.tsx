import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingCart, LayoutDashboard, CreditCard, LogOut } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/store/hooks'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Products' },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/careers', label: 'Careers' },
  { to: '/contact', label: 'Contact' },
  { to: '/blog', label: 'Blog' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { isAuthenticated, hasRole, logout, user } = useAuth()
  const cartCount = useAppSelector((s) => s.cart.items.length)
  const isClient = isAuthenticated && hasRole('client')
  const isEmployee = isAuthenticated && hasRole('employee')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  return (
    <header className={cn('sticky top-0 z-50 min-w-0 max-w-full overflow-x-clip glass-nav transition-all duration-300', scrolled ? 'py-2' : 'py-4')}>
      <div className="container mx-auto min-w-0 px-2.5 sm:px-6">
        <div
          className={cn(
            'nav-pill-light nav-bar-split relative flex h-14 min-w-0 items-center justify-between gap-2 overflow-hidden px-3 sm:px-5',
            scrolled && 'nav-pill-scrolled',
          )}
        >
          <div className="nav-pill-border-glow" aria-hidden />
          <div className="nav-pill-shine absolute top-0 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" aria-hidden />

          <BrandLogo size="md" compactOnNarrow />

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex min-w-0 shrink items-center gap-1 sm:gap-1.5">
            <ThemeToggle />

            {isClient && (
              <>
                <Link to="/cart" className="nav-icon-btn relative hidden sm:inline-flex" aria-label="Cart">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-teal)] text-[9px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/dashboard/subscriptions" className="nav-link hidden xl:inline-flex text-sm gap-1">
                  <CreditCard className="h-3.5 w-3.5" /> Subscriptions
                </Link>
                <Link to="/dashboard" className="nav-link hidden lg:inline-flex text-sm gap-1">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <button type="button" onClick={logout} className="nav-icon-btn hidden sm:inline-flex" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}

            {isEmployee && (
              <>
                <Link to="/employee" className="nav-link hidden lg:inline-flex text-sm gap-1">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Employee portal
                </Link>
                <button type="button" onClick={logout} className="nav-icon-btn hidden sm:inline-flex" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link to="/login" className="nav-link hidden sm:inline-flex text-sm">Login</Link>
                <Link to="/employee" className="nav-link hidden lg:inline-flex text-sm">Employee</Link>
                <Link to="/register" className="nav-pill-cta hidden md:inline-flex">Get Started</Link>
              </>
            )}

            {isAuthenticated && hasRole('admin') && (
              <Link to="/admin" className="nav-pill-cta hidden md:inline-flex text-xs">Admin</Link>
            )}

            <button
              type="button"
              className="lg:hidden p-2 rounded-full hover:bg-[rgba(41,98,255,0.08)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden container mx-auto px-2.5 sm:px-4 mt-2"
          >
            <nav
              id="public-mobile-navigation"
              className="nav-mobile-panel-inner flex max-h-[calc(100dvh-5.5rem)] flex-col gap-1 overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border)] p-3 shadow-xl"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn('nav-mobile-link px-4 py-3 rounded-xl text-sm font-semibold', isActive && 'nav-mobile-link-active')
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isClient && (
                <>
                  <Link to="/cart" onClick={() => setMobileOpen(false)} className="nav-mobile-link px-4 py-3 rounded-xl flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <Link to="/dashboard/subscriptions" onClick={() => setMobileOpen(false)} className="nav-mobile-link px-4 py-3 rounded-xl flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Subscriptions
                  </Link>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="nav-mobile-link px-4 py-3 rounded-xl flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard ({user?.first_name})
                  </Link>
                </>
              )}
              {isEmployee && (
                <Link to="/employee" onClick={() => setMobileOpen(false)} className="nav-mobile-link px-4 py-3 rounded-xl flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Employee portal ({user?.first_name})
                </Link>
              )}
              <div className="grid grid-cols-2 gap-2 pt-3 mt-1 border-t border-[var(--border)]">
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="nav-mobile-login flex-1 text-center py-2.5 rounded-xl text-sm font-semibold">
                      Login
                    </Link>
                    <Link to="/employee" onClick={() => setMobileOpen(false)} className="nav-mobile-login flex-1 text-center py-2.5 rounded-xl text-sm font-semibold">
                      Employee
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="nav-pill-cta col-span-2 justify-center">
                      Register
                    </Link>
                  </>
                ) : (
                  <button type="button" onClick={() => { logout(); setMobileOpen(false) }} className="nav-mobile-login col-span-2 w-full py-2.5 rounded-xl text-sm font-semibold">
                    Logout
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
