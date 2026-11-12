'use client'

import { useRouter } from 'next/navigation'
import { isExternal } from '@/lib/format'

/** Returns a function that opens internal links in the app and external links in a new tab. */
export function useGo() {
  const router = useRouter()
  return (href: string) => {
    if (!href) return
    if (/^(mailto:|tel:)/i.test(href)) window.location.href = href
    else if (isExternal(href)) window.open(href, '_blank', 'noopener,noreferrer')
    else router.push(href)
  }
}
