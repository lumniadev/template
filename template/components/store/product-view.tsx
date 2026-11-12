'use client'

import { useState } from 'react'
import { Check, ChevronDown, Minus, Plus, ShoppingBag } from 'lucide-react'
import { available } from '@/lib/format'
import type { Product } from '@/lib/types'
import { ProductImage, ProductVisual } from './product-visual'
import { ProductGrid } from './product-card'
import { useStore } from './store-provider'
import { useGo } from './nav'

export function ProductView({ product: p, related }: { product: Product; related: Product[] }) {
  const { settings: s, money, add } = useStore()
  const go = useGo()
  const left = available(p)
  const [image, setImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [choice, setChoice] = useState<Record<string, string>>(() =>
    Object.fromEntries(p.options.map((o) => [o.name, o.values[0] ?? ''])),
  )

  const [added, setAdded] = useState('')

  // Adds to the bag and stays on the page — the customer decides where to go next.
  const addToBag = () => {
    add({ productId: p.id, slug: p.slug, name: p.name, type: p.type, image: p.images[0] ?? '', price: p.price, options: choice }, qty)
    const opts = Object.values(choice).filter(Boolean).join(', ')
    setAdded(`${qty} × ${p.name}${opts ? ` (${opts})` : ''} added to your bag`)
    setQty(1)
  }

  // Without photos, show three illustration thumbs like the original design.
  const thumbs = p.images.length > 0 ? p.images : ['', '', '']

  return (
    <section className="page-section product-page">
      <div className="breadcrumbs">Home <span>/</span> Shop <span>/</span> {p.name}</div>
      <div className="product-detail">
        <div className="gallery">
          <div className="gallery-main"><ProductImage src={p.images[image]} alt={p.name} /></div>
          {thumbs.length > 1 && (
            <div className="thumbs">
              {thumbs.map((src, i) => (
                <button key={i} className={i === image ? 'selected' : ''} onClick={() => setImage(i)} aria-label={`Show image ${i + 1}`}>
                  {src ? <img className="product-photo" src={src} alt="" /> : <ProductVisual small />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <span className="eyebrow">{p.type}</span>
          <h1>{p.name}</h1>
          {p.rating > 0 && (
            <div className="detail-rating"><span>★★★★★</span> {p.rating.toFixed(1)} {p.reviewCount > 0 && <u>{p.reviewCount} reviews</u>}</div>
          )}
          <p className="detail-price">{money(p.price)} {p.compareAtPrice && p.compareAtPrice > p.price && <del>{money(p.compareAtPrice)}</del>}</p>
          {p.description && <p className="detail-copy">{p.description}</p>}
          <div className="stock">
            {left > 0 ? <><i /> {s.productPage.stockText}{left <= 5 && <> · <b>Only {left} left</b></>}</> : <><i className="out" /> Sold out</>}
          </div>
          {p.options.filter((o) => o.values.length > 0).map((o) => (
            <div className="option" key={o.name}>
              <span>{o.name} <b>{choice[o.name]}</b></span>
              <div className="size-select">
                {o.values.map((v) => (
                  <button key={v} className={choice[o.name] === v ? 'selected' : ''} onClick={() => setChoice((c) => ({ ...c, [o.name]: v }))}>{v}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="buy-row">
            <div className="stepper">
              <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={15} /></button>
              <span>{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(99, left, q + 1))}><Plus size={15} /></button>
            </div>
            <button className="primary add" onClick={addToBag} disabled={left === 0}>Add to bag <ShoppingBag size={17} /></button>
          </div>
          {added && (
            <div className="added-note" role="status">
              <span><Check size={14} /> {added}</span>
              <button className="text-button" onClick={() => go('/cart')}>View bag</button>
            </div>
          )}
          <div className="accordions">
            {p.details.map((d, i) => (
              <details key={i} open={i === 0}><summary>{d.title} <ChevronDown size={16} /></summary><p>{d.body}</p></details>
            ))}
            {s.productPage.shippingText && (
              <details open={p.details.length === 0}><summary>{s.productPage.shippingTitle} <ChevronDown size={16} /></summary><p>{s.productPage.shippingText}</p></details>
            )}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="also">
          <div className="section-heading"><div><span className="eyebrow">{s.productPage.alsoEyebrow}</span><h2>{s.productPage.alsoTitle}</h2></div></div>
          <ProductGrid products={related} />
        </div>
      )}
    </section>
  )
}
