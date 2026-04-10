import React from 'react'
import { type Metadata } from 'next'
import PersonnelDetailPage from '@/components/pages/protected/personnel/detail/personnel-detail-page'

export const metadata: Metadata = {
  title: 'Personnel Details',
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <PersonnelDetailPage personnelId={id} />
}

export default Page
