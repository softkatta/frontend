import { adminApi } from '@/services/api'
import type { ProductFormValues } from '@/components/admin/ProductFormDialog'
import { normalizeDemoVideoForSave } from '@/lib/videoUrl'

function productPayload(values: ProductFormValues) {
  return {
    name: values.name,
    slug: values.slug || undefined,
    description: values.description || undefined,
    overview: values.description || undefined,
    category_id: values.category_id ? Number(values.category_id) : null,
    is_active: values.is_active,
    has_free_trial: values.has_free_trial,
    trial_days: values.trial_days,
    screenshot: values.screenshot || '',
    demo_video_url: normalizeDemoVideoForSave(values.demo_video_url),
    features: values.features
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title, index) => ({ title, sort_order: index })),
  }
}

export async function saveProduct(
  values: ProductFormValues,
  editingId?: string | null,
) {
  const payload = productPayload(values)

  if (editingId) {
    return adminApi.products.update(editingId, payload)
  }

  return adminApi.products.create(payload)
}
