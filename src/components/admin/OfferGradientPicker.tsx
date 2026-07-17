import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  OFFER_GRADIENT_PRESETS,
  offerGradientToCss,
  parseOfferGradient,
  serializeOfferGradient,
  type OfferGradientColors,
} from '@/lib/offerGradients'

type OfferGradientPickerProps = {
  value?: string
  onChange: (value: string) => void
}

const COLOR_FIELDS: { key: keyof OfferGradientColors; label: string }[] = [
  { key: 'from', label: 'Start' },
  { key: 'via', label: 'Middle' },
  { key: 'to', label: 'End' },
]

export function OfferGradientPicker({ value, onChange }: OfferGradientPickerProps) {
  const colors = parseOfferGradient(value)

  const updateColors = (patch: Partial<OfferGradientColors>) => {
    onChange(serializeOfferGradient({ ...colors, ...patch }))
  }

  const activePreset = OFFER_GRADIENT_PRESETS.find(
    (preset) => serializeOfferGradient(preset.colors) === serializeOfferGradient(colors),
  )?.id

  return (
    <div className="space-y-3">
      <Label>Banner gradient</Label>

      <div
        className="h-10 rounded-lg border border-[var(--border)] shadow-inner"
        style={{ background: offerGradientToCss(colors) }}
        aria-hidden
      />

      <div className="flex flex-wrap gap-2">
        {OFFER_GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.label}
            onClick={() => onChange(serializeOfferGradient(preset.colors))}
            className={cn(
              'h-8 w-8 rounded-full border-2 transition-transform hover:scale-105',
              activePreset === preset.id ? 'border-white ring-2 ring-[var(--brand-blue)]' : 'border-transparent',
            )}
            style={{ background: offerGradientToCss(preset.colors) }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2 py-1.5 bg-[var(--card)]">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => updateColors({ [key]: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label={`${label} color`}
              />
              <span className="text-xs font-mono text-muted-foreground uppercase">{colors[key]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
