import React from 'react'
import { type Metadata } from 'next'
import { AddSubprocessorsFromVendorsPage } from '@/components/pages/protected/trust-center/subprocessors/from-vendors/add-subprocessors-from-vendors-page'

export const metadata: Metadata = {
  title: 'Add Subprocessors From Vendors | Trust Center',
}

const Page: React.FC = () => <AddSubprocessorsFromVendorsPage />

export default Page
