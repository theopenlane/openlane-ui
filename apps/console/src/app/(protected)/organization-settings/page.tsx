import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'

export const metadata: Metadata = {
  title: 'Organization Settings',
}

const Page: React.FC = () => <PageHeading heading="Organization settings" />

export default Page
