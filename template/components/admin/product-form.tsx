'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, ImagePlus, Star, Trash2, Upload } from 'lucide-react'
import { deleteProductAction, saveProductAction } from '@/app/admin/actions'
import { toCents } from '@/lib/format'
import type { Product } from '@/lib/types'
import { Field, ListEditor } from './bits'

type OptionRow = { name: string; valuesText: string }

// One-click option sets so the product page fits whatever the seller sells.
const presets: { label: string; option: OptionRow }[] = [
  { label: 'Clothing sizes', option: { name: 'Size', valuesText: 'XS, S, M, L, XL' } },
  { label: 'Shoe sizes', option: { name: 'Size', valuesText: '38, 39, 40, 41, 42, 43, 44' } },
  { label: 'Colors', option: { name: 'Color', valuesText: 'Black, White, Beige' } },
  { label: 'Volume', option: { name: 'Size', valuesText: '30 ml, 50 ml, 100 ml' } },
  { label: 'Weight', option: { name: 'Weight', valuesText: '250 g, 500 g, 1 kg' } },
  { label: 'Cake sizes', option: { name: 'Size', valuesText: '6 inch, 8 inch, 10 inch' } },
  { label: 'Material', option: { name: 'Material', valuesText: 'Gold, Silver, Rose gold' } },
]

const units = (cents: number | null) => (cents ? String(cents / 100) : '')

export function ProductForm({ product, categories }: { product: Product | null; categories: string[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const [f, setF] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    type: product?.type ?? '',
    category: product?.category ?? '',
    price: units(product?.price ?? 0),
    compareAtPrice: units(product?.compareAtPrice ?? null),
    description: product?.description ?? '',
    badge: product?.badge ?? '',
    inStock: product?.inStock ?? true,
    stock: product?.stock === null || product?.stock === undefined ? '' : String(product.stock),
    featured: product?.featured ?? false,
    rating: String(product?.rating ?? 0),
    reviewCount: String(product?.reviewCount ?? 0),
    sortOrder: String(product?.sortOrder ?? 0),
  })
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [imageUrl, setImageUrl] = useState('')
  const [options, setOptions] = useState<OptionRow[]>((product?.options ?? []).map((o) => ({ name: o.name, valuesText: o.values.join(', ') })))
  const [details, setDetails] = useState(product?.details ?? [])
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }))

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setMsg(null)
    try {
      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')
        setImages((list) => [...list, data.url])
      }
    } catch (e) {
      setMsg({ text: (e as Error).message, err: true })
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const addUrl = () => {
    const u = imageUrl.trim()
    if (!u) return
    setImages((l) => [...l, u])
    setImageUrl('')
  }

  const save = () => {
    setMsg(null)
    start(async () => {
      try {
        const res = await saveProductAction(
          {
            name: f.name,
            slug: f.slug,
            type: f.type,
            category: f.category,
            price: toCents(f.price),
            compareAtPrice: f.compareAtPrice ? toCents(f.compareAtPrice) : null,
            description: f.description,
            badge: f.badge,
            inStock: f.inStock,
            stock: f.stock.trim() === '' ? null : Math.max(0, Math.round(Number(f.stock) || 0)),
            featured: f.featured,
            rating: Number(f.rating) || 0,
            reviewCount: Number(f.reviewCount) || 0,
            sortOrder: Number(f.sortOrder) || 0,
            images,
            details,
            options: options.map((o) => ({ name: o.name, values: o.valuesText.split(',').map((v) => v.trim()).filter(Boolean) })),
          },
          product?.id,
        )
        if (!res.ok) return setMsg({ text: res.error, err: true })
        setF((x) => ({ ...x, slug: res.slug }))
        setMsg({ text: 'Saved ✓' })
        if (!product) router.replace(`/admin/products/${res.id}`)
        router.refresh()
      } catch (e) {
        setMsg({ text: (e as Error).message || 'Could not save.', err: true })
      }
    })
  }

  const remove = () => {
    if (!product || !confirm(`Delete “${product.name}”? This can’t be undone.`)) return
    start(async () => {
      await deleteProductAction(product.id)
      router.replace('/admin/products')
      router.refresh()
    })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save() }}>
      <div className="admin-head">
        <div><span className="eyebrow">Products</span><h1>{product ? product.name : 'New product'}</h1></div>
        <div className="actions">
          {product && <a className="admin-btn" href={`/products/${f.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View in store</a>}
          {product && <button type="button" className="admin-btn danger" onClick={remove} disabled={pending}><Trash2 size={14} /> Delete</button>}
        </div>
      </div>

      <div className="admin-card">
        <h2>Basics</h2>
        <p className="hint">The name and short type appear on product cards and at the top of the product page.</p>
        <div className="admin-grid">
          <Field label="Name" value={f.name} onChange={set('name')} placeholder="e.g. Chocolate Cake" required />
          <Field label="Type" value={f.type} onChange={set('type')} placeholder="e.g. Layer cake" hint="Small line above the name." />
          <label className="field">
            Category
            <input list="categories" value={f.category} onChange={(e) => set('category')(e.target.value)} placeholder="e.g. Cakes" />
            <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            <small>Used for the shop filters and homepage category cards.</small>
          </label>
          <Field label="Badge" value={f.badge} onChange={set('badge')} placeholder="e.g. New, Bestseller" hint="Optional label on the product photo." />
          <Field className="full" label="Description" textarea value={f.description} onChange={set('description')} />
        </div>
      </div>

      <div className="admin-card">
        <h2>Price & availability</h2>
        <div className="admin-grid">
          <Field label="Price" type="number" step="0.01" min={0} value={f.price} onChange={set('price')} placeholder="42" required />
          <Field label="Compare-at price" type="number" step="0.01" min={0} value={f.compareAtPrice} onChange={set('compareAtPrice')} hint="Optional old price, shown crossed out." />
          <Field label="Stock quantity" type="number" min={0} value={f.stock} onChange={set('stock')} placeholder="Unlimited" hint="Leave empty if you don’t count stock. Goes down with each order; sold out at 0." />
          <div className="field" style={{ justifyContent: 'center', gap: 12 }}>
            <label className="check"><input type="checkbox" checked={f.inStock} onChange={(e) => set('inStock')(e.target.checked)} /> Available to buy</label>
            <label className="check"><input type="checkbox" checked={f.featured} onChange={(e) => set('featured')(e.target.checked)} /> Show in “Best sellers”</label>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Photos</h2>
        <p className="hint">The first photo is the cover. With no photos, the store shows its built-in illustration.</p>
        <div className="images">
          {images.map((src, i) => (
            <div className="image-tile" key={src + i}>
              <img src={src} alt="" />
              {i === 0 && <span className="cover">Cover</span>}
              <div className="tile-tools">
                {i > 0 && <button type="button" aria-label="Make cover" onClick={() => setImages((l) => [l[i], ...l.filter((_, k) => k !== i)])}><Star size={13} /></button>}
                <button type="button" aria-label="Remove photo" onClick={() => setImages((l) => l.filter((_, k) => k !== i))}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="image-add">
          <input className="admin-search" placeholder="Paste an image link (https://…)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }} />
          <button type="button" className="admin-btn" onClick={addUrl}><ImagePlus size={14} /> Add link</button>
          <button type="button" className="admin-btn" onClick={() => fileInput.current?.click()} disabled={uploading}><Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}</button>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
      </div>

      <div className="admin-card">
        <h2>Options</h2>
        <p className="hint">Choices the customer picks on the product page — sizes, colors, weights, anything. Separate values with commas.</p>
        <ListEditor
          items={options}
          onChange={setOptions}
          blank={() => ({ name: '', valuesText: '' })}
          addLabel="Add option"
          columns="1fr 2fr"
          render={(o, update) => (
            <>
              <Field label="Option name" value={o.name} onChange={(v) => update({ name: v })} placeholder="Size" />
              <Field label="Values" value={o.valuesText} onChange={(v) => update({ valuesText: v })} placeholder="S, M, L" />
            </>
          )}
        />
        <div className="image-add">
          <span className="muted" style={{ alignSelf: 'center', color: 'var(--muted)' }}>Quick add:</span>
          {presets.map((p) => (
            <button key={p.label} type="button" className="admin-btn small" onClick={() => setOptions((l) => [...l, { ...p.option }])}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h2>Product page sections</h2>
        <p className="hint">Expandable sections under the “Add to bag” button, e.g. “Ingredients”, “Size guide”, “Care”.</p>
        <ListEditor
          items={details}
          onChange={setDetails}
          blank={() => ({ title: '', body: '' })}
          addLabel="Add section"
          render={(d, update) => (
            <div className="admin-grid">
              <Field label="Title" value={d.title} onChange={(v) => update({ title: v })} />
              <Field label="Text" textarea value={d.body} onChange={(v) => update({ body: v })} className="full" />
            </div>
          )}
        />
      </div>

      <div className="admin-card">
        <h2>Extras</h2>
        <div className="admin-grid">
          <Field label="Rating (0–5)" type="number" step="0.1" min={0} max={5} value={f.rating} onChange={set('rating')} hint="Set 0 to hide the stars." />
          <Field label="Number of reviews" type="number" min={0} value={f.reviewCount} onChange={set('reviewCount')} />
          <Field label="Sort order" type="number" value={f.sortOrder} onChange={set('sortOrder')} hint="Lower numbers show first." />
          <Field label="Link name" value={f.slug} onChange={set('slug')} hint={`Store link: /products/${f.slug || 'made-from-the-name'}`} />
        </div>
      </div>

      <div className="save-bar">
        {msg && <span className={`msg ${msg.err ? 'err' : ''}`}>{msg.text}</span>}
        <button className="primary" disabled={pending || uploading}>{pending ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  )
}
