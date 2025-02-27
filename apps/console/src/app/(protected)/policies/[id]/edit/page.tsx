'use client'

import { NextPage } from 'next'
import { PolicyEditPage } from '@/components/pages/protected/policies/policy-edit-page'

type PageProps = {
  params: { id: string }
}

export const Page: NextPage<PageProps> = ({ params }) => {
  return <PolicyEditPage policyId={params.id} />
}

export default Page
