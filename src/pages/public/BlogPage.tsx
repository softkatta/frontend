import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'
import { PageSection, SectionHeaderBlock } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { blogsApi } from '@/services/api'
import { getApiErrorMessage, unwrapList } from '@/lib/apiHelpers'
import { mapPublicBlog } from '@/lib/apiMappers'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { usePublicPageContent } from '@/hooks/usePublicPageContent'
import type { BlogPost } from '@/types'

export default function BlogPage() {
  const { page } = usePublicPageContent('blog')
  const categories = page.categories ?? []
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  useEffect(() => {
    void (async () => {
      try {
        const data = unwrapList(await blogsApi.list()).map(mapPublicBlog)
        setPosts(data)
      } catch (err) {
        toast({ title: 'Failed to load blog posts', description: getApiErrorMessage(err), variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const displayPosts = useMemo(
    () => posts.filter((post) => activeCategory === 'All' || post.category === activeCategory),
    [posts, activeCategory],
  )

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
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {['All', ...categories].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`blog-page__category-pill ${activeCategory === category ? 'blog-page__category-pill--active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <h2 className="font-display text-xl sm:text-2xl font-bold mb-6">Latest Articles</h2>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : displayPosts.length === 0 ? (
          <p className="text-center text-muted-foreground">No articles in this category yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPosts.map((post, i) => {
              const imageSrc = post.image ? resolveMediaUrl(post.image) : undefined
              return (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="premium-card group flex flex-col overflow-hidden"
                >
                  <div className="h-40 bg-brand-gradient/10 relative overflow-hidden">
                    {imageSrc ? (
                      <img src={imageSrc} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(41,98,255,0.2),transparent_55%)]" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <span className="inline-flex w-fit mb-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-blue)] bg-primary/10 border border-primary/20">
                      {post.category}
                    </span>
                    <h3 className="font-display font-bold text-lg mb-2 group-hover:text-[var(--brand-blue)] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.read_time} min read
                      </span>
                      <span>{formatDate(post.published_at)}</span>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-sm font-semibold text-[var(--brand-blue)] flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Read more <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}

        <div className="premium-card p-8 sm:p-10 rounded-3xl text-center max-w-3xl mx-auto mt-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">{page.cta_title}</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">{page.cta_description}</p>
          <Link to="/contact" className="glow-btn inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold">
            Contact Us Today <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageSection>
    </div>
  )
}
