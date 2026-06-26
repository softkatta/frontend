import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ArrowUpRight, Globe, Send } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { mailtoHref, phoneTelHref, websiteHref } from '@/lib/companyContact'

const footerLinks = {
  Products: [
    { label: 'Software Shop', to: '/products' },
    { label: 'Pricing', to: '/pricing' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Services', to: '/services' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Contact', to: '/contact' },
  ],
  Resources: [
    { label: 'Blog', to: '/blog' },
    { label: 'Software Shop', to: '/products' },
    { label: 'Create Account', to: '/register' },
    { label: 'Login', to: '/login' },
  ],
}

export function Footer() {
  const {
    companyName,
    companyTagline,
    companyAddress,
    companyPhone,
    companyWebsite,
    supportEmail,
  } = useSiteBranding()

  const email = supportEmail.trim()
  const phone = companyPhone.trim()
  const address = companyAddress.trim()
  const website = websiteHref(companyWebsite)

  return (
    <footer className="site-footer-shell relative mt-auto overflow-hidden">
      <div className="site-footer-topline" aria-hidden />
      <div className="site-footer-mesh absolute inset-0 opacity-50 pointer-events-none" aria-hidden />

      <div className="site-footer-cta relative border-b border-[var(--footer-border)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-xl sm:text-2xl font-bold text-[var(--footer-heading)]">
              Ready to grow with {companyName}?
            </p>
            <p className="text-sm mt-1 opacity-75">
              {companyTagline || 'GST invoices · Instant setup · Secure cloud'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/register" className="glow-btn inline-flex items-center gap-2 px-6 py-2.5 text-sm rounded-full">
              Get Started <Send className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="hero-cta-ghost inline-flex items-center gap-2 px-6 py-2.5 text-sm rounded-full">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      <div className="site-footer-content container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <BrandLogo size="lg" className="mb-5" />
            <p className="text-sm leading-relaxed max-w-sm mb-6 opacity-80">
              {companyTagline || 'Cloud business software for Indian SMEs — built for growth, trusted across India.'}
            </p>
            <div className="space-y-3 text-sm opacity-85 mb-6">
              {email && (
                <a href={mailtoHref(email)} className="flex items-center gap-2.5 hover:text-[var(--brand-teal)] transition-colors">
                  <Mail className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                  {email}
                </a>
              )}
              {phone && (
                <a href={phoneTelHref(phone)} className="flex items-center gap-2.5 hover:text-[var(--brand-teal)] transition-colors">
                  <Phone className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                  {phone}
                </a>
              )}
              {address && (
                <p className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                  {address}
                </p>
              )}
            </div>
            {website && (
              <div className="flex gap-2">
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Website"
                  className="site-footer-social"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="site-footer-col-heading text-sm uppercase tracking-wider mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="group flex items-center gap-1 text-sm opacity-75 hover:opacity-100 hover:text-[var(--brand-teal)] transition-all"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="accent-line my-10 opacity-40" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm opacity-70">
          <p>&copy; {new Date().getFullYear()} {companyName}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs uppercase tracking-widest">
            <span>Shop Act</span>
            <span className="opacity-40">·</span>
            <span>Udyam MSME</span>
            <span className="opacity-40">·</span>
            <span>GST Registered</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
