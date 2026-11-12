'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { trackOrder } from '@/app/(store)/actions'
import { statusLabels } from '@/lib/format'
import type { OrderStatus } from '@/lib/types'
import { ProductImage } from './product-visual'
import { useStore } from './store-provider'

type Found = Extract<Awaited<ReturnType<typeof trackOrder>>, { ok: true }>['order']

const steps: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered']
const stepText: Record<OrderStatus, string> = {
  pending: 'We received your order and will call you shortly to confirm it.',
  no_answer: 'We tried to call you but couldn’t get through. Please call us back so we can confirm your order.',
  confirmed: 'Your order is confirmed and being prepared.',
  shipped: 'Your order is on its way.',
  delivered: 'Your order was delivered. Enjoy!',
  cancelled: 'This order was cancelled.',
}

export function TrackView({ initialNumber }: { initialNumber: string }) {
  const { settings: s, money } = useStore()
  const [number, setNumber] = useState(initialNumber)
  const [contact, setContact] = useState('')
  const [error, setError] = useState('')
  const [order, setOrder] = useState<Found | null>(null)
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    start(async () => {
      const res = await trackOrder(number, contact)
      if (res.ok) setOrder(res.order)
      else {
        setOrder(null)
        setError(res.error)
      }
    })
  }

  const current = order ? (order.status === 'no_answer' ? 0 : steps.indexOf(order.status)) : -1

  return (
    <section className="page-section cart-page">
      <div className="breadcrumbs">Home <span>/</span> Track your order</div>
      <h1>Track your order</h1>
      <div className="cart-layout">
        <form className="checkout-form" onSubmit={submit}>
          <span className="eyebrow full">Find your order</span>
          <label className="full">Order number<input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={`#${s.orders.prefix || 'ORD'}-…`} required /></label>
          <label className="full">Phone or email used at checkout<input value={contact} onChange={(e) => setContact(e.target.value)} required /></label>
          <div className="full"><button className="primary" disabled={pending}>{pending ? 'Looking…' : 'Track order'} <ArrowRight size={16} /></button></div>
          {error && <p className="form-error full" style={{ textAlign: 'left' }}>{error}</p>}
        </form>
        {order && (
          <aside className="summary">
            <span className="eyebrow">Order {order.number}</span>
            <div><span>Status</span><b>{statusLabels[order.status]}</b></div>
            <div><span>Placed</span><b>{new Date(order.createdAt).toLocaleDateString(s.locale)}</b></div>
            <div><span>Total</span><b>{money(order.total)}</b></div>
            <hr />
            {order.status !== 'cancelled' && (
              <ol className="track-steps">
                {steps.map((st, i) => (
                  <li key={st} className={i <= current ? 'done' : ''}><i>{i <= current && <Check size={11} />}</i>{statusLabels[st]}</li>
                ))}
              </ol>
            )}
            <p className="track-note">{stepText[order.status]}</p>
            <div className="order-products">
              {order.items.slice(0, 4).map((i, n) => <ProductImage key={n} src={i.image} alt={i.name} small />)}
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
