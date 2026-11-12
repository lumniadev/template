'use client'

import { useEffect, useState, useTransition } from 'react'
import { ArrowRight } from 'lucide-react'
import { placeOrder } from '@/app/(store)/actions'
import type { Customer } from '@/lib/types'
import { Summary } from './cart-view'
import { useStore } from './store-provider'
import { useGo } from './nav'

const empty: Customer = { name: '', email: '', phone: '', address: '', city: '', notes: '' }

export function CheckoutView() {
  const { settings, items, ready, promoCode, clear, customer, rememberCustomer } = useStore()
  const go = useGo()
  const [form, setForm] = useState<Customer>(empty)

  // Pre-fill with the details this customer used last time on this device.
  useEffect(() => {
    if (customer) setForm((f) => (f.name || f.phone ? f : { ...f, ...customer }))
  }, [customer])
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    setError('')
    start(async () => {
      try {
        const res = await placeOrder({ lines: items.map((i) => ({ productId: i.productId, options: i.options, qty: i.qty })), customer: form, promoCode })
        if (!res.ok) return setError(res.error)
        rememberCustomer({ name: form.name, phone: form.phone, email: form.email, address: form.address, city: form.city })
        clear()
        go(`/order/${res.id}`)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <section className="page-section cart-page">
      <div className="breadcrumbs">Home <span>/</span> Your bag <span>/</span> Checkout</div>
      <h1>Checkout</h1>
      {ready && items.length === 0 ? (
        <div className="empty-bag">
          <p>Your bag is empty.</p>
          <button className="primary" onClick={() => go('/shop')}>Start shopping <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <span className="eyebrow full">Your details</span>
            <label className="full">Full name<input value={form.name} onChange={set('name')} autoComplete="name" required /></label>
            <label>Phone{settings.orders.requirePhone ? ' (we’ll call to confirm)' : ''}<input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" required={settings.orders.requirePhone} /></label>
            <label>Email (for order updates)<input type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
            <label className="full">Address<input value={form.address} onChange={set('address')} autoComplete="street-address" /></label>
            <label className="full">City<input value={form.city} onChange={set('city')} autoComplete="address-level2" /></label>
            <label className="full">Order notes (optional)<textarea value={form.notes} onChange={set('notes')} /></label>
            <button type="submit" hidden />
          </form>
          <Summary action={pending ? 'Placing order…' : 'Place order'} onAction={submit} disabled={pending || items.length === 0} error={error} />
        </div>
      )}
    </section>
  )
}
