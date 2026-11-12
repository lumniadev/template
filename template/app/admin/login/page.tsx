import { redirect } from 'next/navigation'
import { adminPassword, isAdmin } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin')
  const s = await getSettings()
  const configured = Boolean(adminPassword())
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand"><span className="brand-mark">{s.name.charAt(0).toLowerCase()}</span><span>{s.name}</span></div>
        <h1>Store admin</h1>
        {configured ? (
          <>
            <p>Enter your admin password to manage products, orders and settings.</p>
            <LoginForm />
            {!process.env.ADMIN_PASSWORD && <p className="admin-note" style={{ marginTop: 16 }}>Local preview: the password is <code>admin</code>. Set <code>ADMIN_PASSWORD</code> before going live.</p>}
          </>
        ) : (
          <p className="admin-note">Admin is locked. Add an <code>ADMIN_PASSWORD</code> environment variable in Vercel (Settings → Environment Variables), then redeploy.</p>
        )}
      </div>
    </div>
  )
}
