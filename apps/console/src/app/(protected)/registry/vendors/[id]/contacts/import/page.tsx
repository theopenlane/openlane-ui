import React from 'react'
import { type Metadata } from 'next'
import VendorContactsImportPage from '@/components/pages/protected/vendors/detail/tabs/contacts/vendor-contacts-import-page'

export const metadata: Metadata = {
  title: 'Import Vendor Contacts',
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <VendorContactsImportPage vendorId={id} />
}

export default Page
