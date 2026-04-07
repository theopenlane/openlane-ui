import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import ReviewPage from '@/components/pages/protected/reviews/table/page'

export const metadata: Metadata = {
  title: 'Reviews',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Reviews" />
      <ReviewPage />
    </>
  )
}

export default Page
