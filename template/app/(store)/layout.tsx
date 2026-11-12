import { getSettings } from '@/lib/data'
import { StoreProvider } from '@/components/store/store-provider'
import { Header, Footer } from '@/components/store/chrome'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return (
    <StoreProvider settings={settings}>
      <main>
        <Header />
        {children}
        <Footer />
      </main>
    </StoreProvider>
  )
}
