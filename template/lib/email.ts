import { formatMoney, statusLabels } from './format'
import type { Order, OrderStatus, StoreSettings } from './types'

// Order emails, sent through Resend (free plan: 3,000 emails/month).
// Set RESEND_API_KEY and EMAIL_FROM in Vercel. Without them, emails are simply skipped.

export const emailEnabled = Boolean(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  if (!emailEnabled || !to) return { ok: false, skipped: true }
  const from = process.env.EMAIL_FROM || 'Store <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, reply_to: replyTo || undefined }),
    })
    if (!res.ok) console.error('[email] Resend error', res.status, await res.text())
    return { ok: res.ok }
  } catch (err) {
    console.error('[email] failed', err)
    return { ok: false }
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function layout(s: StoreSettings, title: string, intro: string, body: string) {
  const main = s.colors.main
  return `<!doctype html><html><body style="margin:0;background:#f4fbfd;font-family:Inter,Arial,sans-serif;color:${s.colors.text}">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;border:1px solid #d9edf0;padding:30px">
    <tr><td style="font-size:18px;font-weight:700;letter-spacing:-.03em;color:${main}">${esc(s.name)}</td></tr>
    <tr><td style="padding-top:22px;font-size:24px;font-weight:700;letter-spacing:-.04em">${esc(title)}</td></tr>
    <tr><td style="padding-top:10px;font-size:14px;line-height:1.6;color:#6b8b90">${intro}</td></tr>
    <tr><td style="padding-top:22px">${body}</td></tr>
    <tr><td style="padding-top:26px;font-size:11px;color:#6b8b90">${esc(s.name)} · ${esc(s.tagline)}</td></tr>
  </table></td></tr></table></body></html>`
}

function itemsTable(order: Order, s: StoreSettings) {
  const money = (c: number) => formatMoney(c, s.currency, s.locale)
  const rows = order.items
    .map((i) => {
      const opts = Object.values(i.options).filter(Boolean).join(' · ')
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #d9edf0;font-size:13px"><b>${i.qty} × ${esc(i.name)}</b>${opts ? `<br><span style="color:#6b8b90">${esc(opts)}</span>` : ''}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #d9edf0;font-size:13px">${money(i.price * i.qty)}</td></tr>`
    })
    .join('')
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#6b8b90">${label}</td><td align="right" style="padding:6px 0;font-size:${bold ? 16 : 13}px;${bold ? 'font-weight:700' : ''}">${value}</td></tr>`
  return `<table width="100%" cellpadding="0" cellspacing="0">${rows}
    ${line('Subtotal', money(order.subtotal))}
    ${order.discount ? line(`Discount (${esc(order.promoCode)})`, `−${money(order.discount)}`) : ''}
    ${line('Shipping', order.shipping ? money(order.shipping) : 'Free')}
    ${line('Total', money(order.total), true)}
  </table>`
}

function customerBlock(order: Order) {
  const c = order.customer
  const rows = [
    ['Name', c.name],
    ['Phone', c.phone],
    ['Email', c.email],
    ['Address', [c.address, c.city].filter(Boolean).join(', ')],
    ['Notes', c.notes],
  ].filter(([, v]) => v)
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;background:#f4fbfd;border-radius:12px;padding:12px 16px">
    ${rows.map(([k, v]) => `<tr><td style="padding:4px 0;font-size:12px;color:#6b8b90;width:90px;vertical-align:top">${k}</td><td style="padding:4px 0;font-size:13px">${esc(v)}</td></tr>`).join('')}
  </table>`
}

function button(s: StoreSettings, href: string, label: string) {
  return `<p style="margin:22px 0 0"><a href="${href}" style="display:inline-block;background:${s.colors.main};color:#fff;text-decoration:none;border-radius:12px;padding:12px 18px;font-size:13px;font-weight:600">${esc(label)}</a></p>`
}

/** Sent to the customer right after checkout. */
export function customerOrderEmail(order: Order, s: StoreSettings, site: string) {
  const intro = `Thanks ${esc(order.customer.name.split(' ')[0] || '')}! We received order <b>${esc(order.number)}</b>.` +
    (order.customer.phone ? ` We’ll call you on <b>${esc(order.customer.phone)}</b> to confirm it.` : ' We’ll be in touch to confirm it.')
  return {
    subject: `We received your order ${order.number}`,
    html: layout(s, 'Order received', intro, itemsTable(order, s) + customerBlock(order) + button(s, `${site}/track?number=${encodeURIComponent(order.number)}`, 'Track your order')),
  }
}

/** Sent to the shop owner for every new order. */
export function sellerOrderEmail(order: Order, s: StoreSettings, site: string) {
  const c = order.customer
  return {
    subject: `New order ${order.number} — ${formatMoney(order.total, s.currency, s.locale)} — ${c.name}`,
    html: layout(s, `New order ${order.number}`, `Call ${esc(c.name)}${c.phone ? ` on <b>${esc(c.phone)}</b>` : ''} to confirm.`,
      customerBlock(order) + '<div style="height:16px"></div>' + itemsTable(order, s) + button(s, `${site}/admin/orders/${order.id}`, 'Open in admin')),
  }
}

const statusCopy: Partial<Record<OrderStatus, { subject: string; title: string; text: string }>> = {
  confirmed: { subject: 'Your order is confirmed', title: 'Order confirmed', text: 'Good news — your order is confirmed and we’re getting it ready.' },
  no_answer: { subject: 'We tried to call you', title: 'We couldn’t reach you', text: 'We tried to call you to confirm your order but couldn’t get through. Please reply to this email or call us so we can send it out.' },
  shipped: { subject: 'Your order is on its way', title: 'On its way', text: 'Your order has shipped and will be with you soon.' },
  delivered: { subject: 'Your order was delivered', title: 'Delivered', text: 'Your order has been delivered. We hope you love it!' },
  cancelled: { subject: 'Your order was cancelled', title: 'Order cancelled', text: 'Your order has been cancelled. If this is a mistake, just reply to this email.' },
}

/** Sent to the customer when the order status changes (if enabled). Returns null for statuses with no email. */
export function statusEmail(order: Order, s: StoreSettings, site: string) {
  const copy = statusCopy[order.status]
  if (!copy) return null
  const contact = s.contact.phone ? ` You can reach us on ${esc(s.contact.phone)}.` : ''
  return {
    subject: `${copy.subject} (${order.number})`,
    html: layout(s, copy.title, `${copy.text}${order.status === 'no_answer' ? contact : ''}<br><br>Order <b>${esc(order.number)}</b> · Status: <b>${statusLabels[order.status]}</b>`,
      itemsTable(order, s) + button(s, `${site}/track?number=${encodeURIComponent(order.number)}`, 'Track your order')),
  }
}
