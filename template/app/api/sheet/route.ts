import { after, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { getOrderByNumber, getSettings, updateOrderStatus } from '@/lib/data'
import { toStatus } from '@/lib/format'
import { onStatusChanged } from '@/lib/order-events'
import { siteUrl } from '@/lib/site'

// Called by the Google Sheet when someone changes an order's Status column.
// Body: { secret, number, status }

function same(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
}

export async function POST(req: Request) {
  let body: { secret?: string; number?: string; status?: string }
  try {
    body = JSON.parse(await req.text())
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
  const s = await getSettings()
  if (!s.sheet.secret || !body.secret || !same(String(body.secret), s.sheet.secret)) {
    return NextResponse.json({ ok: false, error: 'Wrong secret' }, { status: 401 })
  }
  const status = toStatus(body.status)
  if (!status) return NextResponse.json({ ok: false, error: `Unknown status “${body.status}”` }, { status: 400 })
  const order = await getOrderByNumber(String(body.number || ''))
  if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })

  const result = await updateOrderStatus(order.id, status)
  if (result) {
    const site = await siteUrl()
    after(() => onStatusChanged(result.order, result.previous, 'sheet', site))
  }
  return NextResponse.json({ ok: true, number: order.number, status })
}
