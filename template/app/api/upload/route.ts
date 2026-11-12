import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'

// Image uploads from the admin panel go to Vercel Blob (free tier available).
// Turn it on in Vercel: Storage → Create → Blob, then connect it to this project.
// That adds BLOB_READ_WRITE_TOKEN automatically.

const MAX_BYTES = 4 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Uploads need Vercel Blob. Connect Blob storage in Vercel, or paste an image link instead.' },
      { status: 400 },
    )
  }
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 })
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: 'Please upload a JPG, PNG, WebP, GIF or AVIF image.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Images must be under 4 MB.' }, { status: 400 })

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-80) || 'image'
  const blob = await put(`products/${safeName}`, file, { access: 'public', addRandomSuffix: true, contentType: file.type })
  return NextResponse.json({ url: blob.url })
}
