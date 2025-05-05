'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreateProcedureForm from '@/components/pages/protected/procedures/create/form/create-procedure-form.tsx'
import { useSession } from 'next-auth/react'
import { useUserCanCreateProcedure } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'

const Page: React.FC = () => {
  const { data: session } = useSession()
  const { data: canCreateProcedure, isLoading } = useUserCanCreateProcedure(session)

  return (
    <>
      {!isLoading && !canCreateProcedure && <ProtectedArea />}
      {!isLoading && canCreateProcedure && (
        <>
          <PageHeading heading="Create a new procedure" />
          <CreateProcedureForm />
        </>
      )}
    </>
  )
}

export default Page
