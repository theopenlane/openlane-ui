import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ReviewPage from '@/components/pages/protected/reviews/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Reviews" />
      <ReviewPage />
    </>
  )
}

export default Page
