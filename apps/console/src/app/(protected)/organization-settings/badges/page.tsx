import React from 'react'
import { type Metadata } from 'next'
import BadgesPage from '@/components/pages/protected/organization-settings/badges/badges-page'

export const metadata: Metadata = {
  title: 'Badges',
}

const Page: React.FC = () => <BadgesPage />

export default Page
