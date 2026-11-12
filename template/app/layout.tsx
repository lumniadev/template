import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import { getSettings } from '@/lib/data'
import './globals.css'

// Content comes from the database, so always render fresh.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  return {
    title: { default: `${s.name} — ${s.tagline.replace(/\.$/, '')}`, template: `%s · ${s.name}` },
    description: s.description,
    icons: {
      icon: [
        { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
        { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-icon.png',
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getSettings()
  const colors = { '--teal': s.colors.main, '--ink': s.colors.text } as CSSProperties
  return (
    <html lang={s.locale.split('-')[0] || 'en'}>
      <body className="antialiased" style={colors}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
