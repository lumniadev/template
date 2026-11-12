import type { Metadata } from 'next'
import { TrackView } from '@/components/store/track-view'

export const metadata: Metadata = { title: 'Track your order', robots: { index: false } }

export default async function TrackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await searchParams
  return <TrackView initialNumber={typeof p.number === 'string' ? p.number : ''} />
}
