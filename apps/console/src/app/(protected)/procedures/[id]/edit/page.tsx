'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import EditProcedurePage from '@/components/pages/protected/procedures/edit-procedure-page.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canEdit } from '@/lib/authz/utils.ts'
import { useAccountRoles } from '@/lib/query-hooks/permissions'

const Page: NextPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: permission, isLoading } = useAccountRoles(ObjectEnum.PROCEDURE, id)

  return (
    <>
      {!isLoading && !canEdit(permission?.roles) && <ProtectedArea />}
      {!isLoading && canEdit(permission?.roles) && (
        <>
          <PageHeading heading="Edit procedure" />
          <EditProcedurePage procedureId={id as string} />
        </>
      )}
    </>
  )
}

export default Page
