import { motion } from 'framer-motion'
import type { HomeTechnology } from '@/types/homeSections'

type HomeTechnologySectionProps = {
  items: HomeTechnology[]
}

export function HomeTechnologySection({ items }: HomeTechnologySectionProps) {
  if (items.length === 0) return null

  return (
    <section className="home-tech-section relative overflow-hidden py-16 sm:py-20">
      <div className="home-tech-section__bg" aria-hidden />
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
        >
          <span className="section-label mb-4 inline-block">Technology Stack</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Built with{' '}
            <span className="text-gradient-brand">modern tools</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Secure, scalable, and maintainable — the same stack powering our SaaS products and client projects.
          </p>
        </motion.div>

        <div className="home-tech-section__grid">
          {items.map((tech, i) => (
            <motion.article
              key={tech.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ delay: i * 0.05 }}
              className="home-tech-section__card"
            >
              <div
                className="home-tech-section__badge"
                style={{
                  color: tech.color,
                  background: `${tech.color}18`,
                  borderColor: `${tech.color}30`,
                }}
              >
                {tech.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-display font-bold text-base mb-1.5">{tech.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tech.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
