import { listOrders } from '@/lib/data'
import { OrdersList } from '@/components/admin/orders-list'

export default async function OrdersPage() {
  const orders = await listOrders(500)
  return (
    <>
      <div className="admin-head"><div><span className="eyebrow">Sales</span><h1>Orders</h1></div></div>
      <OrdersList orders={orders} />
    </>
  )
}
