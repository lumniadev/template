'use client'

import { useEffect, useState } from 'react'

/** Formats a date in the viewer's own time zone. Rendered after load so server and browser always agree. */
export function LocalDate({ value, mode = 'datetime' }: { value: string; mode?: 'date' | 'datetime' }) {
  const [text, setText] = useState('')
  useEffect(() => {
    const d = new Date(value)
    setText(mode === 'date' ? d.toLocaleDateString() : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))
  }, [value, mode])
  return <>{text || ' '}</>
}

/** Renders children only in the browser (for values that depend on the viewer's clock or time zone). */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready ? <>{children}</> : null
}
