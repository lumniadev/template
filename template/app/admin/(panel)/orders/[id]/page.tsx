import { notFound } from 'next/navigation'
import { getOrder } from '@/lib/data'
import { OrderDetail } from '@/components/admin/order-detail'

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id)
  if (!order) notFound()
  return <OrderDetail order={order} />
}
