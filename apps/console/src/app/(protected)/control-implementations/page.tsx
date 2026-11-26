import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import ControlImplementationsPage from '@/components/pages/protected/control-implementations/table/page'

export const metadata: Metadata = {
  title: 'Control Implementations',
}

const Page: React.FC = () => (
  <>
    <PageHeading heading="Control Implementations" />
    <ControlImplementationsPage />
  </>
)

export default Page
