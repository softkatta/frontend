import { BarChart3, Shield, Users, Zap, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  shield: Shield,
  barchart: BarChart3,
  barchart3: BarChart3,
  users: Users,
}

export function whyCardIcon(key?: string): LucideIcon {
  if (!key) return Zap
  const normalized = key.replace(/[-_\s]/g, '').toLowerCase()
  return ICONS[normalized] ?? Zap
}
