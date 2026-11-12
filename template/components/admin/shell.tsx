'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, LayoutDashboard, LogOut, Mail, Menu, Package, Settings, ShoppingBag } from 'lucide-react'
import { logout } from '@/app/admin/actions'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { href: '/admin/settings', label: 'Store settings', icon: Settings },
]

export function AdminShell({ storeName, children }: { storeName: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  return (
    <div className="admin">
      <div className="admin-mobile-bar">
        <span className="brand"><span className="brand-mark">{storeName.charAt(0).toLowerCase()}</span><span>{storeName}</span></span>
        <button aria-label="Open menu" onClick={() => setOpen(!open)}><Menu size={21} /></button>
      </div>
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <span className="brand"><span className="brand-mark">{storeName.charAt(0).toLowerCase()}</span><span>{storeName}</span></span>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={active(href) ? 'active' : ''} onClick={() => setOpen(false)}>
            <Icon size={17} /> {label}
          </Link>
        ))}
        <div className="side-bottom">
          <Link href="/" target="_blank"><ExternalLink size={17} /> View store</Link>
          <form action={logout}><button><LogOut size={17} /> Log out</button></form>
        </div>
      </aside>
      <div className="admin-main" onClick={() => open && setOpen(false)}>{children}</div>
    </div>
  )
}
