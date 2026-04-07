import React from 'react'
import { type Metadata } from 'next'
import VendorDetailPage from '@/components/pages/protected/vendors/detail/vendor-detail-page'

export const metadata: Metadata = {
  title: 'Vendor Details',
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <VendorDetailPage vendorId={id} />
}

export default Page
