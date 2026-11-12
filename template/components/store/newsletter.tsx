'use client'

import { useState, useTransition } from 'react'
import { ArrowRight } from 'lucide-react'
import { subscribe } from '@/app/(store)/actions'
import { useStore } from './store-provider'

export function Newsletter() {
  const { settings } = useStore()
  const n = settings.newsletter
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await subscribe(email)
      setMessage(res.message)
      if (res.ok) setEmail('')
    })
  }

  return (
    <section className="newsletter">
      <div>
        <span className="eyebrow">{n.eyebrow}</span>
        <h2>{n.line1}<br /><em>{n.line2}</em></h2>
      </div>
      <div>
        <p>{n.text}</p>
        <form className="email-form" onSubmit={submit}>
          <input aria-label="Email address" placeholder="Your email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button aria-label="Subscribe" disabled={pending}><ArrowRight size={18} /></button>
        </form>
        {message && <p className="newsletter-done">{message}</p>}
      </div>
    </section>
  )
}
