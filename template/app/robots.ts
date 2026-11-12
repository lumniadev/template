import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl()
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/cart', '/checkout', '/order', '/track', '/account'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
