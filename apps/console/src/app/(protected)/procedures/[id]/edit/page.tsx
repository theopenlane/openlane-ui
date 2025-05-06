'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import EditProcedurePage from '@/components/pages/protected/procedures/edit-procedure-page.tsx'
import { useSession } from 'next-auth/react'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canEdit } from '@/lib/authz/utils.ts'

const Page: NextPage = () => {
  const { id } = useParams()
  const { data: session } = useSession()
  const { data: permission, isLoading } = useAccountRole(session, ObjectEnum.PROCEDURE, id! as string)

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
