'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import EditPolicy from '@/components/pages/protected/policies/edit-policy.tsx'

export const Page: NextPage = () => {
  const { id } = useParams()
  return <EditPolicy policyId={id as string} />
}

export default Page
