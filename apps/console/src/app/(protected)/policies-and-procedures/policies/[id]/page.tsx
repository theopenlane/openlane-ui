'use client'

import { NextPage } from 'next'
import { PolicyPage } from '@/components/pages/protected/policies/policy-page'

type PageProps = {
  params: { id: string }
}

export const Page: NextPage<PageProps> = ({ params }) => {
  return <PolicyPage policyId={params.id} />
}

export default Page
