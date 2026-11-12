import { neon } from '@neondatabase/serverless'
import { defaultSettings, demoProducts } from './defaults'

// Neon (hosted PostgreSQL) connection.
// Set DATABASE_URL in Vercel (the Neon integration does this for you).
// Without it the store still runs, using demo data kept in memory.

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

export const hasDatabase = Boolean(url)

let client: ReturnType<typeof neon> | null = null

export function sql() {
  if (!client) client = neon(url)
  return client
}

let ready: Promise<void> | null = null

/** Creates the tables on first use and fills a brand-new database with the demo store. */
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      const q = sql()
      await q`create table if not exists store_settings (
        id int primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )`
      await q`create table if not exists products (
        id text primary key,
        slug text unique not null,
        data jsonb not null,
        sort_order int not null default 0,
        created_at timestamptz not null default now()
      )`
      await q`create table if not exists orders (
        id text primary key,
        number text not null,
        data jsonb not null,
        status text not null default 'pending',
        total int not null,
        created_at timestamptz not null default now()
      )`
      await q`create table if not exists subscribers (
        email text primary key,
        created_at timestamptz not null default now()
      )`

      // Seed only once: a fresh database has no settings row yet.
      const inserted = (await q`insert into store_settings (id, data) values (1, ${JSON.stringify(defaultSettings)}::jsonb)
        on conflict (id) do nothing returning id`) as { id: number }[]
      if (inserted.length > 0) {
        for (const p of demoProducts) {
          const { id, slug, sortOrder, createdAt, ...data } = p
          await q`insert into products (id, slug, data, sort_order) values (${id}, ${slug}, ${JSON.stringify(data)}::jsonb, ${sortOrder})
            on conflict do nothing`
        }
      }
    })().catch((err) => {
      ready = null
      throw err
    })
  }
  return ready
}
