import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'

export const metadata: Metadata = {
  title: 'User Settings',
}

const Page: React.FC = () => <PageHeading heading="User settings" />

export default Page
