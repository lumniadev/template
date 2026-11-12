# Store Template

A ready-to-launch online store for sellers who **confirm orders by phone** and take payment on delivery. Products, prices, photos, colors and text are all managed from `/admin`, with no coding.

**For customers**
- Home, shop (search, filters, sort), product pages with options (size, color, weight…)
- Bag with promo codes, simple checkout (no account needed)
- "Order received" email and an order tracking page

**For the shop owner**
- Every order arrives as **Pending**. Call the customer, then mark it **Confirmed**, **No answer** or **Cancelled**, and later **Shipped** and **Delivered**.
- **Google Sheet sync both ways:** orders appear in your sheet, and changing the Status there updates the store, and the other way round.
- **Emails:** a new-order alert for you, and automatic updates for the customer on each status change.
- **Stock counts:** go down with each order, come back on cancel, and show "Only 3 left" or "Sold out".
- Dashboard with orders to call, orders to ship, confirmed sales and low stock
- Newsletter subscribers with CSV export
- Every piece of store text, menus, pages, shipping and promo codes

Built with Next.js, hosted on **Vercel**, data in **Neon** (PostgreSQL). All of these have free plans.

---

## Launch your store

### 1. Put the code on GitHub
Create a new repository on [github.com](https://github.com) and upload this folder.

### 2. Import it into Vercel
On [vercel.com](https://vercel.com), click **Add New → Project** and pick your repository.

### 3. Add the database (Neon)
In your Vercel project, open **Storage → Create Database → Neon** and connect it. This sets `DATABASE_URL`.
The store creates its tables and demo products on the first visit.

### 4. Set your admin password
Under **Settings → Environment Variables**, add `ADMIN_PASSWORD`.

### 5. Deploy
Click **Deploy**. Then open `your-site.vercel.app/admin`, log in, and:
1. Open **Store settings** to set your name, colors, currency, phone and texts.
2. Open **Products** to delete the demo products and add yours.

---

## Order emails (Resend)

1. Create a free account at [resend.com](https://resend.com).
2. Under **Domains**, add your store's domain and add the DNS records it shows you. This lets emails come from `orders@yourstore.com`.
3. Under **API Keys**, create a key.
4. In Vercel, add these environment variables, then redeploy:
   - `RESEND_API_KEY` = your key
   - `EMAIL_FROM` = `Your Store <orders@yourstore.com>`
5. In **Admin → Store settings → Emails**, set where new-order alerts go and click **Send a test email**.

> Before you verify a domain, Resend only delivers to your own Resend account email. That's fine for testing.

---

## Google Sheet sync

1. Create a new Google Sheet and open **Extensions → Apps Script**.
2. Delete what's there and paste everything from [`google-sheet/orders-sync.gs`](google-sheet/orders-sync.gs).
3. Open **Admin → Store settings → Google Sheet** in your store. Copy **STORE_URL** and **SECRET** into the top of the script.
4. In Apps Script, choose the **setup** function, click **Run** and allow access. This creates the "Orders" tab and the Status dropdown.
5. Click **Deploy → New deployment → Web app**, with *Execute as: Me* and *Who has access: Anyone*. Copy the web app link.
6. Paste the link in **Admin → Store settings → Google Sheet**, click **Save settings**, then **Test & send all orders to the sheet**.

From then on:
- New orders appear at the top of the sheet as **Pending**.
- Change the **Status** dropdown after calling, and the store updates and emails the customer if that's turned on.
- Change the status in the admin, and the sheet row updates and changes color.

> If you edit the script later, use **Deploy → Manage deployments → Edit → New version** so the link stays the same.

---

## Order statuses

| Status | Meaning | Customer email |
|---|---|---|
| Pending | New order, not called yet | "We received your order" |
| Confirmed | Customer confirmed by phone | "Your order is confirmed" |
| No answer | Called, no answer | "We tried to call you" (includes your store phone) |
| Shipped | On its way | "Your order is on its way" |
| Delivered | Received by the customer | "Your order was delivered" |
| Cancelled | Cancelled, and stock is returned | "Your order was cancelled" |

---

## Make it fit what you sell

Products can have any options. The product page shows them as buttons, and the shop adds a filter for each one. The editor has quick-add buttons for clothing sizes, shoe sizes, colors, volume, weight, cake sizes and material.

---

## Optional extras

- **Photo uploads:** Vercel → **Storage → Create → Blob**, connected to the project. Without it, add photos by pasting image links.
- **Your own domain:** Vercel → **Settings → Domains**.
- **WhatsApp button after checkout:** Admin → Store settings → Checkout & orders.

---

## Run it on your computer

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The admin is at `/admin`, and the password is `admin` locally unless you set `ADMIN_PASSWORD`.
Without `DATABASE_URL`, it runs in **demo mode** and changes reset when the server restarts. Copy `.env.example` to `.env.local` to connect your services.

---

## For developers

| Path | What it is |
|---|---|
| `app/(store)/` | Storefront pages and checkout actions |
| `app/admin/` | Admin panel (password protected) |
| `app/api/sheet/` | Receives status changes from the Google Sheet |
| `app/api/upload/` | Image uploads to Vercel Blob |
| `components/store/`, `components/admin/` | UI |
| `lib/data.ts` | All database reads and writes |
| `lib/order-events.ts` | What happens after an order is placed or changes status (emails, sheet, stock) |
| `lib/email.ts`, `lib/sheet.ts` | Email templates and sheet sync |
| `lib/defaults.ts` | Default settings and demo products |
| `google-sheet/orders-sync.gs` | The Apps Script for the sheet |

Prices are stored in cents (`4200` = 42.00). Tables are created automatically: `store_settings`, `products`, `orders`, `subscribers`.
