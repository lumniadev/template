import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getProducts } from '@/lib/data'
import { ProductView } from '@/components/store/product-view'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug)
  if (!p) return { title: 'Product not found' }
  return { title: p.name, description: p.description, openGraph: p.images[0] ? { images: [p.images[0]] } : undefined }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug)
  if (!product) notFound()
  const others = (await getProducts()).filter((p) => p.id !== product.id)
  const related = [...others.filter((p) => p.category === product.category), ...others.filter((p) => p.category !== product.category)].slice(0, 3)
  return <ProductView product={product} related={related} />
}
