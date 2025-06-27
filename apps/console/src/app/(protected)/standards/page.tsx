import React from 'react'
import StandardsPage from '@/components/pages/protected/standards/standards-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Standards',
}

const Page = () => {
  return <StandardsPage></StandardsPage>
}

export default Page
