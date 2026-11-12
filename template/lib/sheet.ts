import { formatMoney, statusLabels } from './format'
import type { Order, StoreSettings } from './types'

// Google Sheet sync. The sheet runs the small Apps Script in /google-sheet/orders-sync.gs.
// Store → sheet: every new order and status change is sent to the script's web app URL.
// Sheet → store: editing the Status column calls /api/sheet (see that route).

export function sheetRow(order: Order, s: StoreSettings) {
  const c = order.customer
  return {
    number: order.number,
    date: order.createdAt, // ISO time; the sheet shows it in the spreadsheet's own time zone
    status: statusLabels[order.status],
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    city: c.city,
    items: order.items
      .map((i) => `${i.qty} × ${i.name}${Object.values(i.options).filter(Boolean).length ? ` (${Object.values(i.options).filter(Boolean).join(', ')})` : ''}`)
      .join('\n'),
    total: formatMoney(order.total, s.currency, s.locale),
    notes: c.notes,
  }
}

export function sheetEnabled(s: StoreSettings) {
  return Boolean(s.sheet.url && s.sheet.secret)
}

/** Sends orders to the sheet. New order numbers are added as rows; existing ones are updated. */
export async function pushToSheet(orders: Order[], s: StoreSettings) {
  if (!sheetEnabled(s) || orders.length === 0) return { ok: false, error: 'Sheet not connected' }
  try {
    const res = await fetch(s.sheet.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: s.sheet.secret, action: 'upsert', orders: orders.map((o) => sheetRow(o, s)) }),
      redirect: 'follow',
    })
    const text = await res.text()
    let data: { ok?: boolean; error?: string } = {}
    try {
      data = JSON.parse(text)
    } catch {
      return { ok: false, error: 'The sheet link didn’t answer correctly. Check that the Apps Script is deployed as a web app with access “Anyone”.' }
    }
    if (!data.ok) return { ok: false, error: data.error || 'The sheet rejected the request.' }
    return { ok: true }
  } catch (err) {
    console.error('[sheet] push failed', err)
    return { ok: false, error: 'Could not reach the sheet.' }
  }
}
