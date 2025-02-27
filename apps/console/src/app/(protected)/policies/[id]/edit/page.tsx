'use client'

import { NextPage } from 'next'
import { PolicyEditPage } from '@/components/pages/protected/policies/policy-edit-page'
import { useParams } from 'next/navigation'

export const Page: NextPage = () => {
  const { id } = useParams()
  return <PolicyEditPage policyId={id as string} />
}

export default Page
