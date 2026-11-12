'use client'

import { useRouter } from 'next/navigation'
import { statusLabels } from '@/lib/format'
import type { Order } from '@/lib/types'
import { useStore } from '@/components/store/store-provider'
import { LocalDate } from '@/components/store/local-date'

export function OrdersTable({ orders }: { orders: Order[] }) {
  const { money } = useStore()
  const router = useRouter()
  if (orders.length === 0) return <p className="empty">No orders yet. They’ll show up here as soon as a customer checks out.</p>
  return (
    <table className="admin-table">
      <thead>
        <tr><th>Order</th><th>Customer</th><th className="hide-sm">Date</th><th>Status</th><th className="num">Total</th></tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="click" onClick={() => router.push(`/admin/orders/${o.id}`)}>
            <td><b>{o.number}</b></td>
            <td>{o.customer.name}<div className="muted">{o.customer.phone || o.customer.email}</div></td>
            <td className="hide-sm muted"><LocalDate value={o.createdAt} /></td>
            <td><span className={`pill-status ${o.status}`}>{statusLabels[o.status]}</span></td>
            <td className="num"><b>{money(o.total)}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
