'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PlatformDetailPage from '@/components/pages/protected/platforms/detail/platform-detail-page'

const Page: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <PlatformDetailPage platformId={id} />
}

export default Page
