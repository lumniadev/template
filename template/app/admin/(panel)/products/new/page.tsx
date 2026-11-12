import { getProducts } from '@/lib/data'
import { ProductForm } from '@/components/admin/product-form'

export default async function NewProductPage() {
  const categories = [...new Set((await getProducts()).map((p) => p.category).filter(Boolean))]
  return <ProductForm product={null} categories={categories} />
}
