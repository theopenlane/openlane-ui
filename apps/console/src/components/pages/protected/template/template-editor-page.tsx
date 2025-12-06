'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { canEdit } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const TemplateEditor = dynamic(() => import('@/components/pages/protected/template/template-editor'), {
  ssr: false,
})

const TemplateEditorPage: React.FC = () => {
  const searchParams = useSearchParams()
  const existingId = searchParams.get('id') as string
  const templateId = searchParams.get('template_id') as string
  const { data: permission, isLoading } = useOrganizationRoles()
  const editAllowed = canEdit(permission?.roles)

  return (
    <>
      {!isLoading && !editAllowed && <ProtectedArea />}
      {!isLoading && editAllowed && (
        <>
          <PageHeading eyebrow="Templates" heading="Editor" />
          <TemplateEditor templateId={templateId} existingId={existingId} />
        </>
      )}
    </>
  )
}

export default TemplateEditorPage
