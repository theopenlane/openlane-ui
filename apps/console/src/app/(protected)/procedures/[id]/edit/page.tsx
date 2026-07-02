'use client'

import { type NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import EditProcedurePage from '@/components/pages/protected/procedures/edit-procedure-page.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useSession } from 'next-auth/react'

const Page: NextPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: permission, isLoading } = useAccountRoles(ObjectTypes.PROCEDURE, id)

  const { data: session } = useSession()
  const canViewPage = canEdit(permission?.roles, session)

  return (
    <>
      {!isLoading && !canViewPage && <ProtectedArea />}
      {!isLoading && canViewPage && (
        <>
          <PageHeading heading="Edit procedure" />
          <EditProcedurePage procedureId={id as string} />
        </>
      )}
    </>
  )
}

export default Page
