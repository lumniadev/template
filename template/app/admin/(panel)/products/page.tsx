import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getProducts } from '@/lib/data'
import { ProductsTable } from '@/components/admin/products-table'

export default async function ProductsPage() {
  const products = await getProducts()
  return (
    <>
      <div className="admin-head">
        <div><span className="eyebrow">Catalog</span><h1>Products</h1></div>
        <div className="actions"><Link className="primary" href="/admin/products/new"><Plus size={16} /> Add product</Link></div>
      </div>
      <div className="admin-card"><ProductsTable products={products} /></div>
    </>
  )
}
