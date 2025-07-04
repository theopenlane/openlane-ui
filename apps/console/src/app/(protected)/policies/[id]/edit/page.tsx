'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import EditPolicyPage from '@/components/pages/protected/policies/edit-policy-page.tsx'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import { useSession } from 'next-auth/react'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canEdit } from '@/lib/authz/utils.ts'

const Page: NextPage = () => {
  const { id } = useParams()
  const { data: session } = useSession()
  const { data: permission, isLoading } = useAccountRole(session, ObjectEnum.POLICY, id! as string)

  return (
    <>
      {!isLoading && !canEdit(permission?.roles) && <ProtectedArea />}
      {!isLoading && canEdit(permission?.roles) && (
        <>
          <PageHeading heading="Edit policy" />
          <EditPolicyPage policyId={id as string} />
        </>
      )}
    </>
  )
}

export default Page
