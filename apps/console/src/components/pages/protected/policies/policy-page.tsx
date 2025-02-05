import React, { useState, useCallback, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyInfoBar } from '@/components/pages/protected/policies/policy-info-bar'
import { PolicySidebar } from '@/components/pages/protected/policies/policy-sidebar'
import dynamic from 'next/dynamic'
import { TElement } from '@udecode/plate-common'
import { useGetInternalPolicyDetailsByIdQuery, useUpdateInternalPolicyMutation, useDeleteInternalPolicyMutation } from '@repo/codegen/src/schema'
import type { InternalPolicyByIdFragment, InternalPolicyUpdateFieldsFragment } from '@repo/codegen/src/schema'
const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })
import { z } from 'zod'

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
  const [, updatePolicy] = useUpdateInternalPolicyMutation()
  const [{ data }] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: policyId } })
  const [{ data: deleteData }] = useDeleteInternalPolicyMutation()
  const [policy, setPolicy] = useState({} as InternalPolicyUpdateFieldsFragment)

  useEffect(() => {
    if (!data?.internalPolicy) return
    setPolicy(data.internalPolicy)
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
      details,
    }

    // check that we're valid
    UpdateInternalPolicyValidator.parse(input)

    updatePolicy({ updateInternalPolicyId, input })

    // TODO: handle error reporting
  }

  const handleDelete = () => {
    // TODO: wire this up to a delete button and api call with confirmation dialog
  }

  const onNameChange = useCallback((name: string) => {
    setPolicy({ ...policy, name })
  }, [])

  const onDocumentChange = useCallback((content: TElement[]) => {
    setPolicy({ ...policy, details: { content } })
  }, [])

  if (!data?.internalPolicy) return <></>

  return (
    <>
      <PageHeading className="grow" eyebrow="Policies & Procedures" heading={policy.name} editable onChange={onNameChange} />

      <PolicyInfoBar policy={policy} handleSave={saveCurrentPolicy} />

      <div className="flex flex-col md:flex-row-reverse gap-5 w-full">
        <PolicySidebar policy={policy} onFieldChange={setField} />

        <div className="w-full">
          <div>
            <PlateEditor content={data.internalPolicy.details?.content} />
          </div>
        </div>
      </div>
    </>
  )
}
