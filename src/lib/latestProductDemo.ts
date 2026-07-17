import type { Product } from '@/types'

export function getLatestProductWithDemo(products: Product[]): Product | undefined {
  return products
    .filter((product) => product.is_active && product.demo_video_url)
    .sort((a, b) => Date.parse(b.created_at || '0') - Date.parse(a.created_at || '0'))[0]
}
