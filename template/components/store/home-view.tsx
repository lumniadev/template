'use client'

import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductVisual } from './product-visual'
import { ProductGrid } from './product-card'
import { Newsletter } from './newsletter'
import { useStore } from './store-provider'
import { useGo } from './nav'

const trustIcons = [Truck, RotateCcw, ShieldCheck]
const cardStyles = ['aqua', 'cloud', 'deep']

function Lines({ text }: { text: string }) {
  const parts = text.split('\n')
  return <>{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br />}</span>)}</>
}

export function HomeView({ products }: { products: Product[] }) {
  const { settings: s } = useStore()
  const go = useGo()
  const featured = products.filter((p) => p.featured)
  const best = (featured.length ? featured : products).slice(0, 4)

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow pill">{s.hero.eyebrow}</span>
          <h1>{s.hero.titleLine1}<br /><em>{s.hero.titleLine2}</em></h1>
          <p>{s.hero.text}</p>
          <button className="primary" onClick={() => go('/shop')}>{s.hero.button} <ArrowRight size={17} /></button>
          {s.hero.note && <div className="hero-note"><span className="avatar-stack"><i /><i /><i /></span><span>{s.hero.note}</span></div>}
        </div>
        <div className="hero-art">
          <div className="art-glow" />
          {s.hero.image ? <img className="hero-photo" src={s.hero.image} alt="" /> : <ProductVisual />}
        </div>
      </section>

      {s.trust.length > 0 && (
        <section className="trust-strip">
          {s.trust.slice(0, 3).map((t, i) => {
            const Icon = trustIcons[i] ?? ShieldCheck
            return <div key={i}><Icon size={19} /><span><strong>{t.title}</strong> {t.text}</span></div>
          })}
        </section>
      )}

      {s.categoryCards.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div><span className="eyebrow">{s.categoriesSection.eyebrow}</span><h2>{s.categoriesSection.title}</h2></div>
            <button className="text-button" onClick={() => go('/shop')}>View all <ArrowRight size={16} /></button>
          </div>
          <div className="category-grid">
            {s.categoryCards.slice(0, 3).map((c, i) => (
              <button
                key={i}
                className={`category-card ${cardStyles[i]}`}
                onClick={() => go(c.category ? `/shop?category=${encodeURIComponent(c.category)}` : '/shop')}
              >
                <span>{c.label}</span>
                <h3><Lines text={c.title} /></h3>
                <ArrowRight size={20} />
              </button>
            ))}
          </div>
        </section>
      )}

      {best.length > 0 && (
        <section className="section best-sellers">
          <div className="section-heading">
            <div><span className="eyebrow">{s.bestSellers.eyebrow}</span><h2>{s.bestSellers.title}</h2></div>
            <button className="text-button" onClick={() => go('/shop')}>Shop all <ArrowRight size={16} /></button>
          </div>
          <ProductGrid products={best} />
        </section>
      )}

      <Newsletter />
    </>
  )
}
