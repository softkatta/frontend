import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { SocialMediaLinks } from '@/components/common/SocialMediaLinks'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import { mailtoHref, phoneTelHref, websiteHref } from '@/lib/companyContact'

const footerLinks = {
  Products: [
    { label: 'Software Shop', to: '/products' },
    { label: 'Pricing', to: '/pricing' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Services', to: '/services' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Contact', to: '/contact' },
  ],
  Resources: [
    { label: 'FAQ', to: '/faq' },
    { label: 'Blog', to: '/blog' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Software Shop', to: '/products' },
    { label: 'Create Account', to: '/register' },
    { label: 'Login', to: '/login' },
    { label: 'Employee portal', to: '/employee' },
  ],
}

export function Footer() {
  const {
    companyName,
    companyTagline,
    companyDescription,
    companyAddress,
    companyPhone,
    companyWebsite,
    supportEmail,
    gstNumber,
    gstEnabled,
    socialFacebook,
    socialInstagram,
    socialLinkedin,
    socialTwitter,
    socialYoutube,
    socialWhatsapp,
  } = useSiteBranding()

  const email = supportEmail.trim()
  const phone = companyPhone.trim()
  const address = companyAddress.trim()
  const website = websiteHref(companyWebsite)
  const socialLinks = {
    facebook: socialFacebook,
    instagram: socialInstagram,
    linkedin: socialLinkedin,
    twitter: socialTwitter,
    youtube: socialYoutube,
    whatsapp: socialWhatsapp,
  }

  return (
    <footer className="site-footer-shell relative mt-auto overflow-hidden">
      <div className="site-footer-topline" aria-hidden />
      <div className="site-footer-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="site-footer-orb site-footer-orb--one" aria-hidden />
      <div className="site-footer-orb site-footer-orb--two" aria-hidden />

      <div className="site-footer-content container relative z-10 mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="site-footer-brand-card">
              <BrandLogo size="lg" className="mb-5" />
              <p className="max-w-md text-sm leading-7 text-slate-300">
                {companyDescription || companyTagline || 'Cloud business software for Indian SMEs — built for growth, trusted across India.'}
              </p>

              <div className="mt-6 grid gap-2.5">
                {email && (
                  <a href={mailtoHref(email)} className="site-footer-contact">
                    <span className="site-footer-contact__icon"><Mail className="h-4 w-4" /></span>
                    <span className="min-w-0 truncate">{email}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
                  </a>
                )}
                {phone && (
                  <a href={phoneTelHref(phone)} className="site-footer-contact">
                    <span className="site-footer-contact__icon"><Phone className="h-4 w-4" /></span>
                    <span>{phone}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
                  </a>
                )}
                {address && (
                  <div className="site-footer-contact items-start">
                    <span className="site-footer-contact__icon"><MapPin className="h-4 w-4" /></span>
                    <span className="min-w-0 leading-relaxed">{address}</span>
                  </div>
                )}
              </div>

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-website"
                >
                  <Globe className="h-4 w-4" />
                  Visit website
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}

              <SocialMediaLinks
                links={socialLinks}
                className="mt-5"
                buttonClassName="site-footer-social"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:pt-4">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="site-footer-col-heading mb-5 text-xs uppercase tracking-[0.18em]">{title}</h4>
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="site-footer-link">
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="site-footer-bottom">
          <div className="flex flex-wrap items-center gap-2">
            <span className="site-footer-trust">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure platform
            </span>
            <span className="site-footer-trust">
              <BadgeCheck className="h-3.5 w-3.5" />
              Udyam MSME
            </span>
            {gstEnabled && (
              <span className="site-footer-trust">
                <BadgeCheck className="h-3.5 w-3.5" />
                GST Registered
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-xs text-slate-400 sm:items-end">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
              {gstEnabled && gstNumber ? <span>GSTIN: {gstNumber}</span> : null}
            </div>
            <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
