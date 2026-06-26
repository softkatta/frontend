import { useCallback, useEffect, useRef, useState } from 'react'
import { Monitor, ZoomIn, ZoomOut } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  HERO_MONITOR_ASPECT,
  HERO_MONITOR_LABEL,
  cropImageToHeroMonitor,
  getCoverScale,
  type HeroCropTransform,
} from '@/lib/heroMonitor'
import { cn } from '@/lib/utils'

type HeroSlideCropDialogProps = {
  open: boolean
  imageSrc: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => void | Promise<void>
  confirming?: boolean
}

export function HeroSlideCropDialog({
  open,
  imageSrc,
  fileName,
  onOpenChange,
  onConfirm,
  confirming,
}: HeroSlideCropDialogProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [viewport, setViewport] = useState({ w: 480, h: 300 })

  useEffect(() => {
    if (!open) {
      setLoaded(false)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
  }, [open, imageSrc])

  useEffect(() => {
    if (!open || !viewportRef.current) return
    const el = viewportRef.current
    const update = () => {
      const w = el.clientWidth
      setViewport({ w, h: w / HERO_MONITOR_ASPECT })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, loaded])

  const handleImageLoad = useCallback(() => {
    setLoaded(true)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const img = imageRef.current
  const displayScale =
    img && loaded
      ? getCoverScale(img.naturalWidth, img.naturalHeight, viewport.w, viewport.h) * zoom
      : 1
  const displayW = img ? img.naturalWidth * displayScale : 0
  const displayH = img ? img.naturalHeight * displayScale : 0

  const onPointerDown = (e: React.PointerEvent) => {
    if (!loaded) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    })
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const handleConfirm = async () => {
    if (!imageRef.current || !loaded) return
    const transform: HeroCropTransform = { zoom, offsetX: offset.x, offsetY: offset.y }
    const blob = await cropImageToHeroMonitor(imageRef.current, viewport.w, viewport.h, transform)
    const base = fileName.replace(/\.[^.]+$/, '') || 'hero-slide'
    const file = new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
    await onConfirm(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-2xl overflow-y-auto border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-[var(--brand-blue)]" />
            Crop for hero monitor
          </DialogTitle>
          <DialogDescription>
            Drag to reposition and zoom so the screenshot fits the monitor ({HERO_MONITOR_LABEL}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={viewportRef}
            className={cn(
              'relative mx-auto w-full max-w-[560px] overflow-hidden rounded-lg border-2 border-[var(--brand-blue)]/30 bg-[#0a0f1a] shadow-inner',
              !loaded && 'min-h-[200px]',
            )}
            style={{ aspectRatio: `${16} / ${10}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {!loaded && imageSrc && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                Loading image…
              </div>
            )}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className={cn(
                  'absolute left-1/2 top-1/2 max-w-none select-none',
                  loaded ? 'cursor-grab active:cursor-grabbing' : 'opacity-0',
                )}
                style={{
                  width: displayW,
                  height: displayH,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
                draggable={false}
                onLoad={handleImageLoad}
              />
            )}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
            <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[10px] font-medium text-white/90">
              16:10 monitor
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--input)]/40 px-4 py-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-[var(--brand-teal)]"
              disabled={!loaded}
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            <span className="w-12 shrink-0 text-right text-xs text-[var(--muted-foreground)]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <p className="text-center text-xs text-[var(--muted-foreground)]">
            Tip: drag the image to center the dashboard area — same crop as the homepage monitor.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={!loaded || confirming}>
            {confirming ? 'Uploading…' : 'Crop & upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
