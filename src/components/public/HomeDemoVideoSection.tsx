import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { isEmbeddableVideo, resolveDemoVideoUrl } from '@/lib/videoUrl'
import type { HomeDemoVideo } from '@/types/homeSections'

type ProductDemo = {
  name: string
  slug: string
  videoUrl: string
}

type HomeDemoVideoSectionProps = {
  config: HomeDemoVideo
  productDemo?: ProductDemo
}

function LazyVideoEmbed({ videoUrl, embed, title }: { videoUrl: string; embed: boolean; title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="home-demo-section__frame">
      {!visible ? (
        <div className="home-demo-section__placeholder home-demo-section__placeholder--loading">
          <span className="home-demo-section__play-btn">
            <Play className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold">Loading demo…</span>
        </div>
      ) : embed ? (
        <iframe
          src={videoUrl}
          title={title}
          className="home-demo-section__iframe"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={videoUrl} controls className="home-demo-section__video" preload="metadata" />
      )}
    </div>
  )
}

export function HomeDemoVideoSection({ config, productDemo }: HomeDemoVideoSectionProps) {
  const videoUrl = resolveDemoVideoUrl(productDemo?.videoUrl || config.video_url)
  const embed = videoUrl ? isEmbeddableVideo(videoUrl) : false
  const ctaHref = productDemo ? `/products/${productDemo.slug}` : (config.cta_href || '/products')
  const ctaLabel = productDemo ? `View ${productDemo.name}` : (config.cta_label || 'Browse products')
  const browserLabel = productDemo ? `${productDemo.name} — Demo` : 'SoftKatta Solutions — Product demo'
  const videoTitle = productDemo ? `${productDemo.name} demo` : 'SoftKatta Solutions product demo'

  return (
    <section className="home-demo-section relative overflow-hidden py-16 sm:py-20">
      <div className="home-demo-section__bg" aria-hidden />
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="home-demo-section__stack">
          <div className="home-demo-section__copy text-center mx-auto max-w-3xl">
            <span className="section-label mb-4 inline-block">{config.label}</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {config.title}{' '}
              <span className="text-gradient-brand">{config.highlight}</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
              {productDemo
                ? `Watch the latest demo for ${productDemo.name} — GST-ready cloud software built for Indian businesses.`
                : config.description}
            </p>
            <Link
              to={ctaHref}
              className="hero-cta-primary inline-flex items-center gap-2 px-6 py-3 text-sm rounded-full"
            >
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="home-demo-section__player">
            <div className="home-demo-section__browser home-demo-section__browser--large">
              <div className="home-demo-section__browser-bar">
                <span className="home-demo-section__dot home-demo-section__dot--red" />
                <span className="home-demo-section__dot home-demo-section__dot--amber" />
                <span className="home-demo-section__dot home-demo-section__dot--green" />
                <span className="home-demo-section__browser-label">
                  <Play className="h-3 w-3" /> {browserLabel}
                </span>
              </div>
              {videoUrl ? (
                <LazyVideoEmbed videoUrl={videoUrl} embed={embed} title={videoTitle} />
              ) : (
                <div className="home-demo-section__frame">
                  <Link to="/products" className="home-demo-section__placeholder">
                    <span className="home-demo-section__play-btn">
                      <Play className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-semibold">Explore product demos</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
