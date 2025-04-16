'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import EditPolicyPage from '@/components/pages/protected/policies/edit-policy-page.tsx'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'

const Page: NextPage = () => {
  const { id } = useParams()

  return (
    <>
      <PageHeading heading="Edit policy" />
      <EditPolicyPage policyId={id as string} />
    </>
  )
}

export default Page
