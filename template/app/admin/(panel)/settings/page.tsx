import { randomBytes } from 'crypto'
import { getSettings, saveSettings } from '@/lib/data'
import { emailEnabled } from '@/lib/email'
import { siteUrl } from '@/lib/site'
import { SettingsForm } from '@/components/admin/settings-form'

export default async function SettingsPage() {
  const settings = await getSettings()
  // Every store gets its own secret for the Google Sheet link.
  if (!settings.sheet.secret) {
    settings.sheet.secret = randomBytes(18).toString('base64url')
    await saveSettings(settings)
  }
  return <SettingsForm settings={settings} emailEnabled={emailEnabled} siteUrl={await siteUrl()} />
}
