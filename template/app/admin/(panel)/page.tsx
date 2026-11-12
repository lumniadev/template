import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getProducts, getSettings, listOrders, listSubscribers } from '@/lib/data'
import { formatMoney } from '@/lib/format'
import { OrdersTable } from '@/components/admin/orders-table'

export default async function Dashboard() {
  const [s, products, orders, subs] = await Promise.all([getSettings(), getProducts(), listOrders(1000), listSubscribers()])
  const money = (c: number) => formatMoney(c, s.currency, s.locale)
  const counted = orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status))
  const revenue = counted.reduce((n, o) => n + o.total, 0)
  const toCall = orders.filter((o) => o.status === 'pending' || o.status === 'no_answer')
  const toShip = orders.filter((o) => o.status === 'confirmed').length
  const lowStock = products.filter((p) => p.stock !== null && p.stock <= 3).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))

  return (
    <>
      <div className="admin-head">
        <div><span className="eyebrow">Overview</span><h1>Welcome back</h1></div>
        <div className="actions"><Link className="primary" href="/admin/products/new"><Plus size={16} /> Add product</Link></div>
      </div>
      <div className="admin-stats">
        <div className="admin-stat"><span>To call</span><b>{toCall.length}</b></div>
        <div className="admin-stat"><span>To ship</span><b>{toShip}</b></div>
        <div className="admin-stat"><span>Confirmed sales</span><b>{money(revenue)}</b></div>
        <div className="admin-stat"><span>Products</span><b>{products.length}</b></div>
      </div>
      {toCall.length > 0 && (
        <div className="admin-card">
          <h2>Waiting for a call</h2>
          <p className="hint">New and unanswered orders. Open one to call the customer and confirm.</p>
          <OrdersTable orders={toCall.slice(0, 10)} />
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="admin-card">
          <h2>Low stock</h2>
          <p className="hint">Products with 3 or fewer left.</p>
          {lowStock.map((p) => (
            <Link key={p.id} href={`/admin/products/${p.id}`} className="low-stock">
              <span>{p.name}</span>
              <b style={{ color: p.stock === 0 ? '#b3261e' : undefined }}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</b>
            </Link>
          ))}
        </div>
      )}
      <div className="admin-card">
        <h2>Recent orders</h2>
        <p className="hint">{subs.length} newsletter subscriber{subs.length === 1 ? '' : 's'} · <Link href="/admin/orders" className="text-button" style={{ display: 'inline' }}>See all orders</Link></p>
        <OrdersTable orders={orders.slice(0, 8)} />
      </div>
    </>
  )
}
