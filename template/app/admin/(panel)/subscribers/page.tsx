import { listSubscribers } from '@/lib/data'
import { SubscribersList } from '@/components/admin/subscribers-list'

export default async function SubscribersPage() {
  const subscribers = await listSubscribers()
  return (
    <>
      <div className="admin-head"><div><span className="eyebrow">Newsletter</span><h1>Subscribers</h1></div></div>
      <SubscribersList subscribers={subscribers} />
    </>
  )
}
