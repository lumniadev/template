// Shared types for the store. Prices are always stored in cents (4200 = $42.00).

export type ProductOption = { name: string; values: string[] }
export type ProductDetail = { title: string; body: string }

export type Product = {
  id: string
  slug: string
  name: string
  /** Short line shown above the name, e.g. "Hydrating serum" */
  type: string
  category: string
  price: number
  compareAtPrice: number | null
  description: string
  /** Accordion sections on the product page */
  details: ProductDetail[]
  /** Image URLs. When empty, the built-in bottle illustration is shown. */
  images: string[]
  /** e.g. [{ name: "Size", values: ["30 ml", "50 ml"] }] */
  options: ProductOption[]
  badge: string
  inStock: boolean
  /** Units left. null = not tracked (unlimited). */
  stock: number | null
  featured: boolean
  rating: number
  reviewCount: number
  sortOrder: number
  createdAt: string
}

export type NavLink = { label: string; href: string }
export type InfoPage = { slug: string; eyebrow: string; title: string; body: string }
export type PromoCode = { code: string; percent: number }
export type OrderMethod = 'whatsapp' | 'email' | 'none'

export type StoreSettings = {
  name: string
  tagline: string
  footerNote: string
  description: string
  currency: string
  locale: string
  colors: { main: string; text: string }
  navLinks: NavLink[]
  hero: { eyebrow: string; titleLine1: string; titleLine2: string; text: string; button: string; note: string; image: string }
  trust: { title: string; text: string }[]
  categoriesSection: { eyebrow: string; title: string }
  categoryCards: { label: string; title: string; category: string }[]
  bestSellers: { eyebrow: string; title: string }
  newsletter: { eyebrow: string; line1: string; line2: string; text: string }
  shop: { eyebrow: string; title: string; text: string }
  productPage: { stockText: string; shippingTitle: string; shippingText: string; alsoEyebrow: string; alsoTitle: string }
  cart: { secureNote: string }
  confirmation: { title: string; text: string }
  shipping: { freeOver: number; fee: number; minDays: number; maxDays: number }
  promoCodes: PromoCode[]
  orders: { prefix: string; method: OrderMethod; requirePhone: boolean }
  contact: { email: string; whatsapp: string; phone: string }
  /** Order emails (sent with Resend when RESEND_API_KEY is set). */
  notifications: { sellerEmail: string; emailCustomer: boolean; emailOnStatus: boolean }
  /** Google Sheet sync (via the Apps Script in /google-sheet). */
  sheet: { url: string; secret: string }
  footer: { explore: NavLink[]; help: NavLink[]; follow: NavLink[] }
  pages: InfoPage[]
}

export type OrderItem = {
  productId: string
  name: string
  type: string
  image: string
  options: Record<string, string>
  price: number
  qty: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'no_answer' | 'shipped' | 'delivered' | 'cancelled'

export type Customer = { name: string; email: string; phone: string; address: string; city: string; notes: string }

export type Order = {
  id: string
  number: string
  customer: Customer
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  promoCode: string
  status: OrderStatus
  createdAt: string
}

export type Subscriber = { email: string; createdAt: string }
