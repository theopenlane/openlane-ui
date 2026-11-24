import React from 'react'
import { type Metadata } from 'next'
import ControlImplementationDetailPage from '@/components/pages/protected/control-implementations/detail/control-implementation-detail-page'

export const metadata: Metadata = {
  title: 'Control Implementation',
}

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <ControlImplementationDetailPage key={id} controlImplementationId={id} />
}

export default Page
