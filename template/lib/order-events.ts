import { adjustStock, getSettings } from './data'
import { customerOrderEmail, sellerOrderEmail, sendEmail, statusEmail } from './email'
import { pushToSheet } from './sheet'
import type { Order, OrderStatus } from './types'

// What happens after an order is placed or its status changes.
// Called in the background (with next/server `after`) so customers never wait on email or the sheet.

export async function onOrderCreated(order: Order, site: string) {
  const s = await getSettings()
  const sellerTo = s.notifications.sellerEmail || s.contact.email
  const replyTo = s.contact.email || undefined
  const tasks: Promise<unknown>[] = [pushToSheet([order], s)]
  if (s.notifications.emailCustomer && order.customer.email) {
    const m = customerOrderEmail(order, s, site)
    tasks.push(sendEmail(order.customer.email, m.subject, m.html, replyTo))
  }
  if (sellerTo) {
    const m = sellerOrderEmail(order, s, site)
    tasks.push(sendEmail(sellerTo, m.subject, m.html, order.customer.email || undefined))
  }
  await Promise.allSettled(tasks)
}

/**
 * Keeps stock right when an order is cancelled or un-cancelled,
 * then emails the customer and (unless the change came from the sheet) updates the sheet.
 */
export async function onStatusChanged(order: Order, previous: OrderStatus, source: 'admin' | 'sheet', site: string) {
  if (order.status === previous) return
  if (order.status === 'cancelled') for (const i of order.items) await adjustStock(i.productId, i.qty)
  if (previous === 'cancelled') for (const i of order.items) await adjustStock(i.productId, -i.qty)

  const s = await getSettings()
  const tasks: Promise<unknown>[] = []
  if (source !== 'sheet') tasks.push(pushToSheet([order], s))
  if (s.notifications.emailOnStatus && order.customer.email) {
    const m = statusEmail(order, s, site)
    if (m) tasks.push(sendEmail(order.customer.email, m.subject, m.html, s.contact.email || undefined))
  }
  await Promise.allSettled(tasks)
}
