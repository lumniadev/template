import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="confirmation">
      <span className="eyebrow">404</span>
      <h1>Page not found.</h1>
      <p className="confirm-lede">The page you’re looking for has moved or no longer exists.</p>
      <Link className="primary" href="/shop">Back to the shop</Link>
    </section>
  )
}
