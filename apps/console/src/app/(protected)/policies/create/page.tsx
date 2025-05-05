'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreatePolicyForm from '@/components/pages/protected/policies/create/form/create-policy-form.tsx'
import { useSession } from 'next-auth/react'
import { useUserCanCreatePolicy } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'

const Page: React.FC = () => {
  const { data: session } = useSession()
  const { data: canCreatePolicy, isLoading } = useUserCanCreatePolicy(session)

  return (
    <>
      {!isLoading && !canCreatePolicy && <ProtectedArea />}
      {!isLoading && canCreatePolicy && (
        <>
          <PageHeading heading="Create a new policy" />
          <CreatePolicyForm />
        </>
      )}
    </>
  )
}

export default Page
