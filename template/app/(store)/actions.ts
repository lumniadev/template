'use server'

import { after } from 'next/server'
import { addSubscriber, adjustStock, createOrder, getOrderByNumber, getProducts, getSettings, listOrdersByPhone } from '@/lib/data'
import { available, computeTotals, findPromo } from '@/lib/format'
import { onOrderCreated } from '@/lib/order-events'
import { siteUrl } from '@/lib/site'
import type { Customer, OrderItem } from '@/lib/types'

export async function subscribe(email: string) {
  const clean = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 200) return { ok: false, message: 'Please enter a valid email address.' }
  await addSubscriber(clean)
  return { ok: true, message: 'You’re on the list. Welcome!' }
}

type CheckoutLine = { productId: string; options: Record<string, string>; qty: number }

export async function placeOrder(input: { lines: CheckoutLine[]; customer: Customer; promoCode: string }) {
  const settings = await getSettings()
  const products = await getProducts()
  const c = input.customer
  const customer: Customer = {
    name: String(c?.name || '').trim().slice(0, 120),
    email: String(c?.email || '').trim().slice(0, 200),
    phone: String(c?.phone || '').trim().slice(0, 40),
    address: String(c?.address || '').trim().slice(0, 300),
    city: String(c?.city || '').trim().slice(0, 120),
    notes: String(c?.notes || '').trim().slice(0, 1000),
  }
  if (!customer.name) return { ok: false as const, error: 'Please enter your name.' }
  if (settings.orders.requirePhone && customer.phone.replace(/\D/g, '').length < 6)
    return { ok: false as const, error: 'Please enter your phone number — we’ll call to confirm your order.' }
  if (!customer.email && !customer.phone) return { ok: false as const, error: 'Please enter an email or phone number so we can reach you.' }
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return { ok: false as const, error: 'Please check your email address.' }

  // Prices always come from the database, never from the browser.
  const items: OrderItem[] = []
  for (const line of input.lines || []) {
    const p = products.find((x) => x.id === line.productId)
    const qty = Math.floor(Number(line.qty))
    if (!p || !(qty > 0) || qty > 99) continue
    const alreadyInOrder = items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.qty, 0)
    const left = available(p) - alreadyInOrder
    if (left <= 0) return { ok: false as const, error: `Sorry, ${p.name} just sold out. Please remove it from your bag.` }
    if (qty > left) return { ok: false as const, error: `Only ${left} of ${p.name} left. Please lower the quantity in your bag.` }
    const options: Record<string, string> = {}
    for (const o of p.options) {
      const chosen = line.options?.[o.name]
      options[o.name] = o.values.includes(chosen) ? chosen : o.values[0] ?? ''
    }
    items.push({ productId: p.id, name: p.name, type: p.type, image: p.images[0] ?? '', options, price: p.price, qty })
  }
  if (items.length === 0) return { ok: false as const, error: 'Your bag is empty or the items are no longer available.' }

  const promo = findPromo(input.promoCode || '', settings)
  const totals = computeTotals(items, settings, promo)
  const order = await createOrder({ customer, items, promoCode: promo?.code ?? '', ...totals }, settings.orders.prefix)
  for (const i of items) await adjustStock(i.productId, -i.qty)

  // Emails + Google Sheet run after the response, so the customer isn't kept waiting.
  const site = await siteUrl()
  after(() => onOrderCreated(order, site))
  return { ok: true as const, id: order.id }
}

/** Order tracking: the customer needs the order number plus the phone or email used at checkout. */
export async function trackOrder(number: string, contact: string) {
  const order = number.trim() ? await getOrderByNumber(number) : null
  const c = String(contact || '').trim().toLowerCase()
  const digits = (v: string) => v.replace(/\D/g, '')
  const matches =
    order &&
    c &&
    ((order.customer.email && order.customer.email.toLowerCase() === c) ||
      (digits(c).length >= 6 && digits(order.customer.phone).endsWith(digits(c).slice(-8))))
  if (!order || !matches) {
    await new Promise((r) => setTimeout(r, 500))
    return { ok: false as const, error: 'We couldn’t find that order. Check the order number and the phone or email you used.' }
  }
  return {
    ok: true as const,
    order: {
      number: order.number,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, options: i.options, image: i.image })),
    },
  }
}

const firstWord = (s: string) => s.trim().toLowerCase().normalize('NFKC').split(/\s+/)[0] ?? ''

/**
 * "My orders": the customer's order history, found by phone number + first name.
 * Phone and name aren't secret, so this only returns what's needed to see and re-order —
 * never addresses, phone numbers or emails.
 */
export async function myOrders(phone: string, name: string) {
  const digits = String(phone || '').replace(/\D/g, '')
  const first = firstWord(String(name || ''))
  if (digits.length < 6 || !first) return { ok: false as const, error: 'Please enter your phone number and name.' }

  const orders = (await listOrdersByPhone(digits)).filter((o) => firstWord(o.customer.name) === first)
  if (orders.length === 0) {
    await new Promise((r) => setTimeout(r, 600))
    return { ok: false as const, error: 'No orders found for that phone number and name. Use the same details you gave at checkout.' }
  }

  const products = await getProducts()
  return {
    ok: true as const,
    orders: orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      createdAt: o.createdAt,
      total: o.total,
      items: o.items.map((i) => {
        const p = products.find((x) => x.id === i.productId)
        // Keep the chosen options only if the product still offers them.
        const options = p
          ? Object.fromEntries(p.options.map((opt) => [opt.name, opt.values.includes(i.options[opt.name]) ? i.options[opt.name] : opt.values[0] ?? '']))
          : i.options
        return {
          productId: i.productId,
          name: i.name,
          qty: i.qty,
          options,
          image: p?.images[0] ?? i.image,
          // Current product info, for re-ordering at today's price.
          slug: p?.slug ?? '',
          type: p?.type ?? i.type,
          price: p?.price ?? i.price,
          available: p ? Math.min(99, available(p)) : 0,
        }
      }),
    })),
  }
}
