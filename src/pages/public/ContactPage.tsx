import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, MessageCircle, Send, Clock, Headphones, Navigation, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
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

export default function ContactPage() {
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
  const mapMetaItems = useMemo(() => {
    type MapMetaItem = { icon: typeof Clock; label: string; value: string; href?: string }
    const items: Array<MapMetaItem | null> = [
      { icon: Clock, label: 'Mon–Sat', value: '9 AM – 7 PM IST' },
      companyPhone ? { icon: Phone, label: 'Call', value: companyPhone, href: phoneTelHref(companyPhone) } : null,
      supportEmail ? { icon: Mail, label: 'Email', value: supportEmail, href: mailtoHref(supportEmail) } : null,
    ]
    return items.filter((item): item is MapMetaItem => item !== null)
  }, [companyPhone, supportEmail])
  const whatsappLink = whatsappHref(companyPhone)

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
    <div>
      <section className="hero-cyber pt-24 pb-16 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-60" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label="Get In Touch"
            title="Contact"
            highlight="Us"
            description={companyAddress ? `Visit us at ${companyAddress}, or send a message — we're here to help.` : "Send us a message — we're here to help."}
          />
        </div>
      </section>

      <PageSection tone="muted" className="!pt-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: contact info + map */}
          <div className="space-y-6">
            <div className="contact-info-panel rounded-2xl border border-[var(--border)] p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Talk to our team</h2>
                  <p className="text-sm text-muted-foreground">Free consultation for services & demos</p>
                </div>
              </div>
              <div className="space-y-3">
                {channels.map((item) => (
                  <div
                    key={item.label}
                    className="contact-channel-row flex items-center gap-4 p-4 rounded-xl border border-[var(--border)]"
                  >
                    <div className="contact-channel-row__icon rounded-xl p-2.5 shrink-0">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="font-semibold text-sm hover:text-[var(--brand-blue)] transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-sm">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-action-btn contact-action-btn--whatsapp inline-flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-semibold mt-5"
                >
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Right: form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="contact-form-panel rounded-2xl border p-6 sm:p-8 h-full">
              <span className="contact-form-badge inline-block text-xs font-medium px-3 py-1 rounded-full mb-6">
                Send us a message
              </span>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] min-h-[9rem]"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pb-2">
                  {['24h response', 'Free consultation', 'GST billing'].map((t) => (
                    <span key={t} className="contact-trust-pill text-xs font-semibold px-3 py-1.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
                <button type="submit" disabled={submitting} className="glow-btn inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-60">
                  <Send className="h-4 w-4" /> {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </PageSection>

      {/* Map section */}
      <section className="contact-map-section relative overflow-hidden">
        <div className="contact-map-section__bg" aria-hidden />
        <div className="contact-map-section__orb contact-map-section__orb--1" aria-hidden />
        <div className="contact-map-section__orb contact-map-section__orb--2" aria-hidden />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="text-center mb-8 sm:mb-10">
            <span className="section-label mb-3 inline-flex">Our Location</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-hero)] mb-2">
              Find Us on the <span className="text-brand-gradient">Map</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {companyAddress || 'Our office location on the map.'}
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
                    {companyAddress}
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
          </div>
        </div>
      </section>
    </div>
  )
}
