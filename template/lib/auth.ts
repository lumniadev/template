import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

// Simple password login for the admin panel.
// Set ADMIN_PASSWORD in Vercel. Locally (npm run dev) it falls back to "admin".

const COOKIE = 'store_admin'

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'admin' : '')
}

function sessionToken(password: string) {
  return createHmac('sha256', password).update('store-admin-session-v1').digest('hex')
}

function same(a: string, b: string) {
  const x = createHash('sha256').update(a).digest()
  const y = createHash('sha256').update(b).digest()
  return timingSafeEqual(x, y)
}

export function checkPassword(input: string) {
  const pw = adminPassword()
  return Boolean(pw) && same(input, pw)
}

export async function isAdmin() {
  const pw = adminPassword()
  if (!pw) return false
  const value = (await cookies()).get(COOKIE)?.value
  return Boolean(value) && same(value!, sessionToken(pw))
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Please log in to the admin panel again.')
}

export async function startSession() {
  ;(await cookies()).set(COOKIE, sessionToken(adminPassword()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}
