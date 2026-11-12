import { getProducts } from '@/lib/data'
import { HomeView } from '@/components/store/home-view'

export default async function HomePage() {
  const products = await getProducts()
  return <HomeView products={products} />
}
