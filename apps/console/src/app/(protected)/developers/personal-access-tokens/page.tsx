import type { Metadata } from 'next/types'
import DevelopersPage from '@/components/pages/protected/developers/developers-user-page'

export const metadata: Metadata = {
  title: 'Developers | Personal Access Tokens',
}

const Page: React.FC = () => {
  return <DevelopersPage />
}

export default Page
