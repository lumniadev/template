'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { formatMoney } from '@/lib/format'
import type { StoreSettings } from '@/lib/types'

export type CartItem = {
  key: string
  productId: string
  slug: string
  name: string
  type: string
  image: string
  price: number
  options: Record<string, string>
  qty: number
}

type StoreContextValue = {
  settings: StoreSettings
  money: (cents: number) => string
  items: CartItem[]
  count: number
  ready: boolean
  add: (item: Omit<CartItem, 'key' | 'qty'>, qty: number) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
  promoCode: string
  setPromoCode: (code: string) => void
  saved: string[]
  toggleSaved: (productId: string) => void
  /** Customer details remembered on this device (for "My orders" and a pre-filled checkout). */
  customer: SavedCustomer | null
  rememberCustomer: (c: SavedCustomer) => void
  forgetCustomer: () => void
}

export type SavedCustomer = { name: string; phone: string; email: string; address: string; city: string }

const StoreContext = createContext<StoreContextValue | null>(null)

const CART_KEY = 'store-cart-v1'
const SAVED_KEY = 'store-saved-v1'
const PROMO_KEY = 'store-promo-v1'
const CUSTOMER_KEY = 'store-customer-v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function StoreProvider({ settings, children }: { settings: StoreSettings; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [promoCode, setPromo] = useState('')
  const [customer, setCustomer] = useState<SavedCustomer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(read(CART_KEY, []))
    setSaved(read(SAVED_KEY, []))
    setPromo(read(PROMO_KEY, ''))
    setCustomer(read<SavedCustomer | null>(CUSTOMER_KEY, null))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) write(CART_KEY, items)
  }, [items, ready])
  useEffect(() => {
    if (ready) write(SAVED_KEY, saved)
  }, [saved, ready])
  useEffect(() => {
    if (ready) write(PROMO_KEY, promoCode)
  }, [promoCode, ready])

  const add = useCallback((item: Omit<CartItem, 'key' | 'qty'>, qty: number) => {
    const key = `${item.productId}|${JSON.stringify(item.options)}`
    setItems((list) => {
      const found = list.find((i) => i.key === key)
      if (found) return list.map((i) => (i.key === key ? { ...i, ...item, qty: i.qty + qty } : i))
      return [...list, { ...item, key, qty }]
    })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((list) => (qty <= 0 ? list.filter((i) => i.key !== key) : list.map((i) => (i.key === key ? { ...i, qty } : i))))
  }, [])

  const value = useMemo<StoreContextValue>(
    () => ({
      settings,
      money: (c) => formatMoney(c, settings.currency, settings.locale),
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      ready,
      add,
      setQty,
      clear: () => {
        setItems([])
        setPromo('')
      },
      promoCode,
      setPromoCode: setPromo,
      saved,
      toggleSaved: (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
      customer,
      rememberCustomer: (c) => {
        setCustomer(c)
        write(CUSTOMER_KEY, c)
      },
      forgetCustomer: () => {
        setCustomer(null)
        try {
          localStorage.removeItem(CUSTOMER_KEY)
        } catch {}
      },
    }),
    [settings, items, ready, add, setQty, promoCode, saved, customer],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
