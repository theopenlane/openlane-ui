'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import EditPolicyPage from '@/components/pages/protected/policies/edit-policy-page.tsx'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import { useSession } from 'next-auth/react'
import { useUserCanEditPolicy } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'

const Page: NextPage = () => {
  const { id } = useParams()
  const { data: session } = useSession()
  const { data: canEditPolicy, isLoading } = useUserCanEditPolicy(session)

  return (
    <>
      {!isLoading && !canEditPolicy && <ProtectedArea />}
      {!isLoading && canEditPolicy && (
        <>
          <PageHeading heading="Edit policy" />
          <EditPolicyPage policyId={id as string} />
        </>
      )}
    </>
  )
}

export default Page
