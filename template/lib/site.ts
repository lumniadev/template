import { headers } from 'next/headers'

/** The store's public address, e.g. https://mystore.com — used in emails, the sitemap and the sheet. */
export async function siteUrl() {
  const env = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
  if (env) return (env.startsWith('http') ? env : `https://${env}`).replace(/\/$/, '')
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host')
    if (host) return `${h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')}://${host}`
  } catch {}
  return 'http://localhost:3000'
}
