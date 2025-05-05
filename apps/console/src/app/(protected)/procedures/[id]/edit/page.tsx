'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import EditProcedurePage from '@/components/pages/protected/procedures/edit-procedure-page.tsx'
import { useSession } from 'next-auth/react'
import { useUserCanEditProcedure } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'

const Page: NextPage = () => {
  const { id } = useParams()
  const { data: session } = useSession()
  const { data: canEditProcedure, isLoading } = useUserCanEditProcedure(session)

  return (
    <>
      {!isLoading && !canEditProcedure && <ProtectedArea />}
      {!isLoading && canEditProcedure && (
        <>
          <PageHeading heading="Edit procedure" />
          <EditProcedurePage procedureId={id as string} />
        </>
      )}
    </>
  )
}

export default Page
