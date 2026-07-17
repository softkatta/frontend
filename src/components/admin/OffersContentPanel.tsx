import { useEffect, useState } from 'react'
import { Megaphone, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { adminApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { toast } from '@/components/ui/toaster'
import { clearSiteOffersCache } from '@/hooks/useSiteOffers'
import { notifySiteConfigUpdated } from '@/lib/siteConfigEvents'
import { OfferGradientPicker } from '@/components/admin/OfferGradientPicker'
import { serializeOfferGradient, DEFAULT_OFFER_GRADIENT } from '@/lib/offerGradients'
import type { SiteOffer } from '@/types/offers'

function newOffer(): SiteOffer {
  return {
    id: String(Date.now()),
    text: '',
    cta_label: 'Shop now',
    cta_href: '/products',
    gradient: serializeOfferGradient(DEFAULT_OFFER_GRADIENT),
    active: true,
    priority: 1,
  }
}

export function OffersContentPanel() {
  const [offers, setOffers] = useState<SiteOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void adminApi.settings.list({ group: 'content' }).then((res) => {
      const settings = unwrapList<{ key: string; value: string }>(res)
      const raw = settings.find((s) => s.key === 'site_offers')?.value ?? '[]'
      try {
        const parsed = JSON.parse(raw)
        setOffers(Array.isArray(parsed) ? parsed : [])
      } catch {
        setOffers([])
      }
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.settings.bulkUpdate({
        settings: [{
          key: 'site_offers',
          value: JSON.stringify(offers),
          group: 'content',
        }],
      })
      clearSiteOffersCache()
      notifySiteConfigUpdated('content')
      toast({ title: 'Offers saved', description: 'Top banner updated on the website.', variant: 'success' })
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const update = (index: number, patch: Partial<SiteOffer>) => {
    setOffers((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground p-6">Loading offers…</p>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[var(--brand-blue)]" /> Site offers banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Rotating promo bar at the top of every public page. Mention coupon codes here.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOffers((o) => [...o, newOffer()])}>
          <Plus className="h-4 w-4 mr-1" /> Add offer
        </Button>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-muted-foreground">
          No offers yet. Add one to show the banner on Home, Products, Pricing, etc.
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer, index) => (
            <div key={offer.id ?? index} className="rounded-xl border border-[var(--border)] p-4 space-y-3 bg-[var(--card)]/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1">
                  <GripVertical className="h-3.5 w-3.5" /> Offer {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`offer-active-${index}`} className="text-xs">Active</Label>
                    <Switch
                      id={`offer-active-${index}`}
                      checked={offer.active !== false}
                      onCheckedChange={(checked) => update(index, { active: checked })}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOffers((o) => o.filter((_, i) => i !== index))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Input
                  value={offer.text}
                  onChange={(e) => update(index, { text: e.target.value })}
                  placeholder="🎉 Use SAVE20 for 20% off!"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Button label</Label>
                  <Input value={offer.cta_label ?? ''} onChange={(e) => update(index, { cta_label: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Button link</Label>
                  <Input value={offer.cta_href ?? ''} onChange={(e) => update(index, { cta_href: e.target.value })} placeholder="/products" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Priority (lower = first)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={offer.priority ?? 1}
                    onChange={(e) => update(index, { priority: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <OfferGradientPicker
                value={offer.gradient}
                onChange={(gradient) => update(index, { gradient })}
              />
            </div>
          ))}
        </div>
      )}

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save offers'}
      </Button>
    </div>
  )
}
