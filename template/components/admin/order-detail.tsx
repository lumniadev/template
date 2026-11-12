'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, MessageCircle, Phone, PhoneMissed, Trash2, X } from 'lucide-react'
import { deleteOrderAction, updateOrderStatusAction } from '@/app/admin/actions'
import { orderStatuses, statusLabels } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'
import { useStore } from '@/components/store/store-provider'
import { LocalDate } from '@/components/store/local-date'
import { Thumb } from './bits'

export function OrderDetail({ order }: { order: Order }) {
  const { money } = useStore()
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [pending, start] = useTransition()
  const c = order.customer
  const phoneDigits = c.phone.replace(/\D/g, '')
  const toCall = status === 'pending' || status === 'no_answer'

  const change = (s: OrderStatus) => {
    if (s === status) return
    if (s === 'cancelled' && !confirm(`Cancel order ${order.number}? Stock will be returned.`)) return
    setStatus(s)
    start(async () => {
      await updateOrderStatusAction(order.id, s)
      router.refresh()
    })
  }

  const remove = () => {
    if (!confirm(`Delete order ${order.number}? This can’t be undone.`)) return
    start(async () => {
      await deleteOrderAction(order.id)
      router.replace('/admin/orders')
      router.refresh()
    })
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <Link href="/admin/orders" className="text-button"><ArrowLeft size={14} /> All orders</Link>
          <h1>Order {order.number} <span className={`pill-status ${status}`} style={{ verticalAlign: 'middle', fontSize: 12 }}>{statusLabels[status]}</span></h1>
        </div>
        <div className="actions">
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center' }}>
            Status
            <select value={status} onChange={(e) => change(e.target.value as OrderStatus)} disabled={pending} style={{ width: 'auto' }}>
              {orderStatuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
          </label>
          <button className="admin-btn danger" onClick={remove} disabled={pending}><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      {toCall && (
        <div className="admin-card call-card">
          <div>
            <h2>Call to confirm</h2>
            <p className="hint" style={{ margin: 0 }}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</p>
          </div>
          <div className="call-actions">
            {phoneDigits && <a className="primary" href={`tel:${c.phone}`}><Phone size={15} /> Call</a>}
            <button className="admin-btn" onClick={() => change('confirmed')} disabled={pending}><Check size={14} /> Confirmed</button>
            <button className="admin-btn" onClick={() => change('no_answer')} disabled={pending || status === 'no_answer'}><PhoneMissed size={14} /> No answer</button>
            <button className="admin-btn danger" onClick={() => change('cancelled')} disabled={pending}><X size={14} /> Cancel</button>
          </div>
        </div>
      )}
      {status === 'confirmed' && (
        <div className="admin-card call-card">
          <div><h2>Ready to ship?</h2><p className="hint" style={{ margin: 0 }}>Mark it shipped when it leaves.</p></div>
          <div className="call-actions"><button className="primary" onClick={() => change('shipped')} disabled={pending}>Mark as shipped</button></div>
        </div>
      )}
      {status === 'shipped' && (
        <div className="admin-card call-card">
          <div><h2>Delivered?</h2><p className="hint" style={{ margin: 0 }}>Mark it delivered once the customer has it.</p></div>
          <div className="call-actions"><button className="primary" onClick={() => change('delivered')} disabled={pending}>Mark as delivered</button></div>
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <h2>Items</h2>
          <div className="order-lines">
            {order.items.map((i, n) => (
              <div className="line" key={n}>
                <div className="admin-prod">
                  <Thumb src={i.image} alt={i.name} />
                  <div>
                    <b>{i.qty} × {i.name}</b>
                    <div className="muted">{Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>
                  </div>
                </div>
                <b>{money(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          <div className="kv" style={{ marginTop: 16 }}>
            <span>Subtotal</span><b>{money(order.subtotal)}</b>
            {order.discount > 0 && <><span>Discount</span><b>−{money(order.discount)} ({order.promoCode})</b></>}
            <span>Shipping</span><b>{order.shipping ? money(order.shipping) : 'Free'}</b>
            <span>Total</span><b>{money(order.total)}</b>
          </div>
        </div>

        <div className="admin-card">
          <h2>Customer</h2>
          <div className="kv" style={{ marginTop: 12 }}>
            <span>Name</span><b>{c.name}</b>
            <span>Phone</span>{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : <b>—</b>}
            <span>Email</span>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <b>—</b>}
            <span>Address</span><b>{[c.address, c.city].filter(Boolean).join(', ') || '—'}</b>
            <span>Notes</span><b style={{ whiteSpace: 'pre-line', fontWeight: 400 }}>{c.notes || '—'}</b>
            <span>Placed</span><b><LocalDate value={order.createdAt} /></b>
          </div>
          {phoneDigits && (
            <a className="admin-btn" style={{ marginTop: 16 }} href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">
              <MessageCircle size={14} /> Message on WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  )
}
