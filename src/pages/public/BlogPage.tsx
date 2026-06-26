import { useEffect, useState } from 'react'
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
import type { BlogPost } from '@/types'

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div>
      <section className="hero-cyber pt-24 pb-16 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-60" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeaderBlock
            label="Insights & Updates"
            title="Our"
            highlight="Blog"
            description="Tips, guides, and news from the SoftKatta team."
          />
        </div>
      </section>

      <PageSection tone="default">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground">No blog posts published yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card group flex flex-col overflow-hidden"
              >
                <div className="h-40 bg-brand-gradient/10 relative overflow-hidden">
                  {post.image ? (
                    <img src={resolveMediaUrl(post.image)} alt="" className="h-full w-full object-cover" />
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
            ))}
          </div>
        )}
      </PageSection>
    </div>
  )
}
