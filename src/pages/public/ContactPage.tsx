import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  Headphones,
  Navigation,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { contactApi } from '@/services/api'
import { getApiErrorMessage } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { useSiteBranding } from '@/contexts/SiteBrandingContext'
import {
  mailtoHref,
  mapsDirectionsUrl,
  mapsEmbedUrl,
  mapsSearchUrl,
  phoneTelHref,
  whatsappHref,
} from '@/lib/companyContact'

import { usePublicPageContent } from '@/hooks/usePublicPageContent'

export default function ContactPage() {
  const { page } = usePublicPageContent('contact')
  const TRUST_ITEMS = page.trust_items ?? []
  const {
    companyName,
    companyAddress,
    companyPhone,
    supportEmail,
  } = useSiteBranding()

  const channels = useMemo(() => {
    const email = supportEmail.trim()
    const phone = companyPhone.trim()
    const address = companyAddress.trim()

    return [
      email ? { icon: Mail, label: 'Email', value: email, href: mailtoHref(email) } : null,
      phone ? { icon: Phone, label: 'Phone', value: phone, href: phoneTelHref(phone) } : null,
      address ? { icon: MapPin, label: 'Office', value: address } : null,
      { icon: Clock, label: 'Hours', value: 'Mon–Sat, 9:00 AM – 7:00 PM IST' },
    ].filter(Boolean) as Array<{
      icon: typeof Mail
      label: string
      value: string
      href?: string
    }>
  }, [companyAddress, companyPhone, supportEmail])

  const mapEmbed = mapsEmbedUrl(companyAddress)
  const mapDirections = mapsDirectionsUrl(companyAddress)
  const mapOpen = mapsSearchUrl(companyAddress)
  const whatsappLink = whatsappHref(companyPhone)
  const mapMetaItems = useMemo(() => {
    type MapMetaItem = { icon: typeof Clock; label: string; value: string; href?: string }
    const items: Array<MapMetaItem | null> = [
      { icon: Clock, label: 'Mon–Sat', value: '9 AM – 7 PM IST' },
      companyPhone ? { icon: Phone, label: 'Call', value: companyPhone, href: phoneTelHref(companyPhone) } : null,
      supportEmail ? { icon: Mail, label: 'Email', value: supportEmail, href: mailtoHref(supportEmail) } : null,
    ]
    return items.filter((item): item is MapMetaItem => item !== null)
  }, [companyPhone, supportEmail])

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await contactApi.submit({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subject: form.subject || undefined,
        message: form.message,
      })
      toast({ title: 'Message sent!', description: "We'll get back to you within 24 hours.", variant: 'success' })
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      toast({ title: 'Failed to send message', description: getApiErrorMessage(error), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-page__bg" aria-hidden />

      <section className="contact-page__hero relative overflow-hidden pt-24 pb-8 sm:pb-10">
        <div className="contact-page__hero-glow" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="section-label mb-4 inline-block">{page.label}</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-4">
              {page.title}{' '}
              {page.highlight && <span className="text-gradient-brand">{page.highlight}</span>}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{page.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="contact-page__trust-row mt-8"
          >
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="contact-page__trust-pill">
                <ShieldCheck className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="contact-page__split">
            {/* Left: form */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="contact-page__form-panel"
            >
              <div className="contact-page__panel-head">
                <div className="contact-page__panel-icon">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Send a message</h2>
                  <p className="text-sm text-muted-foreground">We typically reply within one business day.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-11 rounded-xl bg-[var(--background)]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-11 rounded-xl bg-[var(--background)]/60"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="h-11 rounded-xl bg-[var(--background)]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="h-11 rounded-xl bg-[var(--background)]/60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] min-h-[9rem]"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="glow-btn inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </motion.div>

            {/* Right: channels + map */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="contact-page__side"
            >
              <div className="contact-page__info-panel">
                <div className="contact-page__panel-head">
                  <div className="contact-page__panel-icon contact-page__panel-icon--teal">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">Talk to our team</h2>
                    <p className="text-sm text-muted-foreground">Free consultation for services & demos</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {channels.map((item) => (
                    <div key={item.label} className="contact-page__channel">
                      <div className="contact-page__channel-icon">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="font-semibold text-sm hover:text-[var(--brand-blue)] transition-colors break-words">
                            {item.value}
                          </a>
                        ) : (
                          <p className="font-semibold text-sm break-words">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="contact-page__actions">
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-page__action contact-page__action--whatsapp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}
                  <Link to="/products" className="contact-page__action">
                    Browse products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Full-width map */}
      <section className="contact-map-section relative overflow-hidden">
        <div className="contact-map-section__bg" aria-hidden />
        <div className="contact-map-section__orb contact-map-section__orb--1" aria-hidden />
        <div className="contact-map-section__orb contact-map-section__orb--2" aria-hidden />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 max-w-6xl">
          <div className="text-center mb-8 sm:mb-10">
            <span className="section-label mb-3 inline-flex">Our Location</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-hero)] mb-2">
              Find Us on the <span className="text-brand-gradient">Map</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {companyAddress || 'Locate our office and get directions in Google Maps.'}
            </p>
          </div>

          <div className="contact-map-section__card">
            <div className="contact-map-section__toolbar">
              <div className="flex items-start gap-3 min-w-0">
                <div className="contact-map-section__pin-icon shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm sm:text-base">{companyName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {companyAddress || 'Set company address in admin settings for an exact pin.'}
                  </p>
                </div>
              </div>
              <div className="contact-map-section__actions">
                <a
                  href={mapDirections}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-map-section__btn contact-map-section__btn--primary"
                >
                  <Navigation className="h-4 w-4" /> Directions
                </a>
                <a
                  href={mapOpen}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-map-section__btn contact-map-section__btn--ghost"
                >
                  <ExternalLink className="h-4 w-4" /> Open in Maps
                </a>
              </div>
            </div>

            <div className="contact-map-section__frame">
              <iframe
                title={`${companyName} office location`}
                src={mapEmbed}
                className="contact-map-section__iframe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <div className="contact-map-section__overlay" aria-hidden />
            </div>

            {mapMetaItems.length > 0 && (
              <div className="contact-map-section__footer">
                {mapMetaItems.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="contact-map-section__meta">
                    <Icon className="h-4 w-4 text-[var(--brand-teal)] shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                      {href ? (
                        <a href={href} className="text-xs sm:text-sm font-semibold hover:text-[var(--brand-blue)] transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="contact-page__cta pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="premium-card p-8 sm:p-10 rounded-3xl text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">{page.cta_title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{page.cta_description}</p>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hero-cta-ghost inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
