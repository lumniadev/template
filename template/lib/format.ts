import type { Order, OrderStatus, Product, PromoCode, StoreSettings } from './types'

// ---------- order statuses ----------

export const orderStatuses: OrderStatus[] = ['pending', 'confirmed', 'no_answer', 'shipped', 'delivered', 'cancelled']

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  no_answer: 'No answer',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/** Accepts a status code, a label ("No answer") or an old status name, and returns a valid status. */
export function toStatus(value: unknown): OrderStatus | null {
  const v = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const legacy: Record<string, OrderStatus> = { new: 'pending', paid: 'confirmed', completed: 'delivered', canceled: 'cancelled' }
  if ((orderStatuses as string[]).includes(v)) return v as OrderStatus
  return legacy[v] ?? null
}

// ---------- stock ----------

/** Units a customer can buy right now (Infinity when stock isn't tracked). */
export function available(p: Pick<Product, 'inStock' | 'stock'>) {
  if (!p.inStock) return 0
  return p.stock === null || p.stock === undefined ? Infinity : Math.max(0, p.stock)
}

// Small helpers that work on both the server and in the browser.

export function formatMoney(cents: number, currency = 'USD', locale = 'en-US') {
  const whole = cents % 100 === 0
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(whole ? 0 : 2)} ${currency}`
  }
}

export function toCents(value: string | number | null | undefined) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  )
}

export function stars(rating: number) {
  const n = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export function initials(name: string) {
  return name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase()
}

export function findPromo(code: string, settings: StoreSettings): PromoCode | null {
  const c = code.trim().toUpperCase()
  if (!c) return null
  return settings.promoCodes.find((p) => p.code.trim().toUpperCase() === c && p.percent > 0) ?? null
}

export function computeTotals(items: { price: number; qty: number }[], settings: StoreSettings, promo: PromoCode | null) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const discount = promo ? Math.round((subtotal * Math.min(100, promo.percent)) / 100) : 0
  const afterDiscount = subtotal - discount
  const { freeOver, fee } = settings.shipping
  const shipping = items.length === 0 || fee <= 0 || (freeOver > 0 && afterDiscount >= freeOver) ? 0 : fee
  return { subtotal, discount, shipping, total: afterDiscount + shipping }
}

export function deliveryWindow(settings: StoreSettings, from = new Date(), locale = settings.locale) {
  const fmt = (days: number) => {
    const d = new Date(from)
    d.setDate(d.getDate() + days)
    try {
      return d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
    } catch {
      return d.toDateString()
    }
  }
  const { minDays, maxDays } = settings.shipping
  return minDays === maxDays ? fmt(minDays) : `${fmt(minDays)} – ${fmt(maxDays)}`
}

export function orderMessage(order: Order, settings: StoreSettings) {
  const money = (c: number) => formatMoney(c, settings.currency, settings.locale)
  const lines = order.items.map((i) => {
    const opts = Object.values(i.options).filter(Boolean).join(', ')
    return `• ${i.qty} × ${i.name}${opts ? ` (${opts})` : ''} — ${money(i.price * i.qty)}`
  })
  const c = order.customer
  return [
    `Hi ${settings.name}! I just placed order ${order.number}:`,
    '',
    ...lines,
    '',
    `Total: ${money(order.total)}`,
    '',
    `Name: ${c.name}`,
    c.phone && `Phone: ${c.phone}`,
    c.address && `Address: ${c.address}${c.city ? `, ${c.city}` : ''}`,
    c.notes && `Notes: ${c.notes}`,
  ]
    .filter((l): l is string => typeof l === 'string')
    .join('\n')
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

export function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href)
}
