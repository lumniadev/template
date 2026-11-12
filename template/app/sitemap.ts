import type { MetadataRoute } from 'next'
import { getProducts, getSettings } from '@/lib/data'
import { siteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, products, settings] = await Promise.all([siteUrl(), getProducts(), getSettings()])
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...settings.pages.map((p) => ({ url: `${base}/pages/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ]
}
