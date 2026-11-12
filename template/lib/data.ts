import { randomUUID } from 'crypto'
import { ensureSchema, hasDatabase, sql } from './db'
import { defaultSettings, demoProducts } from './defaults'
import { slugify, toStatus } from './format'
import type { Order, OrderStatus, Product, StoreSettings, Subscriber } from './types'

// Every read and write the store makes goes through this file.
// With DATABASE_URL set it uses Neon; otherwise an in-memory copy of the demo store
// (handy for trying things locally — changes are lost when the server restarts).

type Row = Record<string, any>

type Memory = { settings: StoreSettings; products: Product[]; orders: Order[]; subscribers: Subscriber[] }
const g = globalThis as unknown as { __storeMemory?: Memory }
function mem(): Memory {
  if (!g.__storeMemory) {
    g.__storeMemory = {
      settings: structuredClone(defaultSettings),
      products: structuredClone(demoProducts),
      orders: [],
      subscribers: [],
    }
  }
  return g.__storeMemory
}

export { hasDatabase }

// ---------- settings ----------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Fills in any missing settings with defaults (so older databases keep working after updates). */
function withDefaults<T>(base: T, value: unknown): T {
  if (!isObject(base) || !isObject(value)) return (value === undefined || value === null ? base : value) as T
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(value)) out[key] = withDefaults((base as Record<string, unknown>)[key], value[key])
  return out as T
}

export async function getSettings(): Promise<StoreSettings> {
  if (!hasDatabase) return mem().settings
  await ensureSchema()
  const rows = (await sql()`select data from store_settings where id = 1`) as Row[]
  return withDefaults(defaultSettings, rows[0]?.data ?? {})
}

export async function saveSettings(settings: StoreSettings) {
  if (!hasDatabase) {
    mem().settings = settings
    return
  }
  await ensureSchema()
  await sql()`insert into store_settings (id, data, updated_at) values (1, ${JSON.stringify(settings)}::jsonb, now())
    on conflict (id) do update set data = excluded.data, updated_at = now()`
}

// ---------- products ----------

function rowToProduct(r: Row): Product {
  return {
    ...demoProducts[0],
    images: [],
    options: [],
    details: [],
    badge: '',
    compareAtPrice: null,
    ...r.data,
    id: r.id,
    slug: r.slug,
    sortOrder: r.sort_order,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

function sortProducts(list: Product[]) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt))
}

export async function getProducts(): Promise<Product[]> {
  if (!hasDatabase) return sortProducts(mem().products)
  await ensureSchema()
  const rows = (await sql()`select * from products order by sort_order asc, created_at desc`) as Row[]
  return rows.map(rowToProduct)
}

export async function getProductBySlug(slug: string) {
  if (!hasDatabase) return mem().products.find((p) => p.slug === slug) ?? null
  await ensureSchema()
  const rows = (await sql()`select * from products where slug = ${slug}`) as Row[]
  return rows[0] ? rowToProduct(rows[0]) : null
}

export async function getProductById(id: string) {
  if (!hasDatabase) return mem().products.find((p) => p.id === id) ?? null
  await ensureSchema()
  const rows = (await sql()`select * from products where id = ${id}`) as Row[]
  return rows[0] ? rowToProduct(rows[0]) : null
}

async function uniqueSlug(wanted: string, ignoreId?: string) {
  const base = slugify(wanted)
  const taken = new Set((await getProducts()).filter((p) => p.id !== ignoreId).map((p) => p.slug))
  let slug = base
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`
  return slug
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'slug'> & { slug?: string }

export async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
  const slug = await uniqueSlug(input.slug || input.name, id)
  const existing = id ? await getProductById(id) : null
  const product: Product = {
    ...input,
    id: existing?.id ?? randomUUID(),
    slug,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  }
  if (!hasDatabase) {
    const list = mem().products
    const i = list.findIndex((p) => p.id === product.id)
    if (i >= 0) list[i] = product
    else list.push(product)
    return product
  }
  const { id: pid, slug: pslug, sortOrder, createdAt, ...data } = product
  await sql()`insert into products (id, slug, data, sort_order) values (${pid}, ${pslug}, ${JSON.stringify(data)}::jsonb, ${sortOrder})
    on conflict (id) do update set slug = excluded.slug, data = excluded.data, sort_order = excluded.sort_order`
  return product
}

export async function deleteProduct(id: string) {
  if (!hasDatabase) {
    mem().products = mem().products.filter((p) => p.id !== id)
    return
  }
  await ensureSchema()
  await sql()`delete from products where id = ${id}`
}

// ---------- orders ----------

function rowToOrder(r: Row): Order {
  return { ...r.data, id: r.id, number: r.number, status: toStatus(r.status) ?? 'pending', total: r.total, createdAt: new Date(r.created_at).toISOString() }
}

export async function createOrder(order: Omit<Order, 'id' | 'number' | 'status' | 'createdAt'>, prefix: string): Promise<Order> {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5)
  const rand = Math.floor(Math.random() * 90 + 10)
  const full: Order = {
    ...order,
    id: randomUUID(),
    number: `#${(prefix || 'ORD').toUpperCase()}-${stamp}${rand}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  if (!hasDatabase) {
    mem().orders.unshift(full)
    return full
  }
  await ensureSchema()
  const { id, number, status, total, createdAt, ...data } = full
  await sql()`insert into orders (id, number, data, status, total) values (${id}, ${number}, ${JSON.stringify(data)}::jsonb, ${status}, ${total})`
  return full
}

export async function getOrder(id: string) {
  if (!hasDatabase) return mem().orders.find((o) => o.id === id) ?? null
  await ensureSchema()
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const rows = (await sql()`select * from orders where id = ${id}`) as Row[]
  return rows[0] ? rowToOrder(rows[0]) : null
}

export async function listOrders(limit = 200) {
  if (!hasDatabase) return mem().orders.slice(0, limit)
  await ensureSchema()
  const rows = (await sql()`select * from orders order by created_at desc limit ${limit}`) as Row[]
  return rows.map(rowToOrder)
}

export async function getOrderByNumber(number: string) {
  const n = number.trim().toUpperCase().replace(/^#?/, '#')
  if (!hasDatabase) return mem().orders.find((o) => o.number.toUpperCase() === n) ?? null
  await ensureSchema()
  const rows = (await sql()`select * from orders where upper(number) = ${n} limit 1`) as Row[]
  return rows[0] ? rowToOrder(rows[0]) : null
}

/** All orders whose phone number ends with the same last 8 digits (newest first). */
export async function listOrdersByPhone(phone: string, limit = 50) {
  const tail = phone.replace(/\D/g, '').slice(-8)
  if (tail.length < 6) return []
  const matches = (o: Order) => o.customer.phone.replace(/\D/g, '').endsWith(tail)
  if (!hasDatabase) return mem().orders.filter(matches).slice(0, limit)
  await ensureSchema()
  const rows = (await sql()`select * from orders
    where right(regexp_replace(coalesce(data->'customer'->>'phone', ''), '\\D', '', 'g'), ${tail.length}) = ${tail}
    order by created_at desc limit ${limit}`) as Row[]
  return rows.map(rowToOrder)
}

/** Sets a new status and returns the order with its previous status (null if not found). */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<{ order: Order; previous: OrderStatus } | null> {
  const order = await getOrder(id)
  if (!order) return null
  const previous = order.status
  if (!hasDatabase) {
    const o = mem().orders.find((x) => x.id === id)
    if (o) o.status = status
  } else {
    await sql()`update orders set status = ${status} where id = ${id}`
  }
  return { order: { ...order, status }, previous }
}

/** Adds (positive) or removes (negative) units of stock. Products without stock tracking are left alone. */
export async function adjustStock(productId: string, delta: number) {
  if (!delta) return
  if (!hasDatabase) {
    const p = mem().products.find((x) => x.id === productId)
    if (p && p.stock !== null && p.stock !== undefined) p.stock = Math.max(0, p.stock + delta)
    return
  }
  await ensureSchema()
  await sql()`update products
    set data = jsonb_set(data, '{stock}', to_jsonb(greatest((data->>'stock')::int + ${delta}, 0)))
    where id = ${productId} and jsonb_typeof(data->'stock') = 'number'`
}

export async function deleteOrder(id: string) {
  if (!hasDatabase) {
    mem().orders = mem().orders.filter((o) => o.id !== id)
    return
  }
  await ensureSchema()
  await sql()`delete from orders where id = ${id}`
}

// ---------- newsletter ----------

export async function addSubscriber(email: string) {
  if (!hasDatabase) {
    if (!mem().subscribers.some((s) => s.email === email)) mem().subscribers.unshift({ email, createdAt: new Date().toISOString() })
    return
  }
  await ensureSchema()
  await sql()`insert into subscribers (email) values (${email}) on conflict do nothing`
}

export async function listSubscribers(): Promise<Subscriber[]> {
  if (!hasDatabase) return mem().subscribers
  await ensureSchema()
  const rows = (await sql()`select * from subscribers order by created_at desc`) as Row[]
  return rows.map((r) => ({ email: r.email, createdAt: new Date(r.created_at).toISOString() }))
}

export async function deleteSubscriber(email: string) {
  if (!hasDatabase) {
    mem().subscribers = mem().subscribers.filter((s) => s.email !== email)
    return
  }
  await ensureSchema()
  await sql()`delete from subscribers where email = ${email}`
}
