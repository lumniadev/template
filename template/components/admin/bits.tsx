'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { ProductImage } from '@/components/store/product-visual'

export function Field({
  label, hint, value, onChange, type = 'text', placeholder, className, textarea, ...rest
}: {
  label: string
  hint?: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  className?: string
  textarea?: boolean
  step?: string
  min?: number
  max?: number
  required?: boolean
}) {
  return (
    <label className={`field ${className ?? ''}`}>
      {label}
      {textarea ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  )
}

/** Editable list of rows with add / remove / reorder. */
export function ListEditor<T>({
  items, onChange, blank, render, addLabel, columns = '1fr',
}: {
  items: T[]
  onChange: (items: T[]) => void
  blank: () => T
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode
  addLabel: string
  columns?: string
}) {
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="list-rows">
      {items.map((item, i) => (
        <div className="list-row" key={i} style={{ gridTemplateColumns: `${columns} auto` }}>
          {render(item, (patch) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x))), i)}
          <div className="row-tools">
            <button type="button" className="icon-tool" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
            <button type="button" className="icon-tool" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
            <button type="button" className="icon-tool danger" aria-label="Remove" onClick={() => onChange(items.filter((_, k) => k !== i))}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <div><button type="button" className="admin-btn small" onClick={() => onChange([...items, blank()])}><Plus size={14} /> {addLabel}</button></div>
    </div>
  )
}

export function Thumb({ src, alt }: { src?: string; alt: string }) {
  return <div className="admin-thumb"><ProductImage src={src} alt={alt} small /></div>
}
