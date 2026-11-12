import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getOrder } from '@/lib/data'
import { ConfirmationView } from '@/components/store/confirmation-view'

export const metadata: Metadata = { title: 'Order received', robots: { index: false } }

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id)
  if (!order) notFound()
  return <ConfirmationView order={order} />
}
