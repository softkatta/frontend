export type PageSectionBlock = {
  label?: string
  title?: string
  highlight?: string
  description?: string
}

export type PagePerk = {
  title: string
  text: string
}

export type WhyHighlightCard = {
  stat?: string
  title?: string
  description?: string
}

export type WhyCard = {
  icon?: string
  title: string
  description: string
  color?: string
}

export type PublicPageContent = {
  label?: string
  title?: string
  highlight?: string
  description?: string
  cta_title?: string
  cta_description?: string
  cta_text?: string
  trust_items?: string[]
  hero_badges?: string[]
  typewriter_phrases?: string[]
  why_choose_title?: string
  why_choose_items?: string[]
  why_highlight?: WhyHighlightCard
  why_cards?: WhyCard[]
  categories?: string[]
  perks?: PagePerk[]
  sections?: Record<string, PageSectionBlock>
}

export type PublicPageSeoEntry = {
  title?: string
  description?: string
  keywords?: string
}

export type PublicPagesPayload = {
  pages: Record<string, PublicPageContent>
  seo: Record<string, PublicPageSeoEntry>
}
