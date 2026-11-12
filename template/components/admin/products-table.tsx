'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { available } from '@/lib/format'
import type { Product } from '@/lib/types'
import { useStore } from '@/components/store/store-provider'
import { Thumb } from './bits'

export function ProductsTable({ products }: { products: Product[] }) {
  const { money } = useStore()
  const router = useRouter()
  const [q, setQ] = useState('')
  const list = products.filter((p) => [p.name, p.type, p.category].join(' ').toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <input className="admin-search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <p className="empty">{products.length === 0 ? 'No products yet. Add your first one.' : 'No products match.'}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Product</th><th className="hide-sm">Category</th><th>Status</th><th className="num">Price</th></tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="click" onClick={() => router.push(`/admin/products/${p.id}`)}>
                <td>
                  <div className="admin-prod">
                    <Thumb src={p.images[0]} alt={p.name} />
                    <div><b>{p.name}</b><div className="muted">{p.type}</div></div>
                  </div>
                </td>
                <td className="hide-sm muted">{p.category || '—'}</td>
                <td>
                  {available(p) === 0 ? <span className="pill-status off">Sold out</span> : <span className="pill-status confirmed">{p.stock === null ? 'In stock' : `${p.stock} left`}</span>}{' '}
                  {p.featured && <span className="pill-status">Featured</span>}
                </td>
                <td className="num"><b>{money(p.price)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
