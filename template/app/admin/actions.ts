'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { emailEnabled, sendEmail } from '@/lib/email'
import { onStatusChanged } from '@/lib/order-events'
import { pushToSheet, sheetEnabled } from '@/lib/sheet'
import { siteUrl } from '@/lib/site'
import { checkPassword, endSession, requireAdmin, startSession } from '@/lib/auth'
import {
  deleteOrder,
  deleteProduct,
  deleteSubscriber,
  getSettings,
  listOrders,
  saveProduct,
  saveSettings,
  updateOrderStatus,
  type ProductInput,
} from '@/lib/data'
import { defaultSettings } from '@/lib/defaults'
import { orderStatuses, slugify } from '@/lib/format'
import type { OrderStatus, StoreSettings } from '@/lib/types'

const str = (v: unknown, max = 2000) => String(v ?? '').slice(0, max)
const int = (v: unknown, min = 0, max = 1e9) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)))

function refresh() {
  revalidatePath('/', 'layout')
}

// ---------- login ----------

export async function login(_prev: { error: string }, form: FormData) {
  if (!checkPassword(str(form.get('password'), 200))) {
    await new Promise((r) => setTimeout(r, 1200)) // slows down password guessing
    return { error: 'That password isn’t right.' }
  }
  await startSession()
  redirect('/admin')
}

export async function logout() {
  await endSession()
  redirect('/admin/login')
}

// ---------- products ----------

export async function saveProductAction(input: ProductInput, id?: string) {
  await requireAdmin()
  const name = str(input.name, 200).trim()
  if (!name) return { ok: false as const, error: 'Please give the product a name.' }
  const price = int(input.price)
  const compare = input.compareAtPrice ? int(input.compareAtPrice) : null
  const clean: ProductInput = {
    name,
    slug: str(input.slug, 200).trim(),
    type: str(input.type, 200).trim(),
    category: str(input.category, 200).trim(),
    price,
    compareAtPrice: compare && compare > price ? compare : null,
    description: str(input.description, 5000),
    details: (input.details || []).map((d) => ({ title: str(d.title, 200).trim(), body: str(d.body, 5000) })).filter((d) => d.title || d.body),
    images: (input.images || []).map((u) => str(u, 2000).trim()).filter(Boolean).slice(0, 12),
    options: (input.options || [])
      .map((o) => ({ name: str(o.name, 100).trim(), values: (o.values || []).map((v) => str(v, 100).trim()).filter(Boolean) }))
      .filter((o) => o.name && o.values.length),
    badge: str(input.badge, 60).trim(),
    inStock: Boolean(input.inStock),
    stock: input.stock === null || input.stock === undefined || String(input.stock) === '' ? null : int(input.stock, 0, 1e7),
    featured: Boolean(input.featured),
    rating: Math.min(5, Math.max(0, Number(input.rating) || 0)),
    reviewCount: int(input.reviewCount),
    sortOrder: int(input.sortOrder, -100000, 100000),
  }
  const product = await saveProduct(clean, id)
  refresh()
  return { ok: true as const, id: product.id, slug: product.slug }
}

export async function deleteProductAction(id: string) {
  await requireAdmin()
  await deleteProduct(str(id, 100))
  refresh()
  return { ok: true }
}

// ---------- orders ----------

export async function updateOrderStatusAction(id: string, status: OrderStatus) {
  await requireAdmin()
  if (!orderStatuses.includes(status)) return { ok: false }
  const result = await updateOrderStatus(str(id, 100), status)
  if (result) {
    const site = await siteUrl()
    after(() => onStatusChanged(result.order, result.previous, 'admin', site))
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ---------- Google Sheet & email ----------

export async function syncSheetAction() {
  await requireAdmin()
  const s = await getSettings()
  if (!sheetEnabled(s)) return { ok: false, message: 'Paste your Apps Script web app link and save first.' }
  const orders = await listOrders(1000)
  if (orders.length === 0) {
    const res = await fetch(s.sheet.url, { method: 'POST', body: JSON.stringify({ secret: s.sheet.secret, action: 'ping' }), redirect: 'follow' })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: 'Could not reach the sheet.' }))
    return { ok: Boolean(res.ok), message: res.ok ? 'Connected ✓ — no orders to send yet.' : res.error || 'The sheet didn’t answer.' }
  }
  const res = await pushToSheet([...orders].reverse(), s)
  return { ok: res.ok, message: res.ok ? `Connected ✓ — ${orders.length} order${orders.length === 1 ? '' : 's'} sent to the sheet.` : res.error || 'Sync failed.' }
}

export async function testEmailAction() {
  await requireAdmin()
  const s = await getSettings()
  const to = s.notifications.sellerEmail || s.contact.email
  if (!emailEnabled) return { ok: false, message: 'Emails are off. Add RESEND_API_KEY in Vercel and redeploy.' }
  if (!to) return { ok: false, message: 'Add a notification email first.' }
  const res = await sendEmail(to, `Test email from ${s.name}`, `<p>Order emails from <b>${s.name}</b> are working.</p>`)
  return { ok: res.ok, message: res.ok ? `Sent to ${to} ✓` : 'Resend rejected it — check EMAIL_FROM uses a verified domain.' }
}

export async function deleteOrderAction(id: string) {
  await requireAdmin()
  await deleteOrder(str(id, 100))
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function deleteSubscriberAction(email: string) {
  await requireAdmin()
  await deleteSubscriber(str(email, 200))
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

// ---------- settings ----------

/** Keeps only known settings keys with the right types (anything unexpected falls back to the default). */
function shape<T>(base: T, value: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(value)) return base
    const item = base[0]
    return value.slice(0, 50).map((v) => (item === undefined ? v : shape(item, v))) as T
  }
  if (typeof base === 'object' && base !== null) {
    const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(base)) out[key] = shape((base as Record<string, unknown>)[key], v[key])
    return out as T
  }
  if (typeof base === 'number') return (Number.isFinite(Number(value)) ? Number(value) : base) as T
  if (typeof base === 'string') return (value === undefined || value === null ? base : str(value, 5000)) as T
  return base
}

export async function saveSettingsAction(input: StoreSettings) {
  await requireAdmin()
  const s = shape(defaultSettings, input)
  s.name = s.name.trim() || defaultSettings.name
  if (!['whatsapp', 'email', 'none'].includes(s.orders.method)) s.orders.method = 'none'
  if (!/^#[0-9a-f]{6}$/i.test(s.colors.main)) s.colors.main = defaultSettings.colors.main
  if (!/^#[0-9a-f]{6}$/i.test(s.colors.text)) s.colors.text = defaultSettings.colors.text
  try {
    new Intl.NumberFormat(s.locale, { style: 'currency', currency: s.currency })
  } catch {
    return { ok: false as const, error: 'The currency or language code isn’t valid (try USD and en-US).' }
  }
  s.shipping.freeOver = int(s.shipping.freeOver)
  s.shipping.fee = int(s.shipping.fee)
  s.shipping.minDays = int(s.shipping.minDays, 0, 365)
  s.shipping.maxDays = Math.max(s.shipping.minDays, int(s.shipping.maxDays, 0, 365))
  s.promoCodes = s.promoCodes.filter((p) => p.code.trim()).map((p) => ({ code: p.code.trim().toUpperCase(), percent: int(p.percent, 0, 100) }))
  s.sheet.url = s.sheet.url.trim()
  if (s.sheet.url && !/^https:\/\/script\.google(usercontent)?\.com\//.test(s.sheet.url))
    return { ok: false as const, error: 'The sheet link should start with https://script.google.com/' }
  if (!s.sheet.secret || s.sheet.secret.length < 16) s.sheet.secret = randomBytes(18).toString('base64url')
  s.notifications.sellerEmail = s.notifications.sellerEmail.trim()
  s.pages = s.pages.filter((p) => p.slug.trim() && p.title.trim()).map((p) => ({ ...p, slug: slugify(p.slug) }))
  await saveSettings(s)
  refresh()
  return { ok: true as const }
}
