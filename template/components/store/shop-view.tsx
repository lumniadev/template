'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductGrid } from './product-card'
import { useStore } from './store-provider'
import { useGo } from './nav'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'name'
const sortLabels: Record<Sort, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  newest: 'Newest',
  name: 'Name',
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export function ShopView({ products, initialQuery, initialCategory }: { products: Product[]; initialQuery: string; initialCategory: string }) {
  const { settings: s, money } = useStore()
  const go = useGo()
  const [query, setQuery] = useState(initialQuery)
  const [categories, setCategories] = useState<string[]>(initialCategory ? [initialCategory] : [])
  const [types, setTypes] = useState<string[]>([])
  const [price, setPrice] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort>('featured')
  const [openFilter, setOpenFilter] = useState<string | null>(initialCategory ? 'Category' : null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Option filters are built from the products themselves (Size, Color, …).
  const optionNames = unique(products.flatMap((p) => p.options.map((o) => o.name)))
  const [optionPicks, setOptionPicks] = useState<Record<string, string[]>>({})

  const priceRanges = useMemo(() => {
    const max = Math.max(0, ...products.map((p) => p.price))
    const step = max <= 10000 ? 2500 : max <= 40000 ? 10000 : 50000
    const ranges: { label: string; min: number; max: number }[] = []
    for (let lo = 0; lo < max; lo += step) {
      ranges.push({ label: lo === 0 ? `Under ${money(step)}` : `${money(lo)} – ${money(lo + step)}`, min: lo, max: lo + step })
    }
    return ranges
  }, [products, money])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = products.filter((p) => {
      if (q && ![p.name, p.type, p.category, p.description].join(' ').toLowerCase().includes(q)) return false
      if (categories.length && !categories.includes(p.category)) return false
      if (types.length && !types.includes(p.type)) return false
      if (price !== null) {
        const r = priceRanges[price]
        if (r && (p.price < r.min || p.price >= r.max)) return false
      }
      for (const [name, picks] of Object.entries(optionPicks)) {
        if (!picks.length) continue
        const opt = p.options.find((o) => o.name === name)
        if (!opt || !opt.values.some((v) => picks.includes(v))) return false
      }
      return true
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'newest') list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'featured') list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured))
    return list
  }, [products, query, categories, types, price, priceRanges, optionPicks, sort])

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const clearAll = () => {
    setQuery('')
    setCategories([])
    setTypes([])
    setPrice(null)
    setOptionPicks({})
    if (initialQuery || initialCategory) go('/shop')
  }

  const groups: { name: string; options: string[]; selected: string[]; onToggle: (v: string) => void }[] = [
    { name: 'Category', options: unique(products.map((p) => p.category)), selected: categories, onToggle: (v: string) => setCategories((c) => toggle(c, v)) },
    { name: 'Product type', options: unique(products.map((p) => p.type)), selected: types, onToggle: (v: string) => setTypes((t) => toggle(t, v)) },
    ...optionNames.map((name) => ({
      name,
      options: unique(products.flatMap((p) => p.options.filter((o) => o.name === name).flatMap((o) => o.values))),
      selected: optionPicks[name] ?? [],
      onToggle: (v: string) => setOptionPicks((o) => ({ ...o, [name]: toggle(o[name] ?? [], v) })),
    })),
  ].filter((g) => g.options.length > 0)

  return (
    <section className="page-section shop-page">
      <div className="breadcrumbs">Home <span>/</span> Shop all{query && <> <span>/</span> “{query}”</>}</div>
      <div className="shop-title">
        <div>
          <span className="eyebrow">{s.shop.eyebrow}</span>
          <h1>{s.shop.title}</h1>
          <p>{s.shop.text}</p>
        </div>
        <button className="filter-mobile" onClick={() => setMobileOpen(!mobileOpen)}><SlidersHorizontal size={16} /> Filters</button>
      </div>
      <div className="shop-layout">
        <aside className={`filters ${mobileOpen ? 'open' : ''}`}>
          <div className="filter-head"><strong>Filters</strong><button className="filter-clear" onClick={clearAll}>Clear all</button></div>
          {groups.map((g) => (
            <div key={g.name}>
              <button className="filter-row" onClick={() => setOpenFilter(openFilter === g.name ? null : g.name)} aria-expanded={openFilter === g.name}>
                <span>{g.name}{g.selected.length > 0 && ` (${g.selected.length})`}</span>
                <ChevronDown size={16} />
              </button>
              {openFilter === g.name && (
                <div className="filter-options">
                  {g.options.map((o) => (
                    <label key={o}><input type="checkbox" checked={g.selected.includes(o)} onChange={() => g.onToggle(o)} /> {o}</label>
                  ))}
                </div>
              )}
            </div>
          ))}
          {priceRanges.length > 1 && (
            <div>
              <button className="filter-row" onClick={() => setOpenFilter(openFilter === 'Price' ? null : 'Price')} aria-expanded={openFilter === 'Price'}>
                <span>Price{price !== null && ' (1)'}</span>
                <ChevronDown size={16} />
              </button>
              {openFilter === 'Price' && (
                <div className="filter-options">
                  {priceRanges.map((r, i) => (
                    <label key={r.label}><input type="radio" name="price" checked={price === i} onChange={() => setPrice(i)} /> {r.label}</label>
                  ))}
                  {price !== null && <button className="filter-clear" onClick={() => setPrice(null)}>Any price</button>}
                </div>
              )}
            </div>
          )}
        </aside>
        <div className="shop-results">
          <div className="results-bar">
            <span>{results.length} {results.length === 1 ? 'product' : 'products'}</span>
            <span className="sort-wrap">
              <button tabIndex={-1}>Sort: {sortLabels[sort]} <ChevronDown size={15} /></button>
              <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {Object.entries(sortLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </span>
          </div>
          {results.length > 0 ? (
            <ProductGrid products={results} />
          ) : (
            <div className="empty-bag">No products match your search. <button className="text-button" onClick={clearAll}>Clear filters</button></div>
          )}
        </div>
      </div>
    </section>
  )
}
