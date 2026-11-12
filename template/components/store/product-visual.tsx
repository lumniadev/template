'use client'

import { initials } from '@/lib/format'
import { useStore } from './store-provider'

/** The original bottle illustration. Shown whenever a product has no photo. */
export function ProductVisual({ small = false }: { small?: boolean }) {
  const { settings } = useStore()
  return (
    <div className={`product-visual ${small ? 'small' : ''}`} aria-label={`${settings.name} product illustration`}>
      <div className="bottle-cap" />
      <div className="bottle">
        <span>{initials(settings.name)}</span>
        <i />
      </div>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
    </div>
  )
}

/** A product photo if there is one, otherwise the bottle illustration. */
export function ProductImage({ src, alt, small = false }: { src?: string; alt: string; small?: boolean }) {
  if (src) return <img className="product-photo" src={src} alt={alt} loading="lazy" />
  return <ProductVisual small={small} />
}
