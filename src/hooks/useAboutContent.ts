import { useCallback, useEffect, useState } from 'react'
import { siteContentApi } from '@/services/api'
import { onSiteConfigUpdated, shouldRefreshScope } from '@/lib/siteConfigEvents'

export type AboutValue = {
  title: string
  description: string
}

export type AboutMilestone = {
  year: string
  title: string
  description: string
}

export type AboutPageContent = {
  highlightTitle: string
  highlightText: string
  storyText: string
  values: AboutValue[]
  milestones: AboutMilestone[]
  loading: boolean
}

const EMPTY_ABOUT: AboutPageContent = {
  highlightTitle: '',
  highlightText: '',
  storyText: '',
  values: [],
  milestones: [],
  loading: true,
}

function parseValues(raw: unknown): AboutValue[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title = String(record.title ?? '').trim()
      const description = String(record.description ?? '').trim()
      if (!title && !description) return null
      return { title, description }
    })
    .filter((item): item is AboutValue => item !== null)
}

function parseMilestones(raw: unknown): AboutMilestone[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const year = String(record.year ?? '').trim()
      const title = String(record.title ?? '').trim()
      const description = String(record.description ?? '').trim()
      if (!year && !title && !description) return null
      return { year, title, description }
    })
    .filter((item): item is AboutMilestone => item !== null)
}

function parseAbout(payload: unknown): Omit<AboutPageContent, 'loading'> {
  if (!payload || typeof payload !== 'object') {
    return {
      highlightTitle: '',
      highlightText: '',
      storyText: '',
      values: [],
      milestones: [],
    }
  }
  const data = payload as Record<string, unknown>
  return {
    highlightTitle: String(data.highlight_title ?? ''),
    highlightText: String(data.highlight_text ?? ''),
    storyText: String(data.story_text ?? ''),
    values: parseValues(data.values),
    milestones: parseMilestones(data.milestones),
  }
}

export function useAboutContent() {
  const [content, setContent] = useState<AboutPageContent>(EMPTY_ABOUT)

  const load = useCallback(async () => {
    try {
      const data = await siteContentApi.about()
      const parsed = parseAbout(data)
      setContent({ ...parsed, loading: false })
    } catch {
      setContent((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return onSiteConfigUpdated((scope) => {
      if (shouldRefreshScope(scope, 'content')) {
        void load()
      }
    })
  }, [load])

  return content
}
