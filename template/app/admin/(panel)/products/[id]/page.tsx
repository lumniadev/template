import { notFound } from 'next/navigation'
import { getProductById, getProducts } from '@/lib/data'
import { ProductForm } from '@/components/admin/product-form'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getProductById((await params).id)
  if (!product) notFound()
  const categories = [...new Set((await getProducts()).map((p) => p.category).filter(Boolean))]
  return <ProductForm key={product.id} product={product} categories={categories} />
}
