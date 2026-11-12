import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { getSettings, hasDatabase } from '@/lib/data'
import { StoreProvider } from '@/components/store/store-provider'
import { AdminShell } from '@/components/admin/shell'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login')
  const settings = await getSettings()
  return (
    <StoreProvider settings={settings}>
      <AdminShell storeName={settings.name}>
        {!hasDatabase && (
          <div className="admin-note">
            <b>Demo mode — no database connected.</b> Changes are kept only until the server restarts. Connect Neon in Vercel
            (Storage → Create → Neon) so <code>DATABASE_URL</code> is set, then redeploy.
          </div>
        )}
        {children}
      </AdminShell>
    </StoreProvider>
  )
}
