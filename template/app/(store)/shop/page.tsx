import type { Metadata } from 'next'
import { getProducts } from '@/lib/data'
import { ShopView } from '@/components/store/shop-view'

export const metadata: Metadata = { title: 'Shop all' }

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const products = await getProducts()
  return <ShopView key={`${q}|${category}`} products={products} initialQuery={q} initialCategory={category} />
}
