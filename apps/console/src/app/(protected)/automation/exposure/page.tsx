import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exposure',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Exposure" />
      <div className="flex items-center justify-center py-20 text-muted-foreground">Coming soon</div>
    </>
  )
}

export default Page
