import type { Metadata } from 'next'
import { AccountView } from '@/components/store/account-view'

export const metadata: Metadata = { title: 'My orders', robots: { index: false } }

export default function AccountPage() {
  return <AccountView />
}
