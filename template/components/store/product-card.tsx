'use client'

import { Heart, Plus } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductImage } from './product-visual'
import { useStore } from './store-provider'
import { useGo } from './nav'

export function ProductCard({ product }: { product: Product }) {
  const { money, saved, toggleSaved } = useStore()
  const go = useGo()
  const open = () => go(`/products/${product.slug}`)
  const isSaved = saved.includes(product.id)

  return (
    <article className="product-card">
      <div className="card-image" onClick={open}>
        {product.badge && <span className="badge">{product.badge}</span>}
        <button
          className={`heart ${isSaved ? 'saved' : ''}`}
          aria-label={`Save ${product.name}`}
          aria-pressed={isSaved}
          onClick={(e) => { e.stopPropagation(); toggleSaved(product.id) }}
        >
          <Heart size={17} />
        </button>
        <ProductImage src={product.images[0]} alt={product.name} small />
      </div>
      <div className="card-meta">
        <div>
          <p className="eyebrow">{product.type}</p>
          <h3>{product.name}</h3>
          {product.rating > 0 && (
            <div className="rating"><span>★★★★★</span> <small>{product.rating.toFixed(1)}</small></div>
          )}
        </div>
        <strong>{money(product.price)}</strong>
      </div>
      <button className="quick-add" onClick={open}>Quick add <Plus size={15} /></button>
    </article>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
