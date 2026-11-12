'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, UserRound, ShoppingBag, Menu, X } from 'lucide-react'
import { useStore } from './store-provider'
import { useGo } from './nav'

function Brand() {
  const { settings } = useStore()
  const go = useGo()
  return (
    <button className="brand" onClick={() => go('/')}>
      <span className="brand-mark">{settings.name.charAt(0).toLowerCase()}</span>
      <span>{settings.name}</span>
    </button>
  )
}

export function Header() {
  const { settings, count } = useStore()
  const go = useGo()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const links = settings.navLinks
  const search = () => go(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : '/shop')

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={pathname === '/shop' ? 'active' : ''} onClick={() => go('/shop')}>Shop</button>
          {links.map((l) => (
            <button key={l.label + l.href} onClick={() => go(l.href)}>{l.label}</button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="search">
            <Search size={16} />
            <input
              aria-label="Search products"
              placeholder="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <button className="icon-btn" aria-label="My orders" title="My orders" onClick={() => go('/account')}><UserRound size={19} /></button>
          <button className="bag-btn" aria-label="Shopping bag" onClick={() => go('/cart')}>
            <ShoppingBag size={19} />
            {count > 0 && <b>{count}</b>}
          </button>
          <button className="menu-btn" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {open && (
        <div className="mobile-nav">
          <button onClick={() => { go('/shop'); setOpen(false) }}>Shop all</button>
          {links.map((l) => (
            <button key={l.label + l.href} onClick={() => { go(l.href); setOpen(false) }}>{l.label}</button>
          ))}
        </div>
      )}
    </header>
  )
}

export function Footer() {
  const { settings } = useStore()
  const go = useGo()
  const columns = [
    { title: 'Explore', links: settings.footer.explore },
    { title: 'Help', links: settings.footer.help },
    { title: 'Follow', links: settings.footer.follow },
  ].filter((c) => c.links.length > 0)

  return (
    <footer>
      <div className="footer-brand">
        <Brand />
        <p>{settings.tagline}</p>
      </div>
      <div className="footer-links">
        {columns.map((c) => (
          <div key={c.title}>
            <b>{c.title}</b>
            {c.links.map((l) => (
              <button key={l.label + l.href} onClick={() => go(l.href)}>{l.label}</button>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {settings.name}</span>
        <span>{settings.footerNote}</span>
      </div>
    </footer>
  )
}
