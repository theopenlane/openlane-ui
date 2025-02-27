'use client'

import { NextPage } from 'next'
import { PolicyPage } from '@/components/pages/protected/policies/policy-page'
import { useParams } from 'next/navigation'

export const Page: NextPage = () => {
  const { id } = useParams()
  return <PolicyPage policyId={id as string} />
}

export default Page
