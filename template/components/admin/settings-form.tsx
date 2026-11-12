'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveSettingsAction, syncSheetAction, testEmailAction } from '@/app/admin/actions'
import { toCents } from '@/lib/format'
import type { NavLink, StoreSettings } from '@/lib/types'
import { Field, ListEditor } from './bits'

const tabs = ['Brand', 'Homepage', 'Shop & product', 'Checkout & orders', 'Emails', 'Google Sheet', 'Menus', 'Pages'] as const
type Tab = (typeof tabs)[number]

function LinksEditor({ items, onChange, addLabel }: { items: NavLink[]; onChange: (v: NavLink[]) => void; addLabel: string }) {
  return (
    <ListEditor
      items={items}
      onChange={onChange}
      blank={() => ({ label: '', href: '' })}
      addLabel={addLabel}
      columns="1fr 1.5fr"
      render={(l, update) => (
        <>
          <Field label="Label" value={l.label} onChange={(v) => update({ label: v })} />
          <Field label="Link" value={l.href} onChange={(v) => update({ href: v })} placeholder="/shop, /pages/our-story, https://…" />
        </>
      )}
    />
  )
}

function Copy({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input className="admin-search" readOnly value={value} style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }} onFocus={(e) => e.target.select()} />
      <button type="button" className="admin-btn" onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500) }}>
        {done ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  )
}

function ActionButton({ label, run }: { label: string; run: () => Promise<{ ok: boolean; message: string }> }) {
  const [pending, start] = useTransition()
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button type="button" className="admin-btn" disabled={pending} onClick={() => start(async () => setRes(await run()))}>{pending ? 'Working…' : label}</button>
      {res && <span style={{ color: res.ok ? 'var(--teal)' : '#b3261e', fontWeight: 600 }}>{res.message}</span>}
    </div>
  )
}

export function SettingsForm({ settings, emailEnabled, siteUrl }: { settings: StoreSettings; emailEnabled: boolean; siteUrl: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Brand')
  const [s, setS] = useState<StoreSettings>(settings)
  const [freeOver, setFreeOver] = useState(String(settings.shipping.freeOver / 100))
  const [fee, setFee] = useState(String(settings.shipping.fee / 100))
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null)
  const [pending, start] = useTransition()

  /** Update one section of the settings, e.g. up('hero', { text: '…' }) */
  function up<K extends keyof StoreSettings>(key: K, patch: Partial<StoreSettings[K]> | StoreSettings[K]) {
    setS((x) => ({ ...x, [key]: Array.isArray(patch) || typeof patch !== 'object' ? patch : { ...(x[key] as object), ...patch } }))
  }

  const save = () => {
    setMsg(null)
    start(async () => {
      try {
        const res = await saveSettingsAction({ ...s, shipping: { ...s.shipping, freeOver: toCents(freeOver), fee: toCents(fee) } })
        if (!res.ok) return setMsg({ text: res.error, err: true })
        setMsg({ text: 'Saved ✓ Your store is updated.' })
        router.refresh()
      } catch (e) {
        setMsg({ text: (e as Error).message || 'Could not save.', err: true })
      }
    })
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save() }}>
      <div className="admin-head"><div><span className="eyebrow">Settings</span><h1>Store settings</h1></div></div>
      <div className="admin-tabs">
        {tabs.map((t) => <button type="button" key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Brand' && (
        <>
          <div className="admin-card">
            <h2>Store identity</h2>
            <p className="hint">Shown in the header, footer, browser tab and search results.</p>
            <div className="admin-grid">
              <Field label="Store name" value={s.name} onChange={(v) => up('name', v)} />
              <Field label="Tagline" value={s.tagline} onChange={(v) => up('tagline', v)} hint="Under the logo in the footer." />
              <Field label="Footer note" value={s.footerNote} onChange={(v) => up('footerNote', v)} />
              <Field label="Search description" value={s.description} onChange={(v) => up('description', v)} hint="What Google shows under your store name." />
            </div>
          </div>
          <div className="admin-card">
            <h2>Colors</h2>
            <p className="hint">The main color is used for buttons, links and highlights.</p>
            <div className="admin-grid">
              <Field label="Main color" type="color" value={s.colors.main} onChange={(v) => up('colors', { main: v })} />
              <Field label="Text color" type="color" value={s.colors.text} onChange={(v) => up('colors', { text: v })} />
            </div>
          </div>
          <div className="admin-card">
            <h2>Money & language</h2>
            <div className="admin-grid">
              <Field label="Currency code" value={s.currency} onChange={(v) => up('currency', v.toUpperCase())} hint="e.g. USD, EUR, GBP, AED, SAR, EGP, MAD" />
              <Field label="Language / region" value={s.locale} onChange={(v) => up('locale', v)} hint="Controls number and date format, e.g. en-US, en-GB, fr-FR, ar-AE" />
            </div>
          </div>
        </>
      )}

      {tab === 'Homepage' && (
        <>
          <div className="admin-card">
            <h2>Hero</h2>
            <div className="admin-grid">
              <Field label="Small label" value={s.hero.eyebrow} onChange={(v) => up('hero', { eyebrow: v })} />
              <Field label="Button text" value={s.hero.button} onChange={(v) => up('hero', { button: v })} />
              <Field label="Headline line 1" value={s.hero.titleLine1} onChange={(v) => up('hero', { titleLine1: v })} />
              <Field label="Headline line 2 (italic)" value={s.hero.titleLine2} onChange={(v) => up('hero', { titleLine2: v })} />
              <Field className="full" label="Text" textarea value={s.hero.text} onChange={(v) => up('hero', { text: v })} />
              <Field label="Social proof note" value={s.hero.note} onChange={(v) => up('hero', { note: v })} hint="Leave empty to hide." />
              <Field label="Hero image link" value={s.hero.image} onChange={(v) => up('hero', { image: v })} hint="Optional. Empty shows the illustration." />
            </div>
          </div>
          <div className="admin-card">
            <h2>Trust strip</h2>
            <p className="hint">Three short promises under the hero (shipping, returns, quality).</p>
            <div className="list-rows">
              {[0, 1, 2].map((i) => (
                <div className="list-row" key={i} style={{ gridTemplateColumns: '1fr 1.5fr' }}>
                  <Field label={`Title ${i + 1}`} value={s.trust[i]?.title ?? ''} onChange={(v) => up('trust', [0, 1, 2].map((k) => (k === i ? { ...(s.trust[k] ?? { text: '' }), title: v } : s.trust[k] ?? { title: '', text: '' })))} />
                  <Field label="Text" value={s.trust[i]?.text ?? ''} onChange={(v) => up('trust', [0, 1, 2].map((k) => (k === i ? { ...(s.trust[k] ?? { title: '' }), text: v } : s.trust[k] ?? { title: '', text: '' })))} />
                </div>
              ))}
            </div>
          </div>
          <div className="admin-card">
            <h2>Category cards</h2>
            <p className="hint">Three big cards that open the shop filtered to a category. Use a new line in the title to split it.</p>
            <div className="admin-grid" style={{ marginBottom: 14 }}>
              <Field label="Section label" value={s.categoriesSection.eyebrow} onChange={(v) => up('categoriesSection', { eyebrow: v })} />
              <Field label="Section title" value={s.categoriesSection.title} onChange={(v) => up('categoriesSection', { title: v })} />
            </div>
            <div className="list-rows">
              {[0, 1, 2].map((i) => {
                const card = s.categoryCards[i] ?? { label: '', title: '', category: '' }
                const set = (patch: Partial<typeof card>) => up('categoryCards', [0, 1, 2].map((k) => (k === i ? { ...card, ...patch } : s.categoryCards[k] ?? { label: '', title: '', category: '' })))
                return (
                  <div className="list-row" key={i} style={{ gridTemplateColumns: '1fr 1.4fr 1fr' }}>
                    <Field label={`Card ${i + 1} label`} value={card.label} onChange={(v) => set({ label: v })} />
                    <Field label="Title" textarea value={card.title} onChange={(v) => set({ title: v })} />
                    <Field label="Opens category" value={card.category} onChange={(v) => set({ category: v })} hint="Must match a product category." />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="admin-card">
            <h2>Best sellers & newsletter</h2>
            <p className="hint">Best sellers shows products marked “Show in Best sellers”.</p>
            <div className="admin-grid">
              <Field label="Best sellers label" value={s.bestSellers.eyebrow} onChange={(v) => up('bestSellers', { eyebrow: v })} />
              <Field label="Best sellers title" value={s.bestSellers.title} onChange={(v) => up('bestSellers', { title: v })} />
              <Field label="Newsletter label" value={s.newsletter.eyebrow} onChange={(v) => up('newsletter', { eyebrow: v })} />
              <Field label="Newsletter line 1" value={s.newsletter.line1} onChange={(v) => up('newsletter', { line1: v })} />
              <Field label="Newsletter line 2 (italic)" value={s.newsletter.line2} onChange={(v) => up('newsletter', { line2: v })} />
              <Field label="Newsletter text" value={s.newsletter.text} onChange={(v) => up('newsletter', { text: v })} />
            </div>
          </div>
        </>
      )}

      {tab === 'Shop & product' && (
        <>
          <div className="admin-card">
            <h2>Shop page</h2>
            <div className="admin-grid">
              <Field label="Label" value={s.shop.eyebrow} onChange={(v) => up('shop', { eyebrow: v })} />
              <Field label="Title" value={s.shop.title} onChange={(v) => up('shop', { title: v })} />
              <Field className="full" label="Text" value={s.shop.text} onChange={(v) => up('shop', { text: v })} />
            </div>
          </div>
          <div className="admin-card">
            <h2>Product page</h2>
            <div className="admin-grid">
              <Field label="In-stock message" value={s.productPage.stockText} onChange={(v) => up('productPage', { stockText: v })} />
              <Field label="Shipping section title" value={s.productPage.shippingTitle} onChange={(v) => up('productPage', { shippingTitle: v })} />
              <Field className="full" label="Shipping section text" textarea value={s.productPage.shippingText} onChange={(v) => up('productPage', { shippingText: v })} hint="Shown on every product. Leave empty to hide." />
              <Field label="Related products label" value={s.productPage.alsoEyebrow} onChange={(v) => up('productPage', { alsoEyebrow: v })} />
              <Field label="Related products title" value={s.productPage.alsoTitle} onChange={(v) => up('productPage', { alsoTitle: v })} />
            </div>
          </div>
        </>
      )}

      {tab === 'Checkout & orders' && (
        <>
          <div className="admin-card">
            <h2>How orders reach you</h2>
            <p className="hint">Every order arrives as <b>Pending</b> in Admin → Orders (and your Google Sheet). Call the customer, then change the status.</p>
            <div className="admin-grid">
              <label className="check full"><input type="checkbox" checked={s.orders.requirePhone} onChange={(e) => up('orders', { requirePhone: e.target.checked })} /> Phone number is required at checkout (so you can call to confirm)</label>
              <label className="field">
                After checkout, also let the customer…
                <select value={s.orders.method} onChange={(e) => up('orders', { method: e.target.value as StoreSettings['orders']['method'] })}>
                  <option value="none">Nothing extra — we call them</option>
                  <option value="whatsapp">Send the order to us on WhatsApp</option>
                  <option value="email">Email the order to us</option>
                </select>
              </label>
              <Field label="Store phone" value={s.contact.phone} onChange={(v) => up('contact', { phone: v })} hint="Shown in the “we couldn’t reach you” email." />
              <Field label="Order number prefix" value={s.orders.prefix} onChange={(v) => up('orders', { prefix: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) })} hint="e.g. AQF → #AQF-1A2B3" />
              <Field label="WhatsApp number" value={s.contact.whatsapp} onChange={(v) => up('contact', { whatsapp: v })} placeholder="+1 555 123 4567" hint="With country code." />
              <Field label="Store email" type="email" value={s.contact.email} onChange={(v) => up('contact', { email: v })} />
            </div>
          </div>
          <div className="admin-card">
            <h2>Shipping</h2>
            <div className="admin-grid">
              <Field label="Shipping fee" type="number" step="0.01" min={0} value={fee} onChange={setFee} hint="Set 0 for always-free shipping." />
              <Field label="Free shipping over" type="number" step="0.01" min={0} value={freeOver} onChange={setFreeOver} hint="Set 0 to turn off." />
              <Field label="Delivery: min days" type="number" min={0} value={s.shipping.minDays} onChange={(v) => up('shipping', { minDays: Number(v) })} />
              <Field label="Delivery: max days" type="number" min={0} value={s.shipping.maxDays} onChange={(v) => up('shipping', { maxDays: Number(v) })} />
            </div>
          </div>
          <div className="admin-card">
            <h2>Promo codes</h2>
            <p className="hint">Percentage discounts customers enter in the bag. Remove all codes to hide the promo box.</p>
            <ListEditor
              items={s.promoCodes}
              onChange={(v) => up('promoCodes', v)}
              blank={() => ({ code: '', percent: 10 })}
              addLabel="Add code"
              columns="1fr 1fr"
              render={(p, update) => (
                <>
                  <Field label="Code" value={p.code} onChange={(v) => update({ code: v.toUpperCase() })} />
                  <Field label="Percent off" type="number" min={1} max={100} value={p.percent} onChange={(v) => update({ percent: Number(v) })} />
                </>
              )}
            />
          </div>
          <div className="admin-card">
            <h2>Messages</h2>
            <div className="admin-grid">
              <Field label="Under the checkout button" value={s.cart.secureNote} onChange={(v) => up('cart', { secureNote: v })} />
              <Field label="Confirmation title" value={s.confirmation.title} onChange={(v) => up('confirmation', { title: v })} />
              <Field className="full" label="Confirmation text" textarea value={s.confirmation.text} onChange={(v) => up('confirmation', { text: v })} />
            </div>
          </div>
        </>
      )}

      {tab === 'Emails' && (
        <div className="admin-card">
          <h2>Order emails</h2>
          {emailEnabled ? (
            <p className="hint">Emails are on (Resend is connected).</p>
          ) : (
            <p className="admin-note">Emails are off. Create a free account at resend.com, then add <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> in Vercel → Settings → Environment Variables and redeploy. See the README for details.</p>
          )}
          <div className="admin-grid">
            <Field label="Send new-order alerts to" type="email" value={s.notifications.sellerEmail} onChange={(v) => up('notifications', { sellerEmail: v })} placeholder={s.contact.email} hint="Leave empty to use the store email." />
            <div />
            <label className="check full"><input type="checkbox" checked={s.notifications.emailCustomer} onChange={(e) => up('notifications', { emailCustomer: e.target.checked })} /> Email the customer an “order received” confirmation</label>
            <label className="check full"><input type="checkbox" checked={s.notifications.emailOnStatus} onChange={(e) => up('notifications', { emailOnStatus: e.target.checked })} /> Email the customer when the status changes (confirmed, no answer, shipped, delivered, cancelled)</label>
            <div className="full"><ActionButton label="Send a test email" run={testEmailAction} /><small style={{ color: 'var(--muted)' }}>Save first if you changed the email above.</small></div>
          </div>
        </div>
      )}

      {tab === 'Google Sheet' && (
        <div className="admin-card">
          <h2>Google Sheet</h2>
          <p className="hint">New orders appear in your sheet automatically. Change the Status in the sheet after calling the customer, and the store updates too — or change it here, and the sheet updates.</p>
          <ol style={{ lineHeight: 1.9, paddingLeft: 18, margin: '0 0 18px', listStyle: 'decimal' }}>
            <li>Create a Google Sheet → <b>Extensions → Apps Script</b>.</li>
            <li>Paste the code from <code>google-sheet/orders-sync.gs</code> (included with the template).</li>
            <li>In the code, set <b>STORE_URL</b> and <b>SECRET</b> to these:</li>
          </ol>
          <div className="admin-grid">
            <div className="field">STORE_URL<Copy value={siteUrl} /></div>
            <div className="field">SECRET<Copy value={s.sheet.secret} /></div>
          </div>
          <ol start={4} style={{ lineHeight: 1.9, paddingLeft: 18, margin: '18px 0', listStyle: 'decimal' }}>
            <li>Run the <b>setup</b> function once and allow access.</li>
            <li><b>Deploy → New deployment → Web app</b> (Execute as: Me · Who has access: Anyone). Paste the link below and save.</li>
          </ol>
          <div className="admin-grid">
            <Field className="full" label="Web app link" value={s.sheet.url} onChange={(v) => up('sheet', { url: v })} placeholder="https://script.google.com/macros/s/…/exec" />
            <div className="full"><ActionButton label="Test & send all orders to the sheet" run={syncSheetAction} /></div>
          </div>
        </div>
      )}

      {tab === 'Menus' && (
        <>
          <div className="admin-card">
            <h2>Header menu</h2>
            <p className="hint">“Shop” is always first. Add more links after it.</p>
            <LinksEditor items={s.navLinks} onChange={(v) => up('navLinks', v)} addLabel="Add link" />
          </div>
          <div className="admin-card"><h2>Footer · Explore</h2><p className="hint" /><LinksEditor items={s.footer.explore} onChange={(v) => up('footer', { explore: v })} addLabel="Add link" /></div>
          <div className="admin-card"><h2>Footer · Help</h2><p className="hint" /><LinksEditor items={s.footer.help} onChange={(v) => up('footer', { help: v })} addLabel="Add link" /></div>
          <div className="admin-card"><h2>Footer · Follow</h2><p className="hint">Your social media links.</p><LinksEditor items={s.footer.follow} onChange={(v) => up('footer', { follow: v })} addLabel="Add link" /></div>
        </>
      )}

      {tab === 'Pages' && (
        <div className="admin-card">
          <h2>Text pages</h2>
          <p className="hint">Simple pages like “Our story” or “Shipping & returns”. Each one lives at /pages/link-name — link to it from the menus.</p>
          <ListEditor
            items={s.pages}
            onChange={(v) => up('pages', v)}
            blank={() => ({ slug: '', eyebrow: '', title: '', body: '' })}
            addLabel="Add page"
            render={(p, update) => (
              <div className="admin-grid">
                <Field label="Title" value={p.title} onChange={(v) => update({ title: v })} />
                <Field label="Link name" value={p.slug} onChange={(v) => update({ slug: v })} hint={`/pages/${p.slug || 'link-name'}`} />
                <Field label="Small label" value={p.eyebrow} onChange={(v) => update({ eyebrow: v })} />
                <Field className="full" label="Text" textarea value={p.body} onChange={(v) => update({ body: v })} />
              </div>
            )}
          />
        </div>
      )}

      <div className="save-bar">
        {msg && <span className={`msg ${msg.err ? 'err' : ''}`}>{msg.text}</span>}
        <button className="primary" disabled={pending}>{pending ? 'Saving…' : 'Save settings'}</button>
      </div>
    </form>
  )
}
