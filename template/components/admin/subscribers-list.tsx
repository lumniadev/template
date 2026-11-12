'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2 } from 'lucide-react'
import { deleteSubscriberAction } from '@/app/admin/actions'
import type { Subscriber } from '@/lib/types'
import { LocalDate } from '@/components/store/local-date'

export function SubscribersList({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const exportCsv = () => {
    const csv = 'email,subscribed_at\n' + subscribers.map((s) => `${s.email},${s.createdAt}`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const remove = (email: string) => {
    if (!confirm(`Remove ${email}?`)) return
    start(async () => {
      await deleteSubscriberAction(email)
      router.refresh()
    })
  }

  return (
    <div className="admin-card">
      <h2>{subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'}</h2>
      <p className="hint">People who joined from the newsletter box on your homepage. Export them to use in Mailchimp, Brevo or any email tool.</p>
      {subscribers.length > 0 && <button className="admin-btn" onClick={exportCsv} style={{ marginBottom: 14 }}><Download size={14} /> Export CSV</button>}
      {subscribers.length === 0 ? (
        <p className="empty">No subscribers yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Email</th><th className="hide-sm">Joined</th><th /></tr></thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.email}>
                <td>{s.email}</td>
                <td className="hide-sm muted"><LocalDate value={s.createdAt} mode="date" /></td>
                <td className="num"><button className="icon-tool danger" aria-label={`Remove ${s.email}`} onClick={() => remove(s.email)} disabled={pending}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
