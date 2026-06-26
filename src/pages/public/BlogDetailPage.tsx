import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, ArrowLeft } from 'lucide-react'
import { PageSection } from '@/components/common/SectionLabel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { blogsApi } from '@/services/api'
import { mapPublicBlog } from '@/lib/apiMappers'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types'

export default function BlogDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    void (async () => {
      setLoading(true)
      try {
        const data = mapPublicBlog(await blogsApi.get(slug))
        setPost(data)
        setNotFound(false)
      } catch {
        setNotFound(true)
        setPost(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) {
    return (
      <PageSection tone="default" className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </PageSection>
    )
  }

  if (notFound || !post) {
    return (
      <PageSection tone="default" className="min-h-[50vh] flex items-center">
        <div className="text-center w-full">
          <h1 className="font-display text-2xl font-bold mb-4">Post not found</h1>
          <Link to="/blog" className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </div>
      </PageSection>
    )
  }

  return (
    <div>
      <section className="hero-cyber pt-24 pb-12 relative overflow-hidden">
        <div className="hero-horizon-glow opacity-50" aria-hidden />
        <article className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--brand-blue)] mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <span className="section-label mb-4">{post.category}</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span>By {post.author}</span>
            <span>{formatDate(post.published_at)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.read_time} min read
            </span>
          </div>
        </article>
      </section>

      <PageSection tone="default" className="!pt-0">
        <div className="max-w-3xl mx-auto">
          <div className="h-64 rounded-2xl bg-brand-gradient/10 border border-[var(--border)] mb-8 overflow-hidden">
            {post.image ? (
              <img src={resolveMediaUrl(post.image)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(41,98,255,0.25),transparent_55%)]" />
            )}
          </div>

          <div className="premium-card p-6 sm:p-10 prose prose-slate dark:prose-invert max-w-none">
            {post.excerpt && <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>}
            <div className="leading-relaxed whitespace-pre-wrap">{post.content}</div>
          </div>
        </div>
      </PageSection>
    </div>
  )
}
