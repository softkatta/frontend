import { motion } from 'framer-motion'

type Sparkle = {
  id: number
  left: string
  top: string
  size: number
  delay: number
  duration: number
  color: string
}

const SPARKLES: Sparkle[] = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left: `${((i * 37 + 13) % 97) + 1}%`,
  top: `${((i * 53 + 19) % 94) + 3}%`,
  size: i % 4 === 0 ? 4 : i % 3 === 0 ? 2 : 3,
  delay: (i % 6) * 0.35,
  duration: 2.2 + (i % 5) * 0.6,
  color: i % 3 === 0 ? '#2dd4bf' : i % 3 === 1 ? '#a5b4fc' : '#ffffff',
}))

export function SparkleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SPARKLES.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: sparkle.color,
            boxShadow: `0 0 ${sparkle.size * 3}px ${sparkle.color}`,
          }}
          animate={{
            opacity: [0.15, 0.95, 0.2],
            scale: [0.8, 1.35, 0.85],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {SPARKLES.filter((_, i) => i % 7 === 0).map((sparkle) => (
        <motion.span
          key={`star-${sparkle.id}`}
          className="absolute text-[#7ee8d8]"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            fontSize: sparkle.size + 6,
            lineHeight: 1,
          }}
          animate={{
            opacity: [0.1, 0.7, 0.15],
            rotate: [0, 180, 360],
            scale: [0.7, 1.1, 0.75],
          }}
          transition={{
            duration: sparkle.duration + 1.5,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  )
}
