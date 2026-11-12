'use client'

import { useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { login } from '../actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: '' })
  return (
    <form action={action}>
      <label className="field">Password<input type="password" name="password" autoComplete="current-password" required autoFocus /></label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="primary" disabled={pending}>{pending ? 'Checking…' : 'Log in'} <ArrowRight size={16} /></button>
    </form>
  )
}
