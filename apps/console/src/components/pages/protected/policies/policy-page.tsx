import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicySidebar } from '@/components/pages/protected/policies/policy-sidebar'
import dynamic from 'next/dynamic'
import { TElement } from '@udecode/plate-common'
import { useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation, useDeleteInternalPolicyMutation, useGetUserProfileQuery } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { DocumentDescriptions } from '@/components/shared/document-descriptions/document-descriptions'

import type { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })

export type EditableField = 'name' | 'description' | 'background' | 'purposeAndScope'

export const UpdateInternalPolicyValidator = z.object({
  name: z.string(),
  background: z.string(),
  description: z.string(),
  policyType: z.string(),
  purposeAndScope: z.string(),
  details: z.nullable(
    z.object({
      content: z.array(z.object({ id: z.string(), type: z.string(), children: z.array(z.object({ text: z.string() })) })),
    }),
  ),
})

type PolicyPageProps = {
  policyId: string
}

export function PolicyPage({ policyId }: PolicyPageProps) {
  const router = useRouter()

  const [, updatePolicy] = useUpdateInternalPolicyMutation()
  const [{ data }] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: policyId } })
  const [{ data: deleteData }] = useDeleteInternalPolicyMutation()
  const [document, setDocument] = useState([] as TElement[])
  const [policy, setPolicy] = useState({} as InternalPolicyByIdFragment)

  useEffect(() => {
    if (!data?.internalPolicy) return
    setPolicy(data.internalPolicy)
    setDocument(data.internalPolicy.details?.content || [])
  }, [data])

  const setField = (field: EditableField, value: string) => {
    setPolicy({ ...policy, [field]: value })
  }

  const saveCurrentPolicy = () => {
    const { id: updateInternalPolicyId, name, background, description, policyType, purposeAndScope, details } = policy

    const input = {
      name,
      background,
      description,
      policyType,
      purposeAndScope,
      details: {
        ...details,
        content: document,
      },
    }

    // check that we're valid
    UpdateInternalPolicyValidator.parse(input)

    updatePolicy({ updateInternalPolicyId, input })

    // TODO: handle error reporting
  }

  const handleDelete = () => {
    // TODO: wire this up to a delete button and api call with confirmation dialog
  }

  const onNameChange = useCallback(
    (name: string) => {
      setPolicy({ ...policy, name })
    },
    [policy],
  )

  const onDocumentChange = useCallback((content: TElement[]) => {
    console.log('onDocumentChange', content)
    // TODO: wire this up with change support.
    // setPolicy({ ...policy, details: { content } })
    // FIXME: this will cause your tab to crash
    // setDocument(content)
  }, [])

  const descriptions = useMemo(() => {
    return [
      { label: 'Purpose and Scope', value: policy.purposeAndScope },
      { label: 'Description', value: policy.description },
      { label: 'Background', value: policy.background },
    ]
  }, [policy])

  if (!data?.internalPolicy) return <></>

  const policyName = policy.displayID ? `${policy.displayID} - ${policy.name}` : policy.name

  return (
    <>
      <PageHeading className="grow" eyebrow="Policies & Procedures" heading={policyName} />

      <div className="flex flex-row gap-5">
        <div className="grow">
          <DocumentDescriptions descriptions={descriptions} />
          <PlateEditor content={document} onChange={onDocumentChange} />
        </div>

        <div className="shrink-0 basis-96">
          <PolicySidebar policy={policy} />
        </div>
      </div>
    </>
  )
}
