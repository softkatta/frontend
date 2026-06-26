export const SITE_CONFIG_UPDATED = 'softkatta:site-config-updated'

export type SiteConfigScope = 'branding' | 'maintenance' | 'content' | 'all'

export function notifySiteConfigUpdated(scope: SiteConfigScope = 'all') {
  window.dispatchEvent(new CustomEvent(SITE_CONFIG_UPDATED, { detail: { scope } }))
}

export function onSiteConfigUpdated(listener: (scope: SiteConfigScope) => void) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ scope?: SiteConfigScope }>).detail
    listener(detail?.scope ?? 'all')
  }
  window.addEventListener(SITE_CONFIG_UPDATED, handler)
  return () => window.removeEventListener(SITE_CONFIG_UPDATED, handler)
}

function scopeMatches(received: SiteConfigScope, wanted: SiteConfigScope) {
  return received === 'all' || wanted === 'all' || received === wanted
}

export function shouldRefreshScope(received: SiteConfigScope, wanted: SiteConfigScope) {
  return scopeMatches(received, wanted)
}
