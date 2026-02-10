'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import EditPolicyPage from '@/components/pages/protected/policies/edit-policy-page.tsx'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const Page: NextPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: permission, isLoading } = useAccountRoles(ObjectTypes.INTERNAL_POLICY, id)

  return (
    <>
      {!isLoading && !canEdit(permission?.roles) && <ProtectedArea />}
      {!isLoading && canEdit(permission?.roles) && (
        <>
          <PageHeading heading="Edit policy" />
          <EditPolicyPage policyId={id} />
        </>
      )}
    </>
  )
}

export default Page
