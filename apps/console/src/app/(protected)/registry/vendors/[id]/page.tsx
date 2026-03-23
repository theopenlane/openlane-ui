'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import VendorDetailPage from '@/components/pages/protected/vendors/detail/vendor-detail-page'

const Page: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return <VendorDetailPage vendorId={id} />
}

export default Page
