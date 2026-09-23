import React from 'react'
import { type Metadata } from 'next'
import ContactImportPage from '@/components/pages/protected/contacts/import/contact-import-page'

export const metadata: Metadata = {
  title: 'Import Contacts',
}

const Page: React.FC = () => <ContactImportPage />

export default Page
