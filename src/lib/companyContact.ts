export function phoneDigits(phone: string): string {
  return phone.replace(/\D+/g, '')
}

export function phoneTelHref(phone: string): string | undefined {
  const digits = phoneDigits(phone)
  if (!digits) return undefined
  return `tel:+${digits}`
}

export function mailtoHref(email: string): string | undefined {
  const trimmed = email.trim()
  return trimmed ? `mailto:${trimmed}` : undefined
}

export function whatsappHref(phone: string): string | undefined {
  const digits = phoneDigits(phone)
  return digits ? `https://wa.me/${digits}` : undefined
}

export function mapsEmbedUrl(address: string): string {
  const trimmed = address.trim()
  if (!trimmed) {
    return 'https://maps.google.com/maps?q=India&t=&z=5&ie=UTF8&iwloc=&output=embed'
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=14&ie=UTF8&iwloc=&output=embed`
}

export function mapsDirectionsUrl(address: string): string {
  const trimmed = address.trim()
  if (!trimmed) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`
}

export function mapsSearchUrl(address: string): string {
  const trimmed = address.trim()
  if (!trimmed) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`
}

export function websiteHref(website: string): string | undefined {
  const trimmed = website.trim()
  if (!trimmed) return undefined
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}
