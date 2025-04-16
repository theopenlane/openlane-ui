'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import ViewPolicyPage from '@/components/pages/protected/policies/view/view-policy-page.tsx'

const Page: NextPage = () => {
  const { id } = useParams()
  return <ViewPolicyPage policyId={id as string} />
}

export default Page
