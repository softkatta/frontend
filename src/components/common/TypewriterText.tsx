import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypewriterTextProps {
  phrases: string[]
  className?: string
  typingSpeed?: number
  pauseMs?: number
}

export function TypewriterText({
  phrases,
  className,
  typingSpeed = 70,
  pauseMs = 2200,
}: TypewriterTextProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const current = phrases[phraseIndex] ?? ''

  useEffect(() => {
    if (phrases.length === 0) return

    const isComplete = !deleting && charIndex === current.length
    const isEmpty = deleting && charIndex === 0

    if (isComplete) {
      const id = setTimeout(() => setDeleting(true), pauseMs)
      return () => clearTimeout(id)
    }

    if (isEmpty) {
      setDeleting(false)
      setPhraseIndex((i) => (i + 1) % phrases.length)
      return
    }

    const delay = deleting ? typingSpeed / 2 : typingSpeed
    const id = setTimeout(() => {
      setCharIndex((c) => c + (deleting ? -1 : 1))
    }, delay)
    return () => clearTimeout(id)
  }, [charIndex, current.length, deleting, pauseMs, phrases.length, typingSpeed])

  return (
    <span className={cn('typewriter-text text-brand-gradient', className)}>
      {current.slice(0, charIndex)}
      <span className="typewriter-cursor" aria-hidden>|</span>
    </span>
  )
}
