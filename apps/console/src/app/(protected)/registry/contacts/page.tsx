import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import ContactPage from '@/components/pages/protected/contacts/table/page'

export const metadata: Metadata = {
  title: 'Contacts',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Contacts" />
      <ContactPage />
    </>
  )
}

export default Page
