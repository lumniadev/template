import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSettings } from '@/lib/data'

type Props = { params: Promise<{ slug: string }> }

async function findPage(slug: string) {
  return (await getSettings()).pages.find((p) => p.slug === slug) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await findPage((await params).slug)
  return { title: page?.title ?? 'Page not found' }
}

/** Simple text pages (Our story, Shipping & returns, …) managed from Admin → Settings. */
export default async function InfoPage({ params }: Props) {
  const page = await findPage((await params).slug)
  if (!page) notFound()
  return (
    <section className="page-section info-page">
      <div className="breadcrumbs">Home <span>/</span> {page.title}</div>
      <div className="shop-title">
        <div>
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
        </div>
      </div>
      <div className="info-body">{page.body}</div>
    </section>
  )
}
