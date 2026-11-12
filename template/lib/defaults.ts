import type { Product, StoreSettings } from './types'

// These are the starting settings and demo products.
// Sellers change all of this from the admin panel (/admin) — no code needed.
// The first time the store connects to an empty database, these are copied into it.

export const defaultSettings: StoreSettings = {
  name: 'aquaform',
  tagline: 'Good skin, made simple.',
  footerNote: 'Made for skin, made for you.',
  description: 'Hydration-first skincare for your everyday ritual.',
  currency: 'USD',
  locale: 'en-US',
  colors: { main: '#0e7c86', text: '#123f45' },
  navLinks: [
    { label: 'Rituals', href: '/shop?category=Hydrate' },
    { label: 'Our story', href: '/pages/our-story' },
  ],
  hero: {
    eyebrow: 'Skin, simplified',
    titleLine1: 'Good skin days,',
    titleLine2: 'every day.',
    text: 'Thoughtful skincare for your everyday ritual. Hydration-first formulas, made to feel as good as they work.',
    button: 'Shop the collection',
    note: 'Loved by 12,000+ skin minimalists',
    image: '',
  },
  trust: [
    { title: 'Free shipping', text: 'on orders over $60' },
    { title: '30-day returns', text: 'no questions asked' },
    { title: 'Derm tested', text: 'always gentle' },
  ],
  categoriesSection: { eyebrow: 'The essentials', title: 'Your new ritual' },
  categoryCards: [
    { label: '01 / Hydrate', title: 'Water, but\nfor your skin.', category: 'Hydrate' },
    { label: '02 / Protect', title: 'Your daily\ncloud cover.', category: 'Protect' },
    { label: '03 / Glow', title: 'Soft light,\nall yours.', category: 'Glow' },
  ],
  bestSellers: { eyebrow: 'Made for you', title: 'Best sellers' },
  newsletter: {
    eyebrow: 'A little something good',
    line1: 'Make space for',
    line2: 'your ritual.',
    text: 'Join our list for skin notes, soft launches, and 10% off your first order.',
  },
  shop: { eyebrow: 'The collection', title: 'Find your flow.', text: 'Simple, effective essentials for skin that feels like itself.' },
  productPage: {
    stockText: 'In stock — ships today',
    shippingTitle: 'Shipping & returns',
    shippingText: 'Free shipping over $60 and easy 30-day returns.',
    alsoEyebrow: 'Complete the ritual',
    alsoTitle: 'You may also like',
  },
  cart: { secureNote: 'Pay on delivery · Free returns' },
  confirmation: {
    title: 'You’re in good hands.',
    text: 'Thanks for choosing a softer kind of skincare. We’ll call you shortly to confirm your order.',
  },
  shipping: { freeOver: 6000, fee: 500, minDays: 3, maxDays: 5 },
  promoCodes: [{ code: 'WELCOME10', percent: 10 }],
  orders: { prefix: 'AQF', method: 'none', requirePhone: true },
  contact: { email: 'hello@example.com', whatsapp: '', phone: '' },
  notifications: { sellerEmail: '', emailCustomer: true, emailOnStatus: true },
  sheet: { url: '', secret: '' },
  footer: {
    explore: [
      { label: 'Shop all', href: '/shop' },
      { label: 'Our story', href: '/pages/our-story' },
    ],
    help: [
      { label: 'Contact', href: 'mailto:hello@example.com' },
      { label: 'Shipping & returns', href: '/pages/shipping-returns' },
    ],
    follow: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Pinterest', href: 'https://pinterest.com' },
    ],
  },
  pages: [
    {
      slug: 'our-story',
      eyebrow: 'Our story',
      title: 'Skincare, simplified.',
      body: 'aquaform started with a simple idea: skin feels its best when it is well hydrated.\n\nWe make a small number of gentle, effective formulas — and nothing you don’t need.',
    },
    {
      slug: 'shipping-returns',
      eyebrow: 'Help',
      title: 'Shipping & returns',
      body: 'Orders ship within 1–2 business days. Shipping is free on orders over $60.\n\nNot in love? Return any product within 30 days for a full refund.',
    },
  ],
}

const now = '2024-06-01T00:00:00.000Z'

function demo(p: Partial<Product> & Pick<Product, 'id' | 'slug' | 'name' | 'type' | 'category' | 'price'>): Product {
  return {
    compareAtPrice: null,
    description: '',
    details: [],
    images: [],
    options: [],
    badge: '',
    inStock: true,
    stock: null,
    featured: false,
    rating: 4.9,
    reviewCount: 0,
    sortOrder: 0,
    createdAt: now,
    ...p,
  }
}

export const demoProducts: Product[] = [
  demo({
    id: 'demo-aqua-veil-serum', slug: 'aqua-veil-serum', name: 'Aqua Veil Serum', type: 'Hydrating serum', category: 'Hydrate',
    price: 4200, compareAtPrice: 4800, badge: 'Bestseller', featured: true, reviewCount: 128, sortOrder: 1,
    description: 'A weightless veil of hydration for skin that feels plump, calm, and impossibly soft. Made with marine algae and three molecular weights of hyaluronic acid.',
    details: [
      { title: 'Why you’ll love it', body: 'Instantly quenches thirsty skin without stickiness. A clean, cool finish that layers beautifully.' },
      { title: 'Ingredients', body: 'Marine algae, hyaluronic acid, panthenol, and a touch of calm.' },
    ],
    options: [{ name: 'Size', values: ['30 ml', '50 ml'] }],
  }),
  demo({
    id: 'demo-cloud-cream', slug: 'cloud-cream', name: 'Cloud Cream', type: 'Barrier moisturizer', category: 'Hydrate',
    price: 3600, badge: 'New', featured: true, reviewCount: 86, sortOrder: 2,
    description: 'A whipped, cloud-soft moisturizer that seals in hydration and supports a calm, healthy skin barrier.',
    details: [
      { title: 'Why you’ll love it', body: 'Rich comfort without heaviness. Skin stays soft from morning to night.' },
      { title: 'Ingredients', body: 'Ceramides, squalane, oat extract, and shea butter.' },
    ],
    options: [{ name: 'Size', values: ['50 ml', '100 ml'] }],
  }),
  demo({
    id: 'demo-dew-drop-oil', slug: 'dew-drop-oil', name: 'Dew Drop Oil', type: 'Face oil', category: 'Glow',
    price: 4800, featured: true, reviewCount: 64, sortOrder: 3,
    description: 'A silky, fast-absorbing face oil for a soft, dewy glow that never feels greasy.',
    details: [
      { title: 'Why you’ll love it', body: 'Melts in instantly and leaves a healthy, lit-from-within finish.' },
      { title: 'Ingredients', body: 'Jojoba, rosehip, and vitamin E.' },
    ],
    options: [{ name: 'Size', values: ['15 ml', '30 ml'] }],
  }),
  demo({
    id: 'demo-soft-focus-spf', slug: 'soft-focus-spf', name: 'Soft Focus SPF', type: 'Daily sunscreen', category: 'Protect',
    price: 3200, featured: true, reviewCount: 142, sortOrder: 4,
    description: 'Weightless daily protection with a soft-focus finish. No white cast, no fuss.',
    details: [
      { title: 'Why you’ll love it', body: 'Wears beautifully under makeup or on its own.' },
      { title: 'Ingredients', body: 'Broad-spectrum filters, niacinamide, and green tea.' },
    ],
    options: [{ name: 'Size', values: ['50 ml'] }],
  }),
  demo({
    id: 'demo-mist-toner', slug: 'mist-toner', name: 'Mist Toner', type: 'Hydrating mist', category: 'Hydrate',
    price: 2400, reviewCount: 51, sortOrder: 5,
    description: 'A fine, cooling mist that refreshes and preps skin for everything that follows.',
    options: [{ name: 'Size', values: ['100 ml', '200 ml'] }],
  }),
  demo({
    id: 'demo-calm-cleanser', slug: 'calm-cleanser', name: 'Calm Cleanser', type: 'Gel cleanser', category: 'Protect',
    price: 2600, reviewCount: 73, sortOrder: 6,
    description: 'A gentle gel cleanser that removes the day without stripping your skin.',
    options: [{ name: 'Size', values: ['150 ml'] }],
  }),
]
