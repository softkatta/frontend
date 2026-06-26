/** Hero monitor screen — must match `.monitor-hero__screen` in index.css */
export const HERO_MONITOR_ASPECT = 16 / 10
export const HERO_MONITOR_EXPORT_WIDTH = 1600
export const HERO_MONITOR_EXPORT_HEIGHT = 1000
export const HERO_MONITOR_LABEL = '16:10 (1600 × 1000)'

export type HeroCropTransform = {
  zoom: number
  offsetX: number
  offsetY: number
}

export function getCoverScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  return Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight)
}

export async function cropImageToHeroMonitor(
  image: HTMLImageElement,
  viewportWidth: number,
  viewportHeight: number,
  transform: HeroCropTransform,
): Promise<Blob> {
  const scale = getCoverScale(image.naturalWidth, image.naturalHeight, viewportWidth, viewportHeight) * transform.zoom
  const imgW = image.naturalWidth * scale
  const imgH = image.naturalHeight * scale
  const imgX = viewportWidth / 2 - imgW / 2 + transform.offsetX
  const imgY = viewportHeight / 2 - imgH / 2 + transform.offsetY

  const srcX = Math.max(0, -imgX / scale)
  const srcY = Math.max(0, -imgY / scale)
  const srcW = Math.min(image.naturalWidth - srcX, viewportWidth / scale)
  const srcH = Math.min(image.naturalHeight - srcY, viewportHeight / scale)

  const canvas = document.createElement('canvas')
  canvas.width = HERO_MONITOR_EXPORT_WIDTH
  canvas.height = HERO_MONITOR_EXPORT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas')

  ctx.drawImage(
    image,
    srcX,
    srcY,
    srcW,
    srcH,
    0,
    0,
    HERO_MONITOR_EXPORT_WIDTH,
    HERO_MONITOR_EXPORT_HEIGHT,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
      'image/jpeg',
      0.92,
    )
  })
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type || 'image/jpeg' })
}
