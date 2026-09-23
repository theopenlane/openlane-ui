import React from 'react'
import { type Metadata } from 'next'
import SubscriberImportPage from '@/components/pages/protected/organization-settings/subscribers/import/subscriber-import-page'

export const metadata: Metadata = {
  title: 'Import Subscribers',
}

const Page: React.FC = () => <SubscriberImportPage />

export default Page
