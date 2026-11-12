'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { myOrders } from '@/app/(store)/actions'
import { statusLabels } from '@/lib/format'
import { ProductImage } from './product-visual'
import { LocalDate } from './local-date'
import { useStore } from './store-provider'
import { useGo } from './nav'

type Result = Awaited<ReturnType<typeof myOrders>>
type HistoryOrder = Extract<Result, { ok: true }>['orders'][number]

export function AccountView() {
  const { customer, ready, rememberCustomer, forgetCustomer, add, money } = useStore()
  const go = useGo()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null)
  const [pending, start] = useTransition()

  const load = useCallback(
    (p: string, n: string, remember: boolean) => {
      setError('')
      start(async () => {
        const res = await myOrders(p, n)
        if (!res.ok) {
          setOrders(null)
          setError(res.error)
          return
        }
        setOrders(res.orders)
        if (remember) rememberCustomer({ name: n, phone: p, email: customer?.email ?? '', address: customer?.address ?? '', city: customer?.city ?? '' })
      })
    },
    [customer, rememberCustomer],
  )

  // Returning customers on this device see their orders straight away.
  useEffect(() => {
    if (ready && customer && orders === null && !pending && !error) load(customer.phone, customer.name, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, customer])

  const reorder = (o: HistoryOrder) => {
    let added = 0
    const skipped: string[] = []
    for (const i of o.items) {
      const qty = Math.min(i.qty, i.available)
      if (!i.slug || qty <= 0) {
        skipped.push(i.name)
        continue
      }
      add({ productId: i.productId, slug: i.slug, name: i.name, type: i.type, image: i.image, price: i.price, options: i.options }, qty)
      added += qty
    }
    setNotice({
      id: o.id,
      text: added
        ? `${added} item${added === 1 ? '' : 's'} added to your bag${skipped.length ? ` · not available any more: ${skipped.join(', ')}` : ''}`
        : 'These items aren’t available any more.',
    })
  }

  const signOut = () => {
    forgetCustomer()
    setOrders(null)
    setPhone('')
    setName('')
  }

  const signedIn = orders !== null

  return (
    <section className="page-section cart-page">
      <div className="breadcrumbs">Home <span>/</span> My orders</div>
      <h1>My orders {signedIn && <span>({orders.length})</span>}</h1>

      {!signedIn && !(ready && customer && pending) && (
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); load(phone, name, true) }}>
            <span className="eyebrow full">See your orders</span>
            <p className="full account-intro">Enter the phone number and name you used at checkout. We’ll remember you on this device.</p>
            <label>Phone<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required /></label>
            <label>First name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" required /></label>
            <div className="full"><button className="primary" disabled={pending}>{pending ? 'Looking…' : 'Show my orders'} <ArrowRight size={16} /></button></div>
            {error && <p className="form-error full" style={{ textAlign: 'left' }}>{error}</p>}
          </form>
        </div>
      )}

      {ready && customer && pending && !signedIn && <p className="account-intro">Loading your orders…</p>}

      {signedIn && (
        <>
          <div className="account-bar">
            <span>Signed in as <b>{customer?.name || name}</b> on this device</span>
            <button className="text-button" onClick={signOut}>Not you? Sign out</button>
          </div>
          <div className="history">
            {orders.map((o) => (
              <article className="history-order" key={o.id}>
                <div className="history-head">
                  <div>
                    <span className="eyebrow">{o.number}</span>
                    <p><LocalDate value={o.createdAt} mode="date" /> · <b>{money(o.total)}</b></p>
                  </div>
                  <span className={`status-chip ${o.status}`}>{statusLabels[o.status]}</span>
                </div>
                <div className="history-items">
                  {o.items.map((i, n) => (
                    <div className="history-item" key={n} onClick={() => i.slug && go(`/products/${i.slug}`)}>
                      <div className="cart-thumb"><ProductImage src={i.image} alt={i.name} small /></div>
                      <div>
                        <h3>{i.name}</h3>
                        <p>{[`Qty ${i.qty}`, ...Object.values(i.options).filter(Boolean)].join(' · ')}</p>
                        {i.available === 0 && <p className="unavailable">Not available</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="history-actions">
                  <button className="primary" onClick={() => reorder(o)}><RotateCcw size={15} /> Re-order</button>
                  <button className="text-button" onClick={() => go(`/track?number=${encodeURIComponent(o.number)}`)}>Track order</button>
                </div>
                {notice?.id === o.id && (
                  <div className="added-note" role="status">
                    <span><Check size={14} /> {notice.text}</span>
                    <button className="text-button" onClick={() => go('/cart')}>View bag</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
