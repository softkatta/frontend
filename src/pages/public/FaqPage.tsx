import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { useSiteContent } from '@/hooks/useSiteContent'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import { cn } from '@/lib/utils'

export default function FaqPage() {
  const { page } = usePublicPageContent('faq')
  const { faqs } = useSiteContent('below-fold')
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  return (
    <div>
      <section className="hero-cyber pt-24 pb-16 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-60" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label={page.label ?? ''}
            title={page.title ?? ''}
            highlight={page.highlight}
            description={page.description}
          />
        </div>
      </section>

      <PageSection tone="default" className="!pt-8">
        {faqs.length === 0 ? (
          <p className="text-center text-muted-foreground">No FAQs available yet.</p>
        ) : (
          <div className="faq-accordion-v2 faq-accordion-v2--stack max-w-3xl mx-auto">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === faq.id
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className={cn('faq-accordion-v2__item', isOpen && 'faq-accordion-v2__item--open')}
                >
                  <button
                    type="button"
                    className="faq-accordion-v2__trigger"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="faq-accordion-v2__index-wrap">
                      <span className="faq-accordion-v2__index">{String(i + 1).padStart(2, '0')}</span>
                    </span>
                    <span className="faq-accordion-v2__question">{faq.question}</span>
                    <span className={cn('faq-accordion-v2__chevron-wrap', isOpen && 'faq-accordion-v2__chevron-wrap--open')}>
                      <ChevronDown className="faq-accordion-v2__chevron h-4 w-4" />
                    </span>
                  </button>
                  <div className={cn('faq-accordion-v2__panel', isOpen && 'faq-accordion-v2__panel--open')}>
                    <div className="faq-accordion-v2__panel-inner">
                      <p className="faq-accordion-v2__answer">{faq.answer}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Link to="/contact" className="glow-btn inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold">
            Contact us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>
    </div>
  )
}
