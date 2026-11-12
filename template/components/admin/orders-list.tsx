'use client'

import { useState } from 'react'
import { orderStatuses, statusLabels } from '@/lib/format'
import type { Order, OrderStatus } from '@/lib/types'
import { OrdersTable } from './orders-table'

export function OrdersList({ orders, initialTab = 'all' }: { orders: Order[]; initialTab?: OrderStatus | 'all' }) {
  const [tab, setTab] = useState<OrderStatus | 'all'>(initialTab)
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const list = orders.filter(
    (o) =>
      (tab === 'all' || o.status === tab) &&
      (!query || [o.number, o.customer.name, o.customer.email, o.customer.phone, o.customer.city].join(' ').toLowerCase().includes(query)),
  )
  return (
    <div className="admin-card">
      <div className="admin-tabs">
        {(['all', ...orderStatuses] as const).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'all' ? 'All' : statusLabels[t]} ({t === 'all' ? orders.length : orders.filter((o) => o.status === t).length})
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <input className="admin-search" placeholder="Search by order number, name, phone, email or city" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <OrdersTable orders={list} />
    </div>
  )
}
