'use client'

import { useState } from 'react'
import { ArrowRight, Minus, Plus, ShieldCheck } from 'lucide-react'
import { computeTotals, findPromo } from '@/lib/format'
import { ProductImage } from './product-visual'
import { useStore } from './store-provider'
import { useGo } from './nav'

/** Order summary box used on the cart and checkout pages. */
export function Summary({ action, onAction, disabled, error }: { action: string; onAction: () => void; disabled?: boolean; error?: string }) {
  const { settings, items, money, promoCode } = useStore()
  const promo = findPromo(promoCode, settings)
  const t = computeTotals(items, settings, promo)
  return (
    <aside className="summary">
      <span className="eyebrow">Order summary</span>
      <div><span>Subtotal</span><b>{money(t.subtotal)}</b></div>
      {t.discount > 0 && <div className="discount-row"><span>Discount ({promo!.code})</span><b>−{money(t.discount)}</b></div>}
      <div><span>Shipping</span><b>{t.shipping === 0 ? 'Free' : money(t.shipping)}</b></div>
      <hr />
      <div className="total"><span>Total</span><b>{money(t.total)}</b></div>
      <button className="primary" onClick={onAction} disabled={disabled}>{action} <ArrowRight size={16} /></button>
      {error && <p className="form-error">{error}</p>}
      {settings.cart.secureNote && <small><ShieldCheck size={14} /> {settings.cart.secureNote}</small>}
    </aside>
  )
}

export function CartView() {
  const { settings, items, count, money, setQty, ready, promoCode, setPromoCode } = useStore()
  const go = useGo()
  const [code, setCode] = useState(promoCode)
  const [promoMsg, setPromoMsg] = useState('')

  const applyPromo = () => {
    const p = findPromo(code, settings)
    if (p) {
      setPromoCode(p.code)
      setPromoMsg(`${p.code} applied — ${p.percent}% off`)
    } else {
      setPromoCode('')
      setPromoMsg(code.trim() ? 'That code isn’t valid.' : '')
    }
  }

  return (
    <section className="page-section cart-page">
      <div className="breadcrumbs">Home <span>/</span> Your bag</div>
      <h1>Your bag <span>({count})</span></h1>
      {ready && items.length === 0 ? (
        <div className="empty-bag">
          <p>Your bag is empty.</p>
          <button className="primary" onClick={() => go('/shop')}>Start shopping <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((i) => (
              <div className="cart-item" key={i.key}>
                <div className="cart-thumb" onClick={() => go(`/products/${i.slug}`)}><ProductImage src={i.image} alt={i.name} small /></div>
                <div className="cart-item-copy">
                  <span className="eyebrow">{i.type}</span>
                  <h3>{i.name}</h3>
                  <p>{Object.values(i.options).filter(Boolean).join(' · ') || ' '}</p>
                  <div className="stepper">
                    <button aria-label={i.qty === 1 ? `Remove ${i.name}` : 'Decrease quantity'} onClick={() => setQty(i.key, i.qty - 1)}><Minus size={14} /></button>
                    <span>{i.qty}</span>
                    <button aria-label="Increase quantity" onClick={() => setQty(i.key, Math.min(99, i.qty + 1))}><Plus size={14} /></button>
                  </div>
                </div>
                <strong>{money(i.price * i.qty)}</strong>
              </div>
            ))}
            {settings.promoCodes.length > 0 && (
              <div className="promo">
                <span>Have a promo code?</span>
                <div>
                  <input placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyPromo()} />
                  <button onClick={applyPromo}>Apply</button>
                </div>
              </div>
            )}
            {promoMsg && <p className="promo-msg">{promoMsg}</p>}
          </div>
          <Summary action="Continue to checkout" onAction={() => go('/checkout')} disabled={items.length === 0} />
        </div>
      )}
    </section>
  )
}
