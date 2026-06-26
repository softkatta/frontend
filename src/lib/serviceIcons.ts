const ICON_MAP: Record<string, string> = {
  code: 'Code',
  cloud: 'Cloud',
  consulting: 'Lightbulb',
  headset: 'Shield',
  lightbulb: 'Lightbulb',
  rocket: 'Rocket',
  shield: 'Shield',
  palette: 'Palette',
  barchart: 'BarChart',
}

export function serviceIconKey(icon?: string): string {
  if (!icon) return 'Code'
  const normalized = icon.replace(/[-_\s]/g, '').toLowerCase()
  return ICON_MAP[normalized] ?? (icon.charAt(0).toUpperCase() + icon.slice(1))
}
