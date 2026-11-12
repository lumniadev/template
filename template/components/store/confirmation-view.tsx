'use client'

import { ArrowRight, Check } from 'lucide-react'
import { deliveryWindow, orderMessage, whatsappLink } from '@/lib/format'
import type { Order } from '@/lib/types'
import { ProductImage } from './product-visual'
import { useStore } from './store-provider'
import { ClientOnly } from './local-date'
import { useGo } from './nav'

export function ConfirmationView({ order }: { order: Order }) {
  const { settings: s, money } = useStore()
  const go = useGo()
  const message = orderMessage(order, s)
  const method = s.orders.method
  const sendLink =
    method === 'whatsapp' && s.contact.whatsapp
      ? whatsappLink(s.contact.whatsapp, message)
      : method === 'email' && s.contact.email
        ? `mailto:${s.contact.email}?subject=${encodeURIComponent(`Order ${order.number}`)}&body=${encodeURIComponent(message)}`
        : ''

  return (
    <section className="confirmation">
      <div className="success-mark"><Check size={32} /></div>
      <span className="eyebrow">Order received</span>
      <h1>{s.confirmation.title}</h1>
      <p className="confirm-lede">
        {s.confirmation.text}
        {order.customer.email && <> We’ll reach you at {order.customer.email}.</>}
      </p>
      <div className="order-card">
        <div><span>Order number</span><b>{order.number}</b></div>
        <div><span>Total</span><b>{money(order.total)}</b></div>
        <div><span>Estimated delivery</span><b><ClientOnly>{deliveryWindow(s, new Date(order.createdAt))}</ClientOnly></b></div>
        <div className="order-products">
          {order.items.slice(0, 4).map((i, n) => <ProductImage key={n} src={i.image} alt={i.name} small />)}
        </div>
      </div>
      <button className="primary" onClick={() => go('/')}>Back to home <ArrowRight size={17} /></button>
      <button className="text-button track" onClick={() => go(`/track?number=${encodeURIComponent(order.number)}`)}>Track your order</button>
      {sendLink && (
        <a className="text-button track" href={sendLink} target="_blank" rel="noopener noreferrer">
          {method === 'whatsapp' ? 'Send order on WhatsApp' : 'Email your order'} <ArrowRight size={16} />
        </a>
      )}
    </section>
  )
}
