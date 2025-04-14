'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import EditPolicyPage from '@/components/pages/protected/policies/edit-policy-page.tsx'

const Page: NextPage = () => {
  const { id } = useParams()
  return <EditPolicyPage policyId={id as string} />
}

export default Page
