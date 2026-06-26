import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function SmoothScroll() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth'

    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({ behavior, block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior })
  }, [pathname, hash])

  return null
}
