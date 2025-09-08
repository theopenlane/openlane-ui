import React from 'react'
import { Metadata } from 'next'
import RequiredSubscription from '@/components/pages/protected/subscription/RequiredSubscription.tsx'
export const metadata: Metadata = {
  title: 'Subscription | Required Subscription',
}

const Page: React.FC = () => {
  return (
    <>
      <RequiredSubscription />
    </>
  )
}

export default Page
